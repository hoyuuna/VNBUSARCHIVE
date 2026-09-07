import { createClient } from '@supabase/supabase-js';

export async function onRequest(context) {
    const { request, env } = context;

    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
    }

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const supabaseUrl = env.SUPABASE_URL;
    const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) throw new Error('Invalid token');

        let body;
        try {
            body = await request.json();
        } catch (e) {
            return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
        }

        const { provider } = body;
        if (!provider) {
            return new Response(JSON.stringify({ error: 'Missing provider' }), { status: 400 });
        }

        const identity = user.identities?.find(id => id.provider === provider);
        if (!identity) {
            return new Response(JSON.stringify({ error: 'Identity not found' }), { status: 400 });
        }

        // --- DISCORD UNLINK LOGIC ---
        if (provider === 'discord') {
            const discordUserId = identity.identity_data?.provider_id || identity.id;
            const guildId = env.DISCORD_GUILD_ID;
            const botToken = env.DISCORD_BOT_TOKEN;

            if (guildId && botToken) {
                // 1) Lấy toàn bộ role hiện tại của member trên guild (nếu user đã thoát server -> bỏ qua phần này)
                let memberRoles = [];
                let memberStillInGuild = false;
                try {
                    const memberRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}`, {
                        headers: { 'Authorization': `Bot ${botToken}` }
                    });
                    if (memberRes.ok) {
                        memberStillInGuild = true;
                        const memberData = await memberRes.json();
                        memberRoles = Array.isArray(memberData.roles) ? memberData.roles : [];
                    } else if (memberRes.status === 404) {
                        // User đã thoát khỏi server -> kệ theo yêu cầu
                        console.log(`[unlink] Discord user ${discordUserId} không còn trong guild, bỏ qua gỡ role trực tiếp.`);
                    } else {
                        console.error(`[unlink] Discord API trả ${memberRes.status} khi lấy member.`);
                    }
                } catch (e) {
                    console.error('[unlink] Lỗi khi gọi Discord GET member:', e);
                }

                // 2) Gỡ TẤT CẢ role (kể cả role verified / badge ảnh do admin gán thủ công) khỏi member
                if (memberStillInGuild && memberRoles.length > 0) {
                    for (const roleId of memberRoles) {
                        try {
                            await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}/roles/${roleId}`, {
                                method: 'DELETE',
                                headers: { 'Authorization': `Bot ${botToken}` }
                            });
                        } catch (e) {
                            console.error(`[unlink] Lỗi khi gỡ role ${roleId}:`, e);
                        }
                    }
                }

                // 3) Xóa Custom Role (nếu có) và cập nhật DB
                const { data: profile } = await supabase.from('profiles').select('discord_custom_role_id').eq('id', user.id).single();
                if (profile?.discord_custom_role_id) {
                    try {
                        await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles/${profile.discord_custom_role_id}`, {
                            method: 'DELETE',
                            headers: { 'Authorization': `Bot ${botToken}` }
                        });
                    } catch (e) {
                        console.error('[unlink] Lỗi khi xóa custom role Discord:', e);
                    }
                    await supabase.from('profiles').update({ discord_custom_role_id: null }).eq('id', user.id);
                }
            }
        }

        // --- GITHUB UNLINK LOGIC ---
        if (provider === 'github') {
            const { data: profile } = await supabase.from('profiles').select('subroles').eq('id', user.id).single();
            if (profile?.subroles && profile.subroles.includes('dev')) {
                const newSubroles = profile.subroles.filter(r => r !== 'dev');
                await supabase.from('profiles').update({ subroles: newSubroles }).eq('id', user.id);
            }
        }

        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' }});

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' }});
    }
}
