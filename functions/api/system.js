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
        return new Response(JSON.stringify({ error: 'Forbidden - Domain kh�ng h?p l?' }), { status: 403, headers: { 'Content-Type': 'application/json' }});
    }

    return new Response(JSON.stringify({
        FIREBASE_URL: env.FIREBASE_URL,
        SUPABASE_URL: env.SUPABASE_URL,
        SUPABASE_KEY: env.SUPABASE_KEY
    }), { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=86400, s-maxage=86400' }});
}


async function handleCore(request, env, body) {
    try {
        const clientIp = (request.headers.get('CF-Connecting-IP') || request.headers.get('x-real-ip') || (request.headers.get('x-forwarded-for') || '').split(',')[0]).trim();
        const isLocalOrInvalidIp = !clientIp || clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === 'localhost';
        const supabaseUrl = env.SUPABASE_URL;
        const supabaseServiceRole = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_KEY;

        if (!isLocalOrInvalidIp && supabaseUrl && supabaseServiceRole) {
            const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole);
            
            const { data: ipBan } = await supabaseAdmin.from('banned_ips').select('ip, reason').eq('ip', clientIp).maybeSingle();
            if (ipBan) {
                return new Response(JSON.stringify({ ip_banned: true, reason: ipBan.reason || '�?a ch? IP n�y thu?c danh s�ch h?n ch? truy c?p.' }), { status: 403, headers: { 'Content-Type': 'application/json' }});
            }

            const { data: bannedProfiles } = await supabaseAdmin.from('profiles').select('ban_status').contains('known_ips', [clientIp]);
            if (bannedProfiles && bannedProfiles.length > 0) {
                const isIpBanned = bannedProfiles.some(p => {
                    if (!p.ban_status) return false;
                    const b = typeof p.ban_status === 'string' ? JSON.parse(p.ban_status) : p.ban_status;
                    return b && b.banned;
                });
                if (isIpBanned) {
                    await supabaseAdmin.from('banned_ips').upsert({ ip: clientIp, reason: 'IP thu?c t�i kho?n b? c?m' }, { onConflict: 'ip' }).catch(()=>{});
                    return new Response(JSON.stringify({ ip_banned: true, reason: 'IP thu?c t�i kho?n b? c?m' }), { status: 403, headers: { 'Content-Type': 'application/json' }});
                }
            }
        }
        return new Response(JSON.stringify({ status: 'ok' }), { headers: { 'Content-Type': 'application/json' } });
    } catch (e) {
        return new Response(JSON.stringify({ status: 'ok' }), { headers: { 'Content-Type': 'application/json' } });
    }
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
            if (action === 'core') {
                return handleCore(request, env, body);
            } else if (action === 'qr-login') {
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
