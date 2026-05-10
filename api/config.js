export default function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const referer = req.headers.referer || '';
    const origin = req.headers.origin || '';

    // Khai báo các domain được phép lấy Key (Thêm domain test của bạn vào nếu cần)
    const allowedDomains =[
        'vnbusarchive.io.vn'
    ];

    // Kiểm tra xem request có đến từ một trong các domain trên không
    const isAllowed = allowedDomains.some(domain => 
        origin.includes(domain) || referer.includes(domain)
    );

    // Nếu trên môi trường thật mà không khớp domain -> Chặn
    if (process.env.NODE_ENV === 'production' && !isAllowed) {
        // Log ra Vercel console để biết nó đang bị nhận diện là domain nào
        console.log("Bị chặn! Origin:", origin, "Referer:", referer);
        return res.status(403).json({ error: 'Forbidden - Domain không hợp lệ' });
    }

    // Trả về Key nếu hợp lệ
    res.status(200).json({
        FIREBASE_URL: process.env.FIREBASE_URL,
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_KEY: process.env.SUPABASE_KEY
    });
}