import { createClient } from '@supabase/supabase-js';

const DEFAULT_TITLE = 'VNBUSARCHIVE';
const DEFAULT_DESCRIPTION = 'Dự án lưu trữ ảnh xe buýt phi lợi nhuận';
const DEFAULT_IMAGE = '';

const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const escapeAttr = escapeHtml;

const cleanLicensePlateForDisplay = (plate) => {
    if (!plate) return '';
    return String(plate).replace(/-\d+$/, '');
};

const formatPlateVariations = (plate) => {
    if (!plate) return '';
    const p = String(plate).trim().replace(/-\d+$/, '');
    if (!p) return '';
    const clean = p.replace(/[\s.,_-]/g, '').toUpperCase();
    const match = clean.match(/^([A-Z0-9]*[A-Z])(\d{4,5})$/);
    if (!match) return p;
    const prefix = match[1];
    const num = match[2];
    if (num.length === 5) {
        return [...new Set([
            `${prefix}${num}`,
            `${prefix}-${num.slice(0, 3)}.${num.slice(3)}`,
            `${prefix}-${num}`
        ])].join(' / ');
    } else if (num.length === 4) {
        return [...new Set([
            `${prefix}${num}`,
            `${prefix}-${num}`
        ])].join(' / ');
    }
    return p;
};

const truncate = (value, max) => {
    const text = String(value || '').replace(/\s+/g, ' ').trim();
    return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
};

const normalizePlate = (plate) => {
    if (!plate) return '';
    let decoded = plate;
    try { decoded = decodeURIComponent(plate); } catch (_) {}
    return decoded.replace(/[^A-Z0-9.-]/gi, '').toUpperCase();
};

const getImageProxyUrl = (url, filename = 'image.jpg') => {
    if (!url) return DEFAULT_IMAGE;
    return String(url);
};

const createSupabase = (env) => {
    if (!env.SUPABASE_URL) return null;
    const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_KEY || env.SUPABASE_ANON_KEY;
    if (!key) return null;
    return createClient(env.SUPABASE_URL, key);
};

const fetchPhotoEmbed = async (photoId, baseUrl, env) => {
    const supabase = createSupabase(env);
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('photos')
        .select('id, url, license_plate, operator, route_no, type, location, note, taken_at, vehicles(model), profiles(username)')
        .eq('id', photoId)
        .eq('status', 'approved')
        .maybeSingle();

    if (error || !data) return null;

    const displayPlate = cleanLicensePlateForDisplay(data.license_plate);
    const operator = data.operator || 'Đã bị xóa';
    const route = data.route_no && data.route_no !== '---' ? `Tuyến ${data.route_no}` : '';
    const model = data.vehicles?.model || '';

    const titleParts = [displayPlate || data.license_plate || 'Xe buýt', operator];
    if (route) titleParts.push(route);
    if (model) titleParts.push(model);

    const title = `${truncate(titleParts.join(' - '), 110)} | VNBUSARCHIVE`;

    const descParts = [`Ảnh chụp chi tiết xe buýt/xe khách ${formatPlateVariations(displayPlate || data.license_plate || 'xe buýt')}`];
    if (operator) descParts.push(`Đơn vị: ${operator}`);
    if (route) descParts.push(route);
    if (model) descParts.push(`Dòng xe: ${model}`);
    if (data.location) descParts.push(`Vị trí: ${data.location}`);

    return {
        title,
        description: truncate(descParts.join('. '), 260),
        image: getImageProxyUrl(data.url, `${displayPlate || data.license_plate || 'image'}.jpg`),
        url: `${baseUrl}/photo/${data.id}`
    };
};

const fetchVehicleEmbed = async (plate, baseUrl, env) => {
    const supabase = createSupabase(env);
    if (!supabase) return null;

    const [photoRes, vehicleRes] = await Promise.all([
        supabase
            .from('photos')
            .select('id, url, license_plate, operator, route_no, type, location, note, taken_at, vehicles(model)')
            .eq('license_plate', plate)
            .eq('status', 'approved')
            .order('taken_at', { ascending: false, nullsFirst: false })
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        supabase
            .from('vehicles')
            .select('license_plate, operator, model, route_no, note')
            .eq('license_plate', plate)
            .single()
    ]);

    if (photoRes.error && !photoRes.data && vehicleRes.error && !vehicleRes.data) return null;

    const photo = photoRes.data;
    const vehicle = vehicleRes.data;

    if (!photo && !vehicle) return null;

    const resolvedPlate = vehicle?.license_plate || photo?.license_plate || plate;
    const displayPlate = cleanLicensePlateForDisplay(resolvedPlate);
    const operator = photo?.operator || vehicle?.operator || '';
    const model = photo?.vehicles?.model || vehicle?.model || '';
    const route = photo?.route_no || vehicle?.route_no || '';

    const title = `Hồ sơ xe ${displayPlate || resolvedPlate} | VNBUSARCHIVE`;
    const baseDesc = `Lịch sử hoạt động và thư viện ảnh của xe ${model ? model + ' ' : ''}biển kiểm soát ${formatPlateVariations(displayPlate || resolvedPlate)}`;
    const tailParts = [];
    if (operator) tailParts.push(operator);
    if (route && route !== '---') tailParts.push(`Tuyến ${route}`);
    const fullDesc = tailParts.length > 0 ? `${baseDesc} - ${tailParts.join(' - ')}.` : `${baseDesc}.`;

    return {
        title,
        description: truncate(fullDesc, 260),
        image: getImageProxyUrl(photo?.url, `${displayPlate || resolvedPlate || 'image'}.jpg`),
        url: `${baseUrl}/vehicle/${encodeURIComponent(resolvedPlate)}`
    };
};

