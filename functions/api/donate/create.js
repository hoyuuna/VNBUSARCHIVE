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

async function createHmacSha256(keyStr, dataStr) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(keyStr);
    const msgData = encoder.encode(dataStr);
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
    return Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
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
        const { amount, message } = body;

        const amt = parseInt(amount, 10);
        if (isNaN(amt) || amt < 2000 || amt > 100000000) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Số tiền ủng hộ tối thiểu là 2.000 VNĐ'
            }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        const sb = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);
        const sbAdmin = env.SUPABASE_SERVICE_ROLE_KEY ? createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY) : sb;

        let userId = null;
        let donorName = 'Ẩn danh';
        let isAnonymous = true;

        const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
        if (authHeader) {
            const token = authHeader.replace(/^Bearer\s+/i, '').trim();
            const { data: { user } } = await sb.auth.getUser(token);
            if (user) {
                userId = user.id;
                const { data: profile } = await sbAdmin.from('profiles').select('username').eq('id', user.id).maybeSingle();
                donorName = profile?.username || user.email?.split('@')[0] || 'Thành viên VNBUSARCHIVE';
                isAnonymous = false;
            }
        }

        // Generate unique integer orderCode for payOS (max 9007199254740991)
        const orderCode = Number(String(Date.now()).slice(-6) + Math.floor(1000 + Math.random() * 9000));

        // Insert pending donation into DB
        const { error: dbErr } = await sbAdmin.from('donations').insert({
            order_code: orderCode,
            user_id: userId,
            donor_name: donorName,
            amount: amt,
            message: (message || '').trim().slice(0, 300),
            status: 'PENDING',
            is_anonymous: isAnonymous
        });

        if (dbErr) {
            console.error('DB Insert Donation Error:', dbErr);
            return new Response(JSON.stringify({
                success: false,
                error: 'Không thể tạo đơn ủng hộ trên cơ sở dữ liệu'
            }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }

        // Check payOS environment variables
        if (!env.PAYOS_CLIENT_ID || !env.PAYOS_API_KEY || !env.PAYOS_CHECKSUM_KEY) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Cổng thanh toán payOS chưa được cấu hình (Thiếu PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY).'
            }), { status: 503, headers: { 'Content-Type': 'application/json' } });
        }

        const origin = new URL(request.url).origin;
        const description = `VNBA ${orderCode}`.slice(0, 25);
        const returnUrl = `${origin}/support-us?orderCode=${orderCode}`;
        const cancelUrl = `${origin}/support-us?orderCode=${orderCode}&status=cancelled`;

        // Create HMAC_SHA256 signature according to payOS specification:
        // amount=${amount}&cancelUrl=${cancelUrl}&description=${description}&orderCode=${orderCode}&returnUrl=${returnUrl}
        const rawSignatureString = `amount=${amt}&cancelUrl=${cancelUrl}&description=${description}&orderCode=${orderCode}&returnUrl=${returnUrl}`;
        const signature = await createHmacSha256(env.PAYOS_CHECKSUM_KEY, rawSignatureString);

        const payosRes = await fetch('https://api-merchant.payos.vn/v2/payment-requests', {
            method: 'POST',
            headers: {
                'x-client-id': env.PAYOS_CLIENT_ID,
                'x-api-key': env.PAYOS_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                orderCode,
                amount: amt,
                description,
                returnUrl,
                cancelUrl,
                signature
            })
        });

        const payosJson = await payosRes.json();
        if (payosJson.code !== '00' && payosJson.code !== 0) {
            return new Response(JSON.stringify({
                success: false,
                error: payosJson.desc || 'Lỗi khởi tạo cổng payOS'
            }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        // Save payOS payment details into payos_payment_link_id for resume capability
        const payosMeta = JSON.stringify({
            paymentLinkId: payosJson.data?.paymentLinkId || null,
            qrCode: payosJson.data?.qrCode || null,
            accountNumber: payosJson.data?.accountNumber || null,
            accountName: payosJson.data?.accountName || null,
            bin: payosJson.data?.bin || null,
            checkoutUrl: payosJson.data?.checkoutUrl || null,
            description: description
        });

        await sbAdmin.from('donations').update({
            payos_payment_link_id: payosMeta
        }).eq('order_code', orderCode);

        return new Response(JSON.stringify({
            success: true,
            orderCode,
            amount: amt,
            description,
            accountName: payosJson.data?.accountName,
            accountNumber: payosJson.data?.accountNumber,
            bin: payosJson.data?.bin,
            checkoutUrl: payosJson.data?.checkoutUrl,
            qrCode: payosJson.data?.qrCode
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } catch (err) {
        console.error('Error in donate/create:', err);
        return new Response(JSON.stringify({
            success: false,
            error: 'Lỗi máy chủ nội bộ khi tạo thanh toán'
        }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}
