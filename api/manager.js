import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    // Chỉ cho phép phương thức POST
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    const { targetUserId, newUsername, newRole, newEmail, newPass, token } = req.body;

    // 1. Khởi tạo Supabase Admin Client bằng Biến môi trường Vercel
    // Đọc SUPABASE_URL và SUPABASE_KEY từ Vercel Env (Bảo mật tuyệt đối, không lộ ra frontend)
    const supabaseAdmin = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_KEY, 
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

        // 3. Tiến hành cập nhật Profile (Username, Role)
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