const setTitle = (html, title) => html.replace(
    /<title\b[^>]*>[\s\S]*?<\/title>/i,
    `<title id="meta-title">${escapeHtml(title)}</title>`
);

const setMetaContent = (html, id, value) => {
    const escaped = escapeAttr(value);
    return html.replace(
        new RegExp(`(<meta\\b(?=[^>]*\\bid=["']${id}["'])[^>]*\\bcontent=["'])(?:[^"']*)(["'])`, 'i'),
        `$1${escaped}$2`
    );
};

const setMetaAttribute = (html, id, attribute, value) => {
    const escaped = escapeAttr(value);
    return html.replace(
        new RegExp(`(<meta\\b(?=[^>]*\\bid=["']${id}["'])[^>]*\\b${attribute}=["'])(?:[^"']*)(["'])`, 'i'),
        `$1${escaped}$2`
    );
};

const setCanonical = (html, url) => {
    const escaped = escapeAttr(url);
    return html.replace(
        /(<link\b(?=[^>]*\brel=["']canonical["'])[^>]*\bhref=["'])(?:[^"']*)(["'])/i,
        `$1${escaped}$2`
    );
};

const applyMeta = (html, meta) => {
    let output = setTitle(html, meta.title);
    output = setMetaContent(output, 'meta-desc', meta.description);
    output = setCanonical(output, meta.url);
    output = setMetaAttribute(output, 'og-url', 'content', meta.url);
    output = setMetaContent(output, 'og-title', meta.title);
    output = setMetaContent(output, 'og-desc', meta.description);
    if (meta.image) {
        output = setMetaContent(output, 'og-image', meta.image);
        output = setMetaContent(output, 'tw-image', meta.image);
    } else {
        output = output.replace(/<meta\s+[^>]*(?:id|property)=["'](?:og|tw|twitter):?image["'][^>]*>\s*/gi, '');
    }
    output = setMetaAttribute(output, 'tw-url', 'content', meta.url);
    output = setMetaContent(output, 'tw-title', meta.title);
    output = setMetaContent(output, 'tw-desc', meta.description);
    return output;
};

const defaultMetaFor = (baseUrl) => {
    return {
        title: DEFAULT_TITLE,
        description: DEFAULT_DESCRIPTION,
        image: DEFAULT_IMAGE,
        url: baseUrl
    };
};

export async function onRequest(context) {
    const { request, env } = context;

    if (request.method !== 'GET') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    try {
        const requestUrl = new URL(request.url);
        const protocol = request.headers.get('x-forwarded-proto') || 'https';
        let host = request.headers.get('host') || requestUrl.host;
        if (host === 'vnbusarchive.io.vn') {
            host = 'www.vnbusarchive.io.vn';
        }
        const baseUrl = `${protocol}://${host}`;

        const type = requestUrl.searchParams.get('type');
        const id = requestUrl.searchParams.get('id');
        const plate = normalizePlate(requestUrl.searchParams.get('plate') || '');

        let meta = defaultMetaFor(baseUrl);

        if (type === 'photo' && /^\d+$/.test(id || '')) {
            meta = await fetchPhotoEmbed(id, baseUrl, env) || meta;
        } else if (type === 'vehicle' && plate) {
            meta = await fetchVehicleEmbed(plate, baseUrl, env) || meta;
        }

        const indexResponse = await env.ASSETS.fetch(new Request(new URL('/index.html', request.url)));
        const indexHtml = await indexResponse.text();

        const html = applyMeta(indexHtml, meta);
        const isDetail = type === 'photo' || type === 'vehicle';

        const cacheControl = isDetail
            ? 'public, s-maxage=300, stale-while-revalidate=86400'
            : 'public, s-maxage=3600, stale-while-revalidate=86400';

        return new Response(html, {
            status: 200,
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': cacheControl
            }
        });
    } catch (error) {
        console.error('Dynamic embed error:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}
