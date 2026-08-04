import { createClient } from '@supabase/supabase-js';

export async function onRequest(context) {
    const { request, env } = context;
    if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ success: false, error: 'Chưa xác thực.' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }

        const supabase = createClient(
            env.SUPABASE_URL, 
            env.SUPABASE_KEY,
            { global: { headers: { Authorization: authHeader } } }
        );
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error('Token không hợp lệ.');

        const body = await request.json();
        const { imageUrl, photoId } = body;
        if (!imageUrl && !photoId) return new Response(JSON.stringify({ success: false, error: 'Thiếu URL hoặc ID ảnh.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

        // [BẢO MẬT - IDOR DEFENSE] Kiểm tra quyền sở hữu ảnh trước khi xóa
        if (!env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
        const supabaseAdmin = createClient(
            env.SUPABASE_URL,
            env.SUPABASE_SERVICE_ROLE_KEY
        );
        const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
        const isManager = profile && profile.role === 'manager';

        if (!isManager) {
            // 1. Kiểm tra trong bảng photos
            let photoOwner = null;
            if (photoId) {
                const { data: photo } = await supabaseAdmin.from('photos').select('uploader_id').eq('id', photoId).maybeSingle();
                if (photo) photoOwner = photo.uploader_id;
            }
            if (!photoOwner && imageUrl) {
                const { data: photo } = await supabaseAdmin.from('photos').select('uploader_id').eq('url', imageUrl).maybeSingle();
                if (photo) photoOwner = photo.uploader_id;
            }
            if (photoOwner) {
                if (photoOwner !== user.id) {
                    return new Response(JSON.stringify({ success: false, error: 'Bạn không có quyền xóa ảnh này.' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
                }
            } else if (imageUrl) {
                // 2. Nếu không thuộc bảng photos, kiểm tra xem có phải avatar của user khác trong profiles không
                const { data: avatarOwner } = await supabaseAdmin.from('profiles').select('id').eq('avatar_url', imageUrl).maybeSingle();
                if (avatarOwner && avatarOwner.id !== user.id) {
                    return new Response(JSON.stringify({ success: false, error: 'Bạn không có quyền xóa ảnh này.' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
                }
            }
        }

        // Hệ thống Sandbox đã khai tử: ảnh luôn nằm trên CDN (url https).
        // Nếu chỉ có photoId mà không có imageUrl, lấy url từ DB.
        let targetUrl = imageUrl;
        if ((!targetUrl || targetUrl.startsWith('sandbox:') || targetUrl.startsWith('data:')) && photoId) {
            const { data: photoRow } = await supabaseAdmin.from('photos').select('url').eq('id', photoId).maybeSingle();
            if (photoRow && photoRow.url && (photoRow.url.startsWith('http://') || photoRow.url.startsWith('https://'))) {
                targetUrl = photoRow.url;
            }
        }

        // Ảnh cũ dạng sandbox:/data: không còn base64 -> không thể xóa trên CDN, chỉ xóa row DB (nếu có photoId)
        if (!targetUrl || targetUrl.startsWith('sandbox:') || targetUrl.startsWith('data:')) {
            if (photoId) {
                await supabaseAdmin.from('photos').delete().eq('id', photoId);
            }
            return new Response(JSON.stringify({ success: true, message: 'Ảnh dữ liệu cũ đã được xóa khỏi cơ sở dữ liệu.' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        const urlObj = new URL(targetUrl);
        const fileName = urlObj.pathname.split('/').pop();
        const safeFileName = encodeURIComponent(fileName);

        console.log(`[DEBUG] Đang gọi API CF ImgBed để xóa: ${safeFileName}`);

        const deleteUrl = `https://cdn.vnbusarchive.io.vn/api/manage/delete/${safeFileName}`;
        
        const deleteResponse = await fetch(deleteUrl, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${env.CF_IMGBED_TOKEN}`
            }
        });

        const deleteResult = await deleteResponse.json();

        if (deleteResponse.ok && deleteResult) {
            console.log(`[DEBUG] Đã xóa vĩnh viễn ảnh: ${fileName}`);
            if (photoId) {
                await supabaseAdmin.from('photos').delete().eq('id', photoId).catch(() => {});
            }
            return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        } else {
            console.log(`[WARN] Lỗi xóa ảnh CF ImgBed:`, deleteResult);
            return new Response(JSON.stringify({ success: true, message: 'File có thể đã bị xóa trước đó.' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

    } catch (error) {
        console.error('[Delete Image Error]:', error.message);
        return new Response(JSON.stringify({ success: false, error: 'Lỗi hệ thống máy chủ.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}
