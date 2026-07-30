import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { marked } from 'marked';

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return String(unsafe)
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

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

    if (!toEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
        return new Response(JSON.stringify({ error: 'Địa chỉ Email không hợp lệ.' }), { status: 400, headers: { 'Content-Type': 'application/json' }});
    }

    const adminName = escapeHtml(isAnonymous ? 'Quản trị VNBUSARCHIVE' : profile.username);
    const senderLine = isAnonymous ? 'VNBUSARCHIVE <noreply@vnbusarchive.io.vn>' : `${adminName} via VNBUSARCHIVE <noreply@vnbusarchive.io.vn>`;

    const htmlContent = formatEmailMarkdown(markdownContent);

    const emailTemplate = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Thông báo từ VNBUSARCHIVE</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
            body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
            table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
            img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
            table { border-collapse: collapse !important; }
            body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #ffffff !important; }
            a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
            .markdown-content p { margin-top: 0; margin-bottom: 1em; }
            .markdown-content a { color: #000000; text-decoration: underline; font-weight: 500; }
            .markdown-content blockquote { border-left: 4px solid #e4e4e7; margin: 0; padding-left: 1em; color: #666666; }
        </style>
    </head>
    <body style="background-color: #ffffff; margin: 0 !important; padding: 0 !important; font-family: 'Be Vietnam Pro', Arial, sans-serif; color: #000000; text-align: center;">

        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff;">
            <tr>
                <td align="center" style="padding: 40px 20px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 480px; margin: 0 auto; background-color: #ffffff; text-align: center;">
                        
                        <tr>
                            <td align="center" style="padding-bottom: 32px;">
                                <img src="https://files.catbox.moe/j2iq29.png" alt="VNBUSARCHIVE" style="display: block; max-width: 180px; width: 100%; height: auto; margin: 0 auto;">
                            </td>
                        </tr>


                        <tr>
                            <td align="left" style="padding-bottom: 24px; font-family: 'Be Vietnam Pro', Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #4a4a4a; font-weight: 400;">
                                <p style="margin: 0 0 16px 0;">
                                    Xin chào <strong style="color: #000000; font-weight: 600;">\${escapeHtml(recipientName)}</strong>,
                                </p>

                                <div class="markdown-content" style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #4a4a4a; text-align: left;">
                                    \${htmlContent}
                                </div>

                                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #000000; font-weight: 500;">
                                    Thân gửi,<br>
                                    <strong style="font-weight: 600;">\${adminName}</strong>
                                </p>
                            </td>
                        </tr>

                        <tr>
                            <td align="center" style="font-family: 'Be Vietnam Pro', Arial, sans-serif; font-size: 13px; line-height: 1.6; color: #666666; border-top: 1px solid #eeeeee; padding-top: 24px;">
                                Bạn không thể trả lời email này, vui lòng liên hệ qua email <a href="mailto:lienhe@vnbusarchive.io.vn" style="color: #000000; text-decoration: underline; font-weight: 500;">lienhe@vnbusarchive.io.vn</a> để tiếp tục.
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
        return new Response(JSON.stringify({ error: "Đã xảy ra lỗi hệ thống, vui lòng thử lại sau" }), { status: 500, headers: { 'Content-Type': 'application/json' }});
    }
}
