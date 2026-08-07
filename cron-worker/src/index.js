import { createClient } from '@supabase/supabase-js';

export default {
    async scheduled(event, env, ctx) {
        ctx.waitUntil(cleanupPhotos(env));
    },
};

async function cleanupPhotos(env) {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('Thiếu cấu hình Supabase Server.');
        return;
    }

    const supabaseAdmin = createClient(
        env.SUPABASE_URL,
        env.SUPABASE_SERVICE_ROLE_KEY
    );

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const cutoffDateString = fourteenDaysAgo.toISOString();

    console.log(`Bắt đầu dọn dẹp ảnh bị từ chối từ trước ngày: ${cutoffDateString}`);

    // Truy vấn tối đa 50 ảnh
    const { data: photos, error: dbError } = await supabaseAdmin
        .from('photos')
        .select('id, url, created_at')
        .eq('status', 'denied')
        .lt('created_at', cutoffDateString)
        .ilike('url', 'http%')
        .limit(50);

    if (dbError) {
        console.error('Lỗi khi truy vấn DB:', dbError);
        return;
    }

    if (!photos || photos.length === 0) {
        console.log('Không có ảnh nào cần dọn dẹp.');
        return;
    }

    let successCount = 0;
    let failCount = 0;

    const processPhoto = async (photo) => {
        try {
            const urlObj = new URL(photo.url);
            const fileName = urlObj.pathname.split('/').pop();
            const safeFileName = encodeURIComponent(fileName);

            console.log(`Đang gọi API CF ImgBed để xóa: ${safeFileName}`);
            const deleteUrl = `https://cdn.vnbusarchive.io.vn/api/manage/delete/${safeFileName}`;
            
            const deleteResponse = await fetch(deleteUrl, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${env.CF_IMGBED_TOKEN}`
                }
            });

            const deleteResult = await deleteResponse.json().catch(() => null);

            // Dù thành công hay file không tồn tại (đã xóa), đều đánh dấu DB là deleted
            if (deleteResponse.ok || (deleteResult && !deleteResult.result)) {
                const { error: updateErr } = await supabaseAdmin
                    .from('photos')
                    .update({ url: 'sandbox:cdn_deleted' })
                    .eq('id', photo.id);
                
                if (updateErr) throw updateErr;
                successCount++;
            } else {
                throw new Error(`CDN API lỗi HTTP ${deleteResponse.status}`);
            }
        } catch (err) {
            console.error(`Lỗi khi xử lý ảnh ${photo.id}: ${err.message}`);
            failCount++;
        }
    };

    await Promise.allSettled(photos.map(p => processPhoto(p)));

    console.log(`Hoàn thành. Thành công: ${successCount}. Thất bại: ${failCount}.`);
}
