import { createClient } from '@supabase/supabase-js'

const escapeXML = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

const cleanLicensePlateForDisplay = (plate) => {
  if (!plate) return '';
  return plate.replace(/-\d+$/, '');
};

async function fetchAllData(supabase, table, select, conditions = {}) {
  const step = 1000;
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

  const promises = [];
  for (let from = 0; from < count; from += step) {
    let query = supabase.from(table).select(select).range(from, from + step - 1);
    if (conditions.column && conditions.value !== undefined) {
      query = query.eq(conditions.column, conditions.value);
    }
    promises.push(query);
  }

  const results = await Promise.all(promises);

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

export async function onRequest(context) {
  const { env } = context;
  
  const supabase = createClient(
    env.SUPABASE_URL, 
    env.SUPABASE_ANON_KEY
  );

  try {
    const [photos, vehicles] = await Promise.all([
      fetchAllData(
        supabase,
        'photos', 
        'id, url, license_plate, location, note, route_no, operator, type, model, vehicles(route_no, operator, model, type)', 
        { column: 'status', value: 'approved' }
      ),
      fetchAllData(supabase, 'vehicles', 'license_plate') 
    ]);

    const xmlChunks = [];

    xmlChunks.push(`<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
            xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
      <url>
        <loc>https://vnbusarchive.qzz.io/</loc>
        <priority>1.0</priority>
      </url>`);

    photos.forEach(p => {
      const vData = p.vehicles || {}; 
      const routeInfo = p.route_no || vData.route_no;
      const operatorInfo = p.operator || vData.operator;
      const modelInfo = p.model || vData.model;
      
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

    vehicles.forEach(v => {
      xmlChunks.push(`
      <url>
        <loc>https://vnbusarchive.qzz.io/vehicle/${encodeURIComponent(v.license_plate)}</loc>
        <priority>0.9</priority>
      </url>`);
    });

    xmlChunks.push(`\n    </urlset>`);

    const finalXML = xmlChunks.join(''); 

    return new Response(finalXML, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=86400',
        'Content-Type': 'text/xml'
      }
    });

  } catch (error) {
    console.error("Lỗi tạo sitemap:", error);
    return new Response('', { status: 500 });
  }
}
