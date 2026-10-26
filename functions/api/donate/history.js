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
            .eq('status', 'PAID')
            .order('created_at', { ascending: false });

        if (dbErr) {
            console.error('Error fetching donation history:', dbErr);
            return new Response(JSON.stringify({ success: false, error: 'Không thể lấy lịch sử ủng hộ' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({
            success: true,
            data: history || []
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
