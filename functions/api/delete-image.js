import { createClient } from '@supabase/supabase-js';
function validateOriginAndReferer(request) {
    const referer = request.headers.get('referer') || '';
    const origin = request.headers.get('origin') || '';
    const host = request.headers.get('host') || '';
    const isProduction = host.includes('vnbusarchive.io.vn');
    
    if (!isProduction) return true;
    if (!origin && !referer) return false;
    
    function checkDomain(str) {
        if (!str) return false;
        try {
            const u = new URL(str);
            return u.hostname === 'vnbusarchive.io.vn' || u.hostname.endsWith('.vnbusarchive.io.vn');
        } catch (e) {
            return false;
        }
    }
    return checkDomain(origin) || checkDomain(referer);
}


export async function onRequest(context) {
    const { request, env } = context;
    if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ success: false, error: 'Chua xac thuc.' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }

        const supabase = createClient(
            env.SUPABASE_URL, 
            env.SUPABASE_KEY,
            { global: { headers: { Authorization: authHeader } } }
        );
        const token = authHeader.replace(/^Bearer\s+/i, '').trim();
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) throw new Error('Token khong hop le.');

        const body = await request.json();
        const { imageUrl, photoId } = body;
        if (!imageUrl && !photoId) return new Response(JSON.stringify({ success: false, error: 'Thieu URL hoac ID anh.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

        // [BAO MAT - IDOR DEFENSE] Kiem tra quyen so huu anh truoc khi xoa
        if (!env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
        const supabaseAdmin = createClient(
            env.SUPABASE_URL,
            env.SUPABASE_SERVICE_ROLE_KEY
        );
        const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
        const isManager = profile && profile.role === 'manager';

        if (!isManager) {
            // 1. Kiem tra trong bang photos
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
                    return new Response(JSON.stringify({ success: false, error: 'Ban khong co quyen xoa anh nay.' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
                }
            } else if (imageUrl) {
                // 2. Neu khong thuoc bang photos, kiem tra xem co phai avatar cua user khac trong profiles khong
                const { data: avatarOwner } = await supabaseAdmin.from('profiles').select('id').eq('avatar_url', imageUrl).maybeSingle();
                if (avatarOwner && avatarOwner.id !== user.id) {
                    return new Response(JSON.stringify({ success: false, error: 'Ban khong co quyen xoa anh nay.' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
                }
                if (!avatarOwner) {
                    return new Response(JSON.stringify({ success: false, error: 'File khong hop le hoac ban khong co quyen xoa file nay.' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
                }
            }
        }

        // He thong Sandbox da khai tu: anh luon nam tren CDN (url https).
        // Neu chi co photoId ma khong co imageUrl, lay url tu DB.
        let targetUrl = imageUrl;
        if ((!targetUrl || targetUrl.startsWith('sandbox:') || targetUrl.startsWith('data:')) && photoId) {
            const { data: photoRow } = await supabaseAdmin.from('photos').select('url').eq('id', photoId).maybeSingle();
            if (photoRow && photoRow.url && (photoRow.url.startsWith('http://') || photoRow.url.startsWith('https://'))) {
                targetUrl = photoRow.url;
            }
        }

        // Anh cu dang sandbox:/data: khong con base64 -> khong the xoa tren CDN, chi xoa row DB (neu co photoId)
        if (!targetUrl || targetUrl.startsWith('sandbox:') || targetUrl.startsWith('data:')) {
            if (photoId) {
                await supabaseAdmin.from('photos').delete().eq('id', photoId);
            }
            return new Response(JSON.stringify({ success: true, message: 'Anh du lieu cu da duoc xoa khoi co so du lieu.' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        const urlObj = new URL(targetUrl);
        const fileName = urlObj.pathname.split('/').pop();
        const safeFileName = encodeURIComponent(fileName);

        console.log(`[DEBUG] Dang goi API CF ImgBed de xoa: ${safeFileName}`);

        const deleteUrl = `https://cdn.vnbusarchive.io.vn/api/manage/delete/${safeFileName}`;
        
        const deleteResponse = await fetch(deleteUrl, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${env.CF_IMGBED_TOKEN}`
            }
        });

        let deleteResult = null;
        try { deleteResult = await deleteResponse.json(); } catch(e) {}

        if (deleteResponse.ok && deleteResult) {
            console.log(`[DEBUG] Da xoa vinh vien anh tren CDN: ${fileName}`);
        } else {
            // CDN xoa that bai - file co the da bi xoa truoc hoac khong ton tai
            console.log(`[WARN] Loi xoa anh CF ImgBed (${deleteResponse.status}):`, deleteResult);
        }

        // Du CDN xoa thanh cong hay khong, van xoa row DB de tranh anh "ma" trong DB
        if (photoId) {
            await supabaseAdmin.from('photos').delete().eq('id', photoId).catch((e) => console.warn('[WARN] Loi xoa DB row:', e));
        }

        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error('[Delete Image Error]:', error.message);
        return new Response(JSON.stringify({ success: false, error: 'Loi he thong may chu.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}
