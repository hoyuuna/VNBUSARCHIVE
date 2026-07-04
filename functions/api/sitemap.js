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
  const maxPages = 15; // Hỗ trợ tới 15,000 bản ghi mỗi bảng
  const pagePromises = [];

  for (let i = 0; i < maxPages; i++) {
    const from = i * step;
    const to = from + step - 1;
    let query = supabase.from(table).select(select).range(from, to);
    if (conditions.column && conditions.value !== undefined) {
      query = query.eq(conditions.column, conditions.value);
    }
    pagePromises.push(query);
  }

  const results = await Promise.all(pagePromises);
  let allData = [];
  for (const res of results) {
    if (res.error) {
      console.error(`Lỗi lấy dữ liệu bảng ${table}:`, JSON.stringify(res.error));
      break;
    }
    if (!res.data || res.data.length === 0) break;
    allData = allData.concat(res.data);
    if (res.data.length < step) break;
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
    const [vehicles, photos, profiles] = await Promise.all([
      fetchAllData(supabase, 'vehicles', 'license_plate'),
      fetchAllData(supabase, 'photos', 'id', { column: 'status', value: 'approved' }),
      fetchAllData(supabase, 'profiles', 'username')
    ]);

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

    photos.forEach(p => {
      if (p && p.id) {
        xmlChunks.push(`
      <url>
        <loc>${escapeXML(baseUrl)}/photo/${p.id}</loc>
        <priority>0.9</priority>
        <changefreq>weekly</changefreq>
      </url>`);
      }
    });

    profiles.forEach(u => {
      if (u && u.username) {
        xmlChunks.push(`
      <url>
        <loc>${escapeXML(baseUrl)}/user/${encodeURIComponent(u.username)}</loc>
        <priority>0.7</priority>
        <changefreq>weekly</changefreq>
      </url>`);
      }
    });

    xmlChunks.push(`\n    </urlset>`);

    const finalXML = xmlChunks.join(''); 

    return new Response(finalXML, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
        'Content-Type': 'application/xml; charset=utf-8'
      }
    });

  } catch (error) {
    console.error("Lỗi tạo sitemap:", error);
    return new Response('', { status: 500 });
  }
}
