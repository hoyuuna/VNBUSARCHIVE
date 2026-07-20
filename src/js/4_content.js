window.app = window.app || {};

Object.assign(window.app, {
  upload: {
                 currentQuota: { limit: null, count: 0 },
                 routeOpTimeout: null,
                 
                 // [MỚI] TRẠNG THÁI HÀNG ĐỢI
                 uploadQueue: [],
                 isQueueProcessing: false,
                 activeProgressToast: null,

                 selectProvince: (provName, el) => {
                     const hiddenInput = document.getElementById('up-province');
                     const labelEl = document.getElementById('up-province-label');
                     const menuEl = document.getElementById('up-province-menu');
                     const provBtn = document.getElementById('up-province-btn');
                     const provErr = document.getElementById('err-up-province');
                     if (hiddenInput) hiddenInput.value = provName || '';
                     if (labelEl) {
                         labelEl.innerText = provName || '-- Chọn Tuyến của tỉnh --';
                         if (provName) {
                             labelEl.classList.remove('text-gray-400');
                             labelEl.classList.add('text-black');
                             if (provBtn) {
                                 provBtn.classList.remove('border-red-500', 'focus:ring-red-500');
                                 provBtn.classList.add('border-gray-300', 'focus:ring-black');
                             }
                             if (provErr) provErr.classList.add('hidden');
                         } else {
                             labelEl.classList.remove('text-black');
                             labelEl.classList.add('text-gray-400');
                         }
                     }
                     document.querySelectorAll('#up-province-menu .filter-item').forEach(item => {
                         item.classList.remove('selected');
                     });
                     if (el && el.classList) {
                         el.classList.add('selected');
                     } else if (menuEl) {
                         const target = menuEl.querySelector(`.filter-item[data-prov="${provName || ''}"]`);
                         if (target) target.classList.add('selected');
                     }
                     if (menuEl) menuEl.classList.remove('active');
                     if (app.upload.saveDraft) app.upload.saveDraft();
                 },

                 initProvinceMenu: () => {
                     const menuEl = document.getElementById('up-province-menu');
                     if (!menuEl || !app.utils.provinceData) return;
                     const itemsHtml = app.utils.provinceData.map(p => {
                         return `<div class="filter-item" data-prov="${p.ten}" onclick="app.upload.selectProvince('${p.ten}', this)">
                             <span class="font-bold">${p.ten}</span>
                         </div>`;
                     }).join('');
                     menuEl.innerHTML = itemsHtml;
                 },

                 saveDraft: () => {
                     const plate = document.getElementById('up-plate')?.value || '';
                     const operator = document.getElementById('up-operator')?.value || '';
                     const route = document.getElementById('up-route')?.value || '';
                     const model = document.getElementById('up-model')?.value || '';
                     const note = document.getElementById('up-note')?.value || '';

                     if (!plate && !operator && !route && !model && !note) {
                         localStorage.removeItem('vnbus_upload_draft');
                         return;
                     }

                     const draft = {
                         plate: plate, type: document.getElementById('up-type')?.value || '',
                         route: route, operator: operator, model: model,
                         location: document.getElementById('up-location')?.value || '',
                         province: document.getElementById('up-province')?.value || '',
                         date: document.getElementById('up-date')?.value || '', note: note
                     };
                     localStorage.setItem('vnbus_upload_draft', JSON.stringify(draft));
                 },
                 checkAndPromptDraft: () => {
                     const saved = localStorage.getItem('vnbus_upload_draft');
                     if (saved) {
                         try {
                             const draft = JSON.parse(saved);
                             if (draft.plate || draft.operator || draft.route) {
                                 const plateText = draft.plate ? `xe <b>${draft.plate}</b>` : "một xe chưa rõ BKS";
                                 app.ui.showAlert(
                                     `Bạn có bản nháp cho ${plateText}. Bạn có muốn tiếp tục không?<br><br><span class="text-[11px] text-gray-500 italic"><i class="fa-solid fa-circle-info mr-1"></i>Lưu ý: Do chính sách bảo mật của trình duyệt, bạn vẫn cần phải tự chọn lại file ảnh.</span>`,
                                     () => { app.upload.loadDraft(draft); },
                                     () => { app.upload.clearDraft(); },
                                     { title: "Khôi phục bản nháp", btnOkText: "Tiếp tục", btnCancelText: "Bỏ qua" }
                                 );
                             }
                         } catch (e) { app.upload.clearDraft(); }
                     }
                 },
                 loadDraft: (draft) => {
                     try {
                         if(draft.plate) document.getElementById('up-plate').value = draft.plate;
                         if(draft.type) { document.getElementById('up-type').value = draft.type; app.upload.applyPreferenceUI(); }
                         if(draft.route) document.getElementById('up-route').value = draft.route;
                         if(draft.operator) document.getElementById('up-operator').value = draft.operator;
                         if(draft.model) document.getElementById('up-model').value = draft.model;
                         if(draft.location) document.getElementById('up-location').value = draft.location;
                         if(draft.province && app.upload.selectProvince) app.upload.selectProvince(draft.province);
                         if(draft.date) document.getElementById('up-date').value = draft.date;
                         if(draft.note) document.getElementById('up-note').value = draft.note;
                         
                         if(draft.plate) app.upload.checkPlate(draft.plate);
                     } catch (e) { console.warn("Lỗi load draft", e); }
                 },
                 clearDraft: () => { localStorage.removeItem('vnbus_upload_draft'); },

                 autoFillOperatorByRoute: async () => {
                    if (app.vehicleLocked) return;

                    const plateInput = document.getElementById('up-plate');
                    const routeInput = document.getElementById('up-route');
                    const opInput = document.getElementById('up-operator');
                    const modelInput = document.getElementById('up-model');

                    if (!plateInput || !routeInput || !opInput) return;

                    const plate = plateInput.value.replace(/[^A-Z0-9-]/gi, '').toUpperCase();
                    const route = routeInput.value.trim();

                    if (!app.upload.autoFilledData) app.upload.autoFilledData = { operator: '', model: '' };

                    const canOverwriteOp = !opInput.value || opInput.value === app.upload.autoFilledData.operator;
                    const canOverwriteModel = !modelInput || !modelInput.value || modelInput.value === app.upload.autoFilledData.model;

                    const specialRoutes = ['Dừng hoạt động', 'Ngoài giờ hoạt động', 'Chưa hoạt động', 'Xe hợp đồng / Đưa đón', 'Hợp đồng / Đưa đón'];

                    if (!plate || plate.length < 2 || !route) {
                        if (canOverwriteOp) { opInput.value = ''; app.upload.autoFilledData.operator = ''; }
                        if (canOverwriteModel) { modelInput.value = ''; app.upload.autoFilledData.model = ''; }
                        return;
                    }

                    if (specialRoutes.includes(route)) {
                        return;
                    }

                    const prefix = plate.substring(0, 2);
                    if (isNaN(prefix)) return;

                    const relatedPrefixes = app.utils.getRelatedPrefixes(prefix);
                    if (!relatedPrefixes || relatedPrefixes.length === 0) return;

                    const dateInput = document.getElementById('up-date');
                    const uploadDate = dateInput && dateInput.value ? new Date(dateInput.value).getTime() : Date.now();

                    try {
                        const prefixOrCond = relatedPrefixes.map(p => `license_plate.ilike.${p}%`).join(',');

                        const { data } = await window.sb.from('photos')
                            .select('operator, type, taken_at, created_at, vehicles(model)')
                            .eq('route_no', route)
                            .eq('status', 'approved')
                            .or(prefixOrCond)
                            .order('taken_at', { ascending: false, nullsFirst: false })
                            .limit(50);

                        if (data && data.length > 0) {
                            data.sort((a, b) => {
                                const timeA = a.taken_at ? new Date(a.taken_at).getTime() : new Date(a.created_at).getTime();
                                const timeB = b.taken_at ? new Date(b.taken_at).getTime() : new Date(b.created_at).getTime();
                                return Math.abs(timeA - uploadDate) - Math.abs(timeB - uploadDate);
                            });

                            const closest = data[0];
                            if (closest.operator && canOverwriteOp) {
                                opInput.value = closest.operator;
                                app.upload.autoFilledData.operator = closest.operator;
                            }
                            
                            if (modelInput && closest.vehicles && closest.vehicles.model && canOverwriteModel) {
                                modelInput.value = closest.vehicles.model;
                                app.upload.autoFilledData.model = closest.vehicles.model;
                            }

                            if (closest.type === 'bus') app.upload.selectType('bus');
                        } else {
                            if (canOverwriteOp) { opInput.value = ''; app.upload.autoFilledData.operator = ''; }
                            if (canOverwriteModel) { modelInput.value = ''; app.upload.autoFilledData.model = ''; }
                        }
                    } catch (e) { console.error("Lỗi Auto-fill đơn vị vận hành:", e); }
                },

                 applyPreferenceUI: () => {
                    const warningEl = document.getElementById('upload-pref-warning');
                    const typeText = document.getElementById('pref-warning-type');
                    const btnBus = document.getElementById('btn-type-bus');
                    const btnCoach = document.getElementById('btn-type-coach');
                    const pref = app.preference.current;

                    if(btnBus) btnBus.classList.remove('opacity-50', 'pointer-events-none');
                    if(btnCoach) btnCoach.classList.remove('opacity-50', 'pointer-events-none');

                    if (pref === 'both' || !pref) {
                        if(warningEl) warningEl.classList.add('hidden');
                        document.getElementById('up-type').value = '';
                        [btnBus, btnCoach].forEach(btn => {
                            if(btn) {
                                btn.className = "cursor-pointer border border-gray-300 bg-white text-gray-800 rounded-xl p-4 shadow-sm hover:border-gray-400 hover:shadow-md transition-all duration-200 group relative";
                                const iconBg = btn.querySelector('.icon-bg');
                                if (iconBg) {
                                    iconBg.classList.remove('bg-white/20', 'border-white/30');
                                    iconBg.classList.add('bg-gray-100', 'border-transparent');
                                }
                                const p = btn.querySelector('p');
                                if (p) {
                                    p.classList.remove('text-gray-300');
                                    p.classList.add('text-gray-500');
                                }
                            }
                        });
                    } else {
                        if(warningEl) warningEl.classList.remove('hidden');
                        if(typeText) typeText.innerText = pref === 'bus' ? 'Xe Buýt' : 'Xe Khách';

                        app.upload.performSelectType(pref);

                        if (pref === 'bus' && btnCoach) {
                            btnCoach.classList.add('opacity-50', 'pointer-events-none');
                        } else if (pref === 'coach' && btnBus) {
                            btnBus.classList.add('opacity-50', 'pointer-events-none');
                        }
                    }
                },

                 fetchRequirements: async () => {
                    const container = document.getElementById('upload-rules-content');
                    if (!container || container.dataset.loaded === 'true') return;

                    try {
                        const res = await fetch('https://raw.githubusercontent.com/hoyuuna/VNBUSARCHIVE/refs/heads/main/Requirements.md');
                        if (!res.ok) throw new Error('Network error');
                        const text = await res.text();
                        const html = DOMPurify.sanitize(marked.parse(text));
                        container.innerHTML = html;
                        container.dataset.loaded = 'true';
                    } catch (e) {
                        container.innerHTML = '<p class="text-red-500 font-bold py-4 text-center"><i class="fa-solid fa-triangle-exclamation"></i> Không thể tải nội dung tự động. Vui lòng nhấn "Xem chi tiết trên GitHub" bên dưới.</p>';
                    }
                },

                existingVehiclesList:[],
                checkModelWarning: () => {
                    const warningEl = document.getElementById('model-warning-msg');
                    const plateInput = document.getElementById('up-plate');
                    const modelInput = document.getElementById('up-model');
                    const btnSubmit = document.getElementById('btn-submit');

                    if (!warningEl || !plateInput || !modelInput) return;

                    const rawPlate = plateInput.value.replace(/[^A-Z0-9-]/gi, '').toUpperCase();
                    const currentModel = modelInput.value.trim().toLowerCase();

                    const resetWarning = () => {
                        warningEl.classList.add('hidden');
                        warningEl.classList.remove('flex');
                        if (app.upload.isBlockedByModelDuplicate) {
                            app.upload.isBlockedByModelDuplicate = false;
                            if (btnSubmit && !document.getElementById('upload-quota-text')?.classList.contains('text-red-600') && !document.getElementById('duplicate-warning-msg')) {
                                btnSubmit.disabled = false;
                            }
                        }
                    };

                    if (!rawPlate || !currentModel) { resetWarning(); return; }

                    const parts = rawPlate.split('-');
                    if (parts.length < 2) { resetWarning(); return; }

                    const basePlate = parts[0];
                    const existingVehicles = app.upload.existingVehiclesList || [];

                    const exactVehicle = existingVehicles.find(v => v.license_plate === rawPlate);
                    if (exactVehicle) { resetWarning(); return; }

                    const duplicateVehicle = existingVehicles.find(v => {
                        if (!v.model || v.license_plate === rawPlate) return false;
                        if (v.license_plate !== basePlate) {
                            const pts = v.license_plate.split('-');
                            if (pts.length !== 2 || pts[0] !== basePlate || isNaN(pts[1])) return false;
                        }
                        const mLower = v.model.trim().toLowerCase();
                        return mLower === currentModel || mLower.includes(currentModel) || currentModel.includes(mLower);
                    });

                    if (duplicateVehicle) {
                        app.upload.isBlockedByModelDuplicate = true;
                        if (btnSubmit) btnSubmit.disabled = true;
                        warningEl.innerHTML = `
                            <i class="fa-solid fa-triangle-exclamation text-red-500 mt-0.5 text-sm"></i>
                            <p class="text-[11px] font-bold text-red-700 leading-snug m-0">
                                Xe định danh phụ không được trùng dòng xe với xe khác cùng biển kiểm soát.
                            </p>
                        `;
                        warningEl.classList.remove('hidden');
                        warningEl.classList.add('flex');
                        return;
                    }

                    resetWarning();
                },

                checkDuplicateRealtime: async () => {
                    if (!app.user) return;
                    const plateInput = document.getElementById('up-plate');
                    const dateInput = document.getElementById('up-date');
                    const btnSubmit = document.getElementById('btn-submit');

                    if (!plateInput || !dateInput || !btnSubmit) return;

                    const valPlate = plateInput.value.trim();
                    const valDate = dateInput.value;

                    const oldWarning = document.getElementById('duplicate-warning-msg');
                    if (oldWarning) oldWarning.remove();

                    if (!document.getElementById('upload-quota-text')?.classList.contains('text-red-600') && !app.upload.isBlockedByModelDuplicate) {
                        btnSubmit.disabled = false;
                    }

                    if (!valPlate || !valDate) return;

                    const cleanPlate = valPlate.replace(/[^A-Z0-9-]/gi, '').toUpperCase();

                    app.upload._dupToken = (app.upload._dupToken || 0) + 1;
                    const myToken = app.upload._dupToken;

                    try {
                        const { data: existingPhotos, error: checkErr } = await window.sb
                            .from('photos')
                            .select('taken_at')
                            .eq('uploader_id', app.user.id)
                            .eq('license_plate', cleanPlate)
                            .neq('status', 'denied');

                        if (myToken !== app.upload._dupToken) return;

                        if (!checkErr && existingPhotos && existingPhotos.length > 0) {
                            const isDuplicateDate = existingPhotos.some(p => {
                                if (!p.taken_at) return false;
                                return p.taken_at.split('T')[0] === valDate;
                            });

                            if (isDuplicateDate) {
                                btnSubmit.disabled = true;
                                const displayDate = valDate.split('-').reverse().join('/');

                                const existing = document.getElementById('duplicate-warning-msg');
                                if (existing) return;

                                const warningEl = document.createElement('div');
                                warningEl.id = 'duplicate-warning-msg';
                                warningEl.className = 'mt-3 p-3 bg-red-50 border border-red-200 rounded-lg shadow-sm flex items-start gap-2.5 fade-zoom-in';
                                warningEl.innerHTML = `
                                    <i class="fa-solid fa-triangle-exclamation text-red-500 mt-0.5 text-sm"></i>
                                    <p class="text-[11px] font-bold text-red-700 leading-snug m-0">
                                        Bạn đã có ảnh với BKS tương tự được chụp ngày ${displayDate}. Bạn không thể đăng 2 ảnh của cùng 1 xe được chụp cùng ngày.
                                    </p>
                                `;

                                const plateContainer = plateInput.closest('div[x-data]') || plateInput.parentElement;
                                plateContainer.appendChild(warningEl);
                            }
                        }
                    } catch (err) {
                        console.error("Lỗi realtime trùng ngày:", err);
                    }
                },

                initMap: () => {
                    app.uploadMap = L.map('upload-map').setView([10.762622, 106.660172], 13);
                    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', {
                        attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    }).addTo(app.uploadMap);

                    app.uploadMap.on('click', async (e) => {
                        const { lat, lng } = e.latlng;
                        if (app.uploadMarker) app.uploadMap.removeLayer(app.uploadMarker);
                        app.uploadMarker = L.marker([lat, lng]).addTo(app.uploadMap);

                        const address = await app.utils.reverseGeocode(lat, lng);
                        document.getElementById('up-location').value = address;
                    });
                },

                addBlurPanel: () => {
                    app.upload.performAddBlurPanel();
                },

                buildBlurPanel: (opts) => {
                    const container = document.getElementById('preview-container');
                    if (!container) return null;
                    const { left, top, width, height, auto = false } = opts || {};
                    const id = 'blur-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
                    const panel = document.createElement('div');

                    // Ẩn công cụ của tất cả các ô hiện có khi tạo ô mới
                    document.querySelectorAll('.blur-panel').forEach(p => p.classList.remove('active'));
                    panel.className = 'blur-panel active' + (auto ? ' auto-blur' : '');
                    panel.id = id;
                    panel.dataset.auto = auto ? '1' : '0';

                    if (left != null) panel.style.left = left + 'px';
                    if (top != null) panel.style.top = top + 'px';
                    if (width != null) panel.style.width = width + 'px';
                    if (height != null) panel.style.height = height + 'px';

                    panel.innerHTML = `
                        <button type="button" class="delete-blur" onclick="app.upload.removeBlurPanel('${id}')" title="Xóa vùng này"><i class="fa-solid fa-xmark"></i></button>
                        <button type="button" class="move-blur" title="Giữ và kéo để di chuyển vùng làm mờ"><i class="fa-solid fa-arrows-up-down-left-right"></i></button>
                        <div class="resize-handle" style="position: absolute; bottom: 0; right: 0; width: 20px; height: 20px; cursor: nwse-resize; z-index: 10;" title="Kéo để đổi kích thước"></div>
                    `;

                    const selectPanel = (e) => {
                        if (!panel.classList.contains('active')) {
                            document.querySelectorAll('.blur-panel').forEach(p => p.classList.remove('active'));
                            panel.classList.add('active');
                        }
                    };

                    let isDragging = false;
                    let dragStartX, dragStartY, initialLeft, initialTop;

                    const updateButtonsPosition = () => {
                        const deleteBtn = panel.querySelector('.delete-blur');
                        const moveBtn = panel.querySelector('.move-blur');
                        if (!deleteBtn || !moveBtn || !container) return;

                        // Khi sát cạnh dưới container -> nút di chuyển lật lên trên
                        if (panel.offsetTop + panel.offsetHeight > container.offsetHeight - 46) {
                            moveBtn.classList.add('flip-top');
                        } else {
                            moveBtn.classList.remove('flip-top');
                        }

                        // Khi sát cạnh trên container -> nút xóa lật xuống dưới
                        if (panel.offsetTop < 18) {
                            deleteBtn.classList.add('flip-bottom');
                        } else {
                            deleteBtn.classList.remove('flip-bottom');
                        }

                        // Khi sát cạnh phải container -> nút xóa lật vào bên trong góc phải
                        if (panel.offsetLeft + panel.offsetWidth > container.offsetWidth - 18) {
                            deleteBtn.classList.add('inside-right');
                        } else {
                            deleteBtn.classList.remove('inside-right');
                        }
                    };

                    const startDrag = (e) => {
                        selectPanel(e);
                        if (e.target.closest('.delete-blur') || e.target.closest('.resize-handle')) return;
                        e.stopPropagation();
                        if (e.type === 'touchstart') e.preventDefault();

                        isDragging = true;
                        dragStartX = e.clientX || (e.touches && e.touches[0].clientX);
                        dragStartY = e.clientY || (e.touches && e.touches[0].clientY);
                        initialLeft = panel.offsetLeft;
                        initialTop = panel.offsetTop;
                    };

                    panel.addEventListener('mousedown', startDrag);
                    panel.addEventListener('touchstart', startDrag, { passive: false });

                    let isResizing = false;
                    let resizeStartX, resizeStartY, initialWidth, initialHeight;
                    const resizeHandle = panel.querySelector('.resize-handle');

                    const startResize = (e) => {
                        selectPanel(e);
                        e.stopPropagation();
                        if (e.type === 'touchstart') e.preventDefault();

                        isResizing = true;
                        resizeStartX = e.clientX || (e.touches && e.touches[0].clientX);
                        resizeStartY = e.clientY || (e.touches && e.touches[0].clientY);
                        initialWidth = panel.offsetWidth;
                        initialHeight = panel.offsetHeight;
                    };

                    resizeHandle.addEventListener('mousedown', startResize);
                    resizeHandle.addEventListener('touchstart', startResize, { passive: false });

                    const onMove = (clientX, clientY) => {
                        if (isDragging) {
                            const dx = clientX - dragStartX;
                            const dy = clientY - dragStartY;

                            let newLeft = initialLeft + dx;
                            let newTop = initialTop + dy;

                            const minLeft = 0;
                            const minTop = 0;
                            const maxLeft = container.offsetWidth - panel.offsetWidth;
                            const maxTop = container.offsetHeight - panel.offsetHeight;

                            panel.style.left = Math.max(minLeft, Math.min(newLeft, maxLeft)) + 'px';
                            panel.style.top = Math.max(minTop, Math.min(newTop, maxTop)) + 'px';
                            updateButtonsPosition();
                        } else if (isResizing) {
                            const dx = clientX - resizeStartX;
                            const dy = clientY - resizeStartY;

                            let newWidth = initialWidth + dx;
                            let newHeight = initialHeight + dy;

                            const minBlurW = Math.max(8, container.offsetWidth * 0.02);
                            const minBlurH = Math.max(8, container.offsetHeight * 0.02);
                            newWidth = Math.max(minBlurW, Math.min(newWidth, container.offsetWidth - panel.offsetLeft));
                            newHeight = Math.max(minBlurH, Math.min(newHeight, container.offsetHeight - panel.offsetTop));

                            panel.style.width = newWidth + 'px';
                            panel.style.height = newHeight + 'px';
                            updateButtonsPosition();
                        }
                    };

                    const handleMouseMove = (e) => {
                        if (isDragging || isResizing) {
                            e.preventDefault();
                            onMove(e.clientX, e.clientY);
                        }
                    };
                    const handleTouchMove = (e) => {
                        if (isDragging || isResizing) {
                            e.preventDefault();
                            onMove(e.touches[0].clientX, e.touches[0].clientY);
                        }
                    };

                    const endAction = () => {
                        if (isDragging || isResizing) {
                            updateButtonsPosition();
                        }
                        isDragging = false;
                        isResizing = false;
                    };

                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('touchmove', handleTouchMove, { passive: false });
                    document.addEventListener('mouseup', endAction);
                    document.addEventListener('touchend', endAction);

                    document.addEventListener('mousedown', (e) => {
                        if (!panel.contains(e.target) && !e.target.closest('#btn-add-blur')) {
                            panel.classList.remove('active');
                        }
                    });
                    document.addEventListener('touchstart', (e) => {
                        if (!panel.contains(e.target) && !e.target.closest('#btn-add-blur')) {
                            panel.classList.remove('active');
                        }
                    });

                    container.appendChild(panel);
                    updateButtonsPosition();
                    app.upload.updateBlurBtn();
                    return id;
                },

                performAddBlurPanel: () => {
                    const container = document.getElementById('preview-container');
                    if (!container) return;
                    const cw = container.clientWidth || 320;
                    const ch = container.clientHeight || 240;
                    const width = Math.min(80, Math.round(cw * 0.25));
                    const height = Math.min(50, Math.round(ch * 0.2));
                    app.upload.buildBlurPanel({
                        left: Math.round(cw * 0.4),
                        top: Math.round(ch * 0.4),
                        width,
                        height,
                        auto: false
                    });
                },

                loadFaceModel: () => {
                    if (app.upload._faceModel) return Promise.resolve(app.upload._faceModel);
                    if (app.upload._faceModelLoading) return app.upload._faceModelLoading;

                    app.upload._faceModelLoading = (async () => {
                        const vision = await import('https://esm.sh/@mediapipe/tasks-vision@0.10.18');
                        const fileset = await vision.FilesetResolver.forVisionTasks(
                            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm'
                        );
                        const modelAssetPath = 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite';
                        const baseOpts = {
                            baseOptions: { modelAssetPath: modelAssetPath },
                            runningMode: 'IMAGE',
                            minDetectionConfidence: 0.3,
                            minSuppressionThreshold: 0.2
                        };
                        let detector;
                        try {
                            detector = await vision.FaceDetector.createFromOptions(fileset, { ...baseOpts, baseOptions: { ...baseOpts.baseOptions, delegate: 'GPU' } });
                        } catch (gpuErr) {
                            console.warn('Face detector GPU failed, falling back to CPU:', gpuErr);
                            detector = await vision.FaceDetector.createFromOptions(fileset, { ...baseOpts, baseOptions: { ...baseOpts.baseOptions, delegate: 'CPU' } });
                        }
                        app.upload._faceModel = detector;
                        return detector;
                    })();

                    return app.upload._faceModelLoading;
                },

                detectFaces: async () => {
                    const container = document.getElementById('preview-container');
                    const previewImg = document.getElementById('preview-img');
                    if (!container || !previewImg) return;

                    if (app.upload._faceDetecting) return;
                    app.upload._faceDetecting = true;

                    try {
                        const detector = await app.upload.loadFaceModel();

                        const natW = previewImg.naturalWidth || container.clientWidth;
                        const natH = previewImg.naturalHeight || container.clientHeight;
                        const detW = Math.min(natW, 1280);
                        const detH = Math.round(natH * (detW / natW));

                        const canvas = document.createElement('canvas');
                        canvas.width = detW;
                        canvas.height = detH;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(previewImg, 0, 0, detW, detH);

                        const results = await detector.detect(canvas);
                        const detections = results.detections || [];
                        if (detections.length === 0) return;

                        let added = 0;
                        detections.forEach(d => {
                            const box = d.boundingBox;
                            if (!box) return;
                            const x = box.originX;
                            const y = box.originY;
                            const w = box.width;
                            const h = box.height;

                            const padX = w * 0.15;
                            const padY = h * 0.2;
                            const fx = Math.max(0, x - padX);
                            const fy = Math.max(0, y - padY);
                            const fw = Math.min(detW - fx, w + padX * 2);
                            const fh = Math.min(detH - fy, h + padY * 2);

                            const left = (fx / detW) * container.clientWidth;
                            const top = (fy / detH) * container.clientHeight;
                            const pw = (fw / detW) * container.clientWidth;
                            const ph = (fh / detH) * container.clientHeight;

                            app.upload.buildBlurPanel({ left, top, width: pw, height: ph, auto: true });
                            added++;
                        });

                        if (added > 0) {
                            app.toast.show('success', 'Đã tự động che khuôn mặt', `Phát hiện và che ${added} khuôn mặt. Bạn có thể kéo, đổi kích thước hoặc xóa từng vùng.`);
                        }
                    } catch (err) {
                        console.error('Auto face-blur skipped:', err);
                    } finally {
                        app.upload._faceDetecting = false;
                    }
                },

                removeBlurPanel: (id) => {
                    const panel = document.getElementById(id);
                    if (panel) panel.remove();
                    app.upload.updateBlurBtn();
                },

                updateBlurBtn: () => {
                    const count = document.querySelectorAll('.blur-panel').length;
                    const btn = document.getElementById('btn-add-blur');
                    if (btn) btn.innerHTML = `<i class="fa-solid fa-droplet-slash"></i> Làm mờ (${count})`;

                    let warningBox = document.getElementById('blur-warning-box');
                    if (!warningBox) {
                        warningBox = document.createElement('div');
                        warningBox.id = 'blur-warning-box';
                        warningBox.className = 'mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl shadow-sm flex items-start gap-2 hidden';
                        warningBox.innerHTML = '<i class="fa-solid fa-triangle-exclamation text-amber-500 mt-0.5 text-xs"></i><p class="text-[11px] text-amber-800 font-bold leading-relaxed m-0">Không lạm dụng công cụ làm mờ. Vùng làm mờ/che vật thể tuyệt đối không được đè lên bất kỳ bộ phận nào của xe (thân xe, bánh xe, kính, đèn...), tránh làm ảnh hưởng đến tính toàn vẹn và chi tiết của chủ thể.</p>';
                        const toolbar = document.getElementById('vnbus-editor-toolbar');
                        if (toolbar) toolbar.appendChild(warningBox);
                    }
                    if (count > 0) warningBox.classList.remove('hidden');
                    else warningBox.classList.add('hidden');
                },

                checkPlate: async (val) => {
                    const rawPlate = val.replace(/[^A-Z0-9-]/gi, '').toUpperCase();
                    const msg = document.getElementById('plate-msg');
                    const btnSubmit = document.getElementById('btn-submit');

                    const unlockUI = () => {
                        app.vehicleLocked = false;
                        app.currentVehicle = null;

                        ['up-operator', 'up-model', 'up-route'].forEach(id => {
                            const el = document.getElementById(id);
                            if(el) { el.readOnly = false; el.classList.remove('bg-gray-100'); }
                        });

                        document.getElementById('locked-msg')?.classList.add('hidden');
                        if(app.upload.applyPreferenceUI) app.upload.applyPreferenceUI();

                        const btnBus = document.getElementById('btn-type-bus');
                        const btnCoach = document.getElementById('btn-type-coach');
                        if(btnBus) btnBus.classList.remove('opacity-60', 'opacity-80', 'cursor-not-allowed');
                        if(btnCoach) btnCoach.classList.remove('opacity-60', 'opacity-80', 'cursor-not-allowed');

                        if(btnSubmit && !document.getElementById('upload-quota-text')?.classList.contains('text-red-600')) btnSubmit.disabled = false;
                    };

                    if (rawPlate.startsWith('80')) {
                        unlockUI();
                        if(btnSubmit) btnSubmit.disabled = true;
                        msg.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Tuyệt đối nghiêm cấm đăng tải ảnh xe của các cơ quan nhà nước/chính phủ!';
                        msg.className = "text-xs mt-1 text-red-600 font-bold";
                        return;
                    }

                    const regex = /^([0-9]{2}[A-Z]{1,2}[0-9]{4,5}|[0-9]{2}LD[0-9]{4,5}|T[0-9]{7}|[A-Z]{3}[0-9]{4,7})(-[0-9]+)?$/i;

                    if (!regex.test(rawPlate)) {
                        unlockUI();
                        msg.innerText = "Định dạng BKS không hợp lệ (VD: 29A12345, T1234567, HAN1234567)";
                        msg.className = "text-xs mt-1 text-red-600 font-bold";
                        return;
                    }

                    const airportMatch = rawPlate.match(/^([A-Z]{3})\d{4,7}/);
                    if (airportMatch) {
                        const routeInput = document.getElementById('up-route');
                        if (routeInput && (!routeInput.value || /^[A-Z]{3}$/.test(routeInput.value))) {
                            routeInput.value = airportMatch[1];
                        }
                    }

                    const provInput = document.getElementById('up-province');
                    if (provInput && !provInput.value && app.upload && app.upload.selectProvince) {
                        const autoProv = app.utils.getProvinceFromPlate(rawPlate);
                        if (autoProv && autoProv !== 'Không xác định') {
                            app.upload.selectProvince(autoProv);
                        }
                    }

                    msg.innerText = "Đang kiểm tra dữ liệu biển định danh...";
                    msg.className = "text-xs mt-1 text-gray-500";

                    const parts = rawPlate.split('-');
                    const basePlate = parts[0];
                    const currentSuffix = parts[1] ? parseInt(parts[1]) : 0;

                    try {
                        const { data: existingVehicles } = await app.utils.promiseWithTimeout(
                            window.sb.from('vehicles').select('*').ilike('license_plate', `${basePlate}%`),
                            5000
                        );
                        app.upload.existingVehiclesList = existingVehicles || [];
                        app.upload.checkModelWarning && app.upload.checkModelWarning();

                        let existingSuffixes = [];
                        if (existingVehicles) {
                            existingVehicles.forEach(v => {
                                if (v.license_plate === basePlate) existingSuffixes.push(0);
                                else {
                                    const p = v.license_plate.split('-');
                                    if (p.length === 2 && p[0] === basePlate && !isNaN(p[1])) {
                                        existingSuffixes.push(parseInt(p[1]));
                                    }
                                }
                            });
                        }

                        const maxExisting = existingSuffixes.length > 0 ? Math.max(...existingSuffixes) : -1;
                        if (!existingSuffixes.includes(currentSuffix)) {
                            const expectedNext = maxExisting + 1;
                            if (currentSuffix !== expectedNext) {
                                if (expectedNext === 0) {
                                    msg.innerText = `Biển gốc chưa tồn tại. Vui lòng nhập ${basePlate} trước.`;
                                } else {
                                    msg.innerText = `Sai thứ tự định danh! Vui lòng nhập đúng tuần tự: ${basePlate}-${expectedNext} trước.`;
                                }
                                msg.className = "text-xs mt-1 text-red-600 font-bold";
                                unlockUI();
                                return;
                            }
                        }

                        const exactVehicle = existingVehicles?.find(v => v.license_plate === rawPlate);
                        let hasApproved = false;
                        let recentPhotos = [];

                        if (exactVehicle) {
                            const { data } = await window.sb
                                .from('photos')
                                .select('operator, route_no, type, taken_at, created_at')
                                .eq('license_plate', rawPlate)
                                .eq('status', 'approved')
                                .order('taken_at', { ascending: false, nullsFirst: false })
                                .order('created_at', { ascending: false })
                                .limit(50);

                            recentPhotos = data || [];
                            hasApproved = recentPhotos.length > 0;
                        }

                        if (exactVehicle && hasApproved) {
                            app.vehicleLocked = true;
                            app.currentVehicle = exactVehicle;
                            document.getElementById('up-model').value = exactVehicle.model || '';

                            if (recentPhotos && recentPhotos.length > 0) {
                                const dateInput = document.getElementById('up-date');
                                const uploadDate = dateInput && dateInput.value ? new Date(dateInput.value).getTime() : Date.now();

                                recentPhotos.sort((a, b) => {
                                    const timeA = a.taken_at ? new Date(a.taken_at).getTime() : new Date(a.created_at).getTime();
                                    const timeB = b.taken_at ? new Date(b.taken_at).getTime() : new Date(b.created_at).getTime();
                                    return Math.abs(timeA - uploadDate) - Math.abs(timeB - uploadDate);
                                });

                                let validPhoto = recentPhotos.find(p => p.route_no !== 'Ngoài giờ hoạt động');
                                if (!validPhoto) validPhoto = { operator: recentPhotos[0].operator, route_no: '', type: recentPhotos[0].type };

                                document.getElementById('up-operator').value = validPhoto.operator || '';
                                document.getElementById('up-route').value = validPhoto.route_no || '';

                                const dbType = validPhoto.type || 'bus';
                                const prefType = app.preference.current;

                                if (prefType !== 'both' && dbType !== prefType) {
                                    app.ui.showAlert(
                                        `Hệ thống nhận diện xe này là <b>${dbType === 'bus' ? 'Xe Buýt' : 'Xe Khách'}</b>, khác với tùy chọn Cá nhân hóa của bạn.<br><br>Bạn có muốn tạm thời mở khóa loại xe để tiếp tục đăng ảnh xe này không?`,
                                        () => {
                                            const btnBus = document.getElementById('btn-type-bus');
                                            const btnCoach = document.getElementById('btn-type-coach');
                                            if(btnBus) btnBus.classList.remove('opacity-50', 'pointer-events-none');
                                            if(btnCoach) btnCoach.classList.remove('opacity-50', 'pointer-events-none');
                                            app.upload.selectType(dbType, true);
                                            const submitBtn = document.getElementById('btn-submit');
                                            if(submitBtn && !document.getElementById('upload-quota-text')?.classList.contains('text-red-600')) submitBtn.disabled = false;
                                        },
                                        () => {
                                            const submitBtn = document.getElementById('btn-submit');
                                            if(submitBtn) submitBtn.disabled = true;
                                            msg.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Đã hủy chuyển đổi loại xe. Không thể tiếp tục đăng tải xe này.';
                                            msg.className = "text-xs mt-1 text-red-600 font-bold";
                                        },
                                        { title: "Xác nhận chuyển đổi loại xe", btnOkText: "Chuyển đổi", btnCancelText: "Hủy" }
                                    );
                                } else {
                                    app.upload.selectType(dbType, true);
                                }
                            }

                            ['up-operator', 'up-route'].forEach(id => {
                                document.getElementById(id).readOnly = false;
                                document.getElementById(id).classList.remove('bg-gray-100');
                            });

                            ['up-model'].forEach(id => {
                                document.getElementById(id).readOnly = true;
                                document.getElementById(id).classList.add('bg-gray-100');
                            });

                            document.getElementById('locked-msg').classList.remove('hidden');

                            const { data: shootersData } = await window.sb
                                .from('photos')
                                .select('profiles(username, ban_status)')
                                .eq('license_plate', rawPlate)
                                .eq('status', 'approved');

                            let shootersText = "";
                            if (shootersData && shootersData.length > 0) {
                                const uniqueUsers = [...new Set(shootersData.map(p => app.utils.formatProfileDisplay(p.profiles).username).filter(Boolean))];
                                if (uniqueUsers.length === 1) shootersText = `Xe này cũng đã được chụp bởi <b>${uniqueUsers[0]}</b>.`;
                                else if (uniqueUsers.length === 2) shootersText = `Xe này cũng đã được chụp bởi <b>${uniqueUsers[0]}</b> và <b>${uniqueUsers[1]}</b>.`;
                                else if (uniqueUsers.length > 2) shootersText = `Xe này cũng đã được chụp bởi <b>${uniqueUsers[0]}</b>, <b>${uniqueUsers[1]}</b> và <b>${uniqueUsers.length - 2} người khác</b>.`;
                            }

                            let suggestionHtml = '';
                            const otherGens = existingVehicles.filter(v => v.license_plate !== rawPlate);
                            if (otherGens.length > 0) {
                                const links = otherGens.map(v => `<a href="javascript:void(0)" onclick="document.getElementById('up-plate').value='${v.license_plate}'; app.upload.checkPlate('${v.license_plate}')" class="text-blue-600 hover:underline font-bold">${v.license_plate}</a>`).join(' hoặc ');
                                suggestionHtml = `<span class="text-gray-500 font-normal">Không phải xe này? Thử: ${links}</span>`;
                            }

                            const finalText = [shootersText, suggestionHtml].filter(Boolean).join('<br>');
                            msg.innerHTML = finalText;
                            msg.className = "text-xs mt-1 text-black";

                        } else {
                            unlockUI(); 
                            if (exactVehicle) {
                                document.getElementById('up-model').value = exactVehicle.model || '';
                            }
                            msg.innerText = "";
                            msg.className = "hidden";
                            app.upload.autoFillOperatorByRoute();
                        }

                        app.upload.checkDuplicateRealtime();
                    } catch (err) {
                        unlockUI();
                        msg.innerText = "Mất kết nối server, vui lòng nhập lại BKS.";
                        msg.className = "text-xs mt-1 text-amber-600";
                    }
                },

                toggleRoute: (val) => {
                    const lbl = document.getElementById('lbl-route');
                    if (val === 'bus') lbl.innerHTML = 'Mã số tuyến <span class="text-red-500">*</span>';
                    else lbl.innerHTML = 'Lộ trình <span class="text-red-500">*</span>';
                },

                selectType: (type, isLocked = false) => {
                    const currentType = document.getElementById('up-type').value;

                    if (app.vehicleLocked && !isLocked && currentType && currentType !== type) {
                        const typeName = type === 'bus' ? 'Xe Buýt' : 'Xe Khách';
                        app.ui.showAlert(
                            `Bạn có chắc phương tiện này đã được chuyển đổi công năng thành <b>${typeName}</b>?`,
                            () => { app.upload.performSelectType(type); },
                            () => {},
                            { countdown: true, btnOkText: "Tôi chắc chắn", btnCancelText: "Hủy", title: "Xác nhận chuyển đổi" }
                        );
                        return;
                    }
                    app.upload.performSelectType(type);
                },

                performSelectType: (type) => {
                    document.getElementById('up-type').value = type;
                    document.getElementById('type-msg').classList.add('hidden');

                    const btnBus = document.getElementById('btn-type-bus');
                    const btnCoach = document.getElementById('btn-type-coach');

                    [btnBus, btnCoach].forEach(btn => {
                        btn.className = "cursor-pointer border border-gray-300 bg-white text-gray-800 rounded-xl p-4 shadow-sm hover:border-gray-400 hover:shadow-md transition-all duration-200 group relative" + (app.vehicleLocked ? " opacity-60 cursor-not-allowed" : "");
                        const iconBg = btn.querySelector('.icon-bg');
                        iconBg.classList.remove('bg-white/20');
                        iconBg.classList.add('bg-gray-100');
                        iconBg.classList.remove('border-white/30');
                        iconBg.classList.add('border-transparent');
                        const p = btn.querySelector('p');
                        p.classList.remove('text-gray-300');
                        p.classList.add('text-gray-500');
                    });

                    const activeBtn = type === 'bus' ? btnBus : btnCoach;
                    activeBtn.className = "cursor-pointer border border-black bg-black text-white rounded-xl p-4 shadow-md transition-all duration-200 scale-[1.02]" + (app.vehicleLocked ? " opacity-80 cursor-not-allowed scale-100" : "");
                    const iconActiveBg = activeBtn.querySelector('.icon-bg');
                    iconActiveBg.classList.remove('bg-gray-100');
                    iconActiveBg.classList.add('bg-white/20');
                    iconActiveBg.classList.remove('border-transparent');
                    iconActiveBg.classList.add('border-white/30');
                    activeBtn.querySelector('p').classList.remove('text-gray-500');
                    activeBtn.querySelector('p').classList.add('text-gray-300');

                    app.upload.toggleRoute(type);
                },

                toggleColor: (isBlack) => {
                    app.wmState.color = isBlack ? 'black' : 'white';
                    const el = document.getElementById('draggable-watermark');
                    if (isBlack) el.classList.add('wm-black');
                    else el.classList.remove('wm-black');
                    if (app.upload.schedulePrepareBlob) app.upload.schedulePrepareBlob();
                },
                isBlindWatermarkEnabled: (typeof localStorage !== 'undefined' && localStorage.getItem('vnbus_wm_mode') === 'advanced'),
                loadOpenCV: async (progToast) => {
                    window._openCvReady = true;
                    return true;
                },
                setWmMode: (mode, animate = false) => {
                    if (!app.wmState) app.wmState = { x: 0.5, y: 0.5, color: 'white', scale: 1.0, mode: (typeof localStorage !== 'undefined' && localStorage.getItem('vnbus_wm_mode')) || 'basic' };
                    app.wmState.mode = mode;
                    app.upload.isBlindWatermarkEnabled = (mode === 'advanced');
                    try {
                        if (typeof localStorage !== 'undefined') localStorage.setItem('vnbus_wm_mode', mode);
                        if (animate && app.user && window.sb) {
                            const curPref = localStorage.getItem('vnbus_preference') || 'both';
                            const curShowRec = localStorage.getItem('vnbus_show_rec') !== 'false';
                            window.sb.from('profiles').update({
                                preferences: { type: curPref, showRec: curShowRec, wmMode: mode }
                            }).eq('id', app.user.id).then(()=>{});
                        }
                    } catch (e) {}

                    ['standard', 'basic', 'advanced'].forEach(m => {
                        const btn = document.getElementById(`btn-wm-mode-${m}`);
                        if (btn) {
                            if (m === mode) {
                                btn.className = 'relative z-20 px-2 py-2 rounded-lg text-xs font-bold transition-colors duration-200 text-white';
                            } else {
                                btn.className = 'relative z-20 px-2 py-2 rounded-lg text-xs font-bold transition-colors duration-200 text-gray-600 hover:text-black';
                            }
                        }
                    });
                    if (app.upload.updateWmModeSlider) app.upload.updateWmModeSlider(animate);

                    const descEl = document.getElementById('wm-mode-desc');
                    if (descEl) {
                        if (mode === 'standard') {
                            descEl.innerHTML = 'Không có dấu chìm tên tài khoản, vẫn sẽ có thanh dấu chìm tiêu chuẩn phía dưới.';
                        } else if (mode === 'basic') {
                            descEl.innerHTML = 'Có dấu chìm tên tài khoản và thanh dấu chìm tiêu chuẩn phía dưới.';
                        } else if (mode === 'advanced') {
                            descEl.innerHTML = 'Có dấu chìm tên tài khoản và thanh dấu chìm tiêu chuẩn phía dưới cùng công nghệ "Blind watermark" (<a href="https://www.vnbusarchive.io.vn/help/1527674609951047761" target="_blank" class="text-black font-bold underline">tìm hiểu thêm</a>).';
                        }
                    }

                    const customControls = document.getElementById('wm-custom-controls');
                    if (customControls) {
                        if (mode === 'standard') {
                            customControls.classList.add('opacity-40', 'pointer-events-none');
                        } else {
                            customControls.classList.remove('opacity-40', 'pointer-events-none');
                        }
                    }

                    const wmDrag = document.getElementById('draggable-watermark');
                    const previewBox = document.getElementById('preview-box');
                    if (wmDrag && previewBox && !previewBox.classList.contains('hidden')) {
                        if (mode === 'standard') {
                            wmDrag.classList.add('hidden');
                        } else {
                            wmDrag.classList.remove('hidden');
                        }
                    }

                    if (app.upload.schedulePrepareBlob) app.upload.schedulePrepareBlob();
                },
                updateWmModeSlider: (animate = false) => {
                    const mode = (app.wmState && app.wmState.mode) || 'basic';
                    const btn = document.getElementById(`btn-wm-mode-${mode}`);
                    const slider = document.getElementById('wm-mode-slider');
                    if (btn && slider && btn.offsetWidth > 0) {
                        if (!animate) {
                            slider.style.transition = 'none';
                            slider.style.left = btn.offsetLeft + 'px';
                            slider.style.width = btn.offsetWidth + 'px';
                            slider.offsetHeight; // force reflow
                            slider.style.transition = '';
                        } else {
                            slider.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                            slider.style.left = btn.offsetLeft + 'px';
                            slider.style.width = btn.offsetWidth + 'px';
                        }
                    }
                },
                toggleWmPanel: () => {
                    const panel = document.getElementById('wm-adjust-panel');
                    if (panel) {
                        panel.classList.toggle('hidden');
                        if (!panel.classList.contains('hidden')) {
                            const currentMode = (typeof localStorage !== 'undefined' && localStorage.getItem('vnbus_wm_mode')) || (app.wmState && app.wmState.mode) || 'basic';
                            if (app.upload.setWmMode) {
                                setTimeout(() => app.upload.setWmMode(currentMode, false), 10);
                            } else if (app.upload.updateWmModeSlider) {
                                setTimeout(() => app.upload.updateWmModeSlider(false), 10);
                            }
                        }
                    }
                },
                updateWmScale: (val) => {
                    app.wmState.scale = parseInt(val) / 100;
                    const valEl = document.getElementById('wm-scale-val');
                    if (valEl) valEl.innerText = val + '%';
                    
                    const el = document.getElementById('draggable-watermark');
                    const container = document.getElementById('preview-container');
                    
                    if (el && container) {
                        // 1. Cập nhật kích thước (Scale) mới
                        el.style.transform = `translate(-50%, -50%) scale(${app.wmState.scale})`;
                        
                        // 2. Tính toán lại ranh giới (Boundaries) với Scale mới
                        // Lấy tọa độ tâm hiện tại theo pixel
                        let currentLeft = app.wmState.x * container.offsetWidth;
                        let currentTop = app.wmState.y * container.offsetHeight;
                        
                        // Tính nửa chiều rộng và nửa chiều cao thực tế của chữ ký sau khi scale
                        const wHalf = (el.offsetWidth * app.wmState.scale) / 2;
                        const hHalf = (el.offsetHeight * app.wmState.scale) / 2;

                        // Ranh giới an toàn cho X (Trái/Phải)
                        const minLeft = wHalf;
                        const maxLeft = Math.max(minLeft, container.offsetWidth - wHalf);
                        
                        // Ranh giới an toàn cho Y (Trên/Dưới) - Trừ đi 8% của thanh Footer màu đen
                        const minTop = hHalf;
                        const maxTop = Math.max(minTop, container.offsetHeight - hHalf - (container.offsetHeight * 0.08));

                        // 3. Ép tọa độ tâm lùi lại vào trong nếu bị tràn
                        let newLeft = Math.max(minLeft, Math.min(currentLeft, maxLeft));
                        let newTop = Math.max(minTop, Math.min(currentTop, maxTop));

                        // 4. Nếu có sự điều chỉnh (bị đẩy vào), cập nhật lại CSS và State
                        if (newLeft !== currentLeft || newTop !== currentTop) {
                            el.style.left = newLeft + 'px';
                            el.style.top = newTop + 'px';
                            
                            app.wmState.x = newLeft / container.offsetWidth;
                            app.wmState.y = newTop / container.offsetHeight;
                        }
                    }
                    
                    if (app.upload.schedulePrepareBlob) app.upload.schedulePrepareBlob();
                },
                resetWm: () => {
                    app.wmState.scale = 1.0;
                    app.wmState.color = 'white';
                    app.wmState.x = 0.5;
                    app.wmState.y = 0.5;
                    
                    const slider = document.getElementById('wm-scale-slider');
                    if (slider) slider.value = 100;
                    
                    const valEl = document.getElementById('wm-scale-val');
                    if (valEl) valEl.innerText = '100%';
                    
                    const chk = document.getElementById('chk-wm-black');
                    if (chk) chk.checked = false;
                    const savedMode = (typeof localStorage !== 'undefined' && localStorage.getItem('vnbus_wm_mode')) || (app.wmState && app.wmState.mode) || 'basic';
                    app.upload.setWmMode(savedMode, false);
                    
                    app.upload.toggleColor(false);
                    
                    const el = document.getElementById('draggable-watermark');
                    if (el) {
                        el.style.left = '50%';
                        el.style.top = '50%';
                        el.style.transform = `translate(-50%, -50%) scale(1.0)`;
                    }
                    if (app.upload.schedulePrepareBlob) app.upload.schedulePrepareBlob();
                },
                
                previewBlob: () => {
                    if (!app.upload.readyBlob) {
                        return app.ui.showAlert("Ảnh chưa được xử lý xong, vui lòng đợi thêm 1 chút hoặc thử kéo/thả lại chữ ký!");
                    }
                    const url = URL.createObjectURL(app.upload.readyBlob);
                    app.ui.showAlert(`<img src="${url}" class="w-full rounded-lg shadow-sm" style="max-height: 70vh; object-fit: contain;">`, null, null, { title: "Xem trước ảnh xuất ra", btnOkText: "Đóng" });
                },

                currentFilters: 'none',
                readyBlob: null,
                isPreparingBlob: false,
                prepareTimeout: null,
                schedulePrepareBlob: () => {
                    if (app.upload.prepareTimeout) clearTimeout(app.upload.prepareTimeout);
                    app.upload.prepareTimeout = setTimeout(app.upload.prepareFinalBlob, 500);
                },
                prepareFinalBlob: async () => {
                    if (!app.rawFile || !app.user) return;
                    try {
                        app.upload.isPreparingBlob = true;
                        const username = app.username || "Guest";
                        const finalBlob = await app.utils.watermark(app.rawFile, username, app.wmState, app.upload.currentFilters || 'none', { embedBlind: false });
                        const targetMime = app.utils.getTargetMimeType();
                        const compressOptions = {
                            maxSizeMB: 10,
                            maxWidthOrHeight: 1920,
                            useWebWorker: true,
                            fileType: targetMime,
                            initialQuality: 0.8
                        };
                        let compressedFile = await imageCompression(finalBlob, compressOptions);
                        if (!compressedFile) compressedFile = finalBlob;
                        app.upload.readyBlob = compressedFile;
                    } catch (err) {
                        console.error("Lỗi prepareFinalBlob:", err);
                        app.upload.readyBlob = null;
                        if (err && err.message && err.message.includes("BLIND_WM_ERROR:")) {
                            app.ui.showAlert(err.message.replace("BLIND_WM_ERROR:", ""));
                        }
                    } finally {
                        app.upload.isPreparingBlob = false;
                    }
                },
                toggleColorPanel: () => {
                    const panel = document.getElementById('color-adjust-panel');
                    if(panel) panel.classList.toggle('hidden');
                },
                updateFilters: () => {
                    const b = Number(document.getElementById('adj-brightness')?.value || 100);
                    const c = Number(document.getElementById('adj-contrast')?.value || 100);
                    const s = Number(document.getElementById('adj-saturation')?.value || 100);

                    const vb = document.getElementById('val-brightness');
                    const vc = document.getElementById('val-contrast');
                    const vs = document.getElementById('val-saturation');
                    if(vb) vb.innerText = b + '%';
                    if(vc) vc.innerText = c + '%';
                    if(vs) vs.innerText = s + '%';

                    const isDefault = (b === 100 && c === 100 && s === 100);
                    const filterString = isDefault ? 'none' : `brightness(${b}%) contrast(${c}%) saturate(${s}%)`;
                    const previewImg = document.getElementById('preview-img');
                    if(previewImg) previewImg.style.filter = filterString;
                    app.upload.currentFilters = filterString;
                    if (app.upload.schedulePrepareBlob) app.upload.schedulePrepareBlob();
                },
                resetFilters: () => {
                    const b = document.getElementById('adj-brightness');
                    const c = document.getElementById('adj-contrast');
                    const s = document.getElementById('adj-saturation');
                    if(b) b.value = 100;
                    if(c) c.value = 100;
                    if(s) s.value = 100;
                    app.upload.updateFilters();
                },
                removeImage: () => {
                    const upFile = document.getElementById('up-file');
                    if (upFile) upFile.value = '';

                    const previewBox = document.getElementById('preview-box');
                    if (previewBox) previewBox.classList.add('hidden');

                    const dropZone = document.getElementById('drop-zone');
                    const connectedZone = document.getElementById('webrtc-connected-zone');

                    if (app.webrtc && app.webrtc.conn && app.webrtc.conn.open) {
                        if (connectedZone) {
                            connectedZone.classList.remove('hidden');
                            connectedZone.classList.add('flex');
                        }
                        if (dropZone) dropZone.classList.add('hidden');
                    } else {
                        if (dropZone) dropZone.classList.remove('hidden');
                        if (connectedZone) {
                            connectedZone.classList.remove('flex');
                            connectedZone.classList.add('hidden');
                        }
                    }

                    if (app.upload.restoreDropZone) app.upload.restoreDropZone();

                    const previewImg = document.getElementById('preview-img');
                    if (previewImg) {
                        previewImg.onload = null;
                        previewImg.onerror = null;
                        previewImg.removeAttribute('src');
                    }

                    if (app.webrtc && app.webrtc.resetMobile) app.webrtc.resetMobile();
                    app.rawFile = null;
                    app.crop.sourceImage = null;
                    app.crop.savedCropData = null;
                    app.crop.savedRatio = 4/3;
                    app.currentExif = { camera: 'N/A', params: 'N/A' };

                    const upCamera = document.getElementById('up-camera');
                    if (upCamera) upCamera.value = 'N/A';

                    const upExif = document.getElementById('up-exif-params');
                    if (upExif) upExif.value = 'N/A';

                    const upDate = document.getElementById('up-date');
                    if (upDate) upDate.value = '';

                    if(app.upload.resetWm) app.upload.resetWm();
                    if(app.upload.resetFilters) app.upload.resetFilters();

                    document.querySelectorAll('.blur-panel').forEach(p => p.remove());
                    if (app.upload.updateBlurBtn) app.upload.updateBlurBtn();
                },
                handleFileSelect: async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;

                    app.upload._faceAutoRun = false;
                    app.crop.sourceImage = null;
                    app.crop.savedCropData = null;
                    app.crop.savedRatio = 4/3;

                    const dropZone = document.getElementById('drop-zone');
                    const visualEl = dropZone ? dropZone.querySelector('.pointer-events-none') : null;
                    const connectedZone = document.getElementById('webrtc-connected-zone');

                    const isWebrtcActive = app.webrtc && app.webrtc.conn && connectedZone && !connectedZone.classList.contains('hidden');

                    if (isWebrtcActive) {
                        const cIcon = document.getElementById('webrtc-connected-icon');
                        const cTitle = document.getElementById('webrtc-connected-title');
                        const cSub = document.getElementById('webrtc-connected-sub');
                        if (cIcon) cIcon.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin text-2xl text-black"></i>';
                        if (cTitle) cTitle.innerText = 'Đang xử lý ảnh...';
                        if (cSub) cSub.innerText = 'Vui lòng đợi trong giây lát';
                    } else if (dropZone && visualEl) {
                        if (!visualEl.dataset.originalHtml) {
                            visualEl.dataset.originalHtml = visualEl.innerHTML;
                        }
                        const qrWrapper = document.getElementById('qr-btn-wrapper');
                        dropZone.style.pointerEvents = 'none';
                        visualEl.innerHTML = '<div class="flex flex-col items-center gap-3 py-4"><i class="fa-solid fa-circle-notch fa-spin text-4xl text-black"></i><p class="text-sm font-bold text-gray-600 mt-3">Đang xử lý ảnh, vui lòng đợi...</p></div>';
                        if (qrWrapper) qrWrapper.classList.add('hidden');
                        // Bắt đầu tải trước mô hình nhận diện khuôn mặt trong lúc xử lý ảnh
                        if (app.upload.loadFaceModel) app.upload.loadFaceModel().catch(() => {});
                    }

                    app.upload.restoreDropZone = () => {
                        const dz = document.getElementById('drop-zone');
                        const vis = dz ? dz.querySelector('.pointer-events-none') : null;
                        const qrWrap = document.getElementById('qr-btn-wrapper');
                        if (dz && vis && vis.dataset.originalHtml) {
                            vis.innerHTML = vis.dataset.originalHtml;
                            dz.style.pointerEvents = 'auto';
                            if (qrWrap) qrWrap.classList.remove('hidden');
                        }

                        const cIcon = document.getElementById('webrtc-connected-icon');
                        const cTitle = document.getElementById('webrtc-connected-title');
                        const cSub = document.getElementById('webrtc-connected-sub');
                        if (cIcon) cIcon.innerHTML = '<i class="fa-solid fa-mobile-screen-button text-2xl animate-pulse"></i>';
                        if (cTitle) cTitle.innerText = 'Thiết bị đã được kết nối!';
                        if (cSub) cSub.innerText = 'Vui lòng chọn ảnh trên thiết bị còn lại';
                    };

                    if (file.size > 30 * 1024 * 1024) {
                        app.ui.showAlert("File quá lớn (>30MB). Vui lòng chọn ảnh nhỏ hơn.");
                        const fileInput = document.getElementById('up-file');
                        if (fileInput) fileInput.value = '';
                        if (app.upload.restoreDropZone) app.upload.restoreDropZone();
                        if (app.webrtc && app.webrtc.resetMobile) app.webrtc.resetMobile(); 
                        return;
                    }

                    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
                    const isRawFile = /\.(nef|cr2|cr3|arw|dng|orf|rw2|pef|raf|srw|raw)$/i.test(file.name);
                    if (isMobileDevice && isRawFile) {
                        app.ui.showAlert("Định dạng RAW chỉ hỗ trợ xử lý trên PC/Desktop. Trên điện thoại, vui lòng chọn ảnh JPG, PNG hoặc HEIC.");
                        const fileInput = document.getElementById('up-file');
                        if (fileInput) fileInput.value = '';
                        if (app.upload.restoreDropZone) app.upload.restoreDropZone();
                        if (app.webrtc && app.webrtc.resetMobile) app.webrtc.resetMobile();
                        return;
                    }

                    const checkExif = new Promise(async (resolve, reject) => {
                        try {
                            let tags = {};
                            if (window.exifr) {
                                tags = await window.exifr.parse(file, { tiff: true, exif: true, gps: true }) || {};
                            } else if (window.EXIF) {
                                await new Promise((res) => window.EXIF.getData(file, function() {
                                    tags = {
                                        Model: EXIF.getTag(this, "Model"),
                                        Make: EXIF.getTag(this, "Make"),
                                        LensModel: EXIF.getTag(this, "LensModel") || EXIF.getTag(this, "LensInfo"),
                                        Software: EXIF.getTag(this, "Software"),
                                        FNumber: EXIF.getTag(this, "FNumber"),
                                        ExposureTime: EXIF.getTag(this, "ExposureTime"),
                                        ISO: EXIF.getTag(this, "ISOSpeedRatings"),
                                        DateTimeOriginal: EXIF.getTag(this, "DateTimeOriginal"),
                                        GPSLatitude: EXIF.getTag(this, "GPSLatitude"),
                                        GPSLatitudeRef: EXIF.getTag(this, "GPSLatitudeRef"),
                                        GPSLongitude: EXIF.getTag(this, "GPSLongitude"),
                                        GPSLongitudeRef: EXIF.getTag(this, "GPSLongitudeRef")
                                    };
                                    res();
                                }));
                            } else {
                                reject("Không tìm thấy thư viện xử lý EXIF."); return;
                            }

                            let model = tags.Model;
                            const make = tags.Make;
                            const lens = tags.LensModel || tags.LensInfo;
                            const software = tags.Software;
                            const fNumber = tags.FNumber || tags.fNumber;
                            const exposureTime = tags.ExposureTime || tags.exposureTime;
                            const iso = tags.ISO || tags.ISOSpeedRatings || tags.iso || tags.PhotographicSensitivity;
                            const dateTimeOriginal = tags.DateTimeOriginal || tags.CreateDate || tags.ModifyDate;

                            if (model && typeof model === 'string') model = model.trim();
                            if (!model) {
                                if (make || lens || software) {
                                    model = make ? (lens ? `${make} (${lens})` : `${make} Camera`) : (lens || software);
                                } else if (fNumber && exposureTime && iso && dateTimeOriginal) {
                                    model = "Camera (Đã ẩn Model)";
                                }
                            }

                            const helpLinkHTML = `<br><br><a href="javascript:void(0)" onclick="app.ui.closeAlert(true); setTimeout(() => app.utils.navigate('/help/1516371307481272330'), 300)" class="text-black font-bold hover:text-gray-700 hover:underline transition-colors inline-flex items-center gap-1.5"><i class="fa-solid fa-circle-info"></i> Tìm hiểu thêm & hướng dẫn khắc phục</a>`;

                            const validateAndResolve = (fraudFlag) => {
                                if (!model) { reject("Ảnh không chứa thông tin EXIF thiết bị (Model máy ảnh). Vui lòng chọn ảnh gốc chưa qua chỉnh sửa." + helpLinkHTML); return; }
                                if (!dateTimeOriginal) { reject("Ảnh không chứa thông tin ngày chụp (EXIF Date). Việc có ngày chụp gốc là bắt buộc. Vui lòng chọn file ảnh nguyên bản." + helpLinkHTML); return; }
                                if (!fNumber || !exposureTime || !iso) { reject("Ảnh bị thiếu thông số kỹ thuật máy ảnh (Khẩu độ, Tốc độ, ISO). Hệ thống bắt buộc yêu cầu các thông số này để xác thực ảnh gốc." + helpLinkHTML); return; }

                                let shutter = exposureTime;
                                if (exposureTime && exposureTime < 1) shutter = `1/${Math.round(1 / exposureTime)}`;

                                let dateStr = "";
                                if (dateTimeOriginal instanceof Date && !isNaN(dateTimeOriginal)) {
                                    const yyyy = dateTimeOriginal.getFullYear();
                                    const mm = String(dateTimeOriginal.getMonth() + 1).padStart(2, '0');
                                    const dd = String(dateTimeOriginal.getDate()).padStart(2, '0');
                                    dateStr = `${yyyy}-${mm}-${dd}`;
                                } else if (typeof dateTimeOriginal === 'string') {
                                    dateStr = dateTimeOriginal.split(' ')[0].replace(/:/g, '-');
                                } else if (dateTimeOriginal) {
                                    dateStr = String(dateTimeOriginal).split(' ')[0].replace(/:/g, '-');
                                }

                                resolve({
                                    camera: model,
                                    params: `f/${fNumber} | ${shutter}s | ISO ${iso}`,
                                    date: dateStr,
                                    gps: {
                                        latDec: tags.latitude,
                                        lonDec: tags.longitude,
                                        lat: tags.GPSLatitude,
                                        latRef: tags.GPSLatitudeRef,
                                        lon: tags.GPSLongitude,
                                        lonRef: tags.GPSLongitudeRef
                                    },
                                    suspectedFraud: fraudFlag
                                });
                            };

                            validateAndResolve(false);
                        } catch (err) {
                            reject("Lỗi đọc dữ liệu EXIF của ảnh: " + (err.message || err));
                        }
                    });

                    try {
                        const exifData = await checkExif;

                        app.currentExif = { camera: exifData.camera, params: exifData.params };
                        document.getElementById('up-camera').value = app.currentExif.camera;
                        document.getElementById('up-exif-params').value = app.currentExif.params;
                        document.getElementById('up-date').value = exifData.date;

                        app.upload.checkDuplicateRealtime();

                        if ((exifData.gps.latDec !== undefined && exifData.gps.lonDec !== undefined) || (exifData.gps.lat && exifData.gps.lon && exifData.gps.latRef && exifData.gps.lonRef)) {
                            let latDec = exifData.gps.latDec;
                            let lonDec = exifData.gps.lonDec;
                            if (latDec === undefined || lonDec === undefined || isNaN(latDec) || isNaN(lonDec)) {
                                const toDecimal = (gps, ref) => {
                                    let dec = gps[0] + gps[1] / 60 + gps[2] / 3600;
                                    if (ref === "S" || ref === "W") dec = dec * -1;
                                    return dec;
                                };
                                latDec = toDecimal(exifData.gps.lat, exifData.gps.latRef);
                                lonDec = toDecimal(exifData.gps.lon, exifData.gps.lonRef);
                            }
                            const address = await app.utils.reverseGeocode(latDec, lonDec);
                            if (address && address !== "Vị trí không xác định") {
                                document.getElementById('up-location').value = address;
                                app.utils.geocodeAddress(address);
                            }
                        }

                        const decodeFullRaw = async (rawFile) => {
                            if (!window.dcraw || !window.UTIF) {
                                throw new Error("Thiếu thư viện giải mã RAW nét gốc.");
                            }
                            const arrayBuffer = await rawFile.arrayBuffer();
                            const buf = new Uint8Array(arrayBuffer);
                            const tiffBuffer = window.dcraw(buf, { exportAsTiff: true });
                            const tiffData = tiffBuffer.buffer || tiffBuffer;
                            const ifds = window.UTIF.decode(tiffData);
                            if (!ifds || !ifds[0]) throw new Error("Không thể đọc định dạng TIFF sau giải mã RAW.");
                            window.UTIF.decodeImage(tiffData, ifds[0]);
                            const rgba = window.UTIF.toRGBA8(ifds[0]);

                            const canvas = document.createElement('canvas');
                            canvas.width = ifds[0].width;
                            canvas.height = ifds[0].height;
                            const ctx = canvas.getContext('2d');
                            const imgData = ctx.createImageData(canvas.width, canvas.height);
                            imgData.data.set(new Uint8ClampedArray(rgba));
                            ctx.putImageData(imgData, 0, 0);

                            const fullResBlob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.95));
                            return new File([fullResBlob], rawFile.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: "image/jpeg" });
                        };

                        let fileToLoad = file;
                        const isRawFile = /\.(cr2|cr3|nef|arw|dng|rw2|orf|pef|raf|raw)$/i.test(file.name);
                        const isHeicFile = /\.(heic|heif)$/i.test(file.name) || file.type === 'image/heic' || file.type === 'image/heif';
                        let isRawExtracted = false;

                        if (isHeicFile) {
                            const progToast = app.toast.createProgress('Đang chuyển đổi định dạng ảnh HEIF/HEIC...');
                            if (progToast) progToast.update(50, 'Đang giải mã HEIF/HEIC...', 'Đang tối ưu hóa định dạng ảnh...');
                            try {
                                fileToLoad = await app.utils.decodeHeic(file);
                                isRawExtracted = true;
                            } catch (e) {
                                console.warn("Giải mã HEIF/HEIC trước khi load preview thất bại, thử lại trong fallback:", e);
                            } finally {
                                if (progToast && progToast.remove) progToast.remove();
                            }
                        } else if (isRawFile) {
                            const progToast = app.toast.createProgress('Đang giải mã ảnh RAW nét gốc (Full Resolution)...');
                            if (progToast) progToast.update(40, 'Đang giải mã ảnh RAW nét gốc...', 'Đang xử lý dữ liệu cảm biến 100% độ phân giải...');
                            try {
                                fileToLoad = await decodeFullRaw(file);
                                isRawExtracted = true;
                            } catch (e) {
                                console.warn("Giải mã RAW nét gốc thất bại, thử phương án fallback preview:", e);
                                if (window.exifr) {
                                    try {
                                        const thumbBuffer = await window.exifr.thumbnail(file);
                                        if (thumbBuffer && (thumbBuffer.byteLength > 0 || thumbBuffer.length > 0)) {
                                            fileToLoad = new File([thumbBuffer], file.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: "image/jpeg" });
                                            isRawExtracted = true;
                                        }
                                    } catch (ex) {}
                                }
                                if (!isRawExtracted && window.dcraw) {
                                    try {
                                        const arrayBuffer = await file.arrayBuffer();
                                        const buf = new Uint8Array(arrayBuffer);
                                        const thumb = window.dcraw(buf, { extractThumbnail: true });
                                        if (thumb && (thumb.byteLength > 0 || thumb.length > 0)) {
                                            fileToLoad = new File([thumb], file.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: "image/jpeg" });
                                            isRawExtracted = true;
                                        }
                                    } catch (ex) {}
                                }
                            } finally {
                                if (progToast && progToast.remove) progToast.remove();
                            }
                        }

                        const img = new Image();
                        const url = URL.createObjectURL(fileToLoad);

                        img.onload = async () => {
                            const w = img.width; const h = img.height;

                            if (!isRawFile && !isRawExtracted && h < 1080 && w < 1080) {
                                app.ui.showAlert(`Độ phân giải ảnh quá thấp (${w}x${h}). Yêu cầu chiều cao tối thiểu 1080px.`);
                                e.target.value = ''; URL.revokeObjectURL(url);
                                if (app.upload.restoreDropZone) app.upload.restoreDropZone();
                                if (app.webrtc && app.webrtc.resetMobile) app.webrtc.resetMobile(); 
                                return;
                            }

                            const ratio = w / h;
                            const is4by3 = Math.abs(ratio - (4/3)) < 0.05;
                            const is3by2 = Math.abs(ratio - (3/2)) < 0.05;
                            const is16by9 = Math.abs(ratio - (16/9)) < 0.05;

                            // Chuẩn hóa sang sRGB SDR bằng canvas (loại bỏ hoàn toàn HDR Gain Map / Ultra HDR / EXIF profile gây sáng chói hay tối om khi preview)
                            let normalizedFile = fileToLoad;
                            if (!isRawExtracted && w > 0 && h > 0) {
                                try {
                                    const tempCanvas = document.createElement('canvas');
                                    tempCanvas.width = w;
                                    tempCanvas.height = h;
                                    const tempCtx = tempCanvas.getContext('2d');
                                    tempCtx.drawImage(img, 0, 0, w, h);
                                    const sdrBlob = await new Promise(res => tempCanvas.toBlob(res, file.type || 'image/jpeg', 0.95));
                                    if (sdrBlob && sdrBlob.size > 0) {
                                        normalizedFile = new File([sdrBlob], file.name || 'photo.jpg', { type: sdrBlob.type || 'image/jpeg' });
                                        isRawExtracted = true;
                                    }
                                } catch (ex) {
                                    console.warn("Chuẩn hóa SDR fallback:", ex);
                                }
                            }

                            if (!app.crop.sourceImage) {
                                app.crop.sourceImage = normalizedFile;
                            }

                            if (!is4by3 && !is3by2 && !is16by9) {
                                app.crop.open('main', normalizedFile, true);
                            } else {
                                app.upload.setupPreview(normalizedFile);
                            }
                            URL.revokeObjectURL(url);
                        };

                        img.onerror = async () => {
                            try {
                                let fileToCompress = fileToLoad;
                                if (isHeicFile && !isRawExtracted) {
                                    try {
                                        fileToCompress = await app.utils.decodeHeic(file);
                                        isRawExtracted = true;
                                    } catch (ex) {}
                                } else if (isRawFile && !isRawExtracted) {
                                    try {
                                        fileToCompress = await decodeFullRaw(file);
                                        isRawExtracted = true;
                                    } catch (e) {
                                        if (window.exifr) {
                                            try {
                                                const thumbBuffer = await window.exifr.thumbnail(file);
                                                if (thumbBuffer && (thumbBuffer.byteLength > 0 || thumbBuffer.length > 0)) {
                                                    fileToCompress = new File([thumbBuffer], file.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: "image/jpeg" });
                                                    isRawExtracted = true;
                                                }
                                            } catch (ex) {}
                                        }
                                    }
                                }
                                const targetMime = app.utils.getTargetMimeType();
                                let convertedBlob = await imageCompression(fileToCompress, { maxSizeMB: 10, maxWidthOrHeight: 1920, useWebWorker: true, fileType: targetMime, initialQuality: 0.8 });
                                if (!convertedBlob) convertedBlob = fileToCompress;
                                const newUrl = URL.createObjectURL(convertedBlob);
                                const newImg = new Image();
                                newImg.onload = () => {
                                    const w = newImg.width; const h = newImg.height;
                                    if (!isRawFile && !isRawExtracted && h < 1080 && w < 1080) {
                                        app.ui.showAlert(`Độ phân giải ảnh quá thấp (${w}x${h}). Yêu cầu chiều cao tối thiểu 1080px.`);
                                        const fileInput = document.getElementById('up-file');
                                        if (fileInput) fileInput.value = ''; URL.revokeObjectURL(newUrl); URL.revokeObjectURL(url);
                                        if (app.upload.restoreDropZone) app.upload.restoreDropZone();
                                        if (app.webrtc && app.webrtc.resetMobile) app.webrtc.resetMobile(); 
                                        return;
                                    }
                                    const actualMime = convertedBlob.type || targetMime;
                                    const actualExt = actualMime === 'image/webp' ? 'webp' : (actualMime === 'image/png' ? 'png' : 'jpg');
                                    const convertedFile = new File([convertedBlob], file.name.replace(/\.[^/.]+$/, "") + "." + actualExt, { type: actualMime });
                                    const ratio = w / h;
                                    const is4by3 = Math.abs(ratio - (4/3)) < 0.05;
                                    const is3by2 = Math.abs(ratio - (3/2)) < 0.05;
                                    const is16by9 = Math.abs(ratio - (16/9)) < 0.05;

                                    if (!is4by3 && !is3by2 && !is16by9) {
                                        app.crop.open('main', convertedFile, true);
                                    } else {
                                        app.upload.setupPreview(convertedFile);
                                    }
                                    URL.revokeObjectURL(newUrl);
                                    URL.revokeObjectURL(url);
                                };
                                newImg.onerror = () => {
                                    app.ui.showAlert("Định dạng ảnh (RAW/JPG) không được hỗ trợ hoặc file bị hỏng.");
                                    const fileInput = document.getElementById('up-file');
                                    if (fileInput) fileInput.value = ''; URL.revokeObjectURL(newUrl); URL.revokeObjectURL(url);
                                    if (app.upload.restoreDropZone) app.upload.restoreDropZone();
                                    if (app.webrtc && app.webrtc.resetMobile) app.webrtc.resetMobile(); 
                                };
                                newImg.src = newUrl;
                            } catch (err) {
                                app.ui.showAlert("Định dạng ảnh không được hỗ trợ hoặc file bị hỏng.");
                                const fileInput = document.getElementById('up-file');
                                if (fileInput) fileInput.value = ''; URL.revokeObjectURL(url);
                                if (app.upload.restoreDropZone) app.upload.restoreDropZone();
                                if (app.webrtc && app.webrtc.resetMobile) app.webrtc.resetMobile(); 
                            }
                        };

                        img.src = url;

                    } catch (errorMsg) {
                        app.ui.showAlert(errorMsg);
                        const fileInput = document.getElementById('up-file');
                        if (fileInput) fileInput.value = ''; 
                        if (app.upload.restoreDropZone) app.upload.restoreDropZone();
                        if (app.webrtc && app.webrtc.resetMobile) app.webrtc.resetMobile(); 
                        return;
                    }
                },

                setupPreview: (file) => {
                    app.rawFile = file;
                    if (!app.crop.sourceImage) {
                        app.crop.sourceImage = file;
                    }
                    const url = URL.createObjectURL(file);
                    const previewImg = document.getElementById('preview-img');
                    
                    previewImg.onload = () => {
                        const updateSize = () => {
                            const nw = previewImg.naturalWidth, nh = previewImg.naturalHeight;
                            if (!nw || !nh) return;
                            const container = document.getElementById('preview-container');
                            const box = document.getElementById('preview-box');
                            
                            container.style.width = '100%';
                            container.style.height = 'auto';
                            
                            const availableWidth = box.clientWidth;
                            // Thu nhỏ khung hiển thị lại 1 chút để dễ bề thao tác trên Mobile/PC
                            const availableHeight = window.innerHeight * 0.65;
                            
                            const ratio = nw / nh;
                            let finalW = availableWidth;
                            let finalH = finalW / ratio;
                            
                            if (finalH > availableHeight) {
                                finalH = availableHeight;
                                finalW = finalH * ratio;
                            }
                            
                            container.style.width = finalW + 'px';
                            container.style.height = finalH + 'px';
                            
                            // ========================================================
                            // ĐỒNG BỘ 100% CÔNG THỨC TOÁN HỌC TỪ CANVAS MÀ BẠN ĐÃ VIẾT
                            // ========================================================
                            // barHeight = height * 0.08
                            // fontSize = barHeight * 0.4 = height * 0.032
                            // watermark = fontSize * 3 = height * 0.096

                            const barHeight = finalH * 0.08;
                            const baseFontSize = finalH * 0.032;
                            const watermarkFontSize = finalH * 0.096;

                            // 1. Kích thước & Lề của thanh Footer dưới đáy ảnh
                            const footerBar = document.getElementById('preview-footer-bar');
                            if (footerBar) {
                                footerBar.style.height = barHeight + 'px';
                                // Căn lề trái phải đúng bằng 1/2 chiều cao bar (chuẩn Canvas)
                                footerBar.style.paddingLeft = (barHeight / 2) + 'px';
                                footerBar.style.paddingRight = (barHeight / 2) + 'px';
                            }
                            
                            // 2. Kích thước Text trong Footer
                            const leftText = document.querySelector('.footer-text-left');
                            const rightText = document.getElementById('preview-footer-copy');
                            if (leftText) leftText.style.fontSize = baseFontSize + 'px';
                            if (rightText) rightText.style.fontSize = baseFontSize + 'px';

                            // 3. Kích thước Watermark kéo thả chính giữa
                            const wmDrag = document.getElementById('draggable-watermark');
                            if (wmDrag) {
                                wmDrag.style.fontSize = watermarkFontSize + 'px';
                                const currentScale = app.wmState ? (app.wmState.scale || 1.0) : 1.0;
                                wmDrag.style.transform = `translate(-50%, -50%) scale(${currentScale})`;
                            }
                        };
                        updateSize();
                        app.previewUpdateSize = updateSize;

                        if (document.querySelectorAll('.blur-panel').length === 0 && !app.upload._faceAutoRun) {
                            app.upload._faceAutoRun = true;
                            setTimeout(() => {
                                if (document.querySelectorAll('.blur-panel').length === 0) {
                                    app.upload.detectFaces();
                                }
                            }, 600);
                        }
                    };
                    
                    previewImg.src = url;
                    document.getElementById('preview-box').classList.remove('hidden');
                    document.getElementById('drop-zone').classList.add('hidden');

                    if (app.upload.restoreDropZone) app.upload.restoreDropZone();

                    const name = app.username || "Guest";
                    const wmName = document.getElementById('wm-username');
                    if (wmName) wmName.innerText = name;

                    const footerCopy = document.getElementById('preview-footer-copy');
                    if (footerCopy) footerCopy.innerText = `Bản quyền bởi ${name}`;

                    const wmDrag = document.getElementById('draggable-watermark');
                    if (wmDrag) {
                        if (app.wmState && app.wmState.mode === 'standard') {
                            wmDrag.classList.add('hidden');
                        } else {
                            wmDrag.classList.remove('hidden');
                        }
                        wmDrag.classList.remove('wm-active');
                    }

                    if (app.upload.resetWm) app.upload.resetWm();
                    if (app.upload.resetFilters) app.upload.resetFilters();
                },

                initDraggable: () => {
                    if (app.draggableInitialized) return;
                    app.draggableInitialized = true;

                    const el = document.getElementById('draggable-watermark');
                    const container = document.getElementById('preview-container');
                    let isDragging = false;
                    let startX, startY, initialLeft, initialTop;

                    const resizeObserver = new ResizeObserver(() => {
                        if (app.previewUpdateSize) app.previewUpdateSize();
                    });
                    resizeObserver.observe(document.getElementById('preview-box'));

                    document.addEventListener('mousedown', (e) => {
                        if (!el.contains(e.target)) el.classList.remove('wm-active');
                    });
                    document.addEventListener('touchstart', (e) => {
                        if (!el.contains(e.target)) el.classList.remove('wm-active');
                    });

                    el.addEventListener('mousedown', (e) => {
                        e.stopPropagation();
                        el.classList.add('wm-active');
                        isDragging = true;
                        startX = e.clientX;
                        startY = e.clientY;
                        initialLeft = el.offsetLeft;
                        initialTop = el.offsetTop;
                    });

                    el.addEventListener('touchstart', (e) => {
                        e.stopPropagation();
                        el.classList.add('wm-active');
                        isDragging = true;
                        startX = e.touches[0].clientX;
                        startY = e.touches[0].clientY;
                        initialLeft = el.offsetLeft;
                        initialTop = el.offsetTop;
                    });

                    const onMove = (clientX, clientY) => {
                        if (!isDragging) return;

                        const dx = clientX - startX;
                        const dy = clientY - startY;

                        let newLeft = initialLeft + dx;
                        let newTop = initialTop + dy;

                        const scale = app.wmState.scale || 1.0;
                        const wHalf = (el.offsetWidth * scale) / 2;
                        const hHalf = (el.offsetHeight * scale) / 2;

                        const minLeft = wHalf;
                        const maxLeft = Math.max(minLeft, container.offsetWidth - wHalf);
                        
                        const minTop = hHalf;
                        const maxTop = Math.max(minTop, container.offsetHeight - hHalf - (container.offsetHeight * 0.08));

                        newLeft = Math.max(minLeft, Math.min(newLeft, maxLeft));
                        newTop = Math.max(minTop, Math.min(newTop, maxTop));

                        el.style.left = newLeft + 'px';
                        el.style.top = newTop + 'px';

                        app.wmState.x = newLeft / container.offsetWidth;
                        app.wmState.y = newTop / container.offsetHeight;
                    };

                    document.addEventListener('mousemove', (e) => {
                        if (isDragging) { e.preventDefault(); onMove(e.clientX, e.clientY); }
                    });

                    document.addEventListener('touchmove', (e) => {
                        if (isDragging) { e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY); }
                    }, { passive: false });

                    const onEnd = () => { 
                        isDragging = false; 
                        if (app.upload.schedulePrepareBlob) app.upload.schedulePrepareBlob(); 
                    };
                    document.addEventListener('mouseup', onEnd);
                    document.addEventListener('touchend', onEnd);
                },

                // [MỚI] TÁCH LOGIC SUBMIT SANG HÀNG ĐỢI
                submit: async (e) => {
                    e.preventDefault();
                    if (!app.user) return app.auth.check();
                    if (!app.rawFile) return app.ui.showAlert("Vui lòng chọn ảnh!");

                    app.upload.checkModelWarning && app.upload.checkModelWarning();
                    if (app.upload.isBlockedByModelDuplicate) {
                        return app.ui.showAlert("Xe định danh phụ không được trùng dòng xe với xe khác cùng biển kiểm soát.", null, null, { title: "Từ chối tải lên" });
                    }

                    const q = app.upload.currentQuota;
                    if (q.limit !== null && q.count >= q.limit) {
                        return app.ui.showAlert(`Hệ thống đã đạt giới hạn nhận ${q.limit} ảnh của ngày hôm nay. Vui lòng quay lại sau 7:00 sáng mai!`);
                    }

                    const valPlate = document.getElementById('up-plate').value.trim();
                    const valOp = document.getElementById('up-operator').value.trim();
                    const valType = document.getElementById('up-type').value;
                    const valRoute = document.getElementById('up-route').value.trim();
                    const valModel = document.getElementById('up-model').value.trim();
                    const valLoc = document.getElementById('up-location').value.trim();
                    const valDate = document.getElementById('up-date').value;
                    let valProvince = document.getElementById('up-province').value.trim();

                    if (!valProvince && valPlate) {
                        const autoProv = app.utils.getProvinceFromPlate(valPlate);
                        if (autoProv && autoProv !== 'Không xác định') {
                            app.upload.selectProvince(autoProv);
                            valProvince = autoProv;
                        }
                    }

                    let missingFields = [];
                    if (!valType) missingFields.push("Loại xe (Xe Buýt/Khách)");
                    if (!valPlate) missingFields.push("Biển kiểm soát");
                    if (!valDate) missingFields.push("Ngày chụp");
                    if (!valRoute) missingFields.push("Mã số tuyến / Lộ trình");
                    if (!valOp) missingFields.push("Đơn vị vận hành");
                    if (!valModel) missingFields.push("Dòng xe (Model)");
                    if (!valLoc) missingFields.push("Vị trí chụp");

                    if (missingFields.length > 0) {
                        app.upload.triggerEmptyWarnings();
                        let msg = `Vui lòng điền đủ các trường bắt buộc: <b>${missingFields.join(', ')}</b>.`;
                        return app.ui.showAlert(msg, null, null, { title: "Thiếu thông tin" });
                    }

                    // 1. Kích hoạt mở Captcha NGAY LẬP TỨC để phản ứng tức thời (0ms delay)
                    const captchaPromise = app.captcha.request();

                    // 2. Cho trình duyệt 50ms để render trơn tru giao diện modal Captcha rồi mới chạy 2 task xử lý ảnh trong nền
                    const bgWebpPromise = new Promise((resolve, reject) => {
                        setTimeout(async () => {
                            try {
                                const username = app.username || "Guest";
                                const targetMime = app.utils.getTargetMimeType();

                                // Thực hiện nhúng Blind Watermark + dấu chìm hiển thị và nén ảnh trong lúc người dùng giải Captcha
                                const finalBlob = await app.utils.watermark(app.rawFile, username, app.wmState, app.upload.currentFilters || 'none', { embedBlind: true });
                                const compressOptions = { maxSizeMB: 10, maxWidthOrHeight: 1920, useWebWorker: true, fileType: targetMime, initialQuality: 0.8 };
                                let blobToProcess = null;
                                try {
                                    blobToProcess = await imageCompression(finalBlob, compressOptions);
                                } catch (e) {
                                    console.warn("imageCompression lỗi:", e);
                                }
                                if (!blobToProcess) blobToProcess = finalBlob;

                                // Chạy convertToWebpCpu trong nền trong lúc giải captcha
                                if (blobToProcess && blobToProcess.type !== targetMime) {
                                    const cpuBlob = await app.utils.convertToWebpCpu(blobToProcess, 0.8);
                                    if (cpuBlob && cpuBlob.size > 0) {
                                        resolve(new File([cpuBlob], app.rawFile.name.replace(/\.[^/.]+$/, "") + ".webp", { type: 'image/webp' }));
                                        return;
                                    }
                                }
                                if (blobToProcess && blobToProcess instanceof Blob && !(blobToProcess instanceof File)) {
                                    const ext = blobToProcess.type === 'image/webp' ? 'webp' : 'jpg';
                                    resolve(new File([blobToProcess], app.rawFile.name.replace(/\.[^/.]+$/, "") + "." + ext, { type: blobToProcess.type || targetMime }));
                                    return;
                                }
                                resolve(blobToProcess);
                            } catch (err) {
                                if (err && err.message && err.message.includes("BLIND_WM_ERROR:")) {
                                    reject(err);
                                    return;
                                }
                                console.warn("Lỗi tiến trình nền xử lý ảnh:", err);
                                resolve(app.upload.readyBlob || app.rawFile);
                            }
                        }, 50);
                    });

                    let captchaResponse;
                    try {
                        captchaResponse = await captchaPromise;
                    } catch (err) {
                        if (err.message === "CAPTCHA_CANCELLED") return; 
                        return app.ui.showAlert("Lỗi xác thực Captcha.");
                    }

                    const btn = document.getElementById('btn-submit');
                    const originalText = btn.innerHTML;

                    btn.disabled = true;
                    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Đang nén ảnh...`;

                    // Giao tiếp qua Toast
                    if (!app.upload.activeProgressToast) {
                        app.upload.activeProgressToast = app.toast.createProgress('Đang chuẩn bị ảnh...');
                    }
                    app.upload.activeProgressToast.update(20, 'Đang chuẩn bị ảnh...', 'Áp dụng Watermark & Nén (Không chuyển trang)...');

                    try {
                        let originalSizeKB = (app.rawFile.size / 1024).toFixed(2);
                        const username = app.username || "Guest";
                        const targetMime = app.utils.getTargetMimeType();

                        // Lấy kết quả từ tiến trình nền (thường đã hoàn tất hoặc gần hoàn tất trong lúc giải captcha)
                        let compressedFile;
                        try {
                            compressedFile = await bgWebpPromise;
                        } catch (bwErr) {
                            if (app.upload.activeProgressToast && app.upload.activeProgressToast.remove) app.upload.activeProgressToast.remove();
                            btn.disabled = false;
                            btn.innerHTML = originalText;
                            const msg = bwErr && bwErr.message ? bwErr.message.replace("BLIND_WM_ERROR:", "") : "Lỗi xử lý ảnh.";
                            return app.ui.showAlert(msg);
                        }

                        // Nếu tiến trình nền chưa ra webp thì chạy fallback lần cuối
                        if (!compressedFile || (compressedFile.type !== targetMime && compressedFile.type !== 'image/webp')) {
                            const fallbackBlob = compressedFile || app.rawFile;
                            const cpuBlob = await app.utils.convertToWebpCpu(fallbackBlob, 0.8);
                            if (cpuBlob && cpuBlob.size > 0) {
                                compressedFile = new File([cpuBlob], app.rawFile.name.replace(/\.[^/.]+$/, "") + ".webp", { type: 'image/webp' });
                            }
                        }

                        if (!compressedFile) {
                            throw new Error("Không thể xử lý và nén ảnh. Vui lòng thử lại!");
                        }

                        let compressedSizeKB = (compressedFile.size / 1024).toFixed(2);

                        if (compressedFile.type !== targetMime && compressedFile.type !== 'image/webp') {
                            throw new Error(`Trình duyệt của bạn không hỗ trợ định dạng WebP.`);
                        }

                        // Gom dữ liệu để đẩy vào Hàng đợi (Queue)
                        const uploadData = new FormData();
                        uploadData.append('file', compressedFile);
                        uploadData.append('userId', app.user.id);
                        uploadData.append('captchaToken', captchaResponse);
                        uploadData.append('fileExtension', app.utils.getTargetExtension());
                        uploadData.append('meta_plate', valPlate.replace(/[^A-Z0-9-]/gi, '').toUpperCase());
                        uploadData.append('meta_operator', app.utils.fixUnicode(valOp));
                        uploadData.append('meta_type', valType);
                        uploadData.append('meta_route', app.utils.fixUnicode(valRoute));
                        uploadData.append('meta_model', app.utils.fixUnicode(valModel));
                        uploadData.append('meta_location', app.utils.fixUnicode(valLoc));
                        uploadData.append('meta_province', app.utils.fixUnicode(document.getElementById('up-province')?.value || ''));
                        uploadData.append('meta_note', app.utils.fixUnicode(document.getElementById('up-note').value));
                        uploadData.append('meta_taken_at', valDate);
                        uploadData.append('meta_username', username);
                        uploadData.append('meta_camera_model', app.currentExif.camera);
                        uploadData.append('meta_exif_params', app.currentExif.params);
                        uploadData.append('meta_suspected_exif_fraud', app.currentExif.suspectedFraud ? 'true' : 'false');

                        app.upload.uploadQueue.push({
                            formData: uploadData,
                            plate: valPlate.replace(/[^A-Z0-9-]/gi, '').toUpperCase(),
                            originalSizeKB: originalSizeKB,
                            compressedSizeKB: compressedSizeKB,
                            fileName: app.rawFile ? app.rawFile.name : 'N/A',
                            fileType: app.rawFile ? app.rawFile.type : 'N/A'
                        });

                        // Ảo hóa Quota để chặn upload nếu đang trong hàng chờ
                        if (app.upload.currentQuota.limit !== null) app.upload.currentQuota.count++;

                        // Xóa sạch form ngay lập tức cho người dùng thao tác tiếp
                        app.utils.cleanupState(); 
                        window.scrollTo({ top: 0, behavior: 'smooth' });

                        app.upload.processQueue();

                    } catch (err) {
                        if (app.upload.activeProgressToast) {
                            app.upload.activeProgressToast.remove();
                            app.upload.activeProgressToast = null;
                        }
                        app.ui.showUploadProgress(); 
                        app.ui.updateUploadError(err.message);
                    } finally {
                        btn.innerHTML = originalText;
                        btn.disabled = false;
                    }
                },

                triggerEmptyWarnings: () => {
                    const fields = [
                        {id: 'up-plate', errId: 'plate-msg', name: 'Biển kiểm soát'},
                        {id: 'up-route', errId: 'err-up-route', name: 'Mã số tuyến'},
                        {id: 'up-operator', errId: 'err-up-operator', name: 'Đơn vị vận hành'},
                        {id: 'up-model', errId: 'err-up-model', name: 'Dòng xe'},
                        {id: 'up-location', errId: 'err-up-location', name: 'Vị trí chụp'}
                    ];

                    fields.forEach(f => {
                        const el = document.getElementById(f.id);
                        const errEl = document.getElementById(f.errId);
                        if (el && errEl && !el.readOnly) {
                            if (!el.value.trim()) {
                                if (f.id === 'up-plate') {
                                    if (!errEl.innerText.includes("Định dạng")) {
                                        errEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Vui lòng nhập ${f.name}`;
                                        errEl.className = "text-xs mt-1 text-red-600 font-bold";
                                    }
                                } else {
                                    errEl.classList.remove('hidden');
                                }
                                el.classList.remove('border-gray-300', 'focus:ring-black');
                                el.classList.add('border-red-500', 'focus:ring-red-500');
                            } else {
                                if (f.id !== 'up-plate') errEl.classList.add('hidden');
                                else if (errEl.innerText.includes("Vui lòng nhập")) errEl.innerText = "";
                                el.classList.remove('border-red-500', 'focus:ring-red-500');
                                el.classList.add('border-gray-300', 'focus:ring-black');
                            }
                        }
                    });

                    const provVal = document.getElementById('up-province')?.value.trim();
                    const provBtn = document.getElementById('up-province-btn');
                    const provErr = document.getElementById('err-up-province');
                    if (provBtn && provErr) {
                        if (!provVal) {
                            provErr.classList.remove('hidden');
                            provBtn.classList.remove('border-gray-300', 'focus:ring-black');
                            provBtn.classList.add('border-red-500', 'focus:ring-red-500');
                        } else {
                            provErr.classList.add('hidden');
                            provBtn.classList.remove('border-red-500', 'focus:ring-red-500');
                            provBtn.classList.add('border-gray-300', 'focus:ring-black');
                        }
                    }
                    
                    const typeMsg = document.getElementById('type-msg');
                    if (typeMsg) {
                        if (!document.getElementById('up-type').value) {
                            typeMsg.classList.remove('hidden');
                        } else {
                            typeMsg.classList.add('hidden');
                        }
                    }
                },
                
                initValidation: () => {
                    const fields = [
                        {id: 'up-plate', errId: 'plate-msg', name: 'Biển kiểm soát'},
                        {id: 'up-route', errId: 'err-up-route', name: 'Mã số tuyến'},
                        {id: 'up-operator', errId: 'err-up-operator', name: 'Đơn vị vận hành'},
                        {id: 'up-model', errId: 'err-up-model', name: 'Dòng xe'},
                        {id: 'up-location', errId: 'err-up-location', name: 'Vị trí chụp'}
                    ];

                    fields.forEach(f => {
                        const el = document.getElementById(f.id);
                        const errEl = document.getElementById(f.errId);
                        if (el && errEl) {
                            const clearError = () => {
                                if (f.id !== 'up-plate') {
                                    errEl.classList.add('hidden');
                                } else if (errEl.innerText.includes("Vui lòng nhập")) {
                                    errEl.innerText = "";
                                }
                                el.classList.remove('border-red-500', 'focus:ring-red-500');
                                el.classList.add('border-gray-300', 'focus:ring-black');
                            };

                            el.addEventListener('blur', () => {
                                if (!el.value.trim() && !el.readOnly) {
                                    if (f.id === 'up-plate') {
                                        if (!errEl.innerText.includes("Định dạng")) {
                                            errEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Vui lòng nhập ${f.name}`;
                                            errEl.className = "text-xs mt-1 text-red-600 font-bold";
                                        }
                                    } else {
                                        errEl.classList.remove('hidden');
                                    }
                                    el.classList.remove('border-gray-300', 'focus:ring-black');
                                    el.classList.add('border-red-500', 'focus:ring-red-500');
                                } else {
                                    clearError();
                                }
                            });
                            
                            el.addEventListener('input', clearError);
                            el.addEventListener('change', clearError);
                        }
                    });
                },
                checkQuota: async () => {
                    if (!app.user) return;

                    const pill = document.getElementById('upload-quota-pill');
                    const textEl = document.getElementById('upload-quota-text');
                    const fileInput = document.getElementById('up-file');
                    const btnSubmit = document.getElementById('btn-submit');

                    if (!pill) return;
                    pill.classList.remove('hidden');
                    textEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-gray-400"></i>';

                    try {
                        const limitSetting = app.maintenance.settings['upload_quota']?.reason;
                        const hasLimit = limitSetting && limitSetting.trim() !== '';
                        const limitNum = hasLimit ? parseInt(limitSetting) : null;

                        const last7AM = app.utils.getLast7AM_UTC7();
                        const { count } = await window.sb.from('photos')
                            .select('*', { count: 'exact', head: true })
                            .gte('created_at', last7AM);

                        app.upload.currentQuota = { limit: limitNum, count: count || 0 };

                        textEl.classList.remove('text-black', 'text-amber-500', 'text-red-600');

                        // Cộng dồn ảo hóa trong UI Queue
                        const totalQueueAssumed = app.upload.uploadQueue.length;
                        const realCount = (count || 0) + totalQueueAssumed;

                        if (!hasLimit) {
                            textEl.innerText = `${realCount} lượt (Không giới hạn)`;
                            textEl.classList.add('text-black');
                            fileInput.disabled = false;
                            fileInput.classList.remove('opacity-50', 'cursor-not-allowed');
                        } else {
                            textEl.innerText = `${realCount}/${limitNum} lượt hôm nay`;
                            const remaining = limitNum - realCount;

                            if (limitNum === 0 || remaining <= 0) {
                                textEl.classList.add('text-red-600');
                                fileInput.disabled = true;
                                btnSubmit.disabled = true;
                                fileInput.classList.add('opacity-50', 'cursor-not-allowed');
                                textEl.innerText = limitNum === 0 ? `Hệ thống tạm đóng upload` : `Hết slot hôm nay (${realCount}/${limitNum})`;
                            } else if (remaining <= 3) {
                                textEl.classList.add('text-amber-500');
                                fileInput.disabled = false;
                                fileInput.classList.remove('opacity-50', 'cursor-not-allowed');
                            } else {
                                textEl.classList.add('text-black');
                                fileInput.disabled = false;
                                fileInput.classList.remove('opacity-50', 'cursor-not-allowed');
                            }
                        }
                    } catch (e) {
                        textEl.innerText = "Lỗi kiểm tra giới hạn";
                        textEl.classList.add('text-red-500');
                    }
                },
                
                // [MỚI] HÀM TIẾN TRÌNH XỬ LÝ HÀNG ĐỢI
                processQueue: async () => {
                    if (app.upload.isQueueProcessing || app.upload.uploadQueue.length === 0) return;
                    app.upload.isQueueProcessing = true;

                    while (app.upload.uploadQueue.length > 0) {
                        const item = app.upload.uploadQueue[0];
                        const remaining = app.upload.uploadQueue.length;

                        if (!app.upload.activeProgressToast) {
                            app.upload.activeProgressToast = app.toast.createProgress('Đang tải lên...');
                        }

                        const titleText = remaining > 1 ? `Đang xử lý tiếp (${remaining} ảnh xếp hàng)...` : `Đang tải lên máy chủ...`;
                        app.upload.activeProgressToast.update(50, titleText, `BKS: ${item.plate}`);

                        let token;
                        try {
                            const { data: { session } } = await window.sb.auth.getSession();
                            token = session?.access_token;
                        } catch (e) {}

                        let result = null;
                        let uploadAttempts = 0;
                        const maxUploadAttempts = 3;
                        let lastUploadErr = null;

                        while (uploadAttempts < maxUploadAttempts) {
                            uploadAttempts++;
                            try {
                                const response = await fetch('/api/upload', {
                                    method: 'POST',
                                    headers: { 'Authorization': `Bearer ${token}` },
                                    body: item.formData
                                });

                                result = await response.json().catch(err => {
                                    console.error('[EXHAUSTIVE UPLOAD LOG - JSON PARSE ERROR]:', err, response);
                                    return { success: false, error: 'Phản hồi từ máy chủ không phải JSON: ' + err.message };
                                });

                                console.log(`[EXHAUSTIVE UPLOAD LOG - Response Attempt ${uploadAttempts}]:`, { status: response.status, result });

                                if (response.status === 401 || (result && result.error && result.error.message && result.error.message.includes('JWT'))) {
                                    app.upload.activeProgressToast.update(60, 'Phiên hết hạn, đang kết nối lại...', `Thử lại lần ${uploadAttempts}`);
                                    const { data: { session: newSession } } = await window.sb.auth.refreshSession();
                                    if (newSession && newSession.access_token) {
                                        token = newSession.access_token;
                                        uploadAttempts--;
                                        continue;
                                    } else {
                                        throw new Error('Phiên đã hết hạn. Vui lòng tải lại trang và đăng nhập lại.');
                                    }
                                }

                                if (!result.success) {
                                    console.error('[EXHAUSTIVE UPLOAD LOG - SERVER RETURNED FAILURE]:', JSON.stringify(result, null, 2));
                                    let errorDetail = result.error;
                                    if (typeof errorDetail === 'object' && errorDetail !== null) {
                                        errorDetail = errorDetail.message || JSON.stringify(errorDetail);
                                    }
                                    if (result.details) errorDetail += ` | Details: ${result.details}`;
                                    if (result.code) errorDetail += ` | Code: ${result.code}`;
                                    if (result.hint) errorDetail += ` | Hint: ${result.hint}`;
                                    throw new Error(errorDetail || 'Máy chủ từ chối yêu cầu Upload.');
                                }
                                break;
                            } catch (err) {
                                lastUploadErr = err;
                                console.error(`[EXHAUSTIVE UPLOAD LOG - ATTEMPT ${uploadAttempts} EXCEPTION]:`, err, err.stack || '');
                                if (uploadAttempts < maxUploadAttempts) {
                                    app.upload.activeProgressToast.update(50, `Lỗi mạng. Đang thử lại ${uploadAttempts}/${maxUploadAttempts}...`, `BKS: ${item.plate}`);
                                    await new Promise(r => setTimeout(r, 2500));
                                }
                            }
                        }

                        if (!result || !result.success) {
                            console.error('[EXHAUSTIVE UPLOAD LOG - FINAL FAILURE COMPLETE DETAILS]:', {
                                plate: item.plate,
                                lastUploadErr,
                                result,
                                attempts: uploadAttempts
                            });
                            // FALLBACK XOÁ ẢNH KHI LỖI DB
                            if (result && result.url) {
                                try {
                                    await fetch('/api/delete-image', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                        body: JSON.stringify({ imageUrl: result.url })
                                    });
                                } catch (delErr) {
                                    console.error('[EXHAUSTIVE UPLOAD LOG - DELETE FALLBACK ERROR]:', delErr);
                                }
                            }

                            if (app.upload.activeProgressToast) {
                                app.upload.activeProgressToast.remove();
                                app.upload.activeProgressToast = null;
                            }

                            // Xóa ảnh lỗi khỏi queue
                            app.upload.uploadQueue.shift();
                            app.upload.isQueueProcessing = false;

                            let displayError = lastUploadErr ? lastUploadErr.message : "Upload thất bại";
                            if (displayError === '[object Object]') displayError = JSON.stringify(lastUploadErr);


                            const localErrors = ["Trình duyệt của bạn không hỗ trợ", "Ảnh quá phức tạp", "Lỗi nén ảnh"];
                            const shouldReport = !localErrors.some(eStr => displayError.includes(eStr));
                            let actuallyReported = false;

                            if (shouldReport) {
                                try {
                                    const reportRes = await fetch('/api/notify', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            action: 'bug',
                                            errorMessage: displayError,
                                            fileInfo: { name: item.fileName, type: item.fileType, originalSize: item.originalSizeKB, compressedSize: item.compressedSizeKB },
                                            consoleLogs: window._consoleErrors || [],
                                            user: app.user ? { username: app.username, id: app.user.id } : null,
                                            userAgent: navigator.userAgent
                                        })
                                    });
                                    if (reportRes.ok) { const rData = await reportRes.json(); if (rData && rData.success) actuallyReported = true; }
                                } catch (e) {}
                            }

                            const uiErrorMsg = actuallyReported ? displayError : `[NO_REPORT] ${displayError}`;
                            app.ui.showUploadProgress(); 
                            app.ui.updateUploadError(uiErrorMsg);
                            break; // NGẮT TIẾN TRÌNH KHÔNG CHẠY CÁC ẢNH SAU CHO TỚI KHI USER THAO TÁC LẠI
                        }

                        // --- THÀNH CÔNG ---
                        app.upload.activeProgressToast.update(100, `Hoàn thành ${item.plate}!`, 'Đang đồng bộ dữ liệu...');
                        app.upload.uploadQueue.shift(); 

                        let queueCount = '?';
                        let newPhotoId = null;
                        try {
                            const { data: pendingData } = await window.sb.from('photos').select('id, uploader_id, created_at, profiles(role)').eq('status', 'pending');
                            if (pendingData) {
                                let ahead = 0;
                                const isMePrivileged = (app.role === 'admin' || app.role === 'manager');
                                const myPhotos = pendingData.filter(p => p.uploader_id === app.user.id).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
                                if (myPhotos.length > 0) {
                                    const myPhoto = myPhotos[0];
                                    newPhotoId = myPhoto.id;
                                    const myTime = new Date(myPhoto.created_at).getTime();

                                    pendingData.forEach(p => {
                                        if (p.id === myPhoto.id) return;
                                        const pRole = p.profiles?.role || 'user';
                                        const pPrivileged = (pRole === 'admin' || pRole === 'manager');
                                        const pTime = new Date(p.created_at).getTime();

                                        if (isMePrivileged) { if (pPrivileged && pTime < myTime) ahead++; }
                                        else { if (pPrivileged) ahead++; else if (pTime < myTime) ahead++; }
                                    });
                                    queueCount = ahead;
                                } else { queueCount = Math.max(0, pendingData.length - 1); }
                            }
                        } catch (e) {}

                        app.toast.show(
                            'success',
                            `Đã tải lên xe ${item.plate}!`,
                            `Chờ duyệt trước bạn: <b>${queueCount} ảnh</b>. Nhấn để xem chi tiết.`,
                            7000,
                            newPhotoId ? () => { app.utils.navigate(`/photo/${newPhotoId}`); } : null
                        );
                    }

                    if (app.upload.uploadQueue.length === 0) {
                        if (app.upload.activeProgressToast) {
                            app.upload.activeProgressToast.remove();
                            app.upload.activeProgressToast = null;
                        }
                        app.upload.isQueueProcessing = false;
                        app.upload.checkQuota(); // Check quota thực tế lại khi vừa up xong
                    }
                }

            }
});

Object.assign(window.app, {
  crop: {
                cropper: null,
                mode: 'main',
                originalFile: null,
                sourceImage: null, // Lưu ảnh gốc chưa qua cắt để phục vụ chỉnh sửa nhiều lần (non-destructive cropping)
                savedCropData: null, // Lưu tọa độ và kích thước khung cắt lần trước
                savedRatio: 4/3, // Lưu tỉ lệ khung cắt lần trước
                isMandatory: false, // Thêm cờ đánh dấu bắt buộc cắt
                isRulerEnabled: false,

                open: async (mode, file = null, isMandatory = false) => {
                    if (app.crop.closeTimeout) {
                        clearTimeout(app.crop.closeTimeout);
                        app.crop.closeTimeout = null;
                    }
                    app.crop.mode = mode;
                    let targetFile = file || (mode === 'main' && app.crop.sourceImage ? app.crop.sourceImage : app.rawFile);
                    if (!targetFile) return;

                    const isHeic = /\.(heic|heif)$/i.test(targetFile.name) || targetFile.type === 'image/heic' || targetFile.type === 'image/heif';
                    if (isHeic) {
                        try {
                            const progToast = app.toast.createProgress('Đang xử lý ảnh HEIF/HEIC...');
                            if (progToast) progToast.update(50, 'Đang giải mã HEIF/HEIC...', 'Đang chuyển đổi định dạng ảnh...');
                            targetFile = await app.utils.decodeHeic(targetFile);
                            if (mode === 'main') app.rawFile = targetFile;
                            if (progToast && progToast.remove) progToast.remove();
                        } catch (err) {
                            console.warn("Lỗi chuyển đổi HEIF/HEIC trong cropper:", err);
                        }
                    }

                    app.crop.originalFile = targetFile;
                    app.crop.isMandatory = isMandatory;

                    if (app.crop.cropper) {
                        try { app.crop.cropper.destroy(); } catch (e) {}
                        app.crop.cropper = null;
                    }

                    const img = document.getElementById('crop-image');
                    if (img) {
                        img.onload = null;
                        img.onerror = null;
                        img.removeAttribute('src');
                        img.removeAttribute('style');
                        img.style.cssText = 'max-width: 100%; max-height: 100%; display: block; -webkit-touch-callout: none;';
                        img.className = '';
                    }

                    const modal = document.getElementById('crop-modal');
                    const content = document.getElementById('crop-content');
                    const ratioContainer = document.getElementById('crop-ratios');

                    modal.classList.remove('hidden');
                    app.ui.lockScroll();
                    setTimeout(() => {
                        if (content) {
                            content.classList.remove('opacity-0', 'scale-95');
                            content.classList.add('opacity-100', 'scale-100');
                        }
                    }, 10);

                    const url = URL.createObjectURL(app.crop.originalFile);

                    img.onload = () => {
                        img.onload = null;
                        img.onerror = null; // Ngăn thay đổi src sau khi load thành công kích hoạt onerror
                        if (app.crop.cropper) {
                            try { app.crop.cropper.destroy(); } catch (e) {}
                            app.crop.cropper = null;
                        }

                        setTimeout(() => {
                            if (mode === 'main') {
                                // Hiện lại thanh chọn tỉ lệ (16:9, 3:2, 4:3)
                                if(ratioContainer) ratioContainer.classList.remove('hidden');

                                app.crop.cropper = new Cropper(img, {
                                    aspectRatio: (typeof app.crop.savedRatio === 'number' && !isNaN(app.crop.savedRatio)) ? app.crop.savedRatio : (4/3),
                                    viewMode: 1,
                                    autoCropArea: 1,
                                    checkCrossOrigin: false,
                                    ready: () => {
                                        app.crop.updateRulerUI();
                                        if (app.crop.cropper) {
                                            try { app.crop.cropper.update(); } catch(e){}
                                            if (app.crop.savedCropData && targetFile === app.crop.sourceImage) {
                                                try {
                                                    app.crop.cropper.setData(app.crop.savedCropData);
                                                } catch(e) { console.warn("Lỗi khôi phục vùng cắt:", e); }
                                            }
                                        }
                                    }
                                });

                                // Highlight đúng nút tỉ lệ
                                app.crop.updateRatioButtons((typeof app.crop.savedRatio === 'number' && !isNaN(app.crop.savedRatio)) ? app.crop.savedRatio : (4/3));
                            } else if (mode === 'avatar') {
                                if(ratioContainer) ratioContainer.classList.add('hidden');
                                app.crop.cropper = new Cropper(img, {
                                    aspectRatio: 1,
                                    viewMode: 1,
                                    autoCropArea: 1,
                                    checkCrossOrigin: false,
                                    ready: () => {
                                        app.crop.updateRulerUI();
                                        if (app.crop.cropper) {
                                            try { app.crop.cropper.update(); } catch(e){}
                                        }
                                    }
                                });
                            }
                        }, 50);
                    };

                    img.onerror = () => {
                        img.onload = null;
                        img.onerror = null;
                        app.ui.showAlert("Không thể tải ảnh vào công cụ cắt ảnh. Vui lòng thử lại hoặc chọn file hợp lệ.");
                        app.crop.close();
                    };

                    img.src = url;
                },

                toggleRuler: () => {
                    app.crop.isRulerEnabled = !app.crop.isRulerEnabled;
                    app.crop.updateRulerUI();
                },

                getRulerHTML: () => {
                    const isHidden = app.crop.isRulerEnabled ? '' : 'hidden';
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
                    return `<div class="crop-ruler-overlay ruler-horizontal-overlay ${isHidden}" style="z-index: 25;">${linesHtml}</div>`;
                },

                updateRulerUI: () => {
                    const btn = document.getElementById('btn-crop-toggle-ruler');
                    if (btn) {
                        if (app.crop.isRulerEnabled) {
                            btn.className = "px-3 py-1.5 text-xs bg-black text-white border border-black rounded-md font-bold transition ml-1 flex items-center gap-1.5";
                        } else {
                            btn.className = "px-3 py-1.5 text-xs bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 font-bold transition ml-1 flex items-center gap-1.5";
                        }
                    }
                    const cropBox = document.querySelector('#crop-modal .cropper-crop-box');
                    if (!cropBox) return;
                    let overlay = cropBox.querySelector('.crop-ruler-overlay');
                    if (!overlay) {
                        cropBox.insertAdjacentHTML('beforeend', app.crop.getRulerHTML());
                        overlay = cropBox.querySelector('.crop-ruler-overlay');
                    }
                    if (overlay) {
                        if (app.crop.isRulerEnabled) overlay.classList.remove('hidden');
                        else overlay.classList.add('hidden');
                    }
                },

                setRatio: (ratio) => {
                    if (app.crop.cropper) {
                        app.crop.cropper.setAspectRatio(ratio);
                        app.crop.updateRatioButtons(ratio);
                        if (app.crop.mode === 'main') {
                            app.crop.savedRatio = ratio;
                        }
                    }
                },

                updateRatioButtons: (activeRatio) => {
                    document.querySelectorAll('.crop-ratio-btn').forEach(btn => {
                        const r = parseFloat(btn.dataset.ratio);
                        if (Math.abs(r - activeRatio) < 0.01) {
                            btn.classList.add('bg-black', 'text-white', 'border-black');
                            btn.classList.remove('bg-white', 'text-gray-700', 'border-gray-300', 'hover:bg-gray-100');
                        } else {
                            btn.classList.remove('bg-black', 'text-white', 'border-black');
                            btn.classList.add('bg-white', 'text-gray-700', 'border-gray-300', 'hover:bg-gray-100');
                        }
                    });
                },

                close: () => {
                    if (app.crop.closeTimeout) {
                        clearTimeout(app.crop.closeTimeout);
                        app.crop.closeTimeout = null;
                    }
                    const img = document.getElementById('crop-image');
                    if (img) {
                        img.onload = null;
                        img.onerror = null;
                    }
                    const modal = document.getElementById('crop-modal');
                    const content = document.getElementById('crop-content');
                    if (content) {
                        content.classList.remove('opacity-100', 'scale-100');
                        content.classList.add('opacity-0', 'scale-95');
                    }
                    app.crop.closeTimeout = setTimeout(() => {
                        modal.classList.add('hidden');
                        if (app.crop.cropper) {
                            try { app.crop.cropper.destroy(); } catch (e) {}
                            app.crop.cropper = null;
                        }
                        if (img) {
                            img.onload = null;
                            img.onerror = null;
                            img.removeAttribute('src');
                            img.removeAttribute('style');
                            img.style.cssText = 'max-width: 100%; max-height: 100%; display: block; -webkit-touch-callout: none;';
                        }
                        app.ui.unlockScroll();

                        // Nếu là lần cắt bắt buộc mà user bấm Hủy -> Xóa trắng để chọn ảnh khác
                        if (app.crop.isMandatory) {
                            app.upload.removeImage();
                            app.crop.isMandatory = false;
                        }
                    }, 200);
                },

                apply: () => {
                    if (!app.crop.cropper) return;

                    if (app.crop.mode === 'main') {
                        try {
                            app.crop.savedCropData = app.crop.cropper.getData(true);
                        } catch(e) {}
                    }

                    const btn = document.querySelector('#crop-modal button:last-child');
                    const originalText = btn.innerHTML;
                    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang cắt...';
                    btn.disabled = true;

                    setTimeout(() => {
                        const cropOptions = {
                            imageSmoothingEnabled: true,
                            imageSmoothingQuality: 'high',
                        };
                        if (app.crop.mode === 'avatar') {
                            cropOptions.width = 200;
                            cropOptions.height = 200;
                        }
                        const canvas = app.crop.cropper.getCroppedCanvas(cropOptions);

                        if (app.crop.mode === 'main') {
                            const h = canvas.height;
                            const w = canvas.width;

                            if (h < 1080) {
                                app.ui.showAlert(`Ảnh sau khi cắt có độ phân giải quá thấp (${w}x${h}). Yêu cầu chiều cao tối thiểu 1080px.`);
                                btn.innerHTML = originalText;
                                btn.disabled = false;
                                return;
                            }

                            app.utils.canvasToBlobUniversal(canvas, app.utils.getTargetMimeType(), 0.85).then((blob) => {
                                if (app.crop.originalFile && app.crop.originalFile.name) {
                                    blob.name = app.crop.originalFile.name;
                                } else {
                                    blob.name = 'cropped_image.webp';
                                }

                                const wasMandatory = app.crop.isMandatory;
                                app.crop.isMandatory = false; // Tắt cờ để hàm close() không xóa ảnh
                                app.crop.close();

                                if (wasMandatory) {
                                    // Nếu là bước cắt đầu tiên bắt buộc -> thiết lập preview hoàn chỉnh
                                    app.upload.setupPreview(blob);
                                } else {
                                    // Nếu là cắt thủ công lại sau này -> chỉ thay thế ảnh hiện tại
                                    app.rawFile = blob;
                                    const url = URL.createObjectURL(blob);
                                    const previewImg = document.getElementById('preview-img');
                                    previewImg.src = url;

                                    document.querySelectorAll('.blur-panel').forEach(p => p.remove());
                                    if (app.upload.updateBlurBtn) app.upload.updateBlurBtn();

                                    if(app.upload.resetWm) app.upload.resetWm();
                                    if(app.upload.resetFilters) app.upload.resetFilters();
                                }

                                btn.innerHTML = originalText;
                                btn.disabled = false;
                            });

                        } else if (app.crop.mode === 'avatar') {
                            app.utils.canvasToBlobUniversal(canvas, app.utils.getTargetMimeType(), 0.8).then(async (blob) => {
                                if (blob.size > 3 * 1024 * 1024) {
                                    app.ui.showAlert('Ảnh sau khi cắt vẫn quá lớn (>3MB)! Vui lòng chọn ảnh/vùng nhỏ hơn.');
                                    btn.innerHTML = originalText;
                                    btn.disabled = false;
                                    return;
                                }

                                app.crop.close();
                                btn.innerHTML = originalText;
                                btn.disabled = false;

                                app.auth.uploadAvatarBlob(blob);
                            });
                        }
                    }, 50);
                }
            }
});

window.addEventListener('keydown', (e) => {
    const cropModal = document.getElementById('crop-modal');
    if (!cropModal || cropModal.classList.contains('hidden') || !app.crop || !app.crop.cropper) return;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target && e.target.tagName)) return;

    let dx = 0, dy = 0;
    const step = e.shiftKey ? 10 : 1;
    if (e.key === 'ArrowLeft') dx = -step;
    else if (e.key === 'ArrowRight') dx = step;
    else if (e.key === 'ArrowUp') dy = -step;
    else if (e.key === 'ArrowDown') dy = step;
    else return;

    e.preventDefault();
    try {
        const box = app.crop.cropper.getCropBoxData();
        app.crop.cropper.setCropBoxData({
            left: box.left + dx,
            top: box.top + dy
        });
        const newBox = app.crop.cropper.getCropBoxData();
        if (Math.abs(newBox.left - box.left) < 0.1 && Math.abs(newBox.top - box.top) < 0.1) {
            app.crop.cropper.move(-dx, -dy);
        }
    } catch (err) {}
});

Object.assign(window.app, {
  photo: {
                downloadImage: async (e) => {
                    if (!app.currentPhoto) return;

                    const btn = e.currentTarget;
                    const origHtml = btn.innerHTML;
                    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Đang tải...';

                    try {
                        const plateName = app.utils.displayPlate(app.currentPhoto.license_plate) || 'VNBUSARCHIVE';
                        let proxyUrl = app.utils.getProxiedUrl(app.currentPhoto.url, `${plateName}.jpg`);

                        // Bỏ proxy wsrv.nl

                        const response = await fetch(proxyUrl);
                        const blob = await response.blob();
                        const blobUrl = window.URL.createObjectURL(blob);

                        const a = document.createElement('a');
                        a.href = blobUrl;
                        a.download = plateName + '.jpg'; // Đặt tên file khi lưu

                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        window.URL.revokeObjectURL(blobUrl);
                    } catch (err) {
                        app.ui.showAlert('Lỗi: Không thể tải hình ảnh từ máy chủ!');
                    } finally {
                        btn.innerHTML = origHtml;
                    }
                },
                requestDelete: async () => {
                    if (!app.user || !app.currentPhoto) return;
                    const p = app.currentPhoto;
                    const isPendingOrDenied = (p.status === 'pending' || p.status === 'denied');

                    if (isPendingOrDenied) {
                        app.ui.showAlert(
                            "Bạn có chắc chắn muốn xóa ảnh này? Ảnh sẽ bị xóa vĩnh viễn khỏi hệ thống.",
                            async () => {
                                try {
                                    try { await app.captcha.request(); } catch (err) { if (err.message !== "CAPTCHA_CANCELLED") app.ui.showAlert("Lỗi xác thực Captcha."); return; }
                                    // 1. Gọi API Xóa ảnh từ CDN/Sandbox trước
                                    const { data: { session } } = await window.sb.auth.getSession();
                                    if (session && p.url) {
                                        await fetch('/api/delete-image', {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'Authorization': `Bearer ${session.access_token}`
                                            },
                                            body: JSON.stringify({ imageUrl: p.url, photoId: p.id })
                                        });
                                    }

                                    // 2. Xóa khỏi Supabase Database (ảnh trên CDN đã được xóa ở bước 1)
                                    await window.sb.from('photos').delete().eq('id', p.id);
                                    await app.vehicle.cleanupVehicle(p.license_plate);

                                    app.toast.show('success', 'Thành công', 'Ảnh đã được xóa vĩnh viễn khỏi hệ thống.');
                                    app.views.loadHome();
                                } catch (err) { app.ui.showAlert("Lỗi khi xóa ảnh: " + err.message); }
                            },
                            () => { console.log("Hủy xóa"); },
                            { countdown: true, btnOkText: "Xóa ảnh", btnCancelText: "Hủy bỏ", title: "Xác nhận xóa" }
                        );
                    } else {
                        // [BẢO VỆ] Kiểm tra xem ảnh này đã có yêu cầu nào đang chờ duyệt chưa
                        try {
                            const { count, error: checkErr } = await window.sb.from('edit_requests')
                                .select('*', { count: 'exact', head: true })
                                .eq('status', 'pending')
                                .contains('new_data', { photo_id: p.id });

                            if (checkErr) throw checkErr;
                            if (count > 0) {
                                return app.ui.showAlert("Ảnh này đang có một yêu cầu chỉnh sửa hoặc xóa khác chờ duyệt. Vui lòng đợi Admin xử lý xong trước khi gửi yêu cầu mới.");
                            }
                        } catch (e) {
                            return app.ui.showAlert("Lỗi kiểm tra hệ thống: " + e.message);
                        }

                        app.ui.showPrompt("Vui lòng nhập lý do xóa ảnh này (Bắt buộc):", "", async (reason) => {
                            try {
                                try { await app.captcha.request(); } catch (err) { if (err.message !== "CAPTCHA_CANCELLED") app.ui.showAlert("Lỗi xác thực Captcha."); return; }
                                const { error } = await window.sb.from('edit_requests').insert({
                                    requester_id: app.user.id,
                                    license_plate: p.license_plate,
                                    new_data: { request_type: 'delete_photo', photo_id: p.id, reason: reason },
                                    status: 'pending'
                                });
                                if (error) throw error;
                                app.ui.showAlert("Yêu cầu xóa ảnh đã được gửi và đang chờ Admin duyệt.");
                            } catch (err) { app.ui.showAlert("Lỗi: " + err.message); }
                        });
                    }
                }
            }
});

Object.assign(window.app, {
  comments: {
                page: 1,
                lastPostTime: 0,
                replyingTo: null,
                init: async (photoId) => {
                    const form = document.getElementById('comment-form-wrapper');
                    const notice = document.getElementById('comment-auth-notice');
                    const input = document.getElementById('comment-input');
                    const warning = document.getElementById('comment-warning');

                    if (app.currentPhoto && (app.currentPhoto.status === 'pending' || app.currentPhoto.status === 'denied')) {
                        if (form) form.classList.add('hidden');
                        if (notice) {
                            notice.classList.remove('hidden');
                            notice.innerHTML = '<p class="text-sm text-gray-500 font-medium">Bình luận sẽ không được mở cho các trường hợp ảnh đang chờ duyệt hoặc ảnh bị từ chối.</p>';
                        }

                        const listEl = document.getElementById('comment-list');
                        if (listEl) listEl.innerHTML = '<p class="text-center text-gray-400 py-10 text-xs italic">Bình luận bị vô hiệu hóa.</p>';

                        const countEl = document.getElementById('comment-count');
                        if (countEl) countEl.innerText = '0';

                        const btnMore = document.getElementById('btn-load-more-comments');
                        if (btnMore) btnMore.classList.add('hidden');

                        return;
                    }

                    if (app.user) {
                        form?.classList.remove('hidden');
                        notice?.classList.add('hidden');
                        input?.addEventListener('input', (e) => {
                            warning?.classList.toggle('hidden', e.target.value.length === 0);
                        });
                    } else {
                        form?.classList.add('hidden');
                        if (notice) {
                            notice.classList.remove('hidden');
                            notice.innerHTML = '<p class="text-sm text-gray-500 font-medium">Vui lòng <a href="/auth" class="font-bold text-black underline">đăng nhập</a> để bình luận.</p>';
                        }
                    }
                    app.comments.page = 1;
                    app.comments.load(photoId);
                },
                load: async (photoId, append = false) => {
                    const listEl = document.getElementById('comment-list');
                    const countEl = document.getElementById('comment-count');
                    if (!listEl) return;
                    const limit = 12;
                    const from = (app.comments.page - 1) * limit;
                    const to = from + limit - 1;

                    try {
                        let parents, count, error;
                        let useThreads = true;

                        if (countEl) {
                            const { count: totalCount } = await window.sb
                                .from('photo_comments')
                                .select('*', { count: 'exact', head: true })
                                .eq('photo_id', photoId);
                            countEl.innerText = totalCount || 0;
                        }

                        const result = await window.sb
                            .from('photo_comments')
                            .select('*, profiles(id, username, avatar_url, role, subroles, ban_status)', { count: 'exact' })
                            .eq('photo_id', photoId)
                            .is('parent_id', null)
                            .order('created_at', { ascending: false })
                            .range(from, to);

                        parents = result.data;
                        count = result.count;
                        error = result.error;

                        if (error) {
                            useThreads = false;
                            const fallback = await window.sb
                                .from('photo_comments')
                                .select('*, profiles(id, username, avatar_url, role, subroles, ban_status)', { count: 'exact' })
                                .eq('photo_id', photoId)
                                .order('created_at', { ascending: false })
                                .range(from, to);
                            parents = fallback.data;
                            count = fallback.count;
                            error = fallback.error;
                        }

                        if (error) throw error;

                        // --- THÊM CHỐT CHẶN RACE CONDITION CHO BÌNH LUẬN VÀO ĐÂY ---
                        if (app.currentPhoto && String(app.currentPhoto.id) !== String(photoId)) return;
                        const currentPath = window.location.pathname;
                        if (!currentPath.includes(`/photo/${photoId}`) && !currentPath.includes('/profile/comments')) return;
                        // -------------------------------------------------------------

                        const btnMore = document.getElementById('btn-load-more-comments');
                        if (btnMore) btnMore.classList.toggle('hidden', count <= (to + 1));

                        let repliesMap = {};
                        if (useThreads && parents && parents.length > 0) {
                            const parentIds = parents.map(p => p.id);
                            const { data: replies } = await window.sb
                                .from('photo_comments')
                                .select('*, profiles(id, username, avatar_url, role, subroles, ban_status)')
                                .in('parent_id', parentIds)
                                .order('created_at', { ascending: true });
                            if (replies) {
                                replies.forEach(r => {
                                    if (!repliesMap[r.parent_id]) repliesMap[r.parent_id] = [];
                                    repliesMap[r.parent_id].push(r);
                                });
                            }
                        }

                        const html = (parents || []).map(c => app.comments.renderItem(c, repliesMap[c.id] || [])).join('');

                        if (append) listEl.innerHTML += html;
                        else listEl.innerHTML = html || '<p class="text-center text-gray-400 py-10 text-xs italic">Chưa có bình luận nào.</p>';
                    } catch (e) { console.error(e); }
                },
                renderItem: (c, replies = []) => {
                    const isMe = app.user && c.user_id === app.user.id;
                    const canDelete = isMe || app.role === 'admin' || app.role === 'manager';
                    const authorDisplay = app.utils.formatProfileDisplay(c.profiles);
                    const avatar = authorDisplay.avatar;
                    const badges = authorDisplay.isBanned ? '' : app.utils.getBadgesHTML(c.user_id, c.profiles?.role, c.profiles?.subroles);

                    const toolbar = app.user ? `
                        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px;">
                            <button style="display: flex; align-items: center; gap: 6px; background: white; border: 1px solid #d1d5db; color: #374151; padding: 6px 12px; border-radius: 8px; font-weight: bold; font-size: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);" onclick="app.comments.startReply('${c.id}', '${authorDisplay.username}')" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='white'"><i class="fa-solid fa-reply"></i> Phản hồi</button>
                            <button style="display: flex; align-items: center; gap: 6px; background: white; border: 1px solid #d1d5db; color: #374151; padding: 6px 12px; border-radius: 8px; font-weight: bold; font-size: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);" onclick="app.utils.navigate('/contact')" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='white'"><i class="fa-solid fa-flag"></i> Báo cáo</button>
                            ${canDelete ? `<button style="display: flex; align-items: center; gap: 6px; background: white; border: 1px solid #fca5a5; color: #dc2626; padding: 6px 12px; border-radius: 8px; font-weight: bold; font-size: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);" onclick="app.comments.delete('${c.id}')" onmouseover="this.style.background='#fef2f2'" onmouseout="this.style.background='white'"><i class="fa-solid fa-trash-can"></i> Xóa</button>` : ''}
                        </div>` : `
                        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px;">
                            ${canDelete ? `<button style="display: flex; align-items: center; gap: 6px; background: white; border: 1px solid #fca5a5; color: #dc2626; padding: 6px 12px; border-radius: 8px; font-weight: bold; font-size: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);" onclick="app.comments.delete('${c.id}')" onmouseover="this.style.background='#fef2f2'" onmouseout="this.style.background='white'"><i class="fa-solid fa-trash-can"></i> Xóa</button>` : ''}
                        </div>`;

                    let repliesHTML = '';
                    if (replies.length > 0) {
                        const shown = replies.slice(0, 2);
                        const hidden = replies.length - 2;

                        repliesHTML = `
                        <div class="reply-group relative" id="reply-group-${c.id}" style="margin-top: 12px; margin-left: 48px; margin-right: 16px;">
                            <div style="position: absolute; left: -24px; top: 0; bottom: 10px; width: 2px; background-color: #e5e7eb; border-radius: 4px; pointer-events: none; z-index: 0;"></div>
                        `;

                        shown.forEach(r => {
                            repliesHTML += app.comments.renderReplyItem(r);
                        });

                        if (hidden > 0) {
                            repliesHTML += `<div style="display: flex; justify-content: center; margin-top: 4px; margin-bottom: 8px;"><button style="font-family: inherit; font-size: 11px; font-weight: bold; color: #4b5563; background: white; border: 1px solid #e5e7eb; padding: 6px 16px; border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);" onclick="app.comments.toggleReplies('${c.id}', ${replies.length})" id="btn-toggle-replies-${c.id}" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='white'"><i class="fa-solid fa-chevron-down" style="margin-right: 4px;"></i>Xem thêm ${hidden} phản hồi</button></div>`;
                            repliesHTML += `<div id="reply-hidden-${c.id}" class="hidden">`;
                            replies.slice(2).forEach(r => {
                                repliesHTML += app.comments.renderReplyItem(r);
                            });
                            repliesHTML += '</div>';
                        }
                        repliesHTML += '</div>';
                    }

                    return `
                    <div style="margin-bottom: 20px;">
                        <div id="comment-${c.id}" class="bg-white border border-gray-200 shadow-sm z-10 relative" style="padding: 16px; border-radius: 16px; display: flex; gap: 12px; align-items: flex-start;">
                            <img src="${avatar}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; flex-shrink: 0; border: 1px solid #f3f4f6; margin-top: 2px;">
                            <div style="flex: 1; min-width: 0;">
                                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px; overflow-x: auto; white-space: nowrap; scrollbar-width: none;">
                                    <span onclick="app.views.loadUserProfile('${authorDisplay.linkId}')" style="font-size: 14px; font-weight: bold; color: black; cursor: pointer; flex-shrink: 0;">${authorDisplay.username}</span>
                                    <div style="display: flex; gap: 4px; flex-shrink: 0; align-items: center;">
                                        ${badges}
                                    </div>
                                </div>
                                <span style="font-size: 11px; font-weight: bold; color: #9ca3af; display: block; margin-bottom: 8px;"><i class="fa-regular fa-clock" style="margin-right: 4px;"></i>${new Date(c.created_at).toLocaleString('vi-VN')}</span>
                                <p style="font-size: 14px; color: #1f2937; line-height: 1.6; word-break: break-word; white-space: pre-wrap; margin: 0;">${app.utils.cleanText(c.content)}</p>
                                ${toolbar}
                            </div>
                        </div>
                        ${repliesHTML}
                    </div>`;
                },

                renderReplyItem: (r) => {
                    const isMe = app.user && r.user_id === app.user.id;
                    const canDelete = isMe || app.role === 'admin' || app.role === 'manager';
                    const authorDisplay = app.utils.formatProfileDisplay(r.profiles);
                    const avatar = authorDisplay.avatar;
                    const badges = authorDisplay.isBanned ? '' : app.utils.getBadgesHTML(r.user_id, r.profiles?.role, r.profiles?.subroles);

                    const toolbar = app.user ? `
                        <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px;">
                            <button style="display: flex; align-items: center; gap: 4px; background: white; border: 1px solid #d1d5db; color: #4b5563; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 10px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);" onclick="app.utils.navigate('/contact')" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='white'"><i class="fa-solid fa-flag" style="font-size: 10px;"></i> Báo cáo</button>
                            ${canDelete ? `<button style="display: flex; align-items: center; gap: 4px; background: white; border: 1px solid #fca5a5; color: #dc2626; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 10px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);" onclick="app.comments.delete('${r.id}')" onmouseover="this.style.background='#fef2f2'" onmouseout="this.style.background='white'"><i class="fa-solid fa-trash-can" style="font-size: 10px;"></i> Xóa</button>` : ''}
                        </div>` : `
                        <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px;">
                            ${canDelete ? `<button style="display: flex; align-items: center; gap: 4px; background: white; border: 1px solid #fca5a5; color: #dc2626; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 10px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);" onclick="app.comments.delete('${r.id}')" onmouseover="this.style.background='#fef2f2'" onmouseout="this.style.background='white'"><i class="fa-solid fa-trash-can" style="font-size: 10px;"></i> Xóa</button>` : ''}
                        </div>`;

                    return `
                    <div id="comment-${r.id}" class="bg-gray-50 border border-gray-200 shadow-sm z-10 relative" style="padding: 12px; border-radius: 12px; display: flex; gap: 10px; align-items: flex-start; margin-bottom: 12px;">
                        <img src="${avatar}" style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover; flex-shrink: 0; border: 1px solid #e5e7eb; margin-top: 2px;">
                        <div style="flex: 1; min-width: 0;">
                            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px; overflow-x: auto; white-space: nowrap; scrollbar-width: none;">
                                <span onclick="app.views.loadUserProfile('${authorDisplay.linkId}')" style="font-size: 12px; font-weight: bold; color: black; cursor: pointer; flex-shrink: 0;">${authorDisplay.username}</span>
                                <div style="display: flex; gap: 4px; flex-shrink: 0; align-items: center; transform: scale(0.8); transform-origin: left;">
                                    ${badges}
                                </div>
                            </div>
                            <span style="font-size: 10px; font-weight: bold; color: #9ca3af; display: block; margin-bottom: 4px;"><i class="fa-regular fa-clock" style="margin-right: 4px;"></i>${new Date(r.created_at).toLocaleString('vi-VN')}</span>
                            <p style="font-size: 12px; color: #374151; line-height: 1.5; word-break: break-word; white-space: pre-wrap; margin: 0;">${app.utils.cleanText(r.content)}</p>
                            ${toolbar}
                        </div>
                    </div>`;
                },
                openDashboard: async () => {
                    app.views.switch('comment-dashboard', false);
                    const container = document.getElementById('dashboard-content');
                    container.innerHTML = '<p class="text-center py-20 text-gray-400"><i class="fa-solid fa-spinner fa-spin"></i> Đang tổng hợp bình luận...</p>';

                    try {
                        // 1. Tìm tất cả các bình luận mà user đã đăng (để lấy ID làm parent_id)
                        const { data: myComments } = await window.sb.from('photo_comments').select('id').eq('user_id', app.user.id);
                        const myCommentIds = myComments ? myComments.map(c => c.id).slice(0, 500) : []; // Giới hạn mảng để không làm tràn bộ lọc DB

                        // 2. Chạy 2 truy vấn riêng biệt và gộp lại để tránh lỗi Syntax của PostgREST

                        // Truy vấn 1: Lấy comment trên ảnh do tôi đăng
                        const p1 = window.sb
                            .from('photo_comments')
                            .select('*, photos!inner(license_plate, url, uploader_id, id), profiles(username, avatar_url, role, subroles)')
                            .eq('photos.uploader_id', app.user.id);

                        // Truy vấn 2: Lấy comment là reply cho bình luận của tôi (Bất kể trên ảnh ai)
                        let p2 = null;
                        if (myCommentIds.length > 0) {
                            p2 = window.sb
                                .from('photo_comments')
                                .select('*, photos!inner(license_plate, url, uploader_id, id), profiles(username, avatar_url, role, subroles)')
                                .in('parent_id', myCommentIds);
                        }

                        // Chạy song song cả 2 để tiết kiệm thời gian
                        const [res1, res2] = await Promise.all([p1, p2 || Promise.resolve({ data: [] })]);

                        if (res1.error) throw res1.error;
                        if (res2.error) throw res2.error;

                        // Gộp mảng và lọc trùng lặp (tránh TH tự comment trên ảnh của chính mình bị duplicate)
                        const combinedData = [...(res1.data || []), ...(res2.data || [])];
                        const uniqueDataMap = new Map();

                        combinedData.forEach(item => {
                            uniqueDataMap.set(item.id, item);
                        });

                        // Chuyển lại thành mảng và sắp xếp theo ngày tháng mới nhất
                        const data = Array.from(uniqueDataMap.values())
                                          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

                        const groups = {};
                        data.forEach(c => {
                            const plate = c.photos.license_plate;
                            if (!groups[plate]) groups[plate] = { info: c.photos, comments: [] };
                            groups[plate].comments.push(c);
                        });

                        const html = Object.values(groups).map(g => `
                            <div class="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                                <div class="bg-gray-50 px-4 py-3 flex items-center gap-3 border-b border-gray-100 cursor-pointer hover:bg-gray-100 transition" onclick="app.views.loadDetail('${g.info.id}')">
                                    <img src="${app.utils.getProxiedUrl(g.info.url, 'thumb.jpg', 'thumb')}" class="w-12 h-8 object-cover rounded shadow-sm border border-white">
                                    <span class="font-black text-sm text-black uppercase">${g.info.license_plate}</span>
                                    <span class="text-[10px] text-gray-400 font-bold ml-auto">${g.comments.length} TƯƠNG TÁC</span>
                                </div>
                                <div class="p-3 space-y-2 bg-white/50">
                                    ${g.comments.map(c => {
                                        // NẾU BÌNH LUẬN NÀY LÀ REPLY CHO BÌNH LUẬN CỦA USER, HIỂN THỊ THÊM BADGE "ĐÃ TRẢ LỜI BẠN"
                                        const isReplyToMe = myCommentIds.includes(c.parent_id);
                                        const replyBadge = isReplyToMe ? `<span class="bg-blue-100 text-blue-700 text-[9px] px-1.5 py-0.5 rounded ml-2 font-bold border border-blue-200 whitespace-nowrap"><i class="fa-solid fa-reply"></i> Trả lời bạn</span>` : '';

                                        return `
                                        <div class="flex justify-between items-start gap-3 bg-white border border-gray-200 p-3 rounded-xl shadow-sm hover:shadow-md transition cursor-pointer" onclick="app.utils.navigate('/photo/${g.info.id}'); setTimeout(()=> { const el = document.getElementById('comment-${c.id}'); if(el) el.scrollIntoView({behavior: 'smooth', block: 'center'}); }, 1000);">
                                            <div class="overflow-hidden flex-1">
                                                <div class="flex items-center">
                                                    <span class="text-[11px] font-bold text-black">${c.profiles.username}</span>
                                                    ${replyBadge}
                                                </div>
                                                <p class="text-xs text-gray-700 mt-1 mb-1.5 line-clamp-2 leading-relaxed">${c.content}</p>
                                                <span class="text-[9px] text-gray-400 font-bold uppercase"><i class="fa-regular fa-clock mr-1"></i>${new Date(c.created_at).toLocaleString('vi-VN')}</span>
                                            </div>
                                            <button onclick="event.stopPropagation(); app.comments.delete('${c.id}')" class="text-red-400 hover:text-red-600 bg-red-50 p-2 rounded-lg transition shrink-0"><i class="fa-solid fa-trash-can text-sm"></i></button>
                                        </div>
                                    `}).join('')}
                                </div>
                            </div>
                        `).join('');

                        container.innerHTML = html || '<p class="text-center py-20 text-gray-400">Chưa có ai bình luận trên bài đăng của bạn hoặc phản hồi lại bạn.</p>';
                    } catch (e) { container.innerHTML = '<p class="text-red-500 text-center mt-10">Lỗi: ' + e.message + '</p>'; }
                },
                post: async () => {
                    const input = document.getElementById('comment-input');
                    const content = input?.value.trim();
                    if (!content || !app.currentPhoto) return;

                    if (app.currentPhoto.status === 'pending' || app.currentPhoto.status === 'denied') {
                        return app.ui.showAlert("Hành vi bị từ chối. Không thể bình luận trên ảnh chưa được duyệt!");
                    }

                    if (/https?:\/\/|www\.|\.com|\.vn|\.io|\.net|\.org/i.test(content)) {
                        return app.ui.showAlert("Bình luận chứa liên kết không được phép. Vui lòng xóa link và thử lại.");
                    }

                    const now = Date.now();
                    if (now - app.comments.lastPostTime < 30000) {
                        return app.ui.showAlert("<b>Rate Limit:</b> Vui lòng đợi 30 giây.");
                    }

                    // YÊU CẦU GIẢI CAPTCHA TRƯỚC KHI COMMENT
                    try {
                        await app.captcha.request();
                    } catch (err) {
                        if (err.message === "CAPTCHA_CANCELLED") return;
                        return app.ui.showAlert("Lỗi xác thực Captcha.");
                    }

                    const btn = document.getElementById('btn-post-comment');
                    btn.disabled = true;

                    const insertData = {
                        photo_id: app.currentPhoto.id,
                        user_id: app.user.id,
                        content: content
                    };
                    if (app.comments.replyingTo) {
                        insertData.parent_id = app.comments.replyingTo;
                    }

                    // Optimistic UI Update: Fake comment
                    const fakeId = 'temp-' + Date.now();
                    const listEl = document.getElementById('comment-list');
                    if (listEl) {
                        const fakeHtml = app.comments.renderItem({
                            id: fakeId,
                            user_id: app.user.id,
                            content: content,
                            created_at: new Date().toISOString(),
                            profiles: { username: app.username || 'Bạn', avatar_url: app.user.user_metadata?.avatar_url || '' }
                        }, []);
                        // Thay đổi style để hiển thị "Đang gửi"
                        const modifiedFakeHtml = fakeHtml.replace('<div class="flex justify-between items-start gap-3 bg-white border border-gray-200', '<div id="'+fakeId+'" class="flex justify-between items-start gap-3 bg-white border border-gray-200 opacity-70').replace('</div>\n                                            <button', '<span class="text-[10px] text-blue-500 font-bold ml-2 italic">Đang gửi...</span></div>\n                                            <button');
                        if (listEl.innerHTML.includes('Chưa có bình luận')) listEl.innerHTML = '';
                        listEl.insertAdjacentHTML('afterbegin', modifiedFakeHtml);
                        
                        // Xóa text input ngay lập tức
                        input.value = '';
                    }

                    let { error } = await window.sb.from('photo_comments').insert(insertData);

                    if (error && error.message && error.message.includes('JWT')) {
                        const { data: { session: newSession } } = await window.sb.auth.refreshSession();
                        if (newSession) {
                            const retry = await window.sb.from('photo_comments').insert(insertData);
                            error = retry.error;
                        } else {
                            app.ui.showAlert('Phiên đã hết hạn. Vui lòng tải lại trang và đăng nhập lại.');
                        }
                    }

                    if (error && app.comments.replyingTo) {
                        delete insertData.parent_id;
                        const retry = await window.sb.from('photo_comments').insert(insertData);
                        error = retry.error;
                        if (!error) app.comments.cancelReply();
                    }

                    if (error) {
                        app.ui.showAlert("Lỗi: " + error.message);
                        const fakeEl = document.getElementById(fakeId);
                        if(fakeEl) fakeEl.remove();
                    }
                    else {
                        document.getElementById('comment-warning')?.classList.add('hidden');
                        app.comments.cancelReply();
                        app.comments.lastPostTime = now;
                        app.comments.page = 1;
                        app.comments.load(app.currentPhoto.id);
                    }
                    btn.disabled = false;
                },
                delete: async (id) => {
                    app.ui.showAlert("Bạn có chắc chắn muốn xóa bình luận này? (Các phản hồi bên trong cũng sẽ bị xóa theo)", async () => {

                        await window.sb.from('photo_comments').delete().or(`id.eq.${id},parent_id.eq.${id}`);

                        if (app.currentViewMode === 'comment-dashboard') app.comments.openDashboard();
                        else if (app.adminTab === 'comments') app.admin.loadTab('comments');
                        else app.comments.load(app.currentPhoto.id);

                    }, () => {
                        // Hàm Hủy
                    }, { title: "Xác nhận xóa", btnOkText: "Xóa", btnCancelText: "Hủy" });
                },
                loadMore: () => {
                    app.comments.page++;
                    app.comments.load(app.currentPhoto.id, true);
                },
                startReply: (commentId, username) => {
                    app.comments.replyingTo = commentId;
                    const indicator = document.getElementById('reply-indicator');
                    const nameEl = document.getElementById('reply-to-name');
                    if (indicator && nameEl) {
                        nameEl.textContent = username || 'Ẩn danh';
                        indicator.classList.remove('hidden');
                    }
                    const input = document.getElementById('comment-input');
                    if (input) {
                        input.placeholder = `Trả lời ${username}...`;
                        input.focus();
                    }
                },
                cancelReply: () => {
                    app.comments.replyingTo = null;
                    const indicator = document.getElementById('reply-indicator');
                    if (indicator) indicator.classList.add('hidden');
                    const input = document.getElementById('comment-input');
                    if (input) input.placeholder = 'Viết bình luận...';
                },
                toggleReplies: (commentId, total) => {
                    const hidden = document.getElementById(`reply-hidden-${commentId}`);
                    const btn = document.getElementById(`btn-toggle-replies-${commentId}`);
                    if (!hidden || !btn) return;
                    const isHidden = hidden.classList.contains('hidden');
                    hidden.classList.toggle('hidden');
                    const remaining = total - 2;
                    btn.textContent = isHidden ? 'Ẩn bớt phản hồi' : `Xem thêm ${remaining} phản hồi`;
                }
            }
});

Object.assign(window.app, {
  vehicle: {
                currentHistoryData: [],
                tempHistory:[],
                currentHistoryPrefix: '',
                VEHICLE_PAGE_SIZE: 12,
                currentPage: 1,
                totalPages: 1,
                totalCount: 0,

                loadMoreVehiclePhotos: async () => {
                    const grid = document.getElementById('vehicle-photo-grid');
                    const btnContainer = document.getElementById('vehicle-load-more-container');
                    if (!grid || !btnContainer) return;

                    if (app.vehicle.currentPage >= app.vehicle.totalPages) {
                        btnContainer.classList.add('hidden');
                        return;
                    }

                    const size = app.vehicle.VEHICLE_PAGE_SIZE || 12;
                    const nextPage = app.vehicle.currentPage + 1;
                    const fromRow = (nextPage - 1) * size;
                    const toRow = fromRow + size - 1;

                    const btn = btnContainer.querySelector('button');
                    const originalText = btn ? btn.innerHTML : '';
                    if (btn) { btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang tải...'; btn.disabled = true; }

                    try {
                        const plate = app.currentPlate;
                        let pQuery = window.sb.from('photos').select(`*, profiles(id, username, role, subroles, ban_status), vehicles(model)`)
                            .eq('license_plate', plate)
                            .eq('status', 'approved')
                            .order('taken_at', { ascending: false, nullsFirst: false })
                            .order('created_at', { ascending: false });

                        pQuery = app.preference.applyFilter(pQuery);

                        const { data: photos, error } = await pQuery.range(fromRow, toRow);
                        if (error) throw error;

                        if (photos && photos.length > 0) {
                            grid.innerHTML += photos.map(p => app.views.renderPhotoCard(p)).join('');
                        }
                        app.vehicle.currentPage = nextPage;
                    } catch (err) {
                        console.error("Lỗi tải thêm ảnh xe:", err);
                    } finally {
                        if (btn) { btn.innerHTML = originalText; btn.disabled = false; }
                    }

                    if (app.vehicle.currentPage >= app.vehicle.totalPages) {
                        btnContainer.classList.add('hidden');
                    } else {
                        btnContainer.classList.remove('hidden');
                    }
                },

                cleanupVehicle: async (plate) => {
                    if (!plate) return;
                    try {
                        // Lưu ý: Không xóa bảng vehicles để tránh lỗi Postgres ON DELETE CASCADE làm mất ảnh trong bảng photos
                        // Nhưng BẮT BUỘC phải dọn dẹp bảng vehicle_history nếu xe không còn ảnh đã duyệt hoặc lịch sử bị sai (route không khớp ảnh nào)
                        const { data: approvedPhotos, error } = await window.sb.from('photos').select('route_no, operator, taken_at').eq('license_plate', plate).eq('status', 'approved');
                        if (error || !approvedPhotos) return;

                        if (approvedPhotos.length === 0) {
                            await window.sb.from('vehicle_history').delete().eq('license_plate', plate);
                            return;
                        }

                        const { data: history } = await window.sb.from('vehicle_history').select('*').eq('license_plate', plate);
                        if (!history || history.length === 0) return;

                        const specialRoutes = ['Ngoài giờ hoạt động', 'Chưa hoạt động'];
                        const activePhotos = approvedPhotos.filter(p => !specialRoutes.includes(p.route_no));

                        for (const h of history) {
                            if (!specialRoutes.includes(h.route)) {
                                const hasMatchingPhoto = activePhotos.some(p => p.route_no === h.route && p.operator === h.operator);
                                if (!hasMatchingPhoto) {
                                    await window.sb.from('vehicle_history').delete().eq('id', h.id);
                                }
                            }
                        }
                    } catch (e) {
                        console.error("Lỗi dọn dẹp lịch sử xe:", e);
                    }
                },

                toggleEditHistory: (prefix = '') => {
                    if(!app.user) return app.auth.check();
                    app.vehicle.currentHistoryPrefix = prefix;
                    const ui = document.getElementById(prefix + 'history-edit-ui');

                    if(ui.classList.contains('hidden')) {
                        ui.classList.remove('hidden');

                        app.vehicle.tempHistory = JSON.parse(JSON.stringify(app.vehicle.currentHistoryData));
                        app.vehicle.renderEditList(prefix);
                    } else {
                        ui.classList.add('hidden');
                        app.vehicle.tempHistory =[];
                        document.getElementById(prefix + 'sortable-history').innerHTML = '';
                    }
                },


                sortTempHistory: () => {
                    app.vehicle.tempHistory.sort((a, b) => {
                        const dateA = a.effective_date ? new Date(a.effective_date).getTime() : 0;
                        const dateB = b.effective_date ? new Date(b.effective_date).getTime() : 0;
                        return dateA - dateB;
                    });
                },

                renderEditList: (prefix = app.vehicle.currentHistoryPrefix) => {
                    app.vehicle.sortTempHistory();
                    const container = document.getElementById(prefix + 'sortable-history');
                    container.innerHTML = '';

                    app.vehicle.tempHistory.forEach((h, index) => {
                        const div = document.createElement('div');
                        div.className = "flex flex-wrap sm:flex-nowrap gap-2 items-center bg-white p-3 border border-gray-200 rounded-md text-xs hover:border-amber-400 transition mb-2";
                        div.innerHTML = `
                            <div class="w-full sm:w-[18%] flex items-center">
                                <span class="sm:hidden font-bold text-gray-500 w-14">Ngày:</span>
                                <input type="date" value="${app.utils.escapeAttr(h.effective_date || '')}" onchange="app.vehicle.updateHistoryItem(${index}, 'effective_date', this.value, '${prefix}')" class="border border-gray-300 p-2 sm:p-1.5 rounded text-gray-700 w-full outline-none focus:ring-1 focus:ring-amber-500">
                            </div>
                            <div class="w-[48%] sm:w-[25%]">
                                <input type="text" value="${app.utils.escapeAttr(h.operator)}" placeholder="Đơn vị" oninput="app.utils.formatNoPunctuation(this)" onchange="app.vehicle.updateHistoryItem(${index}, 'operator', this.value, '${prefix}')" class="border border-gray-300 p-2 sm:p-1.5 rounded w-full outline-none focus:ring-1 focus:ring-amber-500">
                            </div>
                            <div class="w-[48%] sm:w-[15%]">
                                <input type="text" value="${app.utils.escapeAttr(h.route || '')}" placeholder="Tuyến" onchange="app.vehicle.updateHistoryItem(${index}, 'route', this.value, '${prefix}')" class="border border-gray-300 p-2 sm:p-1.5 rounded w-full outline-none focus:ring-1 focus:ring-amber-500">
                            </div>
                            <div class="w-full sm:flex-1">
                                <input type="text" value="${app.utils.escapeAttr(h.note || '')}" placeholder="Ghi chú (BKS cũ...)" onchange="app.vehicle.updateHistoryItem(${index}, 'note', this.value, '${prefix}')" class="border border-gray-300 p-2 sm:p-1.5 rounded w-full outline-none focus:ring-1 focus:ring-amber-500">
                            </div>
                            <div class="w-full sm:w-auto flex justify-end gap-1 border-t sm:border-0 border-gray-100 pt-2 sm:pt-0 mt-1 sm:mt-0">
                                <button type="button" onclick="app.vehicle.duplicateHistoryItem(${index}, '${prefix}')" class="text-blue-500 hover:text-white hover:bg-blue-500 border border-blue-100 rounded px-3 sm:px-2 py-1.5 font-bold transition flex-1 sm:flex-none text-center" title="Nhân bản"><i class="fa-solid fa-copy"></i></button>
                                <button type="button" onclick="app.vehicle.removeHistoryItem(${index}, '${prefix}')" class="text-red-500 hover:text-white hover:bg-red-500 border border-red-100 rounded px-3 sm:px-2 py-1.5 font-bold transition flex-1 sm:flex-none text-center" title="Xóa"><i class="fa-solid fa-trash"></i></button>
                            </div>
                        `;
                        container.appendChild(div);
                    });

                    if (app.vehicle.tempHistory.length > 0) {
                        const latest = app.vehicle.tempHistory[app.vehicle.tempHistory.length - 1];
                        const opInput = document.getElementById(prefix + 'hist-new-op');
                        const routeInput = document.getElementById(prefix + 'hist-new-route');
                        if (opInput && !opInput.value) opInput.value = latest.operator || '';
                        if (routeInput && !routeInput.value) routeInput.value = latest.route || '';
                    }
                },

                updateHistoryItem: (index, field, value, prefix) => {
                    app.vehicle.tempHistory[index][field] = value;
                    if (field === 'effective_date') {
                        app.vehicle.renderEditList(prefix);
                    }
                },

                duplicateHistoryItem: (index, prefix) => {
                    const item = app.vehicle.tempHistory[index];
                    app.vehicle.tempHistory.push({ ...item });
                    app.vehicle.renderEditList(prefix);
                },

                addHistoryItem: (prefix = '') => {
                    const dateVal = document.getElementById(prefix + 'hist-new-date').value;
                    const op = document.getElementById(prefix + 'hist-new-op').value;
                    const route = document.getElementById(prefix + 'hist-new-route').value;
                    const note = document.getElementById(prefix + 'hist-new-note') ? document.getElementById(prefix + 'hist-new-note').value : '';

                    if(!dateVal || !op) return app.ui.showAlert("Vui lòng nhập Ngày áp dụng và Đơn vị vận hành!");

                    app.vehicle.tempHistory.push({
                        license_plate: app.currentPlate,
                        effective_date: dateVal,
                        operator: op,
                        route: route,
                        note: note
                    });

                    document.getElementById(prefix + 'hist-new-date').value = '';
                    if(document.getElementById(prefix + 'hist-new-note')) document.getElementById(prefix + 'hist-new-note').value = '';

                    app.vehicle.renderEditList(prefix);
                },

                removeHistoryItem: (index, prefix) => {
                    app.vehicle.tempHistory.splice(index, 1);
                    app.vehicle.renderEditList(prefix);
                },

                saveHistory: async () => {
                    const proceedSave = async () => {
                        app.vehicle.sortTempHistory();

                        for (let i = 1; i < app.vehicle.tempHistory.length; i++) {
                            const prev = app.vehicle.tempHistory[i - 1];
                            const curr = app.vehicle.tempHistory[i];
                            if (prev.operator === curr.operator && prev.route === curr.route && prev.note === curr.note) {
                                return app.ui.showAlert(`Lỗi: Có 2 mốc lịch sử cạnh nhau có thông tin (Đơn vị, Tuyến, Ghi chú) giống hệt nhau. Hệ thống đã chặn để tránh rác dữ liệu. Vui lòng gộp chung hoặc xóa bớt 1 mục.`);
                            }
                        }

                        // [BẢO VỆ] Kiểm tra dữ liệu lịch sử có thực sự thay đổi không
                        const origClean = JSON.stringify((app.vehicle.currentHistoryData || []).map(h => ({op: h.operator, rt: h.route, nt: h.note, dt: h.effective_date})));
                        const tempClean = JSON.stringify(app.vehicle.tempHistory.map(h => ({op: h.operator, rt: h.route, nt: h.note, dt: h.effective_date})));
                        if (origClean === tempClean) {
                            return app.ui.showAlert("Không có sự thay đổi nào so với dữ liệu gốc. Yêu cầu bị hủy.");
                        }

                        if (app.role !== 'admin' && app.role !== 'manager') {
                            try { await app.captcha.request(); } catch (err) { if (err.message !== "CAPTCHA_CANCELLED") app.ui.showAlert("Lỗi xác thực Captcha."); return; }
                        }

                        const payload = app.vehicle.tempHistory.map((h, i) => ({
                            license_plate: app.currentPlate,
                            operator: h.operator,
                            route: h.route,
                            note: h.note,
                            effective_date: h.effective_date || null,
                            display_order: i
                        }));

                        if(app.role === 'admin' || app.role === 'manager') {
                            try {
                                await window.sb.from('vehicle_history').delete().eq('license_plate', app.currentPlate);
                                if (payload.length > 0) await window.sb.from('vehicle_history').insert(payload);

                                app.toast.show('success', 'Đã cập nhật', 'Lịch sử hoạt động của xe đã được lưu thành công.');
                                if (window.location.pathname.startsWith('/vehicle/')) {
                                    app.views.loadVehiclePage(app.currentPlate, true);
                                } else {
                                    app.views.loadHistory(app.currentPlate);
                                }
                            } catch (err) {
                                app.ui.showAlert("Lỗi khi lưu: " + err.message);
                            }
                        } else {
                            try {
                                // [BẢO VỆ] Kiểm tra xem đã có yêu cầu nào đang chờ duyệt cho xe này chưa
                                const { count, error: checkErr } = await window.sb.from('edit_requests').select('*', { count: 'exact', head: true }).eq('license_plate', app.currentPlate).eq('status', 'pending').contains('new_data', { request_type: 'update_history' });
                                if (count > 0) return app.ui.showAlert("Có yêu cầu chỉnh sửa lịch sử khác đang chờ duyệt cho xe này. Vui lòng thử lại sau.");

                                const reqData = {
                                    requester_id: app.user.id,
                                    license_plate: app.currentPlate,
                                    new_data: { request_type: 'update_history', history_items: payload },
                                    status: 'pending'
                                };
                                const { error } = await window.sb.from('edit_requests').insert(reqData);
                                if (error) throw error;

                                app.ui.showAlert("Yêu cầu cập nhật lịch sử đã được gửi và chờ Admin duyệt.");
                                app.vehicle.toggleEditHistory(app.vehicle.currentHistoryPrefix);
                            } catch (err) {
                                app.ui.showAlert("Lỗi gửi yêu cầu: " + err.message);
                            }
                        }
                    };

                    if (app.vehicle.tempHistory.length === 0) {
                        app.ui.showAlert(
                            "Danh sách lịch sử đang trống. Bạn có muốn xóa hết lịch sử không?",
                            () => { proceedSave(); },
                            () => {},
                            { title: "Xác nhận xóa", btnOkText: "Đồng ý", btnCancelText: "Hủy" }
                        );
                    } else {
                        proceedSave();
                    }
                },

                syncHistoryOnPhotoEdit: async (plate, takenAtIso, oldData, newData, isPlateChanged = false) => {
                    if (!takenAtIso) return;
                    if (!isPlateChanged && oldData.operator === newData.operator && oldData.route_no === newData.route_no) return;

                    const targetDate = takenAtIso.split('T')[0];
                    const specialRoutes = ['Ngoài giờ hoạt động', 'Chưa hoạt động'];
                    const isSpecial = specialRoutes.includes(newData.route_no);

                    try {
                        const { data: photos } = await window.sb.from('photos').select('id, operator, route_no')
                            .eq('license_plate', plate)
                            .like('taken_at', `${targetDate}%`)
                            .eq('status', 'approved');

                        const otherNormalPhotos = photos ? photos.filter(p => !specialRoutes.includes(p.route_no)) : [];

                        if (isSpecial) {
                            if (otherNormalPhotos.length > 0) {
                                const fallback = otherNormalPhotos[0];
                                await window.sb.from('vehicle_history').update({
                                    operator: fallback.operator,
                                    route: fallback.route_no
                                }).eq('license_plate', plate).eq('effective_date', targetDate);
                            } else {
                                await window.sb.from('vehicle_history').delete()
                                    .eq('license_plate', plate).eq('effective_date', targetDate);
                            }
                        } else {
                            const { data: history } = await window.sb.from('vehicle_history')
                                .select('*').eq('license_plate', plate).eq('effective_date', targetDate);

                            if (history && history.length > 0) {
                                if (!isPlateChanged || history[0].operator !== newData.operator || history[0].route !== newData.route_no) {
                                    await window.sb.from('vehicle_history').update({
                                        operator: newData.operator,
                                        route: newData.route_no
                                    }).eq('id', history[0].id);
                                }
                            } else {
                                const { count } = await window.sb.from('vehicle_history').select('*', { count: 'exact', head: true }).eq('license_plate', plate);
                                await window.sb.from('vehicle_history').insert({
                                    license_plate: plate,
                                    effective_date: targetDate,
                                    operator: newData.operator,
                                    route: newData.route_no,
                                    display_order: count || 0
                                });
                            }
                        }
                        await app.vehicle.cleanupVehicle(plate);
                    } catch (e) { console.error("Lỗi sync lịch sử:", e); }
                },

                toggleVehiclePageEdit: (plate) => {
                    if (!app.user) return app.auth.check();
                    const fields = ['vehicle-edit-model', 'vehicle-edit-note'];
                    const actionsDiv = document.getElementById('vehicle-edit-actions');
                    const triggerContainer = document.getElementById('veh-edit-trigger-container');

                    fields.forEach(id => {
                        const input = document.getElementById(id);
                        input.readOnly = !input.readOnly;
                        if (!input.readOnly) {
                             input.classList.add('bg-white', 'focus:ring-2', 'focus:ring-black');
                             input.classList.remove('bg-gray-50', 'cursor-not-allowed');
                        } else {
                             input.classList.remove('bg-white', 'focus:ring-2', 'focus:ring-black');
                             input.classList.add('bg-gray-50', 'cursor-not-allowed');
                        }
                    });

                    if (actionsDiv.classList.contains('hidden')) {
                        actionsDiv.classList.remove('hidden');
                        actionsDiv.classList.add('flex');
                        if (triggerContainer) triggerContainer.classList.add('hidden');
                        if (app.role === 'admin' || app.role === 'manager') document.getElementById('btn-vehicle-save').innerText = "Lưu ngay lập tức";
                    } else {
                        actionsDiv.classList.add('hidden');
                        actionsDiv.classList.remove('flex');
                        if (triggerContainer) triggerContainer.classList.remove('hidden');
                    }
                },

                saveVehiclePageChanges: async (plate) => {
                    const btnSave = document.getElementById('btn-vehicle-save');
                    btnSave.disabled = true;
                    btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';

                    const newData = {
                        model: document.getElementById('vehicle-edit-model').value.trim(),
                        note: document.getElementById('vehicle-edit-note').value.trim()
                    };

                    // [BẢO VỆ] Kiểm tra xem có thay đổi không
                    if (app.currentVehicle && newData.model === (app.currentVehicle.model || '') && newData.note === (app.currentVehicle.note || '')) {
                        btnSave.disabled = false; btnSave.innerHTML = 'Gửi yêu cầu';
                        return app.ui.showAlert("Không có sự thay đổi nào so với dữ liệu gốc. Yêu cầu bị hủy.");
                    }

                    if (app.role !== 'admin' && app.role !== 'manager') {
                        try { await app.captcha.request(); } catch (err) {
                            if (err.message !== "CAPTCHA_CANCELLED") app.ui.showAlert("Lỗi xác thực Captcha.");
                            btnSave.disabled = false; btnSave.innerHTML = 'Gửi yêu cầu';
                            return;
                        }
                    }

                    try {
                        if (newData.model && await app.utils.checkModelDuplicatePolicy(plate, newData.model)) {
                            btnSave.disabled = false; btnSave.innerHTML = 'Gửi yêu cầu';
                            return;
                        }
                        if (app.role === 'admin' || app.role === 'manager') {

                            const { error } = await window.sb.from('vehicles').update(newData).eq('license_plate', plate);
                            if (error) throw error;
                            app.toast.show('success', 'Đã lưu thay đổi', 'Thông tin xe đã được cập nhật thành công.');
                            app.views.loadVehiclePage(plate, true);
                        } else {
                            // [BẢO VỆ] Kiểm tra xem đã có yêu cầu nào đang chờ duyệt cho xe này chưa
                            const { count } = await window.sb.from('edit_requests').select('*', { count: 'exact', head: true }).eq('license_plate', plate).eq('status', 'pending').contains('new_data', { request_type: 'update_vehicle_details' });
                            if (count > 0) {
                                btnSave.disabled = false; btnSave.innerHTML = 'Gửi yêu cầu';
                                return app.ui.showAlert("Có yêu cầu chỉnh sửa hồ sơ khác đang chờ duyệt cho xe này. Vui lòng thử lại sau.");
                            }

                            const { error } = await window.sb.from('edit_requests').insert({
                                requester_id: app.user.id, license_plate: plate, new_data: { ...newData, request_type: 'update_vehicle_details' }, status: 'pending'
                            });
                            if (error) throw error;
                            app.ui.showAlert("Đã gửi yêu cầu chỉnh sửa và đang chờ Admin duyệt.");
                            app.vehicle.toggleVehiclePageEdit(plate);
                        }
                    } catch (err) { app.ui.showAlert("Lỗi: " + err.message); } finally { btnSave.disabled = false; btnSave.innerHTML = 'Gửi yêu cầu'; }
                }
            }
});

Object.assign(window.app, {
  edit: {
                isEditing: false,
                toggleInlineEdit: () => {
                    if (!app.user) return app.auth.check();
                    const formInputs = document.querySelectorAll('#inline-edit-form .info-input');
                    const actions = document.getElementById('edit-actions');
                    const triggerContainer = document.getElementById('edit-trigger-container');
                    const notice = document.getElementById('edit-mode-notice');
                    const noticeText = document.getElementById('edit-notice-text');
                    const btnSave = document.getElementById('btn-save-inline');

                    app.edit.isEditing = !app.edit.isEditing;

                    if (app.edit.isEditing) {
                        formInputs.forEach(input => {
                            if (input.tagName === 'SELECT') { input.disabled = false; } 
                            else {
                                if (input.id !== 'info-plate' && input.id !== 'info-date') input.readOnly = false;
                            }
                        });

                        const provBtn = document.getElementById('info-province-btn');
                        const provCaret = document.getElementById('info-province-caret');
                        if (provBtn) {
                            provBtn.disabled = false;
                            provBtn.classList.remove('border-transparent');
                            provBtn.classList.add('border-gray-300');
                        }
                        if (provCaret) provCaret.classList.remove('hidden');

                        actions.classList.remove('hidden');
                        actions.classList.add('flex');
                        if (triggerContainer) triggerContainer.classList.add('hidden');
                        notice.classList.remove('hidden');

                        if (app.role === 'admin' || app.role === 'manager') {
                            noticeText.innerText = "ADMIN MODE: Bạn đang sửa trực tiếp vào cơ sở dữ liệu (Ngày chụp khóa cố định).";
                            btnSave.innerText = "Lưu ngay lập tức";
                            document.getElementById('info-plate').readOnly = false;
                        } else {
                            noticeText.innerText = "Bạn đang ở chế độ chỉnh sửa. Thay đổi sẽ được gửi yêu cầu duyệt (Ngày chụp đã được khóa cố định).";
                            btnSave.innerText = "Gửi yêu cầu";
                        }
                    } else {
                        app.edit.cancel();
                    }
                },
                cancel: () => {
                    const formInputs = document.querySelectorAll('#inline-edit-form .info-input');
                    formInputs.forEach(input => {
                        if (input.tagName === 'SELECT') input.disabled = true;
                        else input.readOnly = true;
                    });

                    const provBtn = document.getElementById('info-province-btn');
                    const provCaret = document.getElementById('info-province-caret');
                    const provMenu = document.getElementById('info-province-menu');
                    if (provBtn) {
                        provBtn.disabled = true;
                        provBtn.classList.add('border-transparent');
                        provBtn.classList.remove('border-gray-300');
                    }
                    if (provCaret) provCaret.classList.add('hidden');
                    if (provMenu) provMenu.classList.remove('active');

                    const triggerContainer = document.getElementById('edit-trigger-container');
                    if (triggerContainer) triggerContainer.classList.remove('hidden');

                    document.getElementById('edit-actions').classList.add('hidden');
                    document.getElementById('edit-actions').classList.remove('flex');
                    document.getElementById('edit-mode-notice').classList.add('hidden');
                    app.edit.isEditing = false;
                },
                submitInline: async (e) => {
                    e.preventDefault();
                    if (!app.user) return;

                    const btn = document.getElementById('btn-save-inline');
                    const originalText = btn.innerText;
                    btn.innerText = "Đang xử lý..."; btn.disabled = true;

                    const payload = {
                        license_plate: document.getElementById('info-plate').value.replace(/[^A-Z0-9-]/gi, '').toUpperCase(),
                        operator: document.getElementById('info-operator').value,
                        type: document.getElementById('info-type').value,
                        route: document.getElementById('info-route').value,
                        model: document.getElementById('info-model').value,
                        location: document.getElementById('info-location').value,
                        province: document.getElementById('info-province')?.value || null,
                        note: document.getElementById('info-note').value,
                        taken_at: app.currentPhoto.taken_at
                    };

                    let missingFields = [];
                    if (!payload.type) missingFields.push("Loại xe");
                    if (!payload.license_plate) missingFields.push("Biển kiểm soát");
                    if (!payload.taken_at) missingFields.push("Ngày chụp");
                    if (!payload.route) missingFields.push("Mã số tuyến / Lộ trình");
                    if (!payload.operator) missingFields.push("Đơn vị vận hành");
                    if (!payload.model) missingFields.push("Dòng xe (Model)");
                    if (!payload.location) missingFields.push("Vị trí chụp");

                    if (missingFields.length > 0) {
                        let msg = `Vui lòng điền đủ các trường bắt buộc: <b>${missingFields.join(', ')}</b>.`;
                        btn.innerText = originalText; btn.disabled = false;
                        return app.ui.showAlert(msg, null, null, { title: "Thiếu thông tin" });
                    }

                    if (app.role !== 'admin' && app.role !== 'manager') {
                        try { await app.captcha.request(); } catch (err) {
                            if (err.message !== "CAPTCHA_CANCELLED") app.ui.showAlert("Lỗi xác thực Captcha.");
                            btn.innerText = originalText; btn.disabled = false;
                            return;
                        }
                    }

                    try {
                        const takenAtChanged = false; // Khóa cố định Ngày chụp, không cho phép thay đổi


                        if (takenAtChanged || payload.license_plate !== app.currentPhoto.license_plate) {
                            const targetDate = payload.taken_at || app.currentPhoto.taken_at;
                            if (targetDate) {
                                const datePart = targetDate.split('T')[0];
                                const { data: existingPhotos, error: checkErr } = await window.sb
                                    .from('photos')
                                    .select('id, taken_at')
                                    .eq('uploader_id', app.currentPhoto.uploader_id)
                                    .eq('license_plate', payload.license_plate)
                                    .neq('id', app.currentPhoto.id)
                                    .neq('status', 'denied');

                                if (!checkErr && existingPhotos && existingPhotos.length > 0) {
                                    const isDuplicateDate = existingPhotos.some(p => p.taken_at && p.taken_at.split('T')[0] === datePart);
                                    if (isDuplicateDate) {
                                        const displayDate = datePart.split('-').reverse().join('/');
                                        app.ui.showAlert(`Lỗi: Tài khoản này đã có ảnh của xe <b>${payload.license_plate}</b> vào ngày <b>${displayDate}</b> rồi. Không thể đổi thành ngày/biển số này để tránh trùng lặp 1 xe/1 ngày.`);
                                        btn.innerText = originalText; btn.disabled = false;
                                        return;
                                    }
                                }
                            }
                        }



                        const beforeSnapshot = {
                            photo_id: app.currentPhoto.id,
                            taken_at: app.currentPhoto.taken_at,
                            license_plate: app.currentPhoto.license_plate,
                            location: app.currentPhoto.location,
                            note: app.currentPhoto.note,
                            operator: app.currentPhoto.operator || app.currentVehicle?.operator,
                            type: app.currentPhoto.type || app.currentVehicle?.type,
                            route_no: app.currentPhoto.route_no || app.currentVehicle?.route_no,
                            model: app.currentPhoto.model || app.currentVehicle?.model
                        };

                        if (app.user.id === app.currentPhoto.uploader_id || app.role === 'admin' || app.role === 'manager') {
                            if (takenAtChanged) {
                                await window.sb.from('photos').update({ taken_at: payload.taken_at }).eq('id', app.currentPhoto.id);
                                app.currentPhoto.taken_at = payload.taken_at;
                            }
                        }

                        if (app.role === 'admin' || app.role === 'manager') {

                            const { error: vError } = await window.sb.from('vehicles').upsert({
                                license_plate: payload.license_plate,
                                model: payload.model
                            }, { onConflict: 'license_plate' });

                            if (vError) throw vError;


                            const { error: pError } = await window.sb.from('photos').update({
                                license_plate: payload.license_plate,
                                location: payload.location,
                                province: payload.province,
                                note: payload.note,
                                operator: payload.operator,
                                type: payload.type,
                                route_no: payload.route
                            }).eq('id', app.currentPhoto.id);

                            if (pError) throw pError;

                            const afterSnapshot = {
                                photo_id: app.currentPhoto.id,
                                taken_at: takenAtChanged ? payload.taken_at : beforeSnapshot.taken_at,
                                license_plate: payload.license_plate,
                                location: payload.location,
                                note: payload.note,
                                operator: payload.operator,
                                type: payload.type,
                                route_no: payload.route,
                                model: payload.model
                            };


                            app.admin.logAction(
                                'update_photo_info_direct',
                                app.currentPhoto.id,
                                { taken_at_changed: takenAtChanged, before: beforeSnapshot, after: afterSnapshot }
                            );

                            const isPlateChanged = beforeSnapshot.license_plate !== payload.license_plate;
                            if (isPlateChanged || takenAtChanged || beforeSnapshot.operator !== payload.operator || beforeSnapshot.route_no !== payload.route) {
                                await app.vehicle.syncHistoryOnPhotoEdit(
                                    payload.license_plate,
                                    takenAtChanged ? payload.taken_at : beforeSnapshot.taken_at,
                                    { operator: beforeSnapshot.operator, route_no: beforeSnapshot.route_no },
                                    { operator: payload.operator, route_no: payload.route },
                                    isPlateChanged
                                );
                            }

                            app.toast.show('success', 'Lưu thành công', 'Dữ liệu của ảnh này đã được cập nhật.');

                            if (isPlateChanged) {
                                await app.vehicle.cleanupVehicle(beforeSnapshot.license_plate);
                            }
                            await app.vehicle.cleanupVehicle(payload.license_plate);

                            app.currentPhoto.license_plate = payload.license_plate;
                            app.currentPhoto.location = payload.location;
                            app.currentPhoto.province = payload.province;
                            app.currentPhoto.note = payload.note;
                            app.currentPhoto.operator = payload.operator;
                            app.currentPhoto.type = payload.type;
                            app.currentPhoto.route_no = payload.route;

                            if (app.currentVehicle) {
                                app.currentVehicle.model = payload.model;

                            }

                            document.getElementById('detail-title').innerText = `${payload.license_plate} - ${payload.operator}`;
                            document.getElementById('crumb-model').innerText = payload.license_plate;
                            document.getElementById('info-plate').value = payload.license_plate;

                            app.edit.cancel();
                        } else {
                            // [BẢO VỆ] Kiểm tra xem ảnh này đã có yêu cầu nào đang chờ duyệt chưa
                            const { count, error: checkErr } = await window.sb.from('edit_requests')
                                .select('*', { count: 'exact', head: true })
                                .eq('status', 'pending')
                                .contains('new_data', { photo_id: app.currentPhoto.id });
                                
                            if (checkErr) throw checkErr;
                            if (count > 0) {
                                btn.innerText = originalText; btn.disabled = false;
                                return app.ui.showAlert("Ảnh này đang có một yêu cầu chỉnh sửa hoặc xóa khác chờ duyệt. Vui lòng đợi Admin xử lý xong trước khi gửi yêu cầu mới.");
                            }

                            const reqData = {
                                requester_id: app.user.id,
                                license_plate: payload.license_plate,
                                new_data: {
                                    ...payload,
                                    request_type: 'update_vehicle_info',
                                    photo_id: app.currentPhoto.id
                                },
                                status: 'pending'
                            };

                            const { data, error } = await window.sb.from('edit_requests').insert(reqData).select().single();
                            if (error) throw error;

                            app.ui.showAlert("Yêu cầu chỉnh sửa đã được gửi và đang chờ Admin duyệt.");
                            app.edit.cancel();
                        }
                    } catch (err) {
                        app.ui.showAlert("Lỗi: " + err.message);
                        console.error(err);
                    } finally {
                        btn.innerText = originalText; btn.disabled = false;
                    }
                }
            }
});

Object.assign(window.app, {
  preference: {
                current: 'both',
                tempSelection: 'both',
                showRecommendations: true,
                tempShowRec: true,

                load: () => {
                    const savedRec = localStorage.getItem('vnbus_show_rec');
                    if (savedRec !== null) app.preference.showRecommendations = savedRec === 'true';
                    const saved = localStorage.getItem('vnbus_preference');
                    if (saved) {
                        app.preference.current = saved;
                        return saved;
                    }
                    return null;
                },

                open: (isOnboarding = false) => {
                    app.preference.tempSelection = app.preference.current || 'both';
                    app.preference.tempShowRec = app.preference.showRecommendations;
                    app.settings.open();
                    app.settings.switchTab('preference');
                    app.preference.updateUI();
                },

                select: (val) => {
                    app.preference.tempSelection = val;
                    app.preference.updateUI();
                    if (app.onboarding && app.onboarding.isOpen) {
                        app.onboarding.updatePrefUI();
                    }
                },
                toggleRec: (val) => {
                    app.preference.tempShowRec = val;
                },

                updateUI: () => {
                    const toggleRec = document.getElementById('set-pref-toggle-rec');
                    if (toggleRec) {
                        toggleRec.checked = app.preference.tempShowRec;
                    }

                    ['bus', 'coach', 'both'].forEach(type => {
                        ['pref-btn-', 'set-pref-btn-'].forEach(prefix => {
                            const btn = document.getElementById(`${prefix}${type}`);
                            if (!btn) return;

                            const iconBg = btn.querySelector('.pref-icon');
                            const p = btn.querySelector('.pref-desc');

                            if (app.preference.tempSelection === type) {
                                btn.className = `pref-option cursor-pointer border border-black bg-black text-white rounded-xl p-4 shadow-md transition-all duration-200 flex items-start gap-3 scale-[1.02]`;
                                iconBg.classList.replace('bg-gray-100', 'bg-white/20');
                                iconBg.classList.replace('border-transparent', 'border-white/30');
                                if (p) p.classList.replace('text-gray-500', 'text-gray-300');
                            } else {
                                btn.className = `pref-option cursor-pointer border border-gray-300 bg-white text-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-gray-400 transition-all duration-200 flex items-start gap-3 scale-100`;
                                iconBg.classList.replace('bg-white/20', 'bg-gray-100');
                                iconBg.classList.replace('border-white/30', 'border-transparent');
                                if (p) p.classList.replace('text-gray-300', 'text-gray-500');
                            }
                        });
                    });
                },

                save: () => {
                    const isChanged = app.preference.current !== app.preference.tempSelection;
                    const isRecChanged = app.preference.showRecommendations !== app.preference.tempShowRec;

                    app.preference.current = app.preference.tempSelection;
                    app.preference.showRecommendations = app.preference.tempShowRec;

                    localStorage.setItem('vnbus_preference', app.preference.current);
                    localStorage.setItem('vnbus_show_rec', app.preference.showRecommendations);

                    if (app.user) {
                        const curWmMode = localStorage.getItem('vnbus_wm_mode') || (app.wmState && app.wmState.mode) || 'basic';
                        window.sb.from('profiles').update({
                            preferences: { type: app.preference.current, showRec: app.preference.showRecommendations, wmMode: curWmMode }
                        }).eq('id', app.user.id).then(({error}) => {});
                    }

                    app.ui.showAlert("Đã lưu thiết lập Cá nhân hóa thành công!");

                    if (isChanged || isRecChanged) {
                        const path = window.location.pathname;
                        if (path === '/') {
                            app.views.loadHome(true);
                        } else if (path.startsWith('/profile') || path.startsWith('/user/')) {
                            app.views.loadAccount(null, true);
                        } else if (path.startsWith('/vehicle/')) {
                            app.views.loadVehiclePage(app.currentPlate);
                        } else if (path.startsWith('/photo/')) {
                            app.views.loadDetail(app.currentPhoto.id);
                        }
                    }
                },

                close: () => {
                    const modal = document.getElementById('preference-modal');
                    const content = document.getElementById('preference-content');
                    if (!modal || !content) return;
                    content.classList.remove('opacity-100', 'scale-100');
                    content.classList.add('opacity-0', 'scale-95');
                    setTimeout(() => {
                        modal.classList.add('hidden');
                        app.ui.unlockScroll();
                    }, 200);
                },

                applyFilter: (query, tableName = 'photos') => {
                    if (app.preference.current === 'both') return query;

                    if (tableName === 'photos') {
                        return query.eq('type', app.preference.current);
                    } else if (tableName === 'vehicles') {
                        return query.eq('photos.type', app.preference.current);
                    }
                    return query;
                }
            }
});

document.addEventListener('DOMContentLoaded', () => {
    window.addEventListener('resize', () => {
        if (window.app && window.app.upload && window.app.upload.updateWmModeSlider) {
            window.app.upload.updateWmModeSlider();
        }
    });
    setTimeout(() => {
        const savedMode = (typeof localStorage !== 'undefined' && localStorage.getItem('vnbus_wm_mode')) || 'basic';
        if (window.app && window.app.upload && window.app.upload.setWmMode) {
            window.app.upload.setWmMode(savedMode);
        }
    }, 500);
});

