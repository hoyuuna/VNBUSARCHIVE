import { createClient } from '@supabase/supabase-js';
import { coreBase64 } from './_core.js';

function validateOriginAndReferer(request) {
    const referer = request.headers.get('referer') || '';
    const origin = request.headers.get('origin') || '';
    const host = request.headers.get('host') || '';
    const isProduction = host.includes('vnbusarchive.io.vn');
    
    if (!isProduction) return true;
    if (!origin && !referer) return true;
    
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
        return new Response(JSON.stringify({ error: 'Forbidden - Domain không hợp lệ' }), { status: 403, headers: { 'Content-Type': 'application/json' }});
    }

    return new Response(JSON.stringify({
        FIREBASE_URL: env.FIREBASE_URL,
        SUPABASE_URL: env.SUPABASE_URL,
        SUPABASE_KEY: env.SUPABASE_KEY
    }), { status: 200, headers: { 'Content-Type': 'application/json' }});
}

async function handleGetCore(request, env) {
    try {
        const clientIp = (request.headers.get('CF-Connecting-IP') || request.headers.get('x-real-ip') || request.headers.get('x-client-ip') || (request.headers.get('x-forwarded-for') || '').split(',')[0] || '127.0.0.1').trim();
        const isLocalOrInvalidIp = clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === 'localhost';

        const supabaseUrl = env.SUPABASE_URL;
        const supabaseServiceRole = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_KEY;
        let supabaseAdmin = null;

        if (supabaseUrl && supabaseServiceRole) {
            supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole);
        }

        if (supabaseAdmin && !isLocalOrInvalidIp) {
            try {
                const { data: ipBan, error: ipBanErr } = await supabaseAdmin.from('banned_ips').select('ip, reason').eq('ip', clientIp).maybeSingle();
                if (!ipBanErr && ipBan) {
                    return new Response(JSON.stringify({ ip_banned: true, reason: ipBan.reason || 'Địa chỉ IP này thuộc danh sách hạn chế truy cập.' }), { status: 403, headers: { 'Content-Type': 'application/json' }});
                }
            } catch (e) {}

            try {
                const { data: bannedProfiles, error: bpErr } = await supabaseAdmin.from('profiles').select('ban_status').contains('known_ips', [clientIp]);
                if (!bpErr && bannedProfiles && bannedProfiles.length > 0) {
                    let foundReason = 'IP thuộc tài khoản bị hạn chế hoạt động.';
                    const isIpBanned = bannedProfiles.some(p => {
                        if (!p.ban_status) return false;
                        const b = typeof p.ban_status === 'string' ? JSON.parse(p.ban_status) : p.ban_status;
                        if (b && b.banned) {
                            if (b.reason) foundReason = b.reason;
                            return true;
                        }
                        return false;
                    });
                    if (isIpBanned) {
                        await supabaseAdmin.from('banned_ips').upsert({ ip: clientIp, reason: foundReason }, { onConflict: 'ip' }).catch(()=>{});
                        return new Response(JSON.stringify({ ip_banned: true, reason: foundReason }), { status: 403, headers: { 'Content-Type': 'application/json' }});
                    }
                }
            } catch (e) {}
        }

        const authHeader = request.headers.get('authorization');
        if (authHeader && authHeader.startsWith('Bearer ') && supabaseAdmin) {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user }, error: userErr } = await supabaseAdmin.auth.getUser(token);
            
            if (!userErr && user) {
                let profile = null;
                try {
                    const res = await supabaseAdmin.from('profiles').select('ban_status, username, known_ips').eq('id', user.id).single();
                    if (!res.error) profile = res.data;
                } catch (e) {}

                if (!profile) {
                    try {
                        const res = await supabaseAdmin.from('profiles').select('ban_status, username').eq('id', user.id).single();
                        if (!res.error) profile = res.data;
                    } catch (e) {}
                }

                if (profile && profile.ban_status) {
                    try {
                        const banInfo = typeof profile.ban_status === 'string' ? JSON.parse(profile.ban_status) : profile.ban_status;
                        if (banInfo && banInfo.banned) {
                            if (clientIp) {
                                const knownIps = Array.isArray(profile.known_ips) ? profile.known_ips : [];
                                if (!knownIps.includes(clientIp)) {
                                    await supabaseAdmin.from('profiles').update({ known_ips: [...knownIps, clientIp] }).eq('id', user.id).catch(()=>{});
                                }
                            }
                            if (!isLocalOrInvalidIp) {
                                await supabaseAdmin.from('banned_ips').upsert({ ip: clientIp, reason: `Tài khoản ${profile.username || user.email} bị cấm` }, { onConflict: 'ip' }).catch(()=>{});
                            }
                            return new Response(JSON.stringify({ banned: true, reason: banInfo.reason, name: profile.username || user.email, uuid: user.id }), { status: 403, headers: { 'Content-Type': 'application/json' }});
                        }
                    } catch (e) {
                        console.error("Lỗi parse ban_status", e);
                    }
                }

                if (clientIp && profile) {
                    try {
                        const knownIps = Array.isArray(profile.known_ips) ? profile.known_ips : [];
                        if (!knownIps.includes(clientIp)) {
                            await supabaseAdmin.from('profiles').update({ known_ips: [...knownIps, clientIp] }).eq('id', user.id).catch(()=>{});
                        }
                    } catch (e) {}
                }
            }
        }

        return new Response(JSON.stringify({ payload: coreBase64 }), { status: 200, headers: { 'Content-Type': 'application/json' }});
    } catch (error) {
        console.error("Loi doc file core:", error);
        return new Response(JSON.stringify({ payload: coreBase64 }), { status: 200, headers: { 'Content-Type': 'application/json' }});
    }
}

