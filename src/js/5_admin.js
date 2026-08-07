window.app = window.app || {};

Object.assign(window.app, {
  admin: {
                adminInterval: null,
                commentsData: { data: [], page: 1 },
                is3x3Enabled: localStorage.getItem('vbs_admin_grid_3x3') === 'true',
                isRulerEnabled: localStorage.getItem('vbs_admin_ruler_horiz') === 'true',
                isHideMineEnabled: localStorage.getItem('vbs_admin_hide_mine') === 'true',

                toggle3x3Grid: () => {
                    app.admin.is3x3Enabled = !app.admin.is3x3Enabled;
                    localStorage.setItem('vbs_admin_grid_3x3', app.admin.is3x3Enabled ? 'true' : 'false');
                    app.admin.update3x3UI();
                },

                toggleRuler: () => {
                    app.admin.isRulerEnabled = !app.admin.isRulerEnabled;
                    localStorage.setItem('vbs_admin_ruler_horiz', app.admin.isRulerEnabled ? 'true' : 'false');
                    app.admin.updateRulerUI();
                },

                toggleHideMine: () => {
                    app.admin.isHideMineEnabled = !app.admin.isHideMineEnabled;
                    localStorage.setItem('vbs_admin_hide_mine', app.admin.isHideMineEnabled ? 'true' : 'false');
                    app.admin.updateHideMineUI();
                    app.admin.checkNotification();
                },

                renderSinglePhotoCardHTML: (p, approvedPlateSet = app.admin?.approvedPlateSet || new Set(), approvedOpSet = app.admin?.approvedOpSet || new Set(), approvedRouteSet = app.admin?.approvedRouteSet || new Set(), approvedModelSet = app.admin?.approvedModelSet || new Set()) => {
                    const op = app.utils.cleanText(p.operator || '');
                    const type = p.type || 'bus';
                    const route = app.utils.cleanText(p.route_no || '');
                    const model = app.utils.cleanText(p.vehicles?.model || '');
                    const location = app.utils.cleanText(p.location);
                    const prov = app.utils.cleanText(p.province || '');
                    const note = app.utils.cleanText(p.note);
                    const safeUsername = app.utils.cleanText(p.profiles?.username || 'Ẩn danh');
                    const safePlate = app.utils.cleanText(p.license_plate);
                    if (!app.admin.originalData) app.admin.originalData = {};
                    app.admin.originalData['photo_' + p.id] = { plate: safePlate, operator: op, type: type, route: route, model: model };

                    const tagNew = '<span class="bg-black text-white px-1.5 py-0.5 rounded text-[9px] font-bold ml-1 tracking-wider">MỚI</span>';
                    const opKey = app.utils.cleanText(op || '').trim().toLowerCase();
                    const rawRouteKey = app.utils.cleanText(route || '').trim().toLowerCase();
                    const strippedRouteKey = rawRouteKey.replace(/^tuyến\s+/i, '').trim();
                    const numRouteKey = /^\d+$/.test(strippedRouteKey) ? String(parseInt(strippedRouteKey, 10)) : strippedRouteKey;
                    const paddedRouteKey = /^\d+$/.test(strippedRouteKey) ? strippedRouteKey.padStart(2, '0') : strippedRouteKey;
                    const modelKey = app.utils.cleanText(model || '').trim().toLowerCase();
                    const plateKey = (safePlate || '').trim().toUpperCase();

                    const isNewOp = opKey && opKey !== '---' && opKey !== 'đang cập nhật' && opKey !== 'không rõ' && !approvedOpSet.has(opKey);
                    const isNewRoute = route && rawRouteKey !== '---' && rawRouteKey !== 'đang cập nhật' && rawRouteKey !== 'không rõ' && 
                        !approvedRouteSet.has(rawRouteKey) && 
                        !approvedRouteSet.has(strippedRouteKey) && 
                        !approvedRouteSet.has('tuyến ' + strippedRouteKey) && 
                        !approvedRouteSet.has(numRouteKey) && 
                        !approvedRouteSet.has(paddedRouteKey);
                    const isNewModel = modelKey && modelKey !== '---' && modelKey !== 'đang cập nhật' && !approvedModelSet.has(modelKey);

                    const isOwnPhoto = Boolean(app.user && (p.uploader_id === app.user.id || p.user_id === app.user.id));
                    const hideClass = (app.admin.isHideMineEnabled && isOwnPhoto) ? 'hidden' : '';

                    let reviewTabHtml = '';
                    if (p.photo_reviews && p.photo_reviews.length > 0) {
                        const approves = p.photo_reviews.filter(r => r.action === 'approve').length;
                        const denies = p.photo_reviews.filter(r => r.action === 'deny').length;
                        const denyReasons = p.photo_reviews.filter(r => r.action === 'deny' && r.reason).map(r => r.reason).join(' | ');
                        
                        let colorClass = 'bg-blue-600 border-blue-700 text-white';
                        if (approves > 0 && denies === 0) colorClass = 'bg-green-600 border-green-700 text-white';
                        else if (denies > 0 && approves === 0) colorClass = 'bg-red-600 border-red-700 text-white';
                        else if (approves > 0 && denies > 0) colorClass = 'bg-yellow-500 border-yellow-600 text-yellow-900';

                        let textParts = [];
                        if (approves > 0) textParts.push(`${approves} đồng ý`);
                        if (denies > 0) textParts.push(`${denies} từ chối`);
                        
                        let mainText = textParts.join(' + ');
                        if (denyReasons) mainText += `: (${denyReasons})`;
                        
                        reviewTabHtml = `<div class="w-full max-w-full ${colorClass} text-[11px] font-bold px-4 pt-2.5 pb-[18px] rounded-t-md border border-b-0 shadow-sm leading-relaxed -mb-3"><i class="fa-solid fa-users mr-1"></i>${mainText}</div>`;
                    } else if (p.reviewer_count > 0) {
                        reviewTabHtml = `<div class="w-full max-w-full bg-blue-600 border-blue-700 text-white text-[11px] font-bold px-4 pt-2.5 pb-[18px] rounded-t-md border border-b-0 shadow-sm leading-relaxed -mb-3"><i class="fa-solid fa-users mr-1"></i>Đã có ${p.reviewer_count} người lựa chọn</div>`;
                    }

                    return `
                                <div id="adm-photo-card-${p.id}" class="admin-card relative overflow-visible mt-8 ${hideClass}" data-photo-id="${p.id}" data-privileged="${(p.profiles?.role === 'admin' || p.profiles?.role === 'manager') ? 'true' : 'false'}" data-is-own="${isOwnPhoto ? 'true' : 'false'}">
                                    ${reviewTabHtml}
                                    <div class="admin-card-header relative z-10 bg-white rounded-t-lg">
                                        <div class="flex items-center gap-2">
                                            <span class="font-bold text-sm">${safePlate}</span>
                                            ${plateKey && plateKey !== '---' && !approvedPlateSet.has(plateKey) ? '<span class="badge-xe-moi"><i class="fa-solid fa-sparkles"></i> XE MỚI</span>' : ''}
                                            ${p.suspected_exif_fraud ? '<span class="bg-red-600 text-white px-1.5 py-0.5 rounded text-[10px] font-bold ml-1 tracking-wider whitespace-nowrap"><i class="fa-solid fa-triangle-exclamation mr-1"></i>Nghi ngờ gian lận</span>' : ''}
                                        </div>
                                        <span class="text-xs text-gray-500">${safeUsername}</span>
                                    </div>
                                    <div class="relative w-full bg-gray-200 border-y border-gray-200 overflow-hidden">
                                        <img loading="lazy" src="${app.utils.getProxiedUrl(p.url)}" class="w-full h-auto object-contain">
                                        <div class="admin-photo-grid-overlay grid-3x3-overlay ${app.admin.is3x3Enabled ? '' : 'hidden'}">
                                            <div class="grid-3x3-line-v" style="left: 33.3333%;"></div>
                                            <div class="grid-3x3-line-v" style="left: 66.6666%;"></div>
                                            <div class="grid-3x3-line-h" style="top: 33.3333%;"></div>
                                            <div class="grid-3x3-line-h" style="top: 66.6666%;"></div>
                                        </div>
                                        ${app.admin.getRulerOverlayHTML()}
                                        <button onclick="app.admin.openZoom('${app.utils.getProxiedUrl(p.url)}', false, true)" class="absolute top-2 right-2 bg-black/50 text-white w-8 h-8 rounded hover:bg-black flex items-center justify-center transition z-20" title="Soi ảnh"><i class="fa-solid fa-expand"></i></button>
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
                                            <div><span class="admin-label">Vị trí</span><input type="text" id="adm-p-location-${p.id}" value="${location}" class="admin-input" onchange="app.admin.checkDuplicateDateAdmin('${p.id}', '${p.uploader_id}', '${p.taken_at ? p.taken_at.split('T')[0] : ''}')"></div>
                                            <div class="hidden">
                                                <select id="adm-p-province-${p.id}">
                                                    <option value="${prov || ''}" selected>${prov || ''}</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div><span class="admin-label">Ghi chú</span><textarea id="adm-p-note-${p.id}" rows="2" class="admin-input">${note}</textarea></div>
                                        ${(() => {
                                        const isOwnPhoto = p.uploader_id === app.user.id;
                                        const canApprove = (!isOwnPhoto || app.role === 'manager') && !p._isReviewedByMe;
                                        const canDeny = (!isOwnPhoto || app.role === 'manager') && !p._isReviewedByMe;

                                        let actionButtons = '<div class="flex gap-2 mt-2">';

                                        if (p._isReviewedByMe) {
                                            actionButtons += `<div class="flex-1 bg-gray-100 text-gray-400 py-1.5 text-xs font-bold rounded text-center border border-gray-200 cursor-not-allowed">
                                                <i class="fa-solid fa-check mr-1"></i> Bạn đã duyệt
                                            </div>`;
                                        } else {
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
                                        }

                                        actionButtons += '</div>';
                                        return actionButtons;
                                    })()}
                                    </div>
                                </div>`;
                },

                update3x3UI: () => {
                    const btn = document.getElementById('btn-toggle-3x3');
                    const statusText = document.getElementById('status-3x3');
                    if (btn && statusText) {
                        if (app.admin.is3x3Enabled) {
                            btn.className = "flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-black border border-black rounded-lg text-xs font-bold text-white hover:bg-gray-800 transition shadow-xl whitespace-nowrap";
                            statusText.innerText = "BẬT";
                        } else {
                            btn.className = "flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-800 hover:bg-gray-50 hover:text-black transition shadow-xl whitespace-nowrap";
                            statusText.innerText = "TẮT";
                        }
                    }
                    document.querySelectorAll('.admin-photo-grid-overlay').forEach(el => {
                        if (app.admin.is3x3Enabled) el.classList.remove('hidden');
                        else el.classList.add('hidden');
                    });
                    const zoomGrid = document.getElementById('admin-zoom-grid-overlay');
                    if (zoomGrid) {
                        if (app.admin.is3x3Enabled) zoomGrid.classList.remove('hidden');
                        else zoomGrid.classList.add('hidden');
                    }
                },

                updateRulerUI: () => {
                    const btn = document.getElementById('btn-toggle-ruler');
                    const statusText = document.getElementById('status-ruler');
                    if (btn && statusText) {
                        if (app.admin.isRulerEnabled) {
                            btn.className = "flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-black border border-black rounded-lg text-xs font-bold text-white hover:bg-gray-800 transition shadow-xl whitespace-nowrap";
                            statusText.innerText = "BẬT";
                        } else {
                            btn.className = "flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-800 hover:bg-gray-50 hover:text-black transition shadow-xl whitespace-nowrap";
                            statusText.innerText = "TẮT";
                        }
                    }
                    document.querySelectorAll('.admin-photo-ruler-overlay').forEach(el => {
                        if (app.admin.isRulerEnabled) el.classList.remove('hidden');
                        else el.classList.add('hidden');
                    });
                    const zoomRuler = document.getElementById('admin-zoom-ruler-overlay');
                    if (zoomRuler) {
                        if (app.admin.isRulerEnabled) zoomRuler.classList.remove('hidden');
                        else zoomRuler.classList.add('hidden');
                    }
                },

                updateHideMineUI: () => {
                    const btn = document.getElementById('btn-toggle-hide-mine');
                    const statusText = document.getElementById('status-hide-mine');
                    if (btn && statusText) {
                        if (app.admin.isHideMineEnabled) {
                            btn.className = "flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-black border border-black rounded-lg text-xs font-bold text-white hover:bg-gray-800 transition shadow-xl whitespace-nowrap";
                            statusText.innerText = "BẬT";
                        } else {
                            btn.className = "flex-shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-xs font-bold text-gray-800 hover:bg-gray-50 hover:text-black transition shadow-xl whitespace-nowrap";
                            statusText.innerText = "TẮT";
                        }
                    }
                    document.querySelectorAll('.admin-card[data-is-own="true"]').forEach(card => {
                        if (app.admin.isHideMineEnabled) card.classList.add('hidden');
                        else card.classList.remove('hidden');
                    });
                },

                getRulerOverlayHTML: () => {
                    const isHidden = app.admin.isRulerEnabled ? '' : 'hidden';
                    const levels = [
                        { pos: 8.3333, label: '5' },
                        { pos: 16.6667, label: '4' },
                        { pos: 25.0, label: '3' },
                        { pos: 33.3333, label: '2' },
                        { pos: 41.6667, label: '1' },
                        { pos: 50.0, label: '0', isCenter: true },
                        { pos: 58.3333, label: '1' },
                        { pos: 66.6667, label: '2' },
                        { pos: 75.0, label: '3' },
                        { pos: 83.3333, label: '4' },
                        { pos: 91.6667, label: '5' }
                    ];
                    let linesHtml = '';
                    levels.forEach(item => {
                        const lineClass = item.isCenter ? 'ruler-line-center' : 'ruler-line-v';
                        const badgeClass = item.isCenter ? 'ruler-badge-center' : 'ruler-badge';
                        linesHtml += `<div class="${lineClass}" style="left: ${item.pos}%;"><span class="${badgeClass} ruler-badge-top">${item.label}</span><span class="${badgeClass} ruler-badge-bottom">${item.label}</span></div>`;
                    });
                    return `<div class="admin-photo-ruler-overlay ruler-horizontal-overlay ${isHidden}">${linesHtml}</div>`;
                },

                originalData: {},
                checkPlateAdmin: async (inputEl, id, type) => {
                    const val = inputEl.value.trim().replace(/[^A-Z0-9-]/gi, '').toUpperCase();
                    inputEl.value = val;

                    const origKey = type + '_' + id;
                    const orig = app.admin.originalData[origKey];
                    if (!orig) return;

                    let pre;
                    if (type === 'photo') pre = 'adm-p-';
                    else if (type === 'req-h') pre = 'req-h-';
                    else pre = 'req-';

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

                        const warnEl = document.getElementById(inputEl.id + '-warning');
                        if (warnEl) warnEl.remove();

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

                            // Xử lý cảnh báo biển số trùng
                            let warnEl = document.getElementById(inputEl.id + '-warning');
                            if (!warnEl) {
                                warnEl = document.createElement('div');
                                warnEl.id = inputEl.id + '-warning';
                                warnEl.className = 'text-orange-600 text-[10px] font-bold mt-1 leading-tight';
                                inputEl.parentNode.appendChild(warnEl);
                            }
                            if (type === 'req-h') {
                                warnEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Đã có xe ${app.utils.escapeAttr(vData.model || 'này')}. Sẽ tự động gộp (ẩn) nếu duyệt!`;
                            } else {
                                warnEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> BKS này đã được gán với xe ${app.utils.escapeAttr(vData.model || 'này')}.`;
                            }
                        } else {
                            const warnEl = document.getElementById(inputEl.id + '-warning');
                            if (warnEl) warnEl.remove();
                        }

                        // Cập nhật text biển số trên header và tag XE MỚI dynamically
                        const cardEl = inputEl.closest('.admin-card');
                        if (cardEl && type === 'photo') {
                            const cardHeader = cardEl.querySelector('.admin-card-header');
                            if (cardHeader) {
                                const plateSpan = cardHeader.querySelector('span.font-bold');
                                if (plateSpan) plateSpan.innerText = val;
                                const existingBadge = cardHeader.querySelector('.badge-xe-moi');
                                const isApprovedPlate = app.admin?.approvedPlateSet?.has(val) || (await window.sb.from('photos').select('id').eq('license_plate', val).eq('status', 'approved').limit(1)).data?.length > 0;
                                if (!isApprovedPlate && val && val !== '---') {
                                    if (!existingBadge && plateSpan) {
                                        plateSpan.insertAdjacentHTML('afterend', ' <span class="badge-xe-moi"><i class="fa-solid fa-sparkles"></i> XE MỚI</span>');
                                    }
                                } else if (existingBadge) {
                                    existingBadge.remove();
                                }
                            }
                        }
                    } catch (e) {
                        console.error("Lỗi tự điền BKS Admin:", e);
                    }
                },

                checkDuplicateDateAdmin: async (id, uploaderId, takenAtStr) => {
                    if (!takenAtStr) return;
                    const locInput = document.getElementById(`adm-p-location-${id}`);
                    const plateInput = document.getElementById(`adm-p-plate-${id}`);
                    if (!locInput || !plateInput) return;

                    const isInterior = locInput.value.trim() === 'Chụp trong xe';
                    const cleanPlate = plateInput.value.replace(/[^A-Z0-9-]/gi, '').toUpperCase();

                    try {
                        const { data: existingPhotos, error } = await window.sb
                            .from('photos')
                            .select('id, taken_at, location')
                            .eq('uploader_id', uploaderId)
                            .eq('license_plate', cleanPlate)
                            .neq('status', 'denied')
                            .neq('id', id);

                        let warnEl = document.getElementById(`adm-p-location-${id}-warning`);
                        if (!error && existingPhotos && existingPhotos.length > 0) {
                            const isDuplicateDate = existingPhotos.some(p => {
                                if (!p.taken_at) return false;
                                const pIsInterior = (p.location || '').trim() === 'Chụp trong xe';
                                return p.taken_at.split('T')[0] === takenAtStr && pIsInterior === isInterior;
                            });

                            if (isDuplicateDate) {
                                if (!warnEl) {
                                    warnEl = document.createElement('div');
                                    warnEl.id = `adm-p-location-${id}-warning`;
                                    warnEl.className = 'text-orange-600 text-[10px] font-bold mt-1 leading-tight bg-orange-50 p-1 rounded border border-orange-200';
                                    locInput.parentNode.appendChild(warnEl);
                                }
                                warnEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> CẢNH BÁO: Người dùng này đã có ảnh (cùng loại nội/ngoại thất) của xe này chụp trong ngày ${takenAtStr.split('-').reverse().join('/')}!`;
                            } else if (warnEl) {
                                warnEl.remove();
                            }
                        } else if (warnEl) {
                            warnEl.remove();
                        }
                    } catch (err) {
                        console.error('Lỗi checkDuplicateDateAdmin:', err);
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
                        const cust = document.getElementById('email-custom-address');
                        if (cust && saved.customAddress !== undefined) cust.value = saved.customAddress;
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
                        const { data: pendingPhotos, error: pErr } = await window.sb.from('photos').select('id, uploader_id').eq('status', 'pending');
                        if (pErr) console.error("Lỗi đếm photos:", pErr);
                        const { data: reqs, error: rErr } = await window.sb.from('edit_requests').select('requester_id, new_data').eq('status', 'pending');
                        if (rErr) console.error("Lỗi đếm edit_requests:", rErr);

                        let pCount = 0;
                        if (pendingPhotos) {
                            if (app.admin.isHideMineEnabled && app.user && app.user.id) {
                                pCount = pendingPhotos.filter(p => p.uploader_id !== app.user.id).length;
                            } else {
                                pCount = pendingPhotos.length;
                            }
                        }

                        let editCount = 0;
                        let delCount = 0;
                        if (reqs) {
                            reqs.forEach(r => {
                                if (app.admin.isHideMineEnabled && app.user && app.user.id && r.requester_id === app.user.id) {
                                    return;
                                }
                                if (r.new_data?.request_type === 'delete_photo') delCount++;
                                else editCount++;
                            });
                        }

                        const countPhotosEl = document.getElementById('count-photos');
                        if (countPhotosEl) countPhotosEl.innerText = pCount || 0;
                        const countReqsEl = document.getElementById('count-requests');
                        if (countReqsEl) countReqsEl.innerText = editCount;
                        const countDelEl = document.getElementById('count-delete');
                        if (countDelEl) countDelEl.innerText = delCount;
                        if (window.app && window.app.views && window.app.views.updateMilestoneBanner && document.getElementById('milestone-banner')) {
                            window.app.views.updateMilestoneBanner();
                        }

                        return (pCount || 0) + editCount + delCount;
                    } catch (err) { console.error("Lỗi đếm:", err); return 0; }
                },

                openZoom: (url, showToolbar = false, isFromAdminReview = false) => {
                    const modal = document.getElementById('admin-zoom-modal');
                    const img = document.getElementById('admin-zoom-img');
                    const container = document.getElementById('admin-zoom-container') || img;
                    img.crossOrigin = "anonymous";
                    img.src = url;
                    container.classList.remove('zoom-img-active');
                    modal.classList.remove('hidden');
                    app.ui.lockScroll();
                    container.classList.remove('modal-content-leave');
                    container.classList.add('modal-content-enter');

                    const zoomGrid = document.getElementById('admin-zoom-grid-overlay');
                    if (zoomGrid) {
                        if (isFromAdminReview && app.admin.is3x3Enabled) {
                            zoomGrid.classList.remove('hidden');
                        } else {
                            zoomGrid.classList.add('hidden');
                        }
                    }

                    const zoomRuler = document.getElementById('admin-zoom-ruler-overlay');
                    if (zoomRuler) {
                        if (isFromAdminReview && app.admin.isRulerEnabled) {
                            zoomRuler.classList.remove('hidden');
                        } else {
                            zoomRuler.classList.add('hidden');
                        }
                    }

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
                    const container = document.getElementById('admin-zoom-container') || img;
                    const toolbar = document.getElementById('zoom-toolbar');

                    container.classList.remove('modal-content-enter');
                    container.classList.add('modal-content-leave');

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

                fetchAdminNote: async function() {
                    try {
                        const { data, error } = await window.sb.from('admin_notes').select('content').eq('id', 1).single();
                        if (error && error.code !== 'PGRST116') throw error;
                        const note = data ? data.content : '';
                        const noteInput = document.getElementById('adm-board-note');
                        noteInput.value = note;
                        setTimeout(() => {
                            noteInput.style.height = '';
                            noteInput.style.height = noteInput.scrollHeight + 'px';
                        }, 50);
                        document.getElementById('adm-general-note').classList.remove('hidden');
                    } catch (e) {
                        console.error('fetchAdminNote error:', e);
                    }
                },
                saveBoardNote: async function(btn) {
                    const content = document.getElementById('adm-board-note').value.trim();
                    const ogText = btn.innerHTML;
                    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                    btn.disabled = true;
                    try {
                        const { error } = await window.sb.from('admin_notes').upsert({
                            id: 1,
                            content: content,
                            updated_at: new Date().toISOString(),
                            updated_by: app.user.id
                        }, { onConflict: 'id' });
                        if (error) throw error;
                        app.ui.showAlert('Đã lưu ghi chú chung thành công!');
                    } catch (e) {
                        app.ui.showAlert('Lỗi khi lưu ghi chú: ' + e.message);
                    } finally {
                        btn.innerHTML = ogText;
                        btn.disabled = false;
                    }
                },
                
                loadTab: async (tab = 'photos', forceReload = true, preserveScroll = false) => {
                    if (!app.admin._noteFetched) {
                        app.admin._noteFetched = true;
                        app.admin.fetchAdminNote();
                    }
                    app.adminTab = tab;
                    app.admin.refreshCounts().then(total => app.admin.checkNotification());

                    if (app.admin._activeLoadingTab === tab && app.admin._isTabLoading && !preserveScroll && !forceReload) return;
                    app.admin._activeLoadingTab = tab;
                    app.admin._isTabLoading = true;
                    const currentLoadToken = ++app.admin._loadTokenCounter || (app.admin._loadTokenCounter = 1);
                    app.admin._activeLoadToken = currentLoadToken;

                    const content = document.getElementById('admin-content');
                    if (!content) return;
                    const savedScrollY = typeof window !== 'undefined' ? window.scrollY : 0;
                    const isSameTabWithContent = (app.adminTab === tab) && (content.querySelector('.admin-card') || content.querySelector('.bg-white') || content.children.length > 0);

                    if (tab === 'manager' && document.getElementById('mgr-sec-denied')) {
                        if (app.admin._activeLoadToken === currentLoadToken) {
                            app.admin._isTabLoading = false;
                            app.admin._activeLoadingTab = null;
                        }
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
                    if (!(isSameTabWithContent && (preserveScroll || !forceReload))) {
                        let loadingMsg = 'Đang tải danh sách chờ duyệt...';
                        if (tab === 'requests') loadingMsg = 'Đang tải danh sách yêu cầu chỉnh sửa...';
                        else if (tab === 'delete') loadingMsg = 'Đang tải danh sách yêu cầu xóa...';
                        else if (tab === 'comments') loadingMsg = 'Đang tải danh sách bình luận...';
                        else if (tab === 'manager') loadingMsg = 'Đang tải khu vực quản lý...';
                        content.innerHTML = `<p class="text-gray-500 italic p-4"><i class="fa-solid fa-spinner fa-spin mr-2"></i>${loadingMsg}</p>`;
                    }


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

                    const toggleBar = document.getElementById('adm-photo-grid-toggle-bar');
                    if (tab === 'photos') {
                        if (toggleBar) toggleBar.classList.remove('hidden');
                    } else {
                        if (toggleBar) toggleBar.classList.add('hidden');
                    }
                    if (app.admin.update3x3UI) app.admin.update3x3UI();
                    if (app.admin.updateRulerUI) app.admin.updateRulerUI();
                    if (app.admin.updateHideMineUI) app.admin.updateHideMineUI();

                    try {
                        if (tab === 'photos') {
                            app.adminPendingPage = app.adminPendingPage || 1;
                            const pageSize = 50;
                            const fromRow = (app.adminPendingPage - 1) * pageSize;
                            const toRow = fromRow + pageSize - 1;
                            let totalPending = 0;

                            let rawPhotos = [];
                            let reviewedIds = [];
                            try {
                                if (app.user && app.user.id) {
                                    const { data: myReviews } = await window.sb.from('photo_reviews').select('photo_id').eq('admin_id', app.user.id);
                                    if (myReviews) reviewedIds = myReviews.map(r => r.photo_id);
                                }
                            } catch(e) {}
                            
                            try {
                                const [sbRes, apiRes] = await Promise.all([
                                    window.sb.from('photos').select('*, profiles(username, role), vehicles(model), photo_reviews(action, reason, admin_id)', { count: 'estimated' }).eq('status', 'pending').order('id', { ascending: true }).range(fromRow, toRow).then(r => r).catch(() => ({ data: [], count: 0 })),
                                    (async () => {
                                        try {
                                            const sessionRes = await window.sb.auth.getSession();
                                            const token = sessionRes.data.session?.access_token;
                                            if (token) {
                                                const res = await fetch(`/api/photo?status=pending&page=${app.adminPendingPage}&limit=${pageSize}`, { headers: { 'Authorization': `Bearer ${token}` } });
                                                if (res.ok) {
                                                    const json = await res.json();
                                                    if (json && json.data && Array.isArray(json.data)) return { data: json.data, count: json.count || 0 };
                                                }
                                            }
                                        } catch (e) { console.warn('Lỗi tải pending API:', e); }
                                        return { data: [], count: 0 };
                                    })()
                                ]);
                                totalPending = Math.max(sbRes.count || 0, apiRes.count || 0);
                                const idMap = new Map();
                                (sbRes.data || []).forEach(p => idMap.set(p.id, p));
                                (apiRes.data || []).forEach(p => {
                                    const existing = idMap.get(p.id);
                                    if (existing) {
                                        idMap.set(p.id, { ...existing, ...p, vehicles: p.vehicles || existing.vehicles, profiles: p.profiles || existing.profiles });
                                    } else {
                                        idMap.set(p.id, p);
                                    }
                                });
                                rawPhotos = Array.from(idMap.values()).sort((a,b) => a.id - b.id);
                                rawPhotos.forEach(p => p._isReviewedByMe = reviewedIds.includes(p.id));
                            } catch(e) { console.warn('Lỗi fetch pending:', e); }
                            if (app.admin._activeLoadToken !== currentLoadToken || app.adminTab !== tab) return;

                            if (!rawPhotos || rawPhotos.length === 0) { content.innerHTML = '<p class="p-4 text-gray-600">Không có ảnh nào chờ duyệt.</p>'; return; }
                            await app.utils.resolveSandboxUrls(rawPhotos);
                            if (app.admin._activeLoadToken !== currentLoadToken || app.adminTab !== tab) return;

                            const addRouteVariants = (set, s) => {
                                if (!s || s === '---' || s === 'Đang cập nhật') return;
                                const clean = app.utils.cleanText(s).trim().toLowerCase();
                                if (!clean) return;
                                set.add(clean);
                                const stripped = clean.replace(/^tuyến\s+/i, '').trim();
                                set.add(stripped);
                                set.add('tuyến ' + stripped);
                                if (/^\d+$/.test(stripped)) {
                                    const num = String(parseInt(stripped, 10));
                                    const pad = stripped.padStart(2, '0');
                                    set.add(num); set.add(pad);
                                    set.add('tuyến ' + num); set.add('tuyến ' + pad);
                                }
                            };

                            const getVariants = (arr) => [...new Set(arr.flatMap(s => {
                                const clean = app.utils.cleanText(s || '').trim();
                                const cleanLower = clean.toLowerCase();
                                const stripped = cleanLower.replace(/^tuyến\s+/i, '').trim();
                                let res = [clean, cleanLower, clean.toUpperCase(), clean.replace(/\b\w/g, c => c.toUpperCase())];
                                if (stripped && stripped !== cleanLower) {
                                    res.push(stripped, stripped.toUpperCase(), 'Tuyến ' + stripped, 'Tuyến ' + stripped.toUpperCase(), 'tuyến ' + stripped);
                                }
                                if (/^\d+$/.test(stripped)) {
                                    const num = String(parseInt(stripped, 10));
                                    const pad = stripped.padStart(2, '0');
                                    res.push(num, pad, 'Tuyến ' + num, 'Tuyến ' + pad, 'tuyến ' + num, 'tuyến ' + pad);
                                }
                                return res;
                            }).filter(Boolean))];

                            let approvedPlateSet = new Set();
                            let approvedOpSet = new Set();
                            let approvedRouteSet = new Set();
                            let approvedModelSet = new Set();

                            const pendingPlates = [...new Set(rawPhotos.map(p => p.license_plate).filter(Boolean))];
                            const pendingOps = [...new Set(rawPhotos.map(p => app.utils.cleanText(p.operator || '')).filter(Boolean))];
                            const pendingRoutes = [...new Set(rawPhotos.map(p => app.utils.cleanText(p.route_no || '')).filter(Boolean))];
                            const pendingModels = [...new Set(rawPhotos.map(p => app.utils.cleanText(p.vehicles?.model || '')).filter(Boolean))];

                            const platesVariants = pendingPlates.length > 0 ? getVariants(pendingPlates) : [];
                            const opsVariants = pendingOps.length > 0 ? getVariants(pendingOps) : [];
                            const routesVariants = pendingRoutes.length > 0 ? getVariants(pendingRoutes) : [];
                            const modelsVariants = pendingModels.length > 0 ? getVariants(pendingModels) : [];

                            await Promise.all([
                                window.sb.from('operator_info').select('operator_name').then(r => {
                                    (r.data || []).forEach(o => { if (o.operator_name) approvedOpSet.add(app.utils.cleanText(o.operator_name).trim().toLowerCase()); });
                                }).catch(() => {}),

                                platesVariants.length > 0 ? window.sb.from('photos').select('license_plate').eq('status', 'approved').in('license_plate', platesVariants).then(r => {
                                    (r.data || []).forEach(p => { if (p.license_plate) approvedPlateSet.add(p.license_plate.trim().toUpperCase()); });
                                }).catch(() => {}) : Promise.resolve(),
                                platesVariants.length > 0 ? window.sb.from('vehicles').select('license_plate, photos!inner(status)').eq('photos.status', 'approved').in('license_plate', platesVariants).then(r => {
                                    (r.data || []).forEach(v => { if (v.photos && v.photos.length > 0 && v.license_plate) approvedPlateSet.add(v.license_plate.trim().toUpperCase()); });
                                }).catch(() => {}) : Promise.resolve(),
                                opsVariants.length > 0 ? window.sb.from('photos').select('operator').eq('status', 'approved').in('operator', opsVariants).then(r => {
                                    (r.data || []).forEach(p => { if (p.operator && p.operator !== '---' && p.operator !== 'Đang cập nhật') approvedOpSet.add(app.utils.cleanText(p.operator).trim().toLowerCase()); });
                                }).catch(() => {}) : Promise.resolve(),

                                opsVariants.length > 0 ? window.sb.from('operator_info').select('operator_name').in('operator_name', opsVariants).then(r => {
                                    (r.data || []).forEach(o => { if (o.operator_name) approvedOpSet.add(app.utils.cleanText(o.operator_name).trim().toLowerCase()); });
                                }).catch(() => {}) : Promise.resolve(),
                                routesVariants.length > 0 ? window.sb.from('photos').select('route_no').eq('status', 'approved').in('route_no', routesVariants).then(r => {
                                    (r.data || []).forEach(p => { if (p.route_no && p.route_no !== '---') addRouteVariants(approvedRouteSet, p.route_no); });
                                }).catch(() => {}) : Promise.resolve(),

                                modelsVariants.length > 0 ? window.sb.from('vehicles').select('model, photos!inner(status)').eq('photos.status', 'approved').in('model', modelsVariants).then(r => {
                                    (r.data || []).forEach(v => { if (v.photos && v.photos.length > 0 && v.model && v.model !== '---') approvedModelSet.add(app.utils.cleanText(v.model).trim().toLowerCase()); });
                                }).catch(() => {}) : Promise.resolve()
                            ]);
                            if (app.admin._activeLoadToken !== currentLoadToken || app.adminTab !== tab) return;

                            app.admin.approvedPlateSet = approvedPlateSet;
                            app.admin.approvedOpSet = approvedOpSet;
                            app.admin.approvedRouteSet = approvedRouteSet;
                            app.admin.approvedModelSet = approvedModelSet;

                            const photos = rawPhotos.sort((a, b) => {
                                if (a._isReviewedByMe && !b._isReviewedByMe) return 1;
                                if (!a._isReviewedByMe && b._isReviewedByMe) return -1;
                                
                                const aStarted = (a.reviewer_count || 0) > 0;
                                const bStarted = (b.reviewer_count || 0) > 0;
                                if (aStarted && !bStarted) return -1;
                                if (!aStarted && bStarted) return 1;

                                const roleA = a.profiles?.role || 'user';
                                const roleB = b.profiles?.role || 'user';
                                const isPrivilegedA = (roleA === 'admin' || roleA === 'manager') ? 1 : 0;
                                const isPrivilegedB = (roleB === 'admin' || roleB === 'manager') ? 1 : 0;

                                if (isPrivilegedA !== isPrivilegedB) {
                                    return isPrivilegedB - isPrivilegedA;
                                }
                                return a.id - b.id;
                            });

                            if ((!forceReload || preserveScroll) && content.querySelector('.admin-card') && app.adminTab === 'photos') {
                                const currentIds = new Set(photos.map(p => String(p.id)));
                                content.querySelectorAll('.admin-card[data-photo-id]').forEach(card => {
                                    if (!currentIds.has(card.getAttribute('data-photo-id'))) {
                                        card.style.transition = 'all 0.3s ease';
                                        card.style.opacity = '0';
                                        card.style.transform = 'scale(0.9)';
                                        setTimeout(() => card.remove(), 300);
                                    }
                                });
                                photos.forEach(p => {
                                    const existingCard = document.getElementById(`adm-photo-card-${p.id}`);
                                    if (!existingCard) {
                                        const tempDiv = document.createElement('div');
                                        tempDiv.innerHTML = app.admin.renderSinglePhotoCardHTML(p, approvedPlateSet, approvedOpSet, approvedRouteSet, approvedModelSet);
                                        const newEl = tempDiv.firstElementChild;
                                        if (newEl && content) {
                                            content.appendChild(newEl);
                                        }
                                    } else {
                                        if (!existingCard.contains(document.activeElement)) {
                                            const tempDiv = document.createElement('div');
                                            tempDiv.innerHTML = app.admin.renderSinglePhotoCardHTML(p, approvedPlateSet, approvedOpSet, approvedRouteSet, approvedModelSet);
                                            const newEl = tempDiv.firstElementChild;
                                            if (newEl) {
                                                existingCard.replaceWith(newEl);
                                            }
                                        }
                                    }
                                });
                                if (content.querySelectorAll('.admin-card').length === 0 && photos.length === 0) {
                                    content.innerHTML = '<p class="p-4 text-gray-600">Không có ảnh nào chờ duyệt.</p>';
                                }
                            } else {
                                content.innerHTML = photos.map(p => app.admin.renderSinglePhotoCardHTML(p, approvedPlateSet, approvedOpSet, approvedRouteSet, approvedModelSet)).join('');
                            }
                            
                            app.adminPendingTotalPages = Math.ceil(totalPending / pageSize);
                            if (app.adminPendingTotalPages > 1) {
                                const pager = document.createElement('div');
                                pager.id = 'adm-pending-pager';
                                pager.className = 'col-span-full mt-6';
                                content.appendChild(pager);
                                app.utils.renderPagination('adm-pending-pager', app.adminPendingPage, app.adminPendingTotalPages, (newPage) => {
                                    app.adminPendingPage = newPage;
                                    app.admin.loadTab('photos', true);
                                });
                            }

                            if (app.admin.update3x3UI) app.admin.update3x3UI();
                            if (app.admin.updateRulerUI) app.admin.updateRulerUI();
                            if (app.admin.updateHideMineUI) app.admin.updateHideMineUI();
                        } else if (tab === 'delete') {
                            let html = '';


                            if (app.role === 'manager') {
                                html += `
                                <div class="col-span-full mb-6 p-5 bg-red-50 border border-red-200 rounded-lg shadow-sm">
                                    <h3 class="font-bold text-sm mb-3 text-red-700 uppercase"><i class="fa-solid fa-triangle-exclamation"></i> Quản lý Xóa ảnh trực tiếp</h3>
                                    <div class="flex flex-col md:flex-row gap-3">
                                        <input type="text" id="adm-direct-delete-id" placeholder="ID ảnh hoặc Link ảnh..." class="flex-1 border border-red-200 p-2.5 text-sm rounded-md outline-none focus:ring-2 focus:ring-red-500">
                                        <input type="text" id="adm-direct-delete-reason" placeholder="Lý do xóa..." class="flex-1 border border-red-200 p-2.5 text-sm rounded-md outline-none focus:ring-2 focus:ring-red-500">
                                        <button onclick="app.admin.directDeleteInput(this)" class="bg-red-600 text-white px-6 py-2.5 font-bold rounded-md hover:bg-red-700 transition whitespace-nowrap">Xóa Ngay</button>
                                    </div>
                                </div>
                                `;
                            }

                            html += '<div class="col-span-full"><h3 class="font-bold text-sm mb-3 uppercase">Danh sách user yêu cầu xóa</h3></div>';

                            app.adminDeletePage = app.adminDeletePage || 1;
                            const pageSize = 20;
                            const fromRow = (app.adminDeletePage - 1) * pageSize;
                            const toRow = fromRow + pageSize - 1;
                            let { data: reqs, count, error } = await window.sb.from('edit_requests').select('*', { count: 'estimated' }).eq('status', 'pending').eq('new_data->>request_type', 'delete_photo').range(fromRow, toRow);
                            if (error) throw error;
                            if (app.admin._activeLoadToken !== currentLoadToken || app.adminTab !== tab) return;

                            const deleteReqs = reqs || [];

                            if (!deleteReqs || deleteReqs.length === 0) {
                                content.innerHTML = html + '<p class="col-span-full p-4">Không có yêu cầu xóa nào.</p>';
                                return;
                            }

                            const photoIds = deleteReqs.map(r => r.new_data.photo_id);
                            const { data: photos } = await window.sb.from('photos').select('id, url, license_plate').in('id', photoIds);
                            if (photos && photos.length > 0) await app.utils.resolveSandboxUrls(photos);
                            if (app.admin._activeLoadToken !== currentLoadToken || app.adminTab !== tab) return;
                            const photoMap = {}; if (photos) photos.forEach(p => photoMap[p.id] = p);

                            const userIds = [...new Set(deleteReqs.map(r => r.requester_id))];
                            const { data: users } = await window.sb.from('profiles').select('id, username, role').in('id', userIds);
                            if (app.admin._activeLoadToken !== currentLoadToken || app.adminTab !== tab) return;
                            const userMap = {}; const roleMap = {};
                            if (users) users.forEach(u => { userMap[u.id] = u.username; roleMap[u.id] = u.role; });

                            deleteReqs.sort((a, b) => {
                                const roleA = roleMap[a.requester_id] || 'user';
                                const roleB = roleMap[b.requester_id] || 'user';
                                const isPrivA = (roleA === 'admin' || roleA === 'manager') ? 1 : 0;
                                const isPrivB = (roleB === 'admin' || roleB === 'manager') ? 1 : 0;
                                if (isPrivA !== isPrivB) return isPrivB - isPrivA;
                                return a.id - b.id;
                            });

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
                                    <div class="relative w-full bg-gray-200 border-y border-gray-200 overflow-hidden">
                                        <img loading="lazy" src="${app.utils.getProxiedUrl(photo?.url)}" class="w-full h-auto object-contain">
                                        <div class="admin-photo-grid-overlay grid-3x3-overlay ${app.admin.is3x3Enabled ? '' : 'hidden'}">
                                            <div class="grid-3x3-line-v" style="left: 33.3333%;"></div>
                                            <div class="grid-3x3-line-v" style="left: 66.6666%;"></div>
                                            <div class="grid-3x3-line-h" style="top: 33.3333%;"></div>
                                            <div class="grid-3x3-line-h" style="top: 66.6666%;"></div>
                                        </div>
                                        ${app.admin.getRulerOverlayHTML()}
                                        <button onclick="app.admin.openZoom('${app.utils.getProxiedUrl(photo?.url)}', false, true)" class="absolute top-2 right-2 bg-black/50 text-white w-8 h-8 rounded hover:bg-black flex items-center justify-center transition z-20" title="Soi ảnh"><i class="fa-solid fa-expand"></i></button>
                                    </div>
                                    <div class="admin-card-body text-xs">
                                        <p class="font-bold text-sm mb-1">${photo?.license_plate || 'Đã mất dữ liệu'}</p>
                                        <div class="mb-3 mt-2"><span class="admin-label">Lý do user nhập:</span><p class="bg-gray-50 p-2 border rounded text-red-700 italic">"${userReason}"</p></div>
                                        <div class="flex gap-2 mt-3">
                                        ${app.role === 'manager' ? `
                                            <button onclick="app.admin.approveDeleteReq('${req.id}', '${req.new_data.photo_id}', '${req.requester_id}', '${userReason}', this)" class="flex-1 bg-red-600 text-white py-1.5 font-bold rounded hover:bg-red-700">DUYỆT XÓA</button>
                                            <button onclick="app.admin.denyReq('${req.id}', this)" class="flex-1 bg-gray-600 text-white py-1.5 font-bold rounded hover:bg-gray-700">TỪ CHỐI</button>
                                        ` : `
                                            <div class="flex-1 bg-gray-100 text-gray-400 py-1.5 font-bold rounded text-center border border-gray-200 cursor-not-allowed">Chỉ Manager được duyệt</div>
                                        `}
                                        </div>
                                    </div>
                                </div>`
                            }).join('');

                            content.innerHTML = html;
                            if (count > 0 && Math.ceil(count / pageSize) > 1) {
                                const pager = document.createElement('div');
                                pager.id = 'adm-delete-pager';
                                pager.className = 'mt-6 col-span-full';
                                content.appendChild(pager);
                                app.utils.renderPagination('adm-delete-pager', app.adminDeletePage, Math.ceil(count / pageSize), (newPage) => {
                                    app.adminDeletePage = newPage;
                                    app.admin.loadTab('delete', true);
                                });
                            }
                            if (app.admin.update3x3UI) app.admin.update3x3UI();
                            if (app.admin.updateRulerUI) app.admin.updateRulerUI();
                        } else if (tab === 'requests') {
                            app.adminReqPage = app.adminReqPage || 1;
                            const pageSize = 20;
                            const fromRow = (app.adminReqPage - 1) * pageSize;
                            const toRow = fromRow + pageSize - 1;
                            let { data: reqs, count, error } = await window.sb.from('edit_requests').select('*', { count: 'estimated' }).eq('status', 'pending').neq('new_data->>request_type', 'delete_photo').range(fromRow, toRow);
                            if (error) throw error;
                            if (app.admin._activeLoadToken !== currentLoadToken || app.adminTab !== tab) return;
                            if (!reqs || reqs.length === 0) { content.innerHTML = '<p class="p-4">Không có yêu cầu nào.</p>'; return; }

                            const userIds = [...new Set(reqs.map(r => r.requester_id))];
                            const { data: users } = await window.sb.from('profiles').select('id, username, role').in('id', userIds);
                            if (app.admin._activeLoadToken !== currentLoadToken || app.adminTab !== tab) return;
                            const userMap = {}; const roleMap = {};
                            if (users) users.forEach(u => { userMap[u.id] = u.username; roleMap[u.id] = u.role; });

                            reqs.sort((a, b) => {
                                const roleA = roleMap[a.requester_id] || 'user';
                                const roleB = roleMap[b.requester_id] || 'user';
                                const isPrivA = (roleA === 'admin' || roleA === 'manager') ? 1 : 0;
                                const isPrivB = (roleB === 'admin' || roleB === 'manager') ? 1 : 0;
                                if (isPrivA !== isPrivB) return isPrivB - isPrivA;
                                return a.id - b.id;
                            });

                            const plates = reqs.map(r => r.license_plate);
                            const { data: curVehicles } = await window.sb.from('vehicles').select('*').in('license_plate', plates);
                            if (app.admin._activeLoadToken !== currentLoadToken || app.adminTab !== tab) return;
                            const vMap = {}; if (curVehicles) curVehicles.forEach(v => vMap[v.license_plate] = v);

                            const { data: curHistories } = await window.sb.from('vehicle_history').select('*').in('license_plate', plates);
                            if (app.admin._activeLoadToken !== currentLoadToken || app.adminTab !== tab) return;
                            const hMap = {}; 
                            if (curHistories) {
                                curHistories.forEach(h => {
                                    if (!hMap[h.license_plate]) hMap[h.license_plate] = [];
                                    hMap[h.license_plate].push(h);
                                });
                            }

                            const photoIdsReq = reqs.map(r => r.new_data.photo_id).filter(Boolean);
                            const { data: curPhotos } = await window.sb.from('photos').select('id, operator, route_no, type, province, location, note').in('id', photoIdsReq);
                            if (app.admin._activeLoadToken !== currentLoadToken || app.adminTab !== tab) return;
                            const pMap = {}; if (curPhotos) curPhotos.forEach(p => pMap[p.id] = p);

                            const opNamesReq = reqs.map(r => r.new_data.operator_name).filter(Boolean);
                            let opMap = {};
                            if (opNamesReq.length > 0) {
                                const { data: curOps } = await window.sb.from('operator_info').select('*').in('operator_name', opNamesReq);
                                if (curOps) curOps.forEach(o => opMap[o.operator_name] = o);
                            }

                            const mdlNamesReq = reqs.map(r => r.new_data.model_name).filter(Boolean);
                            let mdlMap = {};
                            if (mdlNamesReq.length > 0) {
                                const { data: curMdls } = await window.sb.from('model_info').select('*').in('model_name', mdlNamesReq);
                                if (curMdls) curMdls.forEach(m => mdlMap[m.model_name] = m);
                            }

                            content.innerHTML = reqs.map(r => {
                                const d = r.new_data;
                                const type = d.request_type || 'Unknown';
                                const username = userMap[r.requester_id] || 'Ẩn danh';
                                const curV = vMap[r.license_plate] || {};
                                const curP = pMap[d.photo_id] || {};
                                const curOp = opMap[d.operator_name] || {};
                                const curMdl = mdlMap[d.model_name] || {};

                                if (type === 'update_vehicle_info') {
                                    const tagNew = '<span class="text-red-500 font-bold ml-1 text-[9px]">[MỚI]</span>';
                                    if (!app.admin.originalData) app.admin.originalData = {};
                                    app.admin.originalData['req_' + r.id] = { plate: d.license_plate, operator: d.operator, type: d.type, route: d.route, model: d.model, location: curP.location };
                                    return `
                                    <div class="admin-card overflow-visible">
                                        <div class="admin-card-header"><span class="font-bold text-xs uppercase text-blue-600">SỬA THÔNG TIN</span><span class="text-xs text-gray-500">${app.utils.cleanText(username)}</span></div>
                                        <div class="admin-card-body text-xs">
                                            <p class="mb-2 text-xs font-bold text-gray-500">Thông tin gốc (Hiện tại):</p>
                                            <div class="space-y-1 mb-4 text-xs opacity-75 border p-2 rounded bg-gray-50">
                                                <div><span class="font-bold">BKS:</span> ${app.utils.escapeAttr(curV.license_plate || '-')}</div>
                                                <div><span class="font-bold">Đơn vị:</span> ${app.utils.escapeAttr(curP.operator || '-')}</div>
                                                <div><span class="font-bold">Dòng xe:</span> ${app.utils.escapeAttr(curV.model || '-')}</div>
                                                <div><span class="font-bold">Tuyến:</span> ${app.utils.escapeAttr(curP.route_no || '-')}</div>
                                                <div><span class="font-bold">Loại xe:</span> ${curP.type === 'coach' ? 'Xe khách' : (curP.type === 'bus' ? 'Xe buýt' : '-')}</div>
                                                <div><span class="font-bold">Vị trí:</span> ${app.utils.escapeAttr(curP.location || '-')}</div>
                                                <div><span class="font-bold">Ghi chú:</span> ${app.utils.escapeAttr(curP.note || '-')}</div>
                                            </div>
                                            <p class="mb-2 font-bold text-red-500">[MỚI] Yêu cầu cập nhật thành:</p>
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
                                            <div class="grid grid-cols-1 gap-2 mb-2">
                                                <div><span class="admin-label">Loại xe ${d.type !== curP.type ? tagNew : ''}</span><select id="req-type-${r.id}" class="admin-input"><option value="bus" ${d.type === 'bus' ? 'selected' : ''}>Xe buýt</option><option value="coach" ${d.type === 'coach' ? 'selected' : ''}>Xe khách</option></select></div>
                                                <div class="hidden">
                                                    <select id="req-province-${r.id}">
                                                        <option value="${d.province || curP.province || ''}" selected>${d.province || curP.province || ''}</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div class="mb-2"><span class="admin-label">Vị trí (Chỉ cập nhật ảnh này)</span><input type="text" id="req-loc-${r.id}" value="${app.utils.escapeAttr(d.location || '')}" class="admin-input"></div>
                                            <div class="mb-2"><span class="admin-label">Ghi chú (Chỉ cập nhật ảnh này)</span><textarea id="req-note-${r.id}" class="admin-input">${app.utils.cleanText(d.note || '')}</textarea></div>

                                            <div class="flex gap-2 mt-3">
                                                <button onclick="app.admin.approveReq('${r.id}', this, 'info')" class="flex-1 bg-green-600 text-white py-1.5 font-bold rounded hover:bg-green-700">DUYỆT</button>
                                                <button onclick="app.admin.denyReq('${r.id}', this)" class="flex-1 bg-red-600 text-white py-1.5 font-bold rounded hover:bg-red-700">HỦY</button>
                                            </div>
                                        </div>
                                    </div>`;
                                } else if (type === 'update_history') {
                                    if (!app.admin.originalData) app.admin.originalData = {};
                                    const oldHistories = hMap[r.license_plate] || [];
                                    oldHistories.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
                                    
                                    let oldHHtml = `<p class="mb-2 text-xs font-bold text-gray-500">Lịch sử hiện tại (${oldHistories.length} mục):</p><div class="space-y-1 mb-4 text-xs opacity-75">`;
                                    if (oldHistories.length === 0) {
                                        oldHHtml += `<div class="italic text-gray-400">Không có dữ liệu lịch sử cũ</div>`;
                                    } else {
                                        oldHistories.forEach(old => {
                                            oldHHtml += `<div class="border p-1.5 rounded bg-gray-50">Biển: <span class="font-bold">${app.utils.escapeAttr(old.plate||'-')}</span> | Ngày: ${old.effective_date||'-'} | ĐV: ${app.utils.escapeAttr(old.operator||'-')} | Tuyến: ${app.utils.escapeAttr(old.route||'-')}</div>`;
                                        });
                                    }
                                    oldHHtml += `</div>`;

                                    let details = oldHHtml + `<p class="mb-2 font-bold text-red-500">[MỚI] Yêu cầu cập nhật thành ${d.history_items.length} mục:</p><div id="req-h-list-${r.id}" class="space-y-2">`;
                                    d.history_items.forEach((h, i) => {
                                        app.admin.originalData[`req-h_${r.id}_${i}`] = { plate: h.plate || '', operator: h.operator || '', route: h.route || '', note: h.note || '' };
                                        
                                        let oh = oldHistories.find(old => old.plate === h.plate);
                                        if (!oh) oh = oldHistories[i];
                                        oh = oh || {};

                                        const tagNew = '<span class="text-red-500 font-bold ml-1 text-[9px]">[MỚI]</span>';
                                        const hasChanged = (oldVal, newVal) => String(oldVal || '').trim() !== String(newVal || '').trim();
                                        
                                        const plateTag = hasChanged(oh.plate, h.plate) ? tagNew : '';
                                        const dateTag = hasChanged(oh.effective_date, h.effective_date) ? tagNew : '';
                                        const opTag = hasChanged(oh.operator, h.operator) ? tagNew : '';
                                        const routeTag = hasChanged(oh.route, h.route) ? tagNew : '';
                                        const noteTag = hasChanged(oh.note, h.note) ? tagNew : '';

                                        details += `
                                        <div class="border border-gray-200 p-2 rounded relative">
                                            <div class="grid grid-cols-2 gap-2 mb-2">
                                                <div>
                                                    <span class="admin-label">Biển số cũ ${plateTag}</span>
                                                    <input type="text" id="req-h-plate-${r.id}-${i}" value="${app.utils.escapeAttr(h.plate || '')}" class="admin-input font-bold" oninput="app.utils.formatPlateInput(this)" onchange="app.admin.checkPlateAdmin(this, '${r.id}_${i}', 'req-h')">
                                                </div>
                                                <div class="flex flex-col min-w-[120px] flex-1">
                                                    <label class="text-[10px] text-gray-500 font-bold mb-1 ml-1 uppercase">Ngày ${dateTag}</label>
                                                    <input type="text" id="req-h-date-${r.id}-${i}" placeholder="DD/MM/YYYY" maxlength="10" oninput="app.utils.formatDateInput(this)" value="${app.utils.escapeAttr(app.utils.formatDateToDDMMYYYY(h.effective_date) || '')}" class="admin-input font-mono text-center">
                                                </div>
                                            </div>
                                            <div class="grid grid-cols-2 gap-2 mb-2">
                                                <div>
                                                    <span class="admin-label">Đơn vị ${opTag}</span>
                                                    <div class="relative">
                                                        <input type="text" id="req-h-op-${r.id}-${i}" value="${app.utils.escapeAttr(h.operator || '')}" class="admin-input" oninput="app.utils.triggerSuggestion('req-h-op-${r.id}-${i}', 'req-h-sug-op-${r.id}-${i}', this.value, 'operator')">
                                                        <div id="req-h-sug-op-${r.id}-${i}" class="suggestion-box"></div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <span class="admin-label">Tuyến ${routeTag}</span>
                                                    <div class="relative">
                                                        <input type="text" id="req-h-route-${r.id}-${i}" value="${app.utils.escapeAttr(h.route || '')}" class="admin-input" autocomplete="off" onfocus="app.utils.triggerRouteSuggestion('req-h-route-${r.id}-${i}', 'req-h-sug-route-${r.id}-${i}', '')" oninput="app.utils.triggerRouteSuggestion('req-h-route-${r.id}-${i}', 'req-h-sug-route-${r.id}-${i}', this.value)">
                                                        <div id="req-h-sug-route-${r.id}-${i}" class="suggestion-box"></div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <span class="admin-label">Ghi chú ${noteTag}</span>
                                                <input type="text" id="req-h-note-${r.id}-${i}" value="${app.utils.escapeAttr(h.note || '')}" class="admin-input">
                                            </div>
                                        </div>
                                        `;
                                    });
                                    details += `</div>`;
                                    return `
                                    <div class="admin-card overflow-visible">
                                        <div class="admin-card-header"><span class="font-bold text-xs uppercase text-amber-600">SỬA LỊCH SỬ XE: ${r.license_plate}</span><span class="text-xs text-gray-500">${username}</span></div>
                                        <div class="admin-card-body text-xs">
                                            <div class="mb-3 overflow-visible">${details}</div>
                                            <div class="flex gap-2">
                                                <button onclick="app.admin.approveReq('${r.id}', this, 'history', ${d.history_items.length})" class="flex-1 bg-green-600 text-white py-1.5 font-bold rounded hover:bg-green-700">DUYỆT</button>
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
                                            <p class="mb-2 text-xs font-bold text-gray-500">Thông tin gốc (Hiện tại):</p>
                                            <div class="space-y-1 mb-4 text-xs opacity-75 border p-2 rounded bg-gray-50">
                                                <div><span class="font-bold">BKS:</span> ${app.utils.escapeAttr(curV.license_plate || '-')}</div>
                                                <div><span class="font-bold">Dòng xe:</span> ${app.utils.escapeAttr(curV.model || '-')}</div>
                                                <div><span class="font-bold">Ghi chú:</span> ${app.utils.escapeAttr(curV.note || '-')}</div>
                                            </div>
                                            <p class="mb-2 font-bold text-red-500">[MỚI] Yêu cầu cập nhật thành:</p>
                                            <div class="mb-2">
                                                <span class="admin-label">Dòng xe ${d.model !== curV.model ? tagNew : ''}</span>
                                                <div class="relative">
                                                    <input type="text" id="req-v-model-${r.id}" value="${app.utils.escapeAttr(d.model || '')}" class="admin-input" oninput="app.utils.triggerSuggestion('req-v-model-${r.id}', 'req-v-sug-model-${r.id}', this.value, 'model')">
                                                    <div id="req-v-sug-model-${r.id}" class="suggestion-box"></div>
                                                </div>
                                            </div>
                                            <div class="mb-2">
                                                <span class="admin-label">Ghi chú về xe ${d.note !== curV.note ? tagNew : ''}</span>
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
                                            <p class="font-bold text-sm mb-2 text-black"><i class="fa-solid fa-building mr-1 text-gray-400"></i> ${app.utils.escapeAttr(d.operator_name)}</p>
                                            <p class="mb-2 text-xs font-bold text-gray-500">Thông tin gốc (Hiện tại):</p>
                                            <div class="space-y-1 mb-4 text-xs opacity-75 border p-2 rounded bg-gray-50">
                                                <div><span class="font-bold">ĐVVH mẹ:</span> ${app.utils.escapeAttr(curOp.parent_operator || '-')}</div>
                                                <div><span class="font-bold">Logo URL:</span> ${curOp.logo_url ? `<a href="${app.utils.escapeAttr(curOp.logo_url)}" target="_blank" class="text-blue-500 underline">[Xem Ảnh]</a>` : '-'}</div>
                                                <div><span class="font-bold">Mô tả:</span> ${app.utils.escapeAttr(curOp.description || '-')}</div>
                                            </div>
                                            <p class="mb-2 font-bold text-red-500">[MỚI] Yêu cầu cập nhật thành:</p>
                                            <div class="mb-2">
                                                <span class="admin-label">ĐVVH mẹ ${d.parent_operator !== curOp.parent_operator ? '<span class="text-red-500 font-bold ml-1 text-[9px]">[MỚI]</span>' : ''}</span>
                                                <input type="text" id="req-op-parent-${r.id}" value="${app.utils.escapeAttr(d.parent_operator || '')}" class="admin-input" placeholder="Tùy chọn">
                                            </div>
                                            <div class="mb-2">
                                                <span class="admin-label">Logo URL ${d.logo_url !== curOp.logo_url ? '<span class="text-red-500 font-bold ml-1 text-[9px]">[MỚI]</span>' : ''}</span>
                                                <input type="text" id="req-op-logo-${r.id}" value="${app.utils.escapeAttr(d.logo_url || '')}" class="admin-input">
                                                ${d.logo_url ? `<img src="${app.utils.escapeAttr(d.logo_url.includes('wsrv.nl') ? d.logo_url : 'https://wsrv.nl/?url=' + encodeURIComponent(d.logo_url))}" class="mt-1 h-8 w-8 object-cover rounded border border-gray-200">` : ''}
                                            </div>
                                            ${(() => {
                                                let isInactiveReq = false;
                                                let rawDescReq = d.description || '';
                                                if (rawDescReq.startsWith('[STOPPED]')) {
                                                    isInactiveReq = true;
                                                    rawDescReq = rawDescReq.replace(/^\[STOPPED\]\s*/, '');
                                                }
                                                return `
                                                <div class="mb-2">
                                                    <span class="admin-label">Mô tả ${d.description !== curOp.description ? '<span class="text-red-500 font-bold ml-1 text-[9px]">[MỚI]</span>' : ''}</span>
                                                    <textarea id="req-op-desc-${r.id}" class="admin-input" rows="4">${app.utils.escapeAttr(rawDescReq)}</textarea>
                                                </div>
                                                <div class="mb-3 mt-1 flex items-center justify-between bg-red-50 p-2 rounded border border-red-200">
                                                    <span class="text-xs font-bold text-red-700 uppercase">Đánh dấu đơn vị này đã dừng hoạt động</span>
                                                    <label class="relative inline-flex items-center cursor-pointer shrink-0 ml-4 self-center">
                                                        <input type="checkbox" id="req-op-inactive-${r.id}" ${isInactiveReq ? 'checked' : ''} class="sr-only peer">
                                                        <div class="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-red-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all shadow-inner"></div>
                                                    </label>
                                                </div>
                                                `;
                                            })()}
                                            <div class="flex gap-2 mt-3">
                                                <button onclick="app.admin.approveReq('${r.id}', this, 'operator_info')" class="flex-1 bg-green-600 text-white py-1.5 font-bold rounded hover:bg-green-700">DUYỆT</button>
                                                ${app.role === 'manager' ? `<button onclick="app.admin.denyReq('${r.id}', this)" class="flex-1 bg-red-600 text-white py-1.5 font-bold rounded hover:bg-red-700">TỪ CHỐI</button>` : ''}
                                            </div>
                                        </div>
                                    </div>`;
                                } else if (type === 'update_model_info') {
                                    return `
                                    <div class="admin-card overflow-visible">
                                        <div class="admin-card-header bg-purple-50"><span class="font-bold text-xs uppercase text-purple-600">CẬP NHẬT DÒNG XE</span><span class="text-xs text-gray-500">${username}</span></div>
                                        <div class="admin-card-body text-xs">
                                            <p class="font-bold text-sm mb-2 text-black"><i class="fa-solid fa-layer-group mr-1 text-gray-400"></i> ${app.utils.escapeAttr(d.model_name)}</p>
                                            <p class="mb-2 text-xs font-bold text-gray-500">Thông tin gốc (Hiện tại):</p>
                                            <div class="space-y-1 mb-4 text-xs opacity-75 border p-2 rounded bg-gray-50">
                                                <div><span class="font-bold">Logo Hãng:</span> ${curMdl.logo_url ? `<a href="${app.utils.escapeAttr(curMdl.logo_url)}" target="_blank" class="text-blue-500 underline">[Xem Ảnh]</a>` : '-'}</div>
                                                <div><span class="font-bold">Mô tả:</span> ${app.utils.escapeAttr(curMdl.description || '-')}</div>
                                            </div>
                                            <p class="mb-2 font-bold text-red-500">[MỚI] Yêu cầu cập nhật thành:</p>
                                            <div class="mb-2">
                                                <span class="admin-label">Logo Hãng (Tự động đồng bộ hãng) ${d.logo_url !== curMdl.logo_url ? '<span class="text-red-500 font-bold ml-1 text-[9px]">[MỚI]</span>' : ''}</span>
                                                <input type="text" id="req-mdl-logo-${r.id}" value="${app.utils.escapeAttr(d.logo_url || '')}" class="admin-input">
                                                ${d.logo_url ? `<img src="${app.utils.escapeAttr(d.logo_url.includes('wsrv.nl') ? d.logo_url : 'https://wsrv.nl/?url=' + encodeURIComponent(d.logo_url))}" class="mt-1 h-8 w-auto max-w-[80px] object-contain rounded border border-gray-200">` : ''}
                                            </div>
                                            <div class="mb-2">
                                                <span class="admin-label">Mô tả chi tiết Model ${d.description !== curMdl.description ? '<span class="text-red-500 font-bold ml-1 text-[9px]">[MỚI]</span>' : ''}</span>
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
                            if (count > 0 && Math.ceil(count / pageSize) > 1) {
                                const pager = document.createElement('div');
                                pager.id = 'adm-req-pager';
                                pager.className = 'mt-6 col-span-full';
                                content.appendChild(pager);
                                app.utils.renderPagination('adm-req-pager', app.adminReqPage, Math.ceil(count / pageSize), (newPage) => {
                                    app.adminReqPage = newPage;
                                    app.admin.loadTab('requests', true);
                                });
                            }
                            if (app.admin.update3x3UI) app.admin.update3x3UI();
                            if (app.admin.updateRulerUI) app.admin.updateRulerUI();
                        }


                        else if (tab === 'comments') {
                            const { data } = await window.sb.from('photo_comments')
                                .select('*, profiles(username), photos(license_plate)')
                                .order('created_at', {ascending: false}).limit(500);
                            if (app.admin._activeLoadToken !== currentLoadToken || app.adminTab !== tab) return;

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
                                        <button onclick="app.admin.switchManagerTab('blindwm')" id="mgr-tab-blindwm" class="font-bold text-sm px-4 py-2 bg-white text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition whitespace-nowrap"><i class="fa-solid fa-fingerprint mr-1"></i> Giải mã Dấu chìm</button>
                                    </div>

                                    <!-- TAB: ẢNH BỊ TỪ CHỐI -->
                                    <div id="mgr-sec-denied" class="block">
                                        <div class="flex items-center gap-2 mb-4 bg-gray-50 border border-gray-200 rounded-md px-3">
                                            <i class="fa-solid fa-magnifying-glass text-gray-400"></i>
                                            <input type="text" placeholder="Tìm kiếm BKS, Lý do, Username..." class="w-full py-2.5 bg-transparent outline-none text-sm" oninput="app.admin.filterManagerData('denied', this.value)">
                                        </div>
                                        <div id="mgr-denied-content" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <p class="text-gray-500 italic col-span-full"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải ảnh bị từ chối...</p>
                                        </div>
                                        <div id="mgr-denied-pager" class="mt-6 w-full flex justify-center"></div>
                                    </div>

                                    <!-- TAB: NHẬT KÝ HOẠT ĐỘNG -->
                                    <div id="mgr-sec-logs" class="hidden">
                                        <div class="flex items-center gap-2 mb-4 bg-gray-50 border border-gray-200 rounded-md px-3">
                                            <i class="fa-solid fa-magnifying-glass text-gray-400"></i>
                                            <input type="text" placeholder="Tìm kiếm nhật ký..." class="w-full py-2.5 bg-transparent outline-none text-sm" oninput="app.admin.filterManagerData('logs', this.value)">
                                        </div>
                                        <div class="overflow-x-auto border border-gray-200 rounded-md">
                                            <table class="w-full text-left text-sm whitespace-nowrap">
                                                <thead class="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-[11px] tracking-wider">
                                                    <tr>
                                                        <th class="p-3">Thời gian</th>
                                                        <th class="p-3">Người thực hiện</th>
                                                        <th class="p-3">Hành động</th>
                                                        <th class="p-3">Chi tiết</th>
                                                    </tr>
                                                </thead>
                                                <tbody id="mgr-logs-content" class="divide-y divide-gray-200">
                                                    <tr><td colspan="4" class="p-4 text-center text-gray-500"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải nhật ký...</td></tr>
                                                </tbody>
                                            </table>
                                        </div>
                                         <div id="mgr-logs-pager" class="mt-6 w-full flex justify-center"></div>
                                     </div>

                                    <!-- TAB: GỬI EMAIL -->
                                    <div id="mgr-sec-email" class="hidden">
                                        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                            <div class="lg:col-span-1 border border-gray-200 rounded-md p-4 flex flex-col h-[500px]">
                                                <h4 class="font-bold text-sm mb-3 uppercase tracking-wider text-gray-600">Chọn người nhận</h4>
                                                <div class="flex items-center gap-2 mb-3 bg-gray-50 border border-gray-200 rounded px-2.5 py-1.5">
                                                    <i class="fa-solid fa-magnifying-glass text-gray-400 text-xs"></i>
                                                    <input type="text" placeholder="Tìm tên, email, role..." class="w-full bg-transparent outline-none text-xs" oninput="app.admin.filterEmailUsers(this.value)">
                                                </div>
                                                <div class="flex justify-between items-center mb-2 pb-2 border-b border-gray-100 text-xs">
                                                    <label class="flex items-center gap-1.5 font-bold cursor-pointer"><input type="checkbox" id="email-select-all" onchange="app.admin.toggleSelectAllEmail(this.checked)"> Chọn tất cả (<span id="email-total-cnt">0</span>)</label>
                                                    <span class="text-blue-600 font-bold" id="email-selected-cnt">0 đã chọn</span>
                                                </div>
                                                <div id="email-user-list" class="flex-1 overflow-y-auto space-y-1 pr-1">
                                                    <p class="text-xs text-gray-400 italic text-center py-4"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải danh sách...</p>
                                                </div>
                                            </div>
                                            <form id="mgr-email-form" onsubmit="app.admin.sendMassEmail(event)" class="lg:col-span-2 border border-gray-200 rounded-md p-4 flex flex-col justify-between">
                                                <div class="space-y-4">
                                                    <h4 class="font-bold text-sm uppercase tracking-wider text-gray-600 mb-2">Soạn thảo nội dung</h4>
                                                    <div>
                                                        <label class="admin-label">Tiêu đề Email <span class="text-red-500">*</span></label>
                                                        <input type="text" id="email-subject" required placeholder="Nhập tiêu đề thông báo..." class="admin-input font-medium" oninput="app.admin.saveEmailDraft()">
                                                    </div>
                                                    <div>
                                                        <label class="admin-label">Nội dung <span class="text-red-500">*</span> (Hỗ trợ xuống dòng)</label>
                                                        <textarea id="email-content" required rows="10" placeholder="Nhập nội dung email gởi đến thành viên..." class="admin-input font-mono text-xs leading-relaxed" oninput="app.admin.saveEmailDraft()"></textarea>
                                                    </div>
                                                </div>
                                                <div class="pt-4 border-t border-gray-100 flex justify-end gap-3 mt-4">
                                                    <button type="button" onclick="app.admin.clearEmailForm()" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded text-xs transition">Xóa trắng</button>
                                                    <button type="submit" id="email-send-btn" class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs shadow transition flex items-center gap-2"><i class="fa-solid fa-paper-plane"></i> Gửi Email Ngay</button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>

                                    <!-- TAB: CÀI ĐẶT HỆ THỐNG (MANAGER) -->
                                    <div id="mgr-sec-settings" class="hidden">
                                        <div class="mb-4 bg-blue-50 border border-blue-200 p-4 rounded-md">
                                            <p class="text-xs text-blue-800 font-medium"><i class="fa-solid fa-circle-info mr-1"></i> <b>Lưu ý:</b> Các công tắc dưới đây ảnh hưởng trực tiếp đến người dùng. "Thời gian dự kiến mở lại" chỉ dùng để hiển thị đếm ngược, hệ thống <b>không</b> tự mở lại khi hết giờ &mdash; bạn phải bật thủ công công tắc để mở lại.</p>
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
                                         <div id="mgr-bans-pager" class="mt-6 w-full flex justify-center"></div>
                                     </div>
                                     </div>

                                     <!-- TAB: GIẢI MÃ DẤU CHÌM BLIND WATERMARK -->
                                     <div id="mgr-sec-blindwm" class="hidden">
                                         <div class="bg-gray-50 border border-gray-200 rounded-md p-4 mb-6">
                                             <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                                 <div>
                                                     <h4 class="font-bold text-sm uppercase tracking-wider text-gray-800 mb-1"><i class="fa-solid fa-fingerprint text-purple-600 mr-2"></i>Công cụ Kiểm định Dấu chìm ẩn (Blind Watermark DCT)</h4>
                                                     <p class="text-xs text-gray-600">Trích xuất và xác thực dấu chìm tần số DCT từ ảnh nghi ngờ (hỗ trợ ảnh đã qua nén hoặc chụp lại).</p>
                                                 </div>
                                                 <div class="flex items-center gap-3">
                                                     <label class="flex items-center gap-1.5 text-xs font-bold text-gray-700 cursor-pointer select-none">
                                                         <input type="checkbox" id="mgr-wm-auto-rst" checked class="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-600 cursor-pointer">
                                                         Tự động dò RST
                                                     </label>
                                                     <label class="flex items-center gap-1.5 text-xs font-bold text-gray-700 cursor-pointer select-none">
                                                         <input type="checkbox" id="mgr-wm-smooth" checked onchange="if(document.getElementById('mgr-wm-canvas-src')?.width > 0) app.admin.extractBlindWmDCT()" class="w-4 h-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer">
                                                         Lọc mịn (Smooth)
                                                     </label>
                                                     <button type="button" id="mgr-wm-reextract-btn" onclick="app.admin.extractBlindWmDCT()" class="hidden px-3 py-1.5 bg-black text-white rounded-md text-xs font-bold hover:bg-gray-800 transition"><i class="fa-solid fa-rotate-right mr-1"></i> Giải mã lại</button>
                                                 </div>
                                             </div>
                                         </div>

                                         <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                             <div class="lg:col-span-1 space-y-4">
                                                 <div id="mgr-wm-drop-zone" ondragover="event.preventDefault(); this.classList.add('border-purple-500','bg-purple-50');" ondragleave="event.preventDefault(); this.classList.remove('border-purple-500','bg-purple-50');" ondrop="event.preventDefault(); this.classList.remove('border-purple-500','bg-purple-50'); if(event.dataTransfer.files.length > 0) app.admin.processBlindWmFile(event.dataTransfer.files[0]);" class="border-2 border-dashed border-gray-300 rounded-md p-6 text-center hover:border-purple-500 transition cursor-pointer bg-white" onclick="document.getElementById('mgr-wm-file-input').click()">
                                                     <i class="fa-solid fa-cloud-arrow-up text-3xl text-gray-400 mb-2"></i>
                                                     <p class="text-xs font-bold text-gray-700 mb-1">1. Ảnh cần kiểm định (Mảnh cắt / bị co giãn)</p>
                                                     <p class="text-[11px] text-gray-500">Bắt buộc có để giải mã lấy dấu chìm Watermark</p>
                                                     <input type="file" id="mgr-wm-file-input" accept="image/*" class="hidden" onchange="if(this.files.length > 0) app.admin.processBlindWmFile(this.files[0])">
                                                 </div>

                                                 <div id="mgr-wm-ref-drop-zone" ondragover="event.preventDefault(); this.classList.add('border-blue-500','bg-blue-50');" ondragleave="event.preventDefault(); this.classList.remove('border-blue-500','bg-blue-50');" ondrop="event.preventDefault(); this.classList.remove('border-blue-500','bg-blue-50'); if(event.dataTransfer.files.length > 0) app.admin.processBlindWmRefFile(event.dataTransfer.files[0]);" class="border-2 border-dashed border-gray-300 rounded-md p-4 text-center hover:border-blue-500 transition cursor-pointer bg-white" onclick="document.getElementById('mgr-wm-ref-input').click()">
                                                     <div class="flex items-center justify-center gap-2.5">
                                                         <i class="fa-solid fa-images text-2xl text-blue-500"></i>
                                                         <div class="text-left">
                                                             <p class="text-xs font-bold text-gray-700">2. Ảnh gốc / toàn cảnh chuẩn (Tùy chọn)</p>
                                                             <p id="mgr-wm-ref-status" class="text-[11px] text-gray-500">Dùng để hệ thống tự ghép tìm tỷ lệ Scale & vị trí viền</p>
                                                         </div>
                                                     </div>
                                                     <input type="file" id="mgr-wm-ref-input" accept="image/*" class="hidden" onchange="if(this.files.length > 0) app.admin.processBlindWmRefFile(this.files[0])">
                                                 </div>

                                                 <div id="mgr-wm-status-box" class="hidden border border-gray-200 rounded-md p-4 bg-white space-y-2.5 text-xs">
                                                     <div class="flex justify-between items-center pb-2 border-b border-gray-100">
                                                         <span class="font-bold text-gray-600">Trạng thái:</span>
                                                         <span id="mgr-wm-badge-status" class="px-2.5 py-0.5 rounded-md font-bold bg-emerald-100 text-emerald-800">Khôi phục thành công</span>
                                                     </div>
                                                     <div class="flex justify-between items-center">
                                                         <span class="text-gray-500">Kích thước ảnh gốc:</span>
                                                         <span id="mgr-wm-info-dim" class="font-mono font-bold text-gray-800">-</span>
                                                     </div>
                                                     <div class="flex justify-between items-center">
                                                         <span class="text-gray-500">Số khối DCT 8x8:</span>
                                                         <span id="mgr-wm-info-blocks" class="font-mono font-bold text-gray-800">-</span>
                                                     </div>
                                                     <div class="flex justify-between items-center">
                                                         <span class="text-gray-500">Thời gian xử lý:</span>
                                                         <span id="mgr-wm-info-time" class="font-mono font-bold text-gray-800">-</span>
                                                     </div>
                                                 </div>
                                                 <div id="mgr-wm-rst-box" class="hidden border border-gray-200 rounded-md p-4 bg-white space-y-3 text-xs">
                                                      <div class="font-bold text-gray-700 pb-1.5 flex justify-between items-center">
                                                          <span><i class="fa-solid fa-shield-halved text-purple-600 mr-1.5"></i>Bù trừ tấn công RST (Co giãn & Cắt viền)</span>
                                                          <button type="button" id="mgr-wm-autoscan-btn" onclick="app.admin.autoScanBlindWmRST()" class="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-md transition text-[11px]"><i class="fa-solid fa-bolt mr-1"></i> Dò tự động lệch viền</button>
                                                      </div>
                                                      <div class="space-y-1">
                                                          <div class="flex justify-between text-[11px] text-gray-600 font-bold">
                                                              <span>Khôi phục co giãn (Scale):</span>
                                                              <span id="mgr-wm-scale-val" class="font-mono text-black">100%</span>
                                                          </div>
                                                          <div class="flex items-center gap-2">
                                                              <input type="range" id="mgr-wm-scale" min="50" max="200" value="100" class="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600" oninput="document.getElementById('mgr-wm-scale-val').innerText = this.value + '%'" onchange="app.admin.applyBlindWmRST()">
                                                              <button type="button" onclick="document.getElementById('mgr-wm-scale').value = 100; document.getElementById('mgr-wm-scale-val').innerText = '100%'; app.admin.applyBlindWmRST();" class="px-1.5 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-[10px] font-bold">100%</button>
                                                          </div>
                                                      </div>
                                                      <div class="space-y-1 pt-1">
                                                          <div class="flex justify-between text-[11px] text-gray-600 font-bold">
                                                              <span>Bù lệch viền X (Crop dX):</span>
                                                              <span id="mgr-wm-dx-val" class="font-mono text-black">0 px</span>
                                                          </div>
                                                          <input type="range" id="mgr-wm-dx" min="0" max="7" value="0" class="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600" oninput="document.getElementById('mgr-wm-dx-val').innerText = this.value + ' px'" onchange="app.admin.applyBlindWmRST()">
                                                      </div>
                                                      <div class="space-y-1">
                                                          <div class="flex justify-between text-[11px] text-gray-600 font-bold">
                                                              <span>Bù lệch viền Y (Crop dY):</span>
                                                              <span id="mgr-wm-dy-val" class="font-mono text-black">0 px</span>
                                                          </div>
                                                          <input type="range" id="mgr-wm-dy" min="0" max="7" value="0" class="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600" oninput="document.getElementById('mgr-wm-dy-val').innerText = this.value + ' px'" onchange="app.admin.applyBlindWmRST()">
                                                      </div>
                                                  </div>
                                             </div>

                                             <div class="lg:col-span-2 space-y-6">
                                                 <div class="border border-gray-200 rounded-md p-4 bg-white">
                                                     <h5 class="font-bold text-xs uppercase tracking-wider text-gray-600 mb-3">1. Ảnh gốc tải lên</h5>
                                                     <div class="bg-gray-50 border border-gray-200 rounded-md p-2 flex items-center justify-center min-h-[200px] max-h-[350px] overflow-auto">
                                                         <canvas id="mgr-wm-canvas-src" class="max-w-full h-auto object-contain"></canvas>
                                                     </div>
                                                 </div>

                                                 <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                     <div class="border border-gray-200 rounded-md p-4 bg-white">
                                                         <h5 class="font-bold text-xs uppercase tracking-wider text-gray-600 mb-3">2. Phân bố tín hiệu toàn ảnh</h5>
                                                         <div class="bg-gray-50 border border-gray-200 rounded-md p-2 flex items-center justify-center min-h-[160px]">
                                                             <canvas id="mgr-wm-canvas-full" class="max-w-full h-auto object-contain"></canvas>
                                                         </div>
                                                     </div>
                                                     <div class="border border-gray-200 rounded-md p-4 bg-white">
                                                         <h5 class="font-bold text-xs uppercase tracking-wider text-gray-600 mb-3">3. Dấu chìm khôi phục (90x60)</h5>
                                                         <div class="bg-gray-50 border border-gray-200 rounded-md p-2 flex items-center justify-center min-h-[160px]">
                                                             <canvas id="mgr-wm-canvas-tile" class="max-w-full h-auto object-contain scale-150"></canvas>
                                                         </div>
                                                     </div>
                                                 </div>
                                             </div>
                                         </div>
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
                    } finally {
                        if (app.admin._activeLoadToken === currentLoadToken) {
                            app.admin._isTabLoading = false;
                            app.admin._activeLoadingTab = null;
                        }
                        if (app.isRealtimeConnected === false && typeof app.setRealtimeStatus === 'function') {
                            app.setRealtimeStatus(false);
                        }
                        if (preserveScroll && typeof savedScrollY === 'number' && savedScrollY > 0) {
                            setTimeout(() => {
                                window.scrollTo({ top: savedScrollY, behavior: 'instant' });
                            }, 50);
                        }
                    }
                },

                // --- PHẦN QUẢN LÝ TAB MANAGER ---
                switchManagerTab: (subTab) => {
                    app.admin.manager.activeTab = subTab;
                    try { sessionStorage.setItem('vbs_mgr_active_tab', subTab); } catch(e){}

                    ['denied', 'logs', 'email', 'settings', 'bans', 'blindwm'].forEach(t => {
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

                processBlindWmFile: (file) => {
                    if (!file) return;
                    const url = URL.createObjectURL(file);
                    const img = new Image();
                    img.onload = () => {
                        app.admin._rawBlindImg = img;
                        app.admin._wmTileOffsetX = 0;
                        app.admin._wmTileOffsetY = 0;
                        app.admin._wmFullX = 0;
                        app.admin._wmFullY = 0;
                        const statusBox = document.getElementById('mgr-wm-status-box');
                        const rstBox = document.getElementById('mgr-wm-rst-box');
                        if (statusBox) statusBox.classList.remove('hidden');
                        if (rstBox) rstBox.classList.remove('hidden');

                        const scaleEl = document.getElementById('mgr-wm-scale');
                        const scaleVal = document.getElementById('mgr-wm-scale-val');
                        const dxEl = document.getElementById('mgr-wm-dx');
                        const dxVal = document.getElementById('mgr-wm-dx-val');
                        const dyEl = document.getElementById('mgr-wm-dy');
                        const dyVal = document.getElementById('mgr-wm-dy-val');
                        if (scaleEl) scaleEl.value = 100;
                        if (scaleVal) scaleVal.innerText = '100%';
                        if (dxEl) dxEl.value = 0;
                        if (dxVal) dxVal.innerText = '0 px';
                        if (dyEl) dyEl.value = 0;
                        if (dyVal) dyVal.innerText = '0 px';

                        URL.revokeObjectURL(url);
                        const autoRst = document.getElementById('mgr-wm-auto-rst');
                        if (autoRst && autoRst.checked) {
                            app.admin.autoScanBlindWmRST();
                        } else {
                            app.admin.applyBlindWmRST();
                        }
                    };
                    img.src = url;
                },

                processBlindWmRefFile: (file) => {
                    if (!file) return;
                    const url = URL.createObjectURL(file);
                    const img = new Image();
                    img.onload = () => {
                        app.admin._refBlindImg = img;
                        app.admin._wmTileOffsetX = 0;
                        app.admin._wmTileOffsetY = 0;
                        app.admin._wmFullX = 0;
                        app.admin._wmFullY = 0;
                        const refStatus = document.getElementById('mgr-wm-ref-status');
                        if (refStatus) refStatus.innerHTML = `<span class="text-blue-600 font-bold"><i class="fa-solid fa-check mr-1"></i>Đã nạp ảnh gốc (${img.width}×${img.height}px)</span>`;
                        URL.revokeObjectURL(url);
                        if (app.admin._rawBlindImg) {
                            const autoRst = document.getElementById('mgr-wm-auto-rst');
                            if (autoRst && autoRst.checked) {
                                app.admin.autoScanBlindWmRST();
                            } else {
                                app.admin.applyBlindWmRST();
                            }
                        }
                    };
                    img.src = url;
                },

                ensureBlindWmDCT: () => {
                    if (app.admin._dctT && app.admin._dctTt) return;
                    const T = new Float32Array(64);
                    const Tt = new Float32Array(64);
                    const alpha0 = 1.0 / Math.sqrt(2.0);
                    for (let u = 0; u < 8; u++) {
                        const alpha = (u === 0) ? alpha0 : 1.0;
                        for (let x = 0; x < 8; x++) {
                            const val = 0.5 * alpha * Math.cos(((2 * x + 1) * u * Math.PI) / 16.0);
                            T[u * 8 + x] = val;
                            Tt[x * 8 + u] = val;
                        }
                    }
                    app.admin._dctT = T;
                    app.admin._dctTt = Tt;
                },

                applyBlindWmRST: () => {
                    const img = app.admin._rawBlindImg;
                    const canvasSrc = document.getElementById('mgr-wm-canvas-src');
                    if (!img || !canvasSrc) return;
                    const scale = parseInt(document.getElementById('mgr-wm-scale')?.value || 100) / 100;
                    const dx = parseInt(document.getElementById('mgr-wm-dx')?.value || 0);
                    const dy = parseInt(document.getElementById('mgr-wm-dy')?.value || 0);

                    const targetW = Math.max(64, Math.round(img.width * scale));
                    const targetH = Math.max(64, Math.round(img.height * scale));

                    canvasSrc.width = Math.max(64, targetW - dx);
                    canvasSrc.height = Math.max(64, targetH - dy);
                    const ctx = canvasSrc.getContext('2d');
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.clearRect(0, 0, canvasSrc.width, canvasSrc.height);
                    ctx.drawImage(img, -dx, -dy, targetW, targetH);

                    app.admin.extractBlindWmDCT();
                },

                autoFindPyramidMatch: async (refImg, patchImg) => {
                    const statusEl = document.getElementById('mgr-wm-ref-status');
                    if (statusEl) statusEl.innerHTML = `<span class="text-purple-600 font-bold"><i class="fa-solid fa-spinner fa-spin mr-1"></i>Đang đối chiếu mảnh cắt với ảnh gốc qua tháp kim tự tháp (Pyramid Matching)...</span>`;
                    await new Promise(r => setTimeout(r, 20));

                    const getGray = (img, w, h) => {
                        const canvas = document.createElement('canvas');
                        canvas.width = w;
                        canvas.height = h;
                        const ctx = canvas.getContext('2d', { willReadFrequently: true });
                        ctx.drawImage(img, 0, 0, w, h);
                        const data = ctx.getImageData(0, 0, w, h).data;
                        const gray = new Float32Array(w * h);
                        for (let i = 0; i < w * h; i++) {
                            gray[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
                        }
                        return gray;
                    };

                    const computeNCC = (I, iw, ih, T, tw, th, x, y, muT, sigT) => {
                        if (x + tw > iw || y + th > ih || x < 0 || y < 0) return -1;
                        let sumW = 0;
                        for (let ty = 0; ty < th; ty++) {
                            const py = (y + ty) * iw + x;
                            for (let tx = 0; tx < tw; tx++) {
                                sumW += I[py + tx];
                            }
                        }
                        const muW = sumW / (tw * th);
                        let num = 0, sumSqW = 0;
                        for (let ty = 0; ty < th; ty++) {
                            const py = (y + ty) * iw + x;
                            const rowT = ty * tw;
                            for (let tx = 0; tx < tw; tx++) {
                                const valW = I[py + tx] - muW;
                                const valT = T[rowT + tx] - muT;
                                num += valW * valT;
                                sumSqW += valW * valW;
                            }
                        }
                        const sigW = Math.sqrt(sumSqW);
                        if (sigW < 1e-5 || sigT < 1e-5) return 0;
                        return num / (sigW * sigT);
                    };

                    const coarseMax = 200;
                    const coarseRatio = Math.min(1.0, coarseMax / Math.max(refImg.width, refImg.height));
                    const cw = Math.max(16, Math.round(refImg.width * coarseRatio));
                    const ch = Math.max(16, Math.round(refImg.height * coarseRatio));
                    const coarseRef = getGray(refImg, cw, ch);

                    let bestCandidate = { s: 1.0, x: 0, y: 0, score: -2 };
                    const coarseCandidates = [];

                    for (let s = 0.35; s <= 2.50; s += 0.05) {
                        const pw = Math.round(patchImg.width * coarseRatio * s);
                        const ph = Math.round(patchImg.height * coarseRatio * s);
                        if (pw < 8 || ph < 8 || pw > cw || ph > ch) continue;

                        const coarsePatch = getGray(patchImg, pw, ph);
                        let sumT = 0;
                        for (let i = 0; i < pw * ph; i++) sumT += coarsePatch[i];
                        const muT = sumT / (pw * ph);
                        let sumSqT = 0;
                        for (let i = 0; i < pw * ph; i++) {
                            const val = coarsePatch[i] - muT;
                            sumSqT += val * val;
                        }
                        const sigT = Math.sqrt(sumSqT);
                        if (sigT < 1e-5) continue;

                        const stepX = Math.max(1, Math.floor((cw - pw) / 30));
                        const stepY = Math.max(1, Math.floor((ch - ph) / 30));
                        for (let y = 0; y <= ch - ph; y += stepY) {
                            for (let x = 0; x <= cw - pw; x += stepX) {
                                const score = computeNCC(coarseRef, cw, ch, coarsePatch, pw, ph, x, y, muT, sigT);
                                if (score > bestCandidate.score) {
                                    bestCandidate = { s, x, y, score };
                                }
                                coarseCandidates.push({ s, x, y, score });
                            }
                        }
                    }

                    coarseCandidates.sort((a, b) => b.score - a.score);
                    const topCoarse = coarseCandidates.slice(0, 5);

                    const medMax = 450;
                    const medRatio = Math.min(1.0, medMax / Math.max(refImg.width, refImg.height));
                    const mw = Math.max(32, Math.round(refImg.width * medRatio));
                    const mh = Math.max(32, Math.round(refImg.height * medRatio));
                    const medRef = getGray(refImg, mw, mh);

                    let medBest = { s: bestCandidate.s, x: 0, y: 0, score: -2 };
                    for (const c of topCoarse) {
                        for (let s = Math.max(0.35, c.s - 0.06); s <= Math.min(2.50, c.s + 0.06); s += 0.015) {
                            const pw = Math.round(patchImg.width * medRatio * s);
                            const ph = Math.round(patchImg.height * medRatio * s);
                            if (pw < 8 || ph < 8 || pw > mw || ph > mh) continue;

                            const medPatch = getGray(patchImg, pw, ph);
                            let sumT = 0;
                            for (let i = 0; i < pw * ph; i++) sumT += medPatch[i];
                            const muT = sumT / (pw * ph);
                            let sumSqT = 0;
                            for (let i = 0; i < pw * ph; i++) {
                                const val = medPatch[i] - muT;
                                sumSqT += val * val;
                            }
                            const sigT = Math.sqrt(sumSqT);
                            if (sigT < 1e-5) continue;

                            const approxX = Math.round(c.x * (medRatio / coarseRatio));
                            const approxY = Math.round(c.y * (medRatio / coarseRatio));

                            for (let dy = -6; dy <= 6; dy += 2) {
                                for (let dx = -6; dx <= 6; dx += 2) {
                                    const x = approxX + dx;
                                    const y = approxY + dy;
                                    const score = computeNCC(medRef, mw, mh, medPatch, pw, ph, x, y, muT, sigT);
                                    if (score > medBest.score) {
                                        medBest = { s, x, y, score };
                                    }
                                }
                            }
                        }
                    }

                    const fullX = Math.round(medBest.x / medRatio);
                    const fullY = Math.round(medBest.y / medRatio);
                    const fullScale = medBest.s;

                    const restoredScalePct = Math.round((1.0 / fullScale) * 100);
                    const clampedScale = Math.min(200, Math.max(50, restoredScalePct));

                    const dx = ((fullX % 8) + 8) % 8;
                    const dy = ((fullY % 8) + 8) % 8;

                    const scaleEl = document.getElementById('mgr-wm-scale');
                    const scaleVal = document.getElementById('mgr-wm-scale-val');
                    const dxEl = document.getElementById('mgr-wm-dx');
                    const dxVal = document.getElementById('mgr-wm-dx-val');
                    const dyEl = document.getElementById('mgr-wm-dy');
                    const dyVal = document.getElementById('mgr-wm-dy-val');

                    if (scaleEl) scaleEl.value = clampedScale;
                    if (scaleVal) scaleVal.innerText = clampedScale + '%';
                    if (dxEl) dxEl.value = dx;
                    if (dxVal) dxVal.innerText = dx + ' px';
                    if (dyEl) dyEl.value = dy;
                    if (dyVal) dyVal.innerText = dy + ' px';

                    app.admin._wmTileOffsetX = Math.floor((fullX - dx) / 8) % 90;
                    app.admin._wmTileOffsetY = Math.floor((fullY - dy) / 8) % 60;
                    app.admin._wmFullX = fullX - dx;
                    app.admin._wmFullY = fullY - dy;

                    const btn = document.getElementById('mgr-wm-autoscan-btn');
                    if (btn) btn.innerHTML = `<i class="fa-solid fa-bolt mr-1"></i> Dò tự động lệch viền`;

                    if (statusEl) {
                        const matchPct = Math.min(100, Math.round(Math.max(0, medBest.score) * 100));
                        statusEl.innerHTML = `<span class="text-emerald-700 font-bold"><i class="fa-solid fa-check-double mr-1"></i>Đã ghép mảnh cắt vào ảnh gốc! Tỷ lệ ảnh: ${Math.round(fullScale*100)}% -> Scale khôi phục: ${clampedScale}%, Tọa độ: (${fullX}, ${fullY}) [Khớp: ${matchPct}%]</span>`;
                    }
                    app.admin.applyBlindWmRST();
                },

                autoScanBlindWmRST: async () => {
                    const img = app.admin._rawBlindImg;
                    const canvasSrc = document.getElementById('mgr-wm-canvas-src');
                    if (!img || !canvasSrc) return;

                    const btn = document.getElementById('mgr-wm-autoscan-btn');
                    if (btn) btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1"></i> Đang dò lệch viền...`;
                    await new Promise(r => setTimeout(r, 20));

                    if (app.admin._refBlindImg && img.width > 0) {
                        await app.admin.autoFindPyramidMatch(app.admin._refBlindImg, img);
                        return;
                    }

                    let scale = parseInt(document.getElementById('mgr-wm-scale')?.value || 100) / 100;
                    const targetW = Math.max(64, Math.round(img.width * scale));
                    const targetH = Math.max(64, Math.round(img.height * scale));

                    app.admin.ensureBlindWmDCT();
                    const T = app.admin._dctT;
                    const Tt = app.admin._dctTt;
                    if (!T || !Tt) return;

                    const gridW = 90;
                    const gridH = 60;
                    let bestDX = 0, bestDY = 0, bestScore = -1;

                    for (let dy = 0; dy < 8; dy++) {
                        for (let dx = 0; dx < 8; dx++) {
                            const w = targetW - dx;
                            const h = targetH - dy;
                            const blocksX = Math.floor(w / 8);
                            const blocksY = Math.floor(h / 8);
                            if (blocksX <= 0 || blocksY <= 0) continue;

                            canvasSrc.width = w;
                            canvasSrc.height = h;
                            const ctx = canvasSrc.getContext('2d', { willReadFrequently: true });
                            ctx.drawImage(img, -dx, -dy, targetW, targetH);
                            const data = ctx.getImageData(0, 0, w, h).data;

                            const tileAcc = new Float32Array(gridW * gridH);
                            const tileCount = new Uint32Array(gridW * gridH);
                            const block = new Float32Array(64);
                            const temp = new Float32Array(64);
                            const dct = new Float32Array(64);

                            for (let by = 0; by < blocksY; by++) {
                                for (let bx = 0; bx < blocksX; bx++) {
                                    for (let y = 0; y < 8; y++) {
                                        const py = (by * 8 + y) * w;
                                        for (let x = 0; x < 8; x++) {
                                            const idx = (py + (bx * 8 + x)) * 4;
                                            block[y * 8 + x] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2] - 128.0;
                                        }
                                    }
                                    for (let row = 0; row < 8; row++) {
                                        for (let col = 0; col < 8; col++) {
                                            let sum = 0.0;
                                            for (let k = 0; k < 8; k++) sum += T[row * 8 + k] * block[k * 8 + col];
                                            temp[row * 8 + col] = sum;
                                        }
                                    }
                                    for (let row = 0; row < 8; row++) {
                                        for (let col = 0; col < 8; col++) {
                                            let sum = 0.0;
                                            for (let k = 0; k < 8; k++) sum += temp[row * 8 + k] * Tt[k * 8 + col];
                                            dct[row * 8 + col] = sum;
                                        }
                                    }
                                    const diff = (dct[3 * 8 + 2] - dct[2 * 8 + 3]) + (dct[4 * 8 + 2] - dct[2 * 8 + 4]) + (dct[4 * 8 + 3] - dct[3 * 8 + 4]);
                                    const gx = bx % gridW;
                                    const gy = by % gridH;
                                    tileAcc[gy * gridW + gx] += diff;
                                    tileCount[gy * gridW + gx]++;
                                }
                            }

                            let mean = 0, count = 0;
                            for (let i = 0; i < gridW * gridH; i++) {
                                if (tileCount[i] > 0) {
                                    mean += tileAcc[i] / tileCount[i];
                                    count++;
                                }
                            }
                            if (count > 0) mean /= count;
                            let variance = 0;
                            for (let i = 0; i < gridW * gridH; i++) {
                                if (tileCount[i] > 0) {
                                    const val = (tileAcc[i] / tileCount[i]) - mean;
                                    variance += val * val;
                                }
                            }
                            if (count > 0) variance /= count;

                            if (variance > bestScore) {
                                bestScore = variance;
                                bestDX = dx;
                                bestDY = dy;
                            }
                        }
                    }

                    const dxInput = document.getElementById('mgr-wm-dx');
                    const dyInput = document.getElementById('mgr-wm-dy');
                    const dxVal = document.getElementById('mgr-wm-dx-val');
                    const dyVal = document.getElementById('mgr-wm-dy-val');
                    if (dxInput) dxInput.value = bestDX;
                    if (dyInput) dyInput.value = bestDY;
                    if (dxVal) dxVal.innerText = bestDX + ' px';
                    if (dyVal) dyVal.innerText = bestDY + ' px';

                    if (btn) btn.innerHTML = `<i class="fa-solid fa-bolt mr-1"></i> Dò tự động lệch viền`;
                    app.admin.applyBlindWmRST();
                },

                extractBlindWmDCT: () => {
                    const startTime = performance.now();
                    const canvasSrc = document.getElementById('mgr-wm-canvas-src');
                    const canvasFull = document.getElementById('mgr-wm-canvas-full');
                    const canvasTile = document.getElementById('mgr-wm-canvas-tile');
                    if (!canvasSrc || !canvasFull || !canvasTile || canvasSrc.width === 0) return;

                    app.admin.ensureBlindWmDCT();
                    const T = app.admin._dctT;
                    const Tt = app.admin._dctTt;

                    const width = canvasSrc.width;
                    const height = canvasSrc.height;
                    const ctxSrc = canvasSrc.getContext('2d');
                    const imgData = ctxSrc.getImageData(0, 0, width, height);
                    const data = imgData.data;

                    const blocksX = Math.floor(width / 8);
                    const blocksY = Math.floor(height / 8);

                    canvasFull.width = blocksX;
                    canvasFull.height = blocksY;
                    const ctxFull = canvasFull.getContext('2d');
                    const fullImgData = ctxFull.createImageData(blocksX, blocksY);
                    const fullPixels = fullImgData.data;

                    const gridW = 90;
                    const gridH = 60;
                    const tileAcc = new Float32Array(gridW * gridH);
                    const tileCount = new Uint32Array(gridW * gridH);

                    const block = new Float32Array(64);
                    const temp = new Float32Array(64);
                    const dct = new Float32Array(64);
                    const chkSmooth = document.getElementById('mgr-wm-smooth');
                    const isSmooth = chkSmooth ? chkSmooth.checked : true;

                    const blockDiffs = new Float32Array(blocksX * blocksY);
                    const allDiffsList = [];

                    for (let by = 0; by < blocksY; by++) {
                        for (let bx = 0; bx < blocksX; bx++) {
                            for (let y = 0; y < 8; y++) {
                                const py = (by * 8 + y) * width;
                                for (let x = 0; x < 8; x++) {
                                    const idx = (py + (bx * 8 + x)) * 4;
                                    const r = data[idx];
                                    const g = data[idx + 1];
                                    const b = data[idx + 2];
                                    block[y * 8 + x] = 0.299 * r + 0.587 * g + 0.114 * b - 128.0;
                                }
                            }

                            for (let row = 0; row < 8; row++) {
                                for (let col = 0; col < 8; col++) {
                                    let sum = 0.0;
                                    for (let k = 0; k < 8; k++) { sum += T[row * 8 + k] * block[k * 8 + col]; }
                                    temp[row * 8 + col] = sum;
                                }
                            }
                            for (let row = 0; row < 8; row++) {
                                for (let col = 0; col < 8; col++) {
                                    let sum = 0.0;
                                    for (let k = 0; k < 8; k++) { sum += temp[row * 8 + k] * Tt[k * 8 + col]; }
                                    dct[row * 8 + col] = sum;
                                }
                            }

                            const clampPair = (v) => Math.max(-4.5, Math.min(13.5, v));
                            const diff1 = clampPair(dct[3 * 8 + 2] - dct[2 * 8 + 3]);
                            const diff2 = clampPair(dct[4 * 8 + 2] - dct[2 * 8 + 4]);
                            const diff3 = clampPair(dct[4 * 8 + 3] - dct[3 * 8 + 4]);
                            const diff = diff1 + diff2 + diff3;

                            blockDiffs[by * blocksX + bx] = diff;
                            allDiffsList.push(diff);

                            const offX = app.admin._wmTileOffsetX || 0;
                            const offY = app.admin._wmTileOffsetY || 0;
                            const gx = ((bx + offX) % gridW + gridW) % gridW;
                            const gy = ((by + offY) % gridH + gridH) % gridH;
                            const tileIdx = gy * gridW + gx;
                            tileAcc[tileIdx] += diff;
                            tileCount[tileIdx]++;
                        }
                    }

                    allDiffsList.sort((a, b) => a - b);
                    let fp5 = -4.0, fp95 = 38.0;
                    if (allDiffsList.length > 5) {
                        fp5 = allDiffsList[Math.floor(allDiffsList.length * 0.05)];
                        fp95 = allDiffsList[Math.floor(allDiffsList.length * 0.95)];
                        if (fp95 - fp5 < 1.0) {
                            const mid = (fp5 + fp95) / 2.0;
                            fp5 = mid - 5.0;
                            fp95 = mid + 5.0;
                        }
                    }
                    const fpMid = (fp5 + fp95) / 2.0;

                    for (let by = 0; by < blocksY; by++) {
                        for (let bx = 0; bx < blocksX; bx++) {
                            const diff = blockDiffs[by * blocksX + bx];
                            const fullIdx = (by * blocksX + bx) * 4;
                            let val = 0;
                            if (isSmooth) {
                                val = Math.round(((diff - fp5) / (fp95 - fp5)) * 255.0);
                                val = Math.min(255, Math.max(0, val));
                            } else {
                                val = diff > fpMid ? 255 : 0;
                            }
                            fullPixels[fullIdx] = val;
                            fullPixels[fullIdx + 1] = val;
                            fullPixels[fullIdx + 2] = val;
                            fullPixels[fullIdx + 3] = 255;
                        }
                    }

                    ctxFull.putImageData(fullImgData, 0, 0);

                    const validTileDiffs = [];
                    for (let i = 0; i < gridW * gridH; i++) {
                        if (tileCount[i] > 0) {
                            validTileDiffs.push(tileAcc[i] / tileCount[i]);
                        }
                    }
                    validTileDiffs.sort((a, b) => a - b);
                    let tp5 = -3.0, tp95 = 35.0;
                    if (validTileDiffs.length > 5) {
                        tp5 = validTileDiffs[Math.floor(validTileDiffs.length * 0.06)];
                        tp95 = validTileDiffs[Math.floor(validTileDiffs.length * 0.94)];
                        if (tp95 - tp5 < 1.0) {
                            const mid = (tp5 + tp95) / 2.0;
                            tp5 = mid - 5.0;
                            tp95 = mid + 5.0;
                        }
                    }
                    const tpMid = (tp5 + tp95) / 2.0;

                    canvasTile.width = gridW;
                    canvasTile.height = gridH;
                    const ctxTile = canvasTile.getContext('2d');
                    const tileImgData = ctxTile.createImageData(gridW, gridH);
                    const tilePixels = tileImgData.data;

                    for (let i = 0; i < gridW * gridH; i++) {
                        const idx = i * 4;
                        if (tileCount[i] > 0) {
                            const avgDiff = tileAcc[i] / tileCount[i];
                            let color = 0;
                            if (isSmooth) {
                                color = Math.round(((avgDiff - tp5) / (tp95 - tp5)) * 255.0);
                                color = Math.min(255, Math.max(0, color));
                            } else {
                                color = avgDiff > tpMid ? 255 : 0;
                            }
                            tilePixels[idx] = color;
                            tilePixels[idx + 1] = color;
                            tilePixels[idx + 2] = color;
                            tilePixels[idx + 3] = 255;
                        } else {
                            tilePixels[idx] = 12;
                            tilePixels[idx + 1] = 14;
                            tilePixels[idx + 2] = 20;
                            tilePixels[idx + 3] = 255;
                        }
                    }
                    ctxTile.putImageData(tileImgData, 0, 0);

                    const elapsed = (performance.now() - startTime).toFixed(1);
                    const statusBox = document.getElementById('mgr-wm-status-box');
                    const reextractBtn = document.getElementById('mgr-wm-reextract-btn');
                    const infoDim = document.getElementById('mgr-wm-info-dim');
                    const infoBlocks = document.getElementById('mgr-wm-info-blocks');
                    const infoTime = document.getElementById('mgr-wm-info-time');
                    const badgeStatus = document.getElementById('mgr-wm-badge-status');

                    if (statusBox) statusBox.classList.remove('hidden');
                    if (reextractBtn) reextractBtn.classList.remove('hidden');
                    if (infoDim) infoDim.innerText = `${width} × ${height} px`;
                    if (infoBlocks) infoBlocks.innerText = `${blocksX.toLocaleString()} × ${blocksY.toLocaleString()} (${(blocksX * blocksY).toLocaleString()} khối)`;
                    if (infoTime) infoTime.innerText = `${elapsed} ms`;
                    if (badgeStatus) {
                        badgeStatus.className = "px-2.5 py-0.5 rounded-md font-bold bg-emerald-100 text-emerald-800";
                        badgeStatus.innerText = "Khôi phục thành công";
                    }
                },

                _managerSearchTimeout: null,
                
                fetchManagerData: async (type) => {
                    try {
                        const state = app.admin.manager[type];
                        state.page = state.page || 1;
                        const q = state.searchQuery || '';

                        if (type === 'denied') {
                            const perPage = 50;
                            const fromRow = (state.page - 1) * perPage;
                            const toRow = fromRow + perPage - 1;
                            let photos = [];
                            let total = 0;
                            try {
                                let query = window.sb.from('photos').select('*, profiles(username)', {count: 'estimated'}).eq('status', 'denied').order('created_at', {ascending: false});
                                if (q) {
                                    query = query.or(`license_plate.ilike.%${q}%,denial_reason.ilike.%${q}%`);
                                }
                                const { data: pData, count } = await query.range(fromRow, toRow);
                                if (pData && pData.length > 0) photos = pData;
                                total = count || 0;
                            } catch(e){}

                            const { data: logs } = await window.sb.from('admin_audit_logs').select('target_id, profiles(username)').eq('action_type', 'deny_photo');
                            const denierMap = {};
                            if(logs) logs.forEach(l => { denierMap[l.target_id] = l.profiles?.username || 'Admin'; });
                            if (photos && photos.length > 0) await app.utils.resolveSandboxUrls(photos);
                            state.data = photos ||[];
                            state.total = total;
                            state.denierMap = denierMap;
                        }
                        else if (type === 'logs') {
                            const perPage = 50;
                            const fromRow = (state.page - 1) * perPage;
                            const toRow = fromRow + perPage - 1;
                            
                            let query = window.sb.from('admin_audit_logs').select('*, profiles(username)', {count: 'estimated'}).order('created_at', {ascending: false});
                            if (q) {
                                query = query.or(`action_type.ilike.%${q}%,target_id.ilike.%${q}%`);
                            }
                            const { data: logs, count } = await query.range(fromRow, toRow);
                            state.data = logs ||[];
                            state.total = count || 0;
                        }
                        else if (type === 'bans') {
                            const perPage = 15;
                            const { data: { session } } = await window.sb.auth.getSession();
                            const payload = { 
                                action: 'get_users', 
                                page: state.page, 
                                limit: perPage,
                                search: q,
                                status: state.currentFilter || 'all'
                            };
                            const response = await fetch('/api/manager', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                                body: JSON.stringify(payload)
                            });
                            const result = await response.json();
                            if (!result.success) throw new Error(result.error);
                            state.data = result.users || [];
                            state.total = result.total || 0;
                        }

                        app.admin.renderManagerData(type);
                    } catch (e) {
                        console.error("Lỗi fetch data manager:", e);
                        const contentEl = document.getElementById(`mgr-${type}-content`);
                        if (contentEl && (contentEl.innerHTML.includes('Đang tải') || contentEl.innerHTML.trim() === '')) {
                            contentEl.innerHTML = `<p class="text-red-500 col-span-full py-4 text-sm px-4">Không thể tải dữ liệu: ${e.message || 'Lỗi kết nối'}</p>`;
                        }
                    }
                },

                filterManagerData: (type, query, statusArg) => {
                    const q = (query || '').toLowerCase().trim();
                    const state = app.admin.manager[type];
                    state.searchQuery = q;
                    if (type === 'bans') {
                        state.currentFilter = statusArg || state.currentFilter || 'all';
                    }
                    state.page = 1;
                    
                    if (app.admin._managerSearchTimeout) clearTimeout(app.admin._managerSearchTimeout);
                    app.admin._managerSearchTimeout = setTimeout(() => {
                        app.admin.fetchManagerData(type);
                    }, 400);
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
                            <td class="p-3 font-bold text-black text-[12px]">${app.utils.cleanText(c.profiles?.username || 'Ẩn danh')}</td>
                            <td class="p-3 text-blue-600 font-black cursor-pointer" onclick="app.views.loadDetail(${c.photo_id})">${app.utils.cleanText(c.photos?.license_plate || 'N/A')}</td>
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

                renderManagerData: async (type) => {
                    const state = app.admin.manager[type];
                    const perPage = (type === 'denied' || type === 'logs') ? 50 : 15;
                    const totalPages = Math.ceil((state.total || 0) / perPage) || 1;
                    const slice = state.data || [];
                    const contentEl = document.getElementById(`mgr-${type}-content`);
                    const pagerElId = `mgr-${type}-pager`;

                    if (slice.length === 0) {
                        contentEl.innerHTML = `<p class="text-gray-500 col-span-full py-4 text-sm px-4">Không tìm thấy dữ liệu.</p>`;
                        document.getElementById(pagerElId).innerHTML = '';
                        return;
                    }

                    if (type === 'denied') {
                        await app.utils.resolveSandboxUrls(slice);
                        contentEl.innerHTML = slice.map(p => {
                            const proxyUrl = app.utils.getProxiedUrl(p.url, 'thumb.jpg', 'thumb');
                            const uploader = app.utils.cleanText(p.profiles?.username || 'Ẩn danh');
                            const denier = app.utils.cleanText(state.denierMap[p.id] || 'Admin');
                            const time = new Date(p.created_at).toLocaleDateString('vi-VN');
                            const imgHtml = proxyUrl === 'SANDBOX_DELETED'
                                ? `<div class="w-24 h-24 rounded bg-gray-100 shrink-0 border border-gray-200 flex flex-col items-center justify-center text-center p-1 text-[10px] text-gray-400 font-medium"><i class="fa-solid fa-image-slash text-base mb-1"></i>Ảnh tạm đã xóa</div>`
                                : `<img src="${proxyUrl}" class="w-24 h-24 object-cover rounded bg-gray-100 shrink-0 border border-gray-200" onerror="this.onerror=null; this.src='https://files.catbox.moe/zzh1q1.png';">`;
                            return `<div class="flex gap-4 p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md cursor-pointer transition items-start" onclick="app.views.loadDetail('${p.id}')">
                                ${imgHtml}
                                <div class="flex flex-col h-24 justify-between overflow-hidden w-full">
                                    <div><h4 class="font-bold text-sm text-black truncate uppercase">${app.utils.cleanText(p.license_plate)}</h4><p class="text-xs text-red-600 font-medium line-clamp-2 mt-1"><i class="fa-solid fa-triangle-exclamation mr-1"></i> ${app.utils.cleanText(p.denial_reason)}</p></div>
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
                                    ${Array.isArray(u.known_ips) && u.known_ips.length > 0 ? `<div class="text-[10px] text-gray-600 font-mono mt-0.5 truncate max-w-[180px]" title="IPs: ${u.known_ips.join(', ')}"><i class="fa-solid fa-network-wired text-gray-400 mr-1"></i>${u.known_ips.join(', ')}</div>` : ''}
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
                            return `<tr class="hover:bg-gray-50 transition"><td class="p-3 text-[11px] text-gray-500">${time}</td><td class="p-3 font-bold text-black text-[12px]">${app.utils.cleanText(log.profiles?.username || 'Unknown')}</td><td class="p-3">${app.utils.cleanText(log.action_type)}</td><td class="p-3 text-[10px] font-mono">${app.utils.cleanText(log.target_id || '-')}</td><td class="p-3 text-[11px] break-all">${app.utils.cleanText(JSON.stringify(log.details))}</td></tr>`;
                        }).join('');
                    }
                    if (totalPages > 1) {
                        const pEl = document.getElementById(pagerElId);
                        pEl.className = 'col-span-full mt-4';
                        app.utils.renderPagination(pagerElId, state.page, totalPages, (newPage) => {
                            state.page = newPage;
                            app.admin.fetchManagerData(type);
                        });
                    } else {
                        document.getElementById(pagerElId).innerHTML = '';
                    }
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
                    if (app.role !== 'manager') return app.ui.showAlert("Chỉ Quản lý mới có quyền này.");
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
                    if (app.role !== 'manager') return app.ui.showAlert("Chỉ Quản lý mới có quyền này.");
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
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                            body: JSON.stringify({ action: 'ban', targetUserId: userId, reason: reason })
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
                    if (app.role !== 'manager') return app.ui.showAlert("Chỉ Quản lý mới có quyền này.");
                    
                    app.ui.showAlert("Bạn có chắc muốn gỡ cấm tài khoản này không?", async () => {
                        try {
                            const { data: { session } } = await window.sb.auth.getSession();
                            const response = await fetch('/api/manager', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                                body: JSON.stringify({ action: 'unban', targetUserId: userId })
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
                    if (app.role !== 'manager') return app.ui.showAlert("Chỉ Quản lý mới có quyền này.");
                    
                    app.ui.showAlert("LƯU Ý: Hành động này sẽ XÓA VĨNH VIỄN tài khoản người dùng và không thể khôi phục. Bạn có chắc chắn muốn xóa không?", async () => {
                        try {
                            const { data: { session } } = await window.sb.auth.getSession();
                            const response = await fetch('/api/manager', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                                body: JSON.stringify({ action: 'delete_user', targetUserId: userId })
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
                _emailUsersRaw: [],

                fetchUsersForEmail: async () => {
                    try {
                        const { data: users } = await window.sb.from('profiles').select('id, username, role').order('created_at', { ascending: false });
                        if (users) {
                            app.admin._emailUsersRaw = users;
                            app.admin.renderEmailUserList(users);
                            if (app.admin.manager?.activeTab === 'email') {
                                app.admin.restoreEmailDraft();
                            }
                        }
                    } catch (e) { console.error("Lỗi lấy danh sách user:", e); }
                },

                renderEmailUserList: (users) => {
                    const listEl = document.getElementById('email-user-list');
                    if (!listEl) return;
                    listEl.innerHTML = '';
                    
                    const customId = 'custom';
                    const customDiv = document.createElement('div');
                    customDiv.className = 'flex items-center gap-2 p-2 hover:bg-gray-50 rounded border border-transparent hover:border-gray-100 transition';
                    customDiv.innerHTML = `
                        <input type="checkbox" id="email-u-${customId}" value="${customId}" class="email-user-cb cursor-pointer" onchange="app.admin.updateEmailSelectedCount(); app.admin.toggleEmailCustom();">
                        <label for="email-u-${customId}" class="cursor-pointer flex-1 select-none">
                            <p class="text-xs font-bold text-gray-800">Tùy chỉnh (Nhập địa chỉ)</p>
                            <p class="text-[10px] text-gray-500">Gửi đến người ngoài hệ thống</p>
                        </label>
                    `;
                    listEl.appendChild(customDiv);

                    const customInputDiv = document.createElement('div');
                    customInputDiv.id = 'email-custom-input-box';
                    customInputDiv.className = 'hidden mb-2 px-2';
                    customInputDiv.innerHTML = `<input type="text" id="email-custom-address" placeholder="Nhập email (ngăn cách bằng dấu phẩy)..." class="w-full text-xs p-2 border border-gray-300 rounded focus:border-black outline-none" oninput="app.admin.saveEmailDraft()">`;
                    listEl.appendChild(customInputDiv);

                    users.forEach(u => {
                        const div = document.createElement('div');
                        div.className = 'flex items-center gap-2 p-2 hover:bg-gray-50 rounded border border-transparent hover:border-gray-100 transition';
                        div.innerHTML = `
                            <input type="checkbox" id="email-u-${u.id}" value="${u.id}" class="email-user-cb cursor-pointer" onchange="app.admin.updateEmailSelectedCount()">
                            <label for="email-u-${u.id}" class="cursor-pointer flex-1 select-none flex items-center justify-between">
                                <div>
                                    <p class="text-xs font-bold text-gray-800">${app.utils.escapeHtml(u.username)}</p>
                                    <p class="text-[10px] text-gray-500">${app.utils.escapeHtml(u.id)}</p>
                                </div>
                                <span class="text-[9px] px-1.5 py-0.5 rounded ${u.role === 'manager' || u.role === 'admin' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'} font-bold uppercase">${u.role}</span>
                            </label>
                        `;
                        listEl.appendChild(div);
                    });

                    document.getElementById('email-total-cnt').innerText = users.length;
                    app.admin.updateEmailSelectedCount();
                },

                filterEmailUsers: (term) => {
                    if (!app.admin._emailUsersRaw) return;
                    const lower = term.toLowerCase().trim();
                    const filtered = app.admin._emailUsersRaw.filter(u => 
                        (u.username && u.username.toLowerCase().includes(lower)) || 
                        (u.id && u.id.toLowerCase().includes(lower)) || 
                        (u.role && u.role.toLowerCase().includes(lower))
                    );
                    app.admin.renderEmailUserList(filtered);
                },

                toggleSelectAllEmail: (isChecked) => {
                    const cbs = document.querySelectorAll('.email-user-cb');
                    cbs.forEach(cb => {
                        if (cb.value !== 'custom') cb.checked = isChecked;
                    });
                    app.admin.updateEmailSelectedCount();
                },

                updateEmailSelectedCount: () => {
                    const cbs = document.querySelectorAll('.email-user-cb:checked');
                    const cntEl = document.getElementById('email-selected-cnt');
                    if (cntEl) cntEl.innerText = `${cbs.length} đã chọn`;
                },

                toggleEmailCustom: () => {
                    const cb = document.getElementById('email-u-custom');
                    const box = document.getElementById('email-custom-input-box');
                    if (cb && cb.checked) {
                        box.classList.remove('hidden');
                    } else if (box) {
                        box.classList.add('hidden');
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
                    if (!previewBox) return;
                    if (previewBox.classList.contains('hidden')) {
                        previewBox.classList.remove('hidden');
                        previewBox.innerHTML = DOMPurify.sanitize(app.admin.formatEmailMarkdown(content || '*Chưa có nội dung*'));
                    } else {
                        previewBox.classList.add('hidden');
                    }
                },

                clearEmailForm: () => {
                    const form = document.getElementById('mgr-email-form');
                    if (form) form.reset();
                    const cbs = document.querySelectorAll('.email-user-cb');
                    cbs.forEach(cb => cb.checked = false);
                    const selectAll = document.getElementById('email-select-all');
                    if (selectAll) selectAll.checked = false;
                    app.admin.updateEmailSelectedCount();
                    app.admin.toggleEmailCustom();
                    app.admin.clearEmailDraft();
                    const previewBox = document.getElementById('email-md-preview');
                    if (previewBox) previewBox.classList.add('hidden');
                },

                sendMassEmail: async (e) => {
                    e.preventDefault();
                    if (app.role !== 'manager' && app.role !== 'admin') return app.ui.showAlert("Chỉ Quản trị viên/Quản lý mới có thể sử dụng chức năng này.");

                    const selectedCbs = Array.from(document.querySelectorAll('.email-user-cb:checked')).map(cb => cb.value);
                    if (selectedCbs.length === 0) return app.ui.showAlert("Vui lòng chọn ít nhất 1 người nhận!");
                    
                    const isCustomSelected = selectedCbs.includes('custom');
                    let customEmail = '';
                    if (isCustomSelected) {
                        customEmail = document.getElementById('email-custom-address')?.value.trim();
                        if (!customEmail) return app.ui.showAlert("Vui lòng nhập Email tùy chỉnh!");
                    }

                    const targetUsers = selectedCbs.filter(val => val !== 'custom');
                    const subject = document.getElementById('email-subject')?.value.trim();
                    const content = document.getElementById('email-content')?.value.trim();
                    const isAnonymousCheckbox = document.getElementById('email-is-anonymous');
                    const isAnonymous = isAnonymousCheckbox ? isAnonymousCheckbox.checked : false;

                    if (!subject || !content) return app.ui.showAlert("Vui lòng nhập Tiêu đề và Nội dung!");

                    const btn = document.getElementById('email-send-btn');
                    if (!btn) return;
                    const origHTML = btn.innerHTML;
                    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang gửi...';
                    btn.disabled = true;

                    try {
                        const { data: { session } } = await window.sb.auth.getSession();
                        let successCount = 0;
                        let errCount = 0;

                        if (isCustomSelected && customEmail) {
                            const customEmails = customEmail.split(',').map(em => em.trim()).filter(Boolean);
                            for (const email of customEmails) {
                                const payload = {
                                    action: 'email',
                                    targetUserId: null,
                                    customEmail: email,
                                    subject: subject,
                                    markdownContent: content,
                                    isAnonymous: isAnonymous
                                };
                                const res = await fetch('/api/notify', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
                                    body: JSON.stringify(payload)
                                });
                                if (res.ok) successCount++; else errCount++;
                            }
                        }

                        for (const userId of targetUsers) {
                            const payload = {
                                action: 'email',
                                targetUserId: userId,
                                customEmail: null,
                                subject: subject,
                                markdownContent: content,
                                isAnonymous: isAnonymous
                            };
                            const res = await fetch('/api/notify', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
                                body: JSON.stringify(payload)
                            });
                            if (res.ok) successCount++; else errCount++;
                        }

                        app.ui.showAlert(`Hoàn tất gửi Email. Thành công: ${successCount}, Thất bại: ${errCount}`);
                        app.admin.clearEmailForm();
                        app.admin.logAction('send_email', 'mass_email', { subject: subject, successCount, errCount });

                    } catch (err) {
                        app.ui.showAlert("Lỗi gửi Email: " + err.message);
                    } finally {
                        btn.innerHTML = origHTML;
                        btn.disabled = false;
                    }
                },

                // --- CÁC HÀM MỚI CHO TÍNH NĂNG CẤU HÌNH ---
                renderManagerSettings: async () => {
                    const container = document.getElementById('mgr-settings-content');
                    container.innerHTML = '<p class="text-gray-500 italic"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Đang tải dữ liệu...</p>';
                    try {
                        await app.maintenance.fetch();
                    } catch (err) {
                        if (container) container.innerHTML = `<p class="text-red-500 py-4">Không thể tải cấu hình bảo trì: ${err.message}</p>`;
                        return;
                    }

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
                                    <label class="text-xs text-gray-500 font-bold flex justify-between mb-1"><span>Thời gian dự kiến mở lại</span> <input type="checkbox" id="mt-has-time-${cfg.id}" ${hasTime ? 'checked' : ''} onchange="document.getElementById('mt-time-${cfg.id}').disabled = !this.checked"></label>
                                    <input type="datetime-local" id="mt-time-${cfg.id}" value="${timeVal}" ${!hasTime ? 'disabled' : ''} class="w-full border p-2.5 text-sm rounded disabled:bg-gray-100">
                                </div>
                            </div>
                            <div class="mt-4 text-right"><button onclick="app.admin.saveManagerSetting('${cfg.id}', this)" class="bg-black text-white px-5 py-2 text-xs font-bold rounded shadow-sm">Lưu thông tin</button></div>
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
                            <button onclick="app.admin.saveQuotaSetting(this)" class="bg-blue-600 text-white px-6 py-2.5 text-xs font-bold rounded hover:bg-blue-700 transition shadow-sm h-[42px] whitespace-nowrap"><i class="fa-solid fa-floppy-disk mr-1"></i> Lưu thông tin</button>
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
                        app.ui.showAlert(`Đã lưu thông tin cho ${sysId.toUpperCase()}`);
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
                
                approvePhoto: async (id, uploaderId, btn) => {
                    if (app.isRealtimeConnected === false) {
                        return app.ui.showAlert("Mất kết nối Realtime với máy chủ! Đã tạm khóa chức năng duyệt và can thiệp ảnh để tránh lệch dữ liệu.");
                    }
                    if (app.user.id === uploaderId) {
                        return app.ui.showAlert("Bạn không thể tự duyệt ảnh của mình!");
                    }
                    if (document.activeElement) document.activeElement.blur();
                    const cardEl = btn ? btn.closest('.admin-card') : document.getElementById(`adm-photo-card-${id}`);
                    const parentEl = cardEl ? cardEl.parentElement : null;
                    const originalNextSibling = cardEl ? cardEl.nextElementSibling : null;

                    const currentScrollY = window.scrollY;

                    if (cardEl && parentEl) {
                        parentEl.appendChild(cardEl);
                        cardEl.querySelectorAll('input, select, textarea, button').forEach(el => el.disabled = true);
                        cardEl.style.opacity = '0.55';
                        cardEl.style.pointerEvents = 'none';
                    }

                    window.scrollTo({ top: currentScrollY, behavior: 'instant' });

                    btn.innerText = "Đang tải lên CDN..."; btn.disabled = true; btn.classList.add('btn-loading');
                    try {
                        const plate = document.getElementById(`adm-p-plate-${id}`).value.trim();
                        const op = document.getElementById(`adm-p-op-${id}`).value.trim();
                        const type = document.getElementById(`adm-p-type-${id}`).value;
                        const route = document.getElementById(`adm-p-route-${id}`).value.trim();
                        const model = document.getElementById(`adm-p-model-${id}`).value.trim();
                        const location = document.getElementById(`adm-p-location-${id}`).value.trim();
                        const note = document.getElementById(`adm-p-note-${id}`).value.trim();
                        const provinceEl = document.getElementById(`adm-p-province-${id}`);
                        const province = provinceEl ? provinceEl.value : '';



                        if (await app.utils.checkModelDuplicatePolicy(plate, model)) {
                            if (cardEl && parentEl) {
                                if (originalNextSibling && originalNextSibling !== cardEl) parentEl.insertBefore(cardEl, originalNextSibling);
                                else parentEl.appendChild(cardEl);
                                cardEl.querySelectorAll('input, select, textarea, button').forEach(el => el.disabled = false);
                                cardEl.style.opacity = '1';
                                cardEl.style.pointerEvents = 'auto';
                            }
                            btn.innerText = "DUYỆT"; btn.disabled = false; btn.classList.remove('btn-loading');
                            return;
                        }

                        const res = await fetch('/api/admin/action', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${(await window.sb.auth.getSession()).data.session?.access_token}`
                            },
                            body: JSON.stringify({
                                action: 'approve', photoId: id,
                                plate, op, type, route, model, location, note, province
                            })
                        });

                        if (!res.ok) {
                            let errText = 'Lỗi server (' + res.status + ')';
                            try {
                                const rawText = await res.text();
                                if (rawText.includes('1102')) {
                                    errText = 'Hệ thống vượt quá giới hạn xử lý CPU Cloudflare (Lỗi 1102). Vui lòng thử lại sau ít giây!';
                                } else if (res.status === 502 || res.status === 504) {
                                    errText = 'Lỗi kết nối máy chủ CDN/Cloudflare (' + res.status + '). Vui lòng thử lại sau!';
                                } else {
                                    const json = JSON.parse(rawText);
                                    if (json && json.error) errText = json.error;
                                    else errText = rawText.replace(/<[^>]*>?/gm, '').trim().slice(0, 200);
                                }
                            } catch (e) {
                                if (res.status === 502 || res.status === 504) {
                                    errText = 'Lỗi kết nối máy chủ CDN/Cloudflare (' + res.status + '). Vui lòng thử lại sau!';
                                }
                            }
                            throw new Error(errText);
                        }

                        let isFinal = true;
                        try {
                            const resJson = await res.json();
                            if (resJson && typeof resJson.isFinal !== 'undefined') {
                                isFinal = resJson.isFinal;
                            }
                        } catch(e) {}

                        if (cardEl) {
                            if (document.activeElement && cardEl.contains(document.activeElement)) {
                                document.activeElement.blur();
                            }
                            if (!isFinal) {
                                app.admin.loadTab('photos', false, true);
                            } else {
                                cardEl.style.transition = 'all 0.35s ease';
                                cardEl.style.opacity = '0';
                                cardEl.style.transform = 'scale(0.92)';
                                cardEl.style.maxHeight = '0px';
                                cardEl.style.margin = '0px';
                                cardEl.style.padding = '0px';
                                cardEl.style.overflow = 'hidden';
                                setTimeout(() => {
                                    cardEl.remove();
                                    if (parentEl && !parentEl.querySelector('.admin-card')) {
                                        app.admin.loadTab('photos', false, true);
                                    }
                                }, 350);
                            }
                        } else if (parentEl && !parentEl.querySelector('.admin-card')) {
                            app.admin.loadTab('photos', false, true);
                        }
                    } catch (err) {
                        app.ui.showAlert("Lỗi: " + err.message);
                        if (cardEl && parentEl) {
                            if (originalNextSibling && originalNextSibling !== cardEl) parentEl.insertBefore(cardEl, originalNextSibling);
                            else parentEl.appendChild(cardEl);
                            cardEl.querySelectorAll('input, select, textarea, button').forEach(el => el.disabled = false);
                            cardEl.style.opacity = '1';
                            cardEl.style.pointerEvents = 'auto';
                        }
                        btn.innerText = "DUYỆT"; btn.disabled = false; btn.classList.remove('btn-loading');
                    }
                },
                denyPhoto: async (id, uploaderId, btn) => {
                    if (app.isRealtimeConnected === false) {
                        return app.ui.showAlert("Mất kết nối Realtime với máy chủ! Đã tạm khóa chức năng từ chối/can thiệp ảnh để tránh lệch dữ liệu.");
                    }
                    if (app.role !== 'manager' && app.role !== 'admin') {
                        return app.ui.showAlert("Chỉ Kiểm duyệt/Quản lý mới có quyền từ chối ảnh!");
                    }
                    if (app.user.id === uploaderId) {
                        return app.ui.showAlert("Bạn không thể tự từ chối ảnh của chính mình!");
                    }
                    app.ui.showDenyPrompt("Từ chối ảnh", (reason) => {
                        if (!reason.trim()) {
                            app.ui.showAlert("Bắt buộc phải nhập lý do!");
                            return;
                        }

                        if (document.activeElement) document.activeElement.blur();
                        const cardEl = document.getElementById(`adm-photo-card-${id}`);
                        const parentEl = cardEl?.parentElement;
                        const originalNextSibling = cardEl ? cardEl.nextElementSibling : null;

                        const currentScrollY = window.scrollY;

                        if (cardEl && parentEl) {
                            parentEl.appendChild(cardEl);
                            cardEl.querySelectorAll('input, select, textarea, button').forEach(el => el.disabled = true);
                            cardEl.style.opacity = '0.55';
                            cardEl.style.pointerEvents = 'none';
                        }
                        
                        window.scrollTo({ top: currentScrollY, behavior: 'instant' });

                        btn.innerText = "Đang xử lý..."; btn.disabled = true; btn.classList.add('btn-loading');
                        (async () => {
                            try {
                                const plate = document.getElementById(`adm-p-plate-${id}`).value.trim();
                                const location = document.getElementById(`adm-p-location-${id}`)?.value?.trim();
                                


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

                                if (!res.ok) {
                                    let errText = 'Lỗi server (' + res.status + ')';
                                    try {
                                        const rawText = await res.text();
                                        if (rawText.includes('1102')) {
                                            errText = 'Hệ thống vượt quá giới hạn xử lý CPU Cloudflare (Lỗi 1102). Vui lòng thử lại sau ít giây!';
                                        } else if (res.status === 502 || res.status === 504) {
                                            errText = 'Lỗi kết nối máy chủ CDN/Cloudflare (' + res.status + '). Vui lòng thử lại sau!';
                                        } else {
                                            const json = JSON.parse(rawText);
                                            if (json && json.error) errText = json.error;
                                            else errText = rawText.replace(/<[^>]*>?/gm, '').trim().slice(0, 200);
                                        }
                                    } catch (e) {
                                        if (res.status === 502 || res.status === 504) {
                                            errText = 'Lỗi kết nối máy chủ CDN/Cloudflare (' + res.status + '). Vui lòng thử lại sau!';
                                        }
                                    }
                                    throw new Error(errText);
                                }

                                let isFinal = true;
                                try {
                                    const resJson = await res.json();
                                    if (resJson && typeof resJson.isFinal !== 'undefined') {
                                        isFinal = resJson.isFinal;
                                    }
                                } catch(e) {}

                                const cardEl = document.getElementById(`adm-photo-card-${id}`);
                                const parentEl = cardEl?.parentElement;
                                if (cardEl) {
                                    if (document.activeElement && cardEl.contains(document.activeElement)) {
                                        document.activeElement.blur();
                                    }
                                    if (!isFinal) {
                                        app.admin.loadTab('photos', false, true);
                                    } else {
                                        cardEl.style.transition = 'all 0.35s ease';
                                        cardEl.style.opacity = '0';
                                        cardEl.style.transform = 'scale(0.92)';
                                        cardEl.style.maxHeight = '0px';
                                        cardEl.style.margin = '0px';
                                        cardEl.style.padding = '0px';
                                        cardEl.style.overflow = 'hidden';
                                        setTimeout(() => {
                                            cardEl.remove();
                                            if (parentEl && !parentEl.querySelector('.admin-card')) {
                                                app.admin.loadTab('photos', false, true);
                                            }
                                        }, 350);
                                    }
                                } else if (parentEl && !parentEl.querySelector('.admin-card')) {
                                    app.admin.loadTab('photos', false, true);
                                }
                            } catch (err) {
                                app.ui.showAlert("Lỗi: " + err.message);
                                if (cardEl && parentEl) {
                                    if (originalNextSibling && originalNextSibling !== cardEl) parentEl.insertBefore(cardEl, originalNextSibling);
                                    else parentEl.appendChild(cardEl);
                                    cardEl.querySelectorAll('input, select, textarea, button').forEach(el => el.disabled = false);
                                    cardEl.style.opacity = '1';
                                    cardEl.style.pointerEvents = 'auto';
                                }
                            } finally {
                                btn.innerText = "TỪ CHỐI"; btn.disabled = false; btn.classList.remove('btn-loading');
                            }
                        })();
                    });
                },
                approveReq: async (id, btn, reqType = 'info', historyCount = 0) => {
                    if (app.isRealtimeConnected === false) {
                        return app.ui.showAlert("Mất kết nối Realtime với máy chủ! Đã tạm khóa chức năng duyệt và can thiệp để tránh lệch dữ liệu.");
                    }
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
                            const provinceEl = document.getElementById(`req-province-${id}`);
                            const province = provinceEl ? provinceEl.value : '';

                            const originalData = app.admin.originalData && app.admin.originalData['req_' + id] ? app.admin.originalData['req_' + id] : null;
                            const oldLoc = originalData ? (originalData.location || '') : '';
                            


                            if (await app.utils.checkModelDuplicatePolicy(plate, model)) {
                                btn.innerText = "DUYỆT"; btn.disabled = false; btn.classList.remove('btn-loading');
                                return;
                            }

                            const { error: vError } = await window.sb.from('vehicles').upsert({
                                license_plate: plate, model: model
                            }, { onConflict: 'license_plate' });
                            if (vError) throw vError;

                            if (req.new_data.photo_id) {
                                const { data: oldP } = await window.sb.from('photos').select('license_plate, operator, route_no, taken_at').eq('id', req.new_data.photo_id).single();

                                const { error: pError } = await window.sb.from('photos').update({
                                    license_plate: plate,
                                    note: note,
                                    location: loc,
                                    province: province || null,
                                    operator: op,
                                    type: type,
                                    route_no: route
                                }).eq('id', req.new_data.photo_id);
                                if (pError) throw pError;

                                if (oldP && oldP.taken_at) {
                                    const isPlateChanged = req.license_plate !== plate || (oldP.license_plate && oldP.license_plate !== plate);
                                    await app.vehicle.syncHistoryOnPhotoEdit(
                                        plate,
                                        oldP.taken_at,
                                        { operator: oldP.operator, route_no: oldP.route_no },
                                        { operator: op, route_no: route },
                                        isPlateChanged
                                    );
                                }
                            }

                            if (req.license_plate !== plate) {
                                await app.vehicle.cleanupVehicle(req.license_plate);
                            }
                            await app.vehicle.cleanupVehicle(plate);
                        }

                        else if (reqType === 'vehicle_details' || req.new_data.request_type === 'update_vehicle_details') {
                            const inputModel = document.getElementById(`req-v-model-${id}`);
                            const inputNote = document.getElementById(`req-v-note-${id}`);

                            const finalModel = inputModel ? inputModel.value : req.new_data.model;
                            const finalNote = inputNote ? inputNote.value : req.new_data.note;

                            if (await app.utils.checkModelDuplicatePolicy(req.license_plate, finalModel)) {
                                btn.innerText = "DUYỆT"; btn.disabled = false; btn.classList.remove('btn-loading');
                                return;
                            }

                            const { error } = await window.sb.from('vehicles')
                                .upsert({ license_plate: req.license_plate, model: finalModel, note: finalNote }, { onConflict: 'license_plate' });
                            if (error) throw error;
                        }

                        else if (reqType === 'operator_info' || req.new_data.request_type === 'update_operator_info') {
                            const logo = document.getElementById(`req-op-logo-${id}`).value.trim();
                            let desc = document.getElementById(`req-op-desc-${id}`).value.trim();
                            const isInactiveEl = document.getElementById(`req-op-inactive-${id}`);
                            if (isInactiveEl && isInactiveEl.checked) {
                                desc = '[STOPPED] ' + desc;
                            }
                            const parentOpEl = document.getElementById(`req-op-parent-${id}`);
                            const parentOp = parentOpEl ? parentOpEl.value.trim() : (req.new_data.parent_operator || '');
                            
                            if (parentOp && parentOp.includes(';') && parentOp.split(';').length !== parentOp.split('; ').length) {
                                btn.innerText = "DUYỆT"; btn.disabled = false; btn.classList.remove('btn-loading');
                                return app.ui.showAlert("Sai cấu trúc: Các ĐVVH phải được ngăn cách bằng dấu chấm phẩy và một khoảng trắng (Ví dụ: 'Công ty A; Công ty B').");
                            }
                            
                            if (!logo && !desc && !parentOp) {
                                const { error } = await window.sb.from('operator_info').delete().eq('operator_name', req.new_data.operator_name);
                                if (error) throw error;
                            } else {
                                const { error } = await window.sb.from('operator_info').upsert({
                                    operator_name: req.new_data.operator_name,
                                    logo_url: logo || null,
                                    description: desc || null,
                                    parent_operator: parentOp || null
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
                            let newItems = [];
                            let hasError = false;
                            if (reqType === 'history') {
                                // Lấy từ input
                                for (let i = 0; i < historyCount; i++) {
                                    const rDate = document.getElementById(`req-h-date-${id}-${i}`).value;
                                    const parsedDate = app.utils.parseDDMMYYYYToDate(rDate);
                                    if (rDate && !parsedDate) {
                                        hasError = true;
                                    }
                                    newItems.push({
                                        license_plate: req.license_plate,
                                        plate: document.getElementById(`req-h-plate-${id}-${i}`).value || null,
                                        operator: document.getElementById(`req-h-op-${id}-${i}`).value,
                                        route: document.getElementById(`req-h-route-${id}-${i}`).value,
                                        note: document.getElementById(`req-h-note-${id}-${i}`).value,
                                        effective_date: parsedDate || null,
                                        display_order: i
                                    });
                                }
                            } else {
                                // Fallback
                                if (req.new_data.history_items) {
                                    newItems = req.new_data.history_items.map((item, index) => ({
                                        license_plate: req.license_plate,
                                        plate: item.plate || null,
                                        operator: item.operator,
                                        route: item.route,
                                        note: item.note,
                                        effective_date: item.effective_date || null,
                                        display_order: index
                                    }));
                                }
                            }

                            // [HỆ THỐNG GỘP XE] Cơ chế Soft Merge
                            const currentPlate = req.license_plate;
                            const newHistoryPlates = [...new Set(newItems.map(p => p.plate).filter(p => p && p !== currentPlate))];
                            
                            if (hasError) {
                                return app.ui.showAlert("Có lỗi ở mốc thời gian lịch sử! Vui lòng kiểm tra và nhập đúng định dạng DD/MM/YYYY.");
                            }

                            // 1. Tách (Un-merge) các xe đã bị loại khỏi lịch sử
                            const { data: unmergeCandidates } = await window.sb.from('vehicles').select('license_plate, note').like('note', `%[MERGED_INTO:${currentPlate}]%`);
                            if (unmergeCandidates) {
                                for (const v of unmergeCandidates) {
                                    if (!newHistoryPlates.includes(v.license_plate)) {
                                        const newNote = (v.note || '').replace(`[MERGED_INTO:${currentPlate}]`, '').trim();
                                        await window.sb.from('vehicles').update({ note: newNote }).eq('license_plate', v.license_plate);
                                    }
                                }
                            }

                            // 2. Gộp (Merge) các xe mới thêm vào lịch sử
                            if (newHistoryPlates.length > 0) {
                                const { data: existingOldVehicles } = await window.sb.from('vehicles').select('license_plate, note').in('license_plate', newHistoryPlates);
                                if (existingOldVehicles && existingOldVehicles.length > 0) {
                                    for (const v of existingOldVehicles) {
                                        const noteStr = v.note || '';
                                        if (!noteStr.includes(`[MERGED_INTO:${currentPlate}]`)) {
                                            const newNote = (noteStr + ` [MERGED_INTO:${currentPlate}]`).trim();
                                            await window.sb.from('vehicles').update({ note: newNote }).eq('license_plate', v.license_plate);
                                        }
                                    }
                                }
                            }

                            await window.sb.from('vehicle_history').delete().eq('license_plate', currentPlate);
                            if (newItems.length > 0) {
                                await window.sb.from('vehicle_history').insert(newItems);
                            }
                        }
                        await window.sb.from('edit_requests').update({ status: 'approved' }).eq('id', id);
                        app.admin.logAction('approve_edit_req', id, { req_type: reqType, plate: req.license_plate });
                        if (document.activeElement) document.activeElement.blur();
                        app.admin.loadTab('requests', false, true);
                    } catch (err) { app.ui.showAlert("Lỗi: " + err.message); } finally { btn.innerText = "DUYỆT"; btn.disabled = false; btn.classList.remove('btn-loading'); }
                },
                directDeleteInput: async (btn) => {
                    if (app.isRealtimeConnected === false) {
                        return app.ui.showAlert("Mất kết nối Realtime với máy chủ! Đã tạm khóa chức năng xóa để tránh lệch dữ liệu.");
                    }
                    if (app.role !== 'manager') return app.ui.showAlert("Chỉ Quản lý mới có quyền sử dụng tính năng này!");
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
                        const sessionRes = await window.sb.auth.getSession();
                        const token = sessionRes.data.session?.access_token;
                        const res = await fetch('/api/admin/action', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                action: 'deny',
                                photoId: photoId,
                                reason: reason
                            })
                        });

                        if (!res.ok) {
                            let errText = 'Lỗi server (' + res.status + ')';
                            try {
                                const rawText = await res.text();
                                const json = JSON.parse(rawText);
                                if (json && json.error) errText = json.error;
                                else errText = rawText;
                            } catch (e) {}
                            throw new Error(errText);
                        }

                        app.toast.show('success', 'Thành công', 'Đã xóa ảnh thành công (đã chuyển về Sandbox và xóa khỏi CDN)!');
                        document.getElementById('adm-direct-delete-id').value = '';
                        document.getElementById('adm-direct-delete-reason').value = '';
                        if (document.activeElement) document.activeElement.blur();
                        if (app.admin.loadTab) app.admin.loadTab('denied', false, true);
                    } catch (e) { app.ui.showAlert("Lỗi: " + e.message); }
                    finally { btn.innerText = originalText; btn.disabled = false; }
                },

                approveDeleteReq: async (reqId, photoId, requesterId, userReason, btn) => {
                    if (app.isRealtimeConnected === false) {
                        return app.ui.showAlert("Mất kết nối Realtime với máy chủ! Đã tạm khóa chức năng duyệt xóa để tránh lệch dữ liệu.");
                    }
                    if (app.role !== 'manager') {
                        return app.ui.showAlert("Chỉ Quản lý mới có quyền duyệt lệnh xóa ảnh khỏi hệ thống!");
                    }
                    btn.innerText = "Đang xử lý...";
                    btn.disabled = true;
                    btn.classList.add('btn-loading');

                    try {
                        // CẬP NHẬT TRUY VẤN: Lấy thêm cột 'url' để truyền qua API
                        const { data: photo } = await window.sb.from('photos').select('license_plate, url').eq('id', photoId).single();
                        const plate = photo ? photo.license_plate : 'đã chọn';
                        const imgUrl = photo ? photo.url : null;

                        // 1. Gọi API Xóa ảnh khỏi CDN/Sandbox
                        if (imgUrl || photoId) {
                            const { data: { session } } = await window.sb.auth.getSession();
                            await fetch('/api/delete-image', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${session?.access_token}`
                                },
                                body: JSON.stringify({ imageUrl: imgUrl, photoId: photoId })
                            });
                        }

                        // 2. Xóa dữ liệu Database (ảnh trên CDN đã được xóa ở bước 1)
                        const { error: delError } = await window.sb.from('photos').delete().eq('id', photoId);
                        if (delError) throw delError;

                        await app.vehicle.cleanupVehicle(plate);
                        await window.sb.from('edit_requests').update({ status: 'approved' }).eq('id', reqId);

                        app.toast.show('success', 'Thành công', 'Đã duyệt yêu cầu và xóa ảnh vĩnh viễn thành công!');
                        app.admin.logAction('approve_delete_req', photoId, { plate: plate });
                        if (document.activeElement) document.activeElement.blur();
                        app.admin.loadTab('delete', false, true);

                    } catch (err) {
                        app.ui.showAlert("Lỗi khi duyệt xóa: " + err.message);
                        btn.innerText = "DUYỆT XÓA";
                        btn.disabled = false;
                        btn.classList.remove('btn-loading');
                    }
                },
                denyReq: async (reqId, btn) => {
                    if (app.isRealtimeConnected === false) {
                        return app.ui.showAlert("Mất kết nối Realtime với máy chủ! Đã tạm khóa chức năng từ chối yêu cầu để tránh lệch dữ liệu.");
                    }
                    app.ui.showPrompt("Nhập lý do từ chối yêu cầu này (Tùy chọn):", "", async (reason) => {
                        btn.innerText = "Đang xử lý..."; btn.disabled = true; btn.classList.add('btn-loading');
                        try {
                            const { data: req } = await window.sb.from('edit_requests').select('requester_id, license_plate, new_data').eq('id', reqId).single();
                            await window.sb.from('edit_requests').update({ status: 'denied' }).eq('id', reqId);

                            let actionName = req.new_data.request_type === 'delete_photo' ? 'xóa ảnh' : 'chỉnh sửa';
                            let reasonMsg = reason ? ` Lý do: ${reason}` : '';


                            if (document.activeElement) document.activeElement.blur();
                            if (req.new_data.request_type === 'delete_photo') app.admin.loadTab('delete', false, true);
                            else app.admin.loadTab('requests', false, true);
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
