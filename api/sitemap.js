import { createClient } from '@supabase/supabase-js'

// 🚀 [QUAN TRỌNG VỚI VERCEL] Tăng giới hạn thời gian chạy API lên 60s 
// (Giúp tránh lỗi 504 Timeout của Vercel Free)
export const maxDuration = 60; 

const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_ANON_KEY
);

// Hàm chống lỗi XML (Bắt buộc để không rớt sitemap khi có ký tự đặc biệt như & < >)
const escapeXML = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

// Hàm làm sạch biển số để hiển thị Tiêu đề ảnh đẹp (Bỏ hậu tố -1, -2...)
const cleanLicensePlateForDisplay = (plate) => {
  if (!plate) return '';
  return plate.replace(/-\d+$/, '');
};

// 🚀 HÀM MỚI: Kéo data theo kỹ thuật "Parallel Pagination" siêu tốc
async function fetchAllData(table, select, conditions = {}) {
  const step = 1000; // Giới hạn số dòng mỗi lần lấy của Supabase API

  // BƯỚC 1: Hỏi DB xem có tổng cộng bao nhiêu dòng thỏa mãn điều kiện (Rất nhanh vì không tải data)
  let countQuery = supabase.from(table).select('*', { count: 'exact', head: true });
  if (conditions.column && conditions.value !== undefined) {
    countQuery = countQuery.eq(conditions.column, conditions.value);
  }
  
  const { count, error: countError } = await countQuery;
  
  if (countError || count === null) {
    console.error(`Lỗi đếm số lượng bảng ${table}:`, countError);
    return [];
  }

  if (count === 0) return [];

  // BƯỚC 2: Chuẩn bị mảng các truy vấn để chạy CÙNG MỘT LÚC
  const promises = [];
  for (let from = 0; from < count; from += step) {
    let query = supabase.from(table).select(select).range(from, from + step - 1);
    if (conditions.column && conditions.value !== undefined) {
      query = query.eq(conditions.column, conditions.value);
    }
    promises.push(query); // Đẩy vào mảng chờ
  }

  // BƯỚC 3: Bắn tất cả truy vấn vào Supabase CÙNG 1 THỜI ĐIỂM
  const results = await Promise.all(promises);

  // BƯỚC 4: Gộp tất cả data từ các luồng trả về thành 1 mảng duy nhất
  let allData = [];
  for (const res of results) {
    if (res.error) {
      console.error(`Lỗi khi lấy 1 phần dữ liệu bảng ${table}:`, res.error);
    } else if (res.data) {
      allData.push(...res.data);
    }
  }

  return allData;
}

export default async function handler(req, res) {
  try {
    // 🚀 TỐI ƯU: Kéo data 2 bảng Photos và Vehicles CÙNG MỘT LÚC
    const [photos, vehicles] = await Promise.all([
      fetchAllData(
        'photos', 
        'id, url, license_plate, location, note, route_no, operator, type, model, vehicles(route_no, operator, model, type)', 
        { column: 'status', value: 'approved' }
      ),
      // Nếu sau này bạn chỉ muốn sitemap index xe đang hoạt động, đổi dòng dưới thành: 
      // fetchAllData('vehicles', 'license_plate', { column: 'is_active', value: true })
      fetchAllData('vehicles', 'license_plate') 
    ]);

    // 🚀 TỐI ƯU: Sử dụng Array.push() thay vì String (+=) để tránh tràn RAM server
    const xmlChunks = [];

    xmlChunks.push(`<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
            xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
      <url>
        <loc>https://vnbusarchive.qzz.io/</loc>
        <priority>1.0</priority>
      </url>`);

    // 1. Duyệt danh sách Photos (Xử lý Tiêu đề ảnh ẩn hậu tố -1)
    photos.forEach(p => {
      // Ưu tiên lấy dữ liệu từ bảng photos, nếu rỗng thì lấy từ bảng vehicles được Join
      const vData = p.vehicles || {}; 
      const routeInfo = p.route_no || vData.route_no;
      const operatorInfo = p.operator || vData.operator;
      const modelInfo = p.model || vData.model;
      
      // Cắt đuôi -1, -2 chỉ cho mục đích HIỂN THỊ TITLE ẢNH
      const displayPlate = cleanLicensePlateForDisplay(p.license_plate);
      
      let titleParts = [`Xe buýt ${displayPlate}`];
      if (routeInfo) titleParts.push(`Tuyến ${routeInfo}`);
      if (modelInfo) titleParts.push(modelInfo);
      const title = titleParts.join(' - '); 

      let captionParts = [];
      if (operatorInfo) captionParts.push(`Đơn vị vận hành: ${operatorInfo}`);
      if (modelInfo) captionParts.push(`Model xe: ${modelInfo}`); 
      if (p.note) captionParts.push(`Ghi chú: ${p.note}`);
      const caption = captionParts.join('. '); 

      xmlChunks.push(`
      <url>
        <loc>https://vnbusarchive.qzz.io/photo/${p.id}</loc>
        <priority>0.8</priority>
        <image:image>
          <image:loc>${escapeXML(p.url)}</image:loc>
          <image:title>${escapeXML(title)}</image:title>
          ${caption ? `<image:caption>${escapeXML(caption)}</image:caption>` : ''}
          ${p.location ? `<image:geo_location>${escapeXML(p.location)}</image:geo_location>` : ''}
        </image:image>
      </url>`);
    });

    // 2. Duyệt danh sách Vehicles (GIỮ NGUYÊN hậu tố -1, -2 cho URL gốc)
    vehicles.forEach(v => {
      xmlChunks.push(`
      <url>
        <loc>https://vnbusarchive.qzz.io/vehicle/${encodeURIComponent(v.license_plate)}</loc>
        <priority>0.9</priority>
      </url>`);
    });

    // Đóng thẻ sitemap
    xmlChunks.push(`\n    </urlset>`);

    // Gộp mảng thành chuỗi XML hoàn chỉnh
    const finalXML = xmlChunks.join(''); 

    // 🚀 TỐI ƯU: Header Cache cực mạnh (Sitemap Tĩnh hóa trên CDN Edge)
    // stale-while-revalidate=86400 -> Ép Server lưu lại kết quả này trên RAM toàn cầu trong 24 tiếng.
    // Lần gọi đầu mất 1s, các lần gọi sau Googlebot đọc mất 0.05s.
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=86400');
    res.setHeader('Content-Type', 'text/xml');
    
    // Xuất ra XML cho bot
    res.status(200).send(finalXML);

  } catch (error) {
    console.error("Lỗi tạo sitemap:", error);
    res.status(500).end();
  }
}
