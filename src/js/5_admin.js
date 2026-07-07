window.app = window.app || {};

Object.assign(window.app, {
  admin: {
                adminInterval: null,
                commentsData: { data: [], page: 1 },

                originalData: {},
                checkPlateAdmin: async (inputEl, id, type) => {
                    const val = inputEl.value.trim().replace(/[^A-Z0-9-]/gi, '').toUpperCase();
                    inputEl.value = val;

                    const origKey = type + '_' + id;
                    const orig = app.admin.originalData[origKey];
                    if (!orig) return;

                    const pre = type === 'photo' ? 'adm-p-' : 'req-';
                    const elOp = document.getElementById(pre + 'op-' + id);
                    const elType = document.getElementById(pre + 'type-' + id);
                    const elRoute = document.getElementById(pre + 'route-' + id);
                    const elModel = document.getElementById(pre + 'model-' + id);

                    // Trả lại thông tin gốc nếu nhập lại biển số cũ
                    if (val === orig.plate) {
                        if (elOp) elOp.value = orig.operator || '';
                        if (elType) elType.value = orig.type || 'bus';
                        if (elRoute) elRoute.value = orig.route || '';
                        if (elModel) elModel.value = orig.model || '';

                        // Thêm hiệu ứng chớp xanh để báo đã khôi phục
                        inputEl.classList.add('ring-2', 'ring-green-500');
                        setTimeout(() => inputEl.classList.remove('ring-2', 'ring-green-500'), 500);
                        return;
                    }

                    // Lấy dữ liệu biển số mới từ DB
                    try {
                        const { data: vData } = await window.sb.from('vehicles').select('*').eq('license_plate', val).maybeSingle();
                        if (vData) {
                            if (elModel) elModel.value = vData.model || '';

                            const { data: pDataArray } = await window.sb.from('photos')
                                .select('operator, route_no, type')
                                .eq('license_plate', val)
                                .eq('status', 'approved')
                                .order('taken_at', { ascending: false, nullsFirst: false })
                                .order('created_at', { ascending: false })
                                .limit(10);

                            if (pDataArray && pDataArray.length > 0) {
                                let validPhoto = pDataArray.find(p => p.route_no !== 'Ngoài giờ hoạt động');
                                if (!validPhoto) {
                                    validPhoto = { operator: pDataArray[0].operator, route_no: '', type: pDataArray[0].type };
                                }

                                if (elOp) elOp.value = validPhoto.operator || '';
                                if (elRoute) elRoute.value = validPhoto.route_no || '';
                                if (elType) elType.value = validPhoto.type || 'bus';
                            }

                            // Thêm hiệu ứng chớp vàng để báo đã load dữ liệu có sẵn
                            inputEl.classList.add('ring-2', 'ring-amber-500');
                            setTimeout(() => inputEl.classList.remove('ring-2', 'ring-amber-500'), 500);
                        }
                    } catch (e) {
                        console.error("Lỗi tự điền BKS Admin:", e);
                    }
                },

                // --- THÊM STATE CHO TAB MANAGER ---
                manager: {
                    activeTab: 'denied',
                    denied: { data: [], filtered:[], page: 1, denierMap: {} },
                    logs: { data: [], filtered:[], page: 1 },
                    bans: { data: [], filtered:[], page: 1 }
                },
                // ----------------------------------

                saveEmailDraft: () => {
                    try {
                        const draft = {
                            targetUser: document.getElementById('email-target-user')?.value || '',
                            customAddress: document.getElementById('email-custom-address')?.value || '',
                            subject: document.getElementById('email-subject')?.value || '',
                            content: document.getElementById('email-content')?.value || '',
                            isAnonymous: document.getElementById('email-is-anonymous')?.checked || false
                        };
                        localStorage.setItem('vbs_manager_email_draft', JSON.stringify(draft));
                    } catch (e) {}
                },

                restoreEmailDraft: () => {
                    try {
                        const savedStr = localStorage.getItem('vbs_manager_email_draft');
                        if (!savedStr) return;
                        const saved = JSON.parse(savedStr);
                        const sel = document.getElementById('email-target-user');
                        if (sel && saved.targetUser !== undefined) sel.value = saved.targetUser;
                        const cust = document.getElementById('email-custom-address');
                        if (cust && saved.customAddress !== undefined) cust.value = saved.customAddress;
                        if (app.admin.toggleEmailCustom) app.admin.toggleEmailCustom();
                        const sub = document.getElementById('email-subject');
                        if (sub && saved.subject !== undefined) sub.value = saved.subject;
                        const cnt = document.getElementById('email-content');
                        if (cnt && saved.content !== undefined) cnt.value = saved.content;
                        const anon = document.getElementById('email-is-anonymous');
                        if (anon && saved.isAnonymous !== undefined) anon.checked = saved.isAnonymous;
                    } catch (e) {}
                },

                clearEmailDraft: () => {
                    try { localStorage.removeItem('vbs_manager_email_draft'); } catch (e) {}
                },

                logAction: async (actionType, targetId, details) => {
                    if (!app.user) return;
                    try {
                        await window.sb.from('admin_audit_logs').insert({
                            admin_id: app.user.id,
                            action_type: actionType,
                            target_id: targetId,
                            details: details
                        });
                    } catch (e) { console.error("Lỗi ghi log:", e); }
                },

                checkNotification: async () => {
                    if (app.role !== 'admin' && app.role !== 'manager') return;

                    const total = await app.admin.refreshCounts();

                    const iconEl = document.getElementById('nav-admin-icon');
                    if (app.admin.adminInterval) clearInterval(app.admin.adminInterval);
                    iconEl.className = "fa-solid fa-shield-halved md:mr-1";

                    if (total > 0) {
                        let showNumber = false;
                        app.admin.adminInterval = setInterval(() => {
                            showNumber = !showNumber;
                            if (showNumber) {
                                const num = total > 9 ? 9 : total;
                                iconEl.className = `fa-solid fa-${num} md:mr-1`;
                            } else {
                                iconEl.className = "fa-solid fa-shield-halved md:mr-1";
                            }
                        }, 3000);
                    }
                },

                refreshCounts: async () => {
                    try {
                        const { count: pCount } = await window.sb.from('photos').select('*', { count: 'exact', head: true }).eq('status', 'pending');
                        const { data: reqs } = await window.sb.from('edit_requests').select('new_data').eq('status', 'pending');

                        let editCount = 0;
                        let delCount = 0;
                        if (reqs) {
                            reqs.forEach(r => {
                                if (r.new_data.request_type === 'delete_photo') delCount++;
                                else editCount++;
                            });
                        }

                        document.getElementById('count-photos').innerText = pCount || 0;
                        document.getElementById('count-requests').innerText = editCount;
                        document.getElementById('count-delete').innerText = delCount;

                        return (pCount || 0) + editCount + delCount;
                    } catch (err) { console.error("Lỗi đếm:", err); return 0; }
                },

                openZoom: (url, showToolbar = false) => {
                    const modal = document.getElementById('admin-zoom-modal');
                    const img = document.getElementById('admin-zoom-img');
                    img.src = url;
                    img.classList.remove('zoom-img-active');
                    modal.classList.remove('hidden');
                    app.ui.lockScroll();
                    img.classList.remove('modal-content-leave');
                    img.classList.add('modal-content-enter');

                    // Logic hiển thị Toolbar với Animation Trượt
                    const toolbar = document.getElementById('zoom-toolbar');
                    const hint = document.getElementById('zoom-hint');
                    if(toolbar && hint) {
                        if(showToolbar && app.currentPhoto) {
                            toolbar.classList.remove('opacity-0', 'translate-y-8', 'pointer-events-none');
                            toolbar.classList.add('opacity-100', 'translate-y-0', 'pointer-events-auto');
                            hint.classList.add('opacity-0');

                            // Đổ dữ liệu
                            const uploaderName = app.utils.cleanText(app.currentPhoto.profiles?.username || 'Ẩn danh');
                            const uploaderAvatar = app.currentPhoto.profiles?.avatar_url ? app.utils.getProxiedUrl(app.currentPhoto.profiles.avatar_url.replace(/"/g, ''), 'avatar.jpg', 'avatar') : 'https://files.catbox.moe/zzh1q1.png';
                            document.getElementById('zoom-uploader-name').innerText = uploaderName;
                            document.getElementById('zoom-uploader-avatar').src = uploaderAvatar;

                            // Check trạng thái
                            const mainLikeBtn = document.getElementById('btn-like');
                            const zBtn = document.getElementById('zoom-btn-like');
                            const isLiked = mainLikeBtn && mainLikeBtn.classList.contains('bg-gray-400');
                            const isDenied = app.currentPhoto.status === 'denied';

                            if (isLiked || isDenied) {
                                zBtn.className = "flex items-center justify-center gap-1.5 bg-black text-white px-3 py-2 md:px-4 md:py-2.5 rounded-lg font-bold text-[11px] md:text-sm transition-colors whitespace-nowrap";
                                zBtn.innerHTML = isDenied ? '<i class="fa-solid fa-ban text-sm md:text-base"></i> <span class="hidden md:inline">Từ chối</span>' : '<i class="fa-solid fa-check text-sm md:text-base"></i> <span class="hidden md:inline">Đã thích</span>';
                                zBtn.disabled = isDenied;
                            } else {
                                zBtn.className = "flex items-center justify-center gap-1.5 text-gray-800 bg-transparent hover:bg-black hover:text-white px-3 py-2 md:px-4 md:py-2.5 rounded-lg font-bold text-[11px] md:text-sm transition-colors whitespace-nowrap";
                                zBtn.innerHTML = '<i class="fa-regular fa-thumbs-up text-sm md:text-base"></i> <span class="hidden md:inline">Thích</span>';
                                zBtn.disabled = false;
                            }
                        } else {
                            toolbar.classList.add('opacity-0', 'translate-y-8', 'pointer-events-none');
                            toolbar.classList.remove('opacity-100', 'translate-y-0', 'pointer-events-auto');
                            hint.classList.remove('opacity-0');
                        }
                    }
                },

                closeZoom: () => {
                    const modal = document.getElementById('admin-zoom-modal');
                    const img = document.getElementById('admin-zoom-img');
                    const toolbar = document.getElementById('zoom-toolbar');

                    img.classList.remove('modal-content-enter');
                    img.classList.add('modal-content-leave');

                    if (toolbar) {
                        toolbar.classList.add('opacity-0', 'translate-y-8', 'pointer-events-none');
                        toolbar.classList.remove('opacity-100', 'translate-y-0', 'pointer-events-auto');
                    }

                    setTimeout(() => {
                        modal.classList.add('hidden');
                        img.src = "";
                        img.classList.remove('modal-content-leave');
                        app.ui.unlockScroll();
                    }, 200);
                },

                loadTab: async (tab) => {
                    app.adminTab = tab;
                    app.admin.refreshCounts().then(total => app.admin.checkNotification());

                    const content = document.getElementById('admin-content');
                    if (tab === 'manager' && document.getElementById('mgr-sec-denied')) {
                        ['photos', 'requests', 'delete', 'manager', 'comments'].forEach(t => {
                            const btn = document.getElementById(`adm-tab-${t}`);
                            if(!btn) return;
                            if(t === tab) {
                                btn.className = "px-5 py-2 bg-black text-white font-bold rounded-md text-sm shadow-sm transition whitespace-nowrap";
                            } else {
                                btn.className = "px-5 py-2 bg-white border border-gray-300 text-gray-600 font-bold rounded-md text-sm hover:bg-gray-50 transition whitespace-nowrap";
                            }
                        });
                        let activeSub = app.admin.manager?.activeTab || 'denied';
                        try { activeSub = sessionStorage.getItem('vbs_mgr_active_tab') || activeSub; } catch(e){}
                        app.admin.switchManagerTab(activeSub);
                        return;
                    }
                    content.innerHTML = '<p class="text-gray-500 italic p-4">Đang tải...</p>';

                    // Update UI Buttons
                    ['photos', 'requests', 'delete', 'manager', 'comments'].forEach(t => {
                        const btn = document.getElementById(`adm-tab-${t}`);
                        if(!btn) return;
                        if(t === tab) {
                            btn.className = "px-5 py-2 bg-black text-white font-bold rounded-md text-sm shadow-sm transition whitespace-nowrap";
                        } else {
                            btn.className = "px-5 py-2 bg-white border border-gray-300 text-gray-600 font-bold rounded-md text-sm hover:bg-gray-50 transition whitespace-nowrap";
                        }
                    });

                    try {
                        if (tab === 'photos') {
                            const { data: rawPhotos, error } = await window.sb.from('photos').select('*, profiles(username, role), vehicles(model)').eq('status', 'pending').order('id', { ascending: true });
                            if (error) throw error;
                            if (!rawPhotos || rawPhotos.length === 0) { content.innerHTML = '<p class="p-4">Không có ảnh nào chờ duyệt.</p>'; return; }

                            const pendingPlates = [...new Set(rawPhotos.map(p => p.license_plate).filter(Boolean))];
                            const pendingOps = [...new Set(rawPhotos.map(p => app.utils.cleanText(p.operator || '')).filter(Boolean))];
                            const pendingRoutes = [...new Set(rawPhotos.map(p => app.utils.cleanText(p.route_no || '')).filter(Boolean))];
                            const pendingModels = [...new Set(rawPhotos.map(p => app.utils.cleanText(p.vehicles?.model || '')).filter(Boolean))];

                            let approvedPlateSet = new Set();
                            let approvedOpSet = new Set();
                            let approvedRouteSet = new Set();
                            let approvedModelSet = new Set();

                            if (pendingPlates.length > 0) {
                                const { data: approvedPlates } = await window.sb.from('photos')
                                    .select('license_plate')
                                    .eq('status', 'approved')
                                    .in('license_plate', pendingPlates);
                                approvedPlateSet = new Set((approvedPlates || []).map(p => (p.license_plate || '').toUpperCase()));
                            }
                            if (pendingOps.length > 0) {
                                const { data: approvedOps } = await window.sb.from('photos').select('operator').eq('status', 'approved').in('operator', pendingOps);
                                approvedOpSet = new Set((approvedOps || []).map(p => app.utils.cleanText(p.operator || '')));
                            }
                            if (pendingRoutes.length > 0) {
                                const { data: approvedRoutes } = await window.sb.from('photos').select('route_no').eq('status', 'approved').in('route_no', pendingRoutes);
                                approvedRouteSet = new Set((approvedRoutes || []).map(p => app.utils.cleanText(p.route_no || '')));
                            }
                            if (pendingModels.length > 0) {
                                const { data: approvedModels } = await window.sb.from('photos').select('vehicles!inner(model)').eq('status', 'approved').in('vehicles.model', pendingModels);
                                approvedModelSet = new Set((approvedModels || []).map(p => app.utils.cleanText(p.vehicles?.model || '')));
                            }

                            // THÊM: Sắp xếp ưu tiên (Admin/Manager lên đầu, theo thứ tự up trước xếp trước)
                            const photos = rawPhotos.sort((a, b) => {
                                const roleA = a.profiles?.role || 'user';
                                const roleB = b.profiles?.role || 'user';
                                const isPrivilegedA = (roleA === 'admin' || roleA === 'manager') ? 1 : 0;
                                const isPrivilegedB = (roleB === 'admin' || roleB === 'manager') ? 1 : 0;

                                if (isPrivilegedA !== isPrivilegedB) {
                                    return isPrivilegedB - isPrivilegedA;
                                }
                                return a.id - b.id;
                            });

                            content.innerHTML = photos.map(p => {
                                const op = app.utils.cleanText(p.operator || '');
                                const type = p.type || 'bus';
                                const route = app.utils.cleanText(p.route_no || '');
                                const model = app.utils.cleanText(p.vehicles?.model || '');
                                const location = app.utils.cleanText(p.location);
                                const note = app.utils.cleanText(p.note);
                                const safeUsername = app.utils.cleanText(p.profiles?.username || 'Ẩn danh');
                                const safePlate = app.utils.cleanText(p.license_plate);
                                if (!app.admin.originalData) app.admin.originalData = {};
                                app.admin.originalData['photo_' + p.id] = { plate: safePlate, operator: op, type: type, route: route, model: model };

                                const tagNew = '<span class="bg-black text-white px-1.5 py-0.5 rounded text-[9px] font-bold ml-1 tracking-wider">MỚI</span>';
                                const isNewOp = op && !approvedOpSet.has(op);
                                const isNewRoute = route && !approvedRouteSet.has(route);
                                const isNewModel = model && !approvedModelSet.has(model);

                                return `
                                <div class="admin-card overflow-visible">
                                    <div class="admin-card-header">
                                        <div class="flex items-center gap-2">
                                            <span class="font-bold text-sm">${safePlate}</span>
                                            ${!approvedPlateSet.has(safePlate.toUpperCase()) ? '<span class="badge-xe-moi"><i class="fa-solid fa-sparkles"></i> XE MỚI</span>' : ''}
                                            ${p.suspected_exif_fraud ? '<span class="bg-red-600 text-white px-1.5 py-0.5 rounded text-[10px] font-bold ml-1 tracking-wider whitespace-nowrap"><i class="fa-solid fa-triangle-exclamation mr-1"></i>Nghi ngờ gian lận</span>' : ''}
                                        </div>
                                        <span class="text-xs text-gray-500">${safeUsername}</span>
                                    </div>
                                    <div class="relative w-full bg-gray-200 border-y border-gray-200">
                                        <img loading="lazy" src="${app.utils.getProxiedUrl(p.url)}" class="w-full h-auto object-contain">
                                        <button onclick="app.admin.openZoom('${app.utils.getProxiedUrl(p.url)}')" class="absolute top-2 right-2 bg-black/50 text-white w-8 h-8 rounded hover:bg-black flex items-center justify-center transition" title="Soi ảnh"><i class="fa-solid fa-expand"></i></button>
                                    </div>
                                    <div class="admin-card-body">
                                        <p class="text-[10px] text-gray-500 mb-2"><b>Ngày chụp:</b> ${p.taken_at ? p.taken_at.split('T')[0] : 'Không rõ'} | <b>Camera:</b> ${p.camera_model}</p>
                                        <div class="grid grid-cols-2 gap-2 mb-2">
                                            <div><span class="admin-label">Biển số</span><input type="text" id="adm-p-plate-${p.id}" value="${safePlate}" class="admin-input transition-all" oninput="app.utils.formatPlateInput(this)" onchange="app.admin.checkPlateAdmin(this, '${p.id}', 'photo')"></div>
                                            <div>
                                                <span class="admin-label">Đơn vị${isNewOp ? tagNew : ''}</span>
                                                <div class="relative">
                                                    <input type="text" id="adm-p-op-${p.id}" value="${op}" class="admin-input" autocomplete="off" oninput="app.utils.formatNoPunctuation(this); app.utils.triggerSuggestion('adm-p-op-${p.id}', 'adm-sug-op-${p.id}', this.value, 'operator')">
                                                    <div id="adm-sug-op-${p.id}" class="suggestion-box"></div>
                                                </div>
                                            </div>
                                            <div><span class="admin-label">Loại xe</span><select id="adm-p-type-${p.id}" class="admin-input"><option value="bus" ${type === 'bus' ? 'selected' : ''}>Xe buýt</option><option value="coach" ${type === 'coach' ? 'selected' : ''}>Xe khách</option></select></div>
                                            <div>
                                                <span class="admin-label">Tuyến${isNewRoute ? tagNew : ''}</span>
                                                <div class="relative">
                                                    <input type="text" id="adm-p-route-${p.id}" value="${route}" class="admin-input" autocomplete="off" onfocus="app.utils.triggerRouteSuggestion('adm-p-route-${p.id}', 'adm-sug-route-${p.id}', '')" oninput="app.utils.triggerRouteSuggestion('adm-p-route-${p.id}', 'adm-sug-route-${p.id}', this.value)">
                                                    <div id="adm-sug-route-${p.id}" class="suggestion-box"></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="grid grid-cols-2 gap-2 mb-2">
                                            <div>
                                                <span class="admin-label">Dòng xe${isNewModel ? tagNew : ''}</span>
                                                <div class="relative">
                                                    <input type="text" id="adm-p-model-${p.id}" value="${model}" class="admin-input" autocomplete="off" oninput="app.utils.triggerSuggestion('adm-p-model-${p.id}', 'adm-sug-model-${p.id}', this.value, 'model')">
                                                    <div id="adm-sug-model-${p.id}" class="suggestion-box"></div>
                                                </div>
                                            </div>
                                            <div><span class="admin-label">Vị trí</span><input type="text" id="adm-p-location-${p.id}" value="${location}" class="admin-input"></div>
                                        </div>
                                        <div><span class="admin-label">Ghi chú</span><textarea id="adm-p-note-${p.id}" rows="2" class="admin-input">${note}</textarea></div>
                                        ${(() => {
                                        const isOwnPhoto = p.uploader_id === app.user.id;
                                        const canApprove = !isOwnPhoto || app.role === 'manager';
                                        const canDeny = !isOwnPhoto || app.role === 'manager';

                                        let actionButtons = '<div class="flex gap-2 mt-2">';

                                        if (canApprove) {
                                            actionButtons += `<button onclick="app.admin.approvePhoto('${p.id}', '${p.uploader_id}', this)" class="flex-1 bg-green-600 text-white py-1.5 text-xs font-bold rounded hover:bg-green-700">DUYỆT</button>`;
                                        } else {
                                            actionButtons += `<div class="flex-1 bg-gray-100 text-gray-400 py-1.5 text-xs font-bold rounded text-center border border-gray-200 cursor-not-allowed">
                                                <i class="fa-solid fa-lock mr-1"></i> Không thể tự duyệt
                                            </div>`;
                                        }

                                        if (canDeny) {
                                            actionButtons += `<button onclick="app.admin.denyPhoto('${p.id}', '${p.uploader_id}', this)" class="flex-1 bg-red-600 text-white py-1.5 text-xs font-bold rounded hover:bg-red-700">TỪ CHỐI</button>`;
                                        }

                                        actionButtons += '</div>';
                                        return actionButtons;
                                    })()}
                                    </div>
                                </div>`
                            }).join('');
                        } else if (tab === 'delete') {
                            let html = '';


                            if (app.role === 'manager') {
                                html += `
                                <div class="col-span-full mb-6 p-5 bg-red-50 border border-red-200 rounded-lg shadow-sm">
                                    <h3 class="font-bold text-sm mb-3 text-red-700 uppercase"><i class="fa-solid fa-triangle-exclamation"></i> Manager Xóa ảnh trực tiếp</h3>
                                    <div class="flex flex-col md:flex-row gap-3">
                                        <input type="text" id="adm-direct-delete-id" placeholder="ID ảnh hoặc Link ảnh..." class="flex-1 border border-red-200 p-2.5 text-sm rounded-md outline-none focus:ring-2 focus:ring-red-500">
                                        <input type="text" id="adm-direct-delete-reason" placeholder="Lý do xóa..." class="flex-1 border border-red-200 p-2.5 text-sm rounded-md outline-none focus:ring-2 focus:ring-red-500">
                                        <button onclick="app.admin.directDeleteInput(this)" class="bg-red-600 text-white px-6 py-2.5 font-bold rounded-md hover:bg-red-700 transition whitespace-nowrap">Xóa Ngay</button>
                                    </div>
                                </div>
                                `;
                            }

                            html += '<div class="col-span-full"><h3 class="font-bold text-sm mb-3 uppercase">Danh sách user yêu cầu xóa</h3></div>';

                            let { data: reqs, error } = await window.sb.from('edit_requests').select('*').eq('status', 'pending');
                            if (error) throw error;

                            const deleteReqs = reqs ? reqs.filter(r => r.new_data.request_type === 'delete_photo') : [];

                            if (!deleteReqs || deleteReqs.length === 0) {
                                content.innerHTML = html + '<p class="col-span-full p-4">Không có yêu cầu xóa nào.</p>';
                                return;
                            }

                            const photoIds = deleteReqs.map(r => r.new_data.photo_id);
                            const { data: photos } = await window.sb.from('photos').select('id, url, license_plate').in('id', photoIds);
                            const photoMap = {}; if (photos) photos.forEach(p => photoMap[p.id] = p);

                            const userIds = [...new Set(deleteReqs.map(r => r.requester_id))];
                            const { data: users } = await window.sb.from('profiles').select('id, username').in('id', userIds);
                            const userMap = {}; if (users) users.forEach(u => userMap[u.id] = u.username);

                            html += deleteReqs.map(req => {
                                const photo = photoMap[req.new_data.photo_id];
                                const username = app.utils.cleanText(userMap[req.requester_id] || 'Ẩn danh');
                                const userReason = app.utils.cleanText(req.new_data.reason || 'Không có lý do');

                                return `
                                <div class="admin-card overflow-visible">
                                    <div class="admin-card-header bg-red-50">
                                        <span class="font-bold text-xs uppercase text-red-600">YÊU CẦU XÓA</span>
                                        <span class="text-xs text-gray-500">${username}</span>
                                    </div>
                                    <div class="relative w-full bg-gray-200 border-y border-gray-200">
                                        <img loading="lazy" src="${app.utils.getProxiedUrl(photo?.url)}" class="w-full h-auto object-contain">
                                        <button onclick="app.admin.openZoom('${app.utils.getProxiedUrl(photo?.url)}')" class="absolute top-2 right-2 bg-black/50 text-white w-8 h-8 rounded hover:bg-black flex items-center justify-center transition" title="Soi ảnh"><i class="fa-solid fa-expand"></i></button>
                                    </div>
                                    <div class="admin-card-body text-xs">
                                        <p class="font-bold text-sm mb-1">${photo?.license_plate || 'Đã mất dữ liệu'}</p>
                                        <div class="mb-3 mt-2"><span class="admin-label">Lý do user nhập:</span><p class="bg-gray-50 p-2 border rounded text-red-700 italic">"${userReason}"</p></div>
                                        <div class="flex gap-2 mt-3">
                                            <button onclick="app.admin.approveDeleteReq('${req.id}', '${req.new_data.photo_id}', '${req.requester_id}', '${userReason}', this)" class="flex-1 bg-red-600 text-white py-1.5 font-bold rounded hover:bg-red-700">DUYỆT XÓA</button>
                                            <button onclick="app.admin.denyReq('${req.id}', this)" class="flex-1 bg-gray-600 text-white py-1.5 font-bold rounded hover:bg-gray-700">TỪ CHỐI</button>
                                        </div>
                                    </div>
                                </div>`
                            }).join('');

                            content.innerHTML = html;
                        } else if (tab === 'requests') {
                            let { data: reqs, error } = await window.sb.from('edit_requests').select('*').eq('status', 'pending');
                            if (error) throw error;
                            if (!reqs || reqs.length === 0) { content.innerHTML = '<p class="p-4">Không có yêu cầu nào.</p>'; return; }

                            const userIds = [...new Set(reqs.map(r => r.requester_id))];
                            const { data: users } = await window.sb.from('profiles').select('id, username').in('id', userIds);
                            const userMap = {}; if (users) users.forEach(u => userMap[u.id] = u.username);

                            const plates = reqs.map(r => r.license_plate);
                            const { data: curVehicles } = await window.sb.from('vehicles').select('*').in('license_plate', plates);
                            const vMap = {}; if (curVehicles) curVehicles.forEach(v => vMap[v.license_plate] = v);


                            const photoIdsReq = reqs.map(r => r.new_data.photo_id).filter(Boolean);
                            const { data: curPhotos } = await window.sb.from('photos').select('id, operator, route_no, type').in('id', photoIdsReq);
                            const pMap = {}; if (curPhotos) curPhotos.forEach(p => pMap[p.id] = p);

                            content.innerHTML = reqs.map(r => {
                                const d = r.new_data;
                                const type = d.request_type || 'Unknown';
                                const username = userMap[r.requester_id] || 'Ẩn danh';
                                const curV = vMap[r.license_plate] || {};
                                const curP = pMap[d.photo_id] || {};

                                if (type === 'update_vehicle_info') {
                                    const tagNew = '<span class="text-red-500 font-bold ml-1 text-[9px]">[MỚI]</span>';
                                    if (!app.admin.originalData) app.admin.originalData = {};
                                    app.admin.originalData['req_' + r.id] = { plate: d.license_plate, operator: d.operator, type: d.type, route: d.route, model: d.model };
                                    return `
                                    <div class="admin-card overflow-visible">
                                        <div class="admin-card-header"><span class="font-bold text-xs uppercase text-blue-600">SỬA THÔNG TIN</span><span class="text-xs text-gray-500">${app.utils.cleanText(username)}</span></div>
                                        <div class="admin-card-body text-xs">
                                            <div class="grid grid-cols-2 gap-2 mb-2">
                                                <div><span class="admin-label">BKS ${d.license_plate !== curV.license_plate ? tagNew : ''}</span><input type="text" id="req-plate-${r.id}" value="${app.utils.escapeAttr(d.license_plate)}" class="admin-input font-bold transition-all" oninput="app.utils.formatPlateInput(this)" onchange="app.admin.checkPlateAdmin(this, '${r.id}', 'req')"></div>
                                                <div>
                                                    <span class="admin-label">Đơn vị ${d.operator !== curP.operator ? tagNew : ''}</span>
                                                    <div class="relative">
                                                        <input type="text" id="req-op-${r.id}" value="${app.utils.escapeAttr(d.operator)}" class="admin-input" oninput="app.utils.formatNoPunctuation(this); app.utils.triggerSuggestion('req-op-${r.id}', 'req-sug-op-${r.id}', this.value, 'operator')">
                                                        <div id="req-sug-op-${r.id}" class="suggestion-box"></div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <span class="admin-label">Dòng xe ${d.model !== curV.model ? tagNew : ''}</span>
                                                    <div class="relative">
                                                        <input type="text" id="req-model-${r.id}" value="${app.utils.escapeAttr(d.model || '')}" class="admin-input" oninput="app.utils.triggerSuggestion('req-model-${r.id}', 'req-sug-model-${r.id}', this.value, 'model')">
                                                        <div id="req-sug-model-${r.id}" class="suggestion-box"></div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <span class="admin-label">Tuyến ${d.route !== curP.route_no ? tagNew : ''}</span>
                                                    <div class="relative">
                                                        <input type="text" id="req-route-${r.id}" value="${app.utils.escapeAttr(d.route || '')}" class="admin-input" autocomplete="off" onfocus="app.utils.triggerRouteSuggestion('req-route-${r.id}', 'req-sug-route-${r.id}', '')" oninput="app.utils.triggerRouteSuggestion('req-route-${r.id}', 'req-sug-route-${r.id}', this.value)">
                                                        <div id="req-sug-route-${r.id}" class="suggestion-box"></div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="mb-2"><span class="admin-label">Loại xe ${d.type !== curP.type ? tagNew : ''}</span><select id="req-type-${r.id}" class="admin-input"><option value="bus" ${d.type === 'bus' ? 'selected' : ''}>Xe buýt</option><option value="coach" ${d.type === 'coach' ? 'selected' : ''}>Xe khách</option></select></div>
                                            <div class="mb-2"><span class="admin-label">Vị trí (Chỉ cập nhật ảnh này)</span><input type="text" id="req-loc-${r.id}" value="${app.utils.escapeAttr(d.location || '')}" class="admin-input"></div>
                                            <div class="mb-2"><span class="admin-label">Ghi chú (Chỉ cập nhật ảnh này)</span><textarea id="req-note-${r.id}" class="admin-input">${app.utils.cleanText(d.note || '')}</textarea></div>

                                            <div class="flex gap-2 mt-3">
                                                <button onclick="app.admin.approveReq('${r.id}', this, 'info')" class="flex-1 bg-green-600 text-white py-1.5 font-bold rounded hover:bg-green-700">DUYỆT</button>
                                                <button onclick="app.admin.denyReq('${r.id}', this)" class="flex-1 bg-red-600 text-white py-1.5 font-bold rounded hover:bg-red-700">HỦY</button>
                                            </div>
                                        </div>
                                    </div>`;
                                } else if (type === 'update_history') {
                                    let details = `<p class="mb-2 font-bold text-red-500">[MỚI] Cập nhật ${d.history_items.length} mục lịch sử:</p>`;
                                    d.history_items.forEach(h => { details += `<p class="pl-2 border-l-2 border-gray-300 mb-1">- ${h.operator} (${h.route})</p>`; });
                                    return `
                                    <div class="admin-card">
                                        <div class="admin-card-header"><span class="font-bold text-xs uppercase text-amber-600">SỬA LỊCH SỬ XE: ${r.license_plate}</span><span class="text-xs text-gray-500">${username}</span></div>
                                        <div class="admin-card-body text-xs">
                                            <div class="mb-3 scroll-y max-h-40 overflow-auto">${details}</div>
                                            <div class="flex gap-2">
                                                <button onclick="app.admin.approveReq('${r.id}', this, 'history')" class="flex-1 bg-green-600 text-white py-1.5 font-bold rounded hover:bg-green-700">DUYỆT</button>
                                                <button onclick="app.admin.denyReq('${r.id}', this)" class="flex-1 bg-red-600 text-white py-1.5 font-bold rounded hover:bg-red-700">HỦY</button>
                                            </div>
                                        </div>
                                    </div>`;
                                } else if (type === 'update_vehicle_details') {
                                    const tagNew = '<span class="text-red-500 font-bold ml-1 text-[9px]">[MỚI]</span>';
                                    if (!app.admin.originalData) app.admin.originalData = {};
                                    app.admin.originalData['req_' + r.id] = { plate: d.license_plate, operator: d.operator, type: d.type, route: d.route, model: d.model };
                                    return `
                                    <div class="admin-card overflow-visible">
                                        <div class="admin-card-header"><span class="font-bold text-xs uppercase text-purple-600">SỬA HỒ SƠ XE: ${r.license_plate}</span><span class="text-xs text-gray-500">${username}</span></div>
                                        <div class="admin-card-body text-xs">
                                            <div class="mb-2">
                                                <span class="admin-label">Dòng xe ${d.model !== curV.model ? tagNew : ''}</span>
                                                <div class="relative">
                                                    <input type="text" id="req-v-model-${r.id}" value="${app.utils.escapeAttr(d.model || '')}" class="admin-input" oninput="app.utils.triggerSuggestion('req-v-model-${r.id}', 'req-v-sug-model-${r.id}', this.value, 'model')">
                                                    <div id="req-v-sug-model-${r.id}" class="suggestion-box"></div>
                                                </div>
                                            </div>
                                            <div class="mb-2">
                                                <span class="admin-label">Ghi chú chung về xe ${d.note !== curV.note ? tagNew : ''}</span>
                                                <textarea id="req-v-note-${r.id}" class="admin-input" rows="3">${app.utils.escapeAttr(d.note || '')}</textarea>
                                            </div>
                                            <div class="flex gap-2 mt-3">
                                                <button onclick="app.admin.approveReq('${r.id}', this, 'vehicle_details')" class="flex-1 bg-green-600 text-white py-1.5 font-bold rounded hover:bg-green-700">DUYỆT</button>
                                                <button onclick="app.admin.denyReq('${r.id}', this)" class="flex-1 bg-red-600 text-white py-1.5 font-bold rounded hover:bg-red-700">HỦY</button>
                                            </div>
                                        </div>
                                    </div>`;
                                } else if (type === 'update_operator_info') {
                                    return `
                                    <div class="admin-card overflow-visible">
                                        <div class="admin-card-header bg-orange-50"><span class="font-bold text-xs uppercase text-orange-600">CẬP NHẬT NHÀ XE</span><span class="text-xs text-gray-500">${username}</span></div>
                                        <div class="admin-card-body text-xs">
                                            <p class="font-bold text-sm mb-3 text-black"><i class="fa-solid fa-building mr-1 text-gray-400"></i> ${app.utils.escapeAttr(d.operator_name)}</p>
                                            <div class="mb-2">
                                                <span class="admin-label">Logo URL</span>
                                                <input type="text" id="req-op-logo-${r.id}" value="${app.utils.escapeAttr(d.logo_url || '')}" class="admin-input">
                                                ${d.logo_url ? `<img src="${app.utils.escapeAttr(d.logo_url)}" class="mt-1 h-8 w-8 object-cover rounded border border-gray-200">` : ''}
                                            </div>
                                            <div class="mb-2">
                                                <span class="admin-label">Mô tả</span>
                                                <textarea id="req-op-desc-${r.id}" class="admin-input" rows="4">${app.utils.escapeAttr(d.description || '')}</textarea>
                                            </div>
                                            <div class="flex gap-2 mt-3">
                                                <button onclick="app.admin.approveReq('${r.id}', this, 'operator_info')" class="flex-1 bg-green-600 text-white py-1.5 font-bold rounded hover:bg-green-700">DUYỆT</button>
                                                <button onclick="app.admin.denyReq('${r.id}', this)" class="flex-1 bg-red-600 text-white py-1.5 font-bold rounded hover:bg-red-700">TỪ CHỐI</button>
                                            </div>
                                        </div>
                                    </div>`;
                                } else if (type === 'update_model_info') {
                                    return `
                                    <div class="admin-card overflow-visible">
                                        <div class="admin-card-header bg-purple-50"><span class="font-bold text-xs uppercase text-purple-600">CẬP NHẬT DÒNG XE</span><span class="text-xs text-gray-500">${username}</span></div>
                                        <div class="admin-card-body text-xs">
                                            <p class="font-bold text-sm mb-3 text-black"><i class="fa-solid fa-layer-group mr-1 text-gray-400"></i> ${app.utils.escapeAttr(d.model_name)}</p>
                                            <div class="mb-2">
                                                <span class="admin-label">Logo Hãng (Tự động đồng bộ hãng)</span>
                                                <input type="text" id="req-mdl-logo-${r.id}" value="${app.utils.escapeAttr(d.logo_url || '')}" class="admin-input">
                                                ${d.logo_url ? `<img src="${app.utils.escapeAttr(d.logo_url)}" class="mt-1 h-8 w-auto max-w-[80px] object-contain rounded border border-gray-200">` : ''}
                                            </div>
                                            <div class="mb-2">
                                                <span class="admin-label">Mô tả chi tiết Model</span>
                                                <textarea id="req-mdl-desc-${r.id}" class="admin-input" rows="4">${app.utils.escapeAttr(d.description || '')}</textarea>
                                            </div>
                                            <div class="flex gap-2 mt-3">
                                                <button onclick="app.admin.approveReq('${r.id}', this, 'model_info')" class="flex-1 bg-green-600 text-white py-1.5 font-bold rounded hover:bg-green-700">DUYỆT</button>
                                                <button onclick="app.admin.denyReq('${r.id}', this)" class="flex-1 bg-red-600 text-white py-1.5 font-bold rounded hover:bg-red-700">TỪ CHỐI</button>
                                            </div>
                                        </div>
                                    </div>`;
                                }
                            }).join('');
                        }


                        else if (tab === 'comments') {
                            const { data } = await window.sb.from('photo_comments')
                                .select('*, profiles(username), photos(license_plate)')
                                .order('created_at', {ascending: false}).limit(500);

                            app.admin.commentsData.data = data || [];
                            app.admin.commentsData.page = 1;

                            content.innerHTML = `
                            <div class="col-span-full">
                                <h3 class="font-bold mb-4 uppercase tracking-widest text-sm text-gray-500">Quản lý bình luận toàn hệ thống</h3>
                                <div class="overflow-x-auto border border-gray-200 rounded-md">
                                    <table class="w-full text-left text-sm whitespace-nowrap">
                                        <thead class="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-[11px] tracking-wider">
                                            <tr>
                                                <th class="p-3">Thời gian</th>
                                                <th class="p-3">Người đăng</th>
                                                <th class="p-3">Xe</th>
                                                <th class="p-3 w-full">Nội dung</th>
                                                <th class="p-3 text-center">Hành động</th>
                                            </tr>
                                        </thead>
                                        <tbody id="adm-comments-content" class="divide-y divide-gray-200">
                                            <tr><td colspan="5" class="p-4 text-center text-gray-500"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải...</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div id="adm-comments-pager" class="mt-6 w-full flex justify-center"></div>
                            </div>`;

                            // Gọi hàm render chi tiết
                            app.admin.renderCommentsData();
                        } else if (tab === 'manager') {
                            if (app.role !== 'manager') {
                                content.innerHTML = '<p class="p-4 text-red-500 font-bold">Bạn không có quyền truy cập khu vực này.</p>';
                                return;
                            }

                            content.className = "col-span-full";
                            content.innerHTML = `
                                <div class="bg-white border border-gray-200 rounded-lg shadow-sm p-4 md:p-6 mb-6">
                                    <div class="flex gap-2 mb-4 overflow-x-auto">
                                        <button onclick="app.admin.switchManagerTab('denied')" id="mgr-tab-denied" class="font-bold text-sm px-4 py-2 bg-black text-white rounded transition whitespace-nowrap">Ảnh bị từ chối</button>
                                         <button onclick="app.admin.switchManagerTab('logs')" id="mgr-tab-logs" class="font-bold text-sm px-4 py-2 bg-white text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition whitespace-nowrap">Nhật ký hoạt động</button>
                                        <button onclick="app.admin.switchManagerTab('bans')" id="mgr-tab-bans" class="font-bold text-sm px-4 py-2 bg-white text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition whitespace-nowrap"><i class="fa-solid fa-users mr-1"></i> Quản lý người dùng</button>
                                        <button onclick="app.admin.switchManagerTab('email')" id="mgr-tab-email" class="font-bold text-sm px-4 py-2 bg-white text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition whitespace-nowrap"><i class="fa-solid fa-envelope mr-1"></i> Gửi Email</button>
                                        <button onclick="app.admin.switchManagerTab('settings')" id="mgr-tab-settings" class="font-bold text-sm px-4 py-2 bg-white text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition whitespace-nowrap"><i class="fa-solid fa-sliders mr-1"></i> Cài đặt</button>
                                    </div>

                                    <!-- TAB: ẢNH BỊ TỪ CHỐI -->
                                    <div id="mgr-sec-denied" class="block">
                                        <div class="flex items-center gap-2 mb-4 bg-gray-50 border border-gray-200 rounded-md px-3">
                                            <i class="fa-solid fa-magnifying-glass text-gray-400"></i>
                                            <input type="text" placeholder="Tìm kiếm BKS, Lý do, Username..." class="w-full py-2.5 bg-transparent outline-none text-sm" oninput="app.admin.filterManagerData('denied', this.value)">
                                        </div>
                                        <div id="mgr-denied-content" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <p class="text-gray-500 italic text-sm py-4"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải dữ liệu...</p>
                                        </div>
                                        <div id="mgr-denied-pager" class="mt-6 w-full flex justify-center"></div>
                                    </div>

                                    <!-- TAB: NHẬT KÝ HOẠT ĐỘNG -->
                                    <div id="mgr-sec-logs" class="hidden">
                                        <div class="flex items-center gap-2 mb-4 bg-gray-50 border border-gray-200 rounded-md px-3">
                                            <i class="fa-solid fa-magnifying-glass text-gray-400"></i>
                                            <input type="text" placeholder="Tìm kiếm hành động, Admin, chi tiết..." class="w-full py-2.5 bg-transparent outline-none text-sm" oninput="app.admin.filterManagerData('logs', this.value)">
                                        </div>
                                        <div class="overflow-x-auto border border-gray-200 rounded-md">
                                            <table class="w-full text-left text-sm whitespace-nowrap">
                                                <thead class="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-[11px] tracking-wider">
                                                    <tr>
                                                        <th class="p-3">Thời gian</th>
                                                        <th class="p-3">Admin</th>
                                                        <th class="p-3">Hành động</th>
                                                        <th class="p-3">Mục tiêu (ID)</th>
                                                        <th class="p-3 w-full">Chi tiết</th>
                                                    </tr>
                                                </thead>
                                                <tbody id="mgr-logs-content" class="divide-y divide-gray-200">
                                                    <tr><td colspan="5" class="p-4 text-center text-gray-500"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải...</td></tr>
                                                </tbody>
                                            </table>
                                        </div>
                                         <div id="mgr-logs-pager" class="mt-6 w-full flex justify-center"></div>
                                     </div>

                                    <!-- TAB: GỬI EMAIL -->
                                    <div id="mgr-sec-email" class="hidden">
                                        <div class="max-w-3xl border border-gray-200 rounded-lg p-5 bg-white shadow-sm">
                                            <div class="flex justify-between items-center mb-4">
                                                <h3 class="font-bold text-lg text-black"><i class="fa-solid fa-paper-plane mr-2 text-blue-600"></i>Soạn Email Mới</h3>
                                                <button type="button" onclick="if(confirm('Bạn có chắc muốn xóa bản nháp email này?')) { app.admin.clearEmailDraft(); document.getElementById('admin-email-form').reset(); app.admin.toggleEmailCustom(); }" class="text-xs bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 px-3 py-1.5 rounded-md font-bold transition flex items-center gap-1"><i class="fa-solid fa-trash-can"></i> Xóa bản nháp</button>
                                            </div>

                                            <form id="admin-email-form" onsubmit="app.admin.submitEmail(event)">
                                                <div class="mb-4">
                                                    <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Gửi tới <span class="text-red-500">*</span></label>
                                                    <div class="flex gap-2">
                                                        <select id="email-target-user" class="w-full border border-gray-300 p-2.5 text-sm rounded-md focus:ring-2 focus:ring-black outline-none" onchange="app.admin.toggleEmailCustom(); app.admin.saveEmailDraft();">
                                                            <option value="">-- Chọn thành viên trong hệ thống --</option>
                                                            <option value="custom">Gửi tới một Email tùy chỉnh khác...</option>
                                                        </select>
                                                    </div>
                                                    <input type="email" id="email-custom-address" placeholder="Nhập địa chỉ email..." class="hidden w-full border border-gray-300 p-2.5 text-sm rounded-md focus:ring-2 focus:ring-black outline-none mt-2" oninput="app.admin.saveEmailDraft()">
                                                </div>

                                                <div class="mb-4">
                                                    <label class="block text-xs font-bold text-gray-700 uppercase mb-1">Tiêu đề (Subject) <span class="text-red-500">*</span></label>
                                                    <input type="text" id="email-subject" placeholder="VD: Thông báo cập nhật quy định..." required class="w-full border border-gray-300 p-2.5 text-sm rounded-md focus:ring-2 focus:ring-black outline-none" oninput="app.admin.saveEmailDraft()">
                                                </div>

                                                <div class="mb-4">
                                                    <div class="flex justify-between items-center mb-1">
                                                        <label class="block text-xs font-bold text-gray-700 uppercase">Nội dung (Hỗ trợ Markdown) <span class="text-red-500">*</span></label>
                                                        <button type="button" onclick="app.admin.previewEmailMd()" class="text-[11px] bg-gray-100 border border-gray-300 px-2 py-1 rounded text-gray-700 font-bold hover:bg-gray-200 transition"><i class="fa-brands fa-markdown mr-1"></i> Xem trước</button>
                                                    </div>
                                                    <textarea id="email-content" rows="8" required placeholder="Nhập nội dung email tại đây..." class="w-full border border-gray-300 p-2.5 text-sm rounded-md focus:ring-2 focus:ring-black outline-none font-mono" oninput="app.admin.saveEmailDraft()"></textarea>
                                                    <div id="email-md-preview" class="hidden markdown-body w-full border border-blue-200 bg-blue-50 p-4 mt-2 rounded-md text-sm min-h-[100px]"></div>
                                                </div>

                                                <div class="mb-6 flex items-center gap-2 bg-gray-50 border border-gray-200 p-3 rounded-md">
                                                    <input type="checkbox" id="email-is-anonymous" class="w-4 h-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer" onchange="app.admin.saveEmailDraft()">
                                                    <label for="email-is-anonymous" class="text-sm font-bold text-gray-800 cursor-pointer select-none">Gửi ẩn danh (Người gửi sẽ hiển thị là "Quản trị VNBUSARCHIVE")</label>
                                                </div>

                                                <div class="text-right border-t border-gray-100 pt-4">
                                                    <button type="submit" id="btn-send-email" class="bg-blue-600 text-white px-6 py-2.5 font-bold rounded-md hover:bg-blue-700 transition shadow-sm flex items-center gap-2 ml-auto">
                                                        <i class="fa-solid fa-paper-plane"></i> Gửi Email
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>

                                    <!-- TAB: CÀI ĐẶT HỆ THỐNG (MANAGER) -->
                                    <div id="mgr-sec-settings" class="hidden">
                                        <div class="mb-4 bg-blue-50 border border-blue-200 p-4 rounded-md">
                                            <p class="text-xs text-blue-800 font-medium"><i class="fa-solid fa-circle-info mr-1"></i> <b>Lưu ý:</b> Các công tắc dưới đây ảnh hưởng trực tiếp đến người dùng. Nếu "Hẹn giờ tự động" kết thúc, hệ thống sẽ tự mở lại mà không cần bạn bật thủ công.</p>
                                        </div>
                                        <div id="mgr-settings-content" class="grid grid-cols-1 gap-6">
                                            <p class="text-gray-500 italic"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải cấu hình...</p>
                                        </div>
                                    </div>

                                     <!-- TAB: QUẢN LÝ BAN -->
                                     <div id="mgr-sec-bans" class="hidden">
                                         <div class="flex flex-col gap-3 mb-4">
                                             <div class="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md px-3">
                                                 <i class="fa-solid fa-magnifying-glass text-gray-400"></i>
                                                 <input type="text" id="mgr-ban-search" placeholder="Tìm kiếm Username, UUID..." class="w-full py-2.5 bg-transparent outline-none text-sm" oninput="app.admin.filterManagerData('bans', this.value)">
                                             </div>
                                             <div class="flex flex-wrap gap-2">
                                                 <button id="ban-flt-all" onclick="app.admin.setBanFilter('all')" class="ban-flt-btn font-bold text-xs px-3 py-1.5 bg-black text-white rounded-md transition">Tất cả</button>
                                                 <button id="ban-flt-active" onclick="app.admin.setBanFilter('active')" class="ban-flt-btn font-bold text-xs px-3 py-1.5 bg-white text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition">Hoạt động</button>
                                                 <button id="ban-flt-warning" onclick="app.admin.setBanFilter('warning')" class="ban-flt-btn font-bold text-xs px-3 py-1.5 bg-white text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition">Cần lưu ý</button>
                                                 <button id="ban-flt-banned" onclick="app.admin.setBanFilter('banned')" class="ban-flt-btn font-bold text-xs px-3 py-1.5 bg-white text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition">Bị cấm</button>
                                             </div>
                                         </div>
                                         <div class="overflow-x-auto border border-gray-200 rounded-md">
                                             <table class="w-full text-left text-sm whitespace-nowrap">
                                                 <thead class="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-[11px] tracking-wider">
                                                     <tr>
                                                         <th class="p-3">Người dùng</th>
                                                         <th class="p-3 text-center">Số ảnh</th>
                                                         <th class="p-3">Thời gian</th>
                                                         <th class="p-3">Trạng thái</th>
                                                         <th class="p-3 text-right">Hành động</th>
                                                     </tr>
                                                 </thead>
                                                 <tbody id="mgr-bans-content" class="divide-y divide-gray-200">
                                                     <tr><td colspan="4" class="p-4 text-center text-gray-500"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải...</td></tr>
                                                 </tbody>
                                             </table>
                                         </div>
                                          <div id="mgr-bans-pager" class="mt-6 w-full flex justify-center"></div>
                                     </div>

                                 </div>
                             `;

app.admin.fetchManagerData('denied');
                             app.admin.fetchManagerData('logs');
                             app.admin.fetchManagerData('bans');
                             app.admin.fetchUsersForEmail();
                             let activeSub = app.admin.manager?.activeTab || 'denied';
                             try { activeSub = sessionStorage.getItem('vbs_mgr_active_tab') || activeSub; } catch(e){}
                             app.admin.switchManagerTab(activeSub);
                        }

                    } catch (err) {
                        content.innerHTML = `<p class="p-4 text-red-500 font-bold">Không thể tải dữ liệu: ${err.message}</p>`;
                    }
                },

                // --- PHẦN QUẢN LÝ TAB MANAGER ---
                switchManagerTab: (subTab) => {
                    app.admin.manager.activeTab = subTab;
                    try { sessionStorage.setItem('vbs_mgr_active_tab', subTab); } catch(e){}

                    ['denied', 'logs', 'email', 'settings', 'bans'].forEach(t => {
                        const btn = document.getElementById('mgr-tab-' + t);
                        const sec = document.getElementById('mgr-sec-' + t);
                        if (btn && sec) {
                            if (t === subTab) {
                                btn.className = "font-bold text-sm px-4 py-2 bg-black text-white rounded transition whitespace-nowrap";
                                sec.className = "block";
                            } else {
                                btn.className = "font-bold text-sm px-4 py-2 bg-white text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition whitespace-nowrap";
                                sec.className = "hidden";
                            }
                        }
                    });

                    if (subTab === 'settings') {
                        app.admin.renderManagerSettings();
                    } else if (subTab === 'email') {
                        app.admin.restoreEmailDraft();
                    }
                },

                fetchManagerData: async (type) => {
                    try {
                        if (type === 'denied') {
                            const { data: photos } = await window.sb.from('photos').select('*, profiles(username)').eq('status', 'denied').order('created_at', {ascending: false}).limit(500);
                            const { data: logs } = await window.sb.from('admin_audit_logs').select('target_id, profiles(username)').eq('action_type', 'deny_photo');
                            const denierMap = {};
                            if(logs) logs.forEach(l => { denierMap[l.target_id] = l.profiles?.username || 'Admin'; });
                            app.admin.manager.denied.data = photos ||[];
                            app.admin.manager.denied.denierMap = denierMap;
                            app.admin.filterManagerData('denied', '');
                        }
                        else if (type === 'logs') {
                            const { data: logs } = await window.sb.from('admin_audit_logs').select('*, profiles(username)').order('created_at', {ascending: false}).limit(1000);
                            app.admin.manager.logs.data = logs ||[];
                            app.admin.filterManagerData('logs', '');
                        }
                        else if (type === 'bans') {
                            const { data: { session } } = await window.sb.auth.getSession();
                            const response = await fetch('/api/manager', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ action: 'get_users', token: session.access_token })
                            });
                            const result = await response.json();
                            if (!result.success) throw new Error(result.error);
                            app.admin.manager.bans.data = result.users || [];
                            app.admin.filterManagerData('bans', '', 'all');
                        }
                    } catch (e) { console.error("Lỗi fetch data manager:", e); }
                },

                filterManagerData: (type, query, statusArg) => {
                    const q = (query || '').toLowerCase().trim();
                    const state = app.admin.manager[type];
                    if (!q && (!statusArg || statusArg === 'all') && type !== 'bans') { state.filtered =[...state.data]; }
                    else {
                        if (type === 'denied') {
                            state.filtered = state.data.filter(p => `${p.license_plate} ${p.denial_reason} ${p.profiles?.username}`.toLowerCase().includes(q));
                        } else if (type === 'bans') {
                            const status = statusArg || app.admin.manager.bans.currentFilter || 'all';
                            state.filtered = state.data.filter(u => {
                                const matchText = `${u.username} ${u.id}`.toLowerCase().includes(q);
                                
                                const threeMonthsAgo = new Date();
                                threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
                                const lastSignIn = new Date(u.last_sign_in_at);
                                const isWarning = lastSignIn < threeMonthsAgo;
                                
                                let banInfo = { banned: false };
                                try { banInfo = typeof u.ban_status === 'string' ? JSON.parse(u.ban_status) : (u.ban_status || banInfo); } catch(e){}

                                let matchStatus = true;
                                if (status === 'active') matchStatus = !banInfo.banned && !isWarning;
                                if (status === 'warning') matchStatus = !banInfo.banned && isWarning;
                                if (status === 'banned') matchStatus = banInfo.banned;

                                return matchText && matchStatus;
                            });
                        } else {
                            state.filtered = state.data.filter(l => `${l.action_type} ${l.target_id} ${l.profiles?.username} ${JSON.stringify(l.details)}`.toLowerCase().includes(q));
                        }
                    }
                    state.page = 1;
                    app.admin.renderManagerData(type);
                },

                setBanFilter: (status) => {
                    document.querySelectorAll('.ban-flt-btn').forEach(btn => {
                        btn.className = "ban-flt-btn font-bold text-xs px-3 py-1.5 bg-white text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition";
                    });
                    const activeBtn = document.getElementById('ban-flt-' + status);
                    if (activeBtn) activeBtn.className = "ban-flt-btn font-bold text-xs px-3 py-1.5 bg-black text-white rounded-md transition";
                    
                    app.admin.manager.bans.currentFilter = status;
                    app.admin.filterManagerData('bans', document.getElementById('mgr-ban-search').value, status);
                },

                // --- Hàm Render cho Tab Quản lý Bình luận (Admin) ---
                renderCommentsData: () => {
                    const state = app.admin.commentsData;
                    const perPage = 15;
                    const totalPages = Math.ceil(state.data.length / perPage) || 1;
                    const slice = state.data.slice((state.page - 1) * perPage, state.page * perPage);
                    const contentEl = document.getElementById('adm-comments-content');
                    const pagerElId = 'adm-comments-pager';

                    if (slice.length === 0) {
                        contentEl.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-gray-500 text-sm">Không có bình luận nào trong hệ thống.</td></tr>';
                        document.getElementById(pagerElId).innerHTML = '';
                        return;
                    }

                    contentEl.innerHTML = slice.map(c => `
                        <tr class="hover:bg-gray-50 transition">
                            <td class="p-3 text-[11px] text-gray-500">${new Date(c.created_at).toLocaleString('vi-VN')}</td>
                            <td class="p-3 font-bold text-black text-[12px]">${c.profiles?.username || 'Ẩn danh'}</td>
                            <td class="p-3 text-blue-600 font-black cursor-pointer" onclick="app.views.loadDetail(${c.photo_id})">${c.photos?.license_plate || 'N/A'}</td>
                            <td class="p-3 text-[12px] text-gray-700 whitespace-normal min-w-[200px] break-words">${app.utils.cleanText(c.content)}</td>
                            <td class="p-3 text-center">
                                <button onclick="app.comments.delete('${c.id}')" class="text-red-600 hover:scale-110 transition p-1"><i class="fa-solid fa-trash-can"></i></button>
                            </td>
                        </tr>
                    `).join('');

                    app.utils.renderPagination(pagerElId, state.page, totalPages, (newPage) => {
                        app.admin.commentsData.page = newPage;
                        app.admin.renderCommentsData();
                    });
                },

                renderManagerData: (type) => {
                    const state = app.admin.manager[type];
                    const perPage = 12;
                    const totalPages = Math.ceil(state.filtered.length / perPage) || 1;
                    const slice = state.filtered.slice((state.page - 1) * perPage, state.page * perPage);
                    const contentEl = document.getElementById(`mgr-${type}-content`);
                    const pagerElId = `mgr-${type}-pager`;

                    if (slice.length === 0) {
                        contentEl.innerHTML = `<p class="text-gray-500 col-span-full py-4 text-sm px-4">Không tìm thấy dữ liệu.</p>`;
                        document.getElementById(pagerElId).innerHTML = '';
                        return;
                    }

                    if (type === 'denied') {
                        contentEl.innerHTML = slice.map(p => {
                            const proxyUrl = app.utils.getProxiedUrl(p.url, 'thumb.jpg', 'thumb');
                            const uploader = app.utils.cleanText(p.profiles?.username || 'Ẩn danh');
                            const denier = app.utils.cleanText(state.denierMap[p.id] || 'Admin');
                            const time = new Date(p.created_at).toLocaleDateString('vi-VN');
                            return `<div class="flex gap-4 p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md cursor-pointer transition items-start" onclick="app.views.loadDetail('${p.id}')">
                                <img src="${proxyUrl}" class="w-24 h-24 object-cover rounded bg-gray-100 shrink-0 border border-gray-200">
                                <div class="flex flex-col h-24 justify-between overflow-hidden w-full">
                                    <div><h4 class="font-bold text-sm text-black truncate uppercase">${p.license_plate}</h4><p class="text-xs text-red-600 font-medium line-clamp-2 mt-1"><i class="fa-solid fa-triangle-exclamation mr-1"></i> ${p.denial_reason}</p></div>
                                    <div class="text-[10px] text-gray-500 truncate bg-gray-50 p-1.5 rounded">Đăng: <b class="text-gray-700">${uploader}</b> | Khóa: <b class="text-red-700">${denier}</b> | ${time}</div>
                                </div>
                            </div>`;
                        }).join('');
                    } else if (type === 'bans') {
                        contentEl.innerHTML = slice.map(u => {
                            let banInfo = { banned: false, reason: '' };
                            try { banInfo = typeof u.ban_status === 'string' ? JSON.parse(u.ban_status) : (u.ban_status || banInfo); } catch(e){}
                            
                            const threeMonthsAgo = new Date();
                            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
                            const lastSignIn = new Date(u.last_sign_in_at);
                            const isWarning = lastSignIn < threeMonthsAgo;

                            let statusBadge = '';
                            if (banInfo.banned) {
                                statusBadge = `<span class="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold inline-block"><i class="fa-solid fa-ban"></i> Bị cấm</span>
                                               <div class="text-[10px] text-red-600 mt-1 max-w-[150px] truncate" title="${app.utils.cleanText(banInfo.reason || '')}">${app.utils.cleanText(banInfo.reason || '')}</div>`;
                            } else if (isWarning) {
                                statusBadge = `<span class="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold inline-block" title="Offline quá 3 tháng"><i class="fa-solid fa-triangle-exclamation"></i> Cần lưu ý</span>`;
                            } else {
                                statusBadge = `<span class="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold inline-block"><i class="fa-solid fa-circle-check"></i> Hoạt động</span>`;
                            }

                            const actionBtn = banInfo.banned
                                ? `<button onclick="app.admin.managerUnbanUser('${u.id}')" class="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs hover:bg-gray-50 text-black font-bold shadow-sm transition">Gỡ cấm</button>`
                                : `<button onclick="app.admin.managerBanUser('${u.id}')" class="px-3 py-1.5 bg-red-600 text-white rounded-md text-xs hover:bg-red-700 font-bold shadow-sm transition">Cấm</button>`;
                            
                            const delBtn = `<button onclick="app.admin.managerDeleteUser('${u.id}')" class="px-3 py-1.5 bg-gray-200 text-gray-800 rounded-md text-xs hover:bg-gray-300 font-bold shadow-sm transition ml-1"><i class="fa-solid fa-trash-can"></i> Xóa</button>`;
                            
                            return `<tr class="hover:bg-gray-50 transition border-b border-gray-100">
                                <td class="p-3">
                                    <div class="font-bold text-black text-[12px]">${app.utils.cleanText(u.username || 'Unknown')}</div>
                                    <div class="text-[10px] text-gray-500 font-mono" title="Click để copy UUID" style="cursor:pointer;" onclick="navigator.clipboard.writeText('${u.id}'); app.ui.showAlert('Đã copy UUID: ' + '${u.id}')">${u.id}</div>
                                </td>
                                <td class="p-3 text-center">
                                    <span class="font-bold text-black bg-gray-100 px-2 py-1 rounded-md text-xs">${u.photo_count}</span>
                                </td>
                                <td class="p-3">
                                    <div class="text-[11px] text-gray-700"><i class="fa-solid fa-calendar-plus text-gray-400 w-4"></i> ${new Date(u.created_at).toLocaleDateString('vi-VN')}</div>
                                    <div class="text-[11px] text-gray-700 mt-1" title="Đăng nhập lần cuối lúc ${new Date(u.last_sign_in_at).toLocaleString('vi-VN')}"><i class="fa-solid fa-right-to-bracket text-gray-400 w-4"></i> ${new Date(u.last_sign_in_at).toLocaleDateString('vi-VN')}</div>
                                </td>
                                <td class="p-3">${statusBadge}</td>
                                <td class="p-3 text-right align-middle whitespace-nowrap">${actionBtn}${delBtn}</td>
                            </tr>`;
                        }).join('');
                    } else {
                        contentEl.innerHTML = slice.map(log => {
                            const time = new Date(log.created_at).toLocaleString('vi-VN');
                            return `<tr class="hover:bg-gray-50 transition"><td class="p-3 text-[11px] text-gray-500">${time}</td><td class="p-3 font-bold text-black text-[12px]">${log.profiles?.username || 'Unknown'}</td><td class="p-3">${log.action_type}</td><td class="p-3 text-[10px] font-mono">${log.target_id || '-'}</td><td class="p-3 text-[11px]">${JSON.stringify(log.details)}</td></tr>`;
                        }).join('');
                    }
                    app.utils.renderPagination(pagerElId, state.page, totalPages, (newPage) => {
                        app.admin.manager[type].page = newPage;
                        app.admin.renderManagerData(type);
                    });
                },

                toggleBanSection: (section) => {
                    app.admin.activeBanSection = section;
                    const quickSection = document.getElementById('ban-section-quick');
                    const customSection = document.getElementById('ban-section-custom');
                    const btnQuick = document.getElementById('btn-ban-quick');
                    const btnCustom = document.getElementById('btn-ban-custom');
                    if (section === 'quick') {
                        quickSection.classList.remove('hidden');
                        customSection.classList.add('hidden');
                        btnQuick.className = "w-full bg-black text-white p-3 text-center font-bold text-sm rounded-lg shadow-sm transition border border-black";
                        btnCustom.className = "w-full bg-white text-gray-700 p-3 text-center font-bold text-sm rounded-lg shadow-sm transition border border-gray-300 hover:bg-gray-50 hover:text-black";
                    } else {
                        quickSection.classList.add('hidden');
                        customSection.classList.remove('hidden');
                        btnCustom.className = "w-full bg-black text-white p-3 text-center font-bold text-sm rounded-lg shadow-sm transition border border-black";
                        btnQuick.className = "w-full bg-white text-gray-700 p-3 text-center font-bold text-sm rounded-lg shadow-sm transition border border-gray-300 hover:bg-gray-50 hover:text-black";
                    }
                },

                managerBanUser: (userId) => {
                    if (app.role !== 'manager') return app.ui.showAlert("Chỉ Manager mới có quyền này.");
                    document.getElementById('ban-target-id').value = userId;
                    
                    app.admin.toggleBanSection('quick');
                    document.querySelectorAll('.ban-quick-cb').forEach(cb => cb.checked = false);
                    document.getElementById('ban-custom-input').value = '';
                    
                    const modal = document.getElementById('ban-prompt-modal');
                    modal.classList.remove('hidden');
                    setTimeout(() => {
                        document.getElementById('ban-prompt-content').classList.remove('opacity-0', 'scale-95');
                    }, 10);
                },

                closeBanModal: () => {
                    const content = document.getElementById('ban-prompt-content');
                    content.classList.add('opacity-0', 'scale-95');
                    setTimeout(() => {
                        document.getElementById('ban-prompt-modal').classList.add('hidden');
                    }, 300);
                },

                submitBanUser: async () => {
                    if (app.role !== 'manager') return app.ui.showAlert("Chỉ Manager mới có quyền này.");
                    const userId = document.getElementById('ban-target-id').value;
                    let reason = '';
                    if (app.admin.activeBanSection === 'custom') {
                        reason = document.getElementById('ban-custom-input').value.trim();
                    } else {
                        const selectedChecks = Array.from(document.querySelectorAll('.ban-quick-cb:checked')).map(cb => cb.value);
                        reason = selectedChecks.join(' + ');
                    }
                    
                    if (!reason) return app.ui.showAlert("Vui lòng chọn hoặc nhập lý do cấm!");
                    
                    document.getElementById('btn-submit-ban').innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Đang xử lý...';
                    document.getElementById('btn-submit-ban').disabled = true;

                    try {
                        const { data: { session } } = await window.sb.auth.getSession();
                        const response = await fetch('/api/manager', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'ban', targetUserId: userId, reason: reason, token: session.access_token })
                        });
                        const data = await response.json();
                        if (data.success) {
                            app.admin.closeBanModal();
                            app.admin.fetchManagerData('bans');
                        } else throw new Error(data.error);
                    } catch (e) { 
                        app.ui.showAlert("Lỗi: " + e.message); 
                    } finally {
                        document.getElementById('btn-submit-ban').innerHTML = 'Xác nhận cấm';
                        document.getElementById('btn-submit-ban').disabled = false;
                    }
                },

                managerUnbanUser: async (userId) => {
                    if (app.role !== 'manager') return app.ui.showAlert("Chỉ Manager mới có quyền này.");
                    
                    app.ui.showAlert("Bạn có chắc muốn gỡ cấm tài khoản này không?", async () => {
                        try {
                            const { data: { session } } = await window.sb.auth.getSession();
                            const response = await fetch('/api/manager', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ action: 'unban', targetUserId: userId, token: session.access_token })
                            });
                            const data = await response.json();
                            if (data.success) {
                                app.ui.showAlert(data.message, null, null, { title: "Thành công", hideButtons: false });
                                app.admin.fetchManagerData('bans');
                            } else throw new Error(data.error);
                        } catch (e) { app.ui.showAlert("Lỗi: " + e.message, null, null, { title: "Lỗi" }); }
                    }, () => {}, {
                        title: "Xác nhận gỡ cấm",
                        btnOkText: "Gỡ cấm",
                        btnCancelText: "Hủy"
                    });
                },

                managerDeleteUser: async (userId) => {
                    if (app.role !== 'manager') return app.ui.showAlert("Chỉ Manager mới có quyền này.");
                    
                    app.ui.showAlert("LƯU Ý: Hành động này sẽ XÓA VĨNH VIỄN tài khoản người dùng và không thể khôi phục. Bạn có chắc chắn muốn xóa không?", async () => {
                        try {
                            const { data: { session } } = await window.sb.auth.getSession();
                            const response = await fetch('/api/manager', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ action: 'delete_user', targetUserId: userId, token: session.access_token })
                            });
                            const data = await response.json();
                            if (data.success) {
                                app.ui.showAlert(data.message, null, null, { title: "Đã xóa", hideButtons: false });
                                app.admin.fetchManagerData('bans');
                            } else throw new Error(data.error);
                        } catch (e) { app.ui.showAlert("Lỗi: " + e.message, null, null, { title: "Lỗi" }); }
                    }, () => {}, {
                        title: "Xác nhận xóa tài khoản",
                        btnOkText: "Xóa tài khoản",
                        btnCancelText: "Hủy",
                        countdown: true
                    });
                },

                // --- CÁC HÀM MỚI CHO TÍNH NĂNG GỬI EMAIL ---
                fetchUsersForEmail: async () => {
                    try {
                        const { data: users } = await window.sb.from('profiles').select('id, username').order('username');
                        const select = document.getElementById('email-target-user');
                        if (users && select) {
                            users.forEach(u => {
                                const opt = document.createElement('option');
                                opt.value = u.id;
                                opt.innerText = u.username;
                                select.appendChild(opt);
                            });
                            if (app.admin.manager?.activeTab === 'email') {
                                app.admin.restoreEmailDraft();
                            }
                        }
                    } catch (e) { console.error("Lỗi lấy danh sách user:", e); }
                },

                toggleEmailCustom: () => {
                    const select = document.getElementById('email-target-user');
                    const customInput = document.getElementById('email-custom-address');
                    if (select.value === 'custom') {
                        customInput.classList.remove('hidden');
                        customInput.required = true;
                    } else {
                        customInput.classList.add('hidden');
                        customInput.required = false;
                        customInput.value = '';
                    }
                },

                formatEmailMarkdown: (text) => {
                    if (!text) return '';
                    let processed = text;
                    processed = processed.replace(/(^[ \t]*(?:[-*+]|\d+\.)[ \t]+.*)\n([ \t]*[^-*+\d\s])/gm, '$1\n\n$2');
                    processed = processed.replace(/\n(\s*\n)+/g, (match) => {
                        const count = (match.match(/\n/g) || []).length;
                        if (count <= 2) return '\n\n';
                        const extraBreaks = '<br>'.repeat(count - 2);
                        return `\n\n${extraBreaks}\n\n`;
                    });
                    return marked.parse(processed, { breaks: true, gfm: true });
                },

                previewEmailMd: () => {
                    const content = document.getElementById('email-content').value;
                    const previewBox = document.getElementById('email-md-preview');
                    if (previewBox.classList.contains('hidden')) {
                        previewBox.classList.remove('hidden');
                        previewBox.innerHTML = DOMPurify.sanitize(app.admin.formatEmailMarkdown(content || '*Chưa có nội dung*'));
                    } else {
                        previewBox.classList.add('hidden');
                    }
                },

                submitEmail: async (e) => {
                    e.preventDefault();
                    if (app.role !== 'manager') return app.ui.showAlert("Chỉ Manager mới có thể sử dụng chức năng này.");

                    const selectVal = document.getElementById('email-target-user').value;
                    const customEmail = document.getElementById('email-custom-address').value.trim();
                    const subject = document.getElementById('email-subject').value.trim();
                    const content = document.getElementById('email-content').value.trim();
                    const isAnonymous = document.getElementById('email-is-anonymous').checked;

                    if (!selectVal) return app.ui.showAlert("Vui lòng chọn người nhận!");
                    if (selectVal === 'custom' && !customEmail) return app.ui.showAlert("Vui lòng nhập Email tùy chỉnh!");
                    if (!subject || !content) return app.ui.showAlert("Vui lòng nhập Tiêu đề và Nội dung!");

                    const btn = document.getElementById('btn-send-email');
                    const origHTML = btn.innerHTML;
                    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang gửi...';
                    btn.disabled = true;

                    try {
                        const { data: { session } } = await window.sb.auth.getSession();

                        const payload = {
                            action: 'email',
                            targetUserId: selectVal !== 'custom' ? selectVal : null,
                            customEmail: selectVal === 'custom' ? customEmail : null,
                            subject: subject,
                            markdownContent: content,
                            isAnonymous: isAnonymous
                        };

                        const res = await fetch('/api/notify', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${session?.access_token}`
                            },
                            body: JSON.stringify(payload)
                        });

                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error || 'Lỗi không xác định từ Server');

                        app.ui.showAlert("Đã gửi Email thành công!");
                        document.getElementById('admin-email-form').reset();
                        document.getElementById('email-md-preview').classList.add('hidden');
                        app.admin.toggleEmailCustom();
                        app.admin.clearEmailDraft();
                        app.admin.logAction('send_email', selectVal === 'custom' ? customEmail : selectVal, { subject: subject, isAnonymous: isAnonymous });

                    } catch (err) {
                        app.ui.showAlert("Gửi Email thất bại: " + err.message);
                    } finally {
                        btn.innerHTML = origHTML;
                        btn.disabled = false;
                    }
                },

                // --- ĐÂY LÀ 2 HÀM BẠN ĐANG THIẾU DẪN ĐẾN LỖI ---
                renderManagerSettings: async () => {
                    const container = document.getElementById('mgr-settings-content');
                    container.innerHTML = '<p class="text-gray-500 italic"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải dữ liệu...</p>';
                    await app.maintenance.fetch();

                    const configs =[
                        { id: 'global', title: 'Cầu chì Tổng (Toàn hệ thống)', icon: 'fa-globe', color: 'red' },
                        { id: 'auth', title: 'Hệ thống Đăng nhập / Đăng ký', icon: 'fa-user-lock', color: 'blue' },
                        { id: 'upload', title: 'Hệ thống Upload Ảnh', icon: 'fa-cloud-arrow-up', color: 'green' }
                    ];

                    let html = '';
                    configs.forEach(cfg => {
                        const data = app.maintenance.settings[cfg.id] || { is_active: true, reason: '', auto_reactivate_at: null };
                        const hasTime = !!data.auto_reactivate_at;
                        let timeVal = '';
                        if (hasTime) {
                            const d = new Date(data.auto_reactivate_at);
                            const tzOffset = d.getTimezoneOffset() * 60000;
                            timeVal = (new Date(d.getTime() - tzOffset)).toISOString().slice(0, 16);
                        }

                        html += `<div class="border border-gray-200 rounded-lg p-5 bg-white mb-4">
                            <div class="flex justify-between items-center mb-4">
                                <h3 class="font-bold text-${cfg.color}-600 uppercase text-sm"><i class="fa-solid ${cfg.icon} mr-2"></i>${cfg.title}</h3>
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" id="mt-active-${cfg.id}" class="sr-only peer" ${data.is_active ? 'checked' : ''}>
                                    <div class="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-${cfg.color}-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                                </label>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label class="text-xs text-gray-500 font-bold block mb-1">Lý do bảo trì</label><input type="text" id="mt-reason-${cfg.id}" value="${app.utils.escapeAttr(data.reason)}" class="w-full border p-2.5 text-sm rounded"></div>
                                <div>
                                    <label class="text-xs text-gray-500 font-bold flex justify-between mb-1"><span>Hẹn giờ tự mở lại</span> <input type="checkbox" id="mt-has-time-${cfg.id}" ${hasTime ? 'checked' : ''} onchange="document.getElementById('mt-time-${cfg.id}').disabled = !this.checked"></label>
                                    <input type="datetime-local" id="mt-time-${cfg.id}" value="${timeVal}" ${!hasTime ? 'disabled' : ''} class="w-full border p-2.5 text-sm rounded disabled:bg-gray-100">
                                </div>
                            </div>
                            <div class="mt-4 text-right"><button onclick="app.admin.saveManagerSetting('${cfg.id}', this)" class="bg-black text-white px-5 py-2 text-xs font-bold rounded shadow-sm">Lưu thiết lập</button></div>
                        </div>`;
                     });

                    const quotaData = app.maintenance.settings['upload_quota'] || { reason: '' };

                    html += `
                    <div class="border border-blue-200 rounded-lg p-5 bg-blue-50/50 mt-6 relative shadow-sm">
                        <div class="flex items-center gap-2 mb-3">
                            <i class="fa-solid fa-cloud-arrow-up text-blue-600 text-lg"></i>
                            <h3 class="font-bold text-blue-800 uppercase text-sm">Giới hạn Upload hàng ngày (Quota)</h3>
                        </div>
                        <p class="text-xs text-blue-700 mb-4 leading-relaxed">Giới hạn TỔNG số lượng ảnh <b>toàn hệ thống</b> được phép tiếp nhận trong vòng 24h. Tự động làm mới vào <b>7:00 Sáng giờ Việt Nam</b>.</p>

                        <div class="flex items-end gap-3">
                            <div class="flex-1">
                                <label class="text-xs font-bold text-blue-900 block mb-1">Số lượng ảnh (Để trống = Không giới hạn, 0 = Tạm dừng nhận)</label>
                                <input type="number" min="0" id="mt-quota-value" value="${quotaData.reason}" placeholder="Trống = Không giới hạn" class="w-full border border-blue-300 p-2.5 text-sm rounded outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                            </div>
                            <button onclick="app.admin.saveQuotaSetting(this)" class="bg-blue-600 text-white px-6 py-2.5 text-xs font-bold rounded hover:bg-blue-700 transition shadow-sm h-[42px] whitespace-nowrap"><i class="fa-solid fa-floppy-disk mr-1"></i> Lưu cấu hình</button>
                        </div>
                    </div>
                    `;

                    container.innerHTML = html;
                },

                saveManagerSetting: async (sysId, btn) => {
                    const originalHTML = btn.innerHTML;
                    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; btn.disabled = true;
                    const isActive = document.getElementById(`mt-active-${sysId}`).checked;
                    const reason = document.getElementById(`mt-reason-${sysId}`).value.trim();
                    const hasTime = document.getElementById(`mt-has-time-${sysId}`).checked;
                    const timeVal = document.getElementById(`mt-time-${sysId}`).value;
                    let autoReactivate = (isActive || !hasTime) ? null : new Date(timeVal).toISOString();

                    try {
                        const { error } = await window.sb.from('system_settings').update({
                            is_active: isActive, reason: reason, auto_reactivate_at: autoReactivate, updated_by: app.user.id
                        }).eq('id', sysId);
                        if (error) throw error;
                        await app.maintenance.fetch();
                        app.ui.showAlert(`Đã lưu thiết lập cho ${sysId.toUpperCase()}`);
                    } catch (e) { app.ui.showAlert("Lỗi: " + e.message); }
                    finally { btn.innerHTML = originalHTML; btn.disabled = false; }
                },
                saveQuotaSetting: async (btn) => {
                    if (app.role !== 'manager') return;

                    const originalHTML = btn.innerHTML;
                    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';
                    btn.disabled = true;

                    const val = document.getElementById('mt-quota-value').value.trim();

                    try {
                        const { error } = await window.sb.from('system_settings').update({
                            reason: val,
                            updated_by: app.user.id,
                            updated_at: new Date().toISOString()
                        }).eq('id', 'upload_quota');

                        if (error) throw error;

                        await app.maintenance.fetch();
                        app.admin.logAction('update_upload_quota', 'upload_quota', { new_limit: val || 'Không giới hạn' });
                        app.ui.showAlert(`Đã cập nhật Giới hạn Upload thành: ${val === '' ? 'Không giới hạn' : val + ' ảnh/ngày'}!`);

                    } catch (e) {
                        app.ui.showAlert("Lỗi: " + e.message);
                    } finally {
                        btn.innerHTML = originalHTML;
                        btn.disabled = false;
                    }
                },
                // ------------------------------------------

                approvePhoto: async (id, uploaderId, btn) => {
                    if (app.user.id === uploaderId && app.role !== 'manager') {
                        return app.ui.showAlert("Bạn không thể tự duyệt ảnh của mình!");
                    }
                    btn.innerText = "Đang xử lý..."; btn.disabled = true; btn.classList.add('btn-loading');
                    try {
                        const plate = document.getElementById(`adm-p-plate-${id}`).value.trim();
                        const op = document.getElementById(`adm-p-op-${id}`).value.trim();
                        const type = document.getElementById(`adm-p-type-${id}`).value;
                        const route = document.getElementById(`adm-p-route-${id}`).value.trim();
                        const model = document.getElementById(`adm-p-model-${id}`).value.trim();
                        const location = document.getElementById(`adm-p-location-${id}`).value.trim();
                        const note = document.getElementById(`adm-p-note-${id}`).value.trim();

                        const res = await fetch('/api/admin/action', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${(await window.sb.auth.getSession()).data.session?.access_token}`
                            },
                            body: JSON.stringify({
                                action: 'approve', photoId: id,
                                plate, op, type, route, model, location, note
                            })
                        });

                        if (!res.ok) throw new Error((await res.json()).error || 'Lỗi server');

                        app.admin.loadTab('photos');
                    } catch (err) {
                        app.ui.showAlert("Lỗi: " + err.message);
                    } finally {
                        btn.innerText = "DUYỆT"; btn.disabled = false; btn.classList.remove('btn-loading');
                    }
                },
                denyPhoto: async (id, uploaderId, btn) => {
                    if (app.role !== 'manager' && app.role !== 'admin') {
                        return app.ui.showAlert("Chỉ Admin/Manager mới có quyền từ chối ảnh!");
                    }
                    if (app.user.id === uploaderId && app.role !== 'manager') {
                        return app.ui.showAlert("Bạn không thể tự từ chối ảnh của chính mình!");
                    }
                    app.ui.showDenyPrompt("Từ chối ảnh", (reason) => {
                        if (!reason.trim()) {
                            app.ui.showAlert("Bắt buộc phải nhập lý do!");
                            return;
                        }

                        btn.innerText = "Đang xử lý..."; btn.disabled = true; btn.classList.add('btn-loading');
                        (async () => {
                            try {
                                const plate = document.getElementById(`adm-p-plate-${id}`).value.trim();
                                
                                const res = await fetch('/api/admin/action', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${(await window.sb.auth.getSession()).data.session?.access_token}`
                                    },
                                    body: JSON.stringify({
                                        action: 'deny', photoId: id, reason, plate
                                    })
                                });

                                if (!res.ok) throw new Error((await res.json()).error || 'Lỗi server');

                                app.admin.loadTab('photos');
                            } catch (err) {
                                app.ui.showAlert("Lỗi: " + err.message);
                            } finally {
                                btn.innerText = "TỪ CHỐI"; btn.disabled = false; btn.classList.remove('btn-loading');
                            }
                        })();
                    });
                },
                approveReq: async (id, btn, reqType = 'info') => {
                    btn.innerText = "Đang xử lý..."; btn.disabled = true; btn.classList.add('btn-loading');
                    try {
                        const { data: req } = await window.sb.from('edit_requests').select('*').eq('id', id).single();

                        if (reqType === 'info') {
                            const plate = document.getElementById(`req-plate-${id}`).value;
                            const op = document.getElementById(`req-op-${id}`).value;
                            const type = document.getElementById(`req-type-${id}`).value;
                            const route = document.getElementById(`req-route-${id}`).value;
                            const model = document.getElementById(`req-model-${id}`).value;
                            const loc = document.getElementById(`req-loc-${id}`).value;
                            const note = document.getElementById(`req-note-${id}`).value;


                            const { error: vError } = await window.sb.from('vehicles').upsert({
                                license_plate: plate, model: model
                            }, { onConflict: 'license_plate' });
                            if (vError) throw vError;

                            if (req.new_data.photo_id) {
                                const { data: oldP } = await window.sb.from('photos').select('operator, route_no, taken_at').eq('id', req.new_data.photo_id).single();

                                const { error: pError } = await window.sb.from('photos').update({
                                    license_plate: plate,
                                    note: note,
                                    location: loc,
                                    operator: op,
                                    type: type,
                                    route_no: route
                                }).eq('id', req.new_data.photo_id);
                                if (pError) throw pError;

                                if (oldP && oldP.taken_at) {
                                    await app.vehicle.syncHistoryOnPhotoEdit(
                                        plate,
                                        oldP.taken_at,
                                        { operator: oldP.operator, route_no: oldP.route_no },
                                        { operator: op, route_no: route }
                                    );
                                }
                            }

                            if (req.license_plate !== plate) {
                                await app.vehicle.cleanupVehicle(req.license_plate);
                            }
                        }

                        else if (reqType === 'vehicle_details' || req.new_data.request_type === 'update_vehicle_details') {
                            const inputModel = document.getElementById(`req-v-model-${id}`);
                            const inputNote = document.getElementById(`req-v-note-${id}`);

                            const finalModel = inputModel ? inputModel.value : req.new_data.model;
                            const finalNote = inputNote ? inputNote.value : req.new_data.note;

                            const { error } = await window.sb.from('vehicles')
                                .update({ model: finalModel, note: finalNote })
                                .eq('license_plate', req.license_plate);
                            if (error) throw error;
                        }

                        else if (reqType === 'operator_info' || req.new_data.request_type === 'update_operator_info') {
                            const logo = document.getElementById(`req-op-logo-${id}`).value.trim();
                            const desc = document.getElementById(`req-op-desc-${id}`).value.trim();
                            
                            if (!logo && !desc) {
                                const { error } = await window.sb.from('operator_info').delete().eq('operator_name', req.new_data.operator_name);
                                if (error) throw error;
                            } else {
                                const { error } = await window.sb.from('operator_info').upsert({
                                    operator_name: req.new_data.operator_name,
                                    logo_url: logo || null,
                                    description: desc || null
                                });
                                if (error) throw error;
                            }
                        }

                        else if (reqType === 'model_info' || req.new_data.request_type === 'update_model_info') {
                            const logo = document.getElementById(`req-mdl-logo-${id}`).value.trim();
                            const desc = document.getElementById(`req-mdl-desc-${id}`).value.trim();
                            const brandName = req.new_data.model_name.split(' ')[0];
                            
                            if (!logo && !desc) {
                                const { error: delErr } = await window.sb.from('model_info').delete().eq('model_name', req.new_data.model_name);
                                if (delErr) throw delErr;
                            } else {
                                // 1. Lưu thông tin cho dòng xe cụ thể
                                const { error: upsertErr } = await window.sb.from('model_info').upsert({
                                    model_name: req.new_data.model_name,
                                    logo_url: logo || null,
                                    description: desc || null
                                });
                                if (upsertErr) throw upsertErr;
                            }

                            // 2. Tự động đồng bộ Logo cho toàn bộ hãng
                            await window.sb.from('model_info')
                                .update({ logo_url: logo || null })
                                .ilike('model_name', `${brandName}%`);
                        }

                        else {

                            const d = req.new_data;
                            await window.sb.from('vehicle_history').delete().eq('license_plate', req.license_plate);
                            if (d.history_items && d.history_items.length > 0) {
                                const newItems = d.history_items.map((item, index) => ({
                                    license_plate: req.license_plate,
                                    operator: item.operator,
                                    route: item.route,
                                    note: item.note,
                                    effective_date: item.effective_date || null,
                                    display_order: index
                                }));
                                await window.sb.from('vehicle_history').insert(newItems);
                            }
                        }
                        await window.sb.from('edit_requests').update({ status: 'approved' }).eq('id', id);
                        app.admin.logAction('approve_edit_req', id, { req_type: reqType, plate: req.license_plate });
                        app.admin.loadTab('requests');
                    } catch (err) { app.ui.showAlert("Lỗi: " + err.message); } finally { btn.innerText = "DUYỆT"; btn.disabled = false; btn.classList.remove('btn-loading'); }
                },
                directDeleteInput: async (btn) => {
                    if (app.role !== 'manager') return app.ui.showAlert("Chỉ Manager mới có quyền sử dụng tính năng này!");
                    const input = document.getElementById('adm-direct-delete-id').value.trim();
                    const reason = document.getElementById('adm-direct-delete-reason').value.trim();

                    if (!input || !reason) return app.ui.showAlert("Vui lòng nhập đủ ID (hoặc Link) ảnh và Lý do xóa!");

                    let photoId = input;
                    if (input.includes('/photo/')) {
                        try { photoId = input.split('/photo/')[1].split('?')[0].split('/')[0]; }
                        catch (e) { return app.ui.showAlert("Link không hợp lệ!"); }
                    }

                    const originalText = btn.innerText;
                    btn.innerText = "Đang xóa..."; btn.disabled = true;

                    try {
                        const { data: p, error: errFetch } = await window.sb.from('photos').select('id, uploader_id, license_plate').eq('id', photoId).single();
                        if (errFetch || !p) return app.ui.showAlert("Không tìm thấy ảnh với ID này trong hệ thống!");

                        await window.sb.from('photos').update({ status: 'denied', denial_reason: reason }).eq('id', p.id);
                        await app.vehicle.cleanupVehicle(p.license_plate);
                        app.admin.logAction('direct_delete', photoId, { plate: p.license_plate, reason: reason });

                        app.toast.show('success', 'Thành công', 'Đã xóa ảnh thành công!');
                        document.getElementById('adm-direct-delete-id').value = '';
                        document.getElementById('adm-direct-delete-reason').value = '';
                    } catch (e) { app.ui.showAlert("Lỗi: " + e.message); }
                    finally { btn.innerText = originalText; btn.disabled = false; }
                },

                approveDeleteReq: async (reqId, photoId, requesterId, userReason, btn) => {
                    if (app.role !== 'manager') {
                        return app.ui.showAlert("Chỉ Manager mới có quyền duyệt lệnh xóa ảnh khỏi hệ thống!");
                    }
                    btn.innerText = "Đang xử lý...";
                    btn.disabled = true;
                    btn.classList.add('btn-loading');

                    try {
                        // CẬP NHẬT TRUY VẤN: Lấy thêm cột 'url' để truyền qua API
                        const { data: photo } = await window.sb.from('photos').select('license_plate, url').eq('id', photoId).single();
                        const plate = photo ? photo.license_plate : 'đã chọn';
                        const imgUrl = photo ? photo.url : null;

                        // 1. Gọi API Xóa ảnh khỏi ImageKit
                        if (imgUrl) {
                            const { data: { session } } = await window.sb.auth.getSession();
                            await fetch('/api/delete-image', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${session?.access_token}`
                                },
                                body: JSON.stringify({ imageUrl: imgUrl })
                            });
                        }

                        // 2. Xóa dữ liệu Database
                        const { error: delError } = await window.sb.from('photos').delete().eq('id', photoId);
                        if (delError) throw delError;

                        await app.vehicle.cleanupVehicle(plate);
                        await window.sb.from('edit_requests').update({ status: 'approved' }).eq('id', reqId);

                        app.toast.show('success', 'Thành công', 'Đã duyệt yêu cầu và xóa ảnh vĩnh viễn thành công!');
                        app.admin.logAction('approve_delete_req', photoId, { plate: plate });
                        app.admin.loadTab('delete');

                    } catch (err) {
                        app.ui.showAlert("Lỗi khi duyệt xóa: " + err.message);
                        btn.innerText = "DUYỆT XÓA";
                        btn.disabled = false;
                        btn.classList.remove('btn-loading');
                    }
                },
                denyReq: async (reqId, btn) => {
                    app.ui.showPrompt("Nhập lý do từ chối yêu cầu này (Tùy chọn):", "", async (reason) => {
                        btn.innerText = "Đang xử lý..."; btn.disabled = true; btn.classList.add('btn-loading');
                        try {
                            const { data: req } = await window.sb.from('edit_requests').select('requester_id, license_plate, new_data').eq('id', reqId).single();
                            await window.sb.from('edit_requests').update({ status: 'denied' }).eq('id', reqId);

                            let actionName = req.new_data.request_type === 'delete_photo' ? 'xóa ảnh' : 'chỉnh sửa';
                            let reasonMsg = reason ? ` Lý do: ${reason}` : '';


                            if (req.new_data.request_type === 'delete_photo') app.admin.loadTab('delete');
                            else app.admin.loadTab('requests');
                        } catch (err) {
                            app.ui.showAlert("Lỗi: " + err.message);
                            btn.innerText = "TỪ CHỐI"; btn.disabled = false; btn.classList.remove('btn-loading');
                        }
                    });
                }
            }
});

