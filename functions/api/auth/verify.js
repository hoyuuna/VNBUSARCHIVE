/**
 * /api/auth/verify
 *
 * Supabase email links arrive at this endpoint in the format:
 *   ?token=<otp>&type=<magiclink|recovery|signup>&redirect_to=<url>
 *
 * Strategy: proxy the request to Supabase's real /auth/v1/verify endpoint,
 * intercept the redirect, and forward the browser to the destination URL.
 * Supabase appends #access_token=...&type=... to the redirect_to URL,
 * which the Supabase JS client detects and uses to establish the session.
 */
export async function onRequest(context) {
    const { request, env } = context;

    if (request.method !== 'GET') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    const type  = url.searchParams.get('type');
    const redirectTo = url.searchParams.get('redirect_to') || (url.origin + '/auth');

    // Basic validation
    if (!token || !type) {
        return Response.redirect(url.origin + '/auth?error=missing_params', 302);
    }

    const allowedTypes = ['magiclink', 'recovery', 'signup', 'email_change', 'invite'];
    if (!allowedTypes.includes(type)) {
        return Response.redirect(url.origin + '/auth?error=invalid_type', 302);
    }

    // Validate redirect_to stays within our own domain to prevent open redirects
    try {
        const rUrl = new URL(redirectTo);
        const host = request.headers.get('host') || '';
        const ok = ['vnbusarchive.io.vn', 'www.vnbusarchive.io.vn'].includes(rUrl.hostname)
            || rUrl.hostname.endsWith('.pages.dev')
            || rUrl.hostname === 'localhost'
            || rUrl.hostname === host;
        if (!ok) return Response.redirect(url.origin + '/auth?error=invalid_redirect', 302);
    } catch {
        return Response.redirect(url.origin + '/auth?error=invalid_redirect', 302);
    }

    const supabaseUrl  = env.SUPABASE_URL;
    const supabaseKey  = env.SUPABASE_KEY; // anon / public key is enough for /verify

    if (!supabaseUrl || !supabaseKey) {
        return Response.redirect(url.origin + '/auth?error=server_config', 302);
    }

    // Build the real Supabase Auth verify URL
    const verifyUrl = new URL(`${supabaseUrl}/auth/v1/verify`);
    verifyUrl.searchParams.set('token', token);
    verifyUrl.searchParams.set('type', type);
    verifyUrl.searchParams.set('redirect_to', redirectTo);

    try {
        // Call Supabase's verify endpoint without following its redirect so we
        // can inspect and forward it to the browser.
        const resp = await fetch(verifyUrl.toString(), {
            method: 'GET',
            headers: { 'apikey': supabaseKey },
            redirect: 'manual',
        });

        // Supabase returns 302 → location contains redirect_to#access_token=...
        const location = resp.headers.get('location');
        if ((resp.status === 301 || resp.status === 302 || resp.status === 303) && location) {
            return Response.redirect(location, 302);
        }

        // Non-redirect response = verification failed
        console.error('[verify] Unexpected Supabase response:', resp.status);
        return Response.redirect(url.origin + '/auth?error=verify_failed', 302);

    } catch (err) {
        console.error('[verify] Fetch error:', err.message);
        return Response.redirect(url.origin + '/auth?error=server_error', 302);
    }
}
