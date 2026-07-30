import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const generateTicketId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

const escapeHtml = (str) => String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const sanitizeMentions = (str) => String(str ?? '')
    .replace(/@(everyone|here)/gi, '@\u200b$1')
    .replace(/<@&?\d+>/g, '[mention]');

const buildContactEmailHtml = ({ name, ticketId, supportType, message }) => {
    return `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thông tin hỗ trợ của bạn đã được gửi - VNBUSARCHIVE</title>
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
                        <td align="center" style="padding-bottom: 16px;">
                            <h1 style="margin: 0; font-family: 'Be Vietnam Pro', Arial, sans-serif; font-size: 20px; font-weight: 700; color: #000000; line-height: 1.4; letter-spacing: -0.3px;">
                                Thông tin hỗ trợ đã được gửi
                            </h1>
                        </td>
                    </tr>

                    <tr>
                        <td align="center" style="padding-bottom: 24px; font-family: 'Be Vietnam Pro', Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #4a4a4a; font-weight: 400;">
                            <p style="margin: 0 0 12px 0;">
                                Xin chào <strong style="color: #000000; font-weight: 600;">${escapeHtml(name)}</strong>,
                            </p>
                            <p style="margin: 0 0 12px 0;">
                                ⚠️ <strong style="color: #000000;">Lưu ý bảo mật:</strong> Đây là email tự động xác nhận yêu cầu hỗ trợ từ VNBUSARCHIVE. Nếu bạn không gửi yêu cầu này, vui lòng bỏ qua email.
                            </p>
                            <p style="margin: 0 0 24px 0;">
                                Cảm ơn bạn đã liên hệ với VNBUSARCHIVE, dưới đây là thông tin bạn đã cung cấp:
                            </p>
                            
                            <p style="margin: 0 0 12px 0;"><strong style="color: #000000;">ID:</strong> ${escapeHtml(ticketId)}</p>
                            <p style="margin: 0 0 12px 0;"><strong style="color: #000000;">Loại hình:</strong> ${escapeHtml(supportType)}</p>
                            <p style="margin: 0 0 8px 0;"><strong style="color: #000000;">Nội dung:</strong></p>
                            <p style="margin: 0 0 24px 0; white-space: pre-wrap; text-align: left; display: inline-block; width: 100%;">${escapeHtml(message)}</p>

                            <p style="margin: 0 0 12px 0;">
                                <strong style="color: #000000;">Lưu ý:</strong> Các yêu cầu đơn giản có thể sẽ không nhận được phản hồi, tuy nhiên chúng tôi vẫn tiến hành xử lý như thông thường.
                            </p>
                            <p style="margin: 0;">
                                Vui lòng <strong style="color: #000000;">KHÔNG</strong> tạo quá nhiều yêu cầu, nếu phát hiện thông tin sai sót, muốn bổ sung hoặc hủy yêu cầu vui lòng phản hồi lại chúng tôi bằng email bên dưới cùng với thông tin ID được nêu bên trên.
                            </p>
                        </td>
                    </tr>

                    <tr>
                        <td align="center" style="font-family: 'Be Vietnam Pro', Arial, sans-serif; font-size: 13px; line-height: 1.6; color: #666666;">
                            Bạn không thể trả lời email này, vui lòng liên hệ qua email <a href="mailto:lienhe@vnbusarchive.io.vn" style="color: #000000; text-decoration: underline; font-weight: 500;">lienhe@vnbusarchive.io.vn</a> để tiếp tục.
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>

</body>
</html>`;
};

