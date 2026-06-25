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

        let user = null;
        if (token) {
            const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
            if (!authError && authData.user) user = authData.user;
        }

        if (!user) throw new Error("Xác thực thất bại, token không hợp lệ hoặc đã hết hạn.");

        // Lấy profile để check role
        const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
        const isAdminOrManager = profile && (profile.role === 'admin' || profile.role === 'manager');

        if (action === 'delete_pending') {
            const { photoId, license_plate } = payload;
            
            // Lấy thông tin photo
            const { data: photo } = await supabaseAdmin.from('photos').select('status, uploader_id').eq('id', photoId).single();
            if (!photo) throw new Error("Không tìm thấy ảnh.");
            
            if (photo.uploader_id !== user.id && !isAdminOrManager) {
                throw new Error("Không có quyền xóa ảnh này.");
            }

            if (photo.status !== 'pending' && photo.status !== 'denied' && !isAdminOrManager) {
                throw new Error("Chỉ có thể xóa trực tiếp ảnh đang chờ duyệt hoặc bị từ chối.");
            }

            const { error } = await supabaseAdmin.from('photos').delete().eq('id', photoId);
            if (error) throw error;

            return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' }});
        }

        if (action === 'request_delete') {
            const { photoId, license_plate, reason } = payload;

            const { count, error: checkErr } = await supabaseAdmin.from('edit_requests')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending')
                .contains('new_data', { photo_id: photoId });

            if (checkErr) throw checkErr;
            if (count > 0) throw new Error("Ảnh này đang có một yêu cầu chỉnh sửa hoặc xóa khác chờ duyệt. Vui lòng đợi Admin xử lý xong trước khi gửi yêu cầu mới.");

            const { error } = await supabaseAdmin.from('edit_requests').insert({
                requester_id: user.id,
                license_plate: license_plate,
                new_data: { request_type: 'delete_photo', photo_id: photoId, reason: reason },
                status: 'pending'
            });

            if (error) throw error;
            return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' }});
        }

        if (action === 'submit_inline') {
            const { photoInfo, payload: editPayload } = payload;
            const photoId = photoInfo.id;
            const uploaderId = photoInfo.uploader_id;
            const takenAtChanged = !!(editPayload.taken_at && editPayload.taken_at !== photoInfo.taken_at);

            // Kiểm tra trùng lặp ngày chụp (nếu có thay đổi)
            if (takenAtChanged || editPayload.license_plate !== photoInfo.license_plate) {
                const targetDate = editPayload.taken_at || photoInfo.taken_at;
                if (targetDate) {
                    const datePart = targetDate.split('T')[0];
                    const { data: existingPhotos, error: checkErr } = await supabaseAdmin
                        .from('photos')
                        .select('id, taken_at')
                        .eq('uploader_id', uploaderId)
                        .eq('license_plate', editPayload.license_plate)
                        .neq('id', photoId)
                        .neq('status', 'denied');

                    if (!checkErr && existingPhotos && existingPhotos.length > 0) {
                        const isDuplicateDate = existingPhotos.some(p => p.taken_at && p.taken_at.split('T')[0] === datePart);
                        if (isDuplicateDate) {
                            const displayDate = datePart.split('-').reverse().join('/');
                            throw new Error(`Tài khoản này đã có ảnh của xe ${editPayload.license_plate} vào ngày ${displayDate} rồi. Không thể đổi thành ngày/biển số này để tránh trùng lặp 1 xe/1 ngày.`);
                        }
                    }
                }
            }

            if (isAdminOrManager) {
                if (takenAtChanged) {
                    await supabaseAdmin.from('photos').update({ taken_at: editPayload.taken_at }).eq('id', photoId);
                }

                const { error: vError } = await supabaseAdmin.from('vehicles').upsert({
                    license_plate: editPayload.license_plate,
                    model: editPayload.model
                }, { onConflict: 'license_plate' });
                if (vError) throw vError;

                const { error: pError } = await supabaseAdmin.from('photos').update({
                    license_plate: editPayload.license_plate,
                    location: editPayload.location,
                    note: editPayload.note,
                    operator: editPayload.operator,
                    type: editPayload.type,
                    route_no: editPayload.route
                }).eq('id', photoId);
                if (pError) throw pError;

                return new Response(JSON.stringify({ success: true, mode: 'direct' }), { status: 200, headers: { 'Content-Type': 'application/json' }});
            } else {
                // Người dùng thường: nếu đổi taken_at mà mình là uploader thì update trực tiếp taken_at
                if (uploaderId === user.id && takenAtChanged) {
                    await supabaseAdmin.from('photos').update({ taken_at: editPayload.taken_at }).eq('id', photoId);
                }

                const { count, error: checkErr } = await supabaseAdmin.from('edit_requests')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'pending')
                    .contains('new_data', { photo_id: photoId });

                if (checkErr) throw checkErr;
                if (count > 0) throw new Error("Ảnh này đang có một yêu cầu chỉnh sửa hoặc xóa khác chờ duyệt. Vui lòng đợi Admin xử lý xong trước khi gửi yêu cầu mới.");

                const reqData = {
                    requester_id: user.id,
                    license_plate: editPayload.license_plate,
                    new_data: {
                        ...editPayload,
                        request_type: 'update_vehicle_info',
                        photo_id: photoId
                    },
                    status: 'pending'
                };

                const { error } = await supabaseAdmin.from('edit_requests').insert(reqData).select().single();
                if (error) throw error;

                return new Response(JSON.stringify({ success: true, mode: 'request', takenAtChanged }), { status: 200, headers: { 'Content-Type': 'application/json' }});
            }
        }

        return new Response(JSON.stringify({ success: false, error: 'Hành động không hợp lệ' }), { status: 400, headers: { 'Content-Type': 'application/json' }});
    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 400, headers: { 'Content-Type': 'application/json' }});
    }
}
