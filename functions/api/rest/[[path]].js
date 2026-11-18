function validateOriginAndReferer(request) {
    const referer = request.headers.get('referer') || '';
    const origin = request.headers.get('origin') || '';
    const host = request.headers.get('host') || '';
    const isProduction = host.includes('vnbusarchive.io.vn');
    
    if (!isProduction) return true;
    if (!origin && !referer) return false;
    
    function checkDomain(str) {
        if (!str) return false;
        try {
            const u = new URL(str);
            return u.hostname === 'vnbusarchive.io.vn' || u.hostname.endsWith('.vnbusarchive.io.vn');
        } catch (e) {
            return false;
        }
    }
    return checkDomain(origin) || checkDomain(referer);
}

export async function onRequest(context) {
    const { request, env, params } = context;

    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD',
                'Access-Control-Allow-Headers': '*',
            }
        });
    }

    if (!validateOriginAndReferer(request)) {
        return new Response(JSON.stringify({ error: 'Access Denied: Untrusted Origin or Referer.' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const targetBase = env.SUPABASE_URL || 'https://vnbusarchive-middle-api.nghoanganhtuann.workers.dev';
    const fallbackBase = 'https://vnbusarchive-middle-api.nghoanganhtuann.workers.dev';
    const reqUrl = new URL(request.url);
    const subPath = Array.isArray(params.path) ? params.path.join('/') : (params.path || '');
    
    let targetUrl = new URL(`/rest/v1/${subPath}`, targetBase);
    targetUrl.search = reqUrl.search;

    const reqHeaders = new Headers(request.headers);
    reqHeaders.set('Origin', 'https://vnbusarchive.io.vn');
    reqHeaders.set('Referer', 'https://vnbusarchive.io.vn/');

    const clientIp = (request.headers.get('CF-Connecting-IP') || request.headers.get('x-real-ip') || '').trim();
    if (clientIp) {
        reqHeaders.set('X-Forwarded-For', clientIp);
        reqHeaders.set('CF-Connecting-IP', clientIp);
    }

    const init = {
        method: request.method,
        headers: reqHeaders,
        redirect: 'follow'
    };

    if (request.method !== 'GET' && request.method !== 'HEAD') {
        init.body = await request.arrayBuffer();
    }

    try {
        let response;
        try {
            response = await fetch(targetUrl.toString(), init);
        } catch (initialNetErr) {
            // Nếu targetBase (api.vnbusarchive.io.vn) bị lỗi mạng/DNS thì failover sang workers.dev
            if (targetBase !== fallbackBase) {
                targetUrl = new URL(`/rest/v1/${subPath}`, fallbackBase);
                targetUrl.search = reqUrl.search;
                response = await fetch(targetUrl.toString(), init);
            } else {
                throw initialNetErr;
            }
        }

        // Auto retry nếu upstream trả về 502/503/504
        if (response.status === 502 || response.status === 503 || response.status === 504) {
            // Thử failover sang fallbackBase nếu trước đó dùng targetBase
            if (targetBase !== fallbackBase) {
                targetUrl = new URL(`/rest/v1/${subPath}`, fallbackBase);
                targetUrl.search = reqUrl.search;
                response = await fetch(targetUrl.toString(), init);
            }
            if (response.status === 502 || response.status === 503 || response.status === 504) {
                for (let r = 0; r < 2; r++) {
                    await new Promise(res => setTimeout(res, 1200));
                    response = await fetch(targetUrl.toString(), init);
                    if (response.status !== 502 && response.status !== 503 && response.status !== 504) break;
                }
            }
        }

        const resHeaders = new Headers(response.headers);
        resHeaders.set('Access-Control-Allow-Origin', '*');
        resHeaders.set('Access-Control-Expose-Headers', 'content-range, range-unit, preference-applied, content-location');

        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: resHeaders
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: 'Gateway Fetch Error', message: err.message }), {
            status: 502,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
