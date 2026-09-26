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

function handleConfig(request, env) {
    if (!validateOriginAndReferer(request)) {
        return new Response(JSON.stringify({ error: 'Forbidden - Domain không h?p l?' }), { status: 403, headers: { 'Content-Type': 'application/json' }});
    }

    return new Response(JSON.stringify({
        FIREBASE_URL: env.FIREBASE_URL,
        SUPABASE_URL: env.SUPABASE_URL,
        SUPABASE_KEY: env.SUPABASE_KEY
    }), { status: 200, headers: { 'Content-Type': 'application/json' }});
}

async function handleQrLoginGenerate(request, env) {
    try {
        const supabaseUrl = env.SUPABASE_URL;
        const supabaseServiceRole = env.SUPABASE_SERVICE_ROLE_KEY;
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole);
        
        const qid = crypto.randomUUID();
        const { error } = await supabaseAdmin.from('qr_login_sessions').insert([{ qid, status: 'pending' }]);
        if (error) throw error;
        return new Response(JSON.stringify({ qid }), { headers: { 'Content-Type': 'application/json' }});
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' }});
    }
}

async function handleLogIp(request, env) {
    try {
        const clientIp = (request.headers.get('CF-Connecting-IP') || request.headers.get('x-real-ip') || request.headers.get('x-client-ip') || (request.headers.get('x-forwarded-for') || '').split(',')[0] || '127.0.0.1').trim();
        const authHeader = request.headers.get('authorization');
        const supabaseUrl = env.SUPABASE_URL;
        const supabaseServiceRole = env.SUPABASE_SERVICE_ROLE_KEY;

        if (clientIp && authHeader && authHeader.startsWith('Bearer ') && supabaseUrl && supabaseServiceRole) {
            const token = authHeader.replace(/^Bearer\s+/i, '').trim();
            const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole);
            
            const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
            if (!userError && userData?.user?.id) {
                const userId = userData.user.id;
                await supabaseAdmin.from('users').update({ ip_address: clientIp }).eq('id', userId);
            }
        }
    } catch (e) { }
    
    return new Response(JSON.stringify({ status: 'ok' }), { headers: { 'Content-Type': 'application/json' } });
}

export async function onRequest(context) {
    const { request, env } = context;
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            }
        });
    }

    if (request.method === 'GET') {
        return handleConfig(request, env);
    } else if (request.method === 'POST') {
        try {
            const clonedReq = request.clone();
            const body = await clonedReq.json().catch(() => ({}));
            const { action } = body;
            if (action === 'qr-login') {
                return handleQrLoginGenerate(request, env);
            } else if (action === 'log_ip') {
                return handleLogIp(request, env);
            } else {
                return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
            }
        } catch (e) {
            return new Response(JSON.stringify({ error: e.message }), { status: 500 });
        }
    }
    
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
}
