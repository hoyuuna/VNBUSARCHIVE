import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    // 1. Chỉ chấp nhận phương thức POST để bảo mật
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // 2. Lấy Access Token của điện thoại truyền lên qua Header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Thiếu hoặc sai định dạng Token xác thực.' });
        }
        const token = authHeader.replace('Bearer ', '');

        // 3. Khởi tạo Supabase Admin (Bắt buộc dùng SERVICE_ROLE_KEY)
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceRole) {
            throw new Error("Thiếu biến môi trường SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY");
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole);

        // 4. Kiểm tra Token này là của User nào (Xác minh điện thoại quét mã có thật sự đã đăng nhập không)
        const { data: { user }, error: userErr } = await supabaseAdmin.auth.getUser(token);
        
        if (userErr || !user) {
            return res.status(401).json({ error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' });
        }

        if (!user.email) {
            return res.status(400).json({ error: 'Tài khoản của bạn không có Email, không thể sử dụng chức năng đăng nhập QR.' });
        }

        // 5. Backend thay mặt người dùng tạo ra một Magic Link (OTP Link) sử dụng 1 lần
        const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: user.email,
            options: {
                // Sau khi PC bấm vào link, Supabase sẽ ném PC về trang chủ
                redirectTo: 'https://vnbusarchive.io.vn/'
            }
        });

        if (linkErr) throw linkErr;

        // 6. Trả lại cái Link đó cho Frontend (Điện thoại) để điện thoại ném qua WebRTC cho PC
        return res.status(200).json({ url: linkData.properties.action_link });

    } catch (error) {
        console.error('QR Login Generate Error:', error);
        return res.status(500).json({ error: error.message || 'Lỗi hệ thống máy chủ.' });
    }
}