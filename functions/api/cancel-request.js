import { createClient } from '@supabase/supabase-js';

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

export async function onRequestPost(context) {
    const { request, env } = context;

    if (!validateOriginAndReferer(request)) {
        return new Response(JSON.stringify({ success: false, error: 'Forbidden' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ success: false, error: 'Chưa xác thực.' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const supabase = createClient(
            env.SUPABASE_URL,
            env.SUPABASE_KEY,
            { global: { headers: { Authorization: authHeader } } }
        );

        const token = authHeader.replace(/^Bearer\s+/i, '').trim();
        const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
        if (authErr || !user) {
            return new Response(JSON.stringify({ success: false, error: 'Token không hợp lệ.' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const body = await request.json().catch(() => ({}));
        const { requestId } = body;
        if (!requestId) {
            return new Response(JSON.stringify({ success: false, error: 'Thiếu requestId.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (!env.SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error('Lỗi cấu hình hệ thống: Thiếu Service Role Key.');
        }

        const supabaseAdmin = createClient(
            env.SUPABASE_URL,
            env.SUPABASE_SERVICE_ROLE_KEY,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // Lấy thông tin yêu cầu để kiểm tra quyền sở hữu và trạng thái
        const { data: reqData, error: reqErr } = await supabaseAdmin
            .from('edit_requests')
            .select('id, requester_id, status, license_plate, new_data')
            .eq('id', requestId)
            .maybeSingle();

        if (reqErr) throw reqErr;
        if (!reqData) {
            return new Response(JSON.stringify({ success: false, error: 'Không tìm thấy yêu cầu.' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Kiểm tra xem có phải chính chủ tạo yêu cầu không
        if (reqData.requester_id !== user.id) {
            // Kiểm tra xem user có phải admin/manager không
            const { data: profile } = await supabaseAdmin
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            const isStaff = profile && ['admin', 'manager'].includes(profile.role);
            if (!isStaff) {
                return new Response(JSON.stringify({ success: false, error: 'Bạn không có quyền hủy yêu cầu này.' }), {
                    status: 403,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        // Chỉ cho phép hủy khi yêu cầu đang ở trạng thái pending
        if (reqData.status !== 'pending') {
            return new Response(JSON.stringify({ success: false, error: 'Chỉ có thể hủy yêu cầu đang chờ duyệt.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Tiến hành xóa yêu cầu qua service role key
        const { error: delErr } = await supabaseAdmin
            .from('edit_requests')
            .delete()
            .eq('id', requestId);

        if (delErr) throw delErr;

        return new Response(JSON.stringify({ success: true, message: 'Đã hủy yêu cầu thành công.' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err) {
        console.error('[API cancel-request Error]:', err);
        return new Response(JSON.stringify({ success: false, error: err.message || 'Lỗi hệ thống máy chủ.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
