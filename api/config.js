export default function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // [BẢO MẬT] Chặn domain lạ gọi API lấy Key
    const referer = req.headers.referer || '';
    const origin = req.headers.origin || '';
    const allowedDomain = 'vnbusarchive.qzz.io';

    if (
        process.env.NODE_ENV === 'production' && 
        !referer.includes(allowedDomain) && 
        !origin.includes(allowedDomain)
    ) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    // Trả về cả cấu hình Firebase và Supabase
    res.status(200).json({
        FIREBASE_URL: process.env.FIREBASE_URL,
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_KEY: process.env.SUPABASE_KEY
    });
}