import { createClient } from '@supabase/supabase-js';
import ImageKit from 'imagekit';

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '4mb',
        },
    },
};

const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

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

        const { imageBase64, metadata, userId, isAvatar, captchaToken } = req.body;

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

        const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
        
        if (!base64Data || base64Data.length === 0) {
            throw new Error('Ảnh tải lên bị rỗng. Vui lòng thử lại.');
        }

        let finalOptimizedUrl = '';

        try {
            const folder = isAvatar ? '/avatars' : '/vehicles';
            const fileName = `img_${Date.now()}_${Math.round(Math.random() * 1e4)}.webp`;

            console.log(`[DEBUG] Đang Upload lên ImageKit... (${folder})`);

            const uploadResponse = await imagekit.upload({
                file: base64Data,
                fileName: fileName,
                folder: folder,
                useUniqueFileName: true,
            });

            finalOptimizedUrl = imagekit.url({
                src: uploadResponse.url
            });

            console.log(`[DEBUG] ImageKit Upload thành công: ${finalOptimizedUrl}`);

        } catch (imageKitError) {
            console.error('===[IMAGEKIT UPLOAD LỖI] ===', imageKitError);
            throw new Error('Lỗi khi tải ảnh lên máy chủ ImageKit.');
        }

        if (isAvatar) {
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
                        title: `📥 ẢNH MỚI CHỜ DUYỆT (ImageKit WebP)`,
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