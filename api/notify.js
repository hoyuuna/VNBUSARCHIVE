import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { marked } from 'marked';

// Resend instance is created inside the handler so it doesn't break if env is missing when not used.
let resend;
if (process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
}

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function handleSendEmail(req, res) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !user) return res.status(401).json({ error: 'Invalid token' });

    const { data: profile } = await supabaseAdmin.from('profiles').select('username, role').eq('id', user.id).single();
    if (!profile || profile.role !== 'manager') {
        return res.status(403).json({ error: 'Bạn không có quyền thực hiện hành động này.' });
    }

    const { targetUserId, customEmail, subject, markdownContent, isAnonymous } = req.body;

    let toEmail = customEmail;
    let recipientName = customEmail;

    if (targetUserId) {
        const { data: targetUser, error: targetErr } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
        if (targetErr || !targetUser.user) {
            return res.status(404).json({ error: 'Không tìm thấy thông tin liên hệ của User này.' });
        }
        toEmail = targetUser.user.email;

        const { data: targetProfile } = await supabaseAdmin.from('profiles').select('username').eq('id', targetUserId).single();
        recipientName = targetProfile?.username || toEmail;
    }

    if (!toEmail) return res.status(400).json({ error: 'Không xác định được địa chỉ Email người nhận.' });

    const adminName = isAnonymous ? 'Quản trị VNBUSARCHIVE' : profile.username;
    const senderLine = isAnonymous ? 'VNBUSARCHIVE <noreply@vnbusarchive.io.vn>' : `${profile.username} via VNBUSARCHIVE <noreply@vnbusarchive.io.vn>`;

    const htmlContent = marked.parse(markdownContent);

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
                                    Bạn không thể trả lời email này, vui lòng <a href="https://www.vnbusarchive.io.vn/contact" target="_blank" style="color: #71717a; text-decoration: underline;">liên hệ hỗ trợ</a> để tiếp tục.
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

    const resendData = await resend.emails.send({
        from: senderLine,
        to: [toEmail],
        subject: subject,
        html: emailTemplate,
    });

    if (resendData.error) throw new Error(resendData.error.message);

    return res.status(200).json({ success: true, message: 'Gửi Email thành công.' });
}

async function handleBugReport(req, res) {
    const { DISCORD_BOT_TOKEN, BUG_CHANNEL } = process.env;

    if (!DISCORD_BOT_TOKEN || !BUG_CHANNEL) {
        console.error("Thiếu DISCORD_BOT_TOKEN hoặc BUG_CHANNEL trong Environment Variables");
        return res.status(500).json({ error: 'Server configuration error' });
    }

    const { errorMessage, fileInfo, consoleLogs, user, userAgent } = req.body;

    const embed = {
        title: "🚨 Báo cáo lỗi Upload tự động",
        color: 0xff0000,
        fields:[
            { 
                name: "📝 Chi tiết lỗi", 
                value: `\`\`\`\n${errorMessage || "Không có thông báo lỗi cụ thể"}\n\`\`\``, 
                inline: false 
            },
            { 
                name: "👤 Người dùng", 
                value: user ? `**${user.username}**\n\`${user.id}\`` : "Guest / Khách", 
                inline: true 
            },
            { 
                name: "🌐 Trình duyệt / Thiết bị", 
                value: `\`${userAgent || "Unknown"}\``, 
                inline: false 
            }
        ],
        timestamp: new Date().toISOString()
    };

    if (fileInfo) {
        embed.fields.splice(1, 0, {
            name: "📁 Thông tin File",
            value: `**Tên file:** ${fileInfo.name || 'N/A'}\n**Loại:** ${fileInfo.type || 'N/A'}\n**Cỡ gốc:** ${fileInfo.originalSize ? fileInfo.originalSize + ' KB' : 'N/A'}\n**Cỡ sau nén:** ${fileInfo.compressedSize ? fileInfo.compressedSize + ' KB' : 'Chưa kịp nén (Lỗi trước đó)'}`,
            inline: true
        });
    }

    if (consoleLogs && consoleLogs.length > 0) {
        const logsStr = consoleLogs.slice(-5).join('\n').substring(0, 1000);
        embed.fields.push({
            name: "🔴 Console Errors (Cảnh báo đỏ)",
            value: `\`\`\`js\n${logsStr}\n\`\`\``,
            inline: false
        });
    }

    const discordRes = await fetch(`https://discord.com/api/v10/channels/${BUG_CHANNEL}/messages`, {
        method: 'POST',
        headers: {
            'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ embeds: [embed] })
    });

    if (!discordRes.ok) {
        const errorText = await discordRes.text();
        throw new Error(`Discord API Error: ${errorText}`);
    }

    return res.status(200).json({ success: true, message: "Bug reported successfully" });
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { action } = req.body || {};
        
        if (action === 'email') {
            return await handleSendEmail(req, res);
        } else if (action === 'bug') {
            return await handleBugReport(req, res);
        } else {
            return res.status(400).json({ error: 'Invalid or missing action in payload' });
        }
    } catch (error) {
        console.error('Lỗi API Notify:', error);
        return res.status(500).json({ error: error.message || 'Lỗi hệ thống' });
    }
}
