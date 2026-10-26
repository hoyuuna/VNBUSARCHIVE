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
        const orderCode = url.searchParams.get('orderCode');

        if (!orderCode) {
            return new Response(JSON.stringify({ success: false, error: 'Thiếu orderCode' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const sb = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);
        const sbAdmin = env.SUPABASE_SERVICE_ROLE_KEY ? createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY) : sb;

        const { data: donation, error: dbErr } = await sbAdmin
            .from('donations')
            .select('id, order_code, user_id, donor_name, amount, status, is_anonymous, payos_payment_link_id, created_at')
            .eq('order_code', Number(orderCode))
            .maybeSingle();

        if (dbErr) {
            console.error('Error fetching donation:', dbErr);
        }

        let meta = {};
        if (donation?.payos_payment_link_id) {
            try {
                if (donation.payos_payment_link_id.startsWith('{')) {
                    meta = JSON.parse(donation.payos_payment_link_id);
                } else {
                    meta = { paymentLinkId: donation.payos_payment_link_id };
                }
            } catch (e) {}
        }

        let payosData = null;

        // If status is PENDING and payOS credentials exist, verify with payOS directly
        if ((!donation || donation.status === 'PENDING') && env.PAYOS_CLIENT_ID && env.PAYOS_API_KEY) {
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
                            if (donation) {
                                await sbAdmin
                                    .from('donations')
                                    .update({ status: 'PAID', updated_at: new Date().toISOString() })
                                    .eq('order_code', Number(orderCode));
                                donation.status = 'PAID';
                            } else {
                                // Auto-insert if missing
                                await sbAdmin.from('donations').insert({
                                    order_code: Number(orderCode),
                                    amount: payosData.amount || 0,
                                    donor_name: 'Nhà hảo tâm',
                                    status: 'PAID',
                                    is_anonymous: false,
                                    message: 'Khoản ủng hộ ghi nhận tự động',
                                    created_at: new Date().toISOString(),
                                    updated_at: new Date().toISOString()
                                });
                            }
                        } else if (donation && (payosData.status === 'CANCELLED' || payosData.status === 'EXPIRED')) {
                            // Clean up uncompleted cancelled/expired order from DB immediately
                            await sbAdmin
                                .from('donations')
                                .delete()
                                .eq('order_code', Number(orderCode))
                                .neq('status', 'PAID');

                            return new Response(JSON.stringify({
                                success: false,
                                status: payosData.status,
                                error: 'Đơn ủng hộ đã hết hạn hoặc bị hủy.'
                            }), {
                                status: 200,
                                headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
                            });
                        }
                    }
                }
            } catch (pErr) {
                console.error('Error fetching payOS status directly:', pErr);
            }
        }

        // If donation is not PAID and has no QR code available, clean it up from DB
        const qrCode = meta.qrCode || payosData?.qrCode || null;
        if (donation && donation.status !== 'PAID' && !qrCode) {
            await sbAdmin
                .from('donations')
                .delete()
                .eq('order_code', Number(orderCode))
                .neq('status', 'PAID');

            return new Response(JSON.stringify({
                success: false,
                status: 'EXPIRED',
                error: 'Đơn ủng hộ không còn mã QR khả dụng và đã được dọn dẹp.'
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
            });
        }

        if (!donation && !payosData) {
            return new Response(JSON.stringify({ success: false, error: 'Không tìm thấy thông tin ủng hộ' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const currentStatus = donation?.status || payosData?.status || 'PENDING';
        const currentAmount = donation?.amount || payosData?.amount || 0;
        const currentOrderCode = donation?.order_code || Number(orderCode);

        return new Response(JSON.stringify({
            success: true,
            orderCode: currentOrderCode,
            status: currentStatus,
            amount: currentAmount,
            is_anonymous: donation ? donation.is_anonymous : false,
            donor_name: donation?.donor_name || 'Nhà hảo tâm',
            is_logged_in: !!donation?.user_id,
            qrCode,
            accountNumber: meta.accountNumber || payosData?.accountNumber || null,
            accountName: meta.accountName || payosData?.accountName || null,
            description: meta.description || payosData?.description || `VNBA ${currentOrderCode}`,
            checkoutUrl: meta.checkoutUrl || payosData?.checkoutUrl || null
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
