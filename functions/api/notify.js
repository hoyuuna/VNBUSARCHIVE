import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { marked } from 'marked';

function formatEmailMarkdown(text) {
    if (!text) return '';
    let processed = text;
    processed = processed.replace(/(^[ \t]*(?:[-*+]|\d+\.)[ \t]+.*)\n([ \t]*[^-*+\d\s])/gm, '$1\n\n$2');
    processed = processed.replace(/\n(\s*\n)+/g, (match) => {
        const count = (match.match(/\n/g) || []).length;
        if (count <= 2) return '\n\n';
        const extraBreaks = '<br>'.repeat(count - 2);
        return `\n\n${extraBreaks}\n\n`;
    });
    return marked.parse(processed, { breaks: true, gfm: true });
}

async function handleSendEmail(request, env, body) {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' }});

    const supabaseAdmin = createClient(
        env.SUPABASE_URL,
        env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !user) return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { 'Content-Type': 'application/json' }});

    const { data: profile } = await supabaseAdmin.from('profiles').select('username, role').eq('id', user.id).single();
    if (!profile || profile.role !== 'manager') {
        return new Response(JSON.stringify({ error: 'Bạn không có quyền thực hiện hành động này.' }), { status: 403, headers: { 'Content-Type': 'application/json' }});
    }

    const { targetUserId, customEmail, subject, markdownContent, isAnonymous } = body;

    let toEmail = customEmail;
    let recipientName = customEmail;

    if (targetUserId) {
        const { data: targetUser, error: targetErr } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
        if (targetErr || !targetUser.user) {
            return new Response(JSON.stringify({ error: 'Không tìm thấy thông tin liên hệ của User này.' }), { status: 404, headers: { 'Content-Type': 'application/json' }});
        }
        toEmail = targetUser.user.email;

        const { data: targetProfile } = await supabaseAdmin.from('profiles').select('username').eq('id', targetUserId).single();
        recipientName = targetProfile?.username || toEmail;
    }

    if (!toEmail) return new Response(JSON.stringify({ error: 'Không xác định được địa chỉ Email người nhận.' }), { status: 400, headers: { 'Content-Type': 'application/json' }});

    const adminName = isAnonymous ? 'Quản trị VNBUSARCHIVE' : profile.username;
    const senderLine = isAnonymous ? 'VNBUSARCHIVE <noreply@vnbusarchive.io.vn>' : `${profile.username} via VNBUSARCHIVE <noreply@vnbusarchive.io.vn>`;

    const htmlContent = formatEmailMarkdown(markdownContent);

    const emailTemplate = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Thông báo từ VNBUSARCHIVE</title>
        <style>
            body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
            table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
            img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
            table { border-collapse: collapse !important; }
            body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }
            .markdown-content p { margin-top: 0; margin-bottom: 1em; }
            .markdown-content a { color: #2563eb; text-decoration: none; }
            .markdown-content blockquote { border-left: 4px solid #e4e4e7; margin: 0; padding-left: 1em; color: #71717a; }
        </style>
    </head>
    <body style="background-color: #fafafa; margin: 0 !important; padding: 0 !important; font-family: Arial, sans-serif; color: #09090b;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fafafa;">
            <tr>
                <td align="center" style="padding: 50px 20px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); overflow: hidden;">
                        <tr>
                            <td align="center" style="padding: 40px 30px 20px;">
                                <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                                    <tr>
                                        <td align="right" valign="middle" style="padding-right: 12px;">
                                            <img src="https://files.catbox.moe/crxvn6.png" alt="VNBUSARCHIVE Logo" width="45" style="display: block;">
                                        </td>
                                        <td align="left" valign="middle">
                                            <h1 style="margin: 0; font-size: 20px; font-weight: 800; font-style: italic; letter-spacing: 1.5px; color: #000000; line-height: 1;">
                                                VNBUSARCHIVE
                                            </h1>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td align="center" style="padding: 0 30px;">
                                <div style="height: 1px; background-color: #f4f4f5; width: 100%;"></div>
                            </td>
                        </tr>
                        <tr>
                            <td align="left" style="padding: 30px;">
                                <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #52525b; font-weight: 500;">
                                    Xin chào <strong>${recipientName}</strong>,
                                </p>

                                <div class="markdown-content" style="margin: 0 0 30px; font-size: 14px; line-height: 1.6; color: #3f3f46;">
                                    ${htmlContent}
                                </div>

                                <p style="margin: 0 0 30px; font-size: 14px; line-height: 1.6; color: #09090b;">
                                    Thân gửi,<br>
                                    <strong>${adminName}</strong>
                                </p>

                                <div style="height: 1px; background-color: #f4f4f5; width: 100%; margin-bottom: 20px;"></div>

                                <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #a1a1aa; font-style: italic;">
                                    Bạn không thể trả lời email này, vui lòng liên hệ qua email <a href="mailto:lienhe@vnbusarchive.io.vn" style="color: #71717a; text-decoration: underline;">lienhe@vnbusarchive.io.vn</a> để tiếp tục.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;

    let resend;
    if (env.RESEND_API_KEY) {
        resend = new Resend(env.RESEND_API_KEY);
    } else {
        throw new Error("Missing RESEND_API_KEY in Environment Variables");
    }

    const resendData = await resend.emails.send({
        from: senderLine,
        to: [toEmail],
        subject: subject,
        html: emailTemplate,
    });

    if (resendData.error) throw new Error(resendData.error.message);

    return new Response(JSON.stringify({ success: true, message: 'Gửi Email thành công.' }), { status: 200, headers: { 'Content-Type': 'application/json' }});
}

async function handleBugReport(request, env, body) {
    const { DISCORD_BOT_TOKEN, BUG_CHANNEL } = env;

    if (!DISCORD_BOT_TOKEN || !BUG_CHANNEL) {
        console.error("Thiếu DISCORD_BOT_TOKEN hoặc BUG_CHANNEL trong Environment Variables");
        return new Response(JSON.stringify({ error: 'Server configuration error' }), { status: 500, headers: { 'Content-Type': 'application/json' }});
    }

    const { errorMessage, fileInfo, consoleLogs, user, userAgent } = body;
    const sanitizeMentions = (str) => String(str ?? '').replace(/@(everyone|here)/gi, '@\u200b$1').replace(/<@&?\d+>/g, '[mention]');

    const embed = {
        title: "🚨 Báo cáo lỗi Upload tự động",
        color: 0xff0000,
        fields:[
            { 
                name: "📝 Chi tiết lỗi", 
                value: "```\n" + sanitizeMentions(errorMessage || "Không có thông báo lỗi cụ thể") + "\n```", 
                inline: false 
            },
            { 
                name: "👤 Người dùng", 
                value: user ? "**" + sanitizeMentions(user.username) + "**\n`" + user.id + "`" : "Guest / Khách", 
                inline: true 
            },
            { 
                name: "🌐 Trình duyệt / Thiết bị", 
                value: "`" + sanitizeMentions(userAgent || "Unknown") + "`", 
                inline: false 
            }
        ],
        timestamp: new Date().toISOString()
    };

    if (fileInfo) {
        embed.fields.splice(1, 0, {
            name: "📁 Thông tin File",
            value: "**Tên file:** " + sanitizeMentions(fileInfo.name || 'N/A') + "\n**Loại:** " + sanitizeMentions(fileInfo.type || 'N/A') + "\n**Cỡ gốc:** " + (fileInfo.originalSize ? fileInfo.originalSize + ' KB' : 'N/A') + "\n**Cỡ sau nén:** " + (fileInfo.compressedSize ? fileInfo.compressedSize + ' KB' : 'Chưa kịp nén (Lỗi trước đó)'),
            inline: true
        });
    }

    if (consoleLogs && consoleLogs.length > 0) {
        const logsStr = consoleLogs.slice(-5).join('\n').substring(0, 1000);
        embed.fields.push({
            name: "🔴 Console Errors (Cảnh báo đỏ)",
            value: "```js\n" + sanitizeMentions(logsStr) + "\n```",
            inline: false
        });
    }

    const discordRes = await fetch("https://discord.com/api/v10/channels/" + BUG_CHANNEL + "/messages", {
        method: 'POST',
        headers: {
            'Authorization': "Bot " + DISCORD_BOT_TOKEN,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ embeds: [embed] })
    });

    if (!discordRes.ok) {
        const errorText = await discordRes.text();
        throw new Error("Discord API Error: " + errorText);
    }

    return new Response(JSON.stringify({ success: true, message: "Bug reported successfully" }), { status: 200, headers: { 'Content-Type': 'application/json' }});
}

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

export async function onRequest(context) {
    const { request, env } = context;
    if (!validateOriginAndReferer(request)) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' }});
    if (request.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' }});

    try {
        const body = await request.json().catch(() => ({}));
        const { action } = body;
        
        if (action === 'email') {
            return await handleSendEmail(request, env, body);
        } else if (action === 'bug') {
            return await handleBugReport(request, env, body);
        } else {
            return new Response(JSON.stringify({ error: 'Invalid or missing action in payload' }), { status: 400, headers: { 'Content-Type': 'application/json' }});
        }
    } catch (error) {
        console.error('Lỗi API Notify:', error);
        return new Response(JSON.stringify({ error: error.message || 'Lỗi hệ thống' }), { status: 500, headers: { 'Content-Type': 'application/json' }});
    }
}
