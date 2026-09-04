export async function onRequest(context) {
    const { request, env, params } = context;
    const plate = params.id;
    
    const url = new URL(request.url);
    const indexReq = new Request(url.origin + '/', request);
    const response = await env.ASSETS.fetch(indexReq);
    
    if (!response.ok) return response;
    if (!env.SUPABASE_URL || !env.SUPABASE_KEY) return response;
    
    const query = new URLSearchParams({
        select: 'url, operator, route_no, vehicles(model)',
        license_plate: `eq.${plate}`,
        status: 'eq.approved',
        order: 'created_at.desc',
        limit: '1'
    });
    
    let title = `${plate} | VNBUSARCHIVE`;
    let desc = `Xem chi tiết phương tiện ${plate} trên VNBUSARCHIVE - Dự án lưu trữ ảnh xe buýt phi lợi nhuận.`;
    let imageUrl = 'https://www.vnbusarchive.io.vn/img/banner.jpg';
    
    try {
        const res = await fetch(`${env.SUPABASE_URL}/rest/v1/photos?${query.toString()}`, {
            headers: {
                'apikey': env.SUPABASE_KEY,
                'Authorization': `Bearer ${env.SUPABASE_KEY}`,
                'Accept': 'application/json'
            }
        });
        if (res.ok) {
            const data = await res.json();
            if (data && data.length > 0) {
                const photo = data[0];
                const model = photo.vehicles?.model || 'Đang cập nhật';
                title = `${plate} - ${model} | VNBUSARCHIVE`;
                
                const route = photo.route_no ? `Tuyến ${photo.route_no}` : '';
                const operator = photo.operator ? `Đơn vị: ${photo.operator}` : '';
                const parts = [route, operator].filter(Boolean);
                
                desc = parts.length > 0 ? parts.join(' | ') + ` | Xem chi tiết phương tiện ${plate}` : desc;
                imageUrl = photo.url;
            }
        }
    } catch (e) {}
    
    return new HTMLRewriter()
        .on('title', { element(e) { e.setInnerContent(title); } })
        .on('meta[property="og:title"]', { element(e) { e.setAttribute('content', title); } })
        .on('meta[name="twitter:title"]', { element(e) { e.setAttribute('content', title); } })
        .on('meta[property="og:description"]', { element(e) { e.setAttribute('content', desc); } })
        .on('meta[name="twitter:description"]', { element(e) { e.setAttribute('content', desc); } })
        .on('meta[name="description"]', { element(e) { e.setAttribute('content', desc); } })
        .on('meta[property="og:image"]', { element(e) { e.setAttribute('content', imageUrl); } })
        .on('meta[name="twitter:image"]', { element(e) { e.setAttribute('content', imageUrl); } })
        .transform(response);
}
