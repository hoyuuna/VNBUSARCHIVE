import { createClient } from '@supabase/supabase-js';

export async function onRequest(context) {
    try {
        const { request, env } = context;

        if (request.method !== 'POST') {
            return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
        }

        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split(' ')[1];
        if (!token) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

        const supabaseUrl = env.SUPABASE_URL || 'https://api.vnbusarchive.io.vn';
        const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;
        
        if (!supabaseUrl || !supabaseServiceKey) {
             throw new Error('Missing Supabase URL or Service Key in environment');
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) throw new Error('Invalid token: ' + (authError?.message || 'Unknown'));

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
                    }
                } catch (e) {}

                if (memberStillInGuild && memberRoles.length > 0) {
                    for (const roleId of memberRoles) {
                        try {
                            await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}/roles/${roleId}`, {
                                method: 'DELETE',
                                headers: { 'Authorization': `Bot ${botToken}` }
                            });
                        } catch (e) {}
                    }
                }

                const { data: profile } = await supabase.from('profiles').select('discord_custom_role_id').eq('id', user.id).single();
                if (profile?.discord_custom_role_id) {
                    try {
                        await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles/${profile.discord_custom_role_id}`, {
                            method: 'DELETE',
                            headers: { 'Authorization': `Bot ${botToken}` }
                        });
                    } catch (e) {}
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
