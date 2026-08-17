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
                // Remove custom role if exists
                const { data: profile } = await supabase.from('profiles').select('discord_custom_role_id').eq('id', user.id).single();
                if (profile?.discord_custom_role_id) {
                    await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles/${profile.discord_custom_role_id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bot ${botToken}` }
                    });
                    await supabase.from('profiles').update({ discord_custom_role_id: null }).eq('id', user.id);
                }

                // Remove all tier roles
                const tierRoles = [
                    env.DISCORD_ROLE_50,
                    env.DISCORD_ROLE_200,
                    env.DISCORD_ROLE_500,
                    env.DISCORD_ROLE_1000,
                    env.DISCORD_ROLE_2000
                ].filter(Boolean);

                for (const roleId of tierRoles) {
                    await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}/roles/${roleId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bot ${botToken}` }
                    });
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
