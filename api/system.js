import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

function handleConfig(req, res) {
    const referer = req.headers.referer || '';
    const origin = req.headers.origin || '';

    const allowedDomains =[
        'vnbusarchive.io.vn'
    ];

    const isAllowed = allowedDomains.some(domain => 
        origin.includes(domain) || referer.includes(domain)
    );

    if (process.env.NODE_ENV === 'production' && !isAllowed) {
        console.log("Bị chặn! Origin:", origin, "Referer:", referer);
        return res.status(403).json({ error: 'Forbidden - Domain không hợp lệ' });
    }

    res.status(200).json({
        FIREBASE_URL: process.env.FIREBASE_URL,
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_KEY: process.env.SUPABASE_KEY
    });
}

async function handleGetCore(req, res) {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.replace('Bearer ', '');
            const supabaseUrl = process.env.SUPABASE_URL;
            const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
            
            if (supabaseUrl && supabaseServiceRole) {
                const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole);
                const { data: { user }, error: userErr } = await supabaseAdmin.auth.getUser(token);
                
                if (!userErr && user) {
                    const { data: profile } = await supabaseAdmin.from('profiles').select('ban_status, username').eq('id', user.id).single();
                    if (profile && profile.ban_status) {
                        try {
                            const banInfo = typeof profile.ban_status === 'string' ? JSON.parse(profile.ban_status) : profile.ban_status;
                            if (banInfo && banInfo.banned) {
                                return res.status(403).json({ banned: true, reason: banInfo.reason, name: profile.username || user.email, uuid: user.id });
                            }
                        } catch (e) {
                            console.error("Lỗi parse ban_status", e);
                        }
                    }
                }
            }
        }

        const filePath = path.join(process.cwd(), '_core.html');
        const coreHtml = fs.readFileSync(filePath, 'utf8');
        const encodedPayload = Buffer.from(coreHtml).toString('base64');
        res.status(200).json({ payload: encodedPayload });
    } catch (error) {
        console.error("Loi doc file core:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

async function handleQrLoginGenerate(req, res) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Thiếu hoặc sai định dạng Token xác thực.' });
        }
        const token = authHeader.replace('Bearer ', '');

        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceRole) {
            throw new Error("Thiếu biến môi trường SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY");
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole);

        const { data: { user }, error: userErr } = await supabaseAdmin.auth.getUser(token);
        
        if (userErr || !user) {
            return res.status(401).json({ error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' });
        }

        if (!user.email) {
            return res.status(400).json({ error: 'Tài khoản của bạn không có Email, không thể sử dụng chức năng đăng nhập QR.' });
        }

        const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: user.email,
            options: {
                redirectTo: 'https://vnbusarchive.io.vn/'
            }
        });

        if (linkErr) throw linkErr;

        return res.status(200).json({ url: linkData.properties.action_link });

    } catch (error) {
        console.error('QR Login Generate Error:', error);
        return res.status(500).json({ error: error.message || 'Lỗi hệ thống máy chủ.' });
    }
}

export default async function handler(req, res) {
    if (req.method === 'GET') {
        return handleConfig(req, res);
    } else if (req.method === 'POST') {
        const { action } = req.body || {};
        if (action === 'qr-login') {
            return handleQrLoginGenerate(req, res);
        } else {
            // Default to get-core if no action is provided (to support existing clients temporarily) or if action is 'core'
            return handleGetCore(req, res);
        }
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
}
