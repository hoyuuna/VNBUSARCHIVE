import { createClient } from '@supabase/supabase-js';

export async function onRequest(context) {
    const { request, env } = context;

    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
    }

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const supabaseUrl = env.SUPABASE_URL;
    const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) throw new Error('Invalid token');

        let body;
        try {
            body = await request.json();
        } catch (e) {
            return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
        }

        if (body.action === 'status') {
            const githubIdentity = user.identities?.find(id => id.provider === 'github');
            if (!githubIdentity) {
                return new Response(JSON.stringify({ linked: false, githubUsername: null, isDev: false }), { status: 200, headers: { 'Content-Type': 'application/json' }});
            }
            const githubUsername = githubIdentity.identity_data?.preferred_username || githubIdentity.identity_data?.user_name;

            const { data: profile } = await supabase.from('profiles').select('subroles').eq('id', user.id).single();
            const isDev = profile?.subroles?.includes('dev');

            return new Response(JSON.stringify({ linked: true, githubUsername, isDev }), { status: 200, headers: { 'Content-Type': 'application/json' }});
        }

        if (body.action === 'claim') {
            const githubIdentity = user.identities?.find(id => id.provider === 'github');
            if (!githubIdentity) {
                return new Response(JSON.stringify({ error: 'Bạn chưa liên kết tài khoản GitHub' }), { status: 400, headers: { 'Content-Type': 'application/json' }});
            }
            const githubUsername = githubIdentity.identity_data?.preferred_username || githubIdentity.identity_data?.user_name;
            if (!githubUsername) {
                return new Response(JSON.stringify({ error: 'Không lấy được username GitHub. Vui lòng liên kết lại.' }), { status: 400, headers: { 'Content-Type': 'application/json' }});
            }

            const { data: profile } = await supabase.from('profiles').select('subroles').eq('id', user.id).single();
            const currentSubroles = profile?.subroles || [];
            
            if (currentSubroles.includes('dev')) {
                return new Response(JSON.stringify({ error: 'Bạn đã có danh hiệu này rồi!' }), { status: 400, headers: { 'Content-Type': 'application/json' }});
            }

            const q = `repo:hoyuuna/VNBUSARCHIVE is:pr is:merged author:${githubUsername}`;
            const ghRes = await fetch(`https://api.github.com/search/issues?q=${encodeURIComponent(q)}`, {
                headers: {
                    'User-Agent': 'VNBUSARCHIVE-Worker'
                }
            });
            
            if (!ghRes.ok) {
                return new Response(JSON.stringify({ error: 'Lỗi khi kết nối với GitHub API. Vui lòng thử lại sau.' }), { status: 500, headers: { 'Content-Type': 'application/json' }});
            }
            const ghData = await ghRes.json();

            if (ghData.total_count > 0) {
                currentSubroles.push('dev');
                await supabase.from('profiles').update({ subroles: currentSubroles }).eq('id', user.id);
                return new Response(JSON.stringify({ success: true, message: 'Chúc mừng! Bạn đã nhận được danh hiệu Code Contributor!' }), { status: 200, headers: { 'Content-Type': 'application/json' }});
            } else {
                return new Response(JSON.stringify({ error: 'Không tìm thấy Pull Request nào đã được merge của bạn trên repository dự án.' }), { status: 400, headers: { 'Content-Type': 'application/json' }});
            }
        }

        return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: { 'Content-Type': 'application/json' }});

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' }});
    }
}
