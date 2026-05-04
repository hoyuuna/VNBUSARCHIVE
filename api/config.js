export default function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Trả về đúng tên biến mà file HTML đang dùng
    res.status(200).json({
        FIREBASE_URL: process.env.FIREBASE_URL
    });
}