async function handleNewsOrHelp(request, env) {
    const url = new URL(request.url);
    const token = env.DISCORD_BOT_TOKEN;
    const type = url.searchParams.get('type') === 'help' ? 'help' : 'news';
    const channelId = type === 'help' ? env.DISCORD_HELP_CHANNEL_ID : env.DISCORD_CHANNEL_ID;
    const id = url.searchParams.get('id');

    const requiredEnv = type === 'help'
        ? ['DISCORD_BOT_TOKEN', 'DISCORD_HELP_CHANNEL_ID']
        : ['DISCORD_BOT_TOKEN', 'DISCORD_CHANNEL_ID'];
    const missingEnv = requiredEnv.filter((name) => !env[name]);

    if (!token || !channelId) {
        return new Response(JSON.stringify({ error: `Missing ${missingEnv.join(', ')} in Environment Variables` }), { status: 500, headers: { 'Content-Type': 'application/json' }});
    }

    try {
        let fetchUrl = `https://discord.com/api/v10/channels/${channelId}/messages`;
        if (id) {
            fetchUrl += `/${encodeURIComponent(id)}`;
        } else {
            fetchUrl += `?limit=${type === 'help' ? 12 : 10}`;
        }

        const response = await fetch(fetchUrl, {
            headers: { Authorization: `Bot ${token}` }
        });

        if (!response.ok) {
            throw new Error(`Discord API error: ${response.status}`);
        }

        const rawData = await response.json();
        const messages = Array.isArray(rawData) ? rawData : [rawData];

        const formattedData = messages.map((msg) => {
            let text = msg.content || '';

            text = text.replace(/<a?:(\w+):\d+>/g, ':$1:');
            text = text.replace(/<@!?\d+>/g, '@user');
            text = text.replace(/<#[^>]+>/g, '#kênh');
            text = text.replace(/<@&\d+>/g, '@role');

            const lines = text.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);

            let title = type === 'help' ? 'Hướng dẫn' : 'Thông báo hệ thống';
            if (lines.length > 0) {
                title = lines[0].replace(/[*_#]/g, '').trim();
                if (title.length > 70) title = `${title.substring(0, 70)}...`;
            }

            let fullContent = text;
            if (msg.attachments && msg.attachments.length > 0) {
                msg.attachments.forEach((att) => {
                    if (att.content_type && att.content_type.startsWith('image/')) {
                        fullContent += `\n\n![${att.filename}](${att.url})`;
                    }
                });
            }

            const dateObj = new Date(msg.timestamp);
            const dateStr = dateObj.toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });

            const firstLine = lines[0] || '';
            let summaryRaw = firstLine ? text.replace(firstLine, '').replace(/\n/g, ' ').trim() : text.replace(/\n/g, ' ').trim();

            let summary = summaryRaw.substring(0, 150);
            if (summaryRaw.length > 150) summary += '...';

            const author = msg.author || {};
            const authorName = author.global_name || author.username || 'Ban Quản Trị';
            const avatarExtension = author.avatar?.startsWith('a_') ? 'gif' : 'png';
            const authorAvatar = author.id && author.avatar
                ? `https://cdn.discordapp.com/avatars/${author.id}/${author.avatar}.${avatarExtension}?size=128`
                : 'https://files.catbox.moe/zzh1q1.png';

            return {
                id: msg.id,
                title,
                summary: summary || 'Nhấn để xem chi tiết...',
                date: dateStr,
                content: fullContent,
                authorName,
                authorAvatar
            };
        });

        return new Response(JSON.stringify(id ? formattedData[0] : formattedData), { status: 200, headers: { 'Content-Type': 'application/json' }});
    } catch (error) {
        console.error('API Error:', error);
        return new Response(JSON.stringify({ error: "Đã xảy ra lỗi hệ thống, vui lòng thử lại sau" }), { status: 500, headers: { 'Content-Type': 'application/json' }});
    }
}

