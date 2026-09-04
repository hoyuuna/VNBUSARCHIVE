export async function onRequest(context) {
    const { request, env, params } = context;
    const photoId = params.id;
    
    const url = new URL(request.url);
    const indexReq = new Request(url.origin + '/', request);
    const response = await env.ASSETS.fetch(indexReq);
    
    if (!response.ok) return response;
    if (!env.SUPABASE_URL || !env.SUPABASE_KEY) return response;
    
    const query = new URLSearchParams({
        select: 'url, license_plate, operator, route_no, vehicles(model), profiles(username)',
        id: `eq.${photoId}`
    });
    
    let title = `Ảnh xe | VNBUSARCHIVE`;
    let desc = `Xem ảnh xe buýt/xe khách trên VNBUSARCHIVE - Dự án lưu trữ ảnh xe buýt phi lợi nhuận.`;
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
                const plate = photo.license_plate || 'Không rõ biển số';
                title = `${plate} - ${model} | VNBUSARCHIVE`;
                
                const route = photo.route_no ? `Tuyến ${photo.route_no}` : '';
                const operator = photo.operator ? `Đơn vị: ${photo.operator}` : '';
                const uploader = photo.profiles?.username ? `Bởi ${photo.profiles.username}` : '';
                const parts = [route, operator, uploader].filter(Boolean);
                
                desc = parts.length > 0 ? parts.join(' | ') + ` | Xem ảnh ${plate}` : desc;
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
        .on('meta[name="twitter:card"]', { element(e) { e.setAttribute('content', 'summary_large_image'); } })
        .transform(response);
}
