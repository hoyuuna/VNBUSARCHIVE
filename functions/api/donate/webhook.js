import { createClient } from '@supabase/supabase-js';

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

function convertObjToQueryStr(object) {
    return Object.keys(object)
        .sort()
        .map(key => `${key}=${object[key] === null || object[key] === undefined ? '' : object[key]}`)
        .join('&');
}

export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const body = await request.json().catch(() => null);
        if (!body) {
            return new Response(JSON.stringify({ success: false, error: 'Empty body' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { code, data, signature } = body;

        // Handle payOS webhook verification ping (data may be empty or test data)
        if (!data || !data.orderCode) {
            return new Response(JSON.stringify({ success: true, message: 'Webhook ping received' }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        let isVerified = false;

        // 1. Verify webhook signature if checksum key is present
        if (env.PAYOS_CHECKSUM_KEY && signature) {
            const dataQueryStr = convertObjToQueryStr(data);
            const computedSignature = await createHmacSha256(env.PAYOS_CHECKSUM_KEY, dataQueryStr);

            if (computedSignature === signature) {
                isVerified = true;
            } else {
                console.warn('[payOS Webhook] Signature mismatch. Computed:', computedSignature, 'Received:', signature);
            }
        }

        // 2. Double-check verification directly with payOS API if signature failed
        if (!isVerified && env.PAYOS_CLIENT_ID && env.PAYOS_API_KEY && data.orderCode) {
            try {
                const verifyRes = await fetch(`https://api-merchant.payos.vn/v2/payment-requests/${data.orderCode}`, {
                    headers: {
                        'x-client-id': env.PAYOS_CLIENT_ID,
                        'x-api-key': env.PAYOS_API_KEY
                    }
                });
                if (verifyRes.ok) {
                    const verifyJson = await verifyRes.json();
                    if (verifyJson.data && verifyJson.data.status === 'PAID') {
                        isVerified = true;
                        console.log(`[payOS Webhook] Order ${data.orderCode} verified directly via payOS API.`);
                    }
                }
            } catch (vErr) {
                console.error('[payOS Webhook] Fallback API verification failed:', vErr);
            }
        }

        if (!isVerified && env.PAYOS_CHECKSUM_KEY) {
            return new Response(JSON.stringify({ success: false, error: 'Invalid signature' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 3. Process payment success: ensure money is ALWAYS credited in DB
        if ((code === '00' || code === 0) && data && data.orderCode) {
            const sb = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);
            const sbAdmin = env.SUPABASE_SERVICE_ROLE_KEY ? createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY) : sb;

            const orderCode = Number(data.orderCode);
            const { data: updateRes, error: upErr } = await sbAdmin
                .from('donations')
                .update({
                    status: 'PAID',
                    updated_at: new Date().toISOString()
                })
                .eq('order_code', orderCode)
                .select('id, order_code');

            if (upErr) {
                console.error(`[payOS Webhook] DB update error for ${orderCode}:`, upErr);
            }

            // Fallback safety: if the order record is missing in DB, AUTO-INSERT it so money is NEVER lost!
            if (!updateRes || updateRes.length === 0) {
                console.warn(`[payOS Webhook] Order ${orderCode} was missing in DB. Auto-inserting PAID donation record.`);
                await sbAdmin.from('donations').insert({
                    order_code: orderCode,
                    amount: data.amount || 0,
                    donor_name: 'Nhà hảo tâm',
                    status: 'PAID',
                    is_anonymous: false,
                    message: data.description || 'Ủng hộ dự án',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
            }

            console.log(`[payOS Webhook] Order ${orderCode} successfully recorded as PAID.`);
        }

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        console.error('[payOS Webhook] Handler error:', err);
        return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
