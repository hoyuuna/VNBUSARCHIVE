import { createClient } from '@supabase/supabase-js';

export async function onRequestGet(context) {
    const { request, env } = context;

    try {
        const sb = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);
        const sbAdmin = env.SUPABASE_SERVICE_ROLE_KEY ? createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY) : sb;

        const { data: supporters, error: dbErr } = await sbAdmin
            .from('donations')
            .select('id, donor_name, amount, message, is_anonymous, created_at')
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

        const cleanList = (supporters || []).map(item => ({
            id: item.id,
            donor_name: item.is_anonymous ? 'Nhà hảo tâm ẩn danh' : (item.donor_name || 'Thành viên VNBUSARCHIVE'),
            amount: item.amount,
            message: item.message || '',
            is_anonymous: item.is_anonymous,
            created_at: item.created_at
        }));

        return new Response(JSON.stringify({
            success: true,
            data: cleanList
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=60, s-maxage=60'
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
