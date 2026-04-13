export default function handler(req, res) {
    // Chỉ cho phép GET request
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Trả về biến môi trường từ Vercel
    res.status(200).json({
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY
    });
}
