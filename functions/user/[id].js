export async function onRequest(context) {
    const { request, env, params } = context;
    const userId = params.id;
    
    const url = new URL(request.url);
    const indexReq = new Request(url.origin + '/', request);
    const response = await env.ASSETS.fetch(indexReq);
    
    if (!response.ok) return response;
    if (!env.SUPABASE_URL || !env.SUPABASE_KEY) return response;
    
    const query = new URLSearchParams({
        select: 'username, avatar_url, role',
        id: `eq.${userId}`
    });
    
    let title = `Hồ sơ người dùng | VNBUSARCHIVE`;
    let desc = `Xem trang cá nhân của thành viên trên VNBUSARCHIVE - Dự án lưu trữ ảnh xe buýt phi lợi nhuận.`;
    let imageUrl = 'https://www.vnbusarchive.io.vn/img/banner.jpg';
    
    try {
        const res = await fetch(`${env.SUPABASE_URL}/rest/v1/profiles?${query.toString()}`, {
            headers: {
                'apikey': env.SUPABASE_KEY,
                'Authorization': `Bearer ${env.SUPABASE_KEY}`,
                'Accept': 'application/json'
            }
        });
        if (res.ok) {
            const data = await res.json();
            if (data && data.length > 0) {
                const user = data[0];
                const username = user.username || 'Thành viên Ẩn danh';
                title = `${username} | VNBUSARCHIVE`;
                desc = `Xem bộ sưu tập và những đóng góp của ${username} trên VNBUSARCHIVE.`;
                if (user.avatar_url) {
                    imageUrl = user.avatar_url;
                }
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
