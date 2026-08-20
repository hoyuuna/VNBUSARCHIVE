import { createClient } from '@supabase/supabase-js';

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

        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !user) return new Response(JSON.stringify({ success: false, error: 'Phiên đăng nhập không hợp lệ.' }), { status: 401, headers: { 'Content-Type': 'application/json' }});
        const userId = user.id;

        const sbAdmin = env.SUPABASE_SERVICE_ROLE_KEY ? createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY) : supabase;
        
        const { data: profiles } = await sbAdmin.from('profiles').select('role').eq('id', user.id);
        if (!profiles || profiles.length === 0 || !['admin', 'manager'].includes(profiles[0].role)) {
            return new Response(JSON.stringify({ success: false, error: 'Forbidden: Yêu cầu quyền Admin hoặc Manager' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
        }

        const formData = await request.formData();
        const photoId = formData.get('photoId');
        const file = formData.get('file');

        if (!photoId || !file || typeof file === 'string') {
            return new Response(JSON.stringify({ success: false, error: 'Dữ liệu không hợp lệ.' }), { status: 400, headers: { 'Content-Type': 'application/json' }});
        }

        const MAX_SIZE = 20 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            return new Response(JSON.stringify({ success: false, error: 'File quá lớn (tối đa 20MB).' }), { status: 400, headers: { 'Content-Type': 'application/json' }});
        }
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            return new Response(JSON.stringify({ success: false, error: 'Chỉ hỗ trợ JPG, PNG, WEBP.' }), { status: 400, headers: { 'Content-Type': 'application/json' }});
        }
        let ext = 'jpg';
        if (file.type === 'image/png') ext = 'png';
        if (file.type === 'image/webp') ext = 'webp';

        // Get current photo
        const { data: photoData, error: photoErr } = await sbAdmin.from('photos').select('url, license_plate').eq('id', photoId).single();
        if (photoErr || !photoData) {
            return new Response(JSON.stringify({ success: false, error: 'Không tìm thấy ảnh cũ.' }), { status: 404, headers: { 'Content-Type': 'application/json' }});
        }
        const oldUrl = photoData.url;

        // Upload new to CDN
        const randomValues = crypto.getRandomValues(new Uint8Array(6));
        const safeHash = Array.from(randomValues).map(b => b.toString(16).padStart(2, '0')).join('');
        const fileName = `edited_${Date.now()}_${safeHash}.${ext}`;
        
        const newFormData = new FormData();
        newFormData.append('file', file, fileName);

        const uploadResult = await fetch('https://cdn.vnbusarchive.io.vn/upload', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${env.CF_IMGBED_TOKEN}` },
            body: newFormData
        }).then(res => res.json());

        if (!uploadResult || !uploadResult[0] || !uploadResult[0].src) {
            console.error('[CDN UPLOAD ERROR]:', JSON.stringify(uploadResult));
            throw new Error(`Lỗi phản hồi từ máy chủ lưu trữ ảnh: ${JSON.stringify(uploadResult)}`);
        }
        let rawSrc = uploadResult[0].src;
        const finalUrl = rawSrc.startsWith('/') ? `https://cdn.vnbusarchive.io.vn${rawSrc}` : rawSrc;

        // Update photo DB
        const { error: updateErr } = await sbAdmin.from('photos').update({ url: finalUrl }).eq('id', photoId);
        if (updateErr) throw updateErr;

        // Delete old from CDN
        if (oldUrl && oldUrl.includes('vnbusarchive.io.vn')) {
            try {
                const oldUrlObj = new URL(oldUrl);
                const oldFileName = oldUrlObj.pathname.split('/').pop();
                if (oldFileName) {
                    const safeFileName = encodeURIComponent(oldFileName);
                    await fetch(`https://cdn.vnbusarchive.io.vn/api/manage/delete/${safeFileName}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${env.CF_IMGBED_TOKEN}` }
                    }).catch(() => {});
                }
            } catch (e) {
                // Ignore delete errors
            }
        }

        // Log
        await sbAdmin.from('admin_audit_logs').insert({
            admin_id: userId,
            action_type: 'edit_photo_image',
            target_id: photoId,
            details: JSON.stringify({ plate: photoData.license_plate, newUrl: finalUrl })
        });

        return new Response(JSON.stringify({ success: true, url: finalUrl }), { status: 200, headers: { 'Content-Type': 'application/json' }});
    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' }});
    }
}
