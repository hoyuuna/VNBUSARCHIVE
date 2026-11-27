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
  const maxPages = 20; // Hỗ trợ tới 20,000 bản ghi mỗi bảng
  const batchSize = 2; // Giới hạn 2 request song song mỗi lượt để tránh quá tải PostgREST/middleware
  let allData = [];

  for (let startPage = 0; startPage < maxPages; startPage += batchSize) {
    const pagePromises = [];
    for (let j = 0; j < batchSize && (startPage + j) < maxPages; j++) {
      const i = startPage + j;
      const from = i * step;
      const to = from + step - 1;
      let query = supabase.from(table).select(select).range(from, to);
      if (conditions.column && conditions.value !== undefined) {
        query = query.eq(conditions.column, conditions.value);
      }
      pagePromises.push(query);
    }

    const results = await Promise.all(pagePromises);
    let reachedEnd = false;

    for (const res of results) {
      if (res.error) {
        throw new Error(`Lỗi lấy dữ liệu bảng ${table}: ${JSON.stringify(res.error)}`);
      }
      if (!res.data || res.data.length === 0) {
        reachedEnd = true;
        break;
      }
      allData = allData.concat(res.data);
      if (res.data.length < step) {
        reachedEnd = true;
        break;
      }
    }

    if (reachedEnd) break;
  }
  return allData;
}

export async function onRequest(context) {
  const { request, env } = context;
  
  const cache = caches.default;
  const cacheKey = new Request(request.url, request);
  let cachedResponse = await cache.match(cacheKey);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  const requestUrl = new URL(request.url);
  const protocol = request.headers.get('x-forwarded-proto') || 'https';
  let host = request.headers.get('host') || requestUrl.host;
  if (host === 'vnbusarchive.io.vn') {
    host = 'www.vnbusarchive.io.vn';
  }
  const baseUrl = `${protocol}://${host}`;

  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_KEY || env.SUPABASE_ANON_KEY;
  if (!env.SUPABASE_URL || !key) {
    console.error("Thiếu SUPABASE_URL hoặc SUPABASE_KEY cho sitemap");
    return new Response('', { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
  const supabase = createClient(env.SUPABASE_URL, key);

  try {
    const vehicles = await fetchAllData(supabase, 'vehicles', 'license_plate, photos!inner(status)', { column: 'photos.status', value: 'approved' });
    if (!vehicles || vehicles.length === 0) {
      throw new Error('Sitemap vehicles query returned empty result');
    }

    const xmlChunks = [];

    xmlChunks.push(`<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url>
        <loc>${escapeXML(baseUrl)}/</loc>
        <priority>1.0</priority>
        <changefreq>daily</changefreq>
      </url>`);

    vehicles.forEach(v => {
      if (v && v.license_plate) {
        xmlChunks.push(`
      <url>
        <loc>${escapeXML(baseUrl)}/vehicle/${encodeURIComponent(v.license_plate)}</loc>
        <priority>0.8</priority>
        <changefreq>weekly</changefreq>
      </url>`);
      }
    });

    xmlChunks.push(`\n    </urlset>`);

    const finalXML = xmlChunks.join(''); 

    const response = new Response(finalXML, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
        'Content-Type': 'application/xml; charset=utf-8'
      }
    });

    context.waitUntil(cache.put(cacheKey, response.clone()));
    return response;

  } catch (error) {
    console.error("Lỗi tạo sitemap:", error);
    return new Response('', { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }
}
