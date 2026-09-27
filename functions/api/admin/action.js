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
    
    if (!env.SUPABASE_URL || !env.SUPABASE_KEY) {
        return new Response(JSON.stringify({ error: 'Server misconfiguration' }), { status: 500 });
    }
    
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }
        
        const token = authHeader.replace(/^Bearer\s+/i, '').trim();

        // Khởi tạo Supabase client với quyền của chính User (bằng token JWT của họ)
        // Điều này giúp vượt qua RLS policy mà không cần dùng Service Role Key
        const sb = createClient(env.SUPABASE_URL, env.SUPABASE_KEY, {
            global: {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            },
            auth: {
                persistSession: false
            }
        });

        const { data: { user }, error: userError } = await sb.auth.getUser(token);
        
        if (userError || !user) {
            return new Response(JSON.stringify({ error: 'Invalid token', details: userError ? userError.message : 'User is null' }), { status: 401 });
        }
        
        const sbAdmin = env.SUPABASE_SERVICE_ROLE_KEY ? createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY) : sb;
        
        const { data: profiles } = await sbAdmin.from('profiles').select('role, subroles').eq('id', user.id);
        
        if (!profiles || profiles.length === 0 || !['admin', 'manager'].includes(profiles[0].role)) {
            return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), { status: 403 });
        }
        
        const body = await request.json();
        const { action, photoId, reason, plate, op, type, route, model, location, note, province } = body;
        
        if (!action || !photoId) {
            return new Response(JSON.stringify({ error: 'Missing parameters' }), { status: 400 });
        }
        
        const { data: currentPhotoRes, error: pGetErr } = await sbAdmin.from('photos').select('*').eq('id', photoId).single();
        if (pGetErr || !currentPhotoRes) { return new Response(JSON.stringify({ error: 'Khong tim thay anh', details: pGetErr }), { status: 404 }); }
        const photo = currentPhotoRes;

        let isFinalApprove = false;
        let isFinalDeny = false;
        let newProgress = photo.review_progress || '0/2';
        let newReviewerCount = photo.reviewer_count || 0;
        let needsThird = photo.needs_third || false;
        let finalDenialReason = reason || 'Từ chối ảnh';

        const userRole = profiles[0].role;
        const subroles = profiles[0].subroles || [];
        const isManager = userRole === 'manager';
        const hasQualityAud = isManager || subroles.includes('quality_aud');

        if (photo.uploader_id === user.id && !isManager) {
            return new Response(JSON.stringify({ error: 'Quyền bị từ chối: Bạn không được tự duyệt hoặc từ chối ảnh của chính mình.' }), { status: 403 });
        }

        if (photo.status === 'pending_quality' && !hasQualityAud) {
            return new Response(JSON.stringify({ error: 'Quyền bị từ chối: Cần role quality_aud để duyệt chất lượng.' }), { status: 403 });
        }

        if (photo.status === 'approved' || photo.status === 'denied') {
            if (!isManager) {
                return new Response(JSON.stringify({ error: 'Quyền bị từ chối: Chỉ Manager mới có quyền ghi đè (duyệt lại/từ chối lại) ảnh đã có kết quả.' }), { status: 403 });
            }
            if (action === 'approve') isFinalApprove = true;
            if (action === 'deny') {
                isFinalDeny = true;
                finalDenialReason = reason || 'Admin/Manager ghi đè: Từ chối ảnh';
            }
            await sbAdmin.from('photo_reviews').upsert({
                photo_id: photoId, admin_id: user.id, action: action, reason: reason || null
            }, { onConflict: 'photo_id,admin_id' });
        } else {
            // New logic: single approval per phase
            await sbAdmin.from('photo_reviews').upsert({
                photo_id: photoId, admin_id: user.id, action: action, reason: reason || null
            }, { onConflict: 'photo_id,admin_id' });

            if (photo.status === 'pending_quality') {
                if (action === 'approve') {
                    // Chuyển sang duyệt thông tin
                    const { error: qErr } = await sbAdmin.from('photos').update({ status: 'pending_info', review_progress: 'Passed Quality' }).eq('id', photoId);
                    if (qErr) return new Response(JSON.stringify({ error: `Lỗi cập nhật trạng thái: ${qErr.message}` }), { status: 500 });
                    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
                } else if (action === 'deny') {
                    isFinalDeny = true;
                }
            } else if (photo.status === 'pending_info' || photo.status === 'pending') {
                if (action === 'approve') {
                    isFinalApprove = true;
                } else if (action === 'deny') {
                    isFinalDeny = true;
                }
            }
        }

        if (isFinalApprove) {
            if (plate && plate.includes('-') && model) {
                const parts = plate.split('-');
                if (parts.length >= 2 && !isNaN(parts[1])) {
                    const basePlate = parts[0];
                    const { data: relatedVehicles } = await sbAdmin.from('vehicles').select('license_plate, model').ilike('license_plate', `${basePlate}%`);
                    if (relatedVehicles && relatedVehicles.length > 0) {
                        const currentModelLower = model.trim().toLowerCase();
                        const duplicateVehicle = relatedVehicles.find(v => {
                            if (!v.model || v.license_plate === plate) return false;
                            if (v.license_plate !== basePlate) {
                                const pts = v.license_plate.split('-');
                                if (pts.length !== 2 || pts[0] !== basePlate || isNaN(pts[1])) return false;
                            }
                            const mLower = v.model.trim().toLowerCase();
                            return mLower === currentModelLower || mLower.includes(currentModelLower) || currentModelLower.includes(mLower);
                        });
                        if (duplicateVehicle) {
                            return new Response(JSON.stringify({ error: "Xe định danh phụ không được trùng dòng xe với xe khác cùng biển kiểm soát." }), { status: 400 });
                        }
                    }
                }
            }

            // Hệ thống Sandbox đã bị khai tử: ảnh pending/denied đã nằm trên CDN thật.
            // finalUrl lấy trực tiếp từ photo.url (phải là URL https hợp lệ).
            let finalUrl = photo.url;

            if (!finalUrl || (typeof finalUrl === 'string' && (finalUrl.startsWith('sandbox:') || finalUrl.startsWith('data:') || finalUrl === 'SANDBOX_DELETED'))) {
                return new Response(JSON.stringify({ error: "Không thể duyệt: Dữ liệu ảnh không hợp lệ hoặc chưa được tải thành công lên máy chủ CDN thực!" }), { status: 400 });
            }

                        let borrowedRouteToAssign = null;
            if (route) {
                const { data: rtInfo } = await sbAdmin.from('route_info')
                    .select('route_name, metadata')
                    .like('route_name', `${route} - %`);
                if (rtInfo) {
                    for (const rt of rtInfo) {
                        if (rt.metadata && rt.metadata.borrowed_plates && Array.isArray(rt.metadata.borrowed_plates)) {
                            if (rt.metadata.borrowed_plates.some(p => p.toLowerCase() === plate.toLowerCase())) {
                                borrowedRouteToAssign = rt.route_name;
                                break;
                            }
                        }
                    }
                }
            }

            const { error: vError } = await sbAdmin.from('vehicles')
                .upsert({ license_plate: plate, model: model }, { onConflict: 'license_plate' });
            if (vError) throw vError;

            const updatePayload = {
                url: finalUrl,
                license_plate: plate,
                note: note,
                location: location,
                mod_note: null,
                is_documentary: false,
                status: 'approved',
                operator: op,
                type: type,
                route_no: route,
                review_progress: newProgress,
                reviewer_count: newReviewerCount,
                needs_third: needsThird,
                audit_date: new Date().toISOString()
            };
            if (borrowedRouteToAssign) {
                updatePayload.borrowed_route = borrowedRouteToAssign;
            }
            
            const { error: photoUpdateErr } = await sbAdmin.from('photos').update(updatePayload).eq('id', photoId);
            
            if (photoUpdateErr) {
                return new Response(JSON.stringify({ error: `Lỗi lưu trạng thái duyệt cuối cùng: ${photoUpdateErr.message}` }), { status: 500 });
            }

            const specialRoutes = ['Ngoài giờ hoạt động', 'Chưa hoạt động'];
            const isSpecialRoute = specialRoutes.includes(route);
            const isSameRoute = (r1, r2) => (r1 || '').trim().toLowerCase() === (r2 || '').trim().toLowerCase();

            if (!isSpecialRoute) {
                // Lấy lịch sử theo thứ tự TĂNG DẦN (cũ nhất -> mới nhất)
                let { data: currentHistory } = await sbAdmin.from('vehicle_history')
                    .select('*').eq('license_plate', plate).order('effective_date', { ascending: true });

                currentHistory = currentHistory || [];
                let latestHist = currentHistory.length > 0 ? currentHistory[currentHistory.length - 1] : null;

                const takenDateObj = photo.taken_at ? new Date(photo.taken_at) : new Date();
                const takenDateString = takenDateObj.toISOString().split('T')[0];

                if (latestHist) {
                    const textCheck = `${latestHist.route || ''} ${latestHist.operator || ''} ${latestHist.note || ''}`.toLowerCase();
                    const isStopped = textCheck.includes('dừng hoạt động') || textCheck.includes('ngừng hoạt động') || textCheck.includes('thanh lý') || textCheck.includes('thu hồi');
                    const latestHistDate = latestHist.effective_date ? new Date(latestHist.effective_date) : new Date();
                    
                    // Chỉ xóa lịch sử dừng hoạt động nếu ảnh mới chứng minh xe hoạt động SAU hoặc BẰNG ngày dừng
                    if (isStopped && takenDateObj >= latestHistDate) {
                        await sbAdmin.from('vehicle_history').delete().eq('id', latestHist.id);
                        currentHistory.pop(); // Xóa khỏi mảng cục bộ
                    }
                }

                // 1. Tìm khoảng thời gian (stint) chứa takenDateObj
                // H_cov là mốc lịch sử gần nhất ở quá khứ so với ảnh
                let H_cov = null;
                for (let i = currentHistory.length - 1; i >= 0; i--) {
                    const hDate = currentHistory[i].effective_date ? new Date(currentHistory[i].effective_date) : new Date();
                    if (hDate <= takenDateObj) {
                        H_cov = currentHistory[i];
                        break;
                    }
                }

                let needInsert = false;

                if (H_cov) {
                    const hCovDateStr = H_cov.effective_date ? new Date(H_cov.effective_date).toISOString().split('T')[0] : '';
                    if (hCovDateStr === takenDateString) {
                        if (isSameRoute(H_cov.route, route)) {
                            if (op && H_cov.operator !== op) {
                                await sbAdmin.from('vehicle_history').update({ operator: op }).eq('id', H_cov.id);
                            }
                            needInsert = false;
                        } else {
                            await sbAdmin.from('vehicle_history').update({ route: route, operator: op }).eq('id', H_cov.id);
                            needInsert = false;
                        }
                    } else {
                        // hCovDateStr < takenDateString
                        // Trùng khớp với số tuyến của mốc cũ hơn gần nhất
                        if (isSameRoute(H_cov.route, route)) {
                            // Gộp vào số tuyến giống y hệt đó cũ hơn -> KHÔNG tạo mới
                            needInsert = false;
                        } else {
                            // Tuyến khác số tuyến bên cạnh trong lịch sử -> Tạo mới
                            needInsert = true;
                        }
                    }
                } else {
                    // takenDateObj cũ hơn TẤT CẢ các mốc lịch sử đang có
                    if (currentHistory.length > 0) {
                        const H_oldest = currentHistory[0];
                        if (isSameRoute(H_oldest.route, route)) {
                            // Mở rộng mốc cũ nhất về quá khứ (vì cùng tuyến)
                            await sbAdmin.from('vehicle_history').update({
                                effective_date: takenDateString,
                                operator: op || H_oldest.operator
                            }).eq('id', H_oldest.id);
                            needInsert = false;
                        } else {
                            needInsert = true;
                        }
                    } else {
                        // Lịch sử hoàn toàn trống
                        needInsert = true;
                    }
                }

                if (needInsert) {
                    const { count } = await sbAdmin.from('vehicle_history').select('*', { count: 'exact', head: true }).eq('license_plate', plate);
                    await sbAdmin.from('vehicle_history').insert({
                        license_plate: plate, operator: op, route: route,
                        display_order: count || 0,
                        effective_date: takenDateString
                    });
                }

                // 2. Chống Race-Condition & Tự động gộp dữ liệu trùng lặp liền kề
                let { data: freshHistory } = await sbAdmin.from('vehicle_history')
                    .select('*').eq('license_plate', plate).order('effective_date', { ascending: true });
                
                freshHistory = freshHistory || [];
                for (let i = 1; i < freshHistory.length; i++) {
                    const prev = freshHistory[i - 1];
                    const curr = freshHistory[i];
                    // Nếu 2 mốc lịch sử liên tiếp giống hệt nhau về số tuyến
                    if (isSameRoute(curr.route, prev.route)) {
                        // Giữ lại mốc cũ hơn (prev), xóa mốc mới hơn (curr)
                        await sbAdmin.from('vehicle_history').delete().eq('id', curr.id);
                        freshHistory.splice(i, 1);
                        i--; // Lùi index vì mảng đã bị rút ngắn
                    }
                }
            }

            // Dọn dẹp biển số cũ nếu đây là thao tác đổi biển số khi duyệt ảnh
            if (photo.license_plate && photo.license_plate !== plate) {
                try {
                    const oldPlate = photo.license_plate;
                    const { data: oldApprovedPhotos } = await sbAdmin.from('photos').select('route_no, operator').eq('license_plate', oldPlate).eq('status', 'approved');
                    if (!oldApprovedPhotos || oldApprovedPhotos.length === 0) {
                        await sbAdmin.from('vehicle_history').delete().eq('license_plate', oldPlate);
                    } else {
                        const { data: oldHist } = await sbAdmin.from('vehicle_history').select('*').eq('license_plate', oldPlate);
                        if (oldHist && oldHist.length > 0) {
                            const activePhotos = oldApprovedPhotos.filter(p => !specialRoutes.includes(p.route_no));
                            for (const h of oldHist) {
                                if (!specialRoutes.includes(h.route)) {
                                    const hasPhoto = activePhotos.some(p => isSameRoute(p.route_no, h.route));
                                    if (!hasPhoto) {
                                        await sbAdmin.from('vehicle_history').delete().eq('id', h.id);
                                    }
                                }
                            }
                        }
                    }
                } catch (cleanOldErr) {
                    console.warn('[WARN] Lỗi dọn dẹp lịch sử biển số cũ khi duyệt:', cleanOldErr);
                }
            }

            await sbAdmin.from('admin_audit_logs').insert({
                admin_id: user.id,
                action_type: 'approve_photo',
                target_id: photoId,
                details: JSON.stringify({ plate, operator: op })
            });

        } else if (isFinalDeny) {
            const targetPlate = plate || photo.license_plate;

            // Hệ thống Sandbox đã khai tử: ảnh denied GIỮ NGUYÊN trên CDN (url https thật),
            // chỉ chuyển status sang 'denied' để ẩn khỏi feed chính. Ảnh vẫn hiển thị với chủ nhân.
            const { error: updateErr } = await sbAdmin.from('photos').update({
                status: 'denied',
                denial_reason: finalDenialReason,
                review_progress: newProgress,
                reviewer_count: newReviewerCount,
                needs_third: needsThird,
                audit_date: new Date().toISOString()
            }).eq('id', photoId);
            if (updateErr) {
                return new Response(JSON.stringify({ error: `Lỗi cập nhật trạng thái ảnh (${updateErr.message})` }), { status: 500 });
            }
            
            if (targetPlate) {
                try {
                    const { data: approvedPhotos } = await sbAdmin.from('photos').select('route_no, operator').eq('license_plate', targetPlate).eq('status', 'approved');
                    if (approvedPhotos && approvedPhotos.length > 0) {
                        const { data: history } = await sbAdmin.from('vehicle_history').select('*').eq('license_plate', targetPlate);
                        if (history && history.length > 0) {
                            const specialRoutes = ['Ngoài giờ hoạt động', 'Chưa hoạt động'];
                            const activePhotos = approvedPhotos.filter(p => !specialRoutes.includes(p.route_no));
                            for (const h of history) {
                                if (!specialRoutes.includes(h.route)) {
                                    const hasPhoto = activePhotos.some(p => p.route_no === h.route && p.operator === h.operator);
                                    if (!hasPhoto) {
                                        await sbAdmin.from('vehicle_history').delete().eq('id', h.id);
                                    }
                                }
                            }
                        }
                    }
                } catch (histErr) {
                    console.warn('[WARN] Lỗi dọn dẹp lịch sử xe sau khi xóa ảnh:', histErr);
                }
            }
            
            await sbAdmin.from('admin_audit_logs').insert({
                admin_id: user.id,
                action_type: 'deny_photo',
                target_id: photoId,
                details: JSON.stringify({ plate: targetPlate, reason: finalDenialReason })
            });
        } else {
            // Chỉ cập nhật tiến độ (VD: 1/2)
            const updatePayload = {
                review_progress: newProgress,
                reviewer_count: newReviewerCount,
                needs_third: needsThird
            };
            if (action === 'approve') {
                updatePayload.license_plate = plate;
                updatePayload.note = note;
                updatePayload.location = location;
                updatePayload.operator = op;
                updatePayload.type = type;
                updatePayload.route_no = route;
                
                if (plate && model) {
                    await sbAdmin.from('vehicles').upsert({ license_plate: plate, model: model }, { onConflict: 'license_plate' });
                }
            }
            const { error: updateErr } = await sbAdmin.from('photos').update(updatePayload).eq('id', photoId);
            if (updateErr) {
                return new Response(JSON.stringify({ error: `Lỗi cập nhật tiến độ ảnh: ${updateErr.message}` }), { status: 500 });
            }
            
            await sbAdmin.from('admin_audit_logs').insert({
                admin_id: user.id,
                action_type: action === 'approve' ? 'vote_approve_photo' : 'vote_deny_photo',
                target_id: photoId,
                details: JSON.stringify(action === 'approve' ? { plate, operator: op } : { reason: reason || 'Từ chối' })
            });
        }

        
            // Reputation Points Logic
            const uploaderId = photo.uploader_id;
            if (uploaderId && (isFinalApprove || isFinalDeny)) {
                const { data: uploader } = await sbAdmin.from('profiles').select('reputation_score').eq('id', uploaderId).single();
                let currentScore = (uploader && uploader.reputation_score !== null) ? uploader.reputation_score : 100;
                let change = 0;
                
                if (isFinalApprove) {
                    if (photo.status === 'denied') {
                        let originalBonus = photo.is_documentary ? 6 : 3;
                        if (body.exif_perfect) originalBonus += 1;
                        let refundedPenalty = 5;
                        try {
                            const { data: prevLog } = await sbAdmin.from('reputation_logs').select('change_amount').eq('photo_id', photoId).lt('change_amount', 0).order('created_at', { ascending: false }).limit(1).maybeSingle();
                            if (prevLog && prevLog.change_amount < 0) {
                                refundedPenalty = Math.abs(prevLog.change_amount);
                            }
                        } catch(e) {}
                        change = refundedPenalty + (originalBonus * 2);
                    } else {
                        change = photo.is_documentary ? 6 : 3;
                        if (body.exif_perfect) change += 1;
                    }
                } else if (isFinalDeny) {
                    let penalty = 0;
                    if (finalDenialReason && finalDenialReason.includes('tư liệu')) {
                        penalty += 15;
                    }
                    const codes = finalDenialReason ? (finalDenialReason.match(/B\d\.\d|C\d/g) || []) : [];
                    for (const code of codes) {
                        if (['B1.4', 'B2.3', 'C1', 'C2', 'C3'].includes(code)) penalty += 3;
                        else if (['B2.1', 'B3.1', 'B4.3', 'B2.2', 'B2.4', 'B2.5', 'B3.4', 'B3.5', 'B4.2', 'B4.4'].includes(code)) penalty += 5;
                        else if (['B1.2', 'B3.2', 'B1.3', 'B1.1', 'B4.1', 'B5.3'].includes(code)) penalty += 10;
                        else if (['B5.1', 'B5.2', 'B5.4'].includes(code)) penalty += 15;
                    }
                    if (penalty === 0 && codes.length === 0) penalty = 5;
                    if (penalty > 15) penalty = 15;
                    change = -penalty;
                }
                
                let newScore = currentScore + change;
                if (newScore > 220) newScore = 220;
                
                await sbAdmin.from('profiles').update({ reputation_score: newScore }).eq('id', uploaderId);
                await sbAdmin.from('reputation_logs').insert({
                    user_id: uploaderId,
                    photo_id: photoId,
                    change_amount: change,
                    reason: isFinalApprove ? (photo.is_documentary ? 'Ảnh tư liệu duyệt thành công' : 'Ảnh duyệt thành công') : finalDenialReason
                });
            }

            return new Response(JSON.stringify({ success: true, isFinal: isFinalApprove || isFinalDeny }), {
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (err) {
        console.error('[ADMIN ACTION ERROR]:', err.message);
        return new Response(JSON.stringify({ error: 'Đã xảy ra lỗi hệ thống khi thực hiện thao tác duyệt ảnh.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}
