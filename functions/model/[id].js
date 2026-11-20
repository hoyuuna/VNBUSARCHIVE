export async function onRequest(context) {
    const { request, env, params } = context;
    let modelId = params.id;
    try { modelId = decodeURIComponent(params.id); } catch(e) {}
    
    const url = new URL(request.url);
    const indexReq = new Request(url.origin + '/', request);
    const response = await env.ASSETS.fetch(indexReq);
    
    const canonicalUrl = `https://www.vnbusarchive.io.vn/model/${encodeURIComponent(modelId)}`;
    let title = `${modelId} | VNBUSARCHIVE`;
    let desc = `Xem các hình ảnh phương tiện thuộc dòng xe ${modelId} trên VNBUSARCHIVE.`;
    
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
