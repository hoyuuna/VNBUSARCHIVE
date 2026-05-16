import { createClient } from '@supabase/supabase-js';

const ROLE_MAP = {
    100: '1505158627747561482',
    200: '1505158752372920320',
    500: '1505158986725462078',
    1000: '1505159111686488164'
};

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

        const { action, tier } = req.body;

        if (action === 'status') {
            return res.status(200).json({
                linked: true,
                inServer: true,
                claimedRoles: currentRoles
            });
        }

        if (action === 'claim' && ROLE_MAP[tier]) {
            const roleId = ROLE_MAP[tier];

            if (currentRoles.includes(roleId)) {
                return res.status(400).json({ error: 'Bạn đã nhận phần thưởng này rồi!' });
            }

            const { count, error: countError } = await supabase
                .from('photos')
                .select('*', { count: 'exact', head: true })
                .eq('uploader_id', user.id)
                .eq('status', 'approved');

            if (countError) throw countError;

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