import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '4mb',
        },
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

        const { imageBase64, metadata, userId, isAvatar, captchaToken, fileExtension } = req.body;

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

        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
        
        if (!base64Data || base64Data.length === 0) {
            throw new Error('Ảnh tải lên bị rỗng. Vui lòng thử lại.');
        }

        let finalOptimizedUrl = '';

        try {
            const ext = fileExtension === 'jpg' ? 'jpg' : 'webp';
            const safeHash = crypto.randomBytes(6).toString('hex');
            const fileName = `img_${Date.now()}_${safeHash}.${ext}`;

            console.log(`[DEBUG] Đang Upload lên CF ImgBed: ${fileName}`);

            const buffer = Buffer.from(base64Data, 'base64');
            const blob = new Blob([buffer], { type: `image/${ext}` });

            const formData = new FormData();
            formData.append('file', blob, fileName);

            // GỌI API CLOUDFLARE IMGBED
            const uploadResponse = await fetch('https://vnba-imgbed.pages.dev/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.CF_IMGBED_TOKEN}`
                },
                body: formData
            });

            const uploadResult = await uploadResponse.json();

            if (uploadResult && uploadResult.length > 0 && uploadResult[0].src) {
                let rawSrc = uploadResult[0].src;

                // NẾU TRẢ VỀ ĐƯỜNG DẪN TƯƠNG ĐỐI -> ÉP CHUẨN DOMAIN IMGBED VÀO
                if (rawSrc.startsWith('/')) {
                    finalOptimizedUrl = `https://cdn.vnbusarchive.io.vn${rawSrc}`;
                } else {
                    finalOptimizedUrl = rawSrc;
                }

                console.log(`[DEBUG] CF ImgBed Upload thành công: ${finalOptimizedUrl}`);
            } else {
                console.error('Lỗi từ CF ImgBed:', uploadResult);
                throw new Error('Lỗi phản hồi từ máy chủ lưu trữ ảnh.');
            }

        } catch (uploadError) {
            console.error('===[CF IMGBED UPLOAD LỖI] ===', uploadError);
            throw new Error('Lỗi khi tải ảnh lên máy chủ CF ImgBed.');
        }

        if (isAvatar) {
            // Lấy avatar cũ từ DB
            const { data: oldProfile } = await supabase
                .from('profiles')
                .select('avatar_url')
                .eq('id', userId)
                .single();

            // Xóa avatar cũ trên ImgBed nếu có
            if (oldProfile && oldProfile.avatar_url && oldProfile.avatar_url.includes('vnbusarchive')) {
                try {
                    const oldUrlObj = new URL(oldProfile.avatar_url);
                    const oldFileName = encodeURIComponent(oldUrlObj.pathname.split('/').pop());
                    
                    await fetch(`https://cdn.vnbusarchive.io.vn/api/manage/delete/${oldFileName}`, {
                        method: 'GET',
                        headers: { 'Authorization': `Bearer ${process.env.CF_IMGBED_TOKEN}` }
                    });
                    console.log(`[DEBUG] Đã xóa avatar cũ: ${oldFileName}`);
                } catch (delErr) {
                    console.error('[WARN] Không thể xóa avatar cũ:', delErr.message);
                }
            }

            // Cập nhật URL mới vào DB
            const { error: profileErr } = await supabase
                .from('profiles')
                .update({ avatar_url: finalOptimizedUrl })
                .eq('id', userId);

            if (profileErr) throw profileErr;
            return res.status(200).json({ success: true, url: finalOptimizedUrl });
        }

        const { error: vError } = await supabase
            .from('vehicles')
            .upsert({
                license_plate: metadata.plate,
                model: metadata.model
            }, { onConflict: 'license_plate' });

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
            })
            .select()
            .single();

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
