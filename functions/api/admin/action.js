import { createClient } from '@supabase/supabase-js';

export async function onRequestPost(context) {
    const { request, env } = context;
    
    if (!env.SUPABASE_URL || !env.SUPABASE_KEY) {
        return new Response(JSON.stringify({ error: 'Server misconfiguration' }), { status: 500 });
    }
    
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }
        
        const token = authHeader.replace('Bearer ', '');

        // Khởi tạo Supabase client với quyền của chính User (bằng token JWT của họ)
        // Điều này giúp vượt qua RLS policy mà không cần dùng Service Role Key
        const sb = createClient(env.SUPABASE_URL, env.SUPABASE_KEY, {
            global: {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            },
            auth: {
                persistSession: false
            }
        });

        const { data: { user }, error: userError } = await sb.auth.getUser();
        
        if (userError || !user) {
            return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
        }
        
        const { data: profiles } = await sb.from('profiles').select('role').eq('id', user.id);
        
        if (!profiles || profiles.length === 0 || !['admin', 'manager'].includes(profiles[0].role)) {
            return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), { status: 403 });
        }
        
        const body = await request.json();
        const { action, photoId, reason, plate, op, type, route, model, location, note } = body;
        
        if (!action || !photoId) {
            return new Response(JSON.stringify({ error: 'Missing parameters' }), { status: 400 });
        }
        
        if (action === 'approve') {
            if (plate && plate.includes('-') && model) {
                const parts = plate.split('-');
                if (parts.length >= 2 && !isNaN(parts[1])) {
                    const basePlate = parts[0];
                    const { data: baseVehicle } = await sb.from('vehicles').select('model').eq('license_plate', basePlate).single();
                    if (baseVehicle && baseVehicle.model) {
                        const baseModelLower = baseVehicle.model.trim().toLowerCase();
                        const currentModelLower = model.trim().toLowerCase();
                        if (baseModelLower === currentModelLower || baseModelLower.includes(currentModelLower) || currentModelLower.includes(baseModelLower)) {
                            return new Response(JSON.stringify({ error: `Từ chối duyệt: Vi phạm chính sách chống gian lận (Fraud). Xe định danh phụ (${plate}) không được trùng dòng xe với xe gốc (${basePlate}: ${baseVehicle.model}).` }), { status: 400 });
                        }
                    }
                }
            }

            const { error: vError } = await sb.from('vehicles')
                .upsert({ license_plate: plate, model: model }, { onConflict: 'license_plate' });
            if (vError) throw vError;

            await sb.from('photos').update({
                license_plate: plate,
                note: note,
                location: location,
                status: 'approved',
                operator: op,
                type: type,
                route_no: route
            }).eq('id', photoId);

            const { data: photoData } = await sb.from('photos').select('taken_at').eq('id', photoId).single();
            const photo = photoData || {};

            const specialRoutes = ['Ngoài giờ hoạt động', 'Chưa hoạt động'];
            const isSpecialRoute = specialRoutes.includes(route);

            if (!isSpecialRoute) {
                const { data: currentHistory } = await sb.from('vehicle_history')
                    .select('*').eq('license_plate', plate).order('effective_date', { ascending: false }).limit(1);

                const latestHist = currentHistory && currentHistory.length > 0 ? currentHistory[0] : null;
                const takenDateObj = photo.taken_at ? new Date(photo.taken_at) : new Date();
                const takenDateString = takenDateObj.toISOString().split('T')[0];

                if (!latestHist || latestHist.operator !== op || latestHist.route !== route) {
                    const { count } = await sb.from('vehicle_history').select('*', { count: 'exact', head: true }).eq('license_plate', plate);
                    await sb.from('vehicle_history').insert({
                        license_plate: plate, operator: op, route: route,
                        display_order: count || 0,
                        effective_date: takenDateString
                    });
                } else {
                    const oldDateObj = latestHist.effective_date ? new Date(latestHist.effective_date) : new Date();
                    if (takenDateObj < oldDateObj || !latestHist.effective_date) {
                        await sb.from('vehicle_history').update({
                            effective_date: takenDateString
                        }).eq('id', latestHist.id);
                    }
                }
            }

            await sb.from('admin_audit_logs').insert({
                admin_id: user.id,
                action_type: 'approve_photo',
                target_id: photoId,
                details: JSON.stringify({ plate, operator: op })
            });

        } else if (action === 'deny') {
            await sb.from('photos').update({ status: 'denied', denial_reason: reason }).eq('id', photoId);
            
            // cleanupVehicle logic
            const { data: countData } = await sb.from('photos').select('id', { count: 'exact' })
                .eq('license_plate', plate);
            
            if (countData && countData.length === 0) {
                await sb.from('vehicles').delete().eq('license_plate', plate);
                await sb.from('vehicle_history').delete().eq('license_plate', plate);
            }

            await sb.from('admin_audit_logs').insert({
                admin_id: user.id,
                action_type: 'deny_photo',
                target_id: photoId,
                details: JSON.stringify({ plate, reason })
            });
        } else {
            return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
