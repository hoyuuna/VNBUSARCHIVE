/**
 * /api/auth/verify
 *
 * Supabase email links arrive here as:
 *   ?token=<otp>&type=<magiclink|recovery|...>&redirect_to=<url>
 *
 * Fix: simply redirect the browser straight to Supabase's real
 * /auth/v1/verify endpoint. Supabase verifies the OTP and redirects
 * the browser back to redirect_to#access_token=...&type=...
 * which the Supabase JS client then detects to establish the session.
 *
 * No server-side fetch needed — Supabase handles everything.
 */
export async function onRequest(context) {
    const { request, env } = context;

    if (request.method !== 'GET') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    const url = new URL(request.url);
    const token      = url.searchParams.get('token');
    const type       = url.searchParams.get('type');
    const redirectTo = url.searchParams.get('redirect_to') || (url.origin + '/auth');

    if (!token || !type) {
        return Response.redirect(url.origin + '/auth?error=missing_params', 302);
    }

    const allowedTypes = ['magiclink', 'recovery', 'signup', 'email_change', 'invite'];
    if (!allowedTypes.includes(type)) {
        return Response.redirect(url.origin + '/auth?error=invalid_type', 302);
    }

    // Validate redirect_to stays on our domain (open redirect prevention)
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

    const supabaseUrl = env.SUPABASE_URL;
    const supabaseKey = env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('[verify] Missing SUPABASE_URL or SUPABASE_KEY env vars');
        return Response.redirect(url.origin + '/auth?error=server_config', 302);
    }

    // Build Supabase's real verify URL and redirect the browser there directly.
    // Supabase will verify the OTP token, then redirect back to redirect_to
    // with the session tokens in the URL fragment (#access_token=...&type=...).
    const supabaseVerifyUrl = new URL(`${supabaseUrl}/auth/v1/verify`);
    supabaseVerifyUrl.searchParams.set('token', token);
    supabaseVerifyUrl.searchParams.set('type', type);
    supabaseVerifyUrl.searchParams.set('redirect_to', redirectTo);
    // Some self-hosted / custom setups require apikey as query param
    supabaseVerifyUrl.searchParams.set('apikey', supabaseKey);

    return Response.redirect(supabaseVerifyUrl.toString(), 302);
}
