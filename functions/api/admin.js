import { createClient } from '@supabase/supabase-js';

export async function onRequest(context) {
    const { request, env } = context;
    if (request.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    
    let body;
    try {
        body = await request.json();
    } catch(e) {
        return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
    }
    const { action, token, payload } = body;
    if (!token) return new Response(JSON.stringify({ error: 'Missing token' }), { status: 401 });

    
    const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

    const { data: { user }, error: userError } = await sb.auth.getUser(token);
    if (userError || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || (profile.role !== 'admin' && profile.role !== 'manager')) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    try {
        let result;
        switch (action) {
            case 'q1':
                result = await sb.from('vehicles').select('*').eq('license_plate', payload.val).maybeSingle();
                break;
            case 'q2':
                result = await sb.from('photos').select('operator, route_no, type').eq('license_plate', payload.val).eq('status', 'approved').order('taken_at', {
  ascending: false,
  nullsFirst: false
}).order('created_at', {
  ascending: false
}).limit(10);
                break;
            case 'q3':
                result = await sb.from('admin_audit_logs').insert({
  admin_id: app.user.id,
  action_type: actionType,
  target_id: targetId,
  details: details
});
                break;
            case 'q4':
                result = await sb.from('photos').select('*', {
  count: 'exact',
  head: true
}).eq('status', 'pending');
                break;
            case 'q5':
                result = await sb.from('edit_requests').select('new_data').eq('status', 'pending');
                break;
            case 'q6':
                result = await sb.from('photos').select('*, profiles(username, role), vehicles(model)').eq('status', 'pending').order('id', {
  ascending: true
});
                break;
            case 'q7':
                result = await sb.from('photos').select('license_plate').eq('status', 'approved').in('license_plate', pendingPlates);
                break;
            case 'q8':
                result = await sb.from('photos').select('operator').eq('status', 'approved').in('operator', pendingOps);
                break;
            case 'q9':
                result = await sb.from('photos').select('route_no').eq('status', 'approved').in('route_no', pendingRoutes);
                break;
            case 'q10':
                result = await sb.from('photos').select('vehicles!inner(model)').eq('status', 'approved').in('vehicles.model', pendingModels);
                break;
            case 'q11':
                result = await sb.from('edit_requests').select('*').eq('status', 'pending');
                break;
            case 'q12':
                result = await sb.from('photos').select('id, url, license_plate').in('id', photoIds);
                break;
            case 'q13':
                result = await sb.from('profiles').select('id, username').in('id', userIds);
                break;
            case 'q14':
                result = await sb.from('edit_requests').select('*').eq('status', 'pending');
                break;
            case 'q15':
                result = await sb.from('profiles').select('id, username').in('id', userIds);
                break;
            case 'q16':
                result = await sb.from('vehicles').select('*').in('license_plate', plates);
                break;
            case 'q17':
                result = await sb.from('photos').select('id, operator, route_no, type').in('id', photoIdsReq);
                break;
            case 'q18':
                result = await sb.from('photo_comments').select('*, profiles(username), photos(license_plate)').order('created_at', {
  ascending: false
}).limit(500);
                break;
            case 'q19':
                result = await sb.from('photos').select('*, profiles(username)').eq('status', 'denied').order('created_at', {
  ascending: false
}).limit(500);
                break;
            case 'q20':
                result = await sb.from('admin_audit_logs').select('target_id, profiles(username)').eq('action_type', 'deny_photo');
                break;
            case 'q21':
                result = await sb.from('admin_audit_logs').select('*, profiles(username)').order('created_at', {
  ascending: false
}).limit(1000);
                break;
            case 'q22':
                result = await sb.from('profiles').select('id, username').order('username');
                break;
            case 'q23':
                result = await sb.from('system_settings').update({
  is_active: payload.isActive,
  reason: payload.reason,
  auto_reactivate_at: payload.autoReactivate,
  updated_by: payload.app.user.id
}).eq('id', sysId);
                break;
            case 'q24':
                result = await sb.from('system_settings').update({
  reason: payload.val,
  updated_by: payload.app.user.id,
  updated_at: new payload.Date().toISOString()
}).eq('id', 'upload_quota');
                break;
            case 'q25':
                result = await sb.from('vehicles').upsert({
  license_plate: plate,
  model: model
}, {
  onConflict: 'license_plate'
});
                break;
            case 'q26':
                result = await sb.from('photos').update({
  license_plate: payload.plate,
  note: payload.note,
  location: payload.location,
  status: 'approved',
  operator: payload.op,
  type: payload.type,
  route_no: payload.route
}).eq('id', id);
                break;
            case 'q27':
                result = await sb.from('photos').select('taken_at').eq('id', payload.id).single();
                break;
            case 'q28':
                result = await sb.from('vehicle_history').select('*').eq('license_plate', payload.plate).order('effective_date', {
  ascending: false
}).limit(1);
                break;
            case 'q29':
                result = await sb.from('vehicle_history').select('*', {
  count: 'exact',
  head: true
}).eq('license_plate', plate);
                break;
            case 'q30':
                result = await sb.from('vehicle_history').insert({
  license_plate: plate,
  operator: op,
  route: route,
  display_order: count || 0,
  effective_date: takenDateString
});
                break;
            case 'q31':
                result = await sb.from('vehicle_history').update({
  effective_date: payload.takenDateString
}).eq('id', latestHist.id);
                break;
            case 'q32':
                result = await sb.from('photos').update({
  status: 'denied',
  denial_reason: payload.reason
}).eq('id', id);
                break;
            case 'q33':
                result = await sb.from('edit_requests').select('*').eq('id', payload.id).single();
                break;
            case 'q34':
                result = await sb.from('vehicles').upsert({
  license_plate: plate,
  model: model
}, {
  onConflict: 'license_plate'
});
                break;
            case 'q35':
                result = await sb.from('photos').select('operator, route_no, taken_at').eq('id', payload.req.new_data.photo_id).single();
                break;
            case 'q36':
                result = await sb.from('photos').update({
  license_plate: payload.plate,
  note: payload.note,
  location: payload.loc,
  operator: payload.op,
  type: payload.type,
  route_no: payload.route
}).eq('id', req.new_data.photo_id);
                break;
            case 'q37':
                result = await sb.from('vehicles').update({
  model: payload.finalModel,
  note: payload.finalNote
}).eq('license_plate', req.license_plate);
                break;
            case 'q38':
                result = await sb.from('operator_info').upsert({
  operator_name: req.new_data.operator_name,
  logo_url: logo || null,
  description: desc || null
});
                break;
            case 'q39':
                result = await sb.from('model_info').upsert({
  model_name: req.new_data.model_name,
  logo_url: logo || null,
  description: desc || null
});
                break;
            case 'q40':
                result = await sb.from('model_info').update({
  logo_url: payload.logo || null
}).ilike('model_name', `${brandName}%`);
                break;
            case 'q41':
                result = await sb.from('vehicle_history').delete().eq('license_plate', req.license_plate);
                break;
            case 'q42':
                result = await sb.from('vehicle_history').insert(newItems);
                break;
            case 'q43':
                result = await sb.from('edit_requests').update({
  status: 'approved'
}).eq('id', id);
                break;
            case 'q44':
                result = await sb.from('photos').select('id, uploader_id, license_plate').eq('id', payload.photoId).single();
                break;
            case 'q45':
                result = await sb.from('photos').update({
  status: 'denied',
  denial_reason: payload.reason
}).eq('id', p.id);
                break;
            case 'q46':
                result = await sb.from('photos').select('license_plate, url').eq('id', payload.photoId).single();
                break;
            case 'q47':
                result = await sb.from('photos').delete().eq('id', photoId);
                break;
            case 'q48':
                result = await sb.from('edit_requests').update({
  status: 'approved'
}).eq('id', reqId);
                break;
            case 'q49':
                result = await sb.from('edit_requests').select('requester_id, license_plate, new_data').eq('id', payload.reqId).single();
                break;
            case 'q50':
                result = await sb.from('edit_requests').update({
  status: 'denied'
}).eq('id', reqId);
                break;
            case 'q51':
                result = await sb.from('photos').select('operator, type, taken_at, created_at, vehicles(model)').eq('route_no', payload.route).eq('status', 'approved').or(payload.prefixOrCond).order('taken_at', {
  ascending: false,
  nullsFirst: false
}).limit(50);
                break;
            case 'q52':
                result = await sb.from('photos').select('taken_at').eq('uploader_id', payload.app.user.id).eq('license_plate', payload.cleanPlate).neq('status', 'denied');
                break;
            case 'q53':
                result = await sb.from('vehicles').select('*').ilike('license_plate', `${basePlate}%`);
                break;
            case 'q54':
                result = await sb.from('photos').select('operator, route_no, type, taken_at, created_at').eq('license_plate', payload.rawPlate).eq('status', 'approved').order('taken_at', {
  ascending: false,
  nullsFirst: false
}).order('created_at', {
  ascending: false
}).limit(50);
                break;
            case 'q55':
                result = await sb.from('photos').select('profiles(username)').eq('license_plate', payload.rawPlate).eq('status', 'approved');
                break;
            case 'q56':
                result = await sb.from('photos').select('*', {
  count: 'exact',
  head: true
}).gte('created_at', last7AM);
                break;
            case 'q57':
                result = await sb.from('photos').select('id, uploader_id, created_at, profiles(role)').eq('status', 'pending');
                break;
            case 'q58':
                result = await sb.from('system_settings').select('*');
                break;
            case 'q59':
                result = await sb.from('profiles').select('avatar_url').eq('id', payload.app.user.id).single().then(({
  data
}) => {
  if (data && data.avatar_url) avatarEl.src = app.utils.getProxiedUrl(data.avatar_url.replace(/"/g, ''), 'avatar.jpg', 'avatar');else avatarEl.src = 'https://files.catbox.moe/zzh1q1.png';
});
                break;
            case 'q60':
                result = await sb.from('profiles').update({
  preferences: {
    type: payload.app.preference.current,
    showRec: payload.app.preference.showRecommendations
  }
}).eq('id', payload.app.user.id).then(() => {});
                break;
            case 'q61':
                result = await sb.from('profiles').update({
  preferences: {
    type: payload.app.preference.current,
    showRec: payload.app.preference.showRecommendations
  }
}).eq('id', payload.app.user.id).then(({
  error
}) => {});
                break;
            case 'q62':
                result = await sb.from('profiles').select('avatar_url').eq('id', payload.app.user.id).single();
                break;
            default:
                return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400 });
        }
        return new Response(JSON.stringify(result || { success: true }));
    } catch(e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
