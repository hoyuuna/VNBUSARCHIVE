import { createClient } from '@supabase/supabase-js';

export async function onRequestGet(context) {
    const { request, env } = context;

    try {
        const sb = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);
        const sbAdmin = env.SUPABASE_SERVICE_ROLE_KEY ? createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY) : sb;

        const { data: supporters, error: dbErr } = await sbAdmin
            .from('donations')
            .select('id, user_id, donor_name, amount, message, is_anonymous, created_at')
            .eq('status', 'PAID')
            .order('created_at', { ascending: false })
            .limit(30);

        if (dbErr) {
            console.error('Error fetching supporters:', dbErr);
            return new Response(JSON.stringify({ success: false, data: [] }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const userIds = [...new Set((supporters || []).filter(s => !s.is_anonymous && s.user_id).map(s => s.user_id))];
        let profileMap = {};
        if (userIds.length > 0) {
            const { data: profiles } = await sbAdmin
                .from('profiles')
                .select('id, username, avatar_url')
                .in('id', userIds);
            if (profiles) {
                profiles.forEach(p => {
                    profileMap[p.id] = p;
                });
            }
        }

        const cleanList = (supporters || []).map(item => {
            const isAnon = !!item.is_anonymous;
            const prof = (!isAnon && item.user_id) ? profileMap[item.user_id] : null;
            const username = prof?.username || (!isAnon ? item.donor_name : null);
            const avatarUrl = prof?.avatar_url || null;

            return {
                id: item.id,
                donor_name: isAnon ? 'Nhà hảo tâm ẩn danh' : (username || 'Thành viên VNBUSARCHIVE'),
                username: isAnon ? null : username,
                avatar_url: isAnon ? null : avatarUrl,
                amount: item.amount,
                message: item.message || '',
                is_anonymous: isAnon,
                created_at: item.created_at
            };
        });

        return new Response(JSON.stringify({
            success: true,
            data: cleanList
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=30, s-maxage=30'
            }
        });

    } catch (err) {
        console.error('Error in donate/supporters:', err);
        return new Response(JSON.stringify({ success: false, data: [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
