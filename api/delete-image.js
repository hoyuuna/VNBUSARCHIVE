import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ success: false, error: 'Chưa xác thực.' });
        }

        const supabase = createClient(
            process.env.SUPABASE_URL, 
            process.env.SUPABASE_KEY,
            { global: { headers: { Authorization: authHeader } } }
        );
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error('Token không hợp lệ.');

        const { imageUrl } = req.body;
        if (!imageUrl) return res.status(400).json({ success: false, error: 'Thiếu URL ảnh.' });

        // Tách tên file từ URL (vd: https://cdn.vnbusarchive.io.vn/img_1234.webp -> img_1234.webp)
        const urlObj = new URL(imageUrl);
        const fileName = urlObj.pathname.split('/').pop();
        const safeFileName = encodeURIComponent(fileName);

        console.log(`[DEBUG] Đang gọi API CF ImgBed để xóa: ${safeFileName}`);

        const deleteUrl = `https://cdn.vnbusarchive.io.vn/api/manage/delete/${safeFileName}`;
        
        const deleteResponse = await fetch(deleteUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.CF_IMGBED_TOKEN}`
            }
        });

        const deleteResult = await deleteResponse.json();

        if (deleteResponse.ok && deleteResult) {
            console.log(`[DEBUG] Đã xóa vĩnh viễn ảnh: ${fileName}`);
            return res.status(200).json({ success: true });
        } else {
            console.log(`[WARN] Lỗi xóa ảnh CF ImgBed:`, deleteResult);
            // Dù lỗi bên CF (có thể do file đã bị xóa từ trước), ta vẫn trả về success để Frontend đi tiếp
            return res.status(200).json({ success: true, message: 'File có thể đã bị xóa trước đó.' });
        }

    } catch (error) {
        console.error('[Delete Image Error]:', error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
}