import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import formidable from 'formidable';
import { promises as fs } from 'fs';

// Hàm loại bỏ ký tự Null (\u0000 hoặc \x00) và chuẩn hóa Unicode tránh lỗi DB
const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str
        .normalize('NFC')
        .replace(/\u0000/g, '')
        .replace(/\x00/g, '');
};

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

        const metadata = {
            plate: sanitizeString(getField(fields.meta_plate)),
            operator: sanitizeString(getField(fields.meta_operator)),
            type: getField(fields.meta_type),
            route: sanitizeString(getField(fields.meta_route)),
            model: sanitizeString(getField(fields.meta_model)),
            location: sanitizeString(getField(fields.meta_location)),
            note: sanitizeString(getField(fields.meta_note)),
            taken_at: getField(fields.meta_taken_at),
            username: sanitizeString(getField(fields.meta_username)),
            camera_model: sanitizeString(getField(fields.meta_camera_model)),
            exif_params: sanitizeString(getField(fields.meta_exif_params))
        };

        const file = Array.isArray(files.file) ? files.file[0] : files.file;

        if (!file) {
            return res.status(400).json({ success: false, error: 'Ảnh tải lên bị rỗng. Vui lòng thử lại.' });
        }

        // Bước 1: Xử lý Captcha đầu tiên để loại bỏ rác/spam sớm nhất
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

        // Bước 2: Đọc file KHÔNG BLOCKING event loop của Node.js
        const safeHash = crypto.randomBytes(6).toString('hex');
        const fileName = `img_${Date.now()}_${safeHash}.${fileExtension}`;
        const fileBuffer = await fs.readFile(file.filepath);
        const blob = new Blob([fileBuffer], { type: `image/${fileExtension}` });
        const formData = new FormData();
        formData.append('file', blob, fileName);

        let finalOptimizedUrl = '';

        // TỐI ƯU HÓA: Chạy 2 Promise SONG SONG
        console.log(`[DEBUG] Tiến hành tải ảnh và đồng bộ DB: ${fileName}`);

        const uploadTask = fetch('https://cdn.vnbusarchive.io.vn/upload', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${process.env.CF_IMGBED_TOKEN}` },
            body: formData
        }).then(res => res.json()).then(uploadResult => {
            if (uploadResult && uploadResult.length > 0 && uploadResult[0].src) {
                let rawSrc = uploadResult[0].src;
                return rawSrc.startsWith('/') ? `https://cdn.vnbusarchive.io.vn${rawSrc}` : rawSrc;
            }
            throw new Error('Lỗi phản hồi từ máy chủ lưu trữ ảnh.');
        });

        // TẠO TASK THÊM XE MỚI (CHỈ THÊM, KHÔNG CẬP NHẬT)
        let vehicleInsertTask = Promise.resolve();
        if (!isAvatar) {
            vehicleInsertTask = supabase
                .from('vehicles')
                .insert({ license_plate: metadata.plate, model: metadata.model })
                .then(({ error }) => {
                    // Nếu lỗi là 23505 (Trùng lặp khóa/Xe đã tồn tại), ta BỎ QUA lỗi này để tiến trình chạy tiếp
                    if (error && error.code !== '23505') throw error;
                });
        }

        try {
            // Đợi cả mạng Upload và mạng Database phản hồi xong
            [finalOptimizedUrl] = await Promise.all([uploadTask, vehicleInsertTask]);
            console.log(`[DEBUG] Xong đa tiến trình, URL: ${finalOptimizedUrl}`);
        } catch (err) {
            console.error('===[LỖI UPLOAD HOẶC DATABASE] ===', err);
            throw new Error('Đã xảy ra lỗi trong quá trình gửi dữ liệu lên máy chủ.');
        }

        // Xử lý Logic Avatar
        if (isAvatar) {
            const { data: oldProfile } = await supabase.from('profiles').select('avatar_url').eq('id', userId).single();
            if (oldProfile && oldProfile.avatar_url && oldProfile.avatar_url.includes('vnbusarchive')) {
                try {
                    const oldUrlObj = new URL(oldProfile.avatar_url);
                    const oldFileName = encodeURIComponent(oldUrlObj.pathname.split('/').pop());
                    fetch(`https://cdn.vnbusarchive.io.vn/api/manage/delete/${oldFileName}`, {
                        method: 'GET',
                        headers: { 'Authorization': `Bearer ${process.env.CF_IMGBED_TOKEN}` }
                    }).catch(() => {});
                } catch (delErr) {}
            }

            const { error: profileErr } = await supabase.from('profiles').update({ avatar_url: finalOptimizedUrl }).eq('id', userId);
            if (profileErr) throw profileErr;
            return res.status(200).json({ success: true, url: finalOptimizedUrl });
        }

        // Xử lý chèn Database Ảnh (Chỉ chạy sau khi ảnh đã được tải lên và task tạo xe mới hoàn tất)
        const { error: dbError } = await supabase
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
            });

        if (dbError) throw dbError;

        return res.status(200).json({ success: true, url: finalOptimizedUrl });

    } catch (error) {
        console.error('[System Error Handler]:', error.message);
        return res.status(500).json({ success: false, error: error.message || 'Lỗi hệ thống không xác định.' });
    }
}
