import { createClient } from '@supabase/supabase-js';

export async function onRequest(context) {
    const { request, env } = context;
    
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ success: false, error: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' }});
    }

    try {
        const body = await request.json();
        const { action, targetUserId, newUsername, newRole, newEmail, newPass, reason, token } = body;

        const supabaseAdmin = createClient(
            env.SUPABASE_URL,
            env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_KEY, 
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (authError || !user) throw new Error("Xác thực thất bại, token không hợp lệ.");

        const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
        if (!profile || (profile.role !== 'manager' && profile.role !== 'admin')) {
            throw new Error("Truy cập bị từ chối: Bạn không có quyền truy cập.");
        }

        // [BẢO MẬT - SEPARATION OF DUTIES] Kiểm tra quyền phân cấp khi thao tác lên tài khoản khác
        if (targetUserId) {
            const { data: targetProfile } = await supabaseAdmin.from('profiles').select('role').eq('id', targetUserId).single();
            if (targetProfile) {
                if (profile.role === 'admin' && (targetProfile.role === 'manager' || (targetProfile.role === 'admin' && targetUserId !== user.id))) {
                    throw new Error("Truy cập bị từ chối: Kiểm duyệt viên (Admin) không thể thao tác lên Quản lý (Manager) hoặc Kiểm duyệt viên khác.");
                }
                if (profile.role === 'manager' && targetProfile.role === 'manager' && targetUserId !== user.id) {
                    throw new Error("Truy cập bị từ chối: Quản lý (Manager) không thể thao tác lên tài khoản Quản lý khác.");
                }
            }
        }

        if (action === 'get_users') {
            let allAuthUsers = [];
            let page = 1;
            while (true) {
                const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
                if (error) throw error;
                if (!data || !data.users || data.users.length === 0) break;
                allAuthUsers = allAuthUsers.concat(data.users);
                if (data.users.length < 1000) break;
                page++;
            }

            let allProfiles = [];
            let pFrom = 0;
            const step = 1000;
            while (true) {
                const { data, error } = await supabaseAdmin.from('profiles').select('id, username, ban_status, known_ips').range(pFrom, pFrom + step - 1);
                if (error) throw error;
                if (!data || data.length === 0) break;
                allProfiles = allProfiles.concat(data);
                if (data.length < step) break;
                pFrom += step;
            }

            let allPhotos = [];
            let phFrom = 0;
            while (true) {
                const { data, error } = await supabaseAdmin.from('photos').select('uploader_id').eq('status', 'approved').range(phFrom, phFrom + step - 1);
                if (error) throw error;
                if (!data || data.length === 0) break;
                allPhotos = allPhotos.concat(data);
                if (data.length < step) break;
                phFrom += step;
            }

            const photoCounts = {};
            allPhotos.forEach(p => {
                if(p.uploader_id) {
                    photoCounts[p.uploader_id] = (photoCounts[p.uploader_id] || 0) + 1;
                }
            });

            const authMap = {};
            allAuthUsers.forEach(u => {
                authMap[u.id] = {
                    email: u.email,
                    created_at: u.created_at,
                    last_sign_in_at: u.last_sign_in_at
                };
            });

            const merged = allProfiles.map(p => {
                let banInfo = { banned: false, reason: '' };
                if (p.ban_status) {
                    try { banInfo = typeof p.ban_status === 'string' ? JSON.parse(p.ban_status) : p.ban_status; } catch(e){}
                }
                const auth = authMap[p.id] || {};
                return {
                    id: p.id,
                    username: p.username || 'Unknown',
                    ban_status: banInfo,
                    photo_count: photoCounts[p.id] || 0,
                    email: auth.email || '',
                    created_at: auth.created_at || new Date(0).toISOString(),
                    last_sign_in_at: auth.last_sign_in_at || new Date(0).toISOString()
                };
            });

            return new Response(JSON.stringify({ success: true, users: merged }), { status: 200, headers: { 'Content-Type': 'application/json' }});
        }

        if (action === 'ban' || action === 'unban') {
            if (!targetUserId) throw new Error("Thiếu targetUserId.");
            
            const banStatus = action === 'ban' 
                ? { banned: true, reason: reason || 'Không có lý do' } 
                : { banned: false, reason: '' };
                
            const { error: banError } = await supabaseAdmin.from('profiles').update({
                ban_status: banStatus
            }).eq('id', targetUserId);
            
            if (banError) throw banError;

            // Cập nhật toàn bộ IP đã truy cập của tài khoản vào bảng banned_ips
            const { data: targetProfile } = await supabaseAdmin.from('profiles').select('known_ips').eq('id', targetUserId).single();
            if (targetProfile && Array.isArray(targetProfile.known_ips)) {
                if (action === 'ban') {
                    for (const ip of targetProfile.known_ips) {
                        if (ip) {
                            try { await supabaseAdmin.from('banned_ips').upsert({ ip: ip, reason: `Tài khoản ID ${targetUserId} bị cấm: ${reason || ''}` }, { onConflict: 'ip' }); } catch(err){}
                        }
                    }
                } else {
                    for (const ip of targetProfile.known_ips) {
                        if (ip) {
                            try { await supabaseAdmin.from('banned_ips').delete().eq('ip', ip); } catch(err){}
                        }
                    }
                    try { await supabaseAdmin.from('banned_ips').delete().like('reason', `%ID ${targetUserId}%`); } catch(err){}
                }
            }

            return new Response(JSON.stringify({ success: true, message: action === 'ban' ? "Đã cấm tài khoản và toàn bộ IP truy cập thành công!" : "Đã gỡ cấm tài khoản và gỡ cấm các IP liên quan thành công!" }), { status: 200, headers: { 'Content-Type': 'application/json' }});
        }

        if (action === 'delete_user') {
            if (!targetUserId) throw new Error("Thiếu targetUserId.");
            
            await supabaseAdmin.from('photos').update({ uploader_id: null }).eq('uploader_id', targetUserId);
            await supabaseAdmin.from('photo_comments').update({ user_id: null }).eq('user_id', targetUserId);
            await supabaseAdmin.from('edit_requests').update({ requester_id: null }).eq('requester_id', targetUserId);
            
            const { error: deleteErr } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
            if (deleteErr) throw deleteErr;
            
            return new Response(JSON.stringify({ success: true, message: "Đã xóa tài khoản vĩnh viễn (các ảnh đã tải lên vẫn được giữ lại)!" }), { status: 200, headers: { 'Content-Type': 'application/json' }});
        }

        if (!targetUserId) throw new Error("Thiếu targetUserId.");
        if (newRole && ['admin', 'manager'].includes(newRole) && profile.role === 'admin') {
            throw new Error("Truy cập bị từ chối: Kiểm duyệt viên (Admin) không có quyền cấp vai trò Kiểm duyệt hoặc Quản lý.");
        }

        const { error: profileError } = await supabaseAdmin.from('profiles').update({
            username: newUsername,
            role: newRole
        }).eq('id', targetUserId);
        
        if (profileError) throw profileError;

        let authUpdates = {};
        if (newEmail) authUpdates.email = newEmail;
        if (newPass) authUpdates.password = newPass;

        if (Object.keys(authUpdates).length > 0) {
            const { error: updateAuthErr } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, authUpdates);
            if (updateAuthErr) throw updateAuthErr;
        }

        return new Response(JSON.stringify({ success: true, message: "Cập nhật user thành công!" }), { status: 200, headers: { 'Content-Type': 'application/json' }});

    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), { status: 400, headers: { 'Content-Type': 'application/json' }});
    }
}
