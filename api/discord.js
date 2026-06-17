import { createClient } from '@supabase/supabase-js';

async function handleNewsOrHelp(req, res) {
    const token = process.env.DISCORD_BOT_TOKEN;
    const type = req.query.type === 'help' ? 'help' : 'news';
    const channelId = type === 'help' ? process.env.DISCORD_HELP_CHANNEL_ID : process.env.DISCORD_CHANNEL_ID;
    const id = req.query.id;

    const requiredEnv = type === 'help'
        ? ['DISCORD_BOT_TOKEN', 'DISCORD_HELP_CHANNEL_ID']
        : ['DISCORD_BOT_TOKEN', 'DISCORD_CHANNEL_ID'];
    const missingEnv = requiredEnv.filter((name) => !process.env[name]);

    if (!token || !channelId) {
        return res.status(500).json({ error: `Missing ${missingEnv.join(', ')} in Environment Variables` });
    }

    try {
        let url = `https://discord.com/api/v10/channels/${channelId}/messages`;
        if (id) {
            url += `/${encodeURIComponent(id)}`;
        } else {
            url += `?limit=${type === 'help' ? 12 : 10}`;
        }

        const response = await fetch(url, {
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
                : 'https://wsrv.nl/?url=https://files.catbox.moe/zzh1q1.png&we';

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

        return res.status(200).json(id ? formattedData[0] : formattedData);
    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: error.message });
    }
}

async function handleRoleClaim(req, res) {
    const ROLE_MAP = {
        50: '1506239795175620728',
        100: '1505158627747561482',
        200: '1505158752372920320',
        500: '1505158986725462078',
        1000: '1505159111686488164'
    };
    const CUSTOM_ROLE_ANCHOR = '1457222204344238110';

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) throw new Error('Invalid token');

        const discordIdentity = user.identities?.find(id => id.provider === 'discord');
        if (!discordIdentity) {
            return res.status(200).json({ linked: false, inServer: false, claimedRoles: [] });
        }

        const discordUserId = discordIdentity.identity_data?.provider_id || discordIdentity.id;

        const guildId = process.env.DISCORD_GUILD_ID;
        const botToken = process.env.DISCORD_BOT_TOKEN;

        const discordRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}`, {
            headers: { 'Authorization': `Bot ${botToken}` }
        });

        if (discordRes.status === 404) {
            return res.status(200).json({ linked: true, inServer: false, claimedRoles: [] });
        }
        if (!discordRes.ok) throw new Error('Lỗi khi gọi Discord API');

        const memberData = await discordRes.json();
        const currentRoles = memberData.roles || [];

        const { action, tier, customName, customColor } = req.body;

        if (action === 'status') {
            const { data: profile } = await supabase.from('profiles').select('discord_custom_role_id').eq('id', user.id).single();
            return res.status(200).json({
                linked: true,
                inServer: true,
                claimedRoles: currentRoles,
                customRoleId: profile?.discord_custom_role_id || null
            });
        }

        const { count, error: countError } = await supabase
            .from('photos')
            .select('*', { count: 'exact', head: true })
            .eq('uploader_id', user.id)
            .eq('status', 'approved');

        if (countError) throw countError;

        if (tier === 1500 && action === 'claim') {
            if (!customName || customName.length < 2 || customName.length > 100) {
                return res.status(400).json({ error: 'Tên Role phải từ 2-100 ký tự.' });
            }
            if (!customColor || !/^#[0-9A-F]{6}$/i.test(customColor)) {
                return res.status(400).json({ error: 'Mã màu Hex không hợp lệ.' });
            }
            if ((count || 0) < 1500) {
                return res.status(400).json({ error: 'Bạn cần 1500 ảnh để tạo Custom Role.' });
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
                return res.status(200).json({ success: true, message: 'Đã cập nhật Custom Role thành công!' });
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

                return res.status(200).json({ success: true, message: 'Đã tạo và cấp Custom Role thành công!' });
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
                    return res.status(400).json({ error: 'Bạn đã nhận phần thưởng này rồi!' });
                }
            } else {
                if (currentRoles.includes(roleId)) {
                    return res.status(400).json({ error: 'Bạn đã nhận phần thưởng này rồi!' });
                }
            }

            if (count < parseInt(tier)) {
                return res.status(400).json({ error: `Bạn cần ${tier} ảnh đã duyệt. Hiện tại bạn có ${count} ảnh.` });
            }

            const addRoleRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}/roles/${roleId}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bot ${botToken}` }
            });

            if (!addRoleRes.ok) throw new Error('Bot không thể thêm Role (Hãy kiểm tra phân quyền Role Hierarchy trong Server).');

            return res.status(200).json({ success: true, message: `Đã cấp Role ${tier}+ ảnh thành công!` });
        }

        return res.status(400).json({ error: 'Hành động không hợp lệ' });

    } catch (err) {
        console.error("Discord Role API Error:", err);
        return res.status(500).json({ error: err.message });
    }
}

export default async function handler(req, res) {
    if (req.method === 'GET') {
        return handleNewsOrHelp(req, res);
    } else if (req.method === 'POST') {
        // Here we expect req.body.action to be 'status' or 'claim' as sent by the original _core.html
        return handleRoleClaim(req, res);
    }
    
    return res.status(405).json({ error: 'Method Not Allowed' });
}
