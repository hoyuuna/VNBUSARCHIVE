import { createClient } from '@supabase/supabase-js';

export async function onRequest(context) {
    if (context.request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    try {
        const body = await context.request.json();
        const { action, payload, token } = body;

        const supabase = createClient(
            context.env.SUPABASE_URL,
            context.env.SUPABASE_SERVICE_ROLE_KEY || context.env.SUPABASE_KEY,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        let user = null;
        if (token) {
            const { data: { user: authUser }, error } = await supabase.auth.getUser(token);
            if (!error && authUser) {
                user = authUser;
            }
        }

        let resultData = null;
        let resultError = null;

        switch (action) {
            case 'unlike_photo':
                if (!user) throw new Error("Unauthorized");
                ({ error: resultError } = await supabase.from('photo_likes').delete().eq('photo_id', payload.photoId).eq('user_id', user.id));
                break;
            case 'like_photo':
                if (!user) throw new Error("Unauthorized");
                ({ error: resultError } = await supabase.from('photo_likes').insert({ photo_id: payload.photoId, user_id: user.id }));
                break;
            case 'check_role':
                if (!user) throw new Error("Unauthorized");
                ({ data: resultData, error: resultError } = await supabase.from('profiles').select('role').eq('id', user.id).single());
                break;
            case 'get_profile':
                ({ data: resultData, error: resultError } = await supabase.from('profiles').select('id, username, avatar_url, role, subroles, bio, favorite_photo_id').eq('username', payload.username).single());
                break;
            case 'get_user_profile_stats':
                ({ data: resultData, error: resultError } = await supabase.rpc('get_user_profile_stats', { target_user_id: payload.targetUserId, is_own_profile: payload.isOwnProfile }));
                break;
            case 'get_user_approved_count':
                const resApp = await supabase.from('photos').select('*', { count: 'exact', head: true }).eq('uploader_id', payload.targetUserId).eq('status', 'approved');
                resultData = resApp.count;
                resultError = resApp.error;
                break;
            case 'get_user_denied_count':
                const resDen = await supabase.from('photos').select('*', { count: 'exact', head: true }).eq('uploader_id', payload.targetUserId).eq('status', 'denied');
                resultData = resDen.count;
                resultError = resDen.error;
                break;
            case 'get_operator_info':
                ({ data: resultData, error: resultError } = await supabase.from('operator_info').select('*').eq('operator_name', payload.operatorName).maybeSingle());
                break;
            case 'increment_views':
                ({ error: resultError } = await supabase.from('photos').update({ views: payload.views }).eq('id', payload.photoId));
                break;
            case 'suggest_routes':
                let rq = supabase.from('photos').select('route_no').eq('status', 'approved');
                if (payload.query) rq = rq.ilike('route_no', `%${payload.query}%`);
                ({ data: resultData, error: resultError } = await rq.order('route_no').limit(10));
                break;
            case 'suggest_routes_advanced':
                let srq = supabase.from('photos').select('route_no').eq('status', 'approved');
                if (payload.currentType) srq = srq.eq('type', payload.currentType);
                if (payload.routeWords) payload.routeWords.forEach(word => { srq = srq.ilike('route_no', `%${word}%`); });
                const srqRes = await srq.limit(10);
                resultData = srqRes.data; resultError = srqRes.error;
                break;
            case 'search_autocomplete_model':
                let samq = supabase.from('photos').select('vehicles!inner(model)').eq('route_no', payload.routeVal).eq('status', 'approved');
                if (payload.currentType) samq = samq.eq('type', payload.currentType);
                if (payload.relatedPrefixes && payload.relatedPrefixes.length > 0) {
                    const prefixOrCond = payload.relatedPrefixes.map(p => `license_plate.ilike.${p}%`).join(',');
                    samq = samq.or(prefixOrCond);
                }
                if (payload.filterType && payload.filterType !== 'both') samq = samq.eq('type', payload.filterType);
                const samqRes = await samq.limit(100);
                resultData = samqRes.data; resultError = samqRes.error;
                break;
            case 'search_autocomplete':
                let saq = supabase.from(payload.table).select(payload.selectStr);
                if (payload.table === 'photos') saq = saq.eq('status', 'approved');
                if (payload.currentType) {
                    if (payload.table === 'photos') saq = saq.eq('type', payload.currentType);
                    else if (payload.table === 'vehicles') saq = saq.eq('photos.type', payload.currentType);
                }
                if (payload.searchWords) payload.searchWords.forEach(word => { saq = saq.ilike(payload.selectField, `%${word}%`); });
                if (payload.filterType && payload.filterType !== 'both') {
                    if (payload.table === 'photos') saq = saq.eq('type', payload.filterType);
                    else if (payload.table === 'vehicles') saq = saq.eq('photos.type', payload.filterType);
                }
                const saqRes = await saq.limit(10);
                resultData = saqRes.data; resultError = saqRes.error;
                break;
            case 'get_pending_photo':
            case 'get_pending_photo_queue_admin':
                ({ data: resultData, error: resultError } = await supabase.from('photos').select('id, created_at, uploader_id, profiles(role)').eq('status', 'pending').order('created_at', { ascending: true }).limit(1).single());
                break;
            case 'get_approved_photos_count':
            case 'get_approved_photos_count_admin':
                let countQ = supabase.from('photos').select('*', { count: 'exact', head: true }).eq('status', 'approved');
                if (payload.filterType && payload.filterType !== 'both') countQ = countQ.eq('type', payload.filterType);
                const cqRes = await countQ;
                resultData = cqRes.count; resultError = cqRes.error;
                break;
            case 'get_photo_stats':
                let psq = supabase.from('photos').select('views, photo_likes(count)', { count: 'exact' }).eq('status', 'approved');
                if (payload.filterType && payload.filterType !== 'both') psq = psq.eq('type', payload.filterType);
                ({ data: resultData, error: resultError } = await psq);
                break;
            case 'get_user_liked_photos':
                ({ data: resultData, error: resultError } = await supabase.from('photo_likes').select('photo_id').eq('user_id', payload.userId));
                break;
            case 'get_favorite_photo':
                ({ data: resultData, error: resultError } = await supabase.from('photos').select('id, url').eq('id', payload.favoritePhotoId).single());
                break;
            case 'get_profile_photos':
                let ppq = supabase.from('photos').select('id, url, status, views, license_plate', { count: 'exact' }).eq('uploader_id', payload.profileId);
                if (!payload.isOwnProfile) ppq = ppq.eq('status', 'approved');
                else if (payload.profileFilter !== 'all') ppq = ppq.eq('status', payload.profileFilter);
                if (payload.filterType && payload.filterType !== 'both') ppq = ppq.eq('type', payload.filterType);
                if (payload.sort === 'newest') ppq = ppq.order('id', { ascending: false });
                else if (payload.sort === 'popular') ppq = ppq.order('views', { ascending: false });
                else if (payload.sort === 'oldest') ppq = ppq.order('id', { ascending: true });
                const ppqRes = await ppq.range(payload.fromRow, payload.toRow);
                return new Response(JSON.stringify({ success: true, data: ppqRes.data, count: ppqRes.count }), { headers: { 'Content-Type': 'application/json' }});
            case 'get_my_liked_photos':
                let mlq = supabase.from('photo_likes').select('photo_id, photos!inner(id, url, license_plate, operator, type)', { count: 'exact' }).eq('user_id', payload.userId).order('created_at', { ascending: false });
                if (payload.filterType && payload.filterType !== 'both') mlq = mlq.eq('photos.type', payload.filterType);
                const mlqRes = await mlq.range(payload.fromRow, payload.toRow);
                return new Response(JSON.stringify({ success: true, data: mlqRes.data, count: mlqRes.count }), { headers: { 'Content-Type': 'application/json' }});
            case 'get_pending_photos_queue':
                ({ data: resultData, error: resultError } = await supabase.from('photos').select('id, created_at, profiles(role)').eq('status', 'pending').order('created_at', { ascending: true }));
                break;
            case 'get_photo_like_count':
                const plqRes = await supabase.from('photo_likes').select('*', { count: 'exact', head: true }).eq('photo_id', payload.photoId);
                resultData = plqRes.count; resultError = plqRes.error;
                break;
            case 'check_user_liked_photo':
                ({ data: resultData, error: resultError } = await supabase.from('photo_likes').select('user_id').eq('photo_id', payload.photoId).eq('user_id', payload.userId).maybeSingle());
                break;
            case 'admin_deny_photo':
                if (!user) throw new Error("Unauthorized");
                ({ error: resultError } = await supabase.from('photos').update({ status: 'denied', denial_reason: payload.reason }).eq('id', payload.photoId));
                break;
            case 'admin_approve_photo':
                if (!user) throw new Error("Unauthorized");
                ({ error: resultError } = await supabase.from('photos').update({ status: 'approved', denial_reason: null }).eq('id', payload.photoId));
                break;
            case 'get_related_photos':
                let rq2 = supabase.from('photos').select('*, profiles(id, username, role, subroles), vehicles(model)').eq('status', 'approved').neq('id', payload.photoId).eq(payload.type, payload.val).limit(15);
                if (payload.filterType && payload.filterType !== 'both') rq2 = rq2.eq('type', payload.filterType);
                ({ data: resultData, error: resultError } = await rq2);
                break;
            case 'get_backup_photos':
                let bq = supabase.from('photos').select('*, profiles(id, username, role, subroles), vehicles(model)').eq('status', 'approved').neq('id', payload.photoId).order('created_at', {ascending: false}).limit(20);
                if (payload.filterType && payload.filterType !== 'both') bq = bq.eq('type', payload.filterType);
                ({ data: resultData, error: resultError } = await bq);
                break;
            case 'get_vehicles_by_model':
                ({ data: resultData, error: resultError } = await supabase.from('vehicles').select('license_plate').eq('model', payload.model).limit(20));
                break;
            case 'get_related_photos_by_plates':
                let rq3 = supabase.from('photos').select('*, profiles(id, username, role, subroles), vehicles(model)').eq('status', 'approved').neq('id', payload.photoId).in('license_plate', payload.plates).limit(15);
                if (payload.filterType && payload.filterType !== 'both') rq3 = rq3.eq('type', payload.filterType);
                ({ data: resultData, error: resultError } = await rq3);
                break;
            case 'get_vehicle_by_plate':
                ({ data: resultData, error: resultError } = await supabase.from('vehicles').select('*').eq('license_plate', payload.plate).single());
                break;
            case 'get_photos_by_plate':
                let pgq = supabase.from('photos').select('*, profiles(id, username, role, subroles), vehicles(model)').eq('license_plate', payload.plate).eq('status', 'approved').order('taken_at', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false });
                if (payload.filterType && payload.filterType !== 'both') pgq = pgq.eq('type', payload.filterType);
                ({ data: resultData, error: resultError } = await pgq);
                break;
            case 'get_vehicle_history':
                ({ data: resultData, error: resultError } = await supabase.from('vehicle_history').select('*').eq('license_plate', payload.plate).order('display_order', { ascending: true }));
                break;
            case 'get_photos_by_operator_chunk':
                ({ data: resultData, error: resultError } = await supabase.from('photos').select('views, license_plate, route_no, vehicles(model)').eq('status', 'approved').ilike('operator', payload.operatorName).order('taken_at', { ascending: false, nullsFirst: false }).range(payload.offset, payload.offset + (payload.limit || 999)));
                break;
            case 'get_vehicle_history_by_plates':
                ({ data: resultData, error: resultError } = await supabase.from('vehicle_history').select('license_plate, operator, route, vehicles(model)').in('license_plate', payload.chunk).order('effective_date', { ascending: false, nullsFirst: false }).order('display_order', { ascending: false }));
                break;
            case 'get_operator_photos_filtered':
                let opf = supabase.from('photos').select('*, profiles(id, username, role, subroles), vehicles(model)').eq('status', 'approved').ilike('operator', payload.operatorName).order('taken_at', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false });
                if (payload.filterType && payload.filterType !== 'both') opf = opf.eq('type', payload.filterType);
                ({ data: resultData, error: resultError } = await opf);
                break;
            default:
                throw new Error('Unknown action: ' + action);
        }

        if (resultError) throw resultError;

        return new Response(JSON.stringify({ success: true, data: resultData }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
