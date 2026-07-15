import { createClient } from '@supabase/supabase-js';

export async function onRequest(context) {
    const { request, env } = context;
    if (request.method !== 'GET') {
        return new Response(JSON.stringify({ success: false, error: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' }});
    }

    try {
        const url = new URL(request.url);
        const id = url.searchParams.get('id');
        const status = url.searchParams.get('status');

        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ success: false, error: 'Chưa xác thực.' }), { status: 401, headers: { 'Content-Type': 'application/json' }});
        }

        const supabase = createClient(
            env.SUPABASE_URL,
            env.SUPABASE_KEY,
            { global: { headers: { Authorization: authHeader } } }
        );

        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !user) {
            return new Response(JSON.stringify({ success: false, error: 'Token không hợp lệ.' }), { status: 401, headers: { 'Content-Type': 'application/json' }});
        }

        if (!env.SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
        }

        const supabaseAdmin = createClient(
            env.SUPABASE_URL,
            env.SUPABASE_SERVICE_ROLE_KEY,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
        const isManagerOrAdmin = profile && (profile.role === 'admin' || profile.role === 'manager');

        if (id) {
            let query = supabaseAdmin
                .from('photos')
                .select(`*, profiles(id, username, avatar_url, role, subroles, ban_status), vehicles(model)`)
                .eq('id', id);

            if (!isManagerOrAdmin) {
                // User bình thường chỉ đọc được ảnh approved hoặc ảnh của chính họ
                query = query.or(`status.eq.approved,uploader_id.eq.${user.id}`);
            }

            const { data: photo, error: dbErr } = await query.maybeSingle();
            if (dbErr) throw dbErr;

            return new Response(JSON.stringify({ success: true, data: photo }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (status) {
            if (!isManagerOrAdmin) {
                return new Response(JSON.stringify({ success: false, error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' }});
            }

            const { data: photos, error: dbErr } = await supabaseAdmin
                .from('photos')
                .select('*, profiles(username, role), vehicles(model)')
                .eq('status', status)
                .order('created_at', { ascending: false })
                .limit(500);

            if (dbErr) throw dbErr;

            return new Response(JSON.stringify({ success: true, data: photos || [] }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ success: false, error: 'Missing parameters' }), { status: 400, headers: { 'Content-Type': 'application/json' }});

    } catch (e) {
        console.error('[API /api/photo Error]:', e);
        return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' }});
    }
}
