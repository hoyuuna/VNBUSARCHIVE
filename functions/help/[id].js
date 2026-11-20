export async function onRequest(context) {
    const { request, env } = context;
    
    const url = new URL(request.url);
    const indexReq = new Request(url.origin + '/', request);
    const response = await env.ASSETS.fetch(indexReq);
    
    const canonicalUrl = url.origin + url.pathname;
    let title = `Trung tâm hỗ trợ | VNBUSARCHIVE`;
    let desc = `Xem hướng dẫn và giải đáp thắc mắc trên Trung tâm hỗ trợ của VNBUSARCHIVE.`;
    
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
