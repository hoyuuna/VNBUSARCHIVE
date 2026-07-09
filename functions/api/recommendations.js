export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const photoId = url.searchParams.get('photoId');
    const uploaderId = url.searchParams.get('uploaderId');
    const operator = url.searchParams.get('operator');
    const routeNo = url.searchParams.get('routeNo');
    
    // Khởi tạo Supabase client sử dụng Biến môi trường của Cloudflare Pages
    if (!env.SUPABASE_URL || !env.SUPABASE_KEY) {
        return new Response(JSON.stringify({ error: 'Server misconfiguration' }), { status: 500 });
    }
    
    // We can't import supabase-js easily unless it's bundled or we just use fetch
    // Using fetch directly to Supabase REST API is very light for Cloudflare Workers
    const sbUrl = env.SUPABASE_URL;
    const sbKey = env.SUPABASE_KEY;
    const headers = {
        'apikey': sbKey,
        'Authorization': `Bearer ${sbKey}`,
        'Content-Type': 'application/json'
    };

    try {
        let results = [];
        
        if (photoId) {
            // Logic cho loadDetailRecommendations
            const queries = [];
            
            if (operator && operator !== '---') {
                queries.push(fetch(`${sbUrl}/rest/v1/photos?select=*,profiles(id,username,role,subroles,ban_status),vehicles(model)&status=eq.approved&id=neq.${photoId}&operator=eq.${encodeURIComponent(operator)}&limit=15`, { headers }).then(r => r.json()));
            }
            if (routeNo && routeNo !== '---') {
                queries.push(fetch(`${sbUrl}/rest/v1/photos?select=*,profiles(id,username,role,subroles,ban_status),vehicles(model)&status=eq.approved&id=neq.${photoId}&route_no=eq.${encodeURIComponent(routeNo)}&limit=15`, { headers }).then(r => r.json()));
            }
            if (uploaderId) {
                queries.push(fetch(`${sbUrl}/rest/v1/photos?select=*,profiles(id,username,role,subroles,ban_status),vehicles(model)&status=eq.approved&id=neq.${photoId}&uploader_id=eq.${encodeURIComponent(uploaderId)}&limit=15`, { headers }).then(r => r.json()));
            }
            
            // Backup
            queries.push(fetch(`${sbUrl}/rest/v1/photos?select=*,profiles(id,username,role,subroles,ban_status),vehicles(model)&status=eq.approved&id=neq.${photoId}&order=created_at.desc&limit=20`, { headers }).then(r => r.json()));
            
            const allResponses = await Promise.all(queries);
            let combined = [];
            allResponses.forEach(res => {
                if (Array.isArray(res)) {
                    combined = combined.concat(res);
                }
            });
            
            // Xóa trùng lặp
            const map = new Map();
            combined.forEach(p => map.set(p.id, p));
            let uniquePhotos = Array.from(map.values());
            
            // Trộn ngẫu nhiên
            uniquePhotos = uniquePhotos.sort(() => 0.5 - Math.random());
            
            // Lấy 8 ảnh
            results = uniquePhotos.slice(0, 8);
        } else {
            // Logic cho loadRecommendations (trang chủ)
            const topRoute = url.searchParams.get('topRoute');
            const topOp = url.searchParams.get('topOp');
            const topModel = url.searchParams.get('topModel');
            
            const res = await fetch(`${sbUrl}/rest/v1/photos?select=*,vehicles(model)&status=eq.approved&order=created_at.desc&limit=100`, { headers });
            const recentPhotos = await res.json();
            
            if (Array.isArray(recentPhotos)) {
                let matched = recentPhotos.filter(p => {
                    const route = p.route_no || '';
                    const op = p.operator || '';
                    const model = p.vehicles?.model || '';
                    return (topRoute && route === topRoute) ||
                           (topOp && op === topOp) ||
                           (topModel && model === topModel);
                });
                
                // Randomize
                matched = matched.sort(() => 0.5 - Math.random()).slice(0, 8);
                
                // Fallback nếu ít hơn 8
                if (matched.length < 8) {
                    const backup = recentPhotos.filter(p => !matched.find(m => m.id === p.id))
                                               .sort(() => 0.5 - Math.random())
                                               .slice(0, 8 - matched.length);
                    matched = matched.concat(backup);
                }
                results = matched;
            }
        }
        
        return new Response(JSON.stringify(results), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
