import { createClient } from '@supabase/supabase-js';
function validateOriginAndReferer(request) {
    const referer = request.headers.get('referer') || '';
    const origin = request.headers.get('origin') || '';
    const host = request.headers.get('host') || '';
    const isProduction = host.includes('vnbusarchive.io.vn');
    
    if (!isProduction) return true;
    if (!origin && !referer) return false;
    
    function checkDomain(str) {
        if (!str) return false;
        try {
            const u = new URL(str);
            return u.hostname === 'vnbusarchive.io.vn' || u.hostname.endsWith('.vnbusarchive.io.vn');
        } catch (e) {
            return false;
        }
    }
    return checkDomain(origin) || checkDomain(referer);
}


export async function onRequest(context) {
    const { request, env } = context;
    
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ success: false, error: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' }});
    }

    try {
        const body = await request.json();
        const authHeader = request.headers.get('authorization');
        const token = authHeader ? authHeader.replace('Bearer ', '') : body.token;
        const { action, targetUserId, newUsername, newRole, newEmail, newPass, reason } = body;

        if (!env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Lỗi cấu hình hệ thống: Thiếu Service Role Key.");
        const supabaseAdmin = createClient(
            env.SUPABASE_URL,
            env.SUPABASE_SERVICE_ROLE_KEY, 
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
            const pageNum = parseInt(body.page) || 1;
            const pageSize = parseInt(body.limit) || 50;
            const search = body.search || '';
            const status = body.status || 'all';

            let query = supabaseAdmin.from('profiles').select('id, username, ban_status, role, subroles', { count: 'exact' });
            if (search) query = query.ilike('username', `%${search}%`);
            if (status === 'banned') {
                query = query.ilike('ban_status', '%"banned":true%');
            }
            
            const { data: profiles, count, error } = await query
                .order('username')
                .range((pageNum - 1) * pageSize, pageNum * pageSize - 1);
                
            if (error) throw error;

            const merged = await Promise.all(profiles.map(async (p) => {
                let email = '';
                let created_at = new Date(0).toISOString();
                let last_sign_in_at = new Date(0).toISOString();
                try {
                    const { data: userAuth } = await supabaseAdmin.auth.admin.getUserById(p.id);
                    if (userAuth && userAuth.user) {
                        email = userAuth.user.email;
                        created_at = userAuth.user.created_at;
                        last_sign_in_at = userAuth.user.last_sign_in_at;
                    }
                } catch(e) {}

                let photo_count = 0;
                try {
                    const { count: pCount } = await supabaseAdmin.from('photos').select('*', { count: 'exact', head: true }).eq('uploader_id', p.id).eq('status', 'approved');
                    photo_count = pCount || 0;
                } catch(e) {}

                let banInfo = { banned: false, reason: '' };
                if (p.ban_status) {
                    try { banInfo = typeof p.ban_status === 'string' ? JSON.parse(p.ban_status) : p.ban_status; } catch(e){}
                }

                return {
                    id: p.id,
                    username: p.username || 'Unknown',
                    ban_status: banInfo,
                    role: p.role,
                    subroles: p.subroles || [],
                    photo_count,
                    email,
                    created_at,
                    last_sign_in_at
                };
            }));

            return new Response(JSON.stringify({ success: true, users: merged, total: count }), { status: 200, headers: { 'Content-Type': 'application/json' }});
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

        if (action === 'update_subroles') {
            if (!targetUserId) throw new Error("Thiếu targetUserId.");
            const { newSubroles } = body;
            
            const { error: profileError } = await supabaseAdmin.from('profiles').update({
                subroles: newSubroles
            }).eq('id', targetUserId);
            
            if (profileError) throw profileError;
            
            return new Response(JSON.stringify({ success: true, message: "Cập nhật subroles thành công!" }), { status: 200, headers: { 'Content-Type': 'application/json' }});
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
        console.error('[Manager Error]:', error.message);
        return new Response(JSON.stringify({ success: false, error: 'Lỗi quản lý: ' + error.message }), { status: 400, headers: { 'Content-Type': 'application/json' }});
    }
}
