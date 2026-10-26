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
        const { orderCode } = body;

        if (!orderCode) {
            return new Response(JSON.stringify({ success: false, error: 'Thiếu orderCode' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const sb = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);
        const sbAdmin = env.SUPABASE_SERVICE_ROLE_KEY ? createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY) : sb;

        const codeNum = Number(orderCode);

        // 1. Safety check with payOS: Did the user ALREADY transfer the money right before clicking cancel?
        if (env.PAYOS_CLIENT_ID && env.PAYOS_API_KEY) {
            try {
                const payosRes = await fetch(`https://api-merchant.payos.vn/v2/payment-requests/${codeNum}`, {
                    headers: {
                        'x-client-id': env.PAYOS_CLIENT_ID,
                        'x-api-key': env.PAYOS_API_KEY
                    }
                });
                if (payosRes.ok) {
                    const payosJson = await payosRes.json();
                    if (payosJson.data && payosJson.data.status === 'PAID') {
                        // User ALREADY paid! DO NOT CANCEL OR DELETE!
                        await sbAdmin
                            .from('donations')
                            .update({ status: 'PAID', updated_at: new Date().toISOString() })
                            .eq('order_code', codeNum);

                        return new Response(JSON.stringify({ success: true, paid: true }), {
                            status: 200,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }
                }
            } catch (pErr) {
                console.warn('payOS check before cancel failed:', pErr);
            }
        }

        // 2. If definitely not paid, cancel link on payOS
        if (env.PAYOS_CLIENT_ID && env.PAYOS_API_KEY) {
            try {
                await fetch(`https://api-merchant.payos.vn/v2/payment-requests/${codeNum}/cancel`, {
                    method: 'POST',
                    headers: {
                        'x-client-id': env.PAYOS_CLIENT_ID,
                        'x-api-key': env.PAYOS_API_KEY,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ cancellationReason: 'Người dùng đổi ý' })
                });
            } catch (pErr) {
                console.warn('payOS cancel request failed:', pErr);
            }
        }

        // 3. Permanently clean up cancelled uncompleted order so it does not linger in pending list
        await sbAdmin
            .from('donations')
            .delete()
            .eq('order_code', codeNum)
            .neq('status', 'PAID');

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        console.error('Error in donate/cancel:', err);
        return new Response(JSON.stringify({ success: false, error: 'Lỗi máy chủ' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
