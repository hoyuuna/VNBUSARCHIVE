import { createClient } from '@supabase/supabase-js';

export async function onRequestGet(context) {
    const { request, env } = context;

    try {
        const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ success: false, error: 'Chưa đăng nhập' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const token = authHeader.replace(/^Bearer\s+/i, '').trim();
        const sb = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);
        const { data: { user }, error: authErr } = await sb.auth.getUser(token);

        if (authErr || !user) {
            return new Response(JSON.stringify({ success: false, error: 'Token không hợp lệ' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const sbAdmin = env.SUPABASE_SERVICE_ROLE_KEY ? createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY) : sb;

        const { data: history, error: dbErr } = await sbAdmin
            .from('donations')
            .select('id, order_code, amount, message, status, is_anonymous, created_at')
            .eq('user_id', user.id)
            .in('status', ['PAID', 'PENDING'])
            .order('created_at', { ascending: false });

        if (dbErr) {
            console.error('Error fetching donation history:', dbErr);
            return new Response(JSON.stringify({ success: false, error: 'Không thể lấy lịch sử ủng hộ' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const now = Date.now();
        const validList = [];
        const expiredIds = [];

        for (const item of (history || [])) {
            if (item.status === 'PENDING') {
                const createdTime = new Date(item.created_at).getTime();
                // If pending order is older than 15 minutes, collect for permanent deletion from DB
                if (now - createdTime > 15 * 60 * 1000) {
                    expiredIds.push(item.id);
                    continue;
                }
            }
            validList.push(item);
        }

        // Permanently delete expired pending rows from DB to save database storage
        if (expiredIds.length > 0) {
            sbAdmin.from('donations').delete().in('id', expiredIds).then(() => {}).catch(() => {});
        }

        // Also clean up any lingering cancelled donations older than 20 minutes across the system
        const expiryCutoff = new Date(now - 20 * 60 * 1000).toISOString();
        sbAdmin.from('donations').delete().eq('status', 'PENDING').lt('created_at', expiryCutoff).then(() => {}).catch(() => {});
        sbAdmin.from('donations').delete().eq('status', 'CANCELLED').then(() => {}).catch(() => {});

        return new Response(JSON.stringify({
            success: true,
            data: validList
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
        });

    } catch (err) {
        console.error('Error in donate/history:', err);
        return new Response(JSON.stringify({ success: false, error: 'Lỗi máy chủ' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
