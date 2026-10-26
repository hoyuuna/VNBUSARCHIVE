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

        const sb = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);
        const sbAdmin = env.SUPABASE_SERVICE_ROLE_KEY ? createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY) : sb;

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

        // If guest (no user_id), always remain anonymous
        let finalAnonymous = true;
        if (donation.user_id) {
            // For logged-in user, can toggle
            finalAnonymous = !!is_anonymous;
        }

        await sbAdmin
            .from('donations')
            .update({
                is_anonymous: finalAnonymous,
                updated_at: new Date().toISOString()
            })
            .eq('order_code', Number(orderCode));

        return new Response(JSON.stringify({
            success: true,
            is_anonymous: finalAnonymous
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        console.error('Error in donate/toggle-anonymous:', err);
        return new Response(JSON.stringify({ success: false, error: 'Lỗi cập nhật' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
