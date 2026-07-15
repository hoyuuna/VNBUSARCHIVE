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
        
        const { data: profiles } = await sb.from('profiles').select('role').eq('id', user.id);
        
        if (!profiles || profiles.length === 0 || !['admin', 'manager'].includes(profiles[0].role)) {
            return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), { status: 403 });
        }
        
        const body = await request.json();
        const { action, photoId, reason, plate, op, type, route, model, location, note, province } = body;
        
        if (!action || !photoId) {
            return new Response(JSON.stringify({ error: 'Missing parameters' }), { status: 400 });
        }
        
        if (action === 'approve') {
            if (plate && plate.includes('-') && model) {
                const parts = plate.split('-');
                if (parts.length >= 2 && !isNaN(parts[1])) {
                    const basePlate = parts[0];
                    const { data: relatedVehicles } = await sb.from('vehicles').select('license_plate, model').ilike('license_plate', `${basePlate}%`);
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

            const { data: currentPhotoRes, error: pGetErr } = await sb.from('photos').select('url, taken_at').eq('id', photoId).single();
            if (pGetErr) throw pGetErr;
            const photo = currentPhotoRes || {};

            let finalUrl = photo.url;
            const sandboxId = photo.url && photo.url.startsWith('sandbox:') ? photo.url.replace('sandbox:', '').trim() : null;

            let base64Data = null;
            if (sandboxId) {
                const { data: sbxData } = await sb.from('image_sandbox').select('base64_data').eq('id', sandboxId).maybeSingle();
                if (sbxData && sbxData.base64_data) base64Data = sbxData.base64_data;
            }
            if (!base64Data) {
                const { data: sbxByPhoto } = await sb.from('image_sandbox').select('base64_data, id').eq('photo_id', photoId).maybeSingle();
                if (sbxByPhoto && sbxByPhoto.base64_data) {
                    base64Data = sbxByPhoto.base64_data;
                }
            }
            if (!base64Data && photo.url && typeof photo.url === 'string' && photo.url.startsWith('data:')) {
                base64Data = photo.url;
            }

            if ((sandboxId || (photo.url && typeof photo.url === 'string' && photo.url.startsWith('sandbox:'))) && !base64Data) {
                return new Response(JSON.stringify({ error: "Không thể duyệt: Ảnh tạm trong Sandbox đã bị xóa (do quá 24h hoặc bị xóa thủ công). Dữ liệu ảnh gốc không còn tồn tại nên không thể khôi phục lên hệ thống chính!" }), { status: 400 });
            }

            if (base64Data) {
                console.log(`[DEBUG] Admin duyệt ảnh Sandbox (ID: ${photoId}), chuyển lên CDN thật...`);
                const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                const mimeType = matches ? matches[1] : 'image/webp';
                const ext = mimeType.split('/')[1] || 'webp';
                const b64Str = matches ? matches[2] : base64Data;

                let binary;
                try {
                    const { Buffer } = await import('node:buffer');
                    binary = Buffer.from(b64Str, 'base64');
                } catch (nodeErr) {
                    const raw = atob(b64Str);
                    const len = raw.length;
                    binary = new Uint8Array(len);
                    for (let i = 0; i < len; i++) {
                        binary[i] = raw.charCodeAt(i);
                    }
                }

                const blob = new Blob([binary], { type: mimeType });
                const fileName = `img_${Date.now()}_${photoId}.${ext}`;

                const newFormData = new FormData();
                newFormData.append('file', blob, fileName);

                let uploadRes = await fetch('https://cdn.vnbusarchive.io.vn/upload', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${env.CF_IMGBED_TOKEN}` },
                    body: newFormData
                });
                if (!uploadRes.ok || uploadRes.status >= 500) {
                    await new Promise(r => setTimeout(r, 800));
                    uploadRes = await fetch('https://cdn.vnbusarchive.io.vn/upload', {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${env.CF_IMGBED_TOKEN}` },
                        body: newFormData
                    });
                }
                if (!uploadRes.ok) {
                    const errTxt = await uploadRes.text();
                    console.error(`[CDN Upload Error] Status: ${uploadRes.status}, Body: ${errTxt.slice(0, 500)}`);
                    return new Response(JSON.stringify({ error: `Lỗi từ server CDN (${uploadRes.status}): ${errTxt.slice(0, 200)}` }), { status: 502 });
                }
                const uploadResult = await uploadRes.json();
                let rawSrc = null;
                if (Array.isArray(uploadResult) && uploadResult.length > 0) {
                    rawSrc = uploadResult[0].src || uploadResult[0].url || (uploadResult[0].data && (uploadResult[0].data.src || uploadResult[0].data.url));
                } else if (uploadResult && typeof uploadResult === 'object') {
                    rawSrc = uploadResult.src || uploadResult.url || (uploadResult.data && (uploadResult.data.src || uploadResult.data.url));
                }
                if (rawSrc) {
                    finalUrl = rawSrc.startsWith('/') ? `https://cdn.vnbusarchive.io.vn${rawSrc}` : rawSrc;
                } else {
                    return new Response(JSON.stringify({ error: 'Lỗi tải ảnh từ sandbox lên CDN khi duyệt: Phản hồi từ CDN không hợp lệ.' }), { status: 500 });
                }
            }

            if (!finalUrl || (typeof finalUrl === 'string' && (finalUrl.startsWith('sandbox:') || finalUrl.startsWith('data:') || finalUrl === 'SANDBOX_DELETED'))) {
                return new Response(JSON.stringify({ error: "Không thể duyệt: Dữ liệu ảnh không hợp lệ hoặc chưa được tải thành công lên máy chủ CDN thực!" }), { status: 400 });
            }

            const { error: vError } = await sb.from('vehicles')
                .upsert({ license_plate: plate, model: model }, { onConflict: 'license_plate' });
            if (vError) throw vError;

            await sb.from('photos').update({
                url: finalUrl,
                license_plate: plate,
                note: note,
                location: location,
                province: province || null,
                status: 'approved',
                operator: op,
                type: type,
                route_no: route
            }).eq('id', photoId);

            // BẮT BUỘC xóa base64 trong bảng image_sandbox khi đã lên CDN thành công
            if (sandboxId) await sb.from('image_sandbox').delete().eq('id', sandboxId);
            await sb.from('image_sandbox').delete().eq('photo_id', photoId);

            const specialRoutes = ['Ngoài giờ hoạt động', 'Chưa hoạt động'];
            const isSpecialRoute = specialRoutes.includes(route);

            if (!isSpecialRoute) {
                const { data: currentHistory } = await sb.from('vehicle_history')
                    .select('*').eq('license_plate', plate).order('effective_date', { ascending: false }).limit(1);

                const latestHist = currentHistory && currentHistory.length > 0 ? currentHistory[0] : null;
                const takenDateObj = photo.taken_at ? new Date(photo.taken_at) : new Date();
                const takenDateString = takenDateObj.toISOString().split('T')[0];

                if (!latestHist || latestHist.operator !== op || latestHist.route !== route) {
                    const { count } = await sb.from('vehicle_history').select('*', { count: 'exact', head: true }).eq('license_plate', plate);
                    await sb.from('vehicle_history').insert({
                        license_plate: plate, operator: op, route: route,
                        display_order: count || 0,
                        effective_date: takenDateString
                    });
                } else {
                    const oldDateObj = latestHist.effective_date ? new Date(latestHist.effective_date) : new Date();
                    if (takenDateObj < oldDateObj || !latestHist.effective_date) {
                        await sb.from('vehicle_history').update({
                            effective_date: takenDateString
                        }).eq('id', latestHist.id);
                    }
                }
            }

            await sb.from('admin_audit_logs').insert({
                admin_id: user.id,
                action_type: 'approve_photo',
                target_id: photoId,
                details: JSON.stringify({ plate, operator: op })
            });

        } else if (action === 'deny') {
            const { data: currentPhotoRes, error: pGetErr } = await sb.from('photos').select('id, url, status, license_plate, uploader_id').eq('id', photoId).single();
            if (pGetErr || !currentPhotoRes) {
                return new Response(JSON.stringify({ error: 'Không tìm thấy ảnh cần từ chối/xóa.' }), { status: 404 });
            }

            const targetPlate = plate || currentPhotoRes.license_plate;
            const isApprovedOrCdn = currentPhotoRes.status === 'approved' || (currentPhotoRes.url && typeof currentPhotoRes.url === 'string' && (currentPhotoRes.url.startsWith('http://') || currentPhotoRes.url.startsWith('https://')));

            if (isApprovedOrCdn && currentPhotoRes.url && (currentPhotoRes.url.startsWith('http://') || currentPhotoRes.url.startsWith('https://'))) {
                console.log(`[DEBUG] Ảnh ID ${photoId} đang trên CDN (${currentPhotoRes.url}). Tiến hành tải về, convert sang base64, lưu sandbox và xóa CDN...`);
                
                // 1. Tải ảnh từ CDN
                let imgRes;
                try {
                    imgRes = await fetch(currentPhotoRes.url);
                } catch (fetchErr) {
                    return new Response(JSON.stringify({ error: `Không thể kết nối tới CDN để tải ảnh khôi phục (${fetchErr.message}). Hủy quá trình xóa ảnh!` }), { status: 502 });
                }

                if (!imgRes.ok) {
                    return new Response(JSON.stringify({ error: `Không thể tải ảnh từ CDN (HTTP ${imgRes.status}). Hủy quá trình xóa ảnh!` }), { status: 502 });
                }

                let base64Data;
                try {
                    const arrayBuffer = await imgRes.arrayBuffer();
                    const contentType = imgRes.headers.get('content-type') || 'image/webp';
                    let binaryStr = '';
                    try {
                        const { Buffer } = await import('node:buffer');
                        binaryStr = Buffer.from(arrayBuffer).toString('base64');
                    } catch (nodeErr) {
                        const bytes = new Uint8Array(arrayBuffer);
                        const len = bytes.byteLength;
                        const chunkSize = 8192;
                        for (let i = 0; i < len; i += chunkSize) {
                            binaryStr += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + chunkSize, len)));
                        }
                        binaryStr = btoa(binaryStr);
                    }
                    base64Data = `data:${contentType};base64,` + binaryStr;
                } catch (convErr) {
                    return new Response(JSON.stringify({ error: `Lỗi khi convert ảnh sang Base64 (${convErr.message}). Hủy quá trình xóa ảnh!` }), { status: 500 });
                }

                // 2. Lưu vào bảng image_sandbox
                const newSandboxId = `sbx_${Date.now()}_demoted_${photoId}`;
                const { error: sbxErr } = await sb.from('image_sandbox').insert({
                    id: newSandboxId,
                    photo_id: photoId,
                    uploader_id: currentPhotoRes.uploader_id || user.id,
                    base64_data: base64Data,
                    created_at: new Date().toISOString()
                });

                if (sbxErr) {
                    return new Response(JSON.stringify({ error: `Lỗi khi lưu ảnh khôi phục vào Sandbox (${sbxErr.message}). Hủy quá trình xóa ảnh!` }), { status: 500 });
                }

                // 3. Cập nhật bảng photos sang status 'denied' và url về sandbox
                const { error: updateErr } = await sb.from('photos').update({
                    status: 'denied',
                    denial_reason: reason || 'Quản lý/Admin xóa ảnh đã duyệt',
                    url: `sandbox:${newSandboxId}`
                }).eq('id', photoId);

                if (updateErr) {
                    // FALLBACK: Rollback xóa row vừa insert vào image_sandbox
                    await sb.from('image_sandbox').delete().eq('id', newSandboxId).catch(() => {});
                    return new Response(JSON.stringify({ error: `Lỗi khi cập nhật trạng thái ảnh (${updateErr.message}). Hủy quá trình xóa ảnh!` }), { status: 500 });
                }

                // 4. Xóa ảnh trên CDN chính
                try {
                    const urlObj = new URL(currentPhotoRes.url);
                    const fileName = urlObj.pathname.split('/').pop();
                    if (fileName && env.CF_IMGBED_TOKEN) {
                        const safeFileName = encodeURIComponent(fileName);
                        const deleteUrl = `https://cdn.vnbusarchive.io.vn/api/manage/delete/${safeFileName}`;
                        const deleteResponse = await fetch(deleteUrl, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${env.CF_IMGBED_TOKEN}`
                            }
                        });
                        if (!deleteResponse.ok && deleteResponse.status !== 404) {
                            console.warn(`[WARN] Lỗi khi xóa ảnh trên CDN (HTTP ${deleteResponse.status}). Thử lại lần 2...`);
                            await new Promise(r => setTimeout(r, 600));
                            const retryRes = await fetch(deleteUrl, {
                                method: 'DELETE',
                                headers: { 'Authorization': `Bearer ${env.CF_IMGBED_TOKEN}` }
                            });
                            if (!retryRes.ok && retryRes.status !== 404) {
                                console.error(`[CDN DELETE FATAL] Rollback ảnh ID ${photoId} về approved vì không xóa được trên CDN.`);
                                await sb.from('photos').update({
                                    status: 'approved',
                                    denial_reason: null,
                                    url: currentPhotoRes.url
                                }).eq('id', photoId);
                                await sb.from('image_sandbox').delete().eq('id', newSandboxId).catch(() => {});
                                return new Response(JSON.stringify({ error: `Không thể xóa ảnh khỏi máy chủ CDN (HTTP ${retryRes.status}). Đã khôi phục lại trạng thái ảnh ban đầu để tránh mất mát/bất đồng bộ!` }), { status: 502 });
                            }
                        }
                    }
                } catch (cdnErr) {
                    console.error(`[CDN DELETE ERROR] Rollback ảnh ID ${photoId} về approved.`, cdnErr);
                    await sb.from('photos').update({
                        status: 'approved',
                        denial_reason: null,
                        url: currentPhotoRes.url
                    }).eq('id', photoId);
                    await sb.from('image_sandbox').delete().eq('id', newSandboxId).catch(() => {});
                    return new Response(JSON.stringify({ error: `Lỗi gọi API xóa ảnh CDN (${cdnErr.message}). Đã khôi phục lại trạng thái ảnh ban đầu!` }), { status: 500 });
                }
            } else {
                // Ảnh đang ở trạng thái pending (chưa lên CDN), chỉ việc update sang denied
                const { error: updateErr } = await sb.from('photos').update({
                    status: 'denied',
                    denial_reason: reason || 'Từ chối ảnh'
                }).eq('id', photoId);
                if (updateErr) {
                    return new Response(JSON.stringify({ error: `Lỗi cập nhật trạng thái ảnh (${updateErr.message})` }), { status: 500 });
                }
            }
            
            // cleanupVehicle logic
            if (targetPlate) {
                const { data: countData } = await sb.from('photos').select('id', { count: 'exact' })
                    .eq('license_plate', targetPlate)
                    .neq('status', 'denied');
                
                if (countData && countData.length === 0) {
                    await sb.from('vehicles').delete().eq('license_plate', targetPlate);
                    await sb.from('vehicle_history').delete().eq('license_plate', targetPlate);
                }
            }

            await sb.from('admin_audit_logs').insert({
                admin_id: user.id,
                action_type: 'deny_photo',
                target_id: photoId,
                details: JSON.stringify({ plate: targetPlate, reason: reason || 'Đã xóa/từ chối ảnh', was_approved: isApprovedOrCdn })
            });
        } else {
            return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
        }

        // Tự động dọn dẹp ảnh sandbox bị từ chối quá 24h (dựa trên thời gian tạo trong image_sandbox)
        try {
            const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const { data: expiredSandbox } = await sb.from('image_sandbox').select('id, photo_id').lt('created_at', threshold);
            if (expiredSandbox && expiredSandbox.length > 0) {
                const photoIds = expiredSandbox.map(item => item.photo_id).filter(Boolean);
                if (photoIds.length > 0) {
                    const { data: deniedPhotos } = await sb.from('photos').select('id').in('id', photoIds).eq('status', 'denied');
                    if (deniedPhotos && deniedPhotos.length > 0) {
                        await sb.from('image_sandbox').delete().in('photo_id', deniedPhotos.map(p => p.id));
                    }
                }
            }
        } catch (cleanupErr) {
            console.warn('[WARN] Sandbox cleanup error:', cleanupErr);
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
        });
        
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
