import { createClient } from '@supabase/supabase-js';

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
        
        const token = authHeader.replace('Bearer ', '');

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

        const { data: { user }, error: userError } = await sb.auth.getUser();
        
        if (userError || !user) {
            return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
        }
        
        const sbAdmin = env.SUPABASE_SERVICE_ROLE_KEY ? createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY) : sb;
        
        const { data: profiles } = await sbAdmin.from('profiles').select('role').eq('id', user.id);
        
        if (!profiles || profiles.length === 0 || !['admin', 'manager'].includes(profiles[0].role)) {
            return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), { status: 403 });
        }
        
        const body = await request.json();
        const { action, photoId, reason, plate, op, type, route, model, location, note, province } = body;
        
        if (!action || !photoId) {
            return new Response(JSON.stringify({ error: 'Missing parameters' }), { status: 400 });
        }
        
        const { data: currentPhotoRes, error: pGetErr } = await sbAdmin.from('photos').select('*').eq('id', photoId).single();
        if (pGetErr || !currentPhotoRes) {
            return new Response(JSON.stringify({ error: 'Không tìm thấy ảnh.' }), { status: 404 });
        }
        const photo = currentPhotoRes;

        let isFinalApprove = false;
        let isFinalDeny = false;
        let newProgress = photo.review_progress || '0/2';
        let newReviewerCount = photo.reviewer_count || 0;
        let needsThird = photo.needs_third || false;
        let finalDenialReason = reason || 'Từ chối ảnh';

        const userRole = profiles[0].role;
        if (userRole === 'admin') {
            if (photo.status !== 'pending') {
                return new Response(JSON.stringify({ error: 'Quyền bị từ chối: Chỉ Manager mới có quyền ghi đè (duyệt lại/từ chối lại) ảnh đã có kết quả.' }), { status: 403 });
            }
        }

        // Ảnh đã được duyệt/từ chối thì được phép Ghi đè (override) bằng 1 click
        if (photo.status === 'approved' || photo.status === 'denied') {
            if (action === 'approve') isFinalApprove = true;
            if (action === 'deny') {
                isFinalDeny = true;
                finalDenialReason = reason || 'Admin/Manager ghi đè: Từ chối ảnh';
            }
            
            // Ghi nhận review của người thực hiện ghi đè
            await sbAdmin.from('photo_reviews').upsert({
                photo_id: photoId, admin_id: user.id, action: action, reason: reason || null
            }, { onConflict: 'photo_id,admin_id' });
            
            // Nếu ghi đè, có thể giữ nguyên progress cũ hoặc set thành 1/1 (tuỳ chọn)
            newProgress = photo.review_progress;
            newReviewerCount = photo.reviewer_count;
        } else {
            // Ghi nhận review
            await sbAdmin.from('photo_reviews').upsert({
                photo_id: photoId, admin_id: user.id, action: action, reason: reason || null
            }, { onConflict: 'photo_id,admin_id' });

            // Đếm số lượng review
            const { data: reviews } = await sbAdmin.from('photo_reviews').select('action, reason').eq('photo_id', photoId);
            const approves = reviews.filter(r => r.action === 'approve').length;
            const denies = reviews.filter(r => r.action === 'deny').length;

            if (approves >= 2) isFinalApprove = true;
            else if (denies >= 2) {
                isFinalDeny = true;
                const denyReviews = reviews.filter(r => r.action === 'deny');
                finalDenialReason = denyReviews.map((r, i) => `#${i + 1}: ${r.reason || 'Không có lý do'}`).join('\n');
            } else if (approves === 1 && denies === 1) {
                newReviewerCount = 2; needsThird = true; newProgress = '2/2 (+1)';
            } else {
                newReviewerCount = approves + denies; newProgress = `${newReviewerCount}/2`;
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

            const { error: vError } = await sbAdmin.from('vehicles')
                .upsert({ license_plate: plate, model: model }, { onConflict: 'license_plate' });
            if (vError) throw vError;

            const { error: photoUpdateErr } = await sbAdmin.from('photos').update({
                url: finalUrl,
                license_plate: plate,
                note: note,
                location: location,
                province: province || null,
                status: 'approved',
                operator: op,
                type: type,
                route_no: route,
                review_progress: newProgress,
                reviewer_count: newReviewerCount,
                needs_third: needsThird,
                audit_date: new Date().toISOString()
            }).eq('id', photoId);
            
            if (photoUpdateErr) {
                return new Response(JSON.stringify({ error: `Lỗi lưu trạng thái duyệt cuối cùng: ${photoUpdateErr.message}` }), { status: 500 });
            }

            const specialRoutes = ['Ngoài giờ hoạt động', 'Chưa hoạt động'];
            const isSpecialRoute = specialRoutes.includes(route);

            if (!isSpecialRoute) {
                let { data: currentHistory } = await sbAdmin.from('vehicle_history')
                    .select('*').eq('license_plate', plate).order('effective_date', { ascending: false });

                currentHistory = currentHistory || [];
                let latestHist = currentHistory.length > 0 ? currentHistory[0] : null;

                const takenDateObj = photo.taken_at ? new Date(photo.taken_at) : new Date();
                const takenDateString = takenDateObj.toISOString().split('T')[0];

                if (latestHist) {
                    const textCheck = `${latestHist.route || ''} ${latestHist.operator || ''} ${latestHist.note || ''}`.toLowerCase();
                    const isStopped = textCheck.includes('dừng hoạt động') || textCheck.includes('ngừng hoạt động') || textCheck.includes('thanh lý') || textCheck.includes('thu hồi');
                    const latestHistDate = new Date(latestHist.effective_date);
                    // Chỉ xóa lịch sử dừng hoạt động nếu ảnh mới chứng minh xe hoạt động SAU hoặc BẰNG ngày dừng
                    if (isStopped && takenDateObj >= latestHistDate) {
                        await sbAdmin.from('vehicle_history').delete().eq('id', latestHist.id);
                        
                        currentHistory = currentHistory.filter(h => h.id !== latestHist.id);
                        latestHist = currentHistory.length > 0 ? currentHistory[0] : null;
                    }
                }

                const isNewerThanLatest = !latestHist || !latestHist.effective_date || takenDateObj >= new Date(latestHist.effective_date);
                const existingMatch = currentHistory.find(h => h.route === route && h.operator === op);

                if (isNewerThanLatest) {
                    if (!latestHist || latestHist.operator !== op || latestHist.route !== route) {
                        const { count } = await sbAdmin.from('vehicle_history').select('*', { count: 'exact', head: true }).eq('license_plate', plate);
                        await sbAdmin.from('vehicle_history').insert({
                            license_plate: plate, operator: op, route: route,
                            display_order: count || 0,
                            effective_date: takenDateString
                        });
                    } else {
                        const oldDateObj = latestHist.effective_date ? new Date(latestHist.effective_date) : new Date();
                        if (takenDateObj < oldDateObj || !latestHist.effective_date) {
                            await sbAdmin.from('vehicle_history').update({
                                effective_date: takenDateString
                            }).eq('id', latestHist.id);
                        }
                    }
                } else {
                    if (existingMatch) {
                        const oldDateObj = existingMatch.effective_date ? new Date(existingMatch.effective_date) : new Date();
                        if (takenDateObj < oldDateObj || !existingMatch.effective_date) {
                            await sbAdmin.from('vehicle_history').update({
                                effective_date: takenDateString
                            }).eq('id', existingMatch.id);
                        }
                    } else {
                        const { count } = await sbAdmin.from('vehicle_history').select('*', { count: 'exact', head: true }).eq('license_plate', plate);
                        await sbAdmin.from('vehicle_history').insert({
                            license_plate: plate, operator: op, route: route,
                            display_order: count || 0,
                            effective_date: takenDateString
                        });
                    }
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
                updatePayload.province = province || null;
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

        return new Response(JSON.stringify({ success: true, isFinal: isFinalApprove || isFinalDeny }), {
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
