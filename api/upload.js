import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ success: false, error: 'Chưa xác thực. Thiếu Token đăng nhập.' });
        }

        const supabase = createClient(
            process.env.SUPABASE_URL, 
            process.env.SUPABASE_KEY,
            { global: { headers: { Authorization: authHeader } } }
        );

        const form = formidable({ multiples: false, keepExtensions: true });
        
        const [fields, files] = await new Promise((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) reject(err);
                resolve([fields, files]);
            });
        });

        const getField = (field) => Array.isArray(field) ? field[0] : field;
        
        const isAvatar = getField(fields.isAvatar) === 'true';
        const userId = getField(fields.userId);
        const captchaToken = getField(fields.captchaToken);
        const fileExtension = getField(fields.fileExtension) || 'jpg';
        const metadataString = getField(fields.metadata);
        let metadata = {};
        if (metadataString) {
            try {
                metadata = JSON.parse(metadataString);
            } catch (parseError) {
                try {
                    const sanitized = metadataString
                        .replace(/\\u(?![0-9a-fA-F]{4})/g, '\\\\u')
                        .replace(/\\(?!["\\/bfnrtu])/g, '\\\\');
                    metadata = JSON.parse(sanitized);
                    console.warn('[WARN] metadata cần sanitize:', metadataString);
                } catch (e) {
                    return res.status(400).json({
                        success: false,
                        error: 'Metadata ảnh chứa ký tự không hợp lệ. Vui lòng kiểm tra ghi chú hoặc thông tin ảnh.'
                    });
                }
            }
        }

        const file = Array.isArray(files.file) ? files.file[0] : files.file;

        if (!file) {
            return res.status(400).json({ success: false, error: 'Ảnh tải lên bị rỗng. Vui lòng thử lại.' });
        }

        if (!isAvatar) {
            if (!captchaToken) return res.status(400).json({ success: false, error: 'Thiếu mã xác thực (Captcha).' });

            const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `secret=${process.env.CAPTCHA_SECRET}&response=${captchaToken}`,
            });

            const verifyData = await verifyRes.json();
            if (!verifyData.success) {
                console.error('Turnstile verification failed:', verifyData['error-codes']);
                return res.status(400).json({ success: false, error: 'Xác thực Cloudflare Turnstile thất bại!' });
            }
        }

        let finalOptimizedUrl = '';

        try {
            const safeHash = crypto.randomBytes(6).toString('hex');
            const fileName = `img_${Date.now()}_${safeHash}.${fileExtension}`;

            console.log(`[DEBUG] Đang Upload lên CF ImgBed: ${fileName}`);

            const fileBuffer = fs.readFileSync(file.filepath);
            const blob = new Blob([fileBuffer], { type: `image/${fileExtension}` });

            const formData = new FormData();
            formData.append('file', blob, fileName);

            const uploadResponse = await fetch('https://cdn.vnbusarchive.io.vn/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.CF_IMGBED_TOKEN}`
                },
                body: formData
            });

            const uploadResult = await uploadResponse.json();

            if (uploadResult && uploadResult.length > 0 && uploadResult[0].src) {
                let rawSrc = uploadResult[0].src;
                finalOptimizedUrl = rawSrc.startsWith('/') ? `https://cdn.vnbusarchive.io.vn${rawSrc}` : rawSrc;
                console.log(`[DEBUG] CF ImgBed Upload thành công: ${finalOptimizedUrl}`);
            } else {
                throw new Error('Lỗi phản hồi từ máy chủ lưu trữ ảnh.');
            }

        } catch (uploadError) {
            console.error('===[CF IMGBED UPLOAD LỖI] ===', uploadError);
            throw new Error('Lỗi khi tải ảnh lên máy chủ CF ImgBed.');
        }

        if (isAvatar) {
            const { data: oldProfile } = await supabase.from('profiles').select('avatar_url').eq('id', userId).single();

            if (oldProfile && oldProfile.avatar_url && oldProfile.avatar_url.includes('vnbusarchive')) {
                try {
                    const oldUrlObj = new URL(oldProfile.avatar_url);
                    const oldFileName = encodeURIComponent(oldUrlObj.pathname.split('/').pop());
                    await fetch(`https://cdn.vnbusarchive.io.vn/api/manage/delete/${oldFileName}`, {
                        method: 'GET',
                        headers: { 'Authorization': `Bearer ${process.env.CF_IMGBED_TOKEN}` }
                    });
                } catch (delErr) { /* Bỏ qua lỗi xóa file cũ */ }
            }

            const { error: profileErr } = await supabase.from('profiles').update({ avatar_url: finalOptimizedUrl }).eq('id', userId);
            if (profileErr) throw profileErr;
            return res.status(200).json({ success: true, url: finalOptimizedUrl });
        }

        const { error: vError } = await supabase
            .from('vehicles')
            .upsert({ license_plate: metadata.plate, model: metadata.model }, { onConflict: 'license_plate' });

        if (vError) throw vError;

        const { data: photoData, error: dbError } = await supabase
            .from('photos')
            .insert({
                url: finalOptimizedUrl,
                uploader_id: userId,
                license_plate: metadata.plate,
                location: metadata.location,
                note: metadata.note,
                status: 'pending',
                camera_model: metadata.camera_model,
                exif_params: metadata.exif_params,
                taken_at: metadata.taken_at,
                operator: metadata.operator,
                route_no: metadata.route,
                type: metadata.type
            }).select().single();

        if (dbError) throw dbError;

        if (process.env.DISCORD_PRIVATE_WEBHOOK_URL) {
            fetch(process.env.DISCORD_PRIVATE_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: "VBS Logger",
                    embeds:[{
                        title: `📥 ẢNH MỚI CHỜ DUYỆT (CF ImgBed)`,
                        description: `**BKS:** ${metadata.plate}\n**Máy:** ${metadata.camera_model}\n**Ngày chụp:** ${metadata.taken_at || 'Không rõ'}\n**User:** ${metadata.username}\nID: ${photoData.id}`,
                        thumbnail: { url: finalOptimizedUrl },
                        color: 15158332 
                    }]
                })
            }).catch(e => console.error('Lỗi gửi Discord:', e));
        }

        return res.status(200).json({ success: true, url: finalOptimizedUrl });

    } catch (error) {
        console.error('[System Error Handler]:', error.message);
        return res.status(500).json({ success: false, error: error.message || 'Lỗi hệ thống không xác định.' });
    }
}