export async function onRequest(context) {
    const { request, env, next } = context;
    const url = new URL(request.url);

    // Xử lý fallback cho các bundle JS (app.*.js hoặc app.js)
    // Ngăn chặn triệt để lỗi Cloudflare Pages trả về text/html index.html khi bundle cũ bị yêu cầu
    if (/^\/app(\.[0-9a-f]+)?\.js$/i.test(url.pathname)) {
        try {
            const assetRes = await env.ASSETS.fetch(request);
            const contentType = assetRes.headers.get('content-type') || '';
            
            // Nếu tìm thấy asset tĩnh thực sự và là JS, trả về ngay
            if (assetRes.status === 200 && (contentType.includes('javascript') || contentType.includes('application/x-javascript'))) {
                return assetRes;
            }
        } catch (e) {}

        // Nếu file bị thiếu hoặc Cloudflare SPA trả về fallback text/html:
        // Luôn trả về nội dung của /app.js mới nhất với MIME type application/javascript
        try {
            const fallbackReq = new Request(new URL('/app.js', request.url), request);
            const fallbackRes = await env.ASSETS.fetch(fallbackReq);
            const headers = new Headers(fallbackRes.headers);
            headers.set('Content-Type', 'application/javascript; charset=utf-8');
            headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');

            return new Response(fallbackRes.body, {
                status: 200,
                statusText: 'OK',
                headers
            });
        } catch (err) {
            return new Response('console.error("Failed to load app fallback");', {
                status: 200,
                headers: { 'Content-Type': 'application/javascript; charset=utf-8' }
            });
        }
    }

    return next();
}