async function handleQrLoginGenerate(request, env) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ error: 'Thiếu hoặc sai định dạng Token xác thực.' }), { status: 401, headers: { 'Content-Type': 'application/json' }});
        }
        const token = authHeader.replace('Bearer ', '');

        const supabaseUrl = env.SUPABASE_URL;
        const supabaseServiceRole = env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceRole) {
            throw new Error("Thiếu biến môi trường SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY");
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole);

        const { data: { user }, error: userErr } = await supabaseAdmin.auth.getUser(token);
        
        if (userErr || !user) {
            return new Response(JSON.stringify({ error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' }), { status: 401, headers: { 'Content-Type': 'application/json' }});
        }

        if (!user.email) {
            return new Response(JSON.stringify({ error: 'Tài khoản của bạn không có Email, không thể sử dụng chức năng đăng nhập QR.' }), { status: 400, headers: { 'Content-Type': 'application/json' }});
        }

        const { data: profile } = await supabaseAdmin.from('profiles').select('ban_status').eq('id', user.id).single();
        if (profile && profile.ban_status) {
            const banInfo = typeof profile.ban_status === 'string' ? JSON.parse(profile.ban_status) : profile.ban_status;
            if (banInfo && banInfo.banned) {
                return new Response(JSON.stringify({ error: `Tài khoản đã bị cấm: ${banInfo.reason || 'Không rõ'}` }), { status: 403, headers: { 'Content-Type': 'application/json' }});
            }
        }

        const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: user.email,
            options: {
                redirectTo: 'https://vnbusarchive.io.vn/'
            }
        });

        if (linkErr) throw linkErr;

        return new Response(JSON.stringify({ url: linkData.properties.action_link }), { status: 200, headers: { 'Content-Type': 'application/json' }});

    } catch (error) {
        console.error('QR Login Generate Error:', error);
        return new Response(JSON.stringify({ error: error.message || 'Lỗi hệ thống máy chủ.' }), { status: 500, headers: { 'Content-Type': 'application/json' }});
    }
}

async function handleLogIp(request, env) {
    try {
        const clientIp = (request.headers.get('CF-Connecting-IP') || request.headers.get('x-real-ip') || request.headers.get('x-client-ip') || (request.headers.get('x-forwarded-for') || '').split(',')[0] || '127.0.0.1').trim();
        const authHeader = request.headers.get('authorization');
        const supabaseUrl = env.SUPABASE_URL;
        const supabaseServiceRole = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_KEY;

        if (clientIp && authHeader && authHeader.startsWith('Bearer ') && supabaseUrl && supabaseServiceRole) {
            const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole);
            const token = authHeader.replace('Bearer ', '');
            const { data: { user }, error: userErr } = await supabaseAdmin.auth.getUser(token);

            if (!userErr && user) {
                const { data: profile } = await supabaseAdmin.from('profiles').select('known_ips, ban_status, username').eq('id', user.id).single();
                if (profile) {
                    const knownIps = Array.isArray(profile.known_ips) ? profile.known_ips : [];
                    if (!knownIps.includes(clientIp)) {
                        await supabaseAdmin.from('profiles').update({ known_ips: [...knownIps, clientIp] }).eq('id', user.id);
                    }
                    let banInfo = null;
                    if (profile.ban_status) {
                        try { banInfo = typeof profile.ban_status === 'string' ? JSON.parse(profile.ban_status) : profile.ban_status; } catch(e){}
                    }
                    if (banInfo && banInfo.banned) {
                        await supabaseAdmin.from('banned_ips').upsert({ ip: clientIp, reason: `Tài khoản ${profile.username || user.email} bị cấm` }, { onConflict: 'ip' }).catch(()=>{});
                    }
                }
            }
        }
    } catch (e) {}
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' }});
}

export async function onRequest(context) {
    const { request, env } = context;

    if (!validateOriginAndReferer(request)) {
        return new Response(JSON.stringify({ error: 'Forbidden - Domain không hợp lệ' }), { status: 403, headers: { 'Content-Type': 'application/json' }});
    }

    if (request.method === 'GET') {
        return handleConfig(request, env);
    } else if (request.method === 'POST') {
        try {
            const body = await request.json().catch(() => ({}));
            const { action } = body;
            if (action === 'qr-login') {
                return handleQrLoginGenerate(request, env);
            } else if (action === 'log_ip') {
                return handleLogIp(request, env);
            } else {
                return handleGetCore(request, env);
            }
        } catch (err) {
            return handleGetCore(request, env);
        }
    }
    
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' }});
}
