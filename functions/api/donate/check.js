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

export async function onRequestGet(context) {
    const { request, env } = context;

    if (!validateOriginAndReferer(request)) {
        return new Response(JSON.stringify({ success: false, error: 'Forbidden' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const url = new URL(request.url);
        const orderCodeStr = url.searchParams.get('orderCode');
        if (!orderCodeStr) {
            return new Response(JSON.stringify({ success: false, error: 'Thiếu orderCode' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const orderCode = Number(orderCodeStr);
        if (isNaN(orderCode)) {
            return new Response(JSON.stringify({ success: false, error: 'orderCode không hợp lệ' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const sb = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);
        const sbAdmin = env.SUPABASE_SERVICE_ROLE_KEY ? createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY) : sb;

        const { data: donation, error: dbErr } = await sbAdmin
            .from('donations')
            .select('order_code, status, amount, is_anonymous, donor_name, user_id, created_at')
            .eq('order_code', orderCode)
            .maybeSingle();

        if (dbErr || !donation) {
            return new Response(JSON.stringify({ success: false, error: 'Không tìm thấy thông tin ủng hộ' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        let payosData = null;

        // If status is PENDING and payOS credentials exist, verify with payOS directly
        if (donation.status === 'PENDING' && env.PAYOS_CLIENT_ID && env.PAYOS_API_KEY) {
            try {
                const payosRes = await fetch(`https://api-merchant.payos.vn/v2/payment-requests/${orderCode}`, {
                    method: 'GET',
                    headers: {
                        'x-client-id': env.PAYOS_CLIENT_ID,
                        'x-api-key': env.PAYOS_API_KEY
                    }
                });

                if (payosRes.ok) {
                    const payosJson = await payosRes.json();
                    if ((payosJson.code === '00' || payosJson.code === 0) && payosJson.data) {
                        payosData = payosJson.data;
                        if (payosData.status === 'PAID') {
                            await sbAdmin
                                .from('donations')
                                .update({ status: 'PAID', updated_at: new Date().toISOString() })
                                .eq('order_code', orderCode);
                            donation.status = 'PAID';
                        } else if (payosData.status === 'CANCELLED' || payosData.status === 'EXPIRED') {
                            await sbAdmin
                                .from('donations')
                                .update({ status: 'CANCELLED', updated_at: new Date().toISOString() })
                                .eq('order_code', orderCode);
                            donation.status = 'CANCELLED';
                        }
                    }
                }
            } catch (pErr) {
                console.error('Error fetching payOS status directly:', pErr);
            }
        }

        return new Response(JSON.stringify({
            success: true,
            orderCode: donation.order_code,
            status: donation.status,
            amount: donation.amount,
            is_anonymous: donation.is_anonymous,
            donor_name: donation.donor_name,
            is_logged_in: !!donation.user_id,
            qrCode: payosData?.qrCode || null,
            accountNumber: payosData?.accountNumber || null,
            accountName: payosData?.accountName || null,
            description: payosData?.description || `VNBA ${donation.order_code}`,
            checkoutUrl: payosData?.checkoutUrl || null
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
        });

    } catch (err) {
        console.error('Error in donate/check:', err);
        return new Response(JSON.stringify({ success: false, error: 'Lỗi kiểm tra trạng thái' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
