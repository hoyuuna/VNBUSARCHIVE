export async function onRequest(context) {
    const { request, env, params } = context;
    let routeId = 'Không xác định';
    let rawPath = '';
    if (params.path && params.path.length > 0) {
        rawPath = params.path.join('/');
        routeId = params.path[params.path.length - 1];
    }
    try {
        routeId = decodeURIComponent(routeId);
        if (routeId.includes(' - ')) {
            routeId = routeId.split(' - ')[0].trim();
        }
    } catch(e) {}
    
    const url = new URL(request.url);
    const indexReq = new Request(url.origin + '/', request);
    const response = await env.ASSETS.fetch(indexReq);
    
    const canonicalUrl = `https://www.vnbusarchive.io.vn/route/${rawPath}`;
    let title = `Tuyến ${routeId} | VNBUSARCHIVE`;
    let desc = `Xem các hình ảnh phương tiện hoạt động trên tuyến ${routeId} trên VNBUSARCHIVE - Dự án lưu trữ ảnh xe buýt phi lợi nhuận.`;
    
    return new HTMLRewriter()
        .on('title', { element(e) { e.setInnerContent(title); } })
        .on('link[rel="canonical"]', { element(e) { e.setAttribute('href', canonicalUrl); } })
        .on('meta[property="og:url"]', { element(e) { e.setAttribute('content', canonicalUrl); } })
        .on('meta[name="twitter:url"]', { element(e) { e.setAttribute('content', canonicalUrl); } })
        .on('meta[property="og:title"]', { element(e) { e.setAttribute('content', title); } })
        .on('meta[name="twitter:title"]', { element(e) { e.setAttribute('content', title); } })
        .on('meta[property="og:description"]', { element(e) { e.setAttribute('content', desc); } })
        .on('meta[name="twitter:description"]', { element(e) { e.setAttribute('content', desc); } })
        .on('meta[name="description"]', { element(e) { e.setAttribute('content', desc); } })
        .transform(response);
}
