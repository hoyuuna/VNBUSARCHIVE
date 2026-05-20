import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { marked } from 'marked';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
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
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=Montserrat:ital,wght@0,800;1,800&display=swap" rel="stylesheet">
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
        <body style="background-color: #fafafa; margin: 0 !important; padding: 0 !important; font-family: 'Be Vietnam Pro', Arial, sans-serif; color: #09090b;">
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
                                                <h1 style="margin: 0; font-family: 'Montserrat', Arial, sans-serif; font-size: 20px; font-weight: 800; font-style: italic; letter-spacing: 1.5px; color: #000000; line-height: 1;">
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

    } catch (error) {
        console.error('Lỗi gửi Email:', error);
        return res.status(500).json({ error: error.message });
    }
}