async function handleRoleClaim(request, env) {
    const ROLE_MAP = {
        1: '1519296926477058203',
        50: '1506239795175620728',
        100: '1505158627747561482',
        200: '1505158752372920320',
        500: '1505158986725462078',
        1000: '1505159111686488164'
    };
    const CUSTOM_ROLE_ANCHOR = '1457222204344238110';

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' }});

    const supabaseUrl = env.SUPABASE_URL;
    const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) throw new Error('Invalid token');

        const discordIdentity = user.identities?.find(id => id.provider === 'discord');
        if (!discordIdentity) {
            return new Response(JSON.stringify({ linked: false, inServer: false, claimedRoles: [] }), { status: 200, headers: { 'Content-Type': 'application/json' }});
        }

        const discordUserId = discordIdentity.identity_data?.provider_id || discordIdentity.id;

        const guildId = env.DISCORD_GUILD_ID;
        const botToken = env.DISCORD_BOT_TOKEN;

        const discordRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}`, {
            headers: { 'Authorization': `Bot ${botToken}` }
        });

        if (discordRes.status === 404) {
            return new Response(JSON.stringify({ linked: true, inServer: false, claimedRoles: [] }), { status: 200, headers: { 'Content-Type': 'application/json' }});
        }
        if (!discordRes.ok) throw new Error('Lỗi khi gọi Discord API');

        const memberData = await discordRes.json();
        const currentRoles = memberData.roles || [];

        const body = await request.json();
        const { action, tier, customName, customColor } = body;

        if (action === 'status') {
            const { data: profile } = await supabase.from('profiles').select('discord_custom_role_id').eq('id', user.id).single();
            let customRoleDetails = null;

            if (profile?.discord_custom_role_id) {
                try {
                    const rolesRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
                        headers: { 'Authorization': `Bot ${botToken}` }
                    });
                    if (rolesRes.ok) {
                        const roles = await rolesRes.json();
                        const role = roles.find(r => r.id === profile.discord_custom_role_id);
                        if (role) {
                            customRoleDetails = {
                                name: role.name,
                                color: '#' + role.color.toString(16).padStart(6, '0')
                            };
                        }
                    }
                } catch (e) {
                    console.error('Lỗi khi lấy thông tin custom role:', e);
                }
            }

            return new Response(JSON.stringify({
                linked: true,
                inServer: true,
                claimedRoles: currentRoles,
                customRoleId: profile?.discord_custom_role_id || null,
                customRoleDetails
            }), { status: 200, headers: { 'Content-Type': 'application/json' }});
        }

        const { count, error: countError } = await supabase
            .from('photos')
            .select('*', { count: 'exact', head: true })
            .eq('uploader_id', user.id)
            .eq('status', 'approved');

        if (countError) throw countError;

        if (tier === 2000 && action === 'claim') {
            if (!customName || customName.length < 2 || customName.length > 100) {
                return new Response(JSON.stringify({ error: 'Tên Role phải từ 2-100 ký tự.' }), { status: 400, headers: { 'Content-Type': 'application/json' }});
            }
            if (!customColor || !/^#[0-9A-F]{6}$/i.test(customColor)) {
                return new Response(JSON.stringify({ error: 'Mã màu Hex không hợp lệ.' }), { status: 400, headers: { 'Content-Type': 'application/json' }});
            }
            if ((count || 0) < 2000) {
                return new Response(JSON.stringify({ error: 'Bạn cần 2000 ảnh để tạo Custom Role.' }), { status: 400, headers: { 'Content-Type': 'application/json' }});
            }

            const colorInt = parseInt(customColor.replace('#', ''), 16);
            const { data: profile } = await supabase.from('profiles').select('discord_custom_role_id').eq('id', user.id).single();

            if (profile?.discord_custom_role_id) {
                const updateRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles/${profile.discord_custom_role_id}`, {
                    method: 'PATCH',
                    headers: { 'Authorization': `Bot ${botToken}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: customName, color: colorInt })
                });
                if (!updateRes.ok) throw new Error('Không thể cập nhật Custom Role Discord.');
                return new Response(JSON.stringify({ success: true, message: 'Đã cập nhật Custom Role thành công!' }), { status: 200, headers: { 'Content-Type': 'application/json' }});
            } else {
                const createRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bot ${botToken}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: customName, color: colorInt, hoist: true })
                });
                if (!createRes.ok) throw new Error('Không thể tạo Role Discord.');
                const newRole = await createRes.json();

                const rolesRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
                    headers: { 'Authorization': `Bot ${botToken}` }
                });
                const roles = await rolesRes.json();
                const anchorRole = roles.find(r => r.id === CUSTOM_ROLE_ANCHOR);

                if (anchorRole) {
                    await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
                        method: 'PATCH',
                        headers: { 'Authorization': `Bot ${botToken}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify([{ id: newRole.id, position: Math.max(1, anchorRole.position - 1) }])
                    });
                }

                await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}/roles/${newRole.id}`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bot ${botToken}` }
                });

                await supabase.from('profiles').update({ discord_custom_role_id: newRole.id }).eq('id', user.id);

                return new Response(JSON.stringify({ success: true, message: 'Đã tạo và cấp Custom Role thành công!' }), { status: 200, headers: { 'Content-Type': 'application/json' }});
            }
        }

        if (tier === 2000 && action === 'delete') {
            const { data: profile } = await supabase.from('profiles').select('discord_custom_role_id').eq('id', user.id).single();
            if (profile?.discord_custom_role_id) {
                const deleteRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles/${profile.discord_custom_role_id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bot ${botToken}` }
                });
                
                if (!deleteRes.ok) {
                    console.error("Lỗi xóa role Discord:", await deleteRes.text());
                }

                await supabase.from('profiles').update({ discord_custom_role_id: null }).eq('id', user.id);
                return new Response(JSON.stringify({ success: true, message: 'Đã xóa Custom Role thành công!' }), { status: 200, headers: { 'Content-Type': 'application/json' }});
            } else {
                return new Response(JSON.stringify({ error: 'Bạn không có Custom Role để xóa.' }), { status: 400, headers: { 'Content-Type': 'application/json' }});
            }
        }

        if (action === 'claim' && ROLE_MAP[tier]) {
            const roleId = ROLE_MAP[tier];

            if (tier === 50) {
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('discord_custom_role_id')
                    .eq('id', user.id)
                    .single();
                if (profileError) throw profileError;
                if (profile?.discord_custom_role_id) {
                    return new Response(JSON.stringify({ error: 'Bạn đã nhận phần thưởng này rồi!' }), { status: 400, headers: { 'Content-Type': 'application/json' }});
                }
            } else {
                if (currentRoles.includes(roleId)) {
                    return new Response(JSON.stringify({ error: 'Bạn đã nhận phần thưởng này rồi!' }), { status: 400, headers: { 'Content-Type': 'application/json' }});
                }
            }

            if (count < parseInt(tier)) {
                return new Response(JSON.stringify({ error: `Bạn cần ${tier} ảnh đã duyệt. Hiện tại bạn có ${count} ảnh.` }), { status: 400, headers: { 'Content-Type': 'application/json' }});
            }

            const addRoleRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}/roles/${roleId}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bot ${botToken}` }
            });

            if (!addRoleRes.ok) throw new Error('Bot không thể thêm Role (Hãy kiểm tra phân quyền Role Hierarchy trong Server).');

            return new Response(JSON.stringify({ success: true, message: `Đã cấp Role ${tier}+ ảnh thành công!` }), { status: 200, headers: { 'Content-Type': 'application/json' }});
        }

        return new Response(JSON.stringify({ error: 'Hành động không hợp lệ' }), { status: 400, headers: { 'Content-Type': 'application/json' }});

    } catch (err) {
        console.error("Discord Role API Error:", err);
        return new Response(JSON.stringify({ error: "Đã xảy ra lỗi hệ thống, vui lòng thử lại sau" }), { status: 500, headers: { 'Content-Type': 'application/json' }});
    }
}

async function handleContactSubmit(request, env) {
    const body = await request.json();
    const { topic, description, contactMethod, contactInfo, captcha, userId, userName, photoId, externalLink, originalWork, legalName, copyrightType } = body;

    // 1. Validate CAPTCHA (Đồng bộ cấu hình với upload.js)
    if (!captcha) return new Response(JSON.stringify({ error: 'Thiếu mã Captcha' }), { status: 400 });
    
    // Sử dụng chung biến env.CAPTCHA_SECRET với chức năng upload ảnh (hoặc TURNSTILE_SECRET_KEY nếu có)
    const secretKey = env.CAPTCHA_SECRET || env.TURNSTILE_SECRET_KEY;
    if (!secretKey) {
        console.error("Lỗi cấu hình: Thiếu biến môi trường CAPTCHA_SECRET hoặc TURNSTILE_SECRET_KEY");
        return new Response(JSON.stringify({ error: 'Lỗi cấu hình máy chủ: Thiếu Secret Key của Captcha.' }), { status: 500 });
    }

    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', captcha);

    const captchaVerify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
    });
    
    const captchaResult = await captchaVerify.json();
    
    // Bắt lỗi chi tiết nếu Cloudflare từ chối để dễ debug
    if (!captchaResult.success) {
        console.error("Turnstile Error Codes:", captchaResult['error-codes']);
        return new Response(JSON.stringify({ error: 'Captcha không hợp lệ hoặc đã hết hạn.' }), { status: 400 });
    }

    // 2. Chuyển đổi ID Kênh và Màu sắc theo chủ đề
    const reportChannelId = env.DISCORD_REPORT_CHANNEL_ID;
    if (!reportChannelId) return new Response(JSON.stringify({ error: 'Thiếu config kênh Report' }), { status: 500 });

    const TOPIC_CONFIG = {
        'bug': { title: 'Báo cáo lỗi hệ thống', color: 0xff4444 }, 
        'scam': { title: 'Báo cáo lừa đảo / Hành vi xấu', color: 0xff4444 }, 
        'copyright': { title: 'Báo cáo vi phạm bản quyền ảnh', color: 0xffaa00 }, 
        'report_violation': { title: 'Báo cáo ảnh / bình luận / hồ sơ vi phạm', color: 0xff4444 },
        'bad_photo': { title: 'Tôi thấy có ảnh chưa đạt chuẩn', color: 0xff8800 },
        'appeal': { title: 'Thắc mắc kiểm duyệt / Kháng cáo ảnh từ chối', color: 0x00ccff }, 
        'account': { title: 'Hỗ trợ / Kháng cáo về tài khoản', color: 0x00ccff },
        'general': { title: 'Hỗ trợ chung', color: 0x999999 }, 
        'other': { title: 'Vấn đề khác', color: 0x999999 }
    };
    
    const config = TOPIC_CONFIG[topic] || TOPIC_CONFIG['other'];

    // 3. Xây dựng nội dung RAW chuẩn thứ tự người dùng nhập trên form (Có in đậm tiêu đề và xuống dòng dễ nhìn)
    const ticketId = generateTicketId();
    const requesterStr = userId ? `${userName}/${userId}` : `${userName}`;
    let rawText = `**ID Yêu Cầu:** #${ticketId}\n**Người yêu cầu:**\n${requesterStr}\n\n`;
    rawText += `**1. Chủ đề cần hỗ trợ \\***\n${config.title}\n\n`;

    if (topic === 'copyright') {
        const typeStr = (copyrightType === 'external') ? 'Ảnh trên nền tảng của tôi bị đăng trái luật lên nền tảng bên ngoài' : 'Ảnh của tôi bị đăng trái luật lên nền tảng';
        rawText += `**Hình thức vi phạm \\***\n${typeStr}\n\n`;
    }

    if (photoId) {
        if (String(photoId).startsWith('user:')) {
            const uName = String(photoId).replace('user:', '');
            rawText += `**Hồ sơ User vi phạm \\***\nhttps://www.vnbusarchive.io.vn/user/${encodeURIComponent(uName)}\n\n`;
        } else {
            const titleStr = (topic === 'copyright' || topic === 'report_violation') ? 'Nội dung vi phạm \\*' : 'Nội dung liên quan \\*';
            rawText += `**${titleStr}**\nhttps://www.vnbusarchive.io.vn/photo/${photoId}\n\n`;
        }
    } else if (externalLink) {
        try {
            const parsedUrl = new URL(externalLink);
            if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') throw new Error();
        } catch(e) {
            return new Response(JSON.stringify({ error: 'Đường dẫn liên kết ngoài không hợp lệ (Phải bắt đầu bằng http:// hoặc https://).' }), { status: 400, headers: { 'Content-Type': 'application/json' }});
        }
        let linkTitle = 'Nội dung liên quan \\*';
        if (topic === 'report_violation' || topic === 'copyright') linkTitle = 'Nội dung vi phạm \\*';
        rawText += `**${linkTitle}**\n${externalLink}\n\n`;
    }

    if (legalName) {
        rawText += `**Họ và tên hợp pháp \\***\n${legalName}\n\n`;
    }
    if (originalWork) {
        rawText += `**Minh chứng / Tác phẩm gốc của bạn \\***\n${originalWork}\n\n`;
    }

    let descLabel = 'Mô tả chi tiết vấn đề \\*';
    if (topic === 'copyright' || topic === 'report_violation') descLabel = 'Mô tả chi tiết vi phạm \\*';
    else if (topic === 'appeal') descLabel = 'Lý do bạn cho rằng ảnh hợp lệ \\*';

    rawText += `**${descLabel}**\n${description}\n\n`;

    const METHOD_NAMES = {
        'account_email': 'Email tài khoản',
        'custom_email': 'Email tùy chỉnh',
        'email': 'Email',
        'discord': 'Discord',
        'facebook': 'Facebook'
    };
    const methodName = METHOD_NAMES[contactMethod] || (contactMethod ? contactMethod.toUpperCase() : 'Khác');

    rawText += `**2. Phương thức nhận phản hồi \\***\n${methodName}\n${contactInfo}`;

    const embed = {
        title: `🚨 [Ticket #${ticketId}] ${config.title}`,
        color: config.color,
        description: sanitizeMentions(rawText),
        timestamp: new Date().toISOString()
    };

    // 4. Gửi Request Discord
    const discordPromise = fetch(`https://discord.com/api/v10/channels/${reportChannelId}/messages`, {
        method: 'POST',
        headers: {
            'Authorization': `Bot ${env.DISCORD_BOT_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ embeds: [embed] })
    });

    // 5. Gửi Email tự động cho User qua Resend
    let resendPromise = Promise.resolve();
    if (env.RESEND_API_KEY && contactInfo && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactInfo)) {
        try {
            const resend = new Resend(env.RESEND_API_KEY);
            
            let userMsg = description || '';
            if (topic === 'copyright') {
                const typeStr = (copyrightType === 'external') ? 'Ảnh trên nền tảng của tôi bị đăng trái luật lên nền tảng bên ngoài' : 'Ảnh của tôi bị đăng trái luật lên nền tảng';
                userMsg = `Hình thức vi phạm: ${typeStr}\n\n${userMsg}`;
            }
            if (photoId) {
                if (String(photoId).startsWith('user:')) {
                    const uName = String(photoId).replace('user:', '');
                    userMsg = `Hồ sơ User liên quan: https://www.vnbusarchive.io.vn/user/${encodeURIComponent(uName)}\n\n${userMsg}`;
                } else {
                    const titleStr = (topic === 'copyright' || topic === 'report_violation') ? 'Nội dung vi phạm' : 'Ảnh liên quan';
                    userMsg = `${titleStr}: https://www.vnbusarchive.io.vn/photo/${photoId}\n\n${userMsg}`;
                }
            } else if (externalLink) {
                const titleStr = (topic === 'copyright' || topic === 'report_violation') ? 'Nội dung vi phạm' : 'Link liên quan';
                userMsg = `${titleStr}: ${externalLink}\n\n${userMsg}`;
            }
            if (legalName) {
                userMsg += `\n\nHọ và tên hợp pháp: ${legalName}`;
            }
            if (originalWork) {
                userMsg += `\n\nMinh chứng / Tác phẩm gốc: ${originalWork}`;
            }

            const recipientName = (userName && userName !== 'Khách (Chưa đăng nhập)') ? userName : 'bạn';
            const emailHtml = buildContactEmailHtml({
                name: recipientName,
                ticketId: `#${ticketId}`,
                supportType: config.title,
                message: userMsg
            });

            resendPromise = resend.emails.send({
                from: 'VNBUSARCHIVE <noreply@vnbusarchive.io.vn>',
                to: [contactInfo],
                subject: `[Ticket #${ticketId}] Thông tin hỗ trợ của bạn đã được gửi - VNBUSARCHIVE`,
                html: emailHtml
            });
        } catch (emailErr) {
            console.error("Lỗi khởi tạo Resend email:", emailErr);
        }
    }

    const [discordRes] = await Promise.all([
        discordPromise,
        resendPromise.catch(e => console.error("Lỗi gửi email Resend:", e))
    ]);

    if (!discordRes) {
        return new Response(JSON.stringify({ error: 'Lỗi hệ thống.' }), { status: 500 });
    }
    if (!discordRes.ok) {
        const dErr = await discordRes.text();
        console.error("Lỗi gửi Discord:", dErr);
        return new Response(JSON.stringify({ error: 'Không thể kết nối máy chủ Discord.' }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, ticketId: `#${ticketId}` }), { status: 200, headers: { 'Content-Type': 'application/json' }});
}

export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    
    if (request.method === 'GET') {
        return handleNewsOrHelp(request, env);
    } else if (request.method === 'POST') {
        try {
            // Đọc body một lần duy nhất để phân luồng (Tránh lỗi body already read)
            const clonedReq = request.clone();
            const body = await clonedReq.json();
            
            if (body.action === 'contact_submit') {
                return handleContactSubmit(request, env);
            } else if (body.action === 'claim' || body.action === 'status' || body.action === 'delete') {
                return handleRoleClaim(request, env);
            } else {
                return new Response(JSON.stringify({ error: 'Action không hợp lệ' }), { status: 400 });
            }
        } catch(e) {
            return new Response(JSON.stringify({ error: 'Yêu cầu không hợp lệ' }), { status: 400 });
        }
    }
    
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' }});
}
