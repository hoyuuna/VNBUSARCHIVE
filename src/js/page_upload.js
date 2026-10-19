Object.assign(window.app, {
    upload: {
                 currentQuota: { limit: null, count: 0 },
                 routeOpTimeout: null,
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
                               if (provBtn) {
                                   provBtn.classList.remove('border-red-500', 'focus:ring-red-500');
                                   provBtn.classList.add('border-gray-300', 'focus:ring-black');
                               }
                               if (provErr) provErr.classList.add('hidden');
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
                     if(app.upload.renderPinnedLocations) app.upload.renderPinnedLocations();
                 },
                 saveDraft: () => {
                     const plateEl = document.getElementById('up-plate');
                     if (!plateEl) {
                         return;
                     }
                     const plate = plateEl.value || '';
                     const operator = document.getElementById('up-operator')?.value || '';
                     const route = document.getElementById('up-route')?.value || '';
                     const model = document.getElementById('up-model')?.value || '';
                     const note = document.getElementById('up-note')?.value || '';
                     const province = document.getElementById('up-province')?.value || '';
                     const location = document.getElementById('up-location')?.value || '';
                     
                     if (!plate && !operator && !route && !model && !note && !province && !location) {
                         return;
                     }

                     const draft = {
                         plate: plate, type: document.getElementById('up-type')?.value || '',
                         route: route, operator: operator, model: model,
                         location: location,
                         province: province,
                         date: document.getElementById('up-date')?.value || '', note: note
                     };
                     localStorage.setItem('vnbus_upload_draft', JSON.stringify(draft));
                 },
                 startDraftAutoSave: () => {
                     if (!app.upload.draftInterval) {
                         app.upload.draftInterval = setInterval(() => {
                             if (document.getElementById('upload') && !document.getElementById('upload').classList.contains('hidden')) {
                                 app.upload.saveDraft();
                             }
                         }, 5000);
                     }
                     if (!app.upload.draftUnloadBound) {
                         window.addEventListener('beforeunload', () => {
                             if (document.getElementById('upload') && !document.getElementById('upload').classList.contains('hidden')) {
                                 app.upload.saveDraft();
                             }
                         });
                         app.upload.draftUnloadBound = true;
                     }
                 },
                 checkAndPromptDraft: () => {
                     app.upload.startDraftAutoSave();
                     const saved = localStorage.getItem('vnbus_upload_draft');
                     if (saved) {
                         try {
                             const draft = JSON.parse(saved);
                             const shouldPrompt = draft.plate || draft.operator || draft.route || draft.model || draft.location || draft.province || draft.note;
                             if (shouldPrompt) {
                                 app.ui.showAlert(
                                     `Bạn có bản nháp có thể phục hồi.`,
                                     () => { app.upload.loadDraft(draft); },
                                     () => { app.upload.clearDraft(); },
                                     { title: "Khôi phục bản nháp", btnOkText: "Đồng ý", btnCancelText: "Hủy" }
                                 );
                             }
                         } catch (e) { 
                             app.upload.clearDraft(); 
                         }
                     }
                 },
                 loadDraft: async (draft) => {
                     try {
                         if(draft.plate) document.getElementById('up-plate').value = draft.plate;
                         if(draft.type) { document.getElementById('up-type').value = draft.type; app.upload.applyPreferenceUI(); }
                         if(draft.route) document.getElementById('up-route').value = draft.route;
                         if(draft.operator) document.getElementById('up-operator').value = draft.operator;
                         if(draft.model) document.getElementById('up-model').value = draft.model;
                         if(draft.location) {
                             document.getElementById('up-location').value = draft.location;
                             if(app.upload.checkLocationPinStatus) app.upload.checkLocationPinStatus(draft.location);
                         }
                         if(draft.province && app.upload.selectProvince) app.upload.selectProvince(draft.province);
                         if(draft.date) document.getElementById('up-date').value = draft.date;
                         if(draft.note) document.getElementById('up-note').value = draft.note;
                         if(draft.plate) app.upload.checkPlate(draft.plate);
                     } catch (e) { console.warn("Lỗi load draft", e); }
                 },
                 clearDraft: () => { 
                     localStorage.removeItem('vnbus_upload_draft'); 
                 },
                 savePreferencesToServer: async () => {
                     if (!app.user) return;
                     try {
                         const { data } = await window.sb.from('profiles').select('preferences').eq('id', app.user.id).single();
                         const existingPrefs = (data && data.preferences) ? data.preferences : {};
                         existingPrefs.type = app.preference.current;
                         existingPrefs.wmMode = app.wmState ? app.wmState.mode : 'basic';
                         existingPrefs.pinnedLocations = app.preference.pinnedLocations || [];
                         delete existingPrefs.wmRotate;
                         delete existingPrefs.wmScale;
                         existingPrefs.wmBarScale = (app.wmState && app.wmState.barScale !== undefined) ? app.wmState.barScale : 1.0;
                         
                         await window.sb.from('profiles').update({
                             preferences: existingPrefs
                         }).eq('id', app.user.id);
                     } catch(e) { console.warn("Failed to sync preferences", e); }
                 },
                 toggleLocationPin: () => {
                     const locInput = document.getElementById('up-location');
                     if (!locInput || locInput.disabled) return;
                     const loc = locInput.value.trim();
                     if (!loc || loc === 'Chụp trong xe') return;
                     
                     if (!app.preference.pinnedLocations) app.preference.pinnedLocations = [];
                     const idx = app.preference.pinnedLocations.indexOf(loc);
                     
                     if (idx > -1) {
                         app.preference.pinnedLocations.splice(idx, 1);
                         app.upload.checkLocationPinStatus(loc);
                         app.upload.savePreferencesToServer();
                         const container = document.getElementById('up-location-history');
                         if (container) {
                             const btnToRemove = Array.from(container.children).find(b => b.dataset.loc === loc);
                             if (btnToRemove) {
                                 btnToRemove.classList.remove('scale-100', 'opacity-100');
                                 btnToRemove.classList.add('scale-0', 'opacity-0');
                                 setTimeout(() => app.upload.renderPinnedLocations(), 200);
                             } else {
                                 app.upload.renderPinnedLocations();
                             }
                         }
                     } else {
                         if (app.preference.pinnedLocations.length >= 10) {
                             app.ui.showAlert('Bạn chỉ có thể ghim tối đa 10 vị trí.');
                             return;
                         }
                         app.preference.pinnedLocations.unshift(loc);
                         app.upload.checkLocationPinStatus(loc);
                         app.upload.pendingPopLoc = loc;
                         app.upload.renderPinnedLocations();
                         app.upload.savePreferencesToServer();
                     }
                 },
                 checkLocationPinStatus: (loc) => {
                     const btn = document.getElementById('up-location-pin-btn');
                     if (!btn) return;
                     const currentLoc = (loc || '').trim();
                     if (!currentLoc || currentLoc === 'Chụp trong xe' || !app.preference.pinnedLocations || !app.preference.pinnedLocations.includes(currentLoc)) {
                         btn.classList.remove('bg-black', 'text-white', 'border-black');
                         btn.classList.add('bg-white', 'text-gray-500', 'border-gray-300', 'hover:bg-gray-100');
                     } else {
                         btn.classList.remove('bg-white', 'text-gray-500', 'border-gray-300', 'hover:bg-gray-100');
                         btn.classList.add('bg-black', 'text-white', 'border-black');
                     }
                 },
                 renderPinnedLocations: () => {
                     const container = document.getElementById('up-location-history');
                     if (!container) return;
                     const pinned = app.preference.pinnedLocations || [];
                     if (pinned.length === 0) {
                         container.classList.add('hidden');
                         return;
                     }
                     container.innerHTML = '';
                     pinned.forEach(loc => {
                         const btn = document.createElement('button');
                         btn.type = 'button';
                         btn.dataset.loc = loc;
                         
                         let classes = 'flex items-center gap-1 bg-white border border-black dark:border-white hover:bg-gray-100 dark:bg-[#18181b] dark:hover:bg-[#27272a] text-black dark:text-white text-[11px] font-bold px-2.5 py-1.5 rounded-md transition-all duration-200 ease-out active:scale-95 select-none truncate max-w-[140px] origin-center';
                         if (app.upload.pendingPopLoc === loc) {
                             classes += ' scale-0 opacity-0';
                         } else {
                             classes += ' scale-100 opacity-100';
                         }
                         btn.className = classes;
                         
                         btn.innerHTML = `<i class="fa-solid fa-thumbtack opacity-60"></i><span class="truncate">${app.utils.escapeHtml(loc)}</span>`;
                         btn.onclick = () => {
                             const input = document.getElementById('up-location');
                             if (input && !input.disabled) {
                                 input.value = loc;
                                 app.upload.checkLocationPinStatus(loc);
                             }
                         };
                         container.appendChild(btn);
                     });
                     container.classList.remove('hidden');
                     
                     if (app.upload.pendingPopLoc) {
                         setTimeout(() => {
                             const popBtn = Array.from(container.children).find(b => b.dataset.loc === app.upload.pendingPopLoc);
                             if (popBtn) {
                                 popBtn.classList.remove('scale-0', 'opacity-0');
                                 popBtn.classList.add('scale-100', 'opacity-100');
                             }
                             app.upload.pendingPopLoc = null;
                         }, 10);
                     }
                 },
                 applySpecialRoute: (route) => {
                     const routeInput = document.getElementById('up-route');
                     if (!routeInput || routeInput.disabled || routeInput.readOnly) return;
                     routeInput.value = route;
                     const box = document.getElementById('up-route-suggestions');
                     if (box) box.classList.remove('active');
                     if (app.utils.checkRouteStatus) app.utils.checkRouteStatus(route, 'up-operator', 'up-operator-wrapper');
                     if (app.upload.autoFillOperatorByRoute) app.upload.autoFillOperatorByRoute();
                 },
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
                        const res = await fetch('https://raw.githubusercontent.com/hoyuuna/VNBUSARCHIVE/refs/heads/main/doc/Requirements.md');
                        if (!res.ok) throw new Error('Network error');
                        let text = await res.text();
                        
                        try {
                            const commitRes = await fetch(`https://api.github.com/repos/hoyuuna/VNBUSARCHIVE/commits?path=doc/Requirements.md&page=1&per_page=1`);
                            if (commitRes.ok) {
                                const commitData = await commitRes.json();
                                if (commitData && commitData.length > 0) {
                                    const commitHash = commitData[0].sha;
                                    const dateObj = new Date(commitData[0].commit.author.date);
                                    const formattedDate = ("0" + dateObj.getDate()).slice(-2) + "/" + ("0" + (dateObj.getMonth() + 1)).slice(-2) + "/" + dateObj.getFullYear();
                                    
                                    const updateBlock = `
                                        <div class="border border-black dark:border-white p-3 rounded-md mb-6 text-sm bg-white dark:bg-[#18181b] text-black dark:text-white font-medium">
                                            <i class="fa-solid fa-clock-rotate-left mr-2"></i>Thay đổi lần cuối: ${formattedDate} 
                                            <a href="https://github.com/hoyuuna/VNBUSARCHIVE/commits/main/doc/Requirements.md" target="_blank" class="!text-black dark:!text-white underline hover:opacity-80 transition-opacity ml-1">(xem thay đổi)</a>
                                        </div>
                                    `;
                                    text = text.replace(/\*\*👉 LƯU Ý: Cập nhật lần cuối.*?\*\*/, '');
                                    const html = DOMPurify.sanitize(updateBlock, { ADD_ATTR: ['target'] }) + DOMPurify.sanitize(marked.parse(text));
                                    container.innerHTML = html;
                                    
                                    const firstH1 = container.querySelector('h1');
                                    if (firstH1) firstH1.remove();
                                    container.dataset.loaded = 'true';
                                    return;
                                }
                            }
                        } catch(e){}

                        text = text.replace(/\*\*👉 LƯU Ý: Cập nhật lần cuối.*?\*\*/, '');
                        const html = DOMPurify.sanitize(marked.parse(text));
                        container.innerHTML = html;
                        const firstH1 = container.querySelector('h1');
                        if (firstH1) firstH1.remove();
                        container.dataset.loaded = 'true';
                    } catch (e) {
                        container.innerHTML = '<p class="text-red-500 font-bold py-4 text-center"><i class="fa-solid fa-triangle-exclamation"></i> Không thể tải nội dung tự động. Vui lòng nhấn "Xem chi tiết" bên dưới.</p>';
                    }
                },
                existingVehiclesList:[],
                modelPreviewCache: {},
                previewDebounceTimeout: null,
                checkModelPreview: (modelName = '') => {
                    clearTimeout(app.upload.previewDebounceTimeout);
                    app.upload.previewDebounceTimeout = setTimeout(async () => {
                        if (!modelName) {
                            const modelInput = document.getElementById('up-model');
                            modelName = modelInput ? modelInput.value.trim() : '';
                        }
                        const previewContainer = document.getElementById('up-model-preview');
                        const previewImg = document.getElementById('up-model-preview-img');
                        const previewName = document.getElementById('up-model-preview-name');
                        const lockedMsg = document.getElementById('locked-msg');
                        if (!previewContainer || !previewImg || !previewName) return;
                        const isLocked = lockedMsg && !lockedMsg.classList.contains('hidden');
                        if (!modelName || isLocked) {
                            previewContainer.classList.add('hidden');
                            previewContainer.classList.remove('flex');
                            return;
                        }
                        if (app.upload.modelPreviewCache[modelName] !== undefined) {
                            const cachedUrl = app.upload.modelPreviewCache[modelName];
                            if (cachedUrl) {
                                previewImg.src = app.utils.getProxiedUrl(cachedUrl, 'model-preview.jpg', 'thumb');
                                previewImg.dataset.fullSrc = app.utils.getProxiedUrl(cachedUrl, 'full.jpg');
                                previewName.innerText = modelName;
                                previewContainer.classList.remove('hidden');
                                previewContainer.classList.add('flex');
                            } else {
                                previewContainer.classList.add('hidden');
                                previewContainer.classList.remove('flex');
                            }
                            return;
                        }
                        try {
                            const { data: topPhoto } = await window.sb.from('photos')
                                .select('url, vehicles!inner(model)')
                                .eq('status', 'approved')
                                .eq('vehicles.model', modelName)
                                .neq('location', 'Chụp trong xe')
                                .order('created_at', { ascending: false })
                                .limit(1)
                                .maybeSingle();
                            if (topPhoto && topPhoto.url) {
                                app.upload.modelPreviewCache[modelName] = topPhoto.url;
                                previewImg.src = app.utils.getProxiedUrl(topPhoto.url, 'model-preview.jpg', 'thumb');
                                previewImg.dataset.fullSrc = app.utils.getProxiedUrl(topPhoto.url, 'full.jpg');
                                previewName.innerText = modelName;
                                previewContainer.classList.remove('hidden');
                                previewContainer.classList.add('flex');
                            } else {
                                app.upload.modelPreviewCache[modelName] = null;
                                previewContainer.classList.add('hidden');
                                previewContainer.classList.remove('flex');
                            }
                        } catch (err) {
                            previewContainer.classList.add('hidden');
                            previewContainer.classList.remove('flex');
                        }
                    }, 500); 
                },
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
                            .select('taken_at, location')
                            .eq('uploader_id', app.user.id)
                            .eq('license_plate', cleanPlate)
                            .neq('status', 'denied');
                        if (myToken !== app.upload._dupToken) return;
                        if (!checkErr && existingPhotos && existingPhotos.length > 0) {
                            const valLocation = document.getElementById('up-location').value.trim();
                            const isInterior = valLocation === 'Chụp trong xe';
                            const isDuplicateDate = existingPhotos.some(p => {
                                if (!p.taken_at) return false;
                                const pIsInterior = (p.location || '').trim() === 'Chụp trong xe';
                                return p.taken_at.split('T')[0] === valDate && pIsInterior === isInterior;
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
                toggleInsideVehicle: (checked) => {
                    const locInput = document.getElementById('up-location');
                    const warningEl = document.getElementById('up-interior-warning');
                    if (checked) {
                        locInput.value = 'Chụp trong xe';
                        locInput.disabled = true;
                        if (warningEl) warningEl.classList.remove('hidden');
                    } else {
                        if (locInput.value === 'Chụp trong xe') locInput.value = '';
                        locInput.disabled = false;
                        if (warningEl) warningEl.classList.add('hidden');
                    }
                    app.upload.checkDuplicateRealtime();
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
                         <div class="rz-handle rz-n"  data-dir="n"></div>
                         <div class="rz-handle rz-s"  data-dir="s"></div>
                         <div class="rz-handle rz-w"  data-dir="w"></div>
                         <div class="rz-handle rz-e"  data-dir="e"></div>
                         <div class="rz-handle rz-nw" data-dir="nw"></div>
                         <div class="rz-handle rz-ne" data-dir="ne"></div>
                         <div class="rz-handle rz-sw" data-dir="sw"></div>
                         <div class="rz-handle rz-se" data-dir="se"></div>
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
                        if (panel.offsetTop + panel.offsetHeight > container.offsetHeight - 46) {
                            moveBtn.classList.add('flip-top');
                        } else {
                            moveBtn.classList.remove('flip-top');
                        }
                        if (panel.offsetTop < 18) {
                            deleteBtn.classList.add('flip-bottom');
                        } else {
                            deleteBtn.classList.remove('flip-bottom');
                        }
                        if (panel.offsetLeft + panel.offsetWidth > container.offsetWidth - 18) {
                            deleteBtn.classList.add('inside-right');
                        } else {
                            deleteBtn.classList.remove('inside-right');
                        }
                    };
                    const startDrag = (e) => {
                        selectPanel(e);
                        if (e.target.closest('.delete-blur') || e.target.closest('.rz-handle')) return;
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
                    // 8-directional anchor-based resize: no min size, axis-constrained edges, flip-over at zero
                    let isResizing = false;
                    let resizeStartX, resizeStartY, anchorX, anchorY, initialDragX, initialDragY;
                    let resizeDirX = true, resizeDirY = true;
                    const startResize = (e) => {
                        selectPanel(e);
                        e.stopPropagation();
                        if (e.type === 'touchstart') e.preventDefault();
                        isResizing = true;
                        resizeStartX = e.clientX || (e.touches && e.touches[0].clientX);
                        resizeStartY = e.clientY || (e.touches && e.touches[0].clientY);
                        const dir = e.currentTarget.dataset.dir;
                        const pL = panel.offsetLeft, pT = panel.offsetTop;
                        const pR = pL + panel.offsetWidth, pB = pT + panel.offsetHeight;
                        if      (dir==='se') { anchorX=pL; anchorY=pT; initialDragX=pR; initialDragY=pB; resizeDirX=true;  resizeDirY=true;  }
                        else if (dir==='sw') { anchorX=pR; anchorY=pT; initialDragX=pL; initialDragY=pB; resizeDirX=true;  resizeDirY=true;  }
                        else if (dir==='ne') { anchorX=pL; anchorY=pB; initialDragX=pR; initialDragY=pT; resizeDirX=true;  resizeDirY=true;  }
                        else if (dir==='nw') { anchorX=pR; anchorY=pB; initialDragX=pL; initialDragY=pT; resizeDirX=true;  resizeDirY=true;  }
                        else if (dir==='n')  { anchorX=pL; anchorY=pB; initialDragX=pR; initialDragY=pT; resizeDirX=false; resizeDirY=true;  }
                        else if (dir==='s')  { anchorX=pL; anchorY=pT; initialDragX=pR; initialDragY=pB; resizeDirX=false; resizeDirY=true;  }
                        else if (dir==='w')  { anchorX=pR; anchorY=pT; initialDragX=pL; initialDragY=pB; resizeDirX=true;  resizeDirY=false; }
                        else if (dir==='e')  { anchorX=pL; anchorY=pT; initialDragX=pR; initialDragY=pB; resizeDirX=true;  resizeDirY=false; }
                    };
                    panel.querySelectorAll('.rz-handle').forEach(h => {
                        h.addEventListener('mousedown', startResize);
                        h.addEventListener('touchstart', startResize, { passive: false });
                    });
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
                            const dragX = resizeDirX ? Math.max(0, Math.min(container.offsetWidth,  initialDragX + dx)) : initialDragX;
                            const dragY = resizeDirY ? Math.max(0, Math.min(container.offsetHeight, initialDragY + dy)) : initialDragY;
                            panel.style.left   = Math.min(anchorX, dragX) + 'px';
                            panel.style.top    = Math.min(anchorY, dragY) + 'px';
                            panel.style.width  = Math.abs(dragX - anchorX) + 'px';
                            panel.style.height = Math.abs(dragY - anchorY) + 'px';
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
                    app.upload.updateBlurBtn();
                },
                mapBlurForRecrop: (oldCrop, newCrop) => {
                    try {
                        const container = document.getElementById('preview-container');
                        const previewImg = document.getElementById('preview-img');
                        if (!container || !previewImg) return null;
                        const cw = container.offsetWidth || previewImg.clientWidth || 1;
                        const ch = container.offsetHeight || previewImg.clientHeight || 1;
                        const oW = oldCrop.width || 1, oH = oldCrop.height || 1;
                        const nW = newCrop.width || 1, nH = newCrop.height || 1;
                        const panels = Array.from(document.querySelectorAll('.blur-panel'));
                        return panels.map(panel => {
                            let fx = (panel.offsetLeft) / cw;
                            let fy = (panel.offsetTop) / ch;
                            let fw = (panel.offsetWidth) / cw;
                            let fh = (panel.offsetHeight) / ch;
                            const gx = oldCrop.x + fx * oW;
                            const gy = oldCrop.y + fy * oH;
                            const gw = fw * oW;
                            const gh = fh * oH;
                            let nfx = (gx - newCrop.x) / nW;
                            let nfy = (gy - newCrop.y) / nH;
                            let nfw = gw / nW;
                            let nfh = gh / nH;
                            if (nfx < 0) { nfw += nfx; nfx = 0; }
                            if (nfy < 0) { nfh += nfy; nfy = 0; }
                            if (nfx + nfw > 1) nfw = 1 - nfx;
                            if (nfy + nfh > 1) nfh = 1 - nfy;
                            nfx = Math.max(0, Math.min(nfx, 1));
                            nfy = Math.max(0, Math.min(nfy, 1));
                            nfw = Math.max(0.02, Math.min(nfw, 1 - nfx));
                            nfh = Math.max(0.02, Math.min(nfh, 1 - nfy));
                            return {
                                left: nfx,
                                top: nfy,
                                width: nfw,
                                height: nfh,
                                auto: panel.dataset.auto === '1'
                            };
                        });
                    } catch (e) {
                        console.warn('Lỗi map blur khi cắt lại:', e);
                        return null;
                    }
                },
                restoreBlurAfterRecrop: () => {
                    const pending = app.upload._pendingBlurRestore;
                    if (!pending) return true;
                    const container = document.getElementById('preview-container');
                    if (!container || !container.offsetWidth) return false;
                    const cw = container.offsetWidth;
                    const ch = container.offsetHeight;
                    pending.forEach(item => {
                        app.upload.buildBlurPanel({
                            left: Math.round(item.left * cw),
                            top: Math.round(item.top * ch),
                            width: Math.max(8, Math.round(item.width * cw)),
                            height: Math.max(8, Math.round(item.height * ch)),
                            auto: item.auto
                        });
                    });
                    app.upload._pendingBlurRestore = null;
                    app.upload._restoringBlur = false;
                    if (app.upload.updateBlurBtn) app.upload.updateBlurBtn();
                    return true;
                },
                removeBlurPanel: (id) => {
                    const panel = document.getElementById(id);
                    if (panel) panel.remove();
                    app.upload.updateBlurBtn();
                },
                removeBlurPanelByIndex: (index) => {
                    const panels = Array.from(document.querySelectorAll('.blur-panel'));
                    if (panels[index]) panels[index].remove();
                    app.upload.updateBlurBtn();
                },
                duplicateBlurPanelByIndex: (index) => {
                    const panels = Array.from(document.querySelectorAll('.blur-panel'));
                    if (panels[index]) {
                        const source = panels[index];
                        const left = parseFloat(source.style.left) || 0;
                        const top = parseFloat(source.style.top) || 0;
                        const width = parseFloat(source.style.width) || 50;
                        const height = parseFloat(source.style.height) || 50;
                        const container = document.getElementById('preview-container');
                        const cw = container ? (container.clientWidth || 320) : 320;
                        const ch = container ? (container.clientHeight || 240) : 240;
                        let newLeft = left + 20;
                        let newTop = top + 20;
                        if (newLeft + width > cw) newLeft = left - 20;
                        if (newTop + height > ch) newTop = top - 20;
                        app.upload.buildBlurPanel({
                            left: newLeft,
                            top: newTop,
                            width,
                            height,
                            auto: false
                        });
                        app.upload.updateBlurBtn();
                    }
                },
                toggleBlurPanel: () => {
                    const panel = document.getElementById('blur-adjust-panel');
                    const btn = document.getElementById('btn-add-blur');
                    const isHidden = panel ? panel.classList.contains('hidden') : true;
                    if (app.upload.closeAllUploadPanels) app.upload.closeAllUploadPanels();
                    if (isHidden && panel) {
                        panel.classList.remove('hidden');
                        if (btn) {
                            btn.classList.remove('bg-white', 'text-gray-700', 'border-gray-300', 'hover:bg-gray-100', 'hover:text-black');
                            btn.classList.add('bg-black', 'text-white', 'border-black');
                        }
                    }
                    app.upload.updateBlurBtn();
                },
                updateBlurBtn: () => {
                    const count = document.querySelectorAll('.blur-panel').length;
                    const btn = document.getElementById('btn-add-blur');
                    if (btn) {
                        btn.innerHTML = `<i class="fa-solid fa-droplet-slash"></i> Làm mờ`;
                    }
                    const list = document.getElementById('blur-list');
                    if (list) {
                        if (count === 0) {
                            list.innerHTML = `<p class="text-[11px] text-gray-400 font-medium italic text-center py-1">Chưa có vùng làm mờ nào.</p>`;
                        } else {
                            let html = '';
                            for (let i = 0; i < count; i++) {
                                const auto = document.querySelectorAll('.blur-panel')[i].dataset.auto === '1';
                                html += `<div class="flex items-center justify-between gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                                    <span class="text-[11px] font-bold text-gray-700 truncate flex-1"><i class="fa-solid fa-droplet-slash mr-1.5 text-gray-400"></i>Vùng ${i + 1}${auto ? ' <span class="text-[10px] text-blue-600 font-semibold">(tự động)</span>' : ''}</span>
                                    <div class="flex items-center gap-1.5">
                                        <button type="button" onclick="app.upload.duplicateBlurPanelByIndex(${i})" class="shrink-0 flex items-center justify-center w-7 h-7 rounded-md bg-white border border-gray-200 text-gray-700 hover:bg-black hover:text-white hover:border-black transition" title="Nhân bản vùng này"><i class="fa-solid fa-copy text-xs"></i></button>
                                        <button type="button" onclick="app.upload.removeBlurPanelByIndex(${i})" class="shrink-0 flex items-center justify-center w-7 h-7 rounded-md bg-white border border-gray-200 text-gray-700 hover:bg-black hover:text-white hover:border-black transition" title="Xóa vùng này"><i class="fa-solid fa-xmark text-xs"></i></button>
                                    </div>
                                </div>`;
                            }
                            list.innerHTML = html;
                        }
                    }
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
                        if(app.upload.checkModelPreview) app.upload.checkModelPreview();
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
                            window.sb.from('vehicles').select('license_plate, model').ilike('license_plate', `${basePlate}%`),
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
                                        { title: "Xác nhận chuyển đổi loại xe", btnOkText: "Chuyển đổi", btnCancelText: "Hủy bỏ" }
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
                            if(app.upload.checkModelPreview) app.upload.checkModelPreview();
                            const { data: shootersData } = await window.sb
                                .from('photos')
                                .select('profiles(username, ban_status)')
                                .eq('license_plate', rawPlate)
                                .eq('status', 'approved');
                            let shootersText = "";
                            if (shootersData && shootersData.length > 0) {
                                const uniqueUsers = [...new Set(shootersData.map(p => app.utils.formatProfileDisplay(p.profiles)).filter(u => !u.isBanned).map(u => u.username).filter(Boolean))];
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
                            { countdown: true, btnOkText: "Tôi chắc chắn", btnCancelText: "Hủy bỏ", title: "Xác nhận chuyển đổi" }
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
                    if (app.previewUpdateSize) app.previewUpdateSize();
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
                            window.sb.from('profiles').select('preferences').eq('id', app.user.id).single().then(({data}) => {
                                const existingPrefs = (data && data.preferences) ? data.preferences : {};
                                existingPrefs.type = curPref;
                                existingPrefs.wmMode = mode;
                                existingPrefs.pinnedLocations = (app.preference && app.preference.pinnedLocations) || [];
                                delete existingPrefs.wmRotate;
                                delete existingPrefs.wmScale;
                                if (app.wmState && app.wmState.barScale !== undefined) existingPrefs.wmBarScale = app.wmState.barScale;
                                window.sb.from('profiles').update({ preferences: existingPrefs }).eq('id', app.user.id).then(()=>{});
                            });
                        }
                    } catch (e) {}
                    ['standard', 'basic', 'advanced'].forEach(m => {
                        const btn = document.getElementById(`btn-wm-mode-${m}`);
                        if (btn) {
                            if (m === mode) {
                                btn.className = 'relative z-20 px-2 py-2 rounded-lg text-xs font-bold transition-colors duration-200 text-white dark:text-black';
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
                            descEl.innerHTML = 'Có dấu chìm tên tài khoản và thanh dấu chìm tiêu chuẩn phía dưới cùng công nghệ "Blind watermark" (<a href="https://www.vnbusarchive.io.vn/help/1527674609951047761" target="_blank" class="text-black font-bold underline">tìm hiểu thêm</a>).' +
                                '<div class="mt-2.5 p-2.5 rounded-lg bg-red-50 border border-red-500/80 flex items-start gap-2 text-[11px] font-bold text-red-700 leading-snug">' +
                                '<i class="fa-solid fa-triangle-exclamation text-red-600 shrink-0 mt-0.5 text-xs"></i>' +
                                '<span>Tính năng SẼ làm giảm chất lượng ảnh lên tới 10% so với thông thường, cân nhắc chỉ sử dụng khi bạn thấy thực sự cần thiết.</span>' +
                                '</div>';
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
                            slider.offsetHeight; 
                            slider.style.transition = '';
                        } else {
                            slider.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                            slider.style.left = btn.offsetLeft + 'px';
                            slider.style.width = btn.offsetWidth + 'px';
                        }
                    }
                },
                debouncedSaveWmPrefs: null,
                toggleWmPanel: () => {
                    const panel = document.getElementById('wm-adjust-panel');
                    const btn = document.getElementById('btn-adjust-wm');
                    const isHidden = panel ? panel.classList.contains('hidden') : true;
                    if (app.upload.closeAllUploadPanels) app.upload.closeAllUploadPanels();
                    if (isHidden && panel) {
                        panel.classList.remove('hidden');
                        if (btn) {
                            btn.classList.remove('bg-white', 'text-gray-700', 'border-gray-300', 'hover:bg-gray-100', 'hover:text-black');
                            btn.classList.add('bg-black', 'text-white', 'border-black');
                        }
                        const currentMode = (typeof localStorage !== 'undefined' && localStorage.getItem('vnbus_wm_mode')) || (app.wmState && app.wmState.mode) || 'basic';
                        if (app.upload.setWmMode) {
                            setTimeout(() => app.upload.setWmMode(currentMode, false), 10);
                        } else if (app.upload.updateWmModeSlider) {
                            setTimeout(() => app.upload.updateWmModeSlider(false), 10);
                        }
                        const rotSlider = document.getElementById('wm-rotate-slider');
                        const rotVal = document.getElementById('wm-rotate-val');
                        if (rotSlider) {
                            const r = (app.wmState && app.wmState.rotate !== undefined) ? app.wmState.rotate : 0;
                            rotSlider.value = r;
                            if (rotVal) rotVal.innerText = r + '°';
                        }
                        const scaleSlider = document.getElementById('wm-scale-slider');
                        const scaleVal = document.getElementById('wm-scale-val');
                        if (scaleSlider) {
                            const s = Math.round(((app.wmState && app.wmState.scale !== undefined) ? app.wmState.scale : 1.0) * 100);
                            scaleSlider.value = s;
                            if (scaleVal) scaleVal.innerText = s + '%';
                        }
                        const barScaleSlider = document.getElementById('wm-bar-scale-slider');
                        const barScaleVal = document.getElementById('wm-bar-scale-val');
                        if (barScaleSlider) {
                            const bs = Math.round(((app.wmState && app.wmState.barScale !== undefined) ? app.wmState.barScale : 1.0) * 100);
                            barScaleSlider.value = bs;
                            if (barScaleVal) barScaleVal.innerText = bs + '%';
                        }
                    }
                },
                updateWmRotate: (val) => {
                    let deg = parseInt(val, 10);
                    if (isNaN(deg)) deg = 0;
                    if (deg < -180) deg = -180;
                    if (deg > 180) deg = 180;
                    if (!app.wmState) app.wmState = {};
                    app.wmState.rotate = deg;
                    const valEl = document.getElementById('wm-rotate-val');
                    if (valEl) valEl.innerText = deg + '°';
                    const rotSlider = document.getElementById('wm-rotate-slider');
                    if (rotSlider && parseInt(rotSlider.value, 10) !== deg) rotSlider.value = deg;
                    if (app.upload.clampWmPosition) app.upload.clampWmPosition();
                },
                stepWmRotate: (delta) => {
                    const slider = document.getElementById('wm-rotate-slider');
                    let current = slider ? (parseInt(slider.value, 10) || 0) : ((app.wmState && app.wmState.rotate !== undefined) ? app.wmState.rotate : 0);
                    app.upload.updateWmRotate(current + delta);
                },
                updateWmScale: (val) => {
                    const scaleVal = parseInt(val, 10) || 100;
                    if (!app.wmState) app.wmState = {};
                    app.wmState.scale = scaleVal / 100;
                    const valEl = document.getElementById('wm-scale-val');
                    if (valEl) valEl.innerText = scaleVal + '%';
                    if (app.upload.clampWmPosition) app.upload.clampWmPosition();
                },
                updateWmBarScale: (val) => {
                    const barScaleVal = parseInt(val, 10) || 100;
                    if (!app.wmState) app.wmState = {};
                    app.wmState.barScale = barScaleVal / 100;
                    const valEl = document.getElementById('wm-bar-scale-val');
                    if (valEl) valEl.innerText = barScaleVal + '%';
                    try { localStorage.setItem('vnbus_wm_bar_scale', barScaleVal.toString()); } catch(e){}
                    if (!app.upload.debouncedSaveWmPrefs) {
                        app.upload.debouncedSaveWmPrefs = app.utils.debounce(() => {
                            if (app.upload.savePreferencesToServer) app.upload.savePreferencesToServer();
                        }, 500);
                    }
                    app.upload.debouncedSaveWmPrefs();
                    if (app.previewUpdateSize) app.previewUpdateSize();
                    if (app.upload.clampWmPosition) app.upload.clampWmPosition();
                },
                clampWmPosition: () => {
                    const el = document.getElementById('draggable-watermark');
                    const container = document.getElementById('preview-container');
                    if (!el || !container) return;
                    
                    const scale = (app.wmState && app.wmState.scale !== undefined) ? app.wmState.scale : 1.0;
                    const rotate = (app.wmState && app.wmState.rotate !== undefined) ? app.wmState.rotate : 0;
                    const barScale = (app.wmState && app.wmState.barScale !== undefined) ? app.wmState.barScale : 1.0;
                    
                    el.style.transform = `translate(-50%, -50%) rotate(${rotate}deg) scale(${scale})`;
                    
                    const cWidth = container.clientWidth;
                    const cHeight = container.clientHeight;
                    if (!cWidth || !cHeight) return;
                    
                    const wmCanvas = document.getElementById('preview-wm-canvas');
                    const rawW = wmCanvas ? (parseFloat(wmCanvas.style.width) || wmCanvas.width) : (el.offsetWidth || 100);
                    const rawH = wmCanvas ? (parseFloat(wmCanvas.style.height) || wmCanvas.height) : (el.offsetHeight || 30);
                    
                    const rad = Math.abs((rotate || 0) * Math.PI / 180);
                    const cos = Math.abs(Math.cos(rad));
                    const sin = Math.abs(Math.sin(rad));
                    
                    const wHalf = (scale * (rawW * cos + rawH * sin)) / 2;
                    const hHalf = (scale * (rawW * sin + rawH * cos)) / 2;
                    
                    const footerBarH = cHeight * 0.0576 * barScale;
                    
                    let minLeft = wHalf;
                    let maxLeft = cWidth - wHalf;
                    if (minLeft > maxLeft) {
                        minLeft = cWidth / 2;
                        maxLeft = cWidth / 2;
                    }

                    let minTop = hHalf;
                    let maxTop = cHeight - footerBarH - hHalf;
                    if (minTop > maxTop) {
                        minTop = (cHeight - footerBarH) / 2;
                        maxTop = (cHeight - footerBarH) / 2;
                    }
                    
                    let currentLeft = (app.wmState.x !== undefined ? app.wmState.x : 0.5) * cWidth;
                    let currentTop = (app.wmState.y !== undefined ? app.wmState.y : 0.5) * cHeight;
                    
                    let newLeft = Math.max(minLeft, Math.min(currentLeft, maxLeft));
                    let newTop = Math.max(minTop, Math.min(currentTop, maxTop));
                    
                    el.style.left = newLeft + 'px';
                    el.style.top = newTop + 'px';
                    
                    app.wmState.x = newLeft / cWidth;
                    app.wmState.y = newTop / cHeight;
                },
                resetWm: () => {
                    if (!app.wmState) app.wmState = {};
                    app.wmState.rotate = 0;
                    app.wmState.scale = 1.0;
                    const savedBarScale = (typeof localStorage !== 'undefined' && localStorage.getItem('vnbus_wm_bar_scale') !== null) ? (parseInt(localStorage.getItem('vnbus_wm_bar_scale'), 10) / 100) : 1.0;
                    if (app.wmState.barScale === undefined) {
                        app.wmState.barScale = savedBarScale;
                    }
                    app.wmState.color = 'white';
                    app.wmState.x = 0.5;
                    app.wmState.y = 0.5;
                    
                    const rotSlider = document.getElementById('wm-rotate-slider');
                    if (rotSlider) rotSlider.value = 0;
                    const rotVal = document.getElementById('wm-rotate-val');
                    if (rotVal) rotVal.innerText = '0°';
                    
                    const slider = document.getElementById('wm-scale-slider');
                    if (slider) slider.value = 100;
                    const valEl = document.getElementById('wm-scale-val');
                    if (valEl) valEl.innerText = '100%';
                    
                    const barSlider = document.getElementById('wm-bar-scale-slider');
                    const bsPercent = Math.round((app.wmState.barScale !== undefined ? app.wmState.barScale : 1.0) * 100);
                    if (barSlider) barSlider.value = bsPercent;
                    const barValEl = document.getElementById('wm-bar-scale-val');
                    if (barValEl) barValEl.innerText = bsPercent + '%';
                    
                    const chk = document.getElementById('chk-wm-black');
                    if (chk) chk.checked = false;
                    
                    try {
                        localStorage.removeItem('vnbus_wm_rotate');
                        localStorage.removeItem('vnbus_wm_scale');
                    } catch(e){}
                    
                    const savedMode = (typeof localStorage !== 'undefined' && localStorage.getItem('vnbus_wm_mode')) || (app.wmState && app.wmState.mode) || 'basic';
                    app.upload.setWmMode(savedMode, false);
                    app.upload.toggleColor(false);
                    
                    if (app.previewUpdateSize) app.previewUpdateSize();
                    
                    const el = document.getElementById('draggable-watermark');
                    if (el) {
                        el.style.left = '50%';
                        el.style.top = '50%';
                        el.style.transform = `translate(-50%, -50%) rotate(0deg) scale(1.0)`;
                    }
                },
                previewBlob: async (btn) => {
                    if (!app.rawFile || !app.user) {
                        return app.ui.showAlert("Bạn chưa chọn ảnh hoặc chưa đăng nhập!");
                    }
                    const originalText = btn ? btn.innerHTML : '<i class="fa-solid fa-image"></i> Xem trước bản xuất ra';
                    if (btn) {
                        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang render...';
                        btn.disabled = true;
                    }
                    try {
                        let username = document.getElementById('username')?.value?.trim();
                        if (!username && app.user && app.user.id) {
                            try {
                                const { data } = await window.sb.from('profiles').select('username').eq('id', app.user.id).single();
                                if (data) username = data.username;
                            } catch (e) {}
                        }
                        if (!username) username = app.username || "Guest";
                        // Preview đúng hệ pipeline với nút upload: watermark trực tiếp Canvas
                        // Nấc 1: Làm nét chuẩn 100% (sharpenAmount: 0.20)
                        let wmCanvas = await app.utils.watermark(app.rawFile, username, app.wmState, app.upload.currentFilters || 'none', { embedBlind: true, returnCanvas: true, skipSharpen: false, sharpenAmount: 0.20 });
                        let previewBlob = null;
                        try {
                            previewBlob = await app.utils.compressToSizeLoop(wmCanvas, app.utils.getTargetMimeType(), 500);
                        } catch (e) {
                            // Nấc 2: Nếu vượt 500KB khi làm nét 100%, thử lại với làm nét nhẹ 50% (sharpenAmount: 0.10)
                            console.warn("Ảnh vượt 500KB khi làm nét 100% ở 1080p, thử lại nấc 2: làm nét nhẹ 50%...", e);
                            try {
                                wmCanvas = await app.utils.watermark(app.rawFile, username, app.wmState, app.upload.currentFilters || 'none', { embedBlind: true, returnCanvas: true, sharpenAmount: 0.10 });
                                previewBlob = await app.utils.compressToSizeLoop(wmCanvas, app.utils.getTargetMimeType(), 500);
                            } catch (e2) {
                                // Nấc 3 (Last Resort): Nếu vẫn vượt 500KB khi làm nét nhẹ 50%, cắt bỏ làm nét hoàn toàn
                                console.warn("Ảnh vẫn vượt 500KB khi làm nét nhẹ 50%, kích hoạt Last Resort: bỏ qua làm nét...", e2);
                                wmCanvas = await app.utils.watermark(app.rawFile, username, app.wmState, app.upload.currentFilters || 'none', { embedBlind: true, returnCanvas: true, skipSharpen: true });
                                previewBlob = await app.utils.compressToSizeLoop(wmCanvas, app.utils.getTargetMimeType(), 500);
                            }
                        }
                        const url = URL.createObjectURL(previewBlob);
                        app.ui.showAlert(`<img src="${url}" class="w-full rounded-lg shadow-sm" style="max-height: 70vh; object-fit: contain;">`, null, null, { title: "Xem trước ảnh xuất ra", btnOkText: "Đóng" });
                    } catch (err) {
                        console.error("Lỗi khi xem trước ảnh:", err);
                        if (err && err.message && err.message.includes("BLIND_WM_ERROR:")) {
                            app.ui.showAlert(err.message.replace("BLIND_WM_ERROR:", ""));
                        } else {
                            app.ui.showAlert("Lỗi khi kết xuất ảnh xem trước: " + err.message);
                        }
                    } finally {
                        if (btn) {
                            btn.innerHTML = originalText;
                            btn.disabled = false;
                        }
                    }
                },
                currentFilters: 'none',
                closeAllUploadPanels: () => {
                    ['color-adjust-panel', 'histogram-panel', 'blur-adjust-panel', 'wm-adjust-panel'].forEach(id => {
                        const el = document.getElementById(id);
                        if (el) el.classList.add('hidden');
                    });
                    ['btn-adjust-color', 'btn-histogram', 'btn-add-blur', 'btn-adjust-wm'].forEach(id => {
                        const el = document.getElementById(id);
                        if (el) {
                            el.classList.remove('bg-black', 'text-white', 'border-black');
                            el.classList.add('bg-white', 'text-gray-700', 'border-gray-300', 'hover:bg-gray-100', 'hover:text-black');
                        }
                    });
                },
                toggleColorPanel: () => {
                    const panel = document.getElementById('color-adjust-panel');
                    const btn = document.getElementById('btn-adjust-color');
                    const isHidden = panel ? panel.classList.contains('hidden') : true;
                    if (app.upload.closeAllUploadPanels) app.upload.closeAllUploadPanels();
                    if (isHidden && panel) {
                        panel.classList.remove('hidden');
                        if (btn) {
                            btn.classList.remove('bg-white', 'text-gray-700', 'border-gray-300', 'hover:bg-gray-100', 'hover:text-black');
                            btn.classList.add('bg-black', 'text-white', 'border-black');
                        }
                    }
                },
                histogramMode: 'luma',
                histogramData: null,
                histDebounce: null,
                toggleHistogramPanel: () => {
                    const panel = document.getElementById('histogram-panel');
                    const btn = document.getElementById('btn-histogram');
                    const isHidden = panel ? panel.classList.contains('hidden') : true;
                    if (app.upload.closeAllUploadPanels) app.upload.closeAllUploadPanels();
                    if (isHidden && panel) {
                        panel.classList.remove('hidden');
                        if (btn) {
                            btn.classList.remove('bg-white', 'text-gray-700', 'border-gray-300', 'hover:bg-gray-100', 'hover:text-black');
                            btn.classList.add('bg-black', 'text-white', 'border-black');
                        }
                        app.upload.renderHistogram();
                    }
                },
                switchHistogramMode: (mode) => {
                    app.upload.histogramMode = mode;
                    if (app.upload.histogramData) {
                        app.upload.drawHistogram(app.upload.histogramData, mode);
                    } else {
                        app.upload.renderHistogram();
                    }
                },
                renderHistogram: () => {
                    const previewImg = document.getElementById('preview-img');
                    if (!previewImg || !previewImg.src) return;
                    const loadingEl = document.getElementById('up-hist-loading');
                    if (loadingEl) loadingEl.classList.remove('hidden');

                    const doCompute = () => {
                        try {
                            const data = app.utils.computeHistogramData(previewImg, app.upload.currentFilters || 'none');
                            app.upload.histogramData = data;
                            app.upload.drawHistogram(data, app.upload.histogramMode || 'luma');
                        } catch (err) {
                            console.error('Lỗi tính toán Histogram:', err);
                            if (loadingEl) {
                                loadingEl.innerHTML = '<span class="text-red-400 text-xs">Không thể phân tích ảnh</span>';
                            }
                        }
                    };

                    if (!previewImg.complete || previewImg.naturalWidth === 0) {
                        previewImg.onload = () => {
                            doCompute();
                        };
                        return;
                    }
                    setTimeout(doCompute, 20);
                },
                drawHistogram: (data, mode = null) => {
                    const canvas = document.getElementById('up-hist-canvas');
                    if (!canvas || !data) return;

                    const activeMode = mode || app.upload.histogramMode || 'luma';
                    app.upload.histogramMode = activeMode;

                    const btnLuma = document.getElementById('up-hist-btn-luma');
                    const btnRgb = document.getElementById('up-hist-btn-rgb');
                    if (btnLuma && btnRgb) {
                        if (activeMode === 'luma') {
                            btnLuma.className = "text-[10px] font-bold px-2.5 py-1 rounded border border-black dark:border-white bg-black text-white dark:bg-white dark:text-black transition";
                            btnRgb.className = "text-[10px] font-bold px-2.5 py-1 rounded border border-black dark:border-white bg-white text-black dark:bg-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition";
                        } else {
                            btnRgb.className = "text-[10px] font-bold px-2.5 py-1 rounded border border-black dark:border-white bg-black text-white dark:bg-white dark:text-black transition";
                            btnLuma.className = "text-[10px] font-bold px-2.5 py-1 rounded border border-black dark:border-white bg-white text-black dark:bg-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition";
                        }
                    }

                    app.utils.drawHistogramCanvas(canvas, data, activeMode);

                    const loadingEl = document.getElementById('up-hist-loading');
                    if (loadingEl) loadingEl.classList.add('hidden');

                    const avgEl = document.getElementById('up-hist-avg');
                    const shadowEl = document.getElementById('up-hist-shadow');
                    const highEl = document.getElementById('up-hist-high');

                    const avgPct = Math.round((data.avgLuma / 255) * 100);
                    if (avgEl) avgEl.innerText = `${avgPct}%`;
                    if (shadowEl) {
                        shadowEl.innerText = `${data.shadowPercent.toFixed(1)}%`;
                        if (data.shadowPercent > 10) shadowEl.className = "text-xs font-bold text-red-600 font-mono";
                        else shadowEl.className = "text-xs font-bold text-black dark:text-white font-mono";
                    }
                    if (highEl) {
                        highEl.innerText = `${data.highlightPercent.toFixed(1)}%`;
                        if (data.highlightPercent > 10) highEl.className = "text-xs font-bold text-red-600 font-mono";
                        else highEl.className = "text-xs font-bold text-black dark:text-white font-mono";
                    }
                },
                currentDenoise: 0,
                basePreviewUrl: null,
                basePreviewImage: null,
                previewDenoiseUrl: null,
                denoiseTimeout: null,
                previewCanvas: null,
                updateFilters: () => {
                    const b = Number(document.getElementById('adj-brightness')?.value || 100);
                    const c = Number(document.getElementById('adj-contrast')?.value || 100);
                    const s = Number(document.getElementById('adj-saturation')?.value || 100);
                    const d = Number(document.getElementById('adj-denoise')?.value || 0);
                    const vb = document.getElementById('val-brightness');
                    const vc = document.getElementById('val-contrast');
                    const vs = document.getElementById('val-saturation');
                    const vd = document.getElementById('val-denoise');
                    if(vb) vb.innerText = b + '%';
                    if(vc) vc.innerText = c + '%';
                    if(vs) vs.innerText = s + '%';
                    if(vd) vd.innerText = d + '%';
                    const isDefault = (b === 100 && c === 100 && s === 100);
                    const filterString = isDefault ? 'none' : `brightness(${b}%) contrast(${c}%) saturate(${s}%)`;
                    const previewImg = document.getElementById('preview-img');
                    if(previewImg) previewImg.style.filter = filterString;
                    app.upload.currentFilters = filterString;
                    app.upload.currentDenoise = d;

                    if (app.upload.histDebounce) clearTimeout(app.upload.histDebounce);
                    const histPanel = document.getElementById('histogram-panel');
                    if (histPanel && !histPanel.classList.contains('hidden')) {
                        app.upload.histDebounce = setTimeout(() => {
                            app.upload.renderHistogram();
                        }, 60);
                    }

                    if (app.upload.denoiseTimeout) clearTimeout(app.upload.denoiseTimeout);
                    app.upload.denoiseTimeout = setTimeout(() => {
                        app.upload.applyDenoisePreview();
                    }, 50);
                },
                applyDenoisePreview: () => {
                    const previewImg = document.getElementById('preview-img');
                    if (!previewImg || !app.upload.basePreviewUrl) return;
                    const d = app.upload.currentDenoise || 0;
                    if (d <= 0) {
                        if (app.upload.previewDenoiseUrl) {
                            URL.revokeObjectURL(app.upload.previewDenoiseUrl);
                            app.upload.previewDenoiseUrl = null;
                        }
                        if (app.upload.basePreviewUrl && previewImg.src !== app.upload.basePreviewUrl) {
                            previewImg.src = app.upload.basePreviewUrl;
                        }
                        return;
                    }
                    const baseImg = (app.upload.basePreviewImage && app.upload.basePreviewImage.naturalWidth) ? app.upload.basePreviewImage : previewImg;
                    const nw = baseImg.naturalWidth;
                    const nh = baseImg.naturalHeight;
                    if (!nw || !nh) return;

                    if (!app.upload.previewCanvas) {
                        app.upload.previewCanvas = document.createElement('canvas');
                    }
                    const cv = app.upload.previewCanvas;
                    const maxDim = 1600;
                    let pw = nw, ph = nh;
                    if (pw > maxDim || ph > maxDim) {
                        if (pw > ph) {
                            ph = Math.round((ph * maxDim) / pw);
                            pw = maxDim;
                        } else {
                            pw = Math.round((pw * maxDim) / ph);
                            ph = maxDim;
                        }
                    }
                    cv.width = pw;
                    cv.height = ph;
                    const ctx = cv.getContext('2d');
                    ctx.drawImage(baseImg, 0, 0, pw, ph);

                    if (app.denoise && app.denoise.processCanvas) {
                        app.denoise.processCanvas(cv, d);
                    }

                    cv.toBlob((blob) => {
                        if (!blob) return;
                        if (app.upload.previewDenoiseUrl) {
                            URL.revokeObjectURL(app.upload.previewDenoiseUrl);
                        }
                        app.upload.previewDenoiseUrl = URL.createObjectURL(blob);
                        previewImg.src = app.upload.previewDenoiseUrl;
                    }, 'image/jpeg', 0.92);
                },
                resetFilters: () => {
                    const b = document.getElementById('adj-brightness');
                    const c = document.getElementById('adj-contrast');
                    const s = document.getElementById('adj-saturation');
                    const d = document.getElementById('adj-denoise');
                    if(b) b.value = 100;
                    if(c) c.value = 100;
                    if(s) s.value = 100;
                    if(d) d.value = 0;
                    app.upload.updateFilters();
                },
                stepFilter: (type, delta) => {
                    const input = document.getElementById(`adj-${type}`);
                    if (!input) return;
                    const min = input.min !== '' ? Number(input.min) : 0;
                    const max = input.max !== '' ? Number(input.max) : 100;
                    const current = Number(input.value) || 0;
                    let next = current + delta;
                    if (next < min) next = min;
                    if (next > max) next = max;
                    input.value = next;
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
                    if (app.upload.previewDenoiseUrl) {
                        URL.revokeObjectURL(app.upload.previewDenoiseUrl);
                        app.upload.previewDenoiseUrl = null;
                    }
                    if (app.upload.basePreviewUrl) {
                        URL.revokeObjectURL(app.upload.basePreviewUrl);
                        app.upload.basePreviewUrl = null;
                    }
                    app.upload.basePreviewImage = null;
                    app.upload.currentDenoise = 0;
                    if (app.upload.denoiseTimeout) {
                        clearTimeout(app.upload.denoiseTimeout);
                        app.upload.denoiseTimeout = null;
                    }
                    if (app.webrtc && app.webrtc.resetMobile) app.webrtc.resetMobile();
                    app.rawFile = null;
                    app.crop.sourceImage = null;
                    app.crop.originalFile = null;
                    app.crop.savedCropData = null;
                    app.crop.savedRatio = 4/3;
                    app.crop.savedState = null;
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
                    if (app.upload.closeAllUploadPanels) app.upload.closeAllUploadPanels();
                    app.upload.histogramData = null;
                },
                handleFileSelect: async (e) => {
                    const fileInput = document.getElementById('up-file');
                    if (fileInput && fileInput.disabled) return;
                    const file = e.target.files[0];
                    if (!file) return;
                    app.upload._faceAutoRun = false;
                    app.crop.sourceImage = null;
                    app.crop.originalFile = null;
                    app.crop.savedCropData = null;
                    app.crop.savedRatio = 4/3;
                    app.crop.savedState = null;
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
                                        DateTimeDigitized: EXIF.getTag(this, "DateTimeDigitized"),
                                        DateTime: EXIF.getTag(this, "DateTime"),
                                        ApertureValue: EXIF.getTag(this, "ApertureValue"),
                                        ShutterSpeedValue: EXIF.getTag(this, "ShutterSpeedValue"),
                                        FocalLength: EXIF.getTag(this, "FocalLength"),
                                        FocalLengthIn35mmFilm: EXIF.getTag(this, "FocalLengthIn35mmFilm"),
                                        PixelXDimension: EXIF.getTag(this, "PixelXDimension"),
                                        PixelYDimension: EXIF.getTag(this, "PixelYDimension"),
                                        ExifImageWidth: EXIF.getTag(this, "ExifImageWidth"),
                                        ExifImageHeight: EXIF.getTag(this, "ExifImageHeight"),
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
                            let actualWidth = 0, actualHeight = 0;
                            try {
                                const url = URL.createObjectURL(file);
                                const img = new Image();
                                await new Promise((resolveImg) => {
                                    img.onload = () => { actualWidth = img.naturalWidth; actualHeight = img.naturalHeight; URL.revokeObjectURL(url); resolveImg(); };
                                    img.onerror = () => { URL.revokeObjectURL(url); resolveImg(); };
                                    img.src = url;
                                });
                            } catch (e) {}
                            const dtOriginal = tags.DateTimeOriginal || tags.CreateDate;
                            const dtDigitized = tags.DateTimeDigitized;
                            const dtModify = tags.DateTime || tags.ModifyDate;
                            const parseDate = (d) => {
                                if (!d) return 0;
                                if (d instanceof Date && !isNaN(d)) return d.getTime();
                                if (typeof d === 'string') {
                                    const parts = d.split(/[: T-]/);
                                    if (parts.length >= 6) return new Date(parts[0], parts[1]-1, parts[2], parts[3], parts[4], parts[5]).getTime();
                                }
                                return 0;
                            };
                            const tsOriginal = parseDate(dtOriginal);
                            const tsDigitized = parseDate(dtDigitized);
                            const tsModify = parseDate(dtModify);
                            const helpLinkHTML = `<br><br><a href="javascript:void(0)" onclick="app.ui.closeAlert(true); setTimeout(() => app.utils.navigate('/help/1516371307481272330'), 300)" class="text-black font-bold hover:text-gray-700 hover:underline transition-colors inline-flex items-center gap-1.5"><i class="fa-solid fa-circle-info"></i> Tìm hiểu thêm & hướng dẫn khắc phục</a>`;
                            const errExifInvalid = "EXIF ảnh không hợp lệ. Bạn vui lòng chọn file ảnh gốc nhé!" + helpLinkHTML;
                            

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
                                } else if (exposureTime && iso && dateTimeOriginal) {
                                    model = "Camera (Đã ẩn Model)";
                                }
                            }
                            const validateAndResolve = (fraudFlag) => {
                                if (!model) { reject("EXIF ảnh thiếu thông tin máy ảnh (Camera Model). Bạn vui lòng chọn file ảnh gốc nhé!" + helpLinkHTML); return; }
                                if (!dateTimeOriginal) { reject("EXIF ảnh thiếu thông tin ngày giờ chụp. Bạn vui lòng chọn file ảnh gốc nhé!" + helpLinkHTML); return; }
                                if (!exposureTime || !iso) { reject("EXIF ảnh thiếu thông số phơi sáng/ISO. Bạn vui lòng chọn file ảnh gốc nhé!" + helpLinkHTML); return; }
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
                                    params: fNumber ? `f/${fNumber} | ${shutter}s | ISO ${iso}` : `${shutter}s | ISO ${iso}`,
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
                                if(app.upload.checkLocationPinStatus) app.upload.checkLocationPinStatus(address);
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
                            const fullResBlob = await new Promise(res => canvas.toBlob(res, 'image/png'));
                            return new File([fullResBlob], rawFile.name.replace(/\.[^/.]+$/, "") + ".png", { type: "image/png" });
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
                            const progToast = app.toast.createProgress('Đang giải mã ảnh RAW độ phân giải gốc...');
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
                            // Giữ nguyên file gốc (format + bytes) tới bước encode cuối cùng.
                            // Không re-encode SDR ở đây: mỗi lần decode→canvas→encode là một
                            // generation loss; việc dịch HDR→SDR đã được canvas tự xử lý khi
                            // drawImage ở bước watermark/crop.
                            let normalizedFile = fileToLoad;
                            if (!app.crop.sourceImage) {
                                app.crop.sourceImage = normalizedFile;
                            }
                            const hasDraftCrop = app.upload._draftPending && app.upload._draftPending.crop && app.upload._draftPending.crop.savedState;
                            if ((!is4by3 && !is3by2 && !is16by9) || hasDraftCrop) {
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
                                let convertedBlob = fileToCompress;
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
                                    const hasDraftCrop = app.upload._draftPending && app.upload._draftPending.crop && app.upload._draftPending.crop.savedState;
                                    if ((!is4by3 && !is3by2 && !is16by9) || hasDraftCrop) {
                                        app.crop.open('main', convertedFile, true);
                                    } else {
                                        app.upload.setupPreview(convertedFile);
                                    }
                                    URL.revokeObjectURL(newUrl);
                                    URL.revokeObjectURL(url);
                                };
                                newImg.onerror = () => {
                                    app.ui.showAlert("Định dạng ảnh không được hỗ trợ hoặc file bị hỏng.");
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
                    if (app.upload.previewDenoiseUrl) {
                        URL.revokeObjectURL(app.upload.previewDenoiseUrl);
                        app.upload.previewDenoiseUrl = null;
                    }
                    if (app.upload.basePreviewUrl) {
                        URL.revokeObjectURL(app.upload.basePreviewUrl);
                    }
                    const url = URL.createObjectURL(file);
                    app.upload.basePreviewUrl = url;
                    app.upload.basePreviewImage = new Image();
                    app.upload.basePreviewImage.src = url;
                    document.getElementById('preview-box').classList.remove('hidden');
                    document.getElementById('drop-zone').classList.add('hidden');
                    if (app.upload.restoreDropZone) app.upload.restoreDropZone();
                    const previewImg = document.getElementById('preview-img');
                    if (!previewImg) return;

                    previewImg.onload = () => {
                        const updateSize = () => {
                            const nw = previewImg.naturalWidth, nh = previewImg.naturalHeight;
                            if (!nw || !nh) return;
                            const container = document.getElementById('preview-container');
                            const box = document.getElementById('preview-box');
                            container.style.width = '100%';
                            container.style.height = 'auto';
                            let availableWidth = box ? box.clientWidth : 0;
                            if (!availableWidth && box && box.parentElement) {
                                availableWidth = box.parentElement.clientWidth;
                            }
                            if (!availableWidth) {
                                availableWidth = Math.min(window.innerWidth - 32, 600);
                            }
                            const availableHeight = window.innerHeight * 0.65;
                            const ratio = nw / nh;
                            let finalW = availableWidth;
                            let finalH = finalW / ratio;
                            if (finalH > availableHeight) {
                                finalH = availableHeight;
                                finalW = finalH * ratio;
                            }
                            finalW = Math.round(finalW);
                            finalH = Math.round(finalH);
                            container.style.width = finalW + 'px';
                            container.style.height = finalH + 'px';

                            const barScale = (app.wmState && app.wmState.barScale !== undefined) ? app.wmState.barScale : 1.0;
                            const barHeight = finalH * 0.0576 * barScale;
                            const fontSize = barHeight * 0.4;
                            const padX = barHeight / 2;

                            const footerBar = document.getElementById('preview-footer-bar');
                            if (footerBar) {
                                footerBar.style.height = barHeight + 'px';
                                let footerCanvas = document.getElementById('preview-footer-canvas');
                                if (!footerCanvas) {
                                    footerCanvas = document.createElement('canvas');
                                    footerCanvas.id = 'preview-footer-canvas';
                                    footerCanvas.className = 'w-full h-full block pointer-events-none';
                                    footerBar.innerHTML = '';
                                    footerBar.appendChild(footerCanvas);
                                }
                                const dpr = Math.max(1, window.devicePixelRatio || 1);
                                footerCanvas.width = Math.round(finalW * dpr);
                                footerCanvas.height = Math.round(barHeight * dpr);
                                footerCanvas.style.width = finalW + 'px';
                                footerCanvas.style.height = barHeight + 'px';

                                const fCtx = footerCanvas.getContext('2d');
                                fCtx.clearRect(0, 0, footerCanvas.width, footerCanvas.height);
                                fCtx.save();
                                fCtx.scale(dpr, dpr);

                                fCtx.fillStyle = "white";
                                fCtx.textBaseline = 'alphabetic';

                                const fontFace = 'Montserrat, sans-serif';
                                const textY = (barHeight / 2) + (fontSize * 0.35);

                                // Chữ bên trái: VNBUSARCHIVE.io.vn
                                fCtx.textAlign = 'left';
                                fCtx.font = `italic 900 ${fontSize}px ${fontFace}`;
                                fCtx.fillText("VNBUSARCHIVE", padX, textY);
                                const vnbusWidth = fCtx.measureText("VNBUSARCHIVE").width;
                                fCtx.font = `italic 700 ${fontSize * 0.8}px ${fontFace}`;
                                fCtx.fillText(".io.vn", padX + vnbusWidth, textY);

                                // Chữ bên phải: Bản quyền bởi [name] (dùng chung textY để thẳng tắp một hàng ngang)
                                fCtx.textAlign = 'right';
                                fCtx.font = `700 ${fontSize}px ${fontFace}`;
                                const name = app.username || "Guest";
                                fCtx.fillText(`Bản quyền bởi ${name}`, finalW - padX, textY);

                                fCtx.restore();
                            }

                            const wmDrag = document.getElementById('draggable-watermark');
                            if (wmDrag) {
                                let wmCanvas = document.getElementById('preview-wm-canvas');
                                if (!wmCanvas) {
                                    wmCanvas = document.createElement('canvas');
                                    wmCanvas.id = 'preview-wm-canvas';
                                    wmDrag.innerHTML = '';
                                    wmDrag.appendChild(wmCanvas);
                                    wmDrag.style.padding = '0';
                                    wmDrag.style.border = 'none';
                                }
                                const text = `© ${app.username || 'Guest'}`;
                                const fontFace = 'Montserrat, sans-serif';
                                const watermarkFontSize = finalH * 0.096;
                                const font = `700 ${watermarkFontSize}px ${fontFace}`;
                                const ctx = wmCanvas.getContext('2d');
                                ctx.font = font;
                                const metrics = ctx.measureText(text);
                                const rawW = Math.ceil(metrics.width + 4);
                                const rawH = Math.ceil(watermarkFontSize * 1.5);
                                const dpr = Math.max(1, window.devicePixelRatio || 1);
                                wmCanvas.width = Math.round(rawW * dpr);
                                wmCanvas.height = Math.round(rawH * dpr);
                                wmCanvas.style.width = rawW + 'px';
                                wmCanvas.style.height = rawH + 'px';
                                ctx.save();
                                ctx.scale(dpr, dpr);
                                ctx.font = font;
                                ctx.textAlign = 'center';
                                ctx.textBaseline = 'middle';
                                ctx.fillStyle = wmDrag.classList.contains('wm-black') ? 'black' : 'white';
                                ctx.clearRect(0, 0, rawW, rawH);
                                ctx.fillText(text, rawW / 2, rawH / 2);
                                ctx.restore();

                                const currentScale = app.wmState ? (app.wmState.scale !== undefined ? app.wmState.scale : 1.0) : 1.0;
                                const currentRotate = app.wmState ? (app.wmState.rotate !== undefined ? app.wmState.rotate : 0) : 0;
                                wmDrag.style.transform = `translate(-50%, -50%) rotate(${currentRotate}deg) scale(${currentScale})`;
                                if (app.wmState) {
                                    wmDrag.style.left = (app.wmState.x * finalW) + 'px';
                                    wmDrag.style.top = (app.wmState.y * finalH) + 'px';
                                }
                                if (app.upload.clampWmPosition) app.upload.clampWmPosition();
                            }
                        };
                        updateSize();
                        app.previewUpdateSize = updateSize;
                        if (typeof document !== 'undefined' && document.fonts && document.fonts.load) {
                            Promise.all([
                                document.fonts.load(`italic 900 16px Montserrat`),
                                document.fonts.load(`italic 700 16px Montserrat`),
                                document.fonts.load(`700 16px Montserrat`),
                                document.fonts.load(`700 32px Montserrat`)
                            ]).then(() => {
                                if (app.previewUpdateSize) app.previewUpdateSize();
                            }).catch(() => {});
                        }
                        
                        if (app.upload._draftPending) {
                            const pending = app.upload._draftPending;
                            if (pending.wmState) {
                                app.wmState = pending.wmState;
                                const wmDrag = document.getElementById('draggable-watermark');
                                const container = document.getElementById('preview-container');
                                if (wmDrag && container) {
                                    const cw = container.clientWidth;
                                    const ch = container.clientHeight;
                                    wmDrag.style.left = (app.wmState.x * cw) + 'px';
                                    wmDrag.style.top = (app.wmState.y * ch) + 'px';
                                    const rot = (app.wmState.rotate !== undefined) ? app.wmState.rotate : 0;
                                    const sc = (app.wmState.scale !== undefined) ? app.wmState.scale : 1.0;
                                    wmDrag.style.transform = `translate(-50%, -50%) rotate(${rot}deg) scale(${sc})`;
                                }
                            }
                            if (pending.blurs && pending.blurs.length > 0) {
                                app.upload._pendingBlurRestore = pending.blurs;
                                app.upload.restoreBlurAfterRecrop();
                            }
                            if (pending.crop) {
                                app.crop.savedState = pending.crop.savedState || null;
                                app.crop.savedRatio = pending.crop.savedRatio || null;
                                app.crop.customRatio = pending.crop.customRatio || null;
                                app.crop.savedCropData = pending.crop.savedCropData || null;
                            }
                            if (pending.filters && pending.filters !== 'none') {
                                app.upload.currentFilters = pending.filters;
                            }
                            app.upload._draftPending = null;
                        }

                        if (app.upload.updateBlurBtn) app.upload.updateBlurBtn();
                        const histPanel = document.getElementById('histogram-panel');
                        if (histPanel && !histPanel.classList.contains('hidden')) {
                            app.upload.renderHistogram();
                        }
                    };
                    previewImg.src = url;
                    if (previewImg.complete && previewImg.naturalWidth) {
                        previewImg.onload();
                    }
                    const name = app.username || "Guest";
                    const wmName = document.getElementById('wm-username');
                    if (wmName) wmName.innerText = name;
                    const wmDrag = document.getElementById('draggable-watermark');
                    if (wmDrag) {
                        if (app.wmState && app.wmState.mode === 'standard') {
                            wmDrag.classList.add('hidden');
                        } else {
                            wmDrag.classList.remove('hidden');
                        }
                        wmDrag.classList.remove('wm-active');
                    }
                    if (!app.upload._draftPending && app.upload.resetWm) app.upload.resetWm();
                    if (app.upload.resetFilters) app.upload.resetFilters();
                    if (app.upload.initDraggable) app.upload.initDraggable();
                },
                initDraggable: () => {
                    const el = document.getElementById('draggable-watermark');
                    const container = document.getElementById('preview-container');
                    if (!el || !container) return;
                    if (app.draggableInitialized) return;
                    app.draggableInitialized = true;
                    let isDragging = false;
                    let startX, startY, initialLeft, initialTop;
                    const previewBox = document.getElementById('preview-box');
                    if (previewBox && typeof ResizeObserver !== 'undefined') {
                        const resizeObserver = new ResizeObserver(() => {
                            if (app.previewUpdateSize) app.previewUpdateSize();
                        });
                        resizeObserver.observe(previewBox);
                    }
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
                        const cRect = container.getBoundingClientRect();
                        initialLeft = app.wmState.x * cRect.width;
                        initialTop = app.wmState.y * cRect.height;
                    });
                    el.addEventListener('touchstart', (e) => {
                        e.stopPropagation();
                        el.classList.add('wm-active');
                        isDragging = true;
                        startX = e.touches[0].clientX;
                        startY = e.touches[0].clientY;
                        const cRect = container.getBoundingClientRect();
                        initialLeft = app.wmState.x * cRect.width;
                        initialTop = app.wmState.y * cRect.height;
                    });
                    const onMove = (clientX, clientY) => {
                        if (!isDragging) return;
                        const dx = clientX - startX;
                        const dy = clientY - startY;
                        let newLeft = initialLeft + dx;
                        let newTop = initialTop + dy;
                        const scale = (app.wmState && app.wmState.scale !== undefined) ? app.wmState.scale : 1.0;
                        const rotate = (app.wmState && app.wmState.rotate !== undefined) ? app.wmState.rotate : 0;
                        const barScale = (app.wmState && app.wmState.barScale !== undefined) ? app.wmState.barScale : 1.0;

                        const wmCanvas = document.getElementById('preview-wm-canvas');
                        const rawW = wmCanvas ? (parseFloat(wmCanvas.style.width) || wmCanvas.width) : (el.offsetWidth || 100);
                        const rawH = wmCanvas ? (parseFloat(wmCanvas.style.height) || wmCanvas.height) : (el.offsetHeight || 30);

                        const rad = Math.abs(rotate * Math.PI / 180);
                        const cos = Math.abs(Math.cos(rad));
                        const sin = Math.abs(Math.sin(rad));

                        const wHalf = (scale * (rawW * cos + rawH * sin)) / 2;
                        const hHalf = (scale * (rawW * sin + rawH * cos)) / 2;

                        const cRect = container.getBoundingClientRect();
                        const footerBarH = cRect.height * 0.0576 * barScale;

                        let minLeft = wHalf;
                        let maxLeft = cRect.width - wHalf;
                        if (minLeft > maxLeft) {
                            minLeft = cRect.width / 2;
                            maxLeft = cRect.width / 2;
                        }

                        let minTop = hHalf;
                        let maxTop = cRect.height - footerBarH - hHalf;
                        if (minTop > maxTop) {
                            minTop = (cRect.height - footerBarH) / 2;
                            maxTop = (cRect.height - footerBarH) / 2;
                        }

                        newLeft = Math.max(minLeft, Math.min(newLeft, maxLeft));
                        newTop = Math.max(minTop, Math.min(newTop, maxTop));
                        el.style.left = newLeft + 'px';
                        el.style.top = newTop + 'px';
                        app.wmState.x = newLeft / cRect.width;
                        app.wmState.y = newTop / cRect.height;
                    };
                    document.addEventListener('mousemove', (e) => {
                        if (isDragging) { e.preventDefault(); onMove(e.clientX, e.clientY); }
                    });
                    document.addEventListener('touchmove', (e) => {
                        if (isDragging) { e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY); }
                    }, { passive: false });
                    const onEnd = () => { 
                        isDragging = false; 
                    };
                    document.addEventListener('mouseup', onEnd);
                    document.addEventListener('touchend', onEnd);
                },
                submit: async (e) => {
                    e.preventDefault();
                    if (!app.user) return app.auth.check();
                    if (app.username && app.utils.isValidUsername && !app.utils.isValidUsername(app.username)) {
                        return app.ui.showAlert("Tên hiển thị của bạn không hợp lệ. Vui lòng đổi tên ở mục Tài khoản trước khi đăng ảnh!", () => {
                            if (app.settings && app.settings.open) app.settings.open('profile');
                        });
                    }
                    if (!app.rawFile) return app.ui.showAlert("Vui lòng chọn ảnh!");
                    app.upload.checkModelWarning && app.upload.checkModelWarning();
                    if (app.upload.isBlockedByModelDuplicate) {
                        return app.ui.showAlert("Xe định danh phụ không được trùng dòng xe với xe khác cùng biển kiểm soát.", null, null, { title: "Từ chối tải lên" });
                    }
                    const q = app.upload.currentQuota;
                    if (q.limit !== null && q.count >= q.limit) {
                        return app.ui.showAlert(`Bạn đã đạt giới hạn tải lên tối đa ${q.limit} ảnh của ngày hôm nay. Vui lòng quay lại sau 7:00 sáng mai!`);
                    }
                    const valPlate = document.getElementById('up-plate').value.trim();
                    const valOp = document.getElementById('up-operator').value.trim();
                    const valType = document.getElementById('up-type').value;
                    const valRoute = document.getElementById('up-route').value.trim();
                    const valModel = document.getElementById('up-model').value.trim();
                    const valLoc = document.getElementById('up-location').value.trim();
                    const valDate = document.getElementById('up-date').value;
                    let missingFields = [];
                    if (!valType) missingFields.push("Loại xe (Xe Buýt/Khách)");
                    if (!valPlate) missingFields.push("Biển kiểm soát");
                    if (!valDate) missingFields.push("Ngày chụp");
                    if (!valRoute) missingFields.push("Mã số tuyến / Lộ trình");
                    if (!valOp) missingFields.push("Đơn vị vận hành");
                    if (!valModel) missingFields.push("Dòng xe (Model)");
                    if (!valLoc) missingFields.push("Vị trí chụp");
                    const isDocValueCheck = document.getElementById('up-is-documentary')?.checked || false;
                    const modNoteValueCheck = document.getElementById('up-mod-note')?.value.trim() || '';
                    if (isDocValueCheck && !modNoteValueCheck) {
                        missingFields.push("Ghi chú dành cho kiểm duyệt");
                    }
                    if (missingFields.length > 0) {
                        app.upload.triggerEmptyWarnings();
                        let msg = `Vui lòng điền đủ các trường bắt buộc: <b>${missingFields.join(', ')}</b>.`;
                        return app.ui.showAlert(msg, null, null, { title: "Thiếu thông tin" });
                    }
                    const btn = document.getElementById('btn-submit');
                    if (btn.disabled || btn.dataset.submitting === "true") return;
                    const originalText = btn.innerHTML;
                    btn.disabled = true;
                    btn.dataset.submitting = "true";
                    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...`;
                    // Chốt dữ liệu NGAY TRƯỚC khi xử lý nền: người dùng được phép rời trang upload khi đang tải
                    // (mỗi lần điều hướng handleRoute -> cleanupState đặt app.rawFile = null và reset form),
                    // nên toàn bộ pipeline bất đồng bộ phải dùng bản snapshot cục bộ này thay vì state toàn cục.
                    const rawFile = app.rawFile;
                    const username = app.username || "Guest";
                    const targetMime = app.utils.getTargetMimeType();
                    const currentFilters = app.upload.currentFilters || 'none';
                    const exifSnapshot = {
                        camera: app.currentExif?.camera || 'N/A',
                        params: app.currentExif?.params || 'N/A',
                        suspectedFraud: !!(app.currentExif && app.currentExif.suspectedFraud)
                    };
                    const provinceValue = document.getElementById('up-province')?.value || '';
                    const noteValue = document.getElementById('up-note')?.value || '';
                    const modNoteValue = document.getElementById('up-mod-note')?.value || '';
                    const isDocValue = document.getElementById('up-is-documentary')?.checked || false;
                    const bgWebpPromise = new Promise((resolve, reject) => {
                        setTimeout(async () => {
                            try {
                                // Nấc 1: Làm nét chuẩn 100% (sharpenAmount: 0.20)
                                let finalCanvas = await app.utils.watermark(rawFile, username, app.wmState, currentFilters, { embedBlind: true, returnCanvas: true, skipSharpen: false, sharpenAmount: 0.20 });
                                let blobToProcess = null;
                                try {
                                    blobToProcess = await app.utils.compressToSizeLoop(finalCanvas, targetMime, 500);
                                } catch (e) {
                                    // Nấc 2: Nếu vượt 500KB khi làm nét 100%, thử lại với làm nét nhẹ 50% (sharpenAmount: 0.10)
                                    console.warn("Ảnh vượt 500KB khi làm nét 100% ở 1080p, thử lại nấc 2: làm nét nhẹ 50%...", e);
                                    try {
                                        finalCanvas = await app.utils.watermark(rawFile, username, app.wmState, currentFilters, { embedBlind: true, returnCanvas: true, sharpenAmount: 0.10 });
                                        blobToProcess = await app.utils.compressToSizeLoop(finalCanvas, targetMime, 500);
                                    } catch (e2) {
                                        // Nấc 3 (Last Resort): Nếu vẫn vượt 500KB khi làm nét nhẹ 50%, kích hoạt Last Resort: bỏ qua làm nét hoàn toàn
                                        console.warn("Ảnh vẫn vượt 500KB khi làm nét nhẹ 50%, kích hoạt Last Resort: bỏ qua làm nét...", e2);
                                        try {
                                            finalCanvas = await app.utils.watermark(rawFile, username, app.wmState, currentFilters, { embedBlind: true, returnCanvas: true, skipSharpen: true });
                                            blobToProcess = await app.utils.compressToSizeLoop(finalCanvas, targetMime, 500);
                                        } catch (retryErr) {
                                            console.warn("compressToSizeLoop lỗi cả khi bỏ qua làm nét:", retryErr);
                                            reject(retryErr);
                                            return;
                                        }
                                    }
                                }
                                if (blobToProcess && blobToProcess instanceof Blob && !(blobToProcess instanceof File)) {
                                    resolve(new File([blobToProcess], rawFile.name.replace(/\.[^/.]+$/, "") + ".webp", { type: 'image/webp' }));
                                    return;
                                }
                                resolve(blobToProcess);
                            } catch (err) {
                                if (err && err.message && err.message.includes("BLIND_WM_ERROR:")) {
                                    reject(err);
                                    return;
                                }
                                console.warn("Lỗi tiến trình nền xử lý ảnh:", err);
                                reject(err);
                            }
                        }, 50);
                    });
                    
                    // --- MỚI: QUẢN LÝ TIẾN TRÌNH ẢO VÀ ĐẾM SỐ ẢNH ---
                    app.upload.activeUploadsCount = (app.upload.activeUploadsCount || 0) + 1;
                    const updateToastText = () => {
                        return app.upload.activeUploadsCount > 1 
                            ? `Đang tải ${app.upload.activeUploadsCount} ảnh lên máy chủ...` 
                            : 'Đang tải ảnh lên máy chủ...';
                    };

                    if (!app.upload.activeProgressToast) {
                        app.upload.activeProgressToast = app.toast.createProgress(updateToastText());
                        app.upload.fakeProgress = 0;
                        if (app.upload.fakeProgressInterval) clearInterval(app.upload.fakeProgressInterval);
                        app.upload.fakeProgressInterval = setInterval(() => {
                            if (app.upload.fakeProgress < 85) app.upload.fakeProgress += (Math.random() * 4 + 1);
                            else if (app.upload.fakeProgress < 96) app.upload.fakeProgress += 0.2;
                            
                            if (app.upload.activeProgressToast) {
                                app.upload.activeProgressToast.update(app.upload.fakeProgress, updateToastText(), 'Bạn có thể chuyển sang trang khác, tải lên vẫn tiếp diễn');
                            }
                        }, 200);
                    } else {
                        app.upload.activeProgressToast.update(app.upload.fakeProgress, updateToastText(), 'Bạn có thể chuyển sang trang khác, tải lên vẫn tiếp diễn');
                    }
                    // ---------------------------------------------

                    try {
                        let originalSizeKB = (rawFile.size / 1024).toFixed(2);
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
                        if (compressedFile && compressedFile instanceof Blob && !(compressedFile instanceof File)) {
                            compressedFile = new File([compressedFile], rawFile.name.replace(/\.[^/.]+$/, "") + ".webp", { type: compressedFile.type });
                        }
                        if (!compressedFile) {
                            throw new Error("Không thể xử lý và nén ảnh. Vui lòng thử lại!");
                        }
                        let compressedSizeKB = (compressedFile.size / 1024).toFixed(2);
                        if (compressedFile.type !== targetMime && compressedFile.type !== 'image/webp') {
                            throw new Error(`Trình duyệt của bạn không hỗ trợ định dạng WebP.`);
                        }
                        const uploadData = new FormData();
                        uploadData.append('file', compressedFile);
                        uploadData.append('userId', app.user.id);
                        uploadData.append('fileExtension', app.utils.getTargetExtension());
                        uploadData.append('meta_plate', valPlate.replace(/[^A-Z0-9-]/gi, '').toUpperCase());
                        uploadData.append('meta_operator', app.utils.fixUnicode(valOp));
                        uploadData.append('meta_type', valType);
                        uploadData.append('meta_route', app.utils.fixUnicode(valRoute));
                        uploadData.append('meta_model', app.utils.fixUnicode(valModel));
                        uploadData.append('meta_location', app.utils.fixUnicode(valLoc));
                        uploadData.append('meta_province', app.utils.fixUnicode(provinceValue));
                        uploadData.append('meta_note', app.utils.fixUnicode(noteValue));
                        uploadData.append('meta_mod_note', app.utils.fixUnicode(modNoteValue));
                        uploadData.append('meta_is_documentary', isDocValue ? 'true' : 'false');
                        uploadData.append('meta_taken_at', valDate);
                        uploadData.append('meta_username', username);
                        uploadData.append('meta_camera_model', exifSnapshot.camera);
                        uploadData.append('meta_exif_params', exifSnapshot.params);
                        uploadData.append('meta_suspected_exif_fraud', exifSnapshot.suspectedFraud ? 'true' : 'false');
                        app.upload.uploadQueue.push({
                            formData: uploadData,
                            plate: valPlate.replace(/[^A-Z0-9-]/gi, '').toUpperCase(),
                            originalSizeKB: originalSizeKB,
                            compressedSizeKB: compressedSizeKB,
                            fileName: rawFile.name,
                            fileType: rawFile.type
                        });
                        if (app.upload.currentQuota.limit !== null) app.upload.currentQuota.count++;
                        // (Removed location history save on submit)
                        if(app.upload && app.upload.clearDraft) app.upload.clearDraft();
                        if(app.db && app.db.clearPhoto) app.db.clearPhoto();
                        app.utils.cleanupState();
                        // Chỉ cuộn lên đầu khi người dùng còn ở trang upload (họ có thể đã chuyển trang khi đang tải)
                        const uploadView = document.getElementById('upload');
                        if (uploadView && uploadView.classList.contains('active')) window.scrollTo({ top: 0, behavior: 'smooth' });
                        app.upload.processQueue();
                    } catch (err) {
                        app.upload.activeUploadsCount = Math.max(0, (app.upload.activeUploadsCount || 1) - 1);
                        if (app.upload.activeUploadsCount === 0) {
                            if (app.upload.fakeProgressInterval) clearInterval(app.upload.fakeProgressInterval);
                            if (app.upload.activeProgressToast) {
                                app.upload.activeProgressToast.remove();
                                app.upload.activeProgressToast = null;
                            }
                        } else if (app.upload.activeProgressToast) {
                            const title = app.upload.activeUploadsCount > 1 ? `Đang tải ${app.upload.activeUploadsCount} ảnh lên máy chủ...` : 'Đang tải ảnh lên máy chủ...';
                            app.upload.activeProgressToast.update(app.upload.fakeProgress, title, 'Bạn có thể chuyển sang trang khác, tải lên vẫn tiếp diễn');
                        }

                        app.ui.showUploadProgress(); 
                        app.ui.updateUploadError(err.message);
                    } finally {
                        btn.innerHTML = originalText;
                        btn.disabled = false;
                        delete btn.dataset.submitting;
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
                    const provVal = document.getElementById('up-province')?.value?.trim();
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
                    
                    const isDocCheckbox = document.getElementById('up-is-documentary');
                    const modNoteLabel = document.getElementById('up-mod-note-label');
                    if (isDocCheckbox && modNoteLabel) {
                        isDocCheckbox.addEventListener('change', () => {
                            if (isDocCheckbox.checked) {
                                if (!modNoteLabel.innerHTML.includes('<span')) {
                                    modNoteLabel.innerHTML = 'Ghi chú dành cho kiểm duyệt <span class="text-red-500">*</span>';
                                }
                            } else {
                                modNoteLabel.innerHTML = 'Ghi chú dành cho kiểm duyệt';
                            }
                        });
                    }
                },
                checkQuota: async () => {
                    if (!app.user) return;
                    if (app.username && app.utils.isValidUsername && !app.utils.isValidUsername(app.username)) {
                        app.ui.showAlert("Tên hiển thị của bạn không hợp lệ (Chỉ được chứa chữ, số, dấu cách; không chứa ký tự đặc biệt, kí hiệu hay emoji và phải từ 3-20 ký tự). Vui lòng đổi tên trước khi đăng ảnh!", () => {
                            if (app.settings && app.settings.open) app.settings.open('profile');
                        });
                        const btnSubmit = document.getElementById('btn-submit');
                        if (btnSubmit) btnSubmit.disabled = true;
                        return;
                    }
                    const pill = document.getElementById('upload-quota-pill');
                    const textEl = document.getElementById('upload-quota-text');
                    const fileInput = document.getElementById('up-file');
                    const btnSubmit = document.getElementById('btn-submit');
                    const qrBtn = document.querySelector('#qr-btn-wrapper button');
                    const dropZone = document.getElementById('drop-zone');
                    if (!pill) return;
                    pill.classList.remove('hidden');
                    textEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-gray-400"></i>';
                    try {
                        const { data: profile } = await window.sb.from('profiles').select('reputation_score').eq('id', app.user.id).single();
                        const score = profile?.reputation_score !== undefined ? profile.reputation_score : 100;
                        const scoreUI = document.getElementById('upload-reputation-score');
                        const scoreVal = document.getElementById('reputation-score-val');
                        if (scoreUI && scoreVal) {
                            scoreVal.innerText = score;
                            scoreUI.classList.remove('hidden');
                        }
                        
                        let baseLimit = 15;
                        if (score <= 0) baseLimit = 5;
                        else if (score <= 49) baseLimit = 8;
                        else if (score <= 99) baseLimit = 12;
                        else if (score === 100) baseLimit = 15;
                        else if (score <= 130) baseLimit = 20;
                        else if (score <= 160) baseLimit = 30;
                        else if (score <= 199) baseLimit = 40;
                        else baseLimit = 50;
                        
                        const limitNum = baseLimit;
                        
                        const last7AM = app.utils.getLast7AM_UTC7();
                        const { count } = await window.sb.from('photos')
                            .select('*', { count: 'exact', head: true })
                            .eq('uploader_id', app.user.id)
                            .gte('created_at', last7AM);
                        app.upload.currentQuota = { limit: limitNum, count: count || 0 };
                        textEl.classList.remove('text-black', 'text-amber-500', 'text-red-600');
                        const totalQueueAssumed = app.upload.uploadQueue.length;
                        const realCount = (count || 0) + totalQueueAssumed;
                        
                        textEl.innerText = `${realCount}/${limitNum} lượt hôm nay`;
                            const remaining = limitNum - realCount;
                            if (remaining <= 0) {
                                textEl.classList.add('text-red-600');
                                fileInput.disabled = true;
                                if (btnSubmit) btnSubmit.disabled = true;
                                fileInput.classList.add('opacity-50', 'cursor-not-allowed');
                                if (qrBtn) { qrBtn.disabled = true; qrBtn.classList.add('opacity-50', 'cursor-not-allowed'); qrBtn.classList.remove('hover:bg-gray-50'); }
                                if (dropZone) dropZone.style.pointerEvents = 'none';
                                textEl.innerText = `Hết slot hôm nay (${realCount}/${limitNum})`;
                            } else if (remaining <= 3) {
                                textEl.classList.add('text-amber-500');
                                fileInput.disabled = false;
                                fileInput.classList.remove('opacity-50', 'cursor-not-allowed');
                                if (qrBtn) { qrBtn.disabled = false; qrBtn.classList.remove('opacity-50', 'cursor-not-allowed'); qrBtn.classList.add('hover:bg-gray-50'); }
                                if (dropZone) dropZone.style.pointerEvents = 'auto';
                            } else {
                                textEl.classList.add('text-black');
                                fileInput.disabled = false;
                                fileInput.classList.remove('opacity-50', 'cursor-not-allowed');
                                if (qrBtn) { qrBtn.disabled = false; qrBtn.classList.remove('opacity-50', 'cursor-not-allowed'); qrBtn.classList.add('hover:bg-gray-50'); }
                                if (dropZone) dropZone.style.pointerEvents = 'auto';
                            }
                    } catch (e) {
                        textEl.innerText = "Lỗi kiểm tra giới hạn";
                        textEl.classList.add('text-red-500');
                    }
                },
                processQueue: async () => {
                    if (app.upload.isQueueProcessing || app.upload.uploadQueue.length === 0) return;
                    app.upload.isQueueProcessing = true;
                    while (app.upload.uploadQueue.length > 0) {
                        const item = app.upload.uploadQueue[0];
                        let token;
                        try {
                            const { data: { session } } = await window.sb.auth.getSession();
                            token = session?.access_token;
                        } catch (e) {}
                        let result = null;
                        let uploadAttempts = 0;
                        const maxUploadAttempts = 1;
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
                                    } else { throw new Error('Phiên đã hết hạn. Vui lòng tải lại trang và đăng nhập lại. ' + (result && result.details ? result.details : '')); }
                                }
                                if (!result.success) {
                                    console.error('[EXHAUSTIVE UPLOAD LOG - SERVER RETURNED FAILURE]:', JSON.stringify(result, null, 2));
                                    let uiError = result.error || 'Máy chủ từ chối yêu cầu Upload.';
                                    if (typeof uiError === 'object' && uiError !== null) {
                                        uiError = uiError.message || JSON.stringify(uiError);
                                    }
                                    if (result.details) console.error('[EXHAUSTIVE UPLOAD LOG] Details:', result.details);
                                    if (result.code) console.error('[EXHAUSTIVE UPLOAD LOG] Code:', result.code);
                                    if (result.hint) console.error('[EXHAUSTIVE UPLOAD LOG] Hint:', result.hint);
                                    lastUploadErr = new Error(uiError);
                                    break;
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
                            app.upload.activeUploadsCount = Math.max(0, (app.upload.activeUploadsCount || 1) - 1);
                            if (app.upload.activeUploadsCount === 0) {
                                if (app.upload.fakeProgressInterval) clearInterval(app.upload.fakeProgressInterval);
                                if (app.upload.activeProgressToast) {
                                    app.upload.activeProgressToast.remove();
                                    app.upload.activeProgressToast = null;
                                }
                            }
                            app.upload.uploadQueue.shift();
                            app.upload.isQueueProcessing = false;
                            let displayError = lastUploadErr ? lastUploadErr.message : "Upload thất bại";
                            if (displayError === '[object Object]') displayError = JSON.stringify(lastUploadErr);
                            
                            // 1. Bật UI Báo lỗi ra Màn hình NGAY LẬP TỨC
                            app.ui.showUploadProgress(); 
                            app.ui.updateUploadError(displayError);

                            // 2. Logic kiểm tra và gửi API
                            const localErrors = ["Trình duyệt của bạn không hỗ trợ", "Ảnh quá phức tạp", "Lỗi nén ảnh", "tải lại trang", "hết hạn", "quá lớn"];
                            const shouldReport = !localErrors.some(eStr => displayError.toLowerCase().includes(eStr.toLowerCase()));
                            
                            const reportStatusEl = document.getElementById('auto-report-status');

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
                                    
                                    if (reportRes.ok) { 
                                        const rData = await reportRes.json(); 
                                        if (rData && rData.success) {
                                            if (reportStatusEl) {
                                                reportStatusEl.className = "text-green-600";
                                                reportStatusEl.innerHTML = `<i class="fa-solid fa-check-circle"></i> Đã báo cáo lỗi tự động.`;
                                            }
                                        } else {
                                            throw new Error(rData.error || "API trả về lỗi");
                                        }
                                    } else {
                                        throw new Error("HTTP " + reportRes.status);
                                    }
                                } catch (e) {
                                    if (reportStatusEl) {
                                        reportStatusEl.className = "text-red-500";
                                        reportStatusEl.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Báo cáo thất bại: ${e.message}`;
                                    }
                                }
                            } else {
                                if (reportStatusEl) {
                                    reportStatusEl.className = "text-gray-500";
                                    reportStatusEl.innerHTML = `<i class="fa-solid fa-circle-info"></i> Lỗi thiết bị, KHÔNG báo cáo.`;
                                }
                            }
                            
                            break; 
                        }
                        app.upload.activeUploadsCount = Math.max(0, (app.upload.activeUploadsCount || 1) - 1);
                        if (app.upload.activeUploadsCount === 0) {
                            if (app.upload.fakeProgressInterval) clearInterval(app.upload.fakeProgressInterval);
                            if (app.upload.activeProgressToast) {
                                app.upload.activeProgressToast.update(100, `Hoàn tất tải lên!`, 'Đang đồng bộ dữ liệu...');
                                setTimeout(() => {
                                    if (app.upload.activeProgressToast) {
                                        app.upload.activeProgressToast.remove();
                                        app.upload.activeProgressToast = null;
                                    }
                                }, 500);
                            }
                        } else if (app.upload.activeProgressToast) {
                            const title = app.upload.activeUploadsCount > 1 ? `Đang tải ${app.upload.activeUploadsCount} ảnh lên máy chủ...` : 'Đang tải ảnh lên máy chủ...';
                            app.upload.activeProgressToast.update(app.upload.fakeProgress, title, 'Bạn có thể chuyển sang trang khác, tải lên vẫn tiếp diễn');
                        }

                        app.upload.uploadQueue.shift(); 
                        let queueCount = '?';
                        let newPhotoId = null;
                        try {
                            const { data: pendingData } = await window.sb.from('photos')
                                .select('id, uploader_id, created_at, profiles(role)')
                                .in('status', ['pending', 'pending_quality', 'pending_info']);
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
                        app.upload.activeUploadsCount = 0;
                        if (app.upload.fakeProgressInterval) clearInterval(app.upload.fakeProgressInterval);
                        if (app.upload.activeProgressToast) {
                            app.upload.activeProgressToast.remove();
                            app.upload.activeProgressToast = null;
                        }
                        app.upload.isQueueProcessing = false;
                        app.upload.checkQuota(); 
                    }
                }
            },

    denoise: {
        glCanvas: null,
        gl: null,
        program: null,
        posBuffer: null,
        texBuffer: null,
        initGL: function() {
            if (this.gl && this.program) return true;
            try {
                this.glCanvas = document.createElement('canvas');
                const gl = this.glCanvas.getContext('webgl', { preserveDrawingBuffer: true }) || 
                           this.glCanvas.getContext('experimental-webgl', { preserveDrawingBuffer: true });
                if (!gl) return false;

                const vsSource = `
                    attribute vec2 a_position;
                    attribute vec2 a_texCoord;
                    varying vec2 v_texCoord;
                    void main() {
                        gl_Position = vec4(a_position, 0.0, 1.0);
                        v_texCoord = a_texCoord;
                    }
                `;

                const fsSource = `
                    precision highp float;
                    uniform sampler2D u_image;
                    uniform vec2 u_resolution;
                    uniform float u_strength;
                    varying vec2 v_texCoord;

                    vec3 rgb2ycbcr(vec3 c) {
                        float y = 0.299 * c.r + 0.587 * c.g + 0.114 * c.b;
                        float cb = 0.5 - 0.168736 * c.r - 0.331264 * c.g + 0.5 * c.b;
                        float cr = 0.5 + 0.5 * c.r - 0.418688 * c.g - 0.081312 * c.b;
                        return vec3(y, cb, cr);
                    }

                    vec3 ycbcr2rgb(vec3 ycbcr) {
                        float y = ycbcr.x;
                        float cb = ycbcr.y - 0.5;
                        float cr = ycbcr.z - 0.5;
                        float r = y + 1.402 * cr;
                        float g = y - 0.344136 * cb - 0.714136 * cr;
                        float b = y + 1.772 * cb;
                        return clamp(vec3(r, g, b), 0.0, 1.0);
                    }

                    void main() {
                        vec4 centerColor = texture2D(u_image, v_texCoord);
                        if (u_strength <= 0.001) {
                            gl_FragColor = centerColor;
                            return;
                        }

                        vec3 centerY = rgb2ycbcr(centerColor.rgb);
                        float maxR = (u_strength > 0.5) ? 3.0 : 2.0;

                        float sigmaS = 1.5 + u_strength * 2.5;
                        float twoSigmaS2 = 2.0 * sigmaS * sigmaS;

                        float sigmaR_Y = 0.04 + u_strength * 0.12;
                        float twoSigmaR_Y2 = 2.0 * sigmaR_Y * sigmaR_Y;

                        float sigmaR_C = 0.08 + u_strength * 0.25;
                        float twoSigmaR_C2 = 2.0 * sigmaR_C * sigmaR_C;

                        vec3 sumY = vec3(0.0);
                        vec3 totalWeight = vec3(0.0);
                        vec2 step = vec2(1.0) / u_resolution;

                        for (int i = -3; i <= 3; i++) {
                            for (int j = -3; j <= 3; j++) {
                                if (abs(float(i)) > maxR || abs(float(j)) > maxR) continue;
                                vec2 offset = vec2(float(i), float(j));
                                vec3 sampleY = rgb2ycbcr(texture2D(u_image, v_texCoord + offset * step).rgb);

                                float distS2 = dot(offset, offset);
                                float spatialW = exp(-distS2 / twoSigmaS2);

                                float diffY = sampleY.x - centerY.x;
                                float wY = spatialW * exp(-(diffY * diffY) / twoSigmaR_Y2);
                                sumY.x += sampleY.x * wY;
                                totalWeight.x += wY;

                                float diffCb = sampleY.y - centerY.y;
                                float diffCr = sampleY.z - centerY.z;
                                float diffC2 = diffCb * diffCb + diffCr * diffCr;
                                float wC = spatialW * exp(-diffC2 / twoSigmaR_C2);
                                sumY.yz += sampleY.yz * wC;
                                totalWeight.yz += vec2(wC);
                            }
                        }

                        vec3 filteredY = vec3(
                            totalWeight.x > 0.0 ? sumY.x / totalWeight.x : centerY.x,
                            totalWeight.y > 0.0 ? sumY.y / totalWeight.y : centerY.y,
                            totalWeight.z > 0.0 ? sumY.z / totalWeight.z : centerY.z
                        );

                        float sharpY = filteredY.x + (centerY.x - filteredY.x) * 0.15;
                        filteredY.x = clamp(sharpY, 0.0, 1.0);

                        vec3 resultRGB = ycbcr2rgb(filteredY);
                        gl_FragColor = vec4(resultRGB, centerColor.a);
                    }
                `;

                const compileShader = (type, source) => {
                    const shader = gl.createShader(type);
                    gl.shaderSource(shader, source);
                    gl.compileShader(shader);
                    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                        console.warn(gl.getShaderInfoLog(shader));
                        gl.deleteShader(shader);
                        return null;
                    }
                    return shader;
                };

                const vs = compileShader(gl.VERTEX_SHADER, vsSource);
                const fs = compileShader(gl.FRAGMENT_SHADER, fsSource);
                if (!vs || !fs) return false;

                const program = gl.createProgram();
                gl.attachShader(program, vs);
                gl.attachShader(program, fs);
                gl.linkProgram(program);
                if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                    console.warn(gl.getProgramInfoLog(program));
                    return false;
                }

                this.gl = gl;
                this.program = program;

                const posBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
                    -1, -1,
                     1, -1,
                    -1,  1,
                    -1,  1,
                     1, -1,
                     1,  1
                ]), gl.STATIC_DRAW);
                this.posBuffer = posBuffer;

                const texBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
                    0, 1,
                    1, 1,
                    0, 0,
                    0, 0,
                    1, 1,
                    1, 0
                ]), gl.STATIC_DRAW);
                this.texBuffer = texBuffer;

                return true;
            } catch (e) {
                console.warn("Lỗi khởi tạo WebGL Denoise:", e);
                return false;
            }
        },

        processCanvas: function(sourceCanvas, percent) {
            if (!percent || percent <= 0) return sourceCanvas;
            const strength = Math.min(1.0, Math.max(0.0, percent / 100));

            if (!this.initGL()) {
                this.processCanvasCPU(sourceCanvas, strength);
                return sourceCanvas;
            }

            const gl = this.gl;
            const maxTexSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 4096;
            const maxViewportDims = gl.getParameter(gl.MAX_VIEWPORT_DIMS) || [4096, 4096];
            const maxSafeDim = Math.min(maxTexSize, maxViewportDims[0], maxViewportDims[1]);

            const sw = sourceCanvas.width;
            const sh = sourceCanvas.height;

            // Đảm bảo context của sourceCanvas ở trạng thái ma trận đơn vị (identity transform)
            const srcCtx = sourceCanvas.getContext('2d');
            srcCtx.save();
            srcCtx.setTransform(1, 0, 0, 1, 0, 0);

            if (sw <= maxSafeDim && sh <= maxSafeDim) {
                this._renderGL(sourceCanvas, 0, 0, sw, sh, strength);
                srcCtx.restore();
                return sourceCanvas;
            }

            // Tiling cho các ảnh có kích thước vượt quá giới hạn an toàn của GPU
            const tileSize = Math.min(2048, maxSafeDim - 32);
            const pad = 6;
            const tempCv = document.createElement('canvas');
            const tempCtx = tempCv.getContext('2d');

            const originalCopyCv = document.createElement('canvas');
            originalCopyCv.width = sw;
            originalCopyCv.height = sh;
            const copyCtx = originalCopyCv.getContext('2d');
            copyCtx.setTransform(1, 0, 0, 1, 0, 0);
            copyCtx.drawImage(sourceCanvas, 0, 0);

            for (let y = 0; y < sh; y += tileSize) {
                for (let x = 0; x < sw; x += tileSize) {
                    const tw = Math.min(tileSize, sw - x);
                    const th = Math.min(tileSize, sh - y);

                    const sx = Math.max(0, x - pad);
                    const sy = Math.max(0, y - pad);
                    const ex = Math.min(sw, x + tw + pad);
                    const ey = Math.min(sh, y + th + pad);
                    const cropW = ex - sx;
                    const cropH = ey - sy;

                    tempCv.width = cropW;
                    tempCv.height = cropH;
                    tempCtx.setTransform(1, 0, 0, 1, 0, 0);
                    tempCtx.drawImage(originalCopyCv, sx, sy, cropW, cropH, 0, 0, cropW, cropH);

                    this._renderGL(tempCv, 0, 0, cropW, cropH, strength);

                    const offsetX = x - sx;
                    const offsetY = y - sy;
                    srcCtx.setTransform(1, 0, 0, 1, 0, 0);
                    srcCtx.drawImage(tempCv, offsetX, offsetY, tw, th, x, y, tw, th);
                }
            }

            srcCtx.restore();
            return sourceCanvas;
        },

        _renderGL: function(targetCanvas, x, y, w, h, strength) {
            const gl = this.gl;
            this.glCanvas.width = w;
            this.glCanvas.height = h;

            gl.viewport(0, 0, w, h);
            gl.useProgram(this.program);

            const aPos = gl.getAttribLocation(this.program, "a_position");
            gl.enableVertexAttribArray(aPos);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer);
            gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

            const aTex = gl.getAttribLocation(this.program, "a_texCoord");
            gl.enableVertexAttribArray(aTex);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.texBuffer);
            gl.vertexAttribPointer(aTex, 2, gl.FLOAT, false, 0, 0);

            const texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, targetCanvas);

            gl.uniform2f(gl.getUniformLocation(this.program, "u_resolution"), w, h);
            gl.uniform1f(gl.getUniformLocation(this.program, "u_strength"), strength);

            gl.drawArrays(gl.TRIANGLES, 0, 6);

            const ctx = targetCanvas.getContext('2d');
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.drawImage(this.glCanvas, 0, 0);
            ctx.restore();

            gl.deleteTexture(texture);
        },

        processCanvasCPU: function(canvas, strength) {
            const ctx = canvas.getContext('2d');
            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imgData.data;
            const w = canvas.width;
            const h = canvas.height;
            const output = new Uint8ClampedArray(data.length);
            output.set(data);

            const r = strength > 0.5 ? 2 : 1;
            const sigmaS = 1.5 + strength * 2.0;
            const twoSigmaS2 = 2.0 * sigmaS * sigmaS;
            const sigmaR = 15 + strength * 35;
            const twoSigmaR2 = 2.0 * sigmaR * sigmaR;

            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    const idx = (y * w + x) * 4;
                    const cr = data[idx];
                    const cg = data[idx + 1];
                    const cb = data[idx + 2];

                    let sumR = 0, sumG = 0, sumB = 0, totalW = 0;

                    for (let dy = -r; dy <= r; dy++) {
                        const ny = y + dy;
                        if (ny < 0 || ny >= h) continue;
                        for (let dx = -r; dx <= r; dx++) {
                            const nx = x + dx;
                            if (nx < 0 || nx >= w) continue;

                            const nIdx = (ny * w + nx) * 4;
                            const nr = data[nIdx];
                            const ng = data[nIdx + 1];
                            const nb = data[nIdx + 2];

                            const distS2 = dx * dx + dy * dy;
                            const diffR = nr - cr;
                            const diffG = ng - cg;
                            const diffB = nb - cb;
                            const distR2 = (diffR * diffR * 0.299 + diffG * diffG * 0.587 + diffB * diffB * 0.114);

                            const weight = Math.exp(-distS2 / twoSigmaS2 - distR2 / twoSigmaR2);
                            sumR += nr * weight;
                            sumG += ng * weight;
                            sumB += nb * weight;
                            totalW += weight;
                        }
                    }

                    if (totalW > 0) {
                        output[idx] = sumR / totalW;
                        output[idx + 1] = sumG / totalW;
                        output[idx + 2] = sumB / totalW;
                    }
                }
            }
            imgData.data.set(output);
            ctx.putImageData(imgData, 0, 0);
        }
    },

    crop: {
        state: { x: 0, y: 0, scale: 1, rotation: 0, minScale: 1 },
        isDragging: false,
        eventsAttached: false,
        startX: 0,
        startY: 0,
        lastClientX: 0,
        lastClientY: 0,
        mode: 'main',
        originalFile: null,
        sourceImage: null,
        savedRatio: 4/3,
        modeTab: 'ratio',
        isRulerEnabled: localStorage.getItem('cropRulerEnabled') === 'true',
        isMandatory: false,
        isProcessing: false,
        closeTimeout: null,
        baseSrc: null,
        baseImageElement: null,
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
                    console.warn('Lỗi chuyển đổi HEIF/HEIC trong cropper:', err);
                }
            }
            app.crop.originalFile = targetFile;
            app.crop.isMandatory = isMandatory;
            const img = document.getElementById('crop-image');
            if (img) {
                img.onload = null;
                img.onerror = null;
                img.removeAttribute('src');
                img.style.cssText = `
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: auto !important;
                    height: auto !important;
                    max-width: none !important;
                    max-height: none !important;
                    transform-origin: center center;
                    pointer-events: none;
                `;
                img.className = '';
            }
            const modal = document.getElementById('crop-modal');
            const content = document.getElementById('crop-content');
            const ratioContainer = document.getElementById('crop-ratios');
            const modePanel = document.getElementById('crop-mode-panel');
            modal.classList.remove('hidden');
            app.ui.lockScroll();
            setTimeout(() => {
                if (content) {
                    content.classList.remove('opacity-0', 'scale-95');
                    content.classList.add('opacity-100', 'scale-100');
                }
            }, 10);
            const container = document.getElementById('crop-container');
            if (container && !app.crop.eventsAttached) {
                app.crop.eventsAttached = true;
                container.addEventListener('wheel', app.crop.onWheel, { passive: false });
            }
            const url = URL.createObjectURL(app.crop.originalFile);
            app.crop.baseSrc = url;
            app.crop.baseImageElement = new Image();
            app.crop.baseImageElement.src = url;
            img.onload = () => {
                img.onload = null;
                img.onerror = null;

                app.crop.originalWidth = img.naturalWidth;
                app.crop.originalHeight = img.naturalHeight;
                img.style.setProperty('width', app.crop.originalWidth + 'px', 'important');
                img.style.setProperty('height', app.crop.originalHeight + 'px', 'important');

                setTimeout(() => {
                    if (mode === 'main' || mode === 'avatar') {
                        if (app.crop.savedState && mode === 'main') {
                            app.crop.state = { ...app.crop.savedState };
                        } else {
                            app.crop.state = { x: 0, y: 0, scale: 1, rotation: 0, baseRotation: 0, minScale: 1 };
                        }
                        const freeRotation = app.crop.state.rotation - (app.crop.state.baseRotation || 0);
                        const rotateSlider = document.getElementById('crop-rotate-slider');
                        if (rotateSlider) rotateSlider.value = freeRotation;
                        const rotateVal = document.getElementById('crop-rotate-val');
                        if (rotateVal) rotateVal.innerText = (freeRotation > 0 ? '+' : '') + freeRotation + '°';

                        const rulerBtn = document.getElementById('btn-crop-toggle-ruler');
                        if (mode === 'avatar') {
                            if (modePanel) modePanel.classList.add('hidden');
                            app.crop.setModeTab('rotate');
                            if (rulerBtn && rulerBtn.parentElement) {
                                rulerBtn.parentElement.classList.add('invisible');
                                rulerBtn.parentElement.classList.remove('hidden');
                            }
                            app.crop.savedRatio = 1;
                        } else {
                            if (modePanel) modePanel.classList.remove('hidden');
                            app.crop.setModeTab('ratio');
                            if (ratioContainer) ratioContainer.classList.remove('hidden');
                            if (rulerBtn && rulerBtn.parentElement) {
                                rulerBtn.parentElement.classList.remove('invisible', 'hidden');
                            }
                            if (typeof app.crop.savedRatio !== 'number' || isNaN(app.crop.savedRatio)) {
                                const imgRatio = (app.crop.originalWidth || img.naturalWidth) / (app.crop.originalHeight || img.naturalHeight);
                                const presets = [16/9, 3/2, 4/3];
                                let bestRatio = 4/3;
                                let minDiff = 0.05;
                                for (let r of presets) {
                                    if (Math.abs(imgRatio - r) < minDiff) {
                                        bestRatio = r;
                                        minDiff = Math.abs(imgRatio - r);
                                    }
                                }
                                app.crop.savedRatio = bestRatio;
                            }
                        }
                        app.crop.updateRatioButtons(app.crop.savedRatio);
                        app.crop.setFixedCropBox(app.crop.savedRatio);
                        app.crop.updateMinScale();
                        if (!app.crop.savedState || mode === 'avatar') {
                            app.crop.state.scale = app.crop.state.minScale;
                            app.crop.state.x = 0;
                            app.crop.state.y = 0;
                        } else {
                            if (app.crop.state.scale < app.crop.state.minScale) {
                                app.crop.state.scale = app.crop.state.minScale;
                            }
                        }
                        app.crop.applyTransform();
                        app.crop.updateRulerUI();
                    }
                }, 50);
            };
            img.onerror = () => {
                img.onload = null;
                img.onerror = null;
                app.ui.showAlert('Không thể tải ảnh vào công cụ cắt ảnh. Vui lòng thử lại hoặc chọn file hợp lệ.');
                app.crop.close();
            };
            img.src = url;
        },
        updateMinScale: () => {
            const overlay = document.getElementById('crop-overlay-box');
            const img = document.getElementById('crop-image');
            if (!overlay || !img) return;
            const ow = overlay.offsetWidth;
            const oh = overlay.offsetHeight;
            const iw = app.crop.originalWidth || img.naturalWidth;
            const ih = app.crop.originalHeight || img.naturalHeight;
            if (!iw || !ih) return;
            const rad = app.crop.state.rotation * (Math.PI / 180);
            const boundingW = (ow * Math.abs(Math.cos(rad))) + (oh * Math.abs(Math.sin(rad)));
            const boundingH = (ow * Math.abs(Math.sin(rad))) + (oh * Math.abs(Math.cos(rad)));
            app.crop.state.minScale = Math.max(boundingW / iw, boundingH / ih);
            if (app.crop.state.scale < app.crop.state.minScale) {
                app.crop.state.scale = app.crop.state.minScale;
            }
        },
        applyTransform: () => {
            const overlay = document.getElementById('crop-overlay-box');
            const img = document.getElementById('crop-image');
            if (!overlay || !img) return;
            const iw = app.crop.originalWidth || img.naturalWidth;
            const ih = app.crop.originalHeight || img.naturalHeight;
            if (!iw || !ih) return;
            const ow = overlay.offsetWidth;
            const oh = overlay.offsetHeight;
            const scaledImgW = iw * app.crop.state.scale;
            const scaledImgH = ih * app.crop.state.scale;
            const rad = app.crop.state.rotation * (Math.PI / 180);
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);
            const absCos = Math.abs(cos);
            const absSin = Math.abs(sin);
            const projCropW = (ow * absCos) + (oh * absSin);
            const projCropH = (ow * absSin) + (oh * absCos);
            const maxLocalX = Math.max(0, (scaledImgW - projCropW) / 2);
            const maxLocalY = Math.max(0, (scaledImgH - projCropH) / 2);
            let lx = app.crop.state.x * cos + app.crop.state.y * sin;
            let ly = -app.crop.state.x * sin + app.crop.state.y * cos;
            lx = Math.max(-maxLocalX, Math.min(maxLocalX, lx));
            ly = Math.max(-maxLocalY, Math.min(maxLocalY, ly));
            app.crop.state.x = lx * cos - ly * sin;
            app.crop.state.y = lx * sin + ly * cos;
            img.style.transform = `translate(calc(-50% + ${app.crop.state.x}px), calc(-50% + ${app.crop.state.y}px)) translateZ(0) rotate(${app.crop.state.rotation}deg) scale(${app.crop.state.scale})`;
        },
        onDragStart: (e) => {
            if (app.crop.isProcessing) return;
            app.crop.isDragging = true;
            if (e.touches && e.touches.length >= 2) {
                const t1 = e.touches[0];
                const t2 = e.touches[1];
                app.crop.lastClientX = (t1.clientX + t2.clientX) / 2;
                app.crop.lastClientY = (t1.clientY + t2.clientY) / 2;
                app.crop.lastPinchDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
            } else if (e.touches && e.touches.length === 1) {
                app.crop.lastClientX = e.touches[0].clientX;
                app.crop.lastClientY = e.touches[0].clientY;
                app.crop.lastPinchDist = null;
            } else {
                app.crop.lastClientX = e.clientX;
                app.crop.lastClientY = e.clientY;
                app.crop.lastPinchDist = null;
            }
        },
        onDragMove: (e) => {
            if (!app.crop.isDragging || app.crop.isProcessing) return;
            e.preventDefault();
            let clientX, clientY, currentPinchDist = null;
            if (e.touches && e.touches.length >= 2) {
                const t1 = e.touches[0];
                const t2 = e.touches[1];
                clientX = (t1.clientX + t2.clientX) / 2;
                clientY = (t1.clientY + t2.clientY) / 2;
                currentPinchDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
            } else if (e.touches && e.touches.length === 1) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }
            const deltaX = clientX - app.crop.lastClientX;
            const deltaY = clientY - app.crop.lastClientY;
            app.crop.state.x += deltaX;
            app.crop.state.y += deltaY;
            if (currentPinchDist && app.crop.lastPinchDist && app.crop.lastPinchDist > 0) {
                const pinchRatio = currentPinchDist / app.crop.lastPinchDist;
                app.crop.state.scale *= pinchRatio;
                if (app.crop.state.scale < app.crop.state.minScale) {
                    app.crop.state.scale = app.crop.state.minScale;
                }
            }
            app.crop.lastClientX = clientX;
            app.crop.lastClientY = clientY;
            if (currentPinchDist) app.crop.lastPinchDist = currentPinchDist;
            app.crop.applyTransform();
        },
        onDragEnd: (e) => {
            if (e.touches && e.touches.length > 0) {
                if (e.touches.length === 1) {
                    app.crop.lastClientX = e.touches[0].clientX;
                    app.crop.lastClientY = e.touches[0].clientY;
                    app.crop.lastPinchDist = null;
                } else if (e.touches.length >= 2) {
                    const t1 = e.touches[0];
                    const t2 = e.touches[1];
                    app.crop.lastClientX = (t1.clientX + t2.clientX) / 2;
                    app.crop.lastClientY = (t1.clientY + t2.clientY) / 2;
                    app.crop.lastPinchDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
                }
                return;
            }
            app.crop.isDragging = false;
            app.crop.lastPinchDist = null;
        },
        onWheel: (e) => {
            e.preventDefault();
            const zoomFactor = Math.exp(-e.deltaY * 0.0005);
            app.crop.state.scale *= zoomFactor;
            if (app.crop.state.scale < app.crop.state.minScale) {
                app.crop.state.scale = app.crop.state.minScale;
            }
            if (app.crop.state.scale > 5) app.crop.state.scale = 5;
            app.crop.applyTransform();
        },
        setFixedCropBox: (ratio) => {
            const container = document.getElementById('crop-container');
            const overlay = document.getElementById('crop-overlay-box');
            if (!container || !overlay) return;
            const cw = container.offsetWidth;
            const ch = container.offsetHeight;
            const targetW = cw * 0.85;
            const targetH = ch * 0.85;
            const currentRatio = ratio || ((typeof app.crop.savedRatio === 'number' && !isNaN(app.crop.savedRatio)) ? app.crop.savedRatio : (4/3));
            let finalW = targetW;
            let finalH = finalW / currentRatio;
            if (finalH > targetH) {
                finalH = targetH;
                finalW = finalH * currentRatio;
            }
            overlay.style.width = finalW + 'px';
            overlay.style.height = finalH + 'px';
        },
        setRatio: (ratio) => {
            if (app.crop.mode === 'main') app.crop.savedRatio = ratio;
            const rotateSlider = document.getElementById('crop-rotate-slider');
            if (rotateSlider) rotateSlider.value = 0;
            const rotateVal = document.getElementById('crop-rotate-val');
            if (rotateVal) rotateVal.innerText = '0°';
            app.crop.state.rotation = 0;
            app.crop.state.baseRotation = 0;
            app.crop.setFixedCropBox(ratio);
            app.crop.updateMinScale();
            app.crop.state.scale = app.crop.state.minScale;
            app.crop.state.x = 0;
            app.crop.state.y = 0;
            app.crop.applyTransform();
            app.crop.updateRatioButtons(ratio);
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
        setModeTab: (tab) => {
            app.crop.modeTab = tab;
            const slider = document.getElementById('crop-mode-slider');
            const btnRatio = document.getElementById('btn-crop-mode-ratio');
            const btnRotate = document.getElementById('btn-crop-mode-rotate');
            const ratioControls = document.getElementById('crop-ratios');
            const rotateControls = document.getElementById('crop-rotate-controls');

            [btnRatio, btnRotate].forEach(btn => {
                if (!btn) return;
                btn.classList.remove('text-black');
                btn.classList.add('text-gray-500', 'hover:text-black');
            });
            [ratioControls, rotateControls].forEach(c => {
                if (!c) return;
                c.classList.add('hidden');
                c.classList.remove('flex');
            });

            if (tab === 'ratio') {
                if (slider) {
                    slider.style.left = '4px';
                    slider.style.width = 'calc((100% - 14px) / 2)';
                }
                if (btnRatio) { btnRatio.classList.add('text-black'); btnRatio.classList.remove('text-gray-500', 'hover:text-black'); }
                if (ratioControls) { ratioControls.classList.remove('hidden'); ratioControls.classList.add('flex'); }
            } else if (tab === 'rotate') {
                if (slider) {
                    slider.style.left = 'calc((100% - 14px) / 2 + 7px)';
                    slider.style.width = 'calc((100% - 14px) / 2)';
                }
                if (btnRotate) { btnRotate.classList.add('text-black'); btnRotate.classList.remove('text-gray-500', 'hover:text-black'); }
                if (rotateControls) { rotateControls.classList.remove('hidden'); rotateControls.classList.add('flex'); }
            }
        },
        slideRotate: (val) => {
            const freeRotation = parseFloat(val);
            app.crop.state.rotation = (app.crop.state.baseRotation || 0) + freeRotation;
            const rotateVal = document.getElementById('crop-rotate-val');
            if (rotateVal) {
                rotateVal.innerText = (freeRotation > 0 ? '+' : '') + freeRotation + '°';
            }
            app.crop.updateMinScale();
            app.crop.applyTransform();
        },
        stepRotate: (delta) => {
            const rotateSlider = document.getElementById('crop-rotate-slider');
            let currentFree = rotateSlider ? parseFloat(rotateSlider.value) : 0;
            let newVal = currentFree + delta;
            if (newVal < -45) newVal = -45;
            if (newVal > 45) newVal = 45;
            if (rotateSlider) rotateSlider.value = newVal;
            app.crop.slideRotate(newVal);
        },
        rotateBy: (deg) => {
            app.crop.state.baseRotation = (app.crop.state.baseRotation || 0) + deg;
            app.crop.state.rotation = app.crop.state.baseRotation;
            const rotateSlider = document.getElementById('crop-rotate-slider');
            if (rotateSlider) rotateSlider.value = 0;
            const rotateVal = document.getElementById('crop-rotate-val');
            if (rotateVal) rotateVal.innerText = '0°';
            app.crop.updateMinScale();
            app.crop.applyTransform();
        },
        toggleRuler: () => {
            const willEnable = !app.crop.isRulerEnabled;
            if (willEnable && !localStorage.getItem('vnbus_ruler_guide_shown')) {
                app.ui.showAlert(
                    `<div class="text-left">
                        <p class="text-sm text-gray-700 mb-2">Xác định 2 điểm xa nhất ngoài cùng bên trái và bên phải của xe (mép xe có thể là bất kỳ bộ phận nào, không tính gương chiếu hậu).</p>
                        <p class="text-sm text-gray-700 mb-2">Xe được coi là căn giữa chuẩn khi khoảng cách từ mép trái và mép phải của xe đến vạch tâm (0) là tương đương nhau.</p>
                        <p class="text-sm font-bold text-gray-800 mt-3 mb-1">Lưu ý:</p>
                        <ul class="list-disc pl-5 text-sm text-gray-700 space-y-1 mb-4">
                            <li><b>Gương chiếu hậu:</b> Dù không tính vào điểm căn mép xe, nhưng gương chiếu hậu vẫn phải hiển thị đầy đủ trong khung hình, không bị cắt mất.</li>
                            <li><b>Khoảng cách:</b> Đảm bảo tổng thể xe không quá gần hoặc quá xa khung hình, góc chụp rõ ràng và thẩm mỹ.</li>
                        </ul>
                        <p class="text-[11px] font-bold text-red-500 uppercase">HƯỚNG DẪN NÀY CHỈ XUẤT HIỆN 1 LẦN</p>
                    </div>`,
                    () => {
                        localStorage.setItem('vnbus_ruler_guide_shown', 'true');
                        app.crop.isRulerEnabled = true;
                        localStorage.setItem('cropRulerEnabled', true);
                        app.crop.updateRulerUI();
                    },
                    null,
                    { title: "Hướng dẫn sử dụng thước ngang", btnOkText: "Đồng ý", iconHtml: '<i class="fa-solid fa-ruler-horizontal text-xl text-black"></i>' }
                );
                return;
            }
            app.crop.isRulerEnabled = !app.crop.isRulerEnabled;
            localStorage.setItem('cropRulerEnabled', app.crop.isRulerEnabled);
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
            const isAvatar = app.crop.mode === 'avatar';
            const showRuler = app.crop.isRulerEnabled && !isAvatar;
            const btn = document.getElementById('btn-crop-toggle-ruler');
            if (btn) {
                if (showRuler) {
                    btn.className = "px-3 py-2 sm:px-3 sm:py-1.5 text-xs bg-black text-white border border-black rounded-md font-bold transition flex items-center justify-center gap-1.5";
                } else {
                    btn.className = "px-3 py-2 sm:px-3 sm:py-1.5 text-xs bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 font-bold transition flex items-center justify-center gap-1.5";
                }
            }
            const overlayBox = document.getElementById('crop-overlay-box');
            if (!overlayBox) return;
            let overlay = overlayBox.querySelector('.crop-ruler-overlay');
            if (!overlay) {
                overlayBox.insertAdjacentHTML('beforeend', app.crop.getRulerHTML());
                overlay = overlayBox.querySelector('.crop-ruler-overlay');
            }
            const gridV = document.getElementById('crop-grid-v');
            const crossH = document.getElementById('crop-crosshair-h');
            const crossV = document.getElementById('crop-crosshair-v');
            if (overlay) {
                if (showRuler) {
                    overlay.classList.remove('hidden');
                    if(gridV) gridV.classList.add('hidden');
                    if(crossH) crossH.classList.add('hidden');
                    if(crossV) crossV.classList.add('hidden');
                } else {
                    overlay.classList.add('hidden');
                    if(gridV) gridV.classList.remove('hidden');
                    if(crossH) crossH.classList.remove('hidden');
                    if(crossV) crossV.classList.remove('hidden');
                }
            }
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
                if (img) {
                    img.onload = null;
                    img.onerror = null;
                    img.removeAttribute('src');
                    img.style.cssText = `
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform-origin: center center;
                        pointer-events: none;
                    `;
                }
                app.ui.unlockScroll();
                if (app.crop.isMandatory) {
                    app.upload.removeImage();
                    app.crop.isMandatory = false;
                }
            }, 200);
        },
        apply: () => {
            const img = document.getElementById('crop-image');
            const overlay = document.getElementById('crop-overlay-box');
            if (!img || !overlay || app.crop.isProcessing) return;
            app.crop.isProcessing = true;
            
            const btn = document.querySelector('#crop-modal button:last-child');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...';
            
            const allControls = document.querySelectorAll('#crop-modal button, #crop-modal input, .crop-ratio-btn');
            allControls.forEach(c => {
                c.dataset.wasDisabled = c.disabled ? "true" : "false";
                c.disabled = true;
            });
            
            const reenableUI = () => {
                app.crop.isProcessing = false;
                allControls.forEach(c => {
                    if (c.dataset.wasDisabled !== "true") c.disabled = false;
                });
                btn.innerHTML = originalText;
                btn.disabled = false;
            };

            setTimeout(() => {
                const ow = overlay.offsetWidth;
                const oh = overlay.offsetHeight;
                const multiplier = 1 / app.crop.state.scale; 
                const canvas = document.createElement('canvas');
                canvas.width = Math.round(ow * multiplier);
                canvas.height = Math.round(oh * multiplier);
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.save();
                ctx.translate(
                    canvas.width / 2 + (app.crop.state.x * multiplier),
                    canvas.height / 2 + (app.crop.state.y * multiplier)
                );
                ctx.rotate(app.crop.state.rotation * Math.PI / 180);
                ctx.scale(app.crop.state.scale * multiplier, app.crop.state.scale * multiplier);
                
                // Luôn vẽ từ ảnh gốc ban đầu với kích thước gốc chính xác tuyệt đối
                const drawSrc = (app.crop.baseImageElement && app.crop.baseImageElement.naturalWidth) ? app.crop.baseImageElement : img;
                const origW = app.crop.originalWidth || drawSrc.naturalWidth;
                const origH = app.crop.originalHeight || drawSrc.naturalHeight;
                ctx.drawImage(
                    drawSrc,
                    -origW / 2,
                    -origH / 2,
                    origW,
                    origH
                );
                ctx.restore();
                ctx.setTransform(1, 0, 0, 1, 0, 0);

                if (app.crop.mode === 'main') {
                    if (canvas.height < 1080) {
                        app.ui.showAlert(`Ảnh sau khi cắt có độ phân giải quá thấp (${canvas.width}x${canvas.height}). Yêu cầu chiều cao tối thiểu 1080px.`);
                        reenableUI();
                        return;
                    }
                    app.utils.canvasToBlobUniversal(canvas, 'image/png').then((blob) => {
                        if (app.crop.originalFile && app.crop.originalFile.name) {
                            blob.name = app.crop.originalFile.name;
                        } else {
                            blob.name = 'cropped_image.png';
                        }
                        const wasMandatory = app.crop.isMandatory;
                        app.crop.isMandatory = false;
                        app.crop.savedState = { ...app.crop.state };
                        app.crop.close();
                        if (wasMandatory) {
                            app.upload.setupPreview(blob);
                        } else {
                            app.rawFile = blob;
                            if (app.upload.previewDenoiseUrl) {
                                URL.revokeObjectURL(app.upload.previewDenoiseUrl);
                                app.upload.previewDenoiseUrl = null;
                            }
                            if (app.upload.basePreviewUrl) {
                                URL.revokeObjectURL(app.upload.basePreviewUrl);
                            }
                            const url = URL.createObjectURL(blob);
                            app.upload.basePreviewUrl = url;
                            app.upload.basePreviewImage = new Image();
                            app.upload.basePreviewImage.src = url;
                            const previewImg = document.getElementById('preview-img');
                            previewImg.src = url;
                            document.querySelectorAll('.blur-panel').forEach(p => p.remove());
                            if (app.upload.updateBlurBtn) app.upload.updateBlurBtn();
                            if(app.upload.resetWm) app.upload.resetWm();
                            if(app.upload.resetFilters) app.upload.resetFilters();
                        }
                        reenableUI();
                    });
                } else if (app.crop.mode === 'avatar') {
                    app.utils.canvasToBlobUniversal(canvas, app.utils.getTargetMimeType(), 0.8).then(async (blob) => {
                        if (blob.size > 3 * 1024 * 1024) {
                            app.ui.showAlert('Ảnh sau khi cắt vẫn quá lớn (>3MB)! Vui lòng chọn ảnh/vùng nhỏ hơn.');
                            reenableUI();
                            return;
                        }
                        app.crop.close();
                        reenableUI();
                        app.auth.uploadAvatarBlob(blob);
                    });
                }
            }, 50);
        },
        confirmReset: () => {
            app.ui.showAlert('Bạn có chắc muốn đặt lại ảnh từ đầu? Các thao tác cắt, xoay sẽ bị hủy.', () => {
                app.crop.reset();
            }, () => {}, { isConfirm: true, confirmText: 'Đặt lại', confirmColor: 'bg-red-600 hover:bg-red-700' });
        },
        reset: () => {
            app.crop.savedState = null;
            app.crop.state = { x: 0, y: 0, scale: 1, rotation: 0, baseRotation: 0, minScale: 1 };
            const rotateSlider = document.getElementById('crop-rotate-slider');
            if (rotateSlider) rotateSlider.value = 0;
            const rotateVal = document.getElementById('crop-rotate-val');
            if (rotateVal) rotateVal.innerText = '0°';
            const img = document.getElementById('crop-image');
            if (img && app.crop.baseSrc) {
                if (app.crop.originalWidth && app.crop.originalHeight) {
                    img.style.setProperty('width', app.crop.originalWidth + 'px', 'important');
                    img.style.setProperty('height', app.crop.originalHeight + 'px', 'important');
                }
                img.src = app.crop.baseSrc;
            }
            const currentRatio = app.crop.mode === 'main' ? (app.crop.savedRatio || (4/3)) : 1;
            app.crop.setFixedCropBox(currentRatio);
            app.crop.updateMinScale();
            app.crop.state.scale = app.crop.state.minScale;
            app.crop.applyTransform();
            app.crop.updateRatioButtons(currentRatio);
            if (app.crop.mode === 'main' && app.crop.originalFile) {
                app.rawFile = app.crop.originalFile;
                if (app.upload.previewDenoiseUrl) {
                    URL.revokeObjectURL(app.upload.previewDenoiseUrl);
                    app.upload.previewDenoiseUrl = null;
                }
                if (app.upload.basePreviewUrl) {
                    URL.revokeObjectURL(app.upload.basePreviewUrl);
                }
                const url = URL.createObjectURL(app.rawFile);
                app.upload.basePreviewUrl = url;
                app.upload.basePreviewImage = new Image();
                app.upload.basePreviewImage.src = url;
                const previewImg = document.getElementById('preview-img');
                if (previewImg) previewImg.src = url;
                document.querySelectorAll('.blur-panel').forEach(p => p.remove());
                if (app.upload.updateBlurBtn) app.upload.updateBlurBtn();
                if (app.upload.resetWm) app.upload.resetWm();
                if (app.upload.resetFilters) app.upload.resetFilters();
            }
        }
    },

    preference: {
                current: 'both',
                tempSelection: 'both',
                load: () => {
                    const saved = localStorage.getItem('vnbus_preference');
                    if (saved) {
                        app.preference.current = saved;
                        return saved;
                    }
                    return null;
                },
                open: (isOnboarding = false) => {
                    app.preference.tempSelection = app.preference.current || 'both';
                    app.settings.open();
                    app.settings.switchTab('preference');
                    app.preference.updateUI();
                },
                
                theme: localStorage.getItem('vnbus_theme') || 'system',
                setTheme: (theme) => {
                    app.preference.theme = theme;
                    localStorage.setItem('vnbus_theme', theme);
                    window.location.reload();
                },
                updateThemeUI: () => {
                    const btnLight = document.getElementById('set-theme-btn-light');
                    const btnDark = document.getElementById('set-theme-btn-dark');
                    const btnSystem = document.getElementById('set-theme-btn-system');
                    if (!btnLight || !btnDark) return;

                    const active = 'theme-option cursor-pointer border border-black bg-black text-white rounded-xl p-5 shadow-md transition-all duration-200 flex flex-col items-center justify-center gap-2 scale-[1.02]';
                    const inactive = 'theme-option cursor-pointer border border-gray-300 bg-white text-gray-800 rounded-xl p-5 shadow-sm transition-all duration-200 flex flex-col items-center justify-center gap-2 scale-100';

                    const cur = app.preference.theme;
                    btnLight.className = cur === 'light' ? active : inactive;
                    btnDark.className = cur === 'dark' ? active : inactive;
                    if (btnSystem) btnSystem.className = cur === 'system' ? active : inactive;

                    // (laptop icon for PC users, mobile phone icon for mobile users)
                    const systemIcon = document.getElementById('set-theme-system-icon');
                    if (systemIcon) {
                        const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
                        systemIcon.classList.remove('fa-laptop', 'fa-mobile-screen');
                        systemIcon.classList.add(isMobileDevice ? 'fa-mobile-screen' : 'fa-laptop');
                    }
                },
select: (val) => {
                    app.preference.tempSelection = val;
                    app.preference.updateUI();
                    if (app.onboarding && app.onboarding.isOpen) {
                        app.onboarding.updatePrefUI();
                    }
                },
                updateUI: () => {
                    if(app.preference.updateThemeUI) app.preference.updateThemeUI();
                    ['bus', 'coach', 'both'].forEach(type => {
                        ['pref-btn-', 'set-pref-btn-'].forEach(prefix => {
                            const btn = document.getElementById(`${prefix}${type}`);
                            if (!btn) return;
                            const iconBg = btn.querySelector('.pref-icon');
                            const p = btn.querySelector('.pref-desc');
                            if (app.preference.tempSelection === type) {
                                btn.className = `pref-option cursor-pointer border border-black bg-black text-white rounded-xl p-4 shadow-md transition-all duration-200 flex items-start gap-3 scale-[1.02]`;
                                iconBg.classList.replace('bg-gray-100', 'bg-white'); iconBg.classList.add('text-black');
                                iconBg.classList.replace('border-transparent', 'border-black');
                                if (p) p.classList.replace('text-gray-500', 'text-gray-300');
                            } else {
                                btn.className = `pref-option cursor-pointer border border-gray-300 bg-white text-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-gray-400 transition-all duration-200 flex items-start gap-3 scale-100`;
                                iconBg.classList.replace('bg-white', 'bg-gray-100'); iconBg.classList.remove('text-black');
                                iconBg.classList.replace('border-black', 'border-transparent');
                                if (p) p.classList.replace('text-gray-300', 'text-gray-500');
                            }
                        });
                    });
                },
                save: () => {
                    const isChanged = app.preference.current !== app.preference.tempSelection;
                    app.preference.current = app.preference.tempSelection;
                    localStorage.setItem('vnbus_preference', app.preference.current);
                    if (app.user) {
                        const curWmMode = localStorage.getItem('vnbus_wm_mode') || (app.wmState && app.wmState.mode) || 'basic';
                        window.sb.from('profiles').select('preferences').eq('id', app.user.id).single().then(({data}) => {
                            const existingPrefs = (data && data.preferences) ? data.preferences : {};
                            existingPrefs.type = app.preference.current;
                            existingPrefs.wmMode = curWmMode;
                            existingPrefs.pinnedLocations = app.preference.pinnedLocations || [];
                            delete existingPrefs.wmRotate;
                            delete existingPrefs.wmScale;
                            if (app.wmState && app.wmState.barScale !== undefined) existingPrefs.wmBarScale = app.wmState.barScale;
                            window.sb.from('profiles').update({ preferences: existingPrefs }).eq('id', app.user.id).then(()=>{});
                        });
                    }
                    app.ui.showAlert("Đã lưu thông tin Cá nhân hóa thành công!");
                    if (isChanged) {
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


window.addEventListener('keydown', (e) => {
    const cropModal = document.getElementById('crop-modal');
    if (!cropModal || cropModal.classList.contains('hidden') || !app.crop) return;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target && e.target.tagName)) return;
    if (e.key === '=' || e.key === '+' || e.key === '-') {
        e.preventDefault();
        const isZoomIn = (e.key === '=' || e.key === '+');
        const zoomFactor = e.ctrlKey ? (isZoomIn ? 1.15 : 1/1.15) : (isZoomIn ? 1.02 : 1/1.02);
        app.crop.state.scale *= zoomFactor;
        if (app.crop.state.scale < app.crop.state.minScale) {
            app.crop.state.scale = app.crop.state.minScale;
        }
        if (app.crop.state.scale > 5) {
            app.crop.state.scale = 5;
        }
        app.crop.applyTransform();
        return;
    }
    let dx = 0, dy = 0;
    const step = e.ctrlKey ? 20 : 1;
    if (e.key === 'ArrowLeft') dx = -step;
    else if (e.key === 'ArrowRight') dx = step;
    else if (e.key === 'ArrowUp') dy = -step;
    else if (e.key === 'ArrowDown') dy = step;
    else return;
    e.preventDefault();
    app.crop.state.x -= dx;
    app.crop.state.y -= dy;
    app.crop.applyTransform();
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


