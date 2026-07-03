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
  let allData = [];
  let from = 0;
  while (true) {
    let query = supabase.from(table).select(select).range(from, from + step - 1);
    if (conditions.column && conditions.value !== undefined) {
      query = query.eq(conditions.column, conditions.value);
    }
    const { data, error } = await query;
    if (error) {
      console.error(`Lỗi lấy dữ liệu bảng ${table} range ${from}:`, JSON.stringify(error));
      break;
    }
    if (!data || data.length === 0) break;
    allData = allData.concat(data);
    if (data.length < step) break;
    from += step;
  }
  return allData;
}

export async function onRequest(context) {
  const { request, env } = context;
  
  const requestUrl = new URL(request.url);
  const protocol = request.headers.get('x-forwarded-proto') || 'https';
  const host = request.headers.get('host') || requestUrl.host;
  const baseUrl = `${protocol}://${host}`;

  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_KEY || env.SUPABASE_ANON_KEY;
  if (!env.SUPABASE_URL || !key) {
    console.error("Thiếu SUPABASE_URL hoặc SUPABASE_KEY cho sitemap");
    return new Response('', { status: 500 });
  }
  const supabase = createClient(env.SUPABASE_URL, key);

  try {
    const [photos, vehicles] = await Promise.all([
      fetchAllData(
        supabase,
        'photos', 
        'id, url, license_plate, location, note, route_no, operator, type', 
        { column: 'status', value: 'approved' }
      ),
      fetchAllData(supabase, 'vehicles', 'license_plate, route_no, operator, model') 
    ]);

    const vehicleMap = new Map();
    vehicles.forEach(v => {
      if (v && v.license_plate) vehicleMap.set(v.license_plate, v);
    });

    const xmlChunks = [];

    xmlChunks.push(`<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
            xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
      <url>
        <loc>${escapeXML(baseUrl)}/</loc>
        <priority>1.0</priority>
        <changefreq>daily</changefreq>
      </url>`);

    photos.forEach(p => {
      const vData = vehicleMap.get(p.license_plate) || {}; 
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
        <loc>${escapeXML(baseUrl)}/photo/${p.id}</loc>
        <priority>0.8</priority>
        <changefreq>weekly</changefreq>
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
        <loc>${escapeXML(baseUrl)}/vehicle/${encodeURIComponent(v.license_plate)}</loc>
        <priority>0.9</priority>
        <changefreq>weekly</changefreq>
      </url>`);
    });

    xmlChunks.push(`\n    </urlset>`);

    const finalXML = xmlChunks.join(''); 

    return new Response(finalXML, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/xml; charset=utf-8'
      }
    });

  } catch (error) {
    console.error("Lỗi tạo sitemap:", error);
    return new Response('', { status: 500 });
  }
}
