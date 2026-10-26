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

        // Verify webhook signature if checksum key is present
        if (env.PAYOS_CHECKSUM_KEY && signature && data) {
            const dataQueryStr = convertObjToQueryStr(data);
            const computedSignature = await createHmacSha256(env.PAYOS_CHECKSUM_KEY, dataQueryStr);

            if (computedSignature !== signature) {
                console.warn('[payOS Webhook] Signature mismatch. Computed:', computedSignature, 'Received:', signature);
                return new Response(JSON.stringify({ success: false, error: 'Invalid signature' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        // Handle transaction success
        if (code === '00' && data && data.orderCode) {
            const sb = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);
            const sbAdmin = env.SUPABASE_SERVICE_ROLE_KEY ? createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY) : sb;

            const orderCode = Number(data.orderCode);
            await sbAdmin
                .from('donations')
                .update({
                    status: 'PAID',
                    updated_at: new Date().toISOString()
                })
                .eq('order_code', orderCode);

            console.log(`[payOS Webhook] Order ${orderCode} marked as PAID.`);
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
