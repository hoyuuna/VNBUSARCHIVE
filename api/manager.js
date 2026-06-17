import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    // Chỉ cho phép phương thức POST
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    const { action, targetUserId, newUsername, newRole, newEmail, newPass, reason, token } = req.body;

    // 1. Khởi tạo Supabase Admin Client bằng Biến môi trường Vercel
    const supabaseAdmin = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY, 
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    try {
        // 2. Xác thực người đang request có đúng là Manager không
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (authError || !user) throw new Error("Xác thực thất bại, token không hợp lệ.");

        const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
        if (!profile || profile.role !== 'manager') {
            throw new Error("Truy cập bị từ chối: Bạn không phải là Manager.");
        }

        // Xử lý lấy danh sách user
        if (action === 'get_users') {
            // Lấy tất cả auth users
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

            // Lấy tất cả profiles
            let allProfiles = [];
            let pFrom = 0;
            const step = 1000;
            while (true) {
                const { data, error } = await supabaseAdmin.from('profiles').select('id, username, ban_status').range(pFrom, pFrom + step - 1);
                if (error) throw error;
                if (!data || data.length === 0) break;
                allProfiles = allProfiles.concat(data);
                if (data.length < step) break;
                pFrom += step;
            }

            // Lấy tất cả photos được duyệt để đếm
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

            // Map auth users for quick lookup
            const authMap = {};
            allAuthUsers.forEach(u => {
                authMap[u.id] = {
                    email: u.email,
                    created_at: u.created_at,
                    last_sign_in_at: u.last_sign_in_at
                };
            });

            // Map all profiles
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

            return res.status(200).json({ success: true, users: merged });
        }

        // Xử lý hành động Ban / Unban
        if (action === 'ban' || action === 'unban') {
            if (!targetUserId) throw new Error("Thiếu targetUserId.");
            
            const banStatus = action === 'ban' 
                ? { banned: true, reason: reason || 'Không có lý do' } 
                : { banned: false, reason: '' };
                
            const { error: banError } = await supabaseAdmin.from('profiles').update({
                ban_status: banStatus
            }).eq('id', targetUserId);
            
            if (banError) throw banError;
            return res.status(200).json({ success: true, message: action === 'ban' ? "Đã cấm tài khoản thành công!" : "Đã gỡ cấm tài khoản thành công!" });
        }

        // Xử lý hành động Xóa tài khoản
        if (action === 'delete_user') {
            if (!targetUserId) throw new Error("Thiếu targetUserId.");
            
            const { error: deleteErr } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
            if (deleteErr) throw deleteErr;
            
            // Note: Supabase trigger or cascading delete should handle deleting from profiles, photos, etc. 
            // If there's no cascade, the profile might remain but we rely on Supabase's built-in cascade or manual triggers.
            
            return res.status(200).json({ success: true, message: "Đã xóa tài khoản vĩnh viễn!" });
        }

        // 3. Tiến hành cập nhật Profile (Username, Role) (Mặc định)
        const { error: profileError } = await supabaseAdmin.from('profiles').update({
            username: newUsername,
            role: newRole
        }).eq('id', targetUserId);
        
        if (profileError) throw profileError;

        // 4. Tiến hành cập nhật Auth (Email, Password)
        let authUpdates = {};
        if (newEmail) authUpdates.email = newEmail;
        if (newPass) authUpdates.password = newPass;

        if (Object.keys(authUpdates).length > 0) {
            const { error: updateAuthErr } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, authUpdates);
            if (updateAuthErr) throw updateAuthErr;
        }

        // Thành công
        return res.status(200).json({ success: true, message: "Cập nhật user thành công!" });

    } catch (error) {
        return res.status(400).json({ success: false, error: error.message });
    }
}
