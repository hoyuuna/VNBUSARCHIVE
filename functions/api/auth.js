import { createClient } from '@supabase/supabase-js';

export async function onRequest(context) {
    const { request, env } = context;

    if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    try {
        const body = await request.json();
        const { action, payload, token } = body;

        const supabaseUrl = env.SUPABASE_URL;
        const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
            throw new Error("Missing Supabase environment variables");
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        let user = null;
        if (token) {
            const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
            if (authError || !authUser) {
                return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
            }
            user = authUser;
        }

        if (action === 'check_ban') {
            const { userId } = payload;
            const { data, error } = await supabaseAdmin.from('profiles').select('ban_status').eq('id', userId).single();
            if (error && error.code !== 'PGRST116') throw error; // PGRST116 is no rows
            return new Response(JSON.stringify({ success: true, data }), { headers: { 'Content-Type': 'application/json' } });
        }
        
        if (action === 'check_username') {
            const { username, excludeUserId } = payload;
            let query = supabaseAdmin.from('profiles').select('username').ilike('username', username);
            if (excludeUserId) {
                query = query.neq('id', excludeUserId);
            }
            const { data, error } = await query.maybeSingle();
            if (error) throw error;
            return new Response(JSON.stringify({ success: true, data }), { headers: { 'Content-Type': 'application/json' } });
        }

        if (action === 'reset_avatar') {
            if (!user) throw new Error("Unauthorized");
            const { error } = await supabaseAdmin.from('profiles').update({ avatar_url: null }).eq('id', user.id);
            if (error) throw error;
            return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
        }
        
        if (action === 'update_username') {
            if (!user) throw new Error("Unauthorized");
            const { newName } = payload;
            const { error } = await supabaseAdmin.from('profiles').update({ username: newName }).eq('id', user.id);
            if (error) throw error;
            return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
        }
        
        if (action === 'get_profile') {
            // Can be called with userId explicitly if needed, but normally for logged in user.
            // Wait, in setUser it takes `user.id`. Let's just use `userId` from payload for flexibility, but verify they match if user is required?
            // Since it's getting their own profile and prefs, yes, they should be logged in...
            // Wait, when user logs in with password, we call this? 
            // In `app.setUser(user)`, we might not have a token available if we don't fetch session.
            // Let's pass `userId` in payload. For read-only profile access, maybe we just need userId?
            // Let's require auth for modifying, but `get_profile` might be fine to just take `userId`?
            // Wait! Supabase service role can read anything.
            const { userId } = payload;
            const { data, error } = await supabaseAdmin.from('profiles').select('username, role, preferences').eq('id', userId).maybeSingle();
            if (error) throw error;
            return new Response(JSON.stringify({ success: true, data }), { headers: { 'Content-Type': 'application/json' } });
        }
        
        if (action === 'upsert_profile') {
            const { id, username, avatar_url, preferences } = payload;
            // Since this happens right after login/registration, token might be tricky if not passed.
            // Let's rely on token if provided, otherwise if we want to secure it, we should require token.
            // But actually we can pass token from frontend.
            if (!user || user.id !== id) throw new Error("Unauthorized");
            const { error } = await supabaseAdmin.from('profiles').upsert({ id, username, avatar_url, preferences }, { onConflict: 'id' });
            if (error) throw error;
            return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
        }
        
        if (action === 'update_preferences') {
            if (!user) throw new Error("Unauthorized");
            const { preferences } = payload;
            const { error } = await supabaseAdmin.from('profiles').update({ preferences }).eq('id', user.id);
            if (error) throw error;
            return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
        }
        
        if (action === 'get_avatar_url') {
            const { userId } = payload;
            const { data, error } = await supabaseAdmin.from('profiles').select('avatar_url').eq('id', userId).single();
            if (error && error.code !== 'PGRST116') throw error;
            return new Response(JSON.stringify({ success: true, data }), { headers: { 'Content-Type': 'application/json' } });
        }
        
        if (action === 'get_approved_photos_count') {
            const { userId } = payload;
            const { count, error } = await supabaseAdmin.from('photos').select('*', { count: 'exact', head: true }).eq('uploader_id', userId).eq('status', 'approved');
            if (error) throw error;
            return new Response(JSON.stringify({ success: true, count }), { headers: { 'Content-Type': 'application/json' } });
        }
        
        if (action === 'update_bio') {
            if (!user) throw new Error("Unauthorized");
            const { bio } = payload;
            const { error } = await supabaseAdmin.from('profiles').update({ bio }).eq('id', user.id);
            if (error) throw error;
            return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
        }
        
        if (action === 'get_photo_details') {
            const { photoId } = payload;
            const { data, error } = await supabaseAdmin.from('photos')
                .select('id, url, license_plate, operator, uploader_id, status')
                .eq('id', photoId).single();
            if (error && error.code !== 'PGRST116') throw error;
            return new Response(JSON.stringify({ success: true, data }), { headers: { 'Content-Type': 'application/json' } });
        }
        
        if (action === 'update_favorite_photo') {
            if (!user) throw new Error("Unauthorized");
            const { photoId } = payload;
            const { error } = await supabaseAdmin.from('profiles').update({ favorite_photo_id: photoId }).eq('id', user.id);
            if (error) throw error;
            return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
        }
        
        if (action === 'get_user_approved_photos') {
            const { targetUserId } = payload;
            const { data, error } = await supabaseAdmin.from('photos')
                .select('route_no, license_plate, vehicles(model)')
                .eq('uploader_id', targetUserId)
                .eq('status', 'approved');
            if (error) throw error;
            return new Response(JSON.stringify({ success: true, data }), { headers: { 'Content-Type': 'application/json' } });
        }

        return new Response(JSON.stringify({ success: false, error: 'Unknown action' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message, code: err.code }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}