Object.assign(window.app, {
  achievement: {
                open: async () => {
                    const modal = document.getElementById('achievement-modal');
                    const content = document.getElementById('achievement-content');

                    document.getElementById('my-top-route').innerHTML = '<i class="fa-solid fa-spinner fa-spin text-sm text-gray-400"></i>';
                    document.getElementById('my-top-plate').innerHTML = '<i class="fa-solid fa-spinner fa-spin text-sm text-gray-400"></i>';
                    document.getElementById('my-top-model').innerHTML = '<i class="fa-solid fa-spinner fa-spin text-sm text-gray-400"></i>';

                    modal.classList.remove('hidden');
                    app.ui.lockScroll();
                    setTimeout(() => {
                        content.classList.remove('opacity-0', 'scale-95');
                        content.classList.add('opacity-100', 'scale-100');
                    }, 10);

                    try {
                        const { data: photos, error } = await window.sb.from('photos')
                            .select('route_no, license_plate, vehicles(model)')
                            .eq('uploader_id', app.currentProfileId || app.user.id)
                            .eq('status', 'approved');

                        if (error) throw error;

                        const routeFreq = {}; const plateFreq = {}; const modelFreq = {};
                        (photos || []).forEach(p => {
                            const r = p.route_no;
                            const pl = p.license_plate;
                            const m = p.vehicles ? p.vehicles.model : null;

                            if (r && r !== '---' && r !== 'N/A') routeFreq[r] = (routeFreq[r] || 0) + 1;
                            if (pl) plateFreq[pl] = (plateFreq[pl] || 0) + 1;
                            if (m && m !== '---' && m !== 'N/A') modelFreq[m] = (modelFreq[m] || 0) + 1;
                        });

                        const getTop = (obj) => {
                            const entries = Object.entries(obj);
                            if (entries.length === 0) return '---';
                            return entries.sort((a, b) => b[1] - a[1])[0][0];
                        };

                        const topRoute = getTop(routeFreq);
                        const topPlateRaw = getTop(plateFreq);
                        const topModel = getTop(modelFreq);

                        document.getElementById('my-top-route').innerText = topRoute;
                        document.getElementById('my-top-plate').innerText = topPlateRaw !== '---' ? app.utils.displayPlate(topPlateRaw) : '---';
                        document.getElementById('my-top-model').innerText = topModel;
                    } catch (e) {
                        console.error("Lỗi tải Thống kê chi tiết:", e);
                        document.getElementById('my-top-route').innerText = 'Lỗi dữ liệu';
                        document.getElementById('my-top-plate').innerText = 'Lỗi dữ liệu';
                        document.getElementById('my-top-model').innerText = 'Lỗi dữ liệu';
                    }
                },
                close: () => {
                    const modal = document.getElementById('achievement-modal');
                    const content = document.getElementById('achievement-content');
                    content.classList.remove('opacity-100', 'scale-100');
                    content.classList.add('opacity-0', 'scale-95');
                    setTimeout(() => {
                        modal.classList.add('hidden');
                        app.ui.unlockScroll();
                    }, 200);
                }
            }
});
