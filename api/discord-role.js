import { createClient } from '@supabase/supabase-js';

const ROLE_MAP = {
    50: '1506239795175620728',
    100: '1505158627747561482',
    200: '1505158752372920320',
    500: '1505158986725462078',
    1000: '1505159111686488164'
};

const CUSTOM_ROLE_ANCHOR = '1457222204344238110';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

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