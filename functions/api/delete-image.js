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
        const { imageUrl } = body;
        if (!imageUrl) return new Response(JSON.stringify({ success: false, error: 'Thiếu URL ảnh.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

        const urlObj = new URL(imageUrl);
        const fileName = urlObj.pathname.split('/').pop();
        const safeFileName = encodeURIComponent(fileName);

        console.log(`[DEBUG] Đang gọi API CF ImgBed để xóa: ${safeFileName}`);

        const deleteUrl = `https://cdn.vnbusarchive.io.vn/api/manage/delete/${safeFileName}`;
        
        const deleteResponse = await fetch(deleteUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${env.CF_IMGBED_TOKEN}`
            }
        });

        const deleteResult = await deleteResponse.json();

        if (deleteResponse.ok && deleteResult) {
            console.log(`[DEBUG] Đã xóa vĩnh viễn ảnh: ${fileName}`);
            return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        } else {
            console.log(`[WARN] Lỗi xóa ảnh CF ImgBed:`, deleteResult);
            return new Response(JSON.stringify({ success: true, message: 'File có thể đã bị xóa trước đó.' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

    } catch (error) {
        console.error('[Delete Image Error]:', error.message);
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}
