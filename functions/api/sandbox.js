import { createClient } from '@supabase/supabase-js';

export async function onRequest(context) {
    const { request, env } = context;
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ success: false, error: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' }});
    }

    try {
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

        const body = await request.json();
        const { ids } = body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return new Response(JSON.stringify({ success: true, data: [] }), { status: 200, headers: { 'Content-Type': 'application/json' }});
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

        let query = supabaseAdmin.from('image_sandbox').select('id, base64_data').in('id', ids);
        if (!isManagerOrAdmin) {
            query = query.eq('uploader_id', user.id);
        }

        const { data: sandboxData, error: dbErr } = await query;
        if (dbErr) throw dbErr;

        return new Response(JSON.stringify({ success: true, data: sandboxData || [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (e) {
        console.error('[API /api/sandbox Error]:', e);
        return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' }});
    }
}
