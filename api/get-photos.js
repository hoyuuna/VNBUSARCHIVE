import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    // Thiết lập CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { plate, sort, limit = 10, uploader } = req.query;

    try {
        // Khởi tạo Query
        // 1. operator, route_no lấy trực tiếp từ photos
        // 2. model lấy từ bảng vehicles (join qua license_plate)
        // 3. username lấy từ bảng profiles
        // 4. Lấy luôn số lượng likes từ bảng photo_likes
        let query = supabase
            .from('photos')
            .select(`
                id,
                url,
                license_plate,
                operator,
                route_no,
                views,
                location,
                note,
                created_at,
                status,
                vehicles (
                    model
                ),
                profiles!inner (
                    username
                ),
                photo_likes (
                    count
                )
            `)
            .eq('status', 'approved');

        // Bộ lọc theo Biển kiểm soát
        if (plate) {
            query = query.ilike('license_plate', `%${plate}%`);
        }

        // Bộ lọc theo Tên người đăng (Uploader)
        if (uploader) {
            query = query.ilike('profiles.username', `%${uploader}%`);
        }

        // Sắp xếp
        if (sort === 'views') {
            query = query.order('views', { ascending: false });
        } else if (sort === 'likes') {
            // Lưu ý: Sắp xếp theo likes trong Supabase qua API phức tạp hơn, 
            // nên mặc định ưu tiên views hoặc mới nhất.
            query = query.order('views', { ascending: false });
        } else {
            // Mặc định: Mới nhất
            query = query.order('created_at', { ascending: false });
        }

        // Giới hạn số lượng (Tối đa 100 để tránh spam)
        const finalLimit = Math.min(parseInt(limit) || 10, 100);
        query = query.limit(finalLimit);

        const { data, error } = await query;

        if (error) throw error;

        // Định dạng lại dữ liệu trả về cho đẹp và khớp với Frontend
        const formattedData = data.map(item => ({
            photo_id: item.id,
            image_url: item.url,
            // Thêm proxy wsrv để load ảnh nhanh (tùy chọn)
            thumbnail_url: `https://wsrv.nl/?url=${encodeURIComponent(item.url)}&we&w=400`, 
            license_plate: item.license_plate,
            operator: item.operator || "N/A",
            route: item.route_no || "---",
            model: item.vehicles?.model || "N/A",
            uploader: item.profiles?.username || "Anonymous",
            location: item.location || "N/A",
            note: item.note || "",
            stats: {
                views: item.views || 0,
                likes: item.photo_likes?.[0]?.count || 0
            },
            posted_at: item.created_at
        }));

        // Thiết lập Cache (60 giây trên trình duyệt, 5 phút trên Vercel Edge)
        res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

        res.status(200).json({
            success: true,
            count: formattedData.length,
            filter: { plate: plate || null, uploader: uploader || null, sort: sort || 'latest', limit: finalLimit },
            data: formattedData
        });

    } catch (error) {
        console.error("API Error:", error.message);
        res.status(500).json({ 
            success: false, 
            error: "Internal Server Error",
            message: error.message 
        });
    }
}
