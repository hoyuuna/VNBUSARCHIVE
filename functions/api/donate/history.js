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
            .select('id, order_code, amount, message, status, is_anonymous, payos_payment_link_id, created_at')
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
        const toDeleteIds = [];

        for (const item of (history || [])) {
            if (item.status === 'PAID') {
                validList.push(item);
                continue;
            }

            // For PENDING orders: verify viability and payOS status
            if (item.status === 'PENDING') {
                let payosData = null;
                let isDead = false;

                if (env.PAYOS_CLIENT_ID && env.PAYOS_API_KEY) {
                    try {
                        const payosRes = await fetch(`https://api-merchant.payos.vn/v2/payment-requests/${item.order_code}`, {
                            headers: {
                                'x-client-id': env.PAYOS_CLIENT_ID,
                                'x-api-key': env.PAYOS_API_KEY
                            }
                        });

                        if (payosRes.ok) {
                            const pJson = await payosRes.json();
                            payosData = pJson.data || null;

                            if (payosData && payosData.status === 'PAID') {
                                // User paid! Upgrade to PAID
                                item.status = 'PAID';
                                await sbAdmin
                                    .from('donations')
                                    .update({ status: 'PAID', updated_at: new Date().toISOString() })
                                    .eq('id', item.id);
                                validList.push(item);
                                continue;
                            } else if (payosData && (payosData.status === 'CANCELLED' || payosData.status === 'EXPIRED')) {
                                // Explicitly cancelled or expired on payOS -> Delete to clean up
                                isDead = true;
                            }
                        } else if (payosRes.status === 404) {
                            isDead = true;
                        }
                    } catch (pErr) {
                        console.warn(`Failed to verify pending order ${item.order_code} on payOS:`, pErr);
                    }
                }

                // Check QR availability in meta
                let meta = {};
                if (item.payos_payment_link_id) {
                    try {
                        if (item.payos_payment_link_id.startsWith('{')) {
                            meta = JSON.parse(item.payos_payment_link_id);
                        }
                    } catch (e) {}
                }

                // If payOS says dead OR order has no QR code (cannot be resumed/paid anymore)
                if (isDead || (!meta.qrCode && !payosData?.qrCode)) {
                    toDeleteIds.push(item.id);
                    continue;
                }

                validList.push(item);
            }
        }

        // Clean up dead/unviable pending orders from DB
        if (toDeleteIds.length > 0) {
            sbAdmin
                .from('donations')
                .delete()
                .in('id', toDeleteIds)
                .neq('status', 'PAID')
                .then(() => {})
                .catch(() => {});
        }

        // Also purge any lingering cancelled or expired rows in database
        sbAdmin
            .from('donations')
            .delete()
            .in('status', ['CANCELLED', 'EXPIRED'])
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
