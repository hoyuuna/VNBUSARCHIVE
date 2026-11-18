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
  // Chỉ dùng ĐÚNG 1 request duy nhất với limit=10000 để giảm tải tối đa cho Render và DB Aiven (thay vì bắn 10 request song song)
  const res = await fetchFromRenderWithFailover(
    '/vehicles?select=license_plate,photos!inner(status)&photos.status=eq.approved&limit=10000'
  );
  if (!res) return [];

  const list = await res.json().catch(() => []);
  if (!Array.isArray(list)) return [];

  const seen = new Set();
  const allVehicles = [];
  for (const v of list) {
    if (v && v.license_plate && !seen.has(v.license_plate)) {
      seen.add(v.license_plate);
      allVehicles.push(v);
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

    // Cache 30 phút (1800s) tại Cloudflare Edge: Google bot vẫn quét cập nhật đều đặn trong ngày
    // mà Render/DB chỉ phải trả lời tối đa 2 lần/tiếng nếu có bot quét liên tục
    const response = new Response(finalXML, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=1800, s-maxage=1800, stale-while-revalidate=3600',
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
