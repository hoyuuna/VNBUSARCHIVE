// Extracted to page_vehicle.js
Object.assign(window.app, {
    vehicle: {
                currentHistoryData: [],
                tempHistory:[],
                currentHistoryPrefix: '',
                VEHICLE_PAGE_SIZE: 12,
                currentPage: 1,
                totalPages: 1,
                totalCount: 0,
                fetchVehiclePhotosPage: async (page) => {
                    const grid = document.getElementById('vehicle-photo-grid');
                    app.vehicle.currentPage = page;
                    const size = app.vehicle.VEHICLE_PAGE_SIZE || 12;
                    const fromRow = (page - 1) * size;
                    const toRow = fromRow + size - 1;
                    if (grid) {
                        grid.style.opacity = '0.5';
                        grid.style.pointerEvents = 'none';
                    }
                    try {
                        const photos = (app.vehiclePhotosCache || []).slice(fromRow, toRow + 1);
                        if (photos && photos.length > 0) {
                            if (grid) grid.innerHTML = photos.map(p => app.views.renderPhotoCard(p)).join('');
                        } else {
                            if (grid) grid.innerHTML = '<div class="col-span-full text-center py-10 text-gray-500">Không tìm thấy ảnh nào.</div>';
                        }
                    } catch (err) {
                        console.error("Lỗi tải trang ảnh xe:", err);
                    } finally {
                        if (grid) {
                            grid.style.opacity = '1';
                            grid.style.pointerEvents = 'auto';
                        }
                    }
                    app.vehicle.renderVehiclePagination();
                },
                renderVehiclePagination: () => {
                    const btnContainer = document.getElementById('vehicle-load-more-container');
                    if (btnContainer) {
                        btnContainer.innerHTML = '';
                        if (app.vehicle.totalPages > 1) {
                            btnContainer.classList.remove('hidden');
                            app.utils.renderPagination('vehicle-load-more-container', app.vehicle.currentPage, app.vehicle.totalPages, (newPage) => {
                                const grid = document.getElementById('vehicle-photo-grid');
                                if (grid) {
                                    const offset = 80; 
                                    const elementPosition = grid.getBoundingClientRect().top;
                                    const offsetPosition = elementPosition + window.pageYOffset - offset;
                                    window.scrollTo({ top: offsetPosition, behavior: "smooth" });
                                }
                                app.vehicle.fetchVehiclePhotosPage(newPage);
                            });
                        } else {
                            btnContainer.classList.add('hidden');
                        }
                    }
                },
                cleanupVehicle: async (plate) => {
                    if (!plate) return;
                    try {
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
                    const tableContainer = document.getElementById(prefix + 'history-table-container');
                    const btnContainer = document.getElementById(prefix + 'btn-edit-history-container');
                    if(ui.classList.contains('hidden')) {
                        ui.classList.remove('hidden');
                        if (tableContainer) tableContainer.classList.add('hidden');
                        if (btnContainer) btnContainer.classList.add('hidden');
                        app.vehicle.tempHistory = JSON.parse(JSON.stringify(app.vehicle.currentHistoryData));
                        app.vehicle.renderEditList(prefix);
                        const btnSaveHist = document.getElementById(prefix ? 'btn-save-veh-history' : 'btn-save-history');
                        if (btnSaveHist) {
                            btnSaveHist.innerText = "Lưu thông tin";
                        }
                    } else {
                        ui.classList.add('hidden');
                        if (tableContainer) tableContainer.classList.remove('hidden');
                        if (btnContainer) btnContainer.classList.remove('hidden');
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
                    const container = document.getElementById(prefix + 'sortable-history');
                    container.innerHTML = '';
                    app.vehicle.tempHistory.forEach((h, index) => {
                        const isStopped = (h.route || '').trim() === 'Dừng hoạt động';
                        if (isStopped) h.operator = 'N/A';
                        const div = document.createElement('div');
                        div.className = "flex flex-col gap-2 bg-white p-3 border border-gray-200 rounded-md text-xs mb-2";
                        div.innerHTML = `
                            <div class="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                                <div class="flex flex-col sm:flex-1 min-w-0">
                                    <span class="sm:hidden font-bold text-gray-500 mb-1">Biển số</span>
                                    <input type="text" value="${app.utils.escapeAttr(h.plate || app.currentPlate || '')}" placeholder="Biển số" oninput="app.utils.formatPlateInput(this)" onchange="app.vehicle.updateHistoryItem(${index}, 'plate', this.value, '${prefix}')" class="hist-input">
                                </div>
                                <div class="flex flex-col sm:flex-1 min-w-0">
                                    <span class="sm:hidden font-bold text-gray-500 mb-1">Ngày áp dụng</span>
                                    <input type="text" placeholder="DD/MM/YYYY" maxlength="10" oninput="app.utils.formatDateInput(this)" value="${app.utils.escapeAttr(app.utils.formatDateToDDMMYYYY(h.effective_date) || '')}" onchange="app.vehicle.updateHistoryItem(${index}, 'effective_date', this.value, '${prefix}')" class="hist-input text-center font-mono w-28">
                                </div>
                                <div id="${prefix}hist-op-wrapper-${index}" class="flex flex-col sm:flex-1 min-w-0 ${isStopped ? 'hidden' : ''}">
                                      <span class="sm:hidden font-bold text-gray-500 mb-1">Đơn vị</span>
                                      <input id="${prefix}hist-op-input-${index}" type="text" value="${app.utils.escapeAttr(h.operator)}" placeholder="Đơn vị" oninput="app.utils.formatNoPunctuation(this)" onchange="app.vehicle.updateHistoryItem(${index}, 'operator', this.value, '${prefix}')" class="hist-input ${isStopped ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}" ${isStopped ? 'disabled' : ''}>
                                  </div>
                                  <div class="flex flex-col sm:flex-1 min-w-0">
                                      <span class="sm:hidden font-bold text-gray-500 mb-1">Tuyến</span>
                                      <input type="text" value="${app.utils.escapeAttr(h.route || '')}" placeholder="Tuyến" oninput="app.utils.checkRouteStatus(this.value, '${prefix}hist-op-input-${index}', '${prefix}hist-op-wrapper-${index}')" onchange="app.vehicle.updateHistoryItem(${index}, 'route', this.value, '${prefix}'); app.vehicle.updateHistoryItem(${index}, 'operator', document.getElementById('${prefix}hist-op-input-${index}').value, '${prefix}')" class="hist-input">
                                  </div>
                            </div>
                            <div class="flex flex-col sm:flex-row gap-2 items-start mt-1">
                                <div class="flex flex-col flex-1 min-w-0 w-full">
                                    <span class="sm:hidden font-bold text-gray-500 mb-1">Ghi chú</span>
                                    <textarea placeholder="Ghi chú" oninput="this.style.height = 'auto'; this.style.height = (this.scrollHeight + (this.offsetHeight - this.clientHeight)) + 'px'" onchange="app.vehicle.updateHistoryItem(${index}, 'note', this.value, '${prefix}')" class="hist-input resize-y min-h-[50px] p-2 overflow-hidden w-full">${app.utils.escapeHtml(h.note || '')}</textarea>
                                </div>
                                <div class="flex justify-end gap-2 mt-2 sm:mt-0 w-full sm:w-auto h-full">
                                    <button type="button" onclick="app.vehicle.duplicateHistoryItem(${index}, '${prefix}')" class="text-gray-700 hover:text-white hover:bg-black border border-gray-300 rounded-md px-3 py-2 font-bold transition min-h-[42px]" title="Nhân bản"><i class="fa-solid fa-copy"></i></button>
                                    <button type="button" onclick="app.vehicle.removeHistoryItem(${index}, '${prefix}')" class="text-gray-700 hover:text-white hover:bg-black border border-gray-300 rounded-md px-3 py-2 font-bold transition min-h-[42px]" title="Xóa"><i class="fa-solid fa-trash"></i></button>
                                </div>
                            </div>
                        `;
                        container.appendChild(div);
                    });
                    setTimeout(() => {
                        container.querySelectorAll('textarea.resize-y').forEach(ta => {
                            ta.style.height = 'auto';
                            ta.style.height = (ta.scrollHeight + (ta.offsetHeight - ta.clientHeight)) + 'px';
                        });
                    }, 150);
                    if (app.vehicle.tempHistory.length > 0) {
                        const latest = app.vehicle.tempHistory[app.vehicle.tempHistory.length - 1];
                        const opInput = document.getElementById(prefix + 'hist-new-op');
                        const routeInput = document.getElementById(prefix + 'hist-new-route');
                        const plateInput = document.getElementById(prefix + 'hist-new-plate');
                        if (opInput && !opInput.value) opInput.value = latest.operator || '';
                        if (routeInput && !routeInput.value) routeInput.value = latest.route || '';
                        if (plateInput && !plateInput.value) plateInput.value = latest.plate || app.currentPlate || '';
                        if (routeInput) app.utils.checkRouteStatus(routeInput.value, prefix + 'hist-new-op', prefix + 'hist-new-op-wrapper');
                    }
                },
                updateHistoryItem: (index, field, value, prefix) => {
                    if (field === 'effective_date') {
                        const parsed = app.utils.parseDDMMYYYYToDate(value);
                        if (!parsed && value.trim() !== '') {
                            app.ui.showAlert("Ngày không hợp lệ! Vui lòng nhập đúng định dạng DD/MM/YYYY (ví dụ: 15/08/2023).");
                            return app.vehicle.renderEditList(prefix);
                        }
                        app.vehicle.tempHistory[index][field] = parsed || '';
                    } else {
                        app.vehicle.tempHistory[index][field] = value;
                    }
                },
                duplicateHistoryItem: (index, prefix) => {
                    const item = app.vehicle.tempHistory[index];
                    app.vehicle.tempHistory.push({ ...item });
                    app.vehicle.renderEditList(prefix);
                },
                addHistoryItem: (prefix = '') => {
                    const rawDate = document.getElementById(prefix + 'hist-new-date').value;
                    const dateVal = app.utils.parseDDMMYYYYToDate(rawDate);
                    const op = document.getElementById(prefix + 'hist-new-op').value;
                    const route = document.getElementById(prefix + 'hist-new-route').value;
                    const note = document.getElementById(prefix + 'hist-new-note') ? document.getElementById(prefix + 'hist-new-note').value : '';
                    const plate = document.getElementById(prefix + 'hist-new-plate') ? document.getElementById(prefix + 'hist-new-plate').value.trim() : '';
                    if(!rawDate || !op) return app.ui.showAlert("Vui lòng nhập Ngày áp dụng và Đơn vị vận hành!");
                    if(!dateVal) return app.ui.showAlert("Ngày không hợp lệ! Vui lòng nhập đúng định dạng DD/MM/YYYY.");
                    app.vehicle.tempHistory.push({
                        license_plate: app.currentPlate,
                        plate: plate || app.currentPlate || null,
                        effective_date: dateVal,
                        operator: op,
                        route: route,
                        note: note
                    });
                    document.getElementById(prefix + 'hist-new-date').value = '';
                    if(document.getElementById(prefix + 'hist-new-plate')) document.getElementById(prefix + 'hist-new-plate').value = '';
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
                            if (prev.operator === curr.operator && prev.route === curr.route && prev.note === curr.note && (prev.plate || '') === (curr.plate || '')) {
                                return app.ui.showAlert(`Lỗi: Có 2 mốc lịch sử cạnh nhau có thông tin (Biển số, Đơn vị, Tuyến, Ghi chú) giống hệt nhau. Hệ thống đã chặn để tránh rác dữ liệu. Vui lòng gộp chung hoặc xóa bớt 1 mục.`);
                            }
                        }
                        const origClean = JSON.stringify((app.vehicle.currentHistoryData || []).map(h => ({op: h.operator, rt: h.route, nt: h.note, dt: h.effective_date, pl: h.plate || ''})));
                        const tempClean = JSON.stringify(app.vehicle.tempHistory.map(h => ({op: h.operator, rt: h.route, nt: h.note, dt: h.effective_date, pl: h.plate || ''})));
                        if (origClean === tempClean) {
                            return app.ui.showAlert("Không có sự thay đổi nào so với dữ liệu gốc. Yêu cầu bị hủy.");
                        }
                        if (app.role !== 'admin' && app.role !== 'manager') {
                            try { await app.captcha.request(); } catch (err) { if (err.message !== "CAPTCHA_CANCELLED") app.ui.showAlert("Lỗi xác thực Captcha."); return; }
                        }
                        const payload = app.vehicle.tempHistory.map((h, i) => ({
                            license_plate: app.currentPlate,
                            plate: (h.plate && h.plate.trim()) ? h.plate.trim() : (app.currentPlate || null),
                            operator: h.operator,
                            route: h.route,
                            note: h.note,
                            effective_date: h.effective_date || null,
                            display_order: i
                        }));
                        if(app.role === 'admin' || app.role === 'manager') {
                            try {
                                const currentPlate = app.currentPlate;
                                const newHistoryPlates = [...new Set(payload.map(p => p.plate).filter(p => p && p !== currentPlate))];
                                const { data: unmergeCandidates } = await window.sb.from('vehicles').select('license_plate, note').like('note', `%[MERGED_INTO:${currentPlate}]%`);
                                if (unmergeCandidates) {
                                    for (const v of unmergeCandidates) {
                                        if (!newHistoryPlates.includes(v.license_plate)) {
                                            const newNote = (v.note || '').replace(`[MERGED_INTO:${currentPlate}]`, '').trim();
                                            await window.sb.from('vehicles').update({ note: newNote }).eq('license_plate', v.license_plate);
                                            app.toast.show('info', 'Đã tách xe', `Hồ sơ xe ${v.license_plate} đã được khôi phục thành hồ sơ độc lập.`);
                                        }
                                    }
                                }
                                if (newHistoryPlates.length > 0) {
                                    const { data: existingOldVehicles } = await window.sb.from('vehicles').select('license_plate, note').in('license_plate', newHistoryPlates);
                                    if (existingOldVehicles && existingOldVehicles.length > 0) {
                                        for (const v of existingOldVehicles) {
                                            const noteStr = v.note || '';
                                            if (!noteStr.includes(`[MERGED_INTO:${currentPlate}]`)) {
                                                const newNote = (noteStr + ` [MERGED_INTO:${currentPlate}]`).trim();
                                                await window.sb.from('vehicles').update({ note: newNote }).eq('license_plate', v.license_plate);
                                                app.toast.show('info', 'Đã gộp xe', `Dữ liệu từ xe ${v.license_plate} đã được tự động gộp sang xe này.`);
                                            }
                                        }
                                    }
                                }
                                await window.sb.from('vehicle_history').delete().eq('license_plate', app.currentPlate);
                                if (payload.length > 0) await window.sb.from('vehicle_history').insert(payload);
                                app.toast.show('success', 'Đã cập nhật', 'Lịch sử hoạt động của xe đã được lưu thành công.');
                                app.vehicle.toggleEditHistory(app.vehicle.currentHistoryPrefix);
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
                                const { count, error: checkErr } = await window.sb.from('edit_requests').select('*', { count: 'estimated', head: true }).eq('license_plate', app.currentPlate).eq('status', 'pending').contains('new_data', { request_type: 'update_history' });
                                if (count > 0) return app.ui.showAlert("Có yêu cầu chỉnh sửa lịch sử khác đang chờ duyệt cho xe này. Vui lòng thử lại sau.");
                                const reqData = {
                                    requester_id: app.user.id,
                                    license_plate: app.currentPlate,
                                    new_data: { request_type: 'update_history', history_items: payload },
                                    status: 'pending'
                                };
                                const { error } = await window.sb.from('edit_requests').insert(reqData);
                                if (error) throw error;
                                app.ui.showAlert("Yêu cầu cập nhật lịch sử đã được gửi và chờ Admin duyệt. Bạn có thể kiểm tra trạng thái trong trang Hồ sơ của tôi.");
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
                            { title: "Xác nhận xóa", btnOkText: "Đồng ý", btnCancelText: "Hủy bỏ" }
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
                                const { count } = await window.sb.from('vehicle_history').select('*', { count: 'estimated', head: true }).eq('license_plate', plate);
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
                        if (id === 'vehicle-edit-note') {
                            const displayDiv = document.getElementById('vehicle-note-display');
                            if (!input.readOnly) {
                                if (displayDiv) displayDiv.classList.add('hidden');
                                input.classList.remove('hidden', 'cursor-not-allowed');
                                input.classList.add('bg-white', 'focus:ring-2', 'focus:ring-black', 'block');
                            } else {
                                if (displayDiv) displayDiv.classList.remove('hidden');
                                input.classList.add('hidden', 'cursor-not-allowed');
                                input.classList.remove('bg-white', 'focus:ring-2', 'focus:ring-black', 'block');
                            }
                        } else {
                            if (!input.readOnly) {
                                 input.classList.add('bg-white', 'focus:ring-2', 'focus:ring-black');
                                 input.classList.remove('bg-gray-50', 'cursor-not-allowed');
                            } else {
                                 input.classList.remove('bg-white', 'focus:ring-2', 'focus:ring-black');
                                 input.classList.add('bg-gray-50', 'cursor-not-allowed');
                            }
                        }
                    });
                    if (actionsDiv.classList.contains('hidden')) {
                        actionsDiv.classList.remove('hidden');
                        actionsDiv.classList.add('flex');
                        if (triggerContainer) triggerContainer.classList.add('hidden');
                        if (app.role === 'admin' || app.role === 'manager') document.getElementById('btn-vehicle-save').innerText = "Lưu thông tin";
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
                    if (app.currentVehicle && newData.model === (app.currentVehicle.model || '') && newData.note === (app.currentVehicle.note || '')) {
                        btnSave.disabled = false; btnSave.innerHTML = 'Lưu thông tin';
                        return app.ui.showAlert("Không có sự thay đổi nào so với dữ liệu gốc. Yêu cầu bị hủy.");
                    }
                    if (app.role !== 'admin' && app.role !== 'manager') {
                        try { await app.captcha.request(); } catch (err) {
                            if (err.message !== "CAPTCHA_CANCELLED") app.ui.showAlert("Lỗi xác thực Captcha.");
                            btnSave.disabled = false; btnSave.innerHTML = 'Lưu thông tin';
                            return;
                        }
                    }
                    try {
                        if (newData.model && await app.utils.checkModelDuplicatePolicy(plate, newData.model)) {
                            btnSave.disabled = false; btnSave.innerHTML = 'Lưu thông tin';
                            return;
                        }
                        if (app.role === 'admin' || app.role === 'manager') {
                            const { error } = await window.sb.from('vehicles').upsert({ license_plate: plate, ...newData }, { onConflict: 'license_plate' });
                            if (error) throw error;
                            app.toast.show('success', 'Đã lưu thay đổi', 'Thông tin xe đã được cập nhật thành công.');
                            app.views.loadVehiclePage(plate, true);
                        } else {
                            const { count } = await window.sb.from('edit_requests').select('*', { count: 'estimated', head: true }).eq('license_plate', plate).eq('status', 'pending').contains('new_data', { request_type: 'update_vehicle_details' });
                            if (count > 0) {
                                btnSave.disabled = false; btnSave.innerHTML = 'Lưu thông tin';
                                return app.ui.showAlert("Có yêu cầu chỉnh sửa hồ sơ khác đang chờ duyệt cho xe này. Vui lòng thử lại sau.");
                            }
                            const { error } = await window.sb.from('edit_requests').insert({
                                requester_id: app.user.id, license_plate: plate, new_data: { ...newData, request_type: 'update_vehicle_details' }, status: 'pending'
                            });
                            if (error) throw error;
                            app.ui.showAlert("Đã gửi yêu cầu chỉnh sửa và đang chờ Admin duyệt. Bạn có thể kiểm tra trạng thái trong trang Hồ sơ của tôi.");
                            app.vehicle.toggleVehiclePageEdit(plate);
                        }
                    } catch (err) { app.ui.showAlert("Lỗi: " + err.message); } finally { btnSave.disabled = false; btnSave.innerHTML = 'Lưu thông tin'; }
                }
            }
});
