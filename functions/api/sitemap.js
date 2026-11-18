const RENDER_POOL = [
  'https://postgrest-latest-p0q8.onrender.com',
  'https://postgrest-latest-se4u.onrender.com'
];

const escapeXML = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

async function fetchFromRenderWithFailover(subPath, init = {}) {
  for (let i = 0; i < RENDER_POOL.length; i++) {
    const target = `${RENDER_POOL[i]}${subPath}`;
    try {
      const res = await fetch(target, {
        ...init,
        headers: {
          'Accept': 'application/json',
          ...(init.headers || {})
        },
        signal: AbortSignal.timeout(10000)
      });
      if (res.ok) return res;
    } catch (e) {
      console.warn(`[Sitemap] Render endpoint ${RENDER_POOL[i]} failed, switching to backup.`);
    }
  }
  return null;
}

async function fetchAllApprovedVehicles() {
  const step = 1000;
  const maxPages = 10; // Hỗ trợ tới 10,000 xe
  const pagePromises = [];

  for (let i = 0; i < maxPages; i++) {
    const from = i * step;
    const to = from + step - 1;
    pagePromises.push(
      fetchFromRenderWithFailover(
        '/vehicles?select=license_plate,photos!inner(status)&photos.status=eq.approved',
        { headers: { 'Range': `${from}-${to}` } }
      ).then(async (res) => {
        if (!res) return [];
        return await res.json().catch(() => []);
      })
    );
  }

  const results = await Promise.all(pagePromises);
  const seen = new Set();
  const allVehicles = [];

  for (const list of results) {
    if (!Array.isArray(list) || list.length === 0) continue;
    for (const v of list) {
      if (v && v.license_plate && !seen.has(v.license_plate)) {
        seen.add(v.license_plate);
        allVehicles.push(v);
      }
    }
  }
  return allVehicles;
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

  try {
    const vehicles = await fetchAllApprovedVehicles();

    const xmlChunks = [];

    xmlChunks.push(`<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url>
        <loc>${escapeXML(baseUrl)}/</loc>
        <priority>1.0</priority>
        <changefreq>daily</changefreq>
      </url>`);

    ['tos', 'ar', 'cr', 'intro'].forEach(slug => {
      xmlChunks.push(`
      <url>
        <loc>${escapeXML(baseUrl)}/${slug}</loc>
        <priority>0.5</priority>
        <changefreq>monthly</changefreq>
      </url>`);
    });

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

    // Giảm thời gian cache xuống 10 phút (600s) thay vì 1 tiếng (3600s) để Google bot cập nhật nhanh hơn
    const response = new Response(finalXML, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=600, s-maxage=600, stale-while-revalidate=1800',
        'Content-Type': 'application/xml; charset=utf-8'
      }
    });

    context.waitUntil(cache.put(cacheKey, response.clone()));
    return response;

  } catch (error) {
    console.error("Lỗi tạo sitemap:", error);
    return new Response('', { status: 500 });
  }
}
