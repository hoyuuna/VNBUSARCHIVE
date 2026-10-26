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

export async function onRequestPost(context) {
    const { request, env } = context;

    if (!validateOriginAndReferer(request)) {
        return new Response(JSON.stringify({ success: false, error: 'Forbidden' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const body = await request.json().catch(() => ({}));
        const { orderCode, is_anonymous } = body;

        if (!orderCode) {
            return new Response(JSON.stringify({ success: false, error: 'Thiếu orderCode' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
        const token = authHeader ? authHeader.replace(/^Bearer\s+/i, '').trim() : null;

        const sb = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);
        const sbAdmin = env.SUPABASE_SERVICE_ROLE_KEY ? createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY) : sb;

        let user = null;
        if (token) {
            const { data: userData } = await sb.auth.getUser(token);
            user = userData?.user || null;
        }

        // Fetch donation to verify existence and ownership
        const { data: donation, error: dErr } = await sbAdmin
            .from('donations')
            .select('id, user_id, is_anonymous')
            .eq('order_code', Number(orderCode))
            .maybeSingle();

        if (dErr || !donation) {
            return new Response(JSON.stringify({ success: false, error: 'Không tìm thấy thông tin ủng hộ' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // If donation belongs to a user, verify authentication
        if (donation.user_id) {
            if (!user || user.id !== donation.user_id) {
                return new Response(JSON.stringify({ success: false, error: 'Bạn không có quyền chỉnh sửa khoản ủng hộ này' }), {
                    status: 403,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        const finalAnonymous = !!is_anonymous;

        // Choose appropriate client for update
        const clientToUpdate = env.SUPABASE_SERVICE_ROLE_KEY 
            ? sbAdmin 
            : (token ? createClient(env.SUPABASE_URL, env.SUPABASE_KEY, { global: { headers: { Authorization: `Bearer ${token}` } } }) : sb);

        const { error: upErr } = await clientToUpdate
            .from('donations')
            .update({
                is_anonymous: finalAnonymous,
                updated_at: new Date().toISOString()
            })
            .eq('order_code', Number(orderCode));

        if (upErr) {
            console.error('Error updating donation anonymity:', upErr);
            return new Response(JSON.stringify({ success: false, error: 'Lỗi cập nhật cơ sở dữ liệu: ' + upErr.message }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({
            success: true,
            is_anonymous: finalAnonymous
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        console.error('Error in donate/toggle-anonymous:', err);
        return new Response(JSON.stringify({ success: false, error: 'Lỗi máy chủ' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
