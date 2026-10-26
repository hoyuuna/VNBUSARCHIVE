import { createClient } from '@supabase/supabase-js';

export async function onRequestGet(context) {
    const { request, env } = context;

    try {
        const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ success: false, error: 'Chưa đăng nhập' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const token = authHeader.replace(/^Bearer\s+/i, '').trim();
        const sb = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);
        const { data: { user }, error: authErr } = await sb.auth.getUser(token);

        if (authErr || !user) {
            return new Response(JSON.stringify({ success: false, error: 'Token không hợp lệ' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const sbAdmin = env.SUPABASE_SERVICE_ROLE_KEY ? createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY) : sb;

        const { data: history, error: dbErr } = await sbAdmin
            .from('donations')
            .select('id, order_code, amount, message, status, is_anonymous, created_at')
            .eq('user_id', user.id)
            .in('status', ['PAID', 'PENDING'])
            .order('created_at', { ascending: false });

        if (dbErr) {
            console.error('Error fetching donation history:', dbErr);
            return new Response(JSON.stringify({ success: false, error: 'Không thể lấy lịch sử ủng hộ' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const validList = [];

        for (const item of (history || [])) {
            // If an order is still marked PENDING, proactively check with payOS to catch any delayed webhooks or closed tabs
            if (item.status === 'PENDING' && env.PAYOS_CLIENT_ID && env.PAYOS_API_KEY) {
                try {
                    const payosRes = await fetch(`https://api-merchant.payos.vn/v2/payment-requests/${item.order_code}`, {
                        headers: {
                            'x-client-id': env.PAYOS_CLIENT_ID,
                            'x-api-key': env.PAYOS_API_KEY
                        }
                    });
                    if (payosRes.ok) {
                        const payosJson = await payosRes.json();
                        if (payosJson.data && payosJson.data.status === 'PAID') {
                            // User paid! Update record to PAID immediately so user sees it right away
                            item.status = 'PAID';
                            await sbAdmin
                                .from('donations')
                                .update({ status: 'PAID', updated_at: new Date().toISOString() })
                                .eq('id', item.id);
                        } else if (payosJson.data && (payosJson.data.status === 'CANCELLED' || payosJson.data.status === 'EXPIRED')) {
                            // Mark cancelled/expired
                            item.status = payosJson.data.status;
                            await sbAdmin
                                .from('donations')
                                .update({ status: payosJson.data.status, updated_at: new Date().toISOString() })
                                .eq('id', item.id)
                                .neq('status', 'PAID');
                            continue; // Skip expired/cancelled from active list
                        }
                    }
                } catch (pErr) {
                    console.warn(`Failed to verify pending order ${item.order_code} via payOS in history:`, pErr);
                }
            }

            if (item.status === 'PAID' || item.status === 'PENDING') {
                validList.push(item);
            }
        }

        // Safe cleanup: only remove confirmed cancelled/expired donations older than 48 hours to preserve audit records
        const safeCleanupCutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
        sbAdmin
            .from('donations')
            .delete()
            .in('status', ['CANCELLED', 'EXPIRED'])
            .lt('created_at', safeCleanupCutoff)
            .then(() => {})
            .catch(() => {});

        return new Response(JSON.stringify({
            success: true,
            data: validList
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
        });

    } catch (err) {
        console.error('Error in donate/history:', err);
        return new Response(JSON.stringify({ success: false, error: 'Lỗi máy chủ' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
