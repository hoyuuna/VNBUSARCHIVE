// Extracted to page_reference.js
Object.assign(window.app, {
    operator: {
                modelStatsData: [],
                modelStatsTotals: {},
                isModelTableExpanded: false,
                renderModelTable: () => {
                    const tbody = document.getElementById('op-model-tbody');
                    const btnExpand = document.getElementById('btn-op-model-expand');
                    const data = app.operator.modelStatsData;
                    const totals = app.operator.modelStatsTotals;
                    const isExpanded = app.operator.isModelTableExpanded;
                    const displayData = isExpanded ? data : data.slice(0, 5);
                    tbody.innerHTML = displayData.map(m => `
                        <tr class="hover:bg-gray-50 transition group">
                            <td class="font-medium text-gray-700 max-w-[200px] border-r border-gray-200" title="${app.utils.cleanText(m.name)}">
                                <div class="overflow-x-auto whitespace-nowrap no-scrollbar">
                                    <span onclick="app.utils.navigate('/model/${encodeURIComponent(m.name)}')" class="cursor-pointer hover:text-black hover:underline font-bold transition">
                                        ${app.utils.cleanText(m.name)}
                                    </span>
                                </div>
                            </td>
                            <td class="text-center font-bold text-black border-r border-gray-200">${m.active > 0 ? m.active : ''}</td>
                            <td class="text-center font-bold text-black border-r border-gray-200">${m.inactive > 0 ? m.inactive : ''}</td>
                            <td class="text-center font-black text-black">${m.total}</td>
                        </tr>
                    `).join('');
                    document.getElementById('op-model-total-active').innerText = totals.active > 0 ? totals.active : '';
                    document.getElementById('op-model-total-inactive').innerText = totals.inactive > 0 ? totals.inactive : '';
                    document.getElementById('op-model-total-all').innerText = totals.all;
                    if (data.length <= 5) {
                        btnExpand.classList.add('hidden');
                    } else {
                        btnExpand.classList.remove('hidden');
                        if (isExpanded) {
                            btnExpand.innerHTML = 'Thu gọn danh sách <i class="fa-solid fa-chevron-up ml-1"></i>';
                        } else {
                            btnExpand.innerHTML = 'Xem toàn bộ danh sách <i class="fa-solid fa-chevron-down ml-1"></i>';
                        }
                    }
                },
                toggleModelTable: () => {
                    app.operator.isModelTableExpanded = !app.operator.isModelTableExpanded;
                    app.operator.renderModelTable(); 
                },
                switchTab: (tab) => {
                    const btnModel = document.getElementById('op-tab-model');
                    const btnRoute = document.getElementById('op-tab-route');
                    const contentModel = document.getElementById('op-tab-content-model');
                    const contentRoute = document.getElementById('op-tab-content-route');
                    if (tab === 'model') {
                        btnModel.className = "px-4 py-2 font-bold text-sm bg-black text-white rounded-md whitespace-nowrap transition-all shadow-sm";
                        btnRoute.className = "px-4 py-2 font-bold text-sm bg-transparent text-gray-500 hover:bg-gray-100 hover:text-black rounded-md whitespace-nowrap transition-all";
                        contentModel.classList.remove('hidden');
                        contentRoute.classList.add('hidden');
                    } else {
                        btnRoute.className = "px-4 py-2 font-bold text-sm bg-black text-white rounded-md whitespace-nowrap transition-all shadow-sm";
                        btnModel.className = "px-4 py-2 font-bold text-sm bg-transparent text-gray-500 hover:bg-gray-100 hover:text-black rounded-md whitespace-nowrap transition-all";
                        contentRoute.classList.remove('hidden');
                        contentModel.classList.add('hidden');
                    }
                },
                renderRouteTable: () => {
                    const tbody = document.getElementById('op-route-tbody');
                    const btnExpand = document.getElementById('btn-op-route-expand');
                    const data = app.operator.routeStatsData || [];
                    const isExpanded = app.operator.isRouteTableExpanded;
                    const displayData = isExpanded ? data : data.slice(0, 5);
                    tbody.innerHTML = displayData.map(r => `
                        <tr class="hover:bg-gray-50 transition group">
                            <td class="font-medium text-gray-700 max-w-[200px] border-r border-gray-200" title="${app.utils.cleanText(r.displayName || r.route)}">
                                <div class="overflow-x-auto whitespace-nowrap no-scrollbar">
                                    <span onclick="if(${r.isCoach ? 'true' : 'false'}) { app.searchRedirect('${app.utils.escapeAttr(r.route)}', 'route'); } else { app.utils.navigate('${r.prov ? '/route/' + encodeURIComponent(r.prov) + '/' + encodeURIComponent(r.route) : '/route/' + encodeURIComponent(r.route)}'); }" class="cursor-pointer hover:underline font-bold transition text-black">
                                        ${app.utils.cleanText(r.displayName || r.route)}
                                    </span>
                                </div>
                            </td>
                            <td class="text-center font-bold text-black border-r border-gray-200">${r.vehicleCount}</td>
                            <td class="text-center text-black max-w-[150px]" title="${r.mainModel || 'Chưa xác định'}">
                                <div class="overflow-x-auto whitespace-nowrap no-scrollbar">
                                    <span onclick="if('${r.mainModel || 'Chưa xác định'}' !== 'Chưa xác định') app.utils.navigate('/model/${encodeURIComponent(r.mainModel || '')}')" class="${r.mainModel && r.mainModel !== 'Chưa xác định' ? 'cursor-pointer hover:underline transition' : ''}">
                                        ${r.mainModel || 'Chưa xác định'}
                                    </span>
                                </div>
                            </td>
                        </tr>
                    `).join('');
                    document.getElementById('op-route-total-all').innerText = data.length;
                    if (data.length <= 5) {
                        btnExpand.classList.add('hidden');
                    } else {
                        btnExpand.classList.remove('hidden');
                        if (isExpanded) {
                            btnExpand.innerHTML = 'Thu gọn danh sách <i class="fa-solid fa-chevron-up ml-1"></i>';
                        } else {
                            btnExpand.innerHTML = 'Xem toàn bộ danh sách <i class="fa-solid fa-chevron-down ml-1"></i>';
                        }
                    }
                },
                toggleRouteTable: () => {
                    app.operator.isRouteTableExpanded = !app.operator.isRouteTableExpanded;
                    app.operator.renderRouteTable();
                },
                openEditPrompt: async () => {
                    if (!app.user) return app.auth.check();
                    const modal = document.getElementById('operator-edit-modal');
                    const content = document.getElementById('operator-edit-content');
                    const btnSave = document.getElementById('btn-save-operator');
                    const warningText = content.querySelector('p.text-xs');
                    document.getElementById('op-edit-logo').value = '';
                    document.getElementById('op-edit-desc').value = '';
                    document.getElementById('op-edit-parent').value = '';
                    document.getElementById('op-edit-inactive').checked = false;
                    if (app.role === 'admin' || app.role === 'manager') {
                        btnSave.innerText = "Lưu thông tin";
                        warningText.innerHTML = "";
                    } else {
                        btnSave.innerText = "Lưu thông tin";
                        warningText.innerText = "Thông tin này sẽ được kiểm duyệt bởi Admin. Việc để trống cả 2 ô sẽ gửi yêu cầu xóa thông tin hiện tại.";
                    }
                    try {
                        const { data: opInfo } = await window.sb.from('operator_info').select('operator_name, logo_url, description, parent_operator').eq('operator_name', app.currentOperator).maybeSingle();
                        if (opInfo) {
                            document.getElementById('op-edit-logo').value = opInfo.logo_url || '';
                            let desc = opInfo.description || '';
                            if (desc.startsWith('[STOPPED]')) {
                                document.getElementById('op-edit-inactive').checked = true;
                                desc = desc.replace(/^\[STOPPED\]\s*/, '');
                            }
                            document.getElementById('op-edit-desc').value = desc;
                            document.getElementById('op-edit-parent').value = opInfo.parent_operator || '';
                        }
                    } catch(e) {}
                    modal.classList.remove('hidden');
                    app.ui.lockScroll();
                    setTimeout(() => {
                        content.classList.remove('opacity-0', 'scale-95');
                        content.classList.add('opacity-100', 'scale-100');
                    }, 10);
                },
                closeEditPrompt: () => {
                    const modal = document.getElementById('operator-edit-modal');
                    const content = document.getElementById('operator-edit-content');
                    content.classList.remove('opacity-100', 'scale-100');
                    content.classList.add('opacity-0', 'scale-95');
                    setTimeout(() => {
                        modal.classList.add('hidden');
                        app.ui.unlockScroll();
                    }, 200);
                },
                submitEdit: async () => {
                    if (!app.user) return;
                    const logo = document.getElementById('op-edit-logo').value.trim();
                    let desc = document.getElementById('op-edit-desc').value.trim();
                    const parentOp = document.getElementById('op-edit-parent').value.trim();
                    const isInactive = document.getElementById('op-edit-inactive').checked;
                    const btn = document.getElementById('btn-save-operator');
                    if (isInactive) {
                        desc = '[STOPPED] ' + desc;
                    }
                    const executeSave = async () => {
                        if (logo) {
                            if (!/^https?:\/\//i.test(logo)) {
                                return app.ui.showAlert("Logo URL phải bắt đầu bằng http:// hoặc https://");
                            }
                            const origTextTemp = btn.innerHTML;
                            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang kiểm tra ảnh...';
                            btn.disabled = true;
                            const isValidImg = await new Promise(resolve => {
                                const img = new Image();
                                img.onload = () => resolve(true);
                                img.onerror = () => resolve(false);
                                img.src = logo.includes('wsrv.nl') ? logo : 'https://wsrv.nl/?url=' + encodeURIComponent(logo);
                            });
                            if (!isValidImg) {
                                btn.innerHTML = origTextTemp;
                                btn.disabled = false;
                                return app.ui.showAlert("Không thể tải được ảnh từ đường dẫn Logo bạn đã nhập (Hoặc máy chủ ảnh từ chối truy cập).");
                            }
                            btn.innerHTML = origTextTemp;
                            btn.disabled = false;
                        }
                        if (parentOp) {
                            if (parentOp.includes(';') && parentOp.split(';').length !== parentOp.split('; ').length) {
                                return app.ui.showAlert("Sai cấu trúc: Các ĐVVH phải được ngăn cách bằng dấu chấm phẩy và một khoảng trắng (Ví dụ: 'Công ty A; Công ty B').");
                            }
                            const parents = parentOp.split(';').map(s => s.trim()).filter(Boolean);
                            for (const p of parents) {
                                if (p.toLowerCase() === app.currentOperator.toLowerCase()) {
                                    return app.ui.showAlert(`ĐVVH mẹ không thể là chính nó (${p}).`);
                                }
                            }
                        }
                        if (app.role !== 'admin' && app.role !== 'manager') {
                            try {
                                await app.captcha.request();
                            } catch (err) {
                                if (err.message !== "CAPTCHA_CANCELLED") app.ui.showAlert("Lỗi xác thực Captcha.");
                                return;
                            }
                        }
                        const origText = btn.innerHTML;
                        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...';
                        btn.disabled = true;
                        try {
                            if (enteredPlates.length > 0) {
                                const { data: existVeh, error: existErr } = await window.sb.from('vehicles').select('license_plate').in('license_plate', enteredPlates);
                                if (existErr) throw existErr;
                                const existingP = existVeh.map(v => v.license_plate.toUpperCase());
                                const invalidP = enteredPlates.filter(p => !existingP.includes(p.toUpperCase()));
                                if (invalidP.length > 0) {
                                    btn.innerHTML = origText;
                                    btn.disabled = false;
                                    return app.ui.showAlert(`Lỗi: Các biển số xe sau không tồn tại trên hệ thống: ${invalidP.join(', ')}`);
                                }
                            }
                            if (app.role === 'admin' || app.role === 'manager') {
                                if (!logo && !desc && !parentOp) {
                                    const { error } = await window.sb.from('operator_info').delete().eq('operator_name', app.currentOperator);
                                    if (error) throw error;
                                } else {
                                    const { error } = await window.sb.from('operator_info').upsert({
                                        operator_name: app.currentOperator,
                                                                                description: desc || null,
                                        parent_operator: parentOp || null
                                    });
                                    if (error) throw error;
                                }
                                app.toast.show('success', 'Thành công', 'Đã lưu thông tin Đơn vị vận hành!');
                                app.operator.closeEditPrompt();
                                app.views.loadOperatorPage(app.currentOperator);
                                if (app.admin && app.admin.logAction) {
                                    app.admin.logAction('update_operator_direct', app.currentOperator, { logo_url: null, description: desc, parent_operator: parentOp });
                                }
                            } else {
                                const { count, error: checkErr } = await window.sb.from('edit_requests')
                                    .select('*', { count: 'estimated', head: true })
                                    .eq('status', 'pending')
                                    .contains('new_data', { request_type: 'update_operator_info', operator_name: app.currentOperator });
                                if (checkErr) throw checkErr;
                                if (count > 0) {
                                    throw new Error("Đã có một yêu cầu cập nhật thông tin cho đơn vị này đang chờ duyệt. Vui lòng đợi!");
                                }
                                const reqData = {
                                    requester_id: app.user.id,
                                    license_plate: 'OP_INFO',
                                    new_data: {
                                        request_type: 'update_operator_info',
                                        operator_name: app.currentOperator,
                                        description: desc,
                                                                                parent_operator: parentOp
                                    },
                                    status: 'pending'
                                };
                                const { error } = await window.sb.from('edit_requests').insert(reqData);
                                if (error) throw error;
                                app.ui.showAlert("Đã gửi yêu cầu cập nhật thông tin đơn vị vận hành và đang chờ Admin duyệt. Bạn có thể kiểm tra trạng thái trong trang Hồ sơ của tôi.");
                                app.operator.closeEditPrompt();
                            }
                        } catch (err) {
                            app.ui.showAlert("Lỗi: " + err.message);
                        } finally {
                            btn.innerHTML = origText;
                            btn.disabled = false;
                        }
                    };
                    executeSave();
                }
            },

    model: {
                currentModel: '',
                modelLoadedCount: 0,
                modelPhotos: [],
                MODEL_PAGE_SIZE: 12,
                loadModelPage: async (modelName, forceRefresh = false) => {
                    const decodedPath = decodeURIComponent(window.location.pathname);
                    if (decodedPath !== `/model/${modelName}`) {
                        app.utils.navigate(`/model/${encodeURIComponent(modelName)}`);
                        return;
                    }
                    app.views.switch('model-view', false);
                    if (app.model.currentModel === modelName && app.model.modelPhotos && app.model.modelPhotos.length > 0 && !forceRefresh) {
                        app.loadingBar.finish();
                        return;
                    }
                    document.title = `${modelName} | VNBUSARCHIVE`;
                    app.model.currentModel = modelName;
                    app.model.modelLoadedCount = 0;
                    app.model.totalPages = 0;
                    document.getElementById('crumb-model-profile').innerText = modelName;
                    document.getElementById('model-profile-title').innerText = modelName;
                    document.getElementById('model-logo').classList.add('hidden');
                    document.getElementById('model-logo-fallback').classList.remove('hidden');
                    document.getElementById('model-desc').classList.add('hidden');
                    document.getElementById('mdl-stat-photos').innerText = '...';
                    document.getElementById('mdl-stat-vehicles').innerText = '...';
                    document.getElementById('mdl-stat-ops').innerText = '...';
                    document.getElementById('mdl-stat-ops').innerText = '...';
                    document.getElementById('mdl-stat-views').innerText = '...';
                    document.getElementById('mdl-stats-grid').classList.remove('hidden');
                    const grid = document.getElementById('model-photo-grid');
                    grid.innerHTML = '<div class="col-span-full text-center py-10 text-gray-500"><i class="fa-solid fa-circle-notch fa-spin"></i> Đang tổng hợp dữ liệu...</div>';
                    document.getElementById('model-load-more-container').innerHTML = '';
                    document.getElementById('model-load-more-container').classList.add('hidden');
                    try {
                        const brandName = modelName.split(' ')[0];
                        const { data: exactInfo } = await window.sb.from('model_info').select('model_name, logo_url, description').eq('model_name', modelName).maybeSingle();
                        const { data: brandLogoData } = await window.sb.from('model_info')
                            .select('logo_url')
                            .ilike('model_name', `${brandName}%`)
                            .not('logo_url', 'is', null)
                            .limit(1)
                            .maybeSingle();
                        const logoEl = document.getElementById('model-logo');
                        const fallbackEl = document.getElementById('model-logo-fallback');
                        const descEl = document.getElementById('model-desc');
                        if (brandLogoData && brandLogoData.logo_url) {
                            logoEl.src = brandLogoData.logo_url.includes('wsrv.nl') ? brandLogoData.logo_url : 'https://wsrv.nl/?url=' + encodeURIComponent(brandLogoData.logo_url);
                            logoEl.classList.remove('hidden');
                            fallbackEl.classList.add('hidden');
                        } else {
                            logoEl.classList.add('hidden');
                            fallbackEl.classList.remove('hidden');
                        }
                        if (exactInfo && exactInfo.description) {
                            descEl.innerHTML = app.utils.cleanText(exactInfo.description).replace(/\n/g, '<br>');
                            descEl.classList.remove('hidden');
                        } else {
                            descEl.classList.add('hidden');
                        }
                        const stats = await app.utils.getCachedStats('mdl_stats_' + modelName, 10 * 60 * 1000, async () => {
                            const rpc = await app.utils.getModelStats(modelName);
                            if (rpc) return rpc;
                            const { data, error: statsErr } = await window.sb.from('photos')
                                .select('views, license_plate, operator, vehicles!inner(model)')
                                .eq('status', 'approved')
                                .eq('vehicles.model', modelName)
                                .limit(500);
                            if (statsErr) throw statsErr;
                            let totalViews = 0; const pSet = new Set(); const oSet = new Set();
                            (data || []).forEach(p => {
                                totalViews += (p.views || 0);
                                if (p.license_plate) pSet.add(p.license_plate.toUpperCase());
                                if (p.operator && p.operator !== '---') oSet.add(p.operator.toLowerCase());
                            });
                            return { total_photos: data ? data.length : 0, total_views: totalViews, total_vehicles: pSet.size, total_ops: oSet.size };
                        });
                        const statsData = stats; 
                        const totalViews = stats.total_views || 0;
                        const uniquePlates = new Set();
                        if (stats.total_vehicles != null) {
                        }
                        const mdlPhotoCount = stats.total_photos || 0;
                        const mdlVehicleCount = stats.total_vehicles != null ? stats.total_vehicles : 0;
                        const mdlOpCount = stats.total_ops != null ? stats.total_ops : 0;
                        if (!mdlPhotoCount || mdlPhotoCount === 0) {
                            grid.innerHTML = '<div class="col-span-full text-center py-10 text-gray-500">Chưa có ảnh xe nào thuộc dòng này được duyệt trên hệ thống.</div>';
                            document.getElementById('mdl-stat-photos').innerText = '0';
                            document.getElementById('mdl-stat-vehicles').innerText = '0';
                            document.getElementById('mdl-stat-ops').innerText = '0';
                            document.getElementById('mdl-stat-views').innerText = '0';
                            document.getElementById('mdl-stats-grid').classList.add('hidden');
                            app.loadingBar.finish();
                            return;
                        }
                        document.getElementById('mdl-stat-photos').innerText = app.utils.formatCompact(mdlPhotoCount);
                        document.getElementById('mdl-stat-vehicles').innerText = app.utils.formatCompact(mdlVehicleCount);
                        document.getElementById('mdl-stat-ops').innerText = app.utils.formatCompact(mdlOpCount);
                        document.getElementById('mdl-stat-views').innerText = app.utils.formatCompact(totalViews);
                        app.views.modelCurrentPage = 1;
                        const mdlSize = app.views.MODEL_PAGE_SIZE || 12;
                        let pQuery = window.sb.from('photos').select(`id, url, license_plate, operator, type, route_no, taken_at, created_at, uploader_id, note, exif_params, borrowed_route, camera_model, location, status, denial_reason, views, profiles(id, username, role, subroles, ban_status), vehicles!inner(model)`, { count: 'estimated' })
                            .eq('status', 'approved')
                            .eq('vehicles.model', modelName)
                            .order('taken_at', { ascending: false, nullsFirst: false })
                            .order('created_at', { ascending: false });
                        pQuery = app.preference.applyFilter(pQuery);
                        const { data: photos, error, count } = await pQuery.range(0, mdlSize - 1);
                        if (error) throw error;
                        app.model.modelPhotos = photos || [];
                        app.model.totalCount = count || (photos ? photos.length : 0);
                        app.model.totalPages = Math.ceil(app.model.totalCount / mdlSize);
                        if (photos && photos.length > 0) {
                            grid.innerHTML = photos.map(p => app.views.renderPhotoCard(p)).join('');
                        } else {
                            grid.innerHTML = '<div class="col-span-full text-center py-10 text-gray-500">Không tìm thấy ảnh nào.</div>';
                        }
                        app.views.renderModelPagination();
                    } catch (err) {
                        grid.innerHTML = `<div class="col-span-full text-center py-10 text-red-500">Lỗi lấy dữ liệu: ${err.message}</div>`;
                    }
                    app.loadingBar.finish();
                },
                openEditPrompt: async () => {
                    if (!app.user) return app.auth.check();
                    const modal = document.getElementById('model-edit-modal');
                    const content = document.getElementById('model-edit-content');
                    const btnSave = document.getElementById('btn-save-model');
                    const warningText = content.querySelector('p.text-xs');
                    document.getElementById('mdl-edit-logo').value = '';
                    document.getElementById('mdl-edit-desc').value = '';
                    if (app.role === 'admin' || app.role === 'manager') {
                        btnSave.innerText = "Lưu thông tin";
                        warningText.innerHTML = "";
                    } else {
                        btnSave.innerText = "Lưu thông tin";
                        warningText.innerText = "Thông tin này sẽ được kiểm duyệt bởi Admin. Việc để trống cả 2 ô sẽ gửi yêu cầu xóa thông tin hiện tại.";
                    }
                    try {
                        const brandName = app.model.currentModel.split(' ')[0];
                        const { data: exactInfo } = await window.sb.from('model_info').select('description').eq('model_name', app.model.currentModel).maybeSingle();
                        if (exactInfo) document.getElementById('mdl-edit-desc').value = exactInfo.description || '';
                        const { data: brandLogoData } = await window.sb.from('model_info').select('logo_url').ilike('model_name', `${brandName}%`).not('logo_url', 'is', null).limit(1).maybeSingle();
                        if (brandLogoData) document.getElementById('mdl-edit-logo').value = brandLogoData.logo_url || '';
                    } catch(e) {}
                    modal.classList.remove('hidden');
                    app.ui.lockScroll();
                    setTimeout(() => {
                        content.classList.remove('opacity-0', 'scale-95');
                        content.classList.add('opacity-100', 'scale-100');
                    }, 10);
                },
                closeEditPrompt: () => {
                    const modal = document.getElementById('model-edit-modal');
                    const content = document.getElementById('model-edit-content');
                    content.classList.remove('opacity-100', 'scale-100');
                    content.classList.add('opacity-0', 'scale-95');
                    setTimeout(() => {
                        modal.classList.add('hidden');
                        app.ui.unlockScroll();
                    }, 200);
                },
                submitEdit: async () => {
                    if (!app.user) return;
                    const logo = document.getElementById('mdl-edit-logo').value.trim();
                    const desc = document.getElementById('mdl-edit-desc').value.trim();
                    const btn = document.getElementById('btn-save-model');
                    const executeSave = async () => {
                        if (logo) {
                            if (!/^https?:\/\//i.test(logo)) {
                                return app.ui.showAlert("Logo URL phải bắt đầu bằng http:// hoặc https://");
                            }
                            const origTextTemp = btn.innerHTML;
                            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang kiểm tra ảnh...';
                            btn.disabled = true;
                            const isValidImg = await new Promise(resolve => {
                                const img = new Image();
                                img.onload = () => resolve(true);
                                img.onerror = () => resolve(false);
                                img.src = logo.includes('wsrv.nl') ? logo : 'https://wsrv.nl/?url=' + encodeURIComponent(logo);
                            });
                            if (!isValidImg) {
                                btn.innerHTML = origTextTemp;
                                btn.disabled = false;
                                return app.ui.showAlert("Không thể tải được ảnh từ đường dẫn Logo bạn đã nhập (Hoặc máy chủ ảnh từ chối truy cập).");
                            }
                            btn.innerHTML = origTextTemp;
                            btn.disabled = false;
                        }
                        if (app.role !== 'admin' && app.role !== 'manager') {
                            try { await app.captcha.request(); } catch (err) { if (err.message !== "CAPTCHA_CANCELLED") app.ui.showAlert("Lỗi xác thực Captcha."); return; }
                        }
                        const origText = btn.innerHTML;
                        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...';
                        btn.disabled = true;
                        try {
                            const brandName = app.model.currentModel.split(' ')[0];
                            if (app.role === 'admin' || app.role === 'manager') {
                                if (!desc) {
                                    const { error: delErr } = await window.sb.from('model_info').delete().eq('model_name', app.model.currentModel);
                                    if (delErr) throw delErr;
                                } else {
                                    const { error: upsertErr } = await window.sb.from('model_info').upsert({
                                        model_name: app.model.currentModel,
                                                                                description: desc || null
                                    });
                                    if (upsertErr) throw upsertErr;
                                }
                                await window.sb.from('model_info')
                                    .update({ logo_url: null || null })
                                    .ilike('model_name', `${brandName}%`);
                                app.toast.show('success', 'Thành công', 'Đã lưu và đồng bộ thông tin Dòng xe!');
                                app.model.closeEditPrompt();
                                app.model.loadModelPage(app.model.currentModel);
                                if (app.admin && app.admin.logAction) {
                                    app.admin.logAction('update_model_direct', app.model.currentModel, { logo_url: null, description: desc, brand_sync: brandName });
                                }
                            } else {
                                const { count, error: checkErr } = await window.sb.from('edit_requests')
                                    .select('*', { count: 'estimated', head: true })
                                    .eq('status', 'pending')
                                    .contains('new_data', { request_type: 'update_model_info', model_name: app.model.currentModel });
                                if (checkErr) throw checkErr;
                                if (count > 0) throw new Error("Đã có một yêu cầu cập nhật thông tin cho dòng xe này đang chờ duyệt. Vui lòng đợi!");
                                const reqData = {
                                    requester_id: app.user.id,
                                    license_plate: 'MODEL_INFO',
                                    new_data: {
                                        request_type: 'update_model_info',
                                        model_name: app.model.currentModel,
                                        description: desc,
                                        logo_url: null
                                    },
                                    status: 'pending'
                                };
                                const { error } = await window.sb.from('edit_requests').insert(reqData);
                                if (error) throw error;
                                app.ui.showAlert("Đã gửi yêu cầu cập nhật thông tin Dòng xe và đang chờ Admin duyệt. Bạn có thể kiểm tra trạng thái trong trang Hồ sơ của tôi.");
                                app.model.closeEditPrompt();
                            }
                        } catch (err) {
                            app.ui.showAlert("Lỗi: " + err.message);
                        } finally {
                            btn.innerHTML = origText;
                            btn.disabled = false;
                        }
                    };
                    executeSave();
                }
            },

    route: {
                currentProvince: '',
                currentRoute: '',
                routeLoadedCount: 0,
                routePhotos: [],
                ROUTE_PAGE_SIZE: 12,
                loadRoutePage: async (provinceName, routeNo, forceRefresh = false) => {
                    const decodedProvince = decodeURIComponent(provinceName || '');
                    const decodedRoute = decodeURIComponent(routeNo);
                    
if (!decodedProvince || decodedProvince.trim() === '') {
                        app.toast.show('error', 'Lỗi truy cập', 'Tuyến này không tồn tại thông tin tỉnh thành. Nó có thể là xe khách hoặc dữ liệu không hợp lệ nên không được hỗ trợ hồ sơ.');
                        app.utils.navigate('/');
                        return;
                    }

                    // Check for special routes that don't have profiles
                    const specialRoutes = ['Dừng hoạt động', 'Ngoài giờ hoạt động', 'Chưa hoạt động'];
                    if (specialRoutes.includes(decodedRoute)) {
                        app.toast.show('error', 'Tuyến không có hồ sơ', `Tuyến "${decodedRoute}" không có thông tin hồ sơ. Chuyển hướng đến tìm kiếm...`);
                        app.searchRedirect(decodedRoute, 'all');
                        return;
                    }

                    const expectedPath = decodedProvince
                        ? `/route/${encodeURIComponent(decodedProvince)}/${encodeURIComponent(decodedRoute)}`
                        : `/route/${encodeURIComponent(decodedRoute)}`;
                    
                    if (window.location.pathname !== expectedPath) {
                        app.utils.navigate(expectedPath);
                        return;
                    }
                    app.views.switch('route-view', false);
                    
                    if (app.route.currentProvince === decodedProvince && app.route.currentRoute === decodedRoute && app.route.routePhotos && app.route.routePhotos.length > 0 && !forceRefresh) {
                        app.loadingBar.finish();
                        return;
                    }
                    
                    const titleText = decodedProvince ? `Tuyến ${decodedRoute} - ${decodedProvince}` : `Tuyến ${decodedRoute}`;
                    document.title = `${titleText} | VNBUSARCHIVE`;
                    app.route.currentProvince = decodedProvince;
                    app.route.currentRoute = decodedRoute;
                    app.route.routeLoadedCount = 0;
                    app.route.totalPages = 0;
                    
                    document.getElementById('crumb-route-profile').innerText = titleText;
                    document.getElementById('route-profile-title').innerText = decodedRoute;
                    document.getElementById('route-province-label').innerText = decodedProvince ? `Tuyến buýt ${decodedProvince}` : 'Tuyến buýt';
                    
                    
                    
                    
                    document.getElementById('rte-stat-photos').innerText = '...';
                    document.getElementById('rte-stat-vehicles').innerText = '...';
                    
                    document.getElementById('rte-stat-views').innerText = '...';
                    document.getElementById('rte-stats-grid').classList.remove('hidden');
                    
                    const grid = document.getElementById('route-photo-grid');
                    grid.innerHTML = '<div class="col-span-full text-center py-10 text-gray-500"><i class="fa-solid fa-circle-notch fa-spin"></i> Đang tổng hợp dữ liệu...</div>';
                    document.getElementById('route-load-more-container').innerHTML = '';
                    document.getElementById('route-load-more-container').classList.add('hidden');
                    
                    let exactInfo = null;
                    try {
                        const routeName = decodedProvince ? `${decodedRoute} - ${decodedProvince}` : decodedRoute;
                        const { data } = await window.sb.from('route_info').select('description, short_path, is_inactive, metadata').eq('route_name', routeName).maybeSingle();
                        exactInfo = data;
                        let titleText = decodedRoute;
                        let inactiveBadge = '';
                        let iconHtml = '<i class="fa-solid fa-route"></i>';
                        let iconClass = "w-16 h-16 md:w-20 md:h-20 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-3xl shrink-0";

                        if (exactInfo) {
                            if (exactInfo.is_inactive) {
                                inactiveBadge = '<span class="bg-black text-white text-[10px] px-2 py-0.5 rounded font-bold border border-black shrink-0 uppercase tracking-widest ml-2">Dừng hoạt động</span>';
                            }
                            if (exactInfo.short_path) {
                                titleText = `${decodedRoute} (${exactInfo.short_path})`;
                            }
                            const descEl = document.getElementById('route-desc');
                            if (exactInfo.description) {
                                descEl.innerHTML = app.utils.cleanText(exactInfo.description).replace(/\n/g, '<br>');
                                descEl.classList.remove('hidden');
                            } else {
                                descEl.classList.add('hidden');
                            }
                            
                            
                            if (exactInfo.metadata && exactInfo.metadata.icon_type && exactInfo.metadata.icon_type !== 'default') {
                                const type = exactInfo.metadata.icon_type;
                                const shortRouteName = decodedRoute.length <= 5 ? decodedRoute : decodedRoute.substring(0, 5);

                                if (type === 'circle') {
                                    iconClass = "w-16 h-16 md:w-20 md:h-20 rounded-full bg-white flex items-center justify-center shrink-0 border-[3px] border-black overflow-hidden";
                                    await document.fonts.load('400 1em Anton');
                                    const _cp = document.createElement('canvas'); const _xp = _cp.getContext('2d');
                                    _xp.font = '400 100px Anton, sans-serif';
                                    const _mp = _xp.measureText(shortRouteName);
                                    const _sqP = 39; // 95% of inscribed square for w-16 circle
                                    const _scP = Math.min(_sqP / _mp.width, _sqP / (_mp.actualBoundingBoxAscent || 72));
                                    const fSizeP = (_scP * 100).toFixed(1) + 'px';
                                    iconHtml = `<span style="font-weight: 400; font-family: 'Anton', sans-serif; color: #dc2626; font-size: ${fSizeP}; white-space: nowrap; line-height: 1;">${shortRouteName}</span>`;
                                } else if (type === 'trapezoid') {
                                    iconClass = "w-16 h-16 md:w-20 md:h-20 flex flex-col items-center justify-center shrink-0 relative";
                                    await document.fonts.load('400 1em Anton');
                                    const _ct = document.createElement('canvas'); const _xt = _ct.getContext('2d');
                                    _xt.font = '400 100px Anton, sans-serif';
                                    const _mt = _xt.measureText(shortRouteName);
                                    const _sqT = 35; // usable space in trapezoid center
                                    const _scT = Math.min(_sqT / _mt.width, _sqT / (_mt.actualBoundingBoxAscent || 72));
                                    const fSizeT = (_scT * 100).toFixed(1) + 'px';
                                    iconHtml = `
                                    <svg viewBox="0 0 100 100" class="absolute inset-0 w-full h-full overflow-visible drop-shadow-sm" preserveAspectRatio="none">
                                        <polygon points="15,15 85,15 100,85 0,85" fill="white" stroke="black" stroke-width="4" stroke-linejoin="round"/>
                                    </svg>
                                    <span class="relative z-10" style="font-weight: 400; font-family: 'Anton', sans-serif; color: #dc2626; font-size: ${fSizeT}; white-space: nowrap; line-height: 1;">${shortRouteName}</span>`;
                                }
                            }
                            
                            const extraInfoContainer = document.getElementById('route-extra-info');
                            if (extraInfoContainer) {
                                extraInfoContainer.innerHTML = '';
                                let hasExtraInfo = false;
                                if (exactInfo.metadata) {
                                    if (exactInfo.metadata.ticket_price) {
                                        extraInfoContainer.innerHTML += `
                                            <div class="flex items-center gap-3 bg-white rounded-lg p-2.5 shadow-sm border border-gray-100">
                                                <div class="w-7 h-7 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                                                    <i class="fa-solid fa-ticket text-xs"></i>
                                                </div>
                                                <span class="text-xs font-bold text-gray-700">Giá vé lượt: ${app.utils.escapeHtml(exactInfo.metadata.ticket_price)}</span>
                                            </div>
                                        `;
                                        hasExtraInfo = true;
                                    }
                                    if (exactInfo.metadata.headway) {
                                        extraInfoContainer.innerHTML += `
                                            <div class="flex items-center gap-3 bg-white rounded-lg p-2.5 shadow-sm border border-gray-100">
                                                <div class="w-7 h-7 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center shrink-0">
                                                    <i class="fa-solid fa-clock text-xs"></i>
                                                </div>
                                                <span class="text-xs font-bold text-gray-700">Giãn cách, TG hoạt động: ${app.utils.escapeHtml(exactInfo.metadata.headway)}</span>
                                            </div>
                                        `;
                                        hasExtraInfo = true;
                                    }
                                    if (exactInfo.metadata.wheelchair_support) {
                                        extraInfoContainer.innerHTML += `
                                            <div class="flex items-center gap-3 bg-white rounded-lg p-2.5 shadow-sm border border-gray-100">
                                                <div class="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                                    <i class="fa-solid fa-wheelchair text-xs"></i>
                                                </div>
                                                <span class="text-xs font-bold text-gray-700">Có hỗ trợ xe lăn</span>
                                            </div>
                                        `;
                                        hasExtraInfo = true;
                                    }
                                }
                                if (hasExtraInfo) extraInfoContainer.classList.remove('hidden');
                                else extraInfoContainer.classList.add('hidden');
                            }
                        } else {
                            const descEl = document.getElementById('route-desc');
                            if (descEl) descEl.classList.add('hidden');
                            const extraInfoContainer = document.getElementById('route-extra-info');
                            if (extraInfoContainer) {
                                extraInfoContainer.innerHTML = '';
                                extraInfoContainer.classList.add('hidden');
                            }
                        }
                        
                        const logoFallbackEl = document.getElementById('route-logo-fallback');
                        if (logoFallbackEl) {
                            logoFallbackEl.className = iconClass;
                            logoFallbackEl.innerHTML = iconHtml;
                        }
                        
                        document.getElementById('route-profile-title').innerHTML = app.utils.escapeHtml(titleText) + inactiveBadge;
                    } catch (e) {
                        console.warn("Lỗi tải thông tin Tuyến:", e);
                    }
                    
                    try {
                        let pQuery = window.sb.from('photos').select(`id, url, license_plate, operator, type, route_no, taken_at, created_at, uploader_id, note, exif_params, borrowed_route, camera_model, location, status, denial_reason, views, profiles(id, username, role, subroles, ban_status), vehicles(model)`)
                            .eq('status', 'approved')
                            .eq('route_no', decodedRoute);
                            
                        if (decodedProvince) {
                            let prefix = '';
                            if (app.utils.provinceData) {
                                const prov = app.utils.provinceData.find(p => p.ten === decodedProvince);
                                if (prov) {
                                    if (Array.isArray(prov.ky_hieu)) prefix = prov.ky_hieu[0];
                                    else prefix = String(prov.ky_hieu).split(',')[0].trim();
                                }
                            }
                            if (prefix) {
                                const relatedPrefixes = app.utils.getRelatedPrefixes(prefix);
                                const plateFilter = relatedPrefixes.length > 1 ? `or(${relatedPrefixes.map(p => `license_plate.ilike.${p}%`).join(',')})` : `license_plate.ilike.${relatedPrefixes[0]}%`;
                                pQuery = pQuery.or(`borrowed_route.eq."${decodedRoute} - ${decodedProvince}",and(borrowed_route.is.null,${plateFilter})`);
                            } else {
                                pQuery = pQuery.eq('borrowed_route', `${decodedRoute} - ${decodedProvince}`);
                            }
                        }
                        
                        pQuery = app.preference.applyFilter(pQuery);
                        const { data: photos, error } = await pQuery.order('taken_at', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false });
                        
                        if (error) throw error;
                        
                        app.route.routePhotos = photos || [];
                        
                        if (app.route.routePhotos.length > 0) {
                            const hasNonCoach = app.route.routePhotos.some(p => p.type !== 'coach');
                            const hasCoach = app.route.routePhotos.some(p => p.type === 'coach');
                            if (hasCoach && !hasNonCoach) {
                                app.views.loadHome();
                                app.ui.showAlert("Trang không tồn tại hoặc tuyến này là tuyến hợp đồng (xe khách) nên không có hồ sơ xe riêng.");
                                return;
                            } else if (hasCoach) {
                                app.route.routePhotos = app.route.routePhotos.filter(p => p.type !== 'coach');
                            }
                        }
                        
                        const opEl = document.getElementById('route-info-operator');
                        const mdlEl = document.getElementById('route-info-model');
                        
                        opEl.className = 'info-input text-gray-700 w-full cursor-not-allowed flex items-center h-full min-h-[36px]';
                        opEl.onclick = null;
                        mdlEl.className = 'info-input text-gray-700 w-full cursor-not-allowed flex items-center h-full min-h-[36px]';
                        mdlEl.onclick = null;
                        
                        if (app.route.routePhotos.length > 0) {
                            const topPhoto = app.route.routePhotos[0];
                            
                            const opText = topPhoto.operator || '---';
                            opEl.innerText = opText;
                            if (opText !== '---') {
                                opEl.classList.remove('cursor-not-allowed', 'text-gray-700');
                                opEl.classList.add('cursor-pointer', 'text-blue-600', 'font-bold', 'hover:underline');
                                opEl.onclick = () => app.views.loadOperatorPage(opText);
                            }
                            
                            let modelCounts = {};
                            let seenVehicles = new Set();
                            app.route.routePhotos.forEach(p => {
                                let lp = p.license_plate?.trim().toUpperCase();
                                let model = p.vehicles?.model;
                                if (lp && model && !seenVehicles.has(lp)) {
                                    seenVehicles.add(lp);
                                    modelCounts[model] = (modelCounts[model] || 0) + 1;
                                }
                            });
                            let mostFrequentModel = null;
                            let maxCount = 0;
                            for (const [model, count] of Object.entries(modelCounts)) {
                                if (count > maxCount) {
                                    maxCount = count;
                                    mostFrequentModel = model;
                                }
                            }
                            const mdlText = mostFrequentModel ? mostFrequentModel : '---';
                            mdlEl.innerText = mdlText;
                            if (mdlText !== '---') {
                                mdlEl.classList.remove('cursor-not-allowed', 'text-gray-700');
                                mdlEl.classList.add('cursor-pointer', 'text-blue-600', 'font-bold', 'hover:underline');
                                mdlEl.onclick = () => app.views.loadModelPage(mdlText);
                            }
                        } else {
                            opEl.innerText = '---';
                            mdlEl.innerText = '---';
                        }
                        app.route.totalCount = app.route.routePhotos.length;
                        app.route.totalPages = Math.ceil(app.route.totalCount / app.route.ROUTE_PAGE_SIZE);
                        
                        document.getElementById('rte-stat-photos').innerText = app.utils.formatCompact(app.route.totalCount);
                        
                        let totalViews = 0;
                        const uniqueVehicles = new Set();
                        
                        app.route.routePhotos.forEach(p => {
                            totalViews += (p.views || 0);
                            if (p.license_plate) uniqueVehicles.add(p.license_plate.trim().toUpperCase());
                        });
                        
                        document.getElementById('rte-stat-views').innerText = app.utils.formatCompact(totalViews);
                        
                        const platesArr = Array.from(uniqueVehicles);
                        let activeVehiclesCount = 0;
                        
                        if (platesArr.length > 0) {
                            try {
                                const chunkSize = 150;
                                let allVehPhotos = [];
                                let allVehHist = [];
                                for (let i = 0; i < platesArr.length; i += chunkSize) {
                                    const chunk = platesArr.slice(i, i + chunkSize);
                                    const [pRes, hRes] = await Promise.all([
                                        window.sb.from('photos').select('license_plate, route_no, borrowed_route, taken_at').eq('status', 'approved').in('license_plate', chunk),
                                        window.sb.from('vehicle_history').select('plate, route, effective_date').in('plate', chunk)
                                    ]);
                                    if (pRes.data) allVehPhotos = allVehPhotos.concat(pRes.data);
                                    if (hRes.data) allVehHist = allVehHist.concat(hRes.data);
                                }
                                
                                allVehPhotos.sort((a, b) => new Date(b.taken_at || '1970-01-01') - new Date(a.taken_at || '1970-01-01'));
                                allVehHist.sort((a, b) => new Date(b.effective_date || '1970-01-01') - new Date(a.effective_date || '1970-01-01'));
                                
                                const specialRoutes = ['Dừng hoạt động', 'Ngoài giờ hoạt động', 'Chưa hoạt động'];
                                
                                platesArr.forEach(plate => {
                                    const vPhotos = allVehPhotos.filter(p => p.license_plate.toUpperCase() === plate);
                                    const vHist = allVehHist.filter(h => h.plate.toUpperCase() === plate);
                                    
                                    let currentRouteClientSide = '';
                                    if (vPhotos.length > 0) {
                                        const latestPhoto = vPhotos[0];
                                        const r = (latestPhoto.route_no || '').trim();
                                        if (r && !specialRoutes.includes(r)) {
                                            currentRouteClientSide = r;
                                        } else if (r === 'Ngoài giờ hoạt động') {
                                            const valid = vPhotos.find(p => p.route_no && !specialRoutes.includes(p.route_no));
                                            if (valid) currentRouteClientSide = (valid.route_no || '').trim();
                                        } else if (r === 'Dừng hoạt động' || r === 'Chưa hoạt động') {
                                            currentRouteClientSide = r;
                                        }
                                    }
                                    if (vHist.length > 0) {
                                        const histRoute = (vHist[0].route || '').trim();
                                        if (histRoute && histRoute !== '-' && histRoute !== '---') {
                                            currentRouteClientSide = histRoute;
                                        }
                                    }
                                    
                                    if (currentRouteClientSide === decodedRoute) {
                                        activeVehiclesCount++;
                                    }
                                });
                            } catch (e) {
                                console.warn("Lỗi kiểm tra trạng thái xe hoạt động:", e);
                                activeVehiclesCount = platesArr.length;
                            }
                        }
                        
                        document.getElementById('rte-stat-vehicles').innerText = app.utils.formatCompact(activeVehiclesCount);
app.views.fetchRoutePhotosPage(1);
                     } catch (err) {
                         console.error("Lỗi khi tải dữ liệu tuyến:", err);
                         grid.innerHTML = '<div class="col-span-full text-center py-10 text-red-500">Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại sau.</div>';
                     }
                     app.loadingBar.finish();
                 },
                 openEditPrompt: async () => {
                     // Check for special routes that don't have profiles
                     const specialRoutes = ['Dừng hoạt động', 'Ngoài giờ hoạt động', 'Chưa hoạt động'];
                     if (specialRoutes.includes(app.route.currentRoute)) {
                         app.toast.show('error', 'Tuyến không có hồ sơ', `Tuyến "${app.route.currentRoute}" không có thông tin hồ sơ để chỉnh sửa.`);
                         return;
                     }
                     
                     if (!app.user) return app.auth.check();
                    const modal = document.getElementById('route-edit-modal');
                    const content = document.getElementById('route-edit-content');
                    const btnSave = document.getElementById('btn-save-route');
                    const warningText = content.querySelector('p.text-xs');
                    document.getElementById('route-edit-inactive').checked = false;
                    document.getElementById('route-edit-short-path').value = '';
                    document.getElementById('route-edit-desc').value = '';
                    document.getElementById('route-edit-ticket-price').value = '';
                    document.getElementById('route-edit-headway').value = '';
                    document.getElementById('route-edit-wheelchair').checked = false;
                    const iconTypeInit = 'default';
                      document.getElementById('route-edit-icon').value = iconTypeInit;
                      document.getElementById('route-icon-label').innerText = 'Mặc định';
                      document.querySelectorAll('.route-icon-item').forEach(el => {
                          el.classList.remove('selected');
                          const icon = el.querySelector('.check-icon');
                          if(icon) icon.classList.add('opacity-0');
                      });
                      const selectedInit = document.querySelector(`.route-icon-item[data-val="${iconTypeInit}"]`);
                      if(selectedInit) {
                          selectedInit.classList.add('selected');
                          const icon = selectedInit.querySelector('.check-icon');
                          if(icon) icon.classList.remove('opacity-0');
                      }
                    if (app.role === 'admin' || app.role === 'manager') {
                        btnSave.innerText = "Lưu thông tin";
                        warningText.innerHTML = "";
                    } else {
                        btnSave.innerText = "Lưu thông tin";
                        warningText.innerText = "Thông tin này sẽ được kiểm duyệt bởi Admin. Việc để trống tất cả sẽ gửi yêu cầu xóa thông tin hiện tại.";
                    }
                    try {
                        const routeName = app.route.currentProvince ? `${app.route.currentRoute} - ${app.route.currentProvince}` : app.route.currentRoute;
                        const { data: exactInfo } = await window.sb.from('route_info').select('description, short_path, is_inactive, metadata').eq('route_name', routeName).maybeSingle();
                        if (exactInfo) {
                            document.getElementById('route-edit-inactive').checked = exactInfo.is_inactive || false;
                            document.getElementById('route-edit-short-path').value = exactInfo.short_path || '';
                            document.getElementById('route-edit-desc').value = exactInfo.description || '';
                            if (exactInfo.metadata) {
                                document.getElementById('route-edit-ticket-price').value = exactInfo.metadata.ticket_price || '';
                                document.getElementById('route-edit-headway').value = exactInfo.metadata.headway || '';
                                document.getElementById('route-edit-wheelchair').checked = exactInfo.metadata.wheelchair_support || false;
                                let iconTypeMeta = exactInfo.metadata.icon_type || 'default';
                                let iconLabelMeta = 'Mặc định';
                                if (iconTypeMeta === 'circle') iconLabelMeta = 'Hình tròn (Max 5 kí tự)';
                                else if (iconTypeMeta === 'trapezoid') iconLabelMeta = 'Hình thang cân (Max 5 kí tự)';
                                document.getElementById('route-edit-icon').value = iconTypeMeta;
                                document.getElementById('route-icon-label').innerText = iconLabelMeta;
                                document.querySelectorAll('.route-icon-item').forEach(el => {
                                    el.classList.remove('selected');
                                    const icon = el.querySelector('.check-icon');
                                    if(icon) icon.classList.add('opacity-0');
                                });
                                const selectedMeta = document.querySelector(`.route-icon-item[data-val="${iconTypeMeta}"]`);
                                if(selectedMeta) {
                                    selectedMeta.classList.add('selected');
                                    const icon = selectedMeta.querySelector('.check-icon');
                                    if(icon) icon.classList.remove('opacity-0');
                                }
                            }
                        }
                        
                        // Fetch borrowed photos
                          const { data: bPhotos } = await window.sb.from('photos').select('id, license_plate').eq('borrowed_route', routeName);
                          let bList = [];
                          let plates = [];
                          if (exactInfo && exactInfo.metadata && exactInfo.metadata.borrowed_plates) {
                              plates = exactInfo.metadata.borrowed_plates;
                          }
                          if (bPhotos && bPhotos.length > 0) {
                              bPhotos.forEach(p => {
                                  if (!plates.some(pl => pl.toLowerCase() === p.license_plate.toLowerCase())) {
                                      bList.push(p.id);
                                  }
                              });
                          }
                          bList.push(...plates);
                          document.getElementById('route-edit-borrowed').value = bList.join(', ');
                    } catch(e) {
                        console.error("Lỗi khi load dữ liệu sửa tuyến:", e);
                    }
                    modal.classList.remove('hidden');
                    app.ui.lockScroll();
                    setTimeout(() => {
                        content.classList.remove('opacity-0', 'scale-95');
                        content.classList.add('opacity-100', 'scale-100');
                    }, 10);
                },
                closeEditPrompt: () => {
                    const modal = document.getElementById('route-edit-modal');
                    const content = document.getElementById('route-edit-content');
                    content.classList.remove('opacity-100', 'scale-100');
                    content.classList.add('opacity-0', 'scale-95');
                    setTimeout(() => {
                        modal.classList.add('hidden');
                        app.ui.unlockScroll();
                    }, 200);
                },
                submitEdit: async () => {
                    if (!app.user) return;
                    const desc = document.getElementById('route-edit-desc').value.trim();
                    const shortPath = document.getElementById('route-edit-short-path').value.trim();
                    const isInactive = document.getElementById('route-edit-inactive').checked;
                    const ticketPrice = document.getElementById('route-edit-ticket-price').value.trim();
                    const headway = document.getElementById('route-edit-headway').value.trim();
                    const wheelchairSupport = document.getElementById('route-edit-wheelchair').checked;
                    const borrowedPhotosStr = document.getElementById('route-edit-borrowed').value.trim();
                    
                    let metadata = {};
                    if (ticketPrice) metadata.ticket_price = ticketPrice;
                    if (headway) metadata.headway = headway;
                    if (wheelchairSupport) metadata.wheelchair_support = wheelchairSupport;
                    
                    const iconType = document.getElementById('route-edit-icon').value;
                    if (iconType !== 'default') {
                        const expectedRouteNo = (app.route.currentProvince ? `${app.route.currentRoute} - ${app.route.currentProvince}` : app.route.currentRoute).split(' - ')[0];
                        if (expectedRouteNo.length <= 5) {
                            metadata.icon_type = iconType;
                        } else {
                            app.toast.show('warning', 'Lưu ý', 'Tên tuyến dài hơn 5 kí tự không thể sử dụng icon tùy chỉnh. Đã tự động chuyển về mặc định.');
                        }
                    }
                    
                    let metadataObj = Object.keys(metadata).length > 0 ? metadata : null;
                      const rawInputList = borrowedPhotosStr ? borrowedPhotosStr.split(',').map(s => s.trim()).filter(Boolean) : [];
                      const enteredIdsStr = rawInputList.filter(s => /^\d+$/.test(s));
                      const enteredPlates = rawInputList.filter(s => !/^\d+$/.test(s));
                      const newBorrowedIds = enteredIdsStr.map(Number);
                      
                      if (enteredPlates.length > 0) {
                          metadataObj = metadataObj || {};
                          metadataObj.borrowed_plates = enteredPlates;
                      } else if (metadataObj && metadataObj.borrowed_plates) {
                          delete metadataObj.borrowed_plates;
                          if (Object.keys(metadataObj).length === 0) metadataObj = null;
                      }
                    
                    const btn = document.getElementById('btn-save-route');
                    
                    const executeSave = async () => {
                        if (app.role !== 'admin' && app.role !== 'manager') {
                            try { await app.captcha.request(); } catch (err) { if (err.message !== "CAPTCHA_CANCELLED") app.ui.showAlert("Lỗi xác thực Captcha."); return; }
                        }
                        const origText = btn.innerHTML;
                        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...';
                        btn.disabled = true;
                        try {
                            if (app.role === 'admin' || app.role === 'manager') {
                                const routeName = app.route.currentProvince ? `${app.route.currentRoute} - ${app.route.currentProvince}` : app.route.currentRoute;
                                if (!desc && !shortPath && !isInactive && !metadataObj) {
                                    const { error: delErr } = await window.sb.from('route_info').delete().eq('route_name', routeName);
                                    if (delErr) throw delErr;
                                } else {
                                    const { error: upsertErr } = await window.sb.from('route_info').upsert({
                                        route_name: routeName,
                                        short_path: shortPath || null,
                                        description: desc || null,
                                        is_inactive: isInactive,
                                        metadata: metadataObj
                                    });
                                    if (upsertErr) throw upsertErr;
                                }
                                
                                // Xử lý cập nhật ID ảnh và biển số xe vá tuyến
                                  const { data: curBorrowed } = await window.sb.from('photos').select('id, license_plate').eq('borrowed_route', routeName);
                                  const curIds = curBorrowed ? curBorrowed.map(p => p.id) : [];
                                  const addedIdsRaw = newBorrowedIds.filter(id => !curIds.includes(id));
                                  const removedIds = curIds.filter(id => !newBorrowedIds.includes(id));
                                  
                                  const expectedRouteNo = routeName.split(' - ')[0];
                                  if (enteredPlates.length > 0) {
                                      const { data: retroPhotos } = await window.sb.from('photos').select('id, route_no').in('license_plate', enteredPlates).eq('route_no', expectedRouteNo);
                                      if (retroPhotos && retroPhotos.length > 0) {
                                          retroPhotos.forEach(p => {
                                              if (!curIds.includes(p.id) && !addedIdsRaw.includes(p.id)) {
                                                  addedIdsRaw.push(p.id);
                                              }
                                          });
                                      }
                                  }
                                  
                                  if (addedIdsRaw.length > 0) {
                                      const { data: validPhotos } = await window.sb.from('photos').select('id, route_no').in('id', addedIdsRaw);
                                      const trulyAddedIds = (validPhotos || []).filter(p => p.route_no === expectedRouteNo).map(p => p.id);
                                      
                                      if (trulyAddedIds.length > 0) {
                                          await window.sb.from('photos').update({ borrowed_route: routeName }).in('id', trulyAddedIds);
                                      }
                                  }
                                  
                                  let finalRemovedIds = removedIds;
                                  if (enteredPlates.length > 0 && curBorrowed) {
                                      finalRemovedIds = removedIds.filter(id => {
                                          const photo = curBorrowed.find(p => p.id === id);
                                          return !(photo && enteredPlates.some(plate => plate.toLowerCase() === photo.license_plate.toLowerCase()));
                                      });
                                  }
                                  if (finalRemovedIds.length > 0) {
                                    const removedPhotos = curBorrowed.filter(p => finalRemovedIds.includes(p.id));
                                    for (const p of removedPhotos) {
                                        let defProv = 'Chưa xác định';
                                        const match = p.license_plate.match(/^(\d{2})/);
                                        if (match && app.utils.provinceData) {
                                            const num = match[1];
                                            const pData = app.utils.provinceData.find(pd => {
                                                if (Array.isArray(pd.ky_hieu)) return pd.ky_hieu.includes(parseInt(num)) || pd.ky_hieu.includes(num);
                                                return String(pd.ky_hieu).split(',').map(s=>s.trim()).includes(num);
                                            });
                                            if (pData) defProv = pData.ten;
                                        }
                                        await window.sb.from('photos').update({ borrowed_route: null }).eq('id', p.id);
                                    }
                                }
                                app.toast.show('success', 'Thành công', 'Đã lưu thông tin Tuyến!');
                                app.route.closeEditPrompt();
                                app.route.loadRoutePage(app.route.currentProvince, app.route.currentRoute, true);
                            } else {
                                const routeName = app.route.currentProvince ? `${app.route.currentRoute} - ${app.route.currentProvince}` : app.route.currentRoute;
                                let checkQuery = window.sb.from('edit_requests').select('*', { count: 'estimated', head: true }).eq('status', 'pending');
                                const { count, error: checkErr } = await checkQuery.contains('new_data', { request_type: 'update_route_info', route_name: routeName });
                                if (checkErr) throw checkErr;
                                if (count > 0) throw new Error("Đã có một yêu cầu cập nhật thông tin cho tuyến này đang chờ duyệt.");
                                
                                const reqData = {
                                    requester_id: app.user.id,
                                    license_plate: 'ROUTE_INFO',
                                    new_data: {
                                        request_type: 'update_route_info',
                                        route_name: routeName,
                                        short_path: shortPath || null,
                                        description: desc || null,
                                        is_inactive: isInactive,
                                        metadata: metadataObj,
                                        borrowed_photos_str: borrowedPhotosStr
                                    },
                                    status: 'pending'
                                };
                                const { error } = await window.sb.from('edit_requests').insert(reqData);
                                if (error) throw error;
                                app.ui.showAlert("Đã gửi yêu cầu cập nhật thông tin Tuyến và đang chờ Admin duyệt.");
                                app.route.closeEditPrompt();
                            }
                        } catch (err) {
                            app.ui.showAlert("Lỗi: " + err.message);
                        } finally {
                            btn.innerHTML = origText;
                            btn.disabled = false;
                        }
                    };
                    
                    executeSave();
                }
  }
});

document.addEventListener('DOMContentLoaded', () => {
    const checkRouter = setInterval(() => {
        if (window.app && window.app.views && window.app.views.loadContact) {
            clearInterval(checkRouter); 
            const origLoadContact = window.app.views.loadContact;
            window.app.views.loadContact = () => {
                origLoadContact(); 
                if (window.app.contact && window.app.contact.init) {
                    window.app.contact.init(); 
                }
            };
        }
    }, 100);
});

window.app = window.app || {};
window.app.views = window.app.views || {};
window.app.views.selectRouteIcon = function(val, label) {
    document.getElementById('route-edit-icon').value = val;
    document.getElementById('route-icon-label').innerText = label;
    document.querySelectorAll('.route-icon-item').forEach(el => {
        el.classList.remove('selected');
        const icon = el.querySelector('.check-icon');
        if(icon) icon.classList.add('opacity-0');
    });
    const selectedEl = document.querySelector(`.route-icon-item[data-val="${val}"]`);
    if(selectedEl) {
        selectedEl.classList.add('selected');
        const icon = selectedEl.querySelector('.check-icon');
        if(icon) icon.classList.remove('opacity-0');
    }
};
