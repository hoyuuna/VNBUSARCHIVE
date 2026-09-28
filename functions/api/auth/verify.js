import { createClient } from '@supabase/supabase-js';

/**
 * /api/auth/verify
 *
 * Handles Supabase email verification links that use the legacy "token" format:
 *   ?token=<otp>&type=<magiclink|recovery|signup>&redirect_to=<url>
 *
 * This endpoint:
 * 1. Receives the OTP token and type from Supabase email links
 * 2. Verifies it using Supabase Admin (verifyOtp)
 * 3. Redirects the browser to the target page with the session injected
 *    as hash params (#access_token=...&refresh_token=...&type=...)
 *    so the Supabase JS client can detect the session automatically.
 */
export async function onRequest(context) {
    const { request, env } = context;

    // Only allow GET requests (email link clicks)
    if (request.method !== 'GET') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    const type = url.searchParams.get('type');
    const redirectTo = url.searchParams.get('redirect_to') || url.origin + '/auth';

    // Validate params
    if (!token || !type) {
        return Response.redirect(url.origin + '/auth?error=missing_params', 302);
    }

    const allowedTypes = ['magiclink', 'recovery', 'signup', 'email_change', 'invite'];
    if (!allowedTypes.includes(type)) {
        return Response.redirect(url.origin + '/auth?error=invalid_type', 302);
    }

    // Validate redirect_to is within our domain (prevent open redirect)
    try {
        const redirectUrl = new URL(redirectTo);
        const host = request.headers.get('host') || '';
        const allowedHosts = ['vnbusarchive.io.vn', 'www.vnbusarchive.io.vn'];
        // Also allow Cloudflare Pages preview URLs
        const isAllowed = allowedHosts.includes(redirectUrl.hostname)
            || redirectUrl.hostname.endsWith('.pages.dev')
            || redirectUrl.hostname === 'localhost'
            || redirectUrl.hostname === host;
        if (!isAllowed) {
            return Response.redirect(url.origin + '/auth?error=invalid_redirect', 302);
        }
    } catch (e) {
        return Response.redirect(url.origin + '/auth?error=invalid_redirect', 302);
    }

    try {
        const supabaseUrl = env.SUPABASE_URL;
        const supabaseServiceRole = env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceRole) {
            throw new Error('Server configuration error');
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            }
        });

        // Exchange the OTP token for a session
        const otpType = type === 'magiclink' ? 'magiclink' : type;
        const { data, error } = await supabaseAdmin.auth.verifyOtp({
            token_hash: token,
            type: otpType,
        });

        if (error || !data?.session) {
            console.error('[verify] verifyOtp error:', error?.message);
            // Redirect back to auth with error
            const errRedirect = new URL(redirectTo);
            errRedirect.searchParams.set('error', 'invalid_token');
            return Response.redirect(errRedirect.toString(), 302);
        }

        const { access_token, refresh_token, expires_in } = data.session;

        // Build the redirect URL with session in the hash fragment
        // so the Supabase JS SDK (implicit flow) can detect and restore the session
        const finalRedirect = new URL(redirectTo);
        finalRedirect.hash = [
            `access_token=${encodeURIComponent(access_token)}`,
            `refresh_token=${encodeURIComponent(refresh_token)}`,
            `expires_in=${expires_in || 3600}`,
            `token_type=bearer`,
            `type=${type}`,
        ].join('&');

        return Response.redirect(finalRedirect.toString(), 302);

    } catch (err) {
        console.error('[verify] Unexpected error:', err.message);
        return Response.redirect(url.origin + '/auth?error=server_error', 302);
    }
}
