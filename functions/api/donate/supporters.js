import { createClient } from '@supabase/supabase-js';

// Worker-level in-memory cache to reduce database load
let memoryCache = {
    data: null,
    timestamp: 0
};
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

export async function onRequestGet(context) {
    const { request, env } = context;

    const url = new URL(request.url);
    const forceRefresh = url.searchParams.get('force') === '1' || url.searchParams.get('t');

    // Return in-memory cached response if valid and not force-refreshed
    if (!forceRefresh && memoryCache.data && (Date.now() - memoryCache.timestamp < CACHE_TTL_MS)) {
        return new Response(memoryCache.data, {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=120',
                'x-cache': 'HIT-MEMORY'
            }
        });
    }

    try {
        const sb = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);
        const sbAdmin = env.SUPABASE_SERVICE_ROLE_KEY ? createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY) : sb;

        // Fetch top 50 paid donations (recent supporters list)
        const { data: supporters, error: dbErr } = await sbAdmin
            .from('donations')
            .select('id, user_id, donor_name, amount, message, is_anonymous, created_at')
            .eq('status', 'PAID')
            .order('created_at', { ascending: false })
            .limit(50);

        if (dbErr) {
            console.error('Error fetching supporters:', dbErr);
            return new Response(JSON.stringify({ success: false, data: [] }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const userIds = [...new Set((supporters || []).filter(s => !s.is_anonymous && s.user_id).map(s => s.user_id))];
        let profileMap = {};
        let photoCountMap = {};

        if (userIds.length > 0) {
            // 1. Batch fetch profiles
            const { data: profiles } = await sbAdmin
                .from('profiles')
                .select('id, username, avatar_url')
                .in('id', userIds);

            if (profiles) {
                profiles.forEach(p => {
                    profileMap[p.id] = p;
                });
            }

            // 2. Fetch approved photo counts using PostgREST HTTP HEAD (head: true)
            // Zero-body payload transfer; utilizes Postgres index count scan
            await Promise.all(userIds.map(async (uid) => {
                try {
                    const { count } = await sbAdmin
                        .from('photos')
                        .select('*', { count: 'exact', head: true })
                        .eq('uploader_id', uid)
                        .eq('status', 'approved');
                    photoCountMap[uid] = count || 0;
                } catch (e) {
                    photoCountMap[uid] = 0;
                }
            }));
        }

        const cleanList = (supporters || []).map(item => {
            const isAnon = !!item.is_anonymous;
            const prof = (!isAnon && item.user_id) ? profileMap[item.user_id] : null;
            const username = prof?.username || (!isAnon ? item.donor_name : null);
            const avatarUrl = prof?.avatar_url || null;
            const photoCount = (!isAnon && item.user_id) ? (photoCountMap[item.user_id] ?? 0) : null;

            return {
                id: item.id,
                donor_name: isAnon ? 'Nhà hảo tâm ẩn danh' : (username || 'Nhà hảo tâm'),
                username: isAnon ? null : username,
                avatar_url: isAnon ? null : avatarUrl,
                photo_count: photoCount,
                amount: item.amount,
                message: item.message || '',
                is_anonymous: isAnon,
                created_at: item.created_at
            };
        });

        const jsonString = JSON.stringify({
            success: true,
            data: cleanList
        });

        // Cache in memory for subsequent worker requests
        memoryCache = {
            data: jsonString,
            timestamp: Date.now()
        };

        return new Response(jsonString, {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=120',
                'x-cache': 'MISS'
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
