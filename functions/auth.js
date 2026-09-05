export async function onRequest(context) {
    const { request, env } = context;
    
    const url = new URL(request.url);
    const indexReq = new Request(url.origin + '/', request);
    const response = await env.ASSETS.fetch(indexReq);
    
    let title = `Đăng nhập / Đăng ký | VNBUSARCHIVE`;
    let desc = `Tham gia VNBUSARCHIVE để cùng đóng góp và xây dựng cơ sở dữ liệu hình ảnh phương tiện lớn nhất Việt Nam.`;
    
    return new HTMLRewriter()
        .on('title', { element(e) { e.setInnerContent(title); } })
        .on('meta[property="og:title"]', { element(e) { e.setAttribute('content', title); } })
        .on('meta[name="twitter:title"]', { element(e) { e.setAttribute('content', title); } })
        .on('meta[property="og:description"]', { element(e) { e.setAttribute('content', desc); } })
        .on('meta[name="twitter:description"]', { element(e) { e.setAttribute('content', desc); } })
        .on('meta[name="description"]', { element(e) { e.setAttribute('content', desc); } })
        .transform(response);
}
