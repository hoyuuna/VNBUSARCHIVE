import { createClient } from '@supabase/supabase-js';

export async function onRequest(context) {
    const { request, env } = context;

    if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    try {
        const body = await request.json();
        const { action, payload, token } = body;

        const supabaseAdmin = createClient(
            env.SUPABASE_URL,
            env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_KEY,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        let user = null;
        if (token) {
            const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
            if (!authError && authData.user) user = authData.user;
        }

        // Action dispatcher
        if (action === 'fetch_sugs') {
            const { sugType, label, searchWords, currentPreference } = payload;
            let table = '';
            let col = '';
            let selectStr = '';

            if (sugType === 'vehicles_plate') { table = 'vehicles'; col = 'license_plate'; selectStr = 'license_plate'; }
            else if (sugType === 'photos_route') { table = 'photos'; col = 'route_no'; selectStr = 'route_no, license_plate'; }
            else if (sugType === 'photos_operator') { table = 'photos'; col = 'operator'; selectStr = 'operator'; }
            else if (sugType === 'vehicles_model') { table = 'vehicles'; col = 'model'; selectStr = 'model'; }
            else if (sugType === 'photos_location') { table = 'photos'; col = 'location'; selectStr = 'location'; }
            else if (sugType === 'photos_camera') { table = 'photos'; col = 'camera_model'; selectStr = 'camera_model'; }
            else if (sugType === 'profiles_username') { table = 'profiles'; col = 'username'; selectStr = 'username'; }

            if (table === 'vehicles' && currentPreference !== 'both') {
                selectStr = `${col}, photos!inner(type)`;
            }

            let sbQuery = supabaseAdmin.from(table).select(selectStr);
            if (table === 'photos') sbQuery = sbQuery.eq('status', 'approved');

            (searchWords || []).forEach(word => {
                if (col === 'license_plate') {
                    // simple normalize (remove hyphens)
                    const normalized = word.replace(/-/g, '').trim().toUpperCase();
                    sbQuery = sbQuery.ilike(col, `%${normalized}%`);
                } else {
                    sbQuery = sbQuery.ilike(col, `%${word}%`);
                }
            });

            if (table === 'photos' && currentPreference !== 'both') {
                sbQuery = sbQuery.eq('type', currentPreference);
            } else if (table === 'vehicles' && currentPreference !== 'both') {
                sbQuery = sbQuery.eq('photos.type', currentPreference);
            }

            const { data, error } = await sbQuery.limit(30);
            if (error) throw error;
            
            if (sugType === 'profiles_username' && data) {
                 const results = [...new Set(data.map(item => item.username).filter(Boolean))].map(val => ({ text: val, label: 'Người đăng' }));
                 return new Response(JSON.stringify({ success: true, data: results }), { status: 200, headers: { 'Content-Type': 'application/json' }});
            }

            return new Response(JSON.stringify({ success: true, data: data }), { status: 200, headers: { 'Content-Type': 'application/json' }});
        }

        if (action === 'fetch_photos') {
            const { filterType, query, searchWords, currentPreference, prefixToUrl, currentParams } = payload;
            const profileSelect = (filterType === 'uploader') ? 'profiles!inner(id, username, role, subroles)' : 'profiles(id, username, role, subroles)';
            let photoQuery;
            if (filterType === 'model') {
                photoQuery = supabaseAdmin.from('photos').select(`*, ${profileSelect}, vehicles!inner(model)`).eq('status', 'approved');
            } else {
                photoQuery = supabaseAdmin.from('photos').select(`*, ${profileSelect}, vehicles(model)`).eq('status', 'approved');
            }
            if (currentPreference !== 'both') photoQuery = photoQuery.eq('type', currentPreference);

            if (filterType === 'absolute_route') {
                // Simplified route filtering for backend
                photoQuery = photoQuery.eq('route_no', query);
                // Advanced prefix logic can be handled via frontend passing it.
            } else if (filterType === 'plate') {
                (searchWords || []).forEach(w => { photoQuery = photoQuery.ilike('license_plate', `%${w.replace(/-/g, '').trim().toUpperCase()}%`); });
            } else if (filterType === 'route') {
                (searchWords || []).forEach(w => { photoQuery = photoQuery.ilike('route_no', `%${w}%`); });
            } else if (filterType === 'operator') {
                (searchWords || []).forEach(w => { photoQuery = photoQuery.ilike('operator', `%${w}%`); });
            } else if (filterType === 'camera') {
                (searchWords || []).forEach(w => { photoQuery = photoQuery.ilike('camera_model', `%${w}%`); });
            } else if (filterType === 'location') {
                (searchWords || []).forEach(w => { photoQuery = photoQuery.ilike('location', `%${w}%`); });
            } else if (filterType === 'uploader') {
                (searchWords || []).forEach(w => { photoQuery = photoQuery.ilike('profiles.username', `%${w}%`); });
            } else if (filterType === 'model') {
                (searchWords || []).forEach(w => { photoQuery = photoQuery.ilike('vehicles.model', `%${w}%`); });
            } else {
                // ALL
                let mQ = supabaseAdmin.from('vehicles').select('license_plate');
                let uQ = supabaseAdmin.from('profiles').select('id');
                (searchWords || []).forEach(w => {
                    const safeW = w.replace(/"/g, '');
                    mQ = mQ.or(`model.ilike."%${safeW}%",note.ilike."%${safeW}%"`);
                    uQ = uQ.ilike('username', `%${w}%`);
                });
                const [mRes, uRes] = await Promise.all([mQ.limit(150), uQ.limit(10)]);
                const plates = mRes.data ? mRes.data.map(v => v.license_plate) : [];
                const uploaderIds = uRes.data ? uRes.data.map(u => u.id) : [];

                (searchWords || []).forEach(w => {
                    const safeW = w.replace(/"/g, '');
                    const safeWPlate = safeW.replace(/-/g, '').trim().toUpperCase();
                    let orConditions = [];
                    if (safeWPlate) orConditions.push(`license_plate.ilike."%${safeWPlate}%"`);
                    orConditions.push(`operator.ilike."%${safeW}%"`);
                    orConditions.push(`route_no.ilike."%${safeW}%"`);
                    orConditions.push(`camera_model.ilike."%${safeW}%"`);
                    orConditions.push(`location.ilike."%${safeW}%"`);
                    orConditions.push(`note.ilike."%${safeW}%"`);
                    if (plates.length > 0) orConditions.push(`license_plate.in.(${plates.join(',')})`);
                    if (uploaderIds.length > 0) orConditions.push(`uploader_id.in.(${uploaderIds.join(',')})`);
                    photoQuery = photoQuery.or(orConditions.join(','));
                });
            }

            const { data: results, error } = await photoQuery
                .order('taken_at', { ascending: false, nullsFirst: false })
                .order('created_at', { ascending: false })
                .limit(500);

            if (error) throw error;
            return new Response(JSON.stringify({ success: true, data: results }), { status: 200, headers: { 'Content-Type': 'application/json' }});
        }
        
        if (action === 'delete_vehicle') {
            if (!user) throw new Error("Chưa đăng nhập");
            const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
            if (!profile || (profile.role !== 'admin' && profile.role !== 'manager')) {
                throw new Error("Không có quyền");
            }
            const { plate } = payload;
            const { data, error } = await supabaseAdmin.from('photos').select('id').eq('license_plate', plate).limit(1);
            if (error) throw error;
            let deleted = false;
            if (!data || data.length === 0) {
                await supabaseAdmin.from('vehicles').delete().eq('license_plate', plate);
                await supabaseAdmin.from('vehicle_history').delete().eq('license_plate', plate);
                deleted = true;
            }
            return new Response(JSON.stringify({ success: true, data, error, deleted }), { status: 200, headers: { 'Content-Type': 'application/json' }});
        }

        // Catch-all for simple generic queries during migration (these do not expose arbitrary logic as much)
        if (action === 'generic_query') {
            const { queryType, params } = payload;
            if (queryType === 'fetch_uploader_photo_count') {
                const { count } = await supabaseAdmin.from('photos').select('*', { count: 'exact', head: true }).eq('uploader_id', params.userId).eq('status', 'approved');
                return new Response(JSON.stringify({ success: true, data: count }), { status: 200, headers: { 'Content-Type': 'application/json' }});
            }
            if (queryType === 'fetch_operator_info') {
                let opInfoQuery = supabaseAdmin.from('operator_info').select('*');
                let opPhotoQuery = supabaseAdmin.from('photos').select('operator').eq('status', 'approved');
                (params.searchWords || []).forEach(w => { 
                    opInfoQuery = opInfoQuery.ilike('operator_name', `%${w}%`); 
                    opPhotoQuery = opPhotoQuery.ilike('operator', `%${w}%`); 
                });
                const [infoRes, photoRes] = await Promise.all([opInfoQuery.limit(10), opPhotoQuery.limit(200)]);
                return new Response(JSON.stringify({ success: true, data: { infoRes, photoRes } }), { status: 200, headers: { 'Content-Type': 'application/json' }});
            }
            if (queryType === 'fetch_operator_extra') {
                const { data } = await supabaseAdmin.from('operator_info').select('*').in('operator_name', params.missingInfos);
                return new Response(JSON.stringify({ success: true, data }), { status: 200, headers: { 'Content-Type': 'application/json' }});
            }
            if (queryType === 'fetch_model_info') {
                let mdlInfoQuery = supabaseAdmin.from('model_info').select('*');
                let mdlVehicleQuery = supabaseAdmin.from('vehicles').select('model');
                (params.searchWords || []).forEach(w => { 
                    mdlInfoQuery = mdlInfoQuery.ilike('model_name', `%${w}%`); 
                    mdlVehicleQuery = mdlVehicleQuery.ilike('model', `%${w}%`); 
                });
                const [infoRes, vehRes] = await Promise.all([mdlInfoQuery.limit(10), mdlVehicleQuery.limit(200)]);
                return new Response(JSON.stringify({ success: true, data: { infoRes, vehRes } }), { status: 200, headers: { 'Content-Type': 'application/json' }});
            }
            if (queryType === 'fetch_model_extra') {
                const { data } = await supabaseAdmin.from('model_info').select('*').in('model_name', params.missingInfos);
                return new Response(JSON.stringify({ success: true, data }), { status: 200, headers: { 'Content-Type': 'application/json' }});
            }
            if (queryType === 'fetch_brand_logo') {
                const { data } = await supabaseAdmin.from('model_info').select('logo_url').ilike('model_name', `${params.brandName}%`).not('logo_url', 'is', null).limit(1).maybeSingle();
                return new Response(JSON.stringify({ success: true, data }), { status: 200, headers: { 'Content-Type': 'application/json' }});
            }
            if (queryType === 'fetch_vehicles') {
                let vQuery = supabaseAdmin.from('vehicles').select(params.selectStr).limit(10);
                (params.searchWords || []).forEach(w => { vQuery = vQuery.ilike('license_plate', `%${w.replace(/-/g, '').trim().toUpperCase()}%`); });
                if (params.filter && params.filter !== 'both') vQuery = vQuery.eq('photos.type', params.filter);
                const { data } = await vQuery;
                return new Response(JSON.stringify({ success: true, data }), { status: 200, headers: { 'Content-Type': 'application/json' }});
            }
            if (queryType === 'fetch_uploader_cards') {
                let uQuery = supabaseAdmin.from('profiles').select('id, username, avatar_url, role, subroles');
                (params.searchWords || []).forEach(w => { uQuery = uQuery.ilike('username', `%${w}%`); });
                const { data } = await uQuery.limit(5);
                return new Response(JSON.stringify({ success: true, data }), { status: 200, headers: { 'Content-Type': 'application/json' }});
            }
            if (queryType === 'save_history') {
                 if (!user) throw new Error("Chưa đăng nhập");
                 await supabaseAdmin.from('vehicle_history').delete().eq('license_plate', params.plate);
                 if (params.payload && params.payload.length > 0) {
                     await supabaseAdmin.from('vehicle_history').insert(params.payload);
                 }
                 return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' }});
            }
            if (queryType === 'request_save_history') {
                if (!user) throw new Error("Chưa đăng nhập");
                const { count, error: checkErr } = await supabaseAdmin.from('edit_requests').select('*', { count: 'exact', head: true }).eq('license_plate', params.plate).eq('status', 'pending').contains('new_data', { request_type: 'update_history' });
                if (count > 0) return new Response(JSON.stringify({ success: true, count, checkErr }), { status: 200, headers: { 'Content-Type': 'application/json' }});
                const { error } = await supabaseAdmin.from('edit_requests').insert(params.reqData);
                return new Response(JSON.stringify({ success: true, count, checkErr, error }), { status: 200, headers: { 'Content-Type': 'application/json' }});
            }
        }

        return new Response(JSON.stringify({ success: false, error: 'Unknown action' }), { status: 400, headers: { 'Content-Type': 'application/json' }});
    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 400, headers: { 'Content-Type': 'application/json' }});
    }
}
