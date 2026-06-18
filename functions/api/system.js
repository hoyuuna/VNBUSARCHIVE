import { createClient } from '@supabase/supabase-js';
import { coreBase64 } from './_core.js';

function handleConfig(request, env) {
    const referer = request.headers.get('referer') || '';
    const origin = request.headers.get('origin') || '';

    const allowedDomains =[
        'vnbusarchive.io.vn'
    ];

    const isAllowed = allowedDomains.some(domain => 
        origin.includes(domain) || referer.includes(domain)
    );

    const host = request.headers.get('host') || '';
    const isProduction = host.includes('vnbusarchive.io.vn');

    if (isProduction && !isAllowed) {
        console.log("Bị chặn! Origin:", origin, "Referer:", referer);
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
        const authHeader = request.headers.get('authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.replace('Bearer ', '');
            const supabaseUrl = env.SUPABASE_URL;
            const supabaseServiceRole = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_KEY;
            
            if (supabaseUrl && supabaseServiceRole) {
                const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole);
                const { data: { user }, error: userErr } = await supabaseAdmin.auth.getUser(token);
                
                if (!userErr && user) {
                    const { data: profile } = await supabaseAdmin.from('profiles').select('ban_status, username').eq('id', user.id).single();
                    if (profile && profile.ban_status) {
                        try {
                            const banInfo = typeof profile.ban_status === 'string' ? JSON.parse(profile.ban_status) : profile.ban_status;
                            if (banInfo && banInfo.banned) {
                                return new Response(JSON.stringify({ banned: true, reason: banInfo.reason, name: profile.username || user.email, uuid: user.id }), { status: 403, headers: { 'Content-Type': 'application/json' }});
                            }
                        } catch (e) {
                            console.error("Lỗi parse ban_status", e);
                        }
                    }
                }
            }
        }

        return new Response(JSON.stringify({ payload: coreBase64 }), { status: 200, headers: { 'Content-Type': 'application/json' }});
    } catch (error) {
        console.error("Loi doc file core:", error);
        return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500, headers: { 'Content-Type': 'application/json' }});
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

export async function onRequest(context) {
    const { request, env } = context;

    if (request.method === 'GET') {
        return handleConfig(request, env);
    } else if (request.method === 'POST') {
        try {
            const body = await request.json().catch(() => ({}));
            const { action } = body;
            if (action === 'qr-login') {
                return handleQrLoginGenerate(request, env);
            } else {
                return handleGetCore(request, env);
            }
        } catch (err) {
            return handleGetCore(request, env);
        }
    }
    
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' }});
}
