import { createClient } from '@supabase/supabase-js';

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
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' }});
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
            return new Response(JSON.stringify({
                linked: true,
                inServer: true,
                claimedRoles: currentRoles,
                customRoleId: profile?.discord_custom_role_id || null
            }), { status: 200, headers: { 'Content-Type': 'application/json' }});
        }

        const { count, error: countError } = await supabase
            .from('photos')
            .select('*', { count: 'exact', head: true })
            .eq('uploader_id', user.id)
            .eq('status', 'approved');

        if (countError) throw countError;

        if (tier === 1500 && action === 'claim') {
            if (!customName || customName.length < 2 || customName.length > 100) {
                return new Response(JSON.stringify({ error: 'Tên Role phải từ 2-100 ký tự.' }), { status: 400, headers: { 'Content-Type': 'application/json' }});
            }
            if (!customColor || !/^#[0-9A-F]{6}$/i.test(customColor)) {
                return new Response(JSON.stringify({ error: 'Mã màu Hex không hợp lệ.' }), { status: 400, headers: { 'Content-Type': 'application/json' }});
            }
            if ((count || 0) < 1500) {
                return new Response(JSON.stringify({ error: 'Bạn cần 1500 ảnh để tạo Custom Role.' }), { status: 400, headers: { 'Content-Type': 'application/json' }});
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
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' }});
    }
}

export async function onRequest(context) {
    const { request, env } = context;
    if (request.method === 'GET') {
        return handleNewsOrHelp(request, env);
    } else if (request.method === 'POST') {
        return handleRoleClaim(request, env);
    }
    
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' }});
}
