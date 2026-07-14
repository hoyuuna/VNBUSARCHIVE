import { createClient } from '@supabase/supabase-js';

const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str
        .normalize('NFC')
        .replace(/\u0000/g, '')
        .replace(/\x00/g, '');
};

export async function onRequest(context) {
    const { request, env } = context;
    if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ success: false, error: 'Chưa xác thực. Thiếu Token đăng nhập.' }), { status: 401, headers: { 'Content-Type': 'application/json' }});
        }

        const supabase = createClient(
            env.SUPABASE_URL,
            env.SUPABASE_KEY,
            { global: { headers: { Authorization: authHeader } } }
        );

        const formData = await request.formData();
        
        const isAvatar = formData.get('isAvatar') === 'true';
        const userId = formData.get('userId');
        const captchaToken = formData.get('captchaToken');
        
        const ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic'];
        const rawExt = String(formData.get('fileExtension') || 'jpg').toLowerCase();
        const fileExtension = ALLOWED_EXT.includes(rawExt) ? rawExt : 'jpg';

        const metadata = {
            plate: sanitizeString(formData.get('meta_plate')),
            operator: sanitizeString(formData.get('meta_operator')),
            type: formData.get('meta_type'),
            route: sanitizeString(formData.get('meta_route')),
            model: sanitizeString(formData.get('meta_model')),
            location: sanitizeString(formData.get('meta_location')),
            province: sanitizeString(formData.get('meta_province')),
            note: sanitizeString(formData.get('meta_note')),
            taken_at: formData.get('meta_taken_at'),
            username: sanitizeString(formData.get('meta_username')),
            camera_model: sanitizeString(formData.get('meta_camera_model')),
            exif_params: sanitizeString(formData.get('meta_exif_params')),
            suspected_exif_fraud: formData.get('meta_suspected_exif_fraud') === 'true'
        };

        const file = formData.get('file');

        if (!file || typeof file === 'string') {
            return new Response(JSON.stringify({ success: false, error: 'Ảnh tải lên bị rỗng. Vui lòng thử lại.' }), { status: 400, headers: { 'Content-Type': 'application/json' }});
        }

        const MAX_SIZE = 20 * 1024 * 1024;
        const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (file.size > MAX_SIZE) {
            return new Response(JSON.stringify({ success: false, error: 'File quá lớn (tối đa 20MB).' }), { status: 400, headers: { 'Content-Type': 'application/json' }});
        }
        if (!ALLOWED_MIME.includes(file.type)) {
            return new Response(JSON.stringify({ success: false, error: 'Loại file không hợp lệ (chỉ chấp nhận ảnh).' }), { status: 400, headers: { 'Content-Type': 'application/json' }});
        }

        if (!isAvatar) {
            if (!captchaToken) return new Response(JSON.stringify({ success: false, error: 'Thiếu mã xác thực (Captcha).' }), { status: 400, headers: { 'Content-Type': 'application/json' }});

            const secretKey = env.CAPTCHA_SECRET || env.TURNSTILE_SECRET_KEY;
            if (!secretKey) {
                console.error("Lỗi cấu hình: Thiếu biến môi trường CAPTCHA_SECRET hoặc TURNSTILE_SECRET_KEY");
                return new Response(JSON.stringify({ success: false, error: 'Lỗi cấu hình máy chủ: Thiếu Secret Key của Captcha.' }), { status: 500, headers: { 'Content-Type': 'application/json' }});
            }

            const formData = new URLSearchParams();
            formData.append('secret', secretKey);
            formData.append('response', captchaToken);

            const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData.toString(),
            });

            const verifyData = await verifyRes.json();
            if (!verifyData.success) {
                console.error('Turnstile verification failed:', verifyData['error-codes']);
                return new Response(JSON.stringify({ success: false, error: 'Xác thực Cloudflare Turnstile thất bại!' }), { status: 400, headers: { 'Content-Type': 'application/json' }});
            }
        }

        const randomValues = crypto.getRandomValues(new Uint8Array(6));
        const safeHash = Array.from(randomValues).map(b => b.toString(16).padStart(2, '0')).join('');
        const fileName = `img_${Date.now()}_${safeHash}.${fileExtension}`;
        
        const newFormData = new FormData();
        newFormData.append('file', file, fileName);

        let finalOptimizedUrl = '';

        console.log(`[DEBUG] Tiến hành tải ảnh và đồng bộ DB: ${fileName}`);

        const uploadTask = fetch('https://cdn.vnbusarchive.io.vn/upload', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${env.CF_IMGBED_TOKEN}` },
            body: newFormData
        }).then(res => res.json()).then(uploadResult => {
            if (uploadResult && uploadResult.length > 0 && uploadResult[0].src) {
                let rawSrc = uploadResult[0].src;
                return rawSrc.startsWith('/') ? `https://cdn.vnbusarchive.io.vn${rawSrc}` : rawSrc;
            }
            throw new Error('Lỗi phản hồi từ máy chủ lưu trữ ảnh.');
        });

        let vehicleInsertTask = Promise.resolve();
        if (!isAvatar) {
            vehicleInsertTask = supabase
                .from('vehicles')
                .insert({ license_plate: metadata.plate, model: metadata.model })
                .then(({ error }) => {
                    if (error && error.code !== '23505') throw error;
                });
        }

        try {
            [finalOptimizedUrl] = await Promise.all([uploadTask, vehicleInsertTask]);
            console.log(`[DEBUG] Xong đa tiến trình, URL: ${finalOptimizedUrl}`);
        } catch (err) {
            console.error('===[LỖI UPLOAD HOẶC DATABASE] ===', err);
            throw new Error('Đã xảy ra lỗi trong quá trình gửi dữ liệu lên máy chủ.');
        }

        if (isAvatar) {
            let oldAvatarUrl = null;
            const { data: oldProfile } = await supabase.from('profiles').select('avatar_url').eq('id', userId).single();
            if (oldProfile && oldProfile.avatar_url) {
                oldAvatarUrl = oldProfile.avatar_url;
            } else {
                const { data: { user } } = await supabase.auth.getUser();
                if (user && user.user_metadata && user.user_metadata.avatar_url) {
                    oldAvatarUrl = user.user_metadata.avatar_url;
                }
            }

            if (oldAvatarUrl && oldAvatarUrl !== finalOptimizedUrl && oldAvatarUrl.includes('vnbusarchive')) {
                try {
                    const oldUrlObj = new URL(oldAvatarUrl);
                    const oldFileName = oldUrlObj.pathname.split('/').pop();
                    if (oldFileName) {
                        const safeFileName = encodeURIComponent(oldFileName);
                        console.log(`[DEBUG] Đang xóa avatar cũ khỏi CDN: ${safeFileName}`);
                        await fetch(`https://cdn.vnbusarchive.io.vn/api/manage/delete/${safeFileName}`, {
                            method: 'GET',
                            headers: { 'Authorization': `Bearer ${env.CF_IMGBED_TOKEN}` }
                        }).catch(e => console.warn('[WARN] Lỗi mạng khi xóa avatar cũ:', e));
                    }
                } catch (delErr) {
                    console.warn('[WARN] Lỗi khi xử lý xóa avatar cũ:', delErr);
                }
            }

            const { error: profileErr } = await supabase.from('profiles').update({ avatar_url: finalOptimizedUrl }).eq('id', userId);
            if (profileErr) throw profileErr;

            await supabase.auth.updateUser({ data: { avatar_url: finalOptimizedUrl } }).catch(() => {});

            return new Response(JSON.stringify({ success: true, url: finalOptimizedUrl }), { status: 200, headers: { 'Content-Type': 'application/json' }});
        }

        const { error: dbError } = await supabase
            .from('photos')
            .insert({
                url: finalOptimizedUrl,
                uploader_id: userId,
                license_plate: metadata.plate,
                location: metadata.location,
                province: metadata.province || null,
                note: metadata.note,
                status: 'pending',
                camera_model: metadata.camera_model,
                exif_params: metadata.exif_params,
                taken_at: metadata.taken_at,
                operator: metadata.operator,
                route_no: metadata.route,
                type: metadata.type,
                suspected_exif_fraud: metadata.suspected_exif_fraud
            });

        if (dbError) throw dbError;

        return new Response(JSON.stringify({ success: true, url: finalOptimizedUrl }), { status: 200, headers: { 'Content-Type': 'application/json' }});

    } catch (error) {
        console.error('[System Error Handler]:', error.message);
        return new Response(JSON.stringify({ success: false, error: error.message || 'Lỗi hệ thống không xác định.' }), { status: 500, headers: { 'Content-Type': 'application/json' }});
    }
}
