import { createClient } from '@supabase/supabase-js';

export async function onRequest(context) {
    const { request, env } = context;
    
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ success: false, error: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' }});
    }

    try {
        const body = await request.json();
        const { action, payload, token } = body;

        const supabaseAdmin = createClient(
            env.SUPABASE_URL,
            env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_KEY, 
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // get_comments is public, no token required
        if (action === 'get_comments') {
            const { photoId, page = 1, limit = 12 } = payload;
            const from = (page - 1) * limit;
            const to = from + limit - 1;

            const { count: totalCount } = await supabaseAdmin
                .from('photo_comments')
                .select('*', { count: 'exact', head: true })
                .eq('photo_id', photoId);

            let result = await supabaseAdmin
                .from('photo_comments')
                .select('*, profiles(id, username, avatar_url, role, subroles)', { count: 'exact' })
                .eq('photo_id', photoId)
                .is('parent_id', null)
                .order('created_at', { ascending: false })
                .range(from, to);

            let parents = result.data;
            let useThreads = true;

            if (result.error) {
                useThreads = false;
                result = await supabaseAdmin
                    .from('photo_comments')
                    .select('*, profiles(id, username, avatar_url, role, subroles)', { count: 'exact' })
                    .eq('photo_id', photoId)
                    .order('created_at', { ascending: false })
                    .range(from, to);
                parents = result.data;
            }

            let repliesMap = {};
            if (useThreads && parents && parents.length > 0) {
                const parentIds = parents.map(p => p.id);
                const { data: replies } = await supabaseAdmin
                    .from('photo_comments')
                    .select('*, profiles(id, username, avatar_url, role, subroles)')
                    .in('parent_id', parentIds)
                    .order('created_at', { ascending: true });
                if (replies) {
                    replies.forEach(r => {
                        if (!repliesMap[r.parent_id]) repliesMap[r.parent_id] = [];
                        repliesMap[r.parent_id].push(r);
                    });
                }
            }

            return new Response(JSON.stringify({
                success: true,
                parents,
                repliesMap,
                totalCount: totalCount || 0,
                count: result.count
            }), { status: 200, headers: { 'Content-Type': 'application/json' }});
        }

        // Actions requiring token
        let user = null;
        if (token) {
            const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
            if (!authError && authData.user) user = authData.user;
        }

        if (!user) throw new Error("Xác thực thất bại, token không hợp lệ hoặc đã hết hạn.");

        if (action === 'get_dashboard') {
            const { data: myComments } = await supabaseAdmin.from('photo_comments').select('id').eq('user_id', user.id);
            const myCommentIds = myComments ? myComments.map(c => c.id).slice(0, 500) : [];

            const p1 = supabaseAdmin
                .from('photo_comments')
                .select('*, photos!inner(license_plate, url, uploader_id, id), profiles(username, avatar_url, role, subroles)')
                .eq('photos.uploader_id', user.id);

            let p2 = null;
            if (myCommentIds.length > 0) {
                p2 = supabaseAdmin
                    .from('photo_comments')
                    .select('*, photos!inner(license_plate, url, uploader_id, id), profiles(username, avatar_url, role, subroles)')
                    .in('parent_id', myCommentIds);
            }

            const [res1, res2] = await Promise.all([p1, p2 || Promise.resolve({ data: [] })]);
            if (res1.error) throw res1.error;
            if (res2.error) throw res2.error;

            const combinedData = [...(res1.data || []), ...(res2.data || [])];
            const uniqueDataMap = new Map();
            combinedData.forEach(item => { uniqueDataMap.set(item.id, item); });

            const data = Array.from(uniqueDataMap.values())
                              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            return new Response(JSON.stringify({ success: true, data, myCommentIds }), { status: 200, headers: { 'Content-Type': 'application/json' }});
        }

        if (action === 'post_comment') {
            const { photo_id, content, parent_id } = payload;
            const insertData = { photo_id, user_id: user.id, content };
            if (parent_id) insertData.parent_id = parent_id;

            let { data, error } = await supabaseAdmin.from('photo_comments').insert(insertData).select().single();
            if (error && parent_id) {
                delete insertData.parent_id;
                const retry = await supabaseAdmin.from('photo_comments').insert(insertData).select().single();
                error = retry.error;
                data = retry.data;
            }

            if (error) throw error;
            return new Response(JSON.stringify({ success: true, data }), { status: 200, headers: { 'Content-Type': 'application/json' }});
        }

        if (action === 'delete_comment') {
            const { id } = payload;
            
            // Check if user is admin/manager or owner
            const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
            const isAdminOrManager = profile && (profile.role === 'admin' || profile.role === 'manager');
            
            const { data: comment } = await supabaseAdmin.from('photo_comments').select('user_id').eq('id', id).single();
            if (!comment) throw new Error("Không tìm thấy bình luận.");

            if (!isAdminOrManager && comment.user_id !== user.id) {
                throw new Error("Truy cập bị từ chối: Bạn không có quyền xóa bình luận này.");
            }

            const { error } = await supabaseAdmin.from('photo_comments').delete().or(`id.eq.${id},parent_id.eq.${id}`);
            if (error) throw error;
            return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' }});
        }

        return new Response(JSON.stringify({ success: false, error: 'Hành động không hợp lệ' }), { status: 400, headers: { 'Content-Type': 'application/json' }});

    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 400, headers: { 'Content-Type': 'application/json' }});
    }
}
