import { createClient } from '@supabase/supabase-js';

// Tên bucket mặc định trên Supabase
const SUPABASE_BUCKET_NAME = 'images'; 

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    try {
        // ==========================================
        // 1. XÁC THỰC BẢO MẬT BẰNG TOKEN (RLS - Dùng ANON KEY)
        // ==========================================
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ success: false, error: 'Chưa xác thực. Thiếu Token đăng nhập từ Client.' });
        }

        // Khởi tạo client BÊN TRONG handler để gán Token của user thực hiện request
        const supabase = createClient(
            process.env.SUPABASE_URL, 
            process.env.SUPABASE_KEY, // Vẫn là ANON KEY an toàn
            {
                global: {
                    headers: {
                        Authorization: authHeader // Nhét vé thông hành vào đây
                    }
                }
            }
        );

        const { imageBase64, metadata, userId, isAvatar, captchaToken } = req.body;

        // ==========================================
        // 2. XÁC THỰC CLOUDFLARE TURNSTILE (Bỏ qua nếu là đổi Avatar)
        // ==========================================
        if (!isAvatar) {
            if (!captchaToken) {
                return res.status(400).json({ success: false, error: 'Thiếu mã xác thực (Captcha).' });
            }

            const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `secret=${process.env.CAPTCHA_SECRET}&response=${captchaToken}`,
            });

            const verifyData = await verifyRes.json();

            if (!verifyData.success) {
                console.error('Turnstile verification failed:', verifyData['error-codes']);
                return res.status(400).json({ 
                    success: false, 
                    error: 'Xác thực Cloudflare Turnstile thất bại! Vui lòng thử lại.' 
                });
            }
        }

        // ==========================================
        // 3. XỬ LÝ ẢNH BASE64 & SÁT KHUẨN BỘ NHỚ
        // ==========================================
        const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
        const buffer = Buffer.from(base64Data, 'base64');
        
        console.log(`[DEBUG] Kích thước ảnh gốc: ${buffer.length} bytes`);
        if (buffer.length === 0) {
            throw new Error('Ảnh tải lên bị rỗng (0 bytes). Vui lòng thử chọn lại ảnh.');
        }

        // Cắt bỏ dữ liệu thừa trong Memory Pool của Node.js
        const cleanArrayBuffer = buffer.buffer.slice(
            buffer.byteOffset, 
            buffer.byteOffset + buffer.byteLength
        );

        let publicUrl = '';

        // ==========================================
        // 4. ƯU TIÊN 1: UPLOAD LÊN CATBOX & DEEP CHECK
        // ==========================================
        try {
            console.log('[DEBUG] Bắt đầu gọi API Catbox...');
            const formData = new FormData();
            formData.append('reqtype', 'fileupload');
            formData.append('userhash', '3d9a3be664059fa1c68d3d1f2'); // Mã userhash Catbox của bạn

            const blob = new Blob([cleanArrayBuffer], { type: 'image/jpeg' });
            formData.append('fileToUpload', blob, 'image.jpg');

            const cbRes = await fetch('https://catbox.moe/user/api.php', {
                method: 'POST',
                body: formData,
                headers: { 'Accept': 'text/plain' }
            });

            const responseText = await cbRes.text();

            if (!cbRes.ok) throw new Error(`Catbox HTTP Status: ${cbRes.status}`);
            if (!responseText || responseText.trim() === '') throw new Error('Catbox trả về chuỗi rỗng');
            if (!responseText.startsWith('http')) throw new Error(`Lỗi Logic Catbox: ${responseText}`);

            publicUrl = responseText.trim();
            console.log(`[DEBUG] Catbox đã trả về link: ${publicUrl}. Đang KIỂM TRA SÂU (Deep Check)...`);

            // ---> DEEP CHECK: Tải ngược ảnh về server để soi nội dung <---
            const deepCheckRes = await fetch(publicUrl);
            
            // 1. Catbox báo lỗi 404/500...
            if (!deepCheckRes.ok) {
                throw new Error(`Catbox link chết (HTTP ${deepCheckRes.status})`);
            }

            // 2. Catbox trả về trang HTML/Text thay vì file ảnh (Lừa đảo)
            const contentType = deepCheckRes.headers.get('content-type') || '';
            if (!contentType.includes('image')) {
                throw new Error(`Catbox trả về file không phải ảnh (Type: ${contentType})`);
            }

            // 3. Catbox trả về ảnh rỗng hoặc bị hỏng (Dung lượng < 500 bytes)
            const checkBuffer = await deepCheckRes.arrayBuffer();
            if (checkBuffer.byteLength < 500) {
                throw new Error(`Catbox sinh link ảo, file rỗng (Size: ${checkBuffer.byteLength} bytes)`);
            }

            console.log(`[DEBUG] Link Catbox xịn (Sống 100%, Dung lượng: ${checkBuffer.byteLength} bytes): ${publicUrl}`);

        } catch (catboxError) {
            console.error('===[CATBOX LỖI / LINK ẢO / FILE RỖNG - CHUYỂN SANG SUPABASE] ===');
            console.error('Chi tiết lỗi:', catboxError.message);

            // ==========================================
            // 5. FALLBACK: UPLOAD LÊN SUPABASE STORAGE
            // ==========================================
            try {
                // Đặt tên file ngẫu nhiên chống trùng (VD: vehicles/16999999-12345.jpg)
                const uniqueId = Math.round(Math.random() * 1e9);
                const folder = isAvatar ? 'avatars' : 'vehicles';
                const fileName = `${folder}/${Date.now()}-${uniqueId}.jpg`;

                console.log(`[DEBUG] Bắt đầu Upload lên Supabase Storage... (${fileName})`);

                const { data: storageData, error: storageError } = await supabase.storage
                    .from(SUPABASE_BUCKET_NAME)
                    .upload(fileName, cleanArrayBuffer, {
                        contentType: 'image/jpeg',
                        upsert: false
                    });

                if (storageError) throw storageError;

                // Lấy URL Public từ Supabase
                const { data: publicUrlData } = supabase.storage
                    .from(SUPABASE_BUCKET_NAME)
                    .getPublicUrl(fileName);

                publicUrl = publicUrlData.publicUrl;
                console.log(`[DEBUG] Upload Supabase Storage (Fallback) thành công: ${publicUrl}`);

            } catch (supabaseError) {
                console.error('=== [SUPABASE STORAGE UPLOAD CŨNG LỖI] ===');
                console.error(supabaseError);
                throw new Error('Máy chủ lưu trữ ảnh đang bảo trì. Cả Catbox và hệ thống dự phòng đều không phản hồi.');
            }
        }

        // ==========================================
        // 6. NẾU LÀ UPLOAD AVATAR: Lưu DB và dừng lại
        // ==========================================
        if (isAvatar) {
            const { error: profileErr } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', userId);
            
            if (profileErr) throw profileErr;

            return res.status(200).json({ success: true, url: publicUrl });
        }

        // ==========================================
        // 7. NẾU LÀ ĐĂNG ẢNH XE: Chạy logic DB Schema
        // ==========================================
        
        // 7.1. Lưu "Xác Xe" vào bảng vehicles (BKS và Model)
        const { error: vError } = await supabase
            .from('vehicles')
            .upsert({
                license_plate: metadata.plate,
                model: metadata.model
            }, { onConflict: 'license_plate' });

        if (vError) throw vError;

        // 7.2. Lưu "Lịch sử chuyến/Hình ảnh" vào bảng photos
        const { data: photoData, error: dbError } = await supabase
            .from('photos')
            .insert({
                url: publicUrl,
                uploader_id: userId,
                license_plate: metadata.plate,
                location: metadata.location,
                note: metadata.note,
                status: 'pending',
                camera_model: metadata.camera_model,
                exif_params: metadata.exif_params,
                taken_at: metadata.taken_at,
                operator: metadata.operator,
                route_no: metadata.route,
                type: metadata.type
            })
            .select()
            .single();

        if (dbError) throw dbError;

        // ==========================================
        // 8. THÔNG BÁO DISCORD
        // ==========================================
        if (process.env.DISCORD_PRIVATE_WEBHOOK_URL) {
            const isFallback = publicUrl.includes('supabase'); 
            const sourceText = isFallback ? '(Dự phòng Supabase)' : '(Catbox)';

            // Bỏ từ khóa 'await' ở đây để Backend trả kết quả ngay, không bắt User phải chờ Discord gửi xong
            fetch(process.env.DISCORD_PRIVATE_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: "VBS Logger",
                    embeds:[{
                        title: `📥 ẢNH MỚI CHỜ DUYỆT ${sourceText}`,
                        description: `**BKS:** ${metadata.plate}\n**Máy:** ${metadata.camera_model}\n**Ngày chụp:** ${metadata.taken_at || 'Không rõ'}\n**User:** ${metadata.username}\nID: ${photoData.id}`,
                        thumbnail: { url: publicUrl },
                        color: isFallback ? 15158332 : 16776960 
                    }]
                })
            }).catch(e => console.error('Lỗi gửi Discord:', e));
        }

        // CHẮC CHẮN publicUrl lúc này là SỐNG VÀ XỊN 100%
        return res.status(200).json({ success: true, url: publicUrl });

    } catch (error) {
        console.error('[System Error Handler]:', error.message);
        return res.status(500).json({ success: false, error: error.message || 'Lỗi hệ thống không xác định.' });
    }
}
