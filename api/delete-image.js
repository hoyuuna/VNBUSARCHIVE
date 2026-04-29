import { createClient } from '@supabase/supabase-js';
import ImageKit from 'imagekit';

const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ success: false, error: 'Chưa xác thực.' });
        }

        // Tùy chọn: Xác thực user qua Supabase để đảm bảo an mật
        const supabase = createClient(
            process.env.SUPABASE_URL, 
            process.env.SUPABASE_KEY,
            { global: { headers: { Authorization: authHeader } } }
        );
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error('Token không hợp lệ.');

        const { imageUrl } = req.body;
        if (!imageUrl) return res.status(400).json({ success: false, error: 'Thiếu URL ảnh.' });

        // Tách tên file từ URL (vd: https://ik.imagekit.io/.../img_1234.webp -> img_1234.webp)
        const urlObj = new URL(imageUrl);
        const fileName = urlObj.pathname.split('/').pop();

        console.log(`[DEBUG] Đang tìm ảnh trên ImageKit để xóa: ${fileName}`);

        // Tìm fileId trên ImageKit bằng tên file
        const files = await imagekit.listFiles({
            searchQuery: `name="${fileName}"`
        });

        if (files && files.length > 0) {
            const fileId = files[0].fileId;
            // Xóa file hoàn toàn khỏi ImageKit
            await imagekit.deleteFile(fileId);
            console.log(`[DEBUG] Đã xóa vĩnh viễn ảnh: ${fileName} (ID: ${fileId})`);
        } else {
            console.log(`[WARN] Không tìm thấy ảnh trên ImageKit: ${fileName}`);
        }

        return res.status(200).json({ success: true });

    } catch (error) {
        console.error('[Delete Image Error]:', error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
}