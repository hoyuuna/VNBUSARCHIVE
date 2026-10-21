
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
                                <div class="">
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
                                <div class="">
                                    <span onclick="if(${r.isCoach ? 'true' : 'false'}) { app.searchRedirect('${app.utils.escapeAttr(r.route)}', 'route'); } else { app.utils.navigate('${r.prov ? '/route/' + encodeURIComponent(r.prov) + '/' + encodeURIComponent(r.route) : '/route/' + encodeURIComponent(r.route)}'); }" class="cursor-pointer hover:underline font-bold transition text-black">
                                        ${app.utils.cleanText(r.displayName || r.route)}
                                    </span>
                                </div>
                            </td>
                            <td class="text-center font-bold text-black border-r border-gray-200">${r.vehicleCount}</td>
                            <td class="text-center text-black max-w-[150px]" title="${r.mainModel || 'Chưa xác định'}">
                                <div class="">
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
                            if (app.role === 'admin' || app.role === 'manager') {
                                if (!logo && !desc && !parentOp) {
                                    const { error } = await window.sb.from('operator_info').delete().eq('operator_name', app.currentOperator);
                                    if (error) throw error;
                                } else {
                                    const { error } = await window.sb.from('operator_info').upsert({
                                        operator_name: app.currentOperator,
                                                                                description: desc || null,
                                        parent_operator: parentOp || null,
                                        logo_url: logo || null
                                    });
                                    if (error) throw error;
                                }
                                app.toast.show('success', 'Thành công', 'Đã lưu thông tin Đơn vị vận hành!');
                                app.operator.closeEditPrompt();
                                const opDescEl = document.getElementById('op-desc');
                                if (opDescEl) {
                                    if (desc) {
                                        opDescEl.innerHTML = app.utils.cleanText(desc).replace(/\n/g, '<br>');
                                        opDescEl.classList.remove('hidden');
                                    } else {
                                        opDescEl.classList.add('hidden');
                                    }
                                }
                                app.views.loadOperatorPage(app.currentOperator, true);
                                if (app.admin && app.admin.logAction) {
                                    app.admin.logAction('update_operator_direct', app.currentOperator, { logo_url: logo || null, description: desc, parent_operator: parentOp });
                                }
                            } else {
                                const { count, error: checkErr } = await window.sb.from('edit_requests')
                                    .select('*', { count: 'exact', head: true })
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
                                        parent_operator: parentOp,
                                        logo_url: logo
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
                        let pQuery = window.sb.from('photos').select(`id, url, license_plate, operator, type, route_no, taken_at, created_at, uploader_id, note, exif_params, borrowed_route, camera_model, location, status, denial_reason, is_documentary, views, profiles(id, username, role, subroles, ban_status), vehicles!inner(model)`, { count: 'exact' })
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
                        const { data: exactInfo } = await window.sb.from('model_info').select('description, logo_url').eq('model_name', app.model.currentModel).maybeSingle();
                        if (exactInfo) {
                            if (exactInfo.description) document.getElementById('mdl-edit-desc').value = exactInfo.description;
                            if (exactInfo.logo_url) document.getElementById('mdl-edit-logo').value = exactInfo.logo_url;
                        }
                        if (!document.getElementById('mdl-edit-logo').value) {
                            const { data: brandLogoData } = await window.sb.from('model_info').select('logo_url').ilike('model_name', `${brandName}%`).not('logo_url', 'is', null).limit(1).maybeSingle();
                            if (brandLogoData && brandLogoData.logo_url) document.getElementById('mdl-edit-logo').value = brandLogoData.logo_url;
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
                                if (!logo && !desc) {
                                    const { error: delErr } = await window.sb.from('model_info').delete().eq('model_name', app.model.currentModel);
                                    if (delErr) throw delErr;
                                } else {
                                    const upsertData = {
                                        model_name: app.model.currentModel,
                                        description: desc || null,
                                        logo_url: logo || null
                                    };
                                    const { error: upsertErr } = await window.sb.from('model_info').upsert(upsertData, { onConflict: 'model_name' });
                                    if (upsertErr) throw upsertErr;
                                }
                                if (logo) {
                                    await window.sb.from('model_info')
                                        .update({ logo_url: logo })
                                        .ilike('model_name', `${brandName}%`);
                                }
                                app.toast.show('success', 'Thành công', 'Đã lưu và đồng bộ thông tin Dòng xe!');
                                app.model.closeEditPrompt();
                                const descEl = document.getElementById('model-desc');
                                if (descEl) {
                                    if (desc) {
                                        descEl.innerHTML = app.utils.cleanText(desc).replace(/\n/g, '<br>');
                                        descEl.classList.remove('hidden');
                                    } else {
                                        descEl.classList.add('hidden');
                                    }
                                }
                                const logoEl = document.getElementById('model-logo');
                                const fallbackEl = document.getElementById('model-logo-fallback');
                                if (logoEl && fallbackEl) {
                                    if (logo) {
                                        logoEl.src = logo.includes('wsrv.nl') ? logo : 'https://wsrv.nl/?url=' + encodeURIComponent(logo);
                                        logoEl.classList.remove('hidden');
                                        fallbackEl.classList.add('hidden');
                                    } else {
                                        logoEl.classList.add('hidden');
                                        fallbackEl.classList.remove('hidden');
                                    }
                                }
                                app.model.loadModelPage(app.model.currentModel, true);
                                if (app.admin && app.admin.logAction) {
                                    app.admin.logAction('update_model_direct', app.model.currentModel, { logo_url: logo || null, description: desc, brand_sync: brandName });
                                }
                            } else {
                                const { count, error: checkErr } = await window.sb.from('edit_requests')
                                    .select('*', { count: 'exact', head: true })
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
                                        description: desc || null,
                                        logo_url: logo || null
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
                                inactiveBadge = '<span class="bg-black text-white text-[10px] px-2 py-0.5 rounded font-bold border border-black shrink-0 uppercase tracking-widest">Dừng hoạt động</span>';
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
                            
                            
                            const builtIcon = await app.utils.buildRouteIcon(decodedRoute, exactInfo.metadata && exactInfo.metadata.icon_type, 'w-16 h-16 md:w-20 md:h-20');
                            if (builtIcon) { iconClass = builtIcon.iconClass; iconHtml = builtIcon.iconHtml; }
                            
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
                        
                        document.getElementById('route-profile-title').innerText = app.utils.escapeHtml(titleText);
                            document.getElementById('route-badge').innerHTML = inactiveBadge;
                    } catch (e) {
                        console.warn("Lỗi tải thông tin Tuyến:", e);
                    }
                    
                    try {
                        let pQuery = window.sb.from('photos').select(`id, url, license_plate, operator, type, route_no, taken_at, created_at, uploader_id, note, exif_params, borrowed_route, camera_model, location, status, denial_reason, is_documentary, views, profiles(id, username, role, subroles, ban_status), vehicles(model)`)
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
                        
                        const renderInfoValue = (el, items, clickHandler) => {
                            if (!el) return;
                            el.innerHTML = '';
                            el.className = 'info-input text-gray-700 dark:text-gray-200 w-full flex items-center flex-wrap h-full min-h-[36px] py-1';
                            el.onclick = null;
                            if (!items || items.length === 0) {
                                el.innerText = '---';
                                el.classList.add('cursor-not-allowed');
                                return;
                            }
                            items.forEach((item, index) => {
                                if (index > 0) {
                                    const sep = document.createElement('span');
                                    sep.textContent = ',';
                                    sep.className = 'text-gray-600 dark:text-gray-400 mr-1.5 select-none';
                                    el.appendChild(sep);
                                }
                                const span = document.createElement('span');
                                span.textContent = item;
                                span.className = 'cursor-pointer text-black dark:text-white font-medium hover:underline transition';
                                span.onclick = (e) => {
                                    e.stopPropagation();
                                    clickHandler(item);
                                };
                                el.appendChild(span);
                            });
                        };
                        
                        app.route.totalCount = app.route.routePhotos.length;
                        app.route.totalPages = Math.ceil(app.route.totalCount / app.route.ROUTE_PAGE_SIZE);
                        
                        document.getElementById('rte-stat-photos').innerText = app.utils.formatCompact(app.route.totalCount);
                        
                        let totalViews = 0;
                        const uniqueVehicles = new Set();
                        const vehicleModelMap = {};
                        
                        app.route.routePhotos.forEach(p => {
                            totalViews += (p.views || 0);
                            const lp = p.license_plate?.trim().toUpperCase();
                            if (lp) {
                                uniqueVehicles.add(lp);
                                if (p.vehicles?.model && !vehicleModelMap[lp]) {
                                    vehicleModelMap[lp] = p.vehicles.model.trim();
                                }
                            }
                        });
                        
                        document.getElementById('rte-stat-views').innerText = app.utils.formatCompact(totalViews);
                        
                        const platesArr = Array.from(uniqueVehicles);
                        let activeVehiclesCount = 0;
                        const activeOpCounts = {};
                        const activeModelCounts = {};
                        
                        if (platesArr.length > 0) {
                            try {
                                const chunkSize = 150;
                                let allVehPhotos = [];
                                let allVehHist = [];
                                for (let i = 0; i < platesArr.length; i += chunkSize) {
                                    const chunk = platesArr.slice(i, i + chunkSize);
                                    const [pRes, hRes] = await Promise.all([
                                        window.sb.from('photos').select('license_plate, route_no, operator, borrowed_route, taken_at, created_at, vehicles(model)').eq('status', 'approved').in('license_plate', chunk),
                                        window.sb.from('vehicle_history').select('id, license_plate, plate, operator, route, note, effective_date, display_order').or(`license_plate.in.(${chunk.join(',')}),plate.in.(${chunk.join(',')})`)
                                    ]);
                                    if (pRes.data) allVehPhotos = allVehPhotos.concat(pRes.data);
                                    if (hRes.data) allVehHist = allVehHist.concat(hRes.data);
                                }
                                
                                allVehPhotos.forEach(p => {
                                    const lp = p.license_plate?.trim().toUpperCase();
                                    if (lp && p.vehicles?.model && !vehicleModelMap[lp]) {
                                        vehicleModelMap[lp] = p.vehicles.model.trim();
                                    }
                                });
                                
                                const specialRoutes = ['Dừng hoạt động', 'Ngoài giờ hoạt động', 'Chưa hoạt động'];
                                
                                platesArr.forEach(plate => {
                                    const vPhotos = allVehPhotos
                                        .filter(p => p.license_plate && p.license_plate.trim().toUpperCase() === plate)
                                        .sort((a, b) => {
                                            const timeA = new Date(a.taken_at || a.created_at || '1970-01-01').getTime();
                                            const timeB = new Date(b.taken_at || b.created_at || '1970-01-01').getTime();
                                            return timeB - timeA;
                                        });
                                    
                                    const vHist = allVehHist
                                        .filter(h => (h.license_plate && h.license_plate.trim().toUpperCase() === plate) || (h.plate && h.plate.trim().toUpperCase() === plate))
                                        .map(h => {
                                            let effDate = h.effective_date;
                                            if (!effDate && h.note) {
                                                const dateMatch = h.note.match(/Từ ngày:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);
                                                if (dateMatch) {
                                                    const parts = dateMatch[1].split('/');
                                                    effDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                                                }
                                            }
                                            return {
                                                ...h,
                                                parsed_effective_date: effDate
                                            };
                                        })
                                        .sort((a, b) => {
                                            const timeA = new Date(a.parsed_effective_date || '1970-01-01').getTime();
                                            const timeB = new Date(b.parsed_effective_date || '1970-01-01').getTime();
                                            if (timeA !== timeB) return timeA - timeB;
                                            return (a.display_order || 0) - (b.display_order || 0);
                                        });
                                    
                                    let currentRouteClientSide = '';
                                    let currentOpClientSide = '';
                                    let currentRouteProvName = null;
                                    let photoTime = 0;
                                    
                                    if (vPhotos.length > 0) {
                                        const latestPhoto = vPhotos[0];
                                        photoTime = new Date(latestPhoto.taken_at || latestPhoto.created_at || '1970-01-01').getTime();
                                        currentOpClientSide = (latestPhoto.operator || '').trim();
                                        const r = (latestPhoto.route_no || '').trim();
                                        if (r && !specialRoutes.includes(r)) {
                                            currentRouteClientSide = r;
                                            if (latestPhoto.borrowed_route) {
                                                const parts = latestPhoto.borrowed_route.split(' - ');
                                                if (parts.length > 1) currentRouteProvName = parts[1].trim();
                                            }
                                        } else if (r === 'Ngoài giờ hoạt động') {
                                            const validPhotos = vPhotos.filter(p => p.route_no && !specialRoutes.includes(p.route_no.trim()));
                                            if (validPhotos.length > 0) {
                                                const latestValid = validPhotos[0];
                                                currentRouteClientSide = (latestValid.route_no || '').trim();
                                                if (latestValid.operator) currentOpClientSide = latestValid.operator.trim();
                                                if (latestValid.borrowed_route) {
                                                    const parts = latestValid.borrowed_route.split(' - ');
                                                    if (parts.length > 1) currentRouteProvName = parts[1].trim();
                                                }
                                            }
                                        } else if (r === 'Dừng hoạt động' || r === 'Chưa hoạt động') {
                                            currentRouteClientSide = r;
                                        }
                                    }
                                    
                                    if (vHist.length > 0) {
                                        const latestHist = vHist[vHist.length - 1];
                                        const histTime = latestHist.parsed_effective_date ? new Date(latestHist.parsed_effective_date).getTime() : 0;
                                        
                                        if (!histTime || !photoTime || histTime >= photoTime) {
                                            const histRoute = (latestHist.route || '').trim();
                                            if (histRoute && histRoute !== '-' && histRoute !== '---') {
                                                currentRouteClientSide = histRoute;
                                            }
                                            const histOp = (latestHist.operator || '').trim();
                                            if (histOp && histOp !== '-' && histOp !== '---') {
                                                currentOpClientSide = histOp;
                                            }
                                        }
                                    }
                                    
                                    const isRouteMatch = currentRouteClientSide.toLowerCase() === decodedRoute.toLowerCase();
                                    const isNotSpecial = !specialRoutes.includes(currentRouteClientSide);
                                    let isProvMatch = true;
                                    if (decodedProvince && currentRouteProvName) {
                                        isProvMatch = currentRouteProvName.toLowerCase() === decodedProvince.toLowerCase();
                                    }
                                    
                                    if (isRouteMatch && isNotSpecial && isProvMatch) {
                                        activeVehiclesCount++;
                                        if (currentOpClientSide && currentOpClientSide !== '---' && currentOpClientSide !== 'N/A') {
                                            activeOpCounts[currentOpClientSide] = (activeOpCounts[currentOpClientSide] || 0) + 1;
                                        }
                                        const vModel = vehicleModelMap[plate];
                                        if (vModel && vModel !== '---') {
                                            activeModelCounts[vModel] = (activeModelCounts[vModel] || 0) + 1;
                                        }
                                    }
                                });
                            } catch (e) {
                                console.warn("Lỗi kiểm tra trạng thái xe hoạt động:", e);
                                activeVehiclesCount = platesArr.length;
                            }
                        }
                        
                        document.getElementById('rte-stat-vehicles').innerText = app.utils.formatCompact(activeVehiclesCount);
                        
                        // Xác định danh sách đơn vị vận hành và dòng xe hiển thị
                        let dominantOps = Object.keys(activeOpCounts).sort((a, b) => activeOpCounts[b] - activeOpCounts[a]);
                        let dominantModels = Object.keys(activeModelCounts).sort((a, b) => activeModelCounts[b] - activeModelCounts[a]);
                        
                        // Nếu không có xe nào đang hoạt động (ví dụ tuyến đã ngừng hoặc thiếu lịch sử), lấy theo dữ liệu ảnh của tuyến làm dự phòng
                        if (dominantOps.length === 0 && app.route.routePhotos.length > 0) {
                            const fallbackOpCounts = {};
                            app.route.routePhotos.forEach(p => {
                                const op = p.operator?.trim();
                                if (op && op !== '---' && op !== 'N/A') {
                                    fallbackOpCounts[op] = (fallbackOpCounts[op] || 0) + 1;
                                }
                            });
                            dominantOps = Object.keys(fallbackOpCounts).sort((a, b) => fallbackOpCounts[b] - fallbackOpCounts[a]);
                        }
                        
                        if (dominantModels.length === 0 && app.route.routePhotos.length > 0) {
                            const fallbackModelCounts = {};
                            app.route.routePhotos.forEach(p => {
                                const mdl = p.vehicles?.model?.trim();
                                if (mdl && mdl !== '---') {
                                    fallbackModelCounts[mdl] = (fallbackModelCounts[mdl] || 0) + 1;
                                }
                            });
                            dominantModels = Object.keys(fallbackModelCounts).sort((a, b) => fallbackModelCounts[b] - fallbackModelCounts[a]);
                        }
                        
                        renderInfoValue(opEl, dominantOps, op => app.utils.navigate('/operator/' + encodeURIComponent(op)));
                        renderInfoValue(mdlEl, dominantModels, mdl => app.utils.navigate('/model/' + encodeURIComponent(mdl)));
                        
                        app.views.fetchRoutePhotosPage(1);
                     } catch (err) {
                         console.error("Lỗi khi tải dữ liệu tuyến:", err);
                         grid.innerHTML = '<div class="col-span-full text-center py-10 text-red-500">Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại sau.</div>';
                     }
                     app.loadingBar.finish();
                 },
                specialRoutes: ['Dừng hoạt động', 'Ngoài giờ hoạt động', 'Chưa hoạt động', 'Hợp đồng'],
                compareRoutes: (a, b) => {
                    const noA = (a.route_no || a.route_name || '').trim();
                    const noB = (b.route_no || b.route_name || '').trim();
                    const cmpNo = noA.localeCompare(noB, 'vi', { numeric: true, sensitivity: 'base' });
                    if (cmpNo !== 0) return cmpNo;
                    const cmpExactNo = noA.localeCompare(noB, 'vi');
                    if (cmpExactNo !== 0) return cmpExactNo;
                    const provA = (a.province || '').trim();
                    const provB = (b.province || '').trim();
                    return provA.localeCompare(provB, 'vi', { sensitivity: 'base' });
                },
                cachedRoutes: null,
                selectorCallback: null,
                selectorTargetInputId: null,
                selectorExcludeRoute: null,
                selectorCurrentSelected: '',
                selectorTypeFilter: 'all',
                selectorLockedType: null,
                selectorContextProvince: '',
                pendingSelectedRoute: null,
                selectorDisplayLimit: 40,
                isEditingExisting: false,
                editingOriginalRouteName: '',
                deletingRouteName: '',

                updateSelectorTypeButtons: () => {
                    const filter = app.route.selectorTypeFilter || 'all';
                    const locked = app.route.selectorLockedType;
                    const btnAll = document.getElementById('btn-sel-type-all');
                    const btnBus = document.getElementById('btn-sel-type-bus');
                    const btnCoach = document.getElementById('btn-sel-type-coach');
                    const provContainer = document.getElementById('route-selector-prov-container');
                    if (provContainer) {
                        if (filter === 'coach' || locked === 'coach') {
                            provContainer.classList.add('hidden');
                        } else {
                            provContainer.classList.remove('hidden');
                        }
                    }
                    if (!btnAll || !btnBus || !btnCoach) return;
                    
                    const activeCls = 'px-2.5 py-1 rounded-md text-[11px] font-bold border border-black bg-black text-white transition';
                    const inactiveCls = 'px-2.5 py-1 rounded-md text-[11px] font-bold border border-black bg-white text-black hover:bg-gray-100 transition';
                    
                    if (locked === 'bus') {
                        btnAll.classList.add('hidden');
                        btnCoach.classList.add('hidden');
                        btnBus.classList.remove('hidden');
                        btnBus.className = activeCls + ' cursor-default';
                        btnBus.innerHTML = '<i class="fa-solid fa-bus mr-1"></i>Xe buýt';
                    } else if (locked === 'coach') {
                        btnAll.classList.add('hidden');
                        btnBus.classList.add('hidden');
                        btnCoach.classList.remove('hidden');
                        btnCoach.className = activeCls + ' cursor-default';
                        btnCoach.innerHTML = '<i class="fa-solid fa-van-shuttle mr-1"></i>Xe khách';
                    } else {
                        btnAll.classList.remove('hidden');
                        btnBus.classList.remove('hidden');
                        btnCoach.classList.remove('hidden');
                        btnAll.innerHTML = 'Tất cả';
                        btnBus.innerHTML = '<i class="fa-solid fa-bus mr-1"></i>Xe buýt';
                        btnCoach.innerHTML = '<i class="fa-solid fa-van-shuttle mr-1"></i>Xe khách';
                        btnAll.className = filter === 'all' ? activeCls : inactiveCls;
                        btnBus.className = filter === 'bus' ? activeCls : inactiveCls;
                        btnCoach.className = filter === 'coach' ? activeCls : inactiveCls;
                    }
                },

                setSelectorTypeFilter: (type) => {
                    if (app.route.selectorLockedType && type !== app.route.selectorLockedType) {
                        return;
                    }
                    app.route.selectorDisplayLimit = 40;
                    app.route.selectorTypeFilter = type;
                    app.route.updateSelectorTypeButtons();
                    app.route.filterSelector();
                },

                toggleSelectorProvMenu: (e) => {
                    if (e) e.stopPropagation();
                    const menu = document.getElementById('route-selector-prov-menu');
                    if (menu) menu.classList.toggle('active');
                },

                renderSelectorProvMenu: () => {
                    const listContainer = document.getElementById('route-selector-prov-list');
                    if (!listContainer) return;
                    const curVal = (document.getElementById('route-selector-prov-filter')?.value || '').trim().toLowerCase();
                    const pData = app.utils.provinceData || [];
                    
                    let html = `
                        <div class="filter-item ${!curVal ? 'selected' : ''}" onclick="app.route.selectSelectorProvince('')">
                            <span class="font-bold">Tất cả tỉnh thành</span>
                            ${!curVal ? '<i class="fa-solid fa-check text-xs ml-auto"></i>' : ''}
                        </div>
                    `;
                    
                    pData.forEach(p => {
                        const isSel = curVal && curVal === p.ten.toLowerCase();
                        html += `
                            <div class="filter-item ${isSel ? 'selected' : ''}" data-prov="${app.utils.escapeAttr(p.ten)}" onclick="app.route.selectSelectorProvince('${app.utils.escapeAttr(p.ten)}')">
                                <span>${app.utils.escapeHtml(p.ten)}</span>
                                ${isSel ? '<i class="fa-solid fa-check text-xs ml-auto"></i>' : ''}
                            </div>
                        `;
                    });
                    listContainer.innerHTML = html;
                },

                selectSelectorProvince: (provName) => {
                    const input = document.getElementById('route-selector-prov-filter');
                    const label = document.getElementById('route-selector-prov-label');
                    if (input) input.value = provName || '';
                    if (label) label.innerText = provName || 'Tất cả tỉnh thành';
                    const menu = document.getElementById('route-selector-prov-menu');
                    if (menu) menu.classList.remove('active');
                    app.route.selectorDisplayLimit = 40;
                    app.route.renderSelectorProvMenu();
                    app.route.filterSelector();
                },

                filterSelectorProvSearch: (q) => {
                    const query = (q || '').trim().toLowerCase();
                    const items = document.querySelectorAll('#route-selector-prov-list .filter-item');
                    items.forEach(item => {
                        const prov = item.dataset.prov;
                        if (!prov) {
                            item.style.display = query ? 'none' : 'flex';
                        } else {
                            item.style.display = prov.toLowerCase().includes(query) ? 'flex' : 'none';
                        }
                    });
                },

                toggleEditProvMenu: (e) => {
                    const btn = document.getElementById('btn-route-edit-province');
                    if (btn && btn.disabled) return;
                    if (e) e.stopPropagation();
                    const menu = document.getElementById('route-edit-prov-menu');
                    if (menu) menu.classList.toggle('active');
                },

                renderEditProvMenu: (selectedProv = '') => {
                    const listContainer = document.getElementById('route-edit-prov-list');
                    if (!listContainer) return;
                    const curVal = (selectedProv || document.getElementById('route-edit-province')?.value || '').trim().toLowerCase();
                    const pData = app.utils.provinceData || [];
                    
                    let html = '';
                    pData.forEach(p => {
                        const isSel = curVal && curVal === p.ten.toLowerCase();
                        html += `
                            <div class="filter-item ${isSel ? 'selected' : ''}" data-prov="${app.utils.escapeAttr(p.ten)}" onclick="app.route.selectEditProvince('${app.utils.escapeAttr(p.ten)}')">
                                <span>${app.utils.escapeHtml(p.ten)}</span>
                                ${isSel ? '<i class="fa-solid fa-check text-xs ml-auto"></i>' : ''}
                            </div>
                        `;
                    });
                    listContainer.innerHTML = html;
                },

                selectEditProvince: (provName) => {
                    const input = document.getElementById('route-edit-province');
                    const label = document.getElementById('route-edit-prov-label');
                    if (input) input.value = provName || '';
                    if (label) label.innerText = provName || '-- Chọn Tỉnh / Thành phố --';
                    const menu = document.getElementById('route-edit-prov-menu');
                    if (menu) menu.classList.remove('active');
                    app.route.renderEditProvMenu(provName);
                },

                filterEditProvinceSearch: (q) => {
                    const query = (q || '').trim().toLowerCase();
                    const items = document.querySelectorAll('#route-edit-prov-list .filter-item');
                    items.forEach(item => {
                        const prov = item.dataset.prov || '';
                        item.style.display = prov.toLowerCase().includes(query) ? 'flex' : 'none';
                    });
                },

                setEditVehicleType: (type = 'bus') => {
                    const val = type === 'coach' ? 'coach' : 'bus';
                    const hiddenInput = document.getElementById('route-edit-vehicle-type');
                    if (hiddenInput) hiddenInput.value = val;
                    const btnBus = document.getElementById('btn-route-type-bus');
                    const btnCoach = document.getElementById('btn-route-type-coach');
                    
                    const activeCls = 'py-2.5 px-3 rounded-md border border-black text-xs font-bold bg-black text-white transition flex items-center justify-center gap-1.5';
                    const inactiveCls = 'py-2.5 px-3 rounded-md border border-black text-xs font-bold bg-white text-black hover:bg-gray-50 transition flex items-center justify-center gap-1.5';
                    
                    if (btnBus) btnBus.className = val === 'bus' ? activeCls : inactiveCls;
                    if (btnCoach) btnCoach.className = val === 'coach' ? activeCls : inactiveCls;

                    const busFields = document.getElementById('route-edit-bus-profile-fields');
                    const provContainer = document.getElementById('route-edit-province-container');
                    const nameLabel = document.getElementById('route-edit-name-label');
                    const nameInput = document.getElementById('route-edit-name');

                    if (val === 'coach') {
                        if (busFields) busFields.classList.add('hidden');
                        if (provContainer) provContainer.classList.add('hidden');
                        if (nameLabel) nameLabel.innerHTML = 'Tên tuyến / Lộ trình <span class="text-red-500">*</span>';
                        if (nameInput) nameInput.placeholder = 'VD: Hà Nội - Hải Phòng, Sài Gòn - Vũng Tàu...';
                    } else {
                        if (busFields) busFields.classList.remove('hidden');
                        if (provContainer) provContainer.classList.remove('hidden');
                        if (nameLabel) nameLabel.innerHTML = 'Số hiệu tuyến <span class="text-red-500">*</span>';
                        if (nameInput) nameInput.placeholder = 'VD: 01, 20B, BRT01...';
                    }
                },

                fetchRoutes: async (force = false) => {
                    if (app.route.cachedRoutes && !force) return app.route.cachedRoutes;
                    let routes = [];
                    try {
                        const { data, error } = await window.sb
                            .from('route_info')
                            .select('route_name, short_path, is_inactive, metadata')
                            .order('route_name', { ascending: true });
                        if (!error && data) {
                            routes = data.map(r => {
                                const rName = r.route_name || '';
                                let meta = r.metadata;
                                if (typeof meta === 'string') {
                                    try { meta = JSON.parse(meta); } catch (e) { meta = {}; }
                                }
                                meta = meta || {};
                                const isCoach = meta.vehicle_type === 'coach';
                                let rNo = meta.route_no;
                                let prov = meta.province;
                                if (isCoach) {
                                    rNo = rName;
                                    prov = null;
                                } else {
                                    if (!rNo) {
                                        rNo = rName.includes(' - ') ? rName.split(' - ')[0].trim() : rName;
                                    }
                                    if (!prov && rName.includes(' - ')) {
                                        prov = rName.split(' - ').slice(1).join(' - ').trim();
                                    }
                                }
                                const isSpecial = app.route.specialRoutes.includes(rNo) || app.route.specialRoutes.includes(rName);
                                return {
                                    ...r,
                                    metadata: meta,
                                    route_no: rNo,
                                    province: (isSpecial || isCoach) ? null : (prov || null),
                                    is_special: isSpecial
                                };
                            });
                        }
                    } catch (e) {
                        console.warn("Lỗi tải danh sách tuyến:", e);
                    }

                    // Tải thêm danh sách tuyến xe khách từ các ảnh xe khách đã được duyệt
                    try {
                        const { data: coachPhotos, error: coachErr } = await window.sb
                            .from('photos')
                            .select('route_no, borrowed_route, license_plate')
                            .eq('type', 'coach')
                            .eq('status', 'approved');
                        if (!coachErr && coachPhotos && coachPhotos.length > 0) {
                            const seenCoachRoutes = new Set();
                            routes.forEach(r => {
                                if (r.metadata?.vehicle_type === 'coach') {
                                    seenCoachRoutes.add((r.route_name || '').toLowerCase());
                                    seenCoachRoutes.add((r.route_no || '').toLowerCase());
                                }
                            });

                            coachPhotos.forEach(p => {
                                const raw = (p.borrowed_route || p.route_no || '').trim();
                                if (!raw) return;
                                if (app.route.specialRoutes.includes(raw)) return;
                                const key = raw.toLowerCase();
                                if (seenCoachRoutes.has(key)) return;
                                seenCoachRoutes.add(key);

                                routes.push({
                                    route_name: raw,
                                    route_no: raw,
                                    province: null,
                                    short_path: null,
                                    is_special: false,
                                    is_inactive: false,
                                    metadata: {
                                        vehicle_type: 'coach'
                                    }
                                });
                            });
                        }
                    } catch (e) {
                        console.warn("Lỗi tải tuyến xe khách từ ảnh:", e);
                    }
                    
                    // Đảm bảo 4 trường hợp đặc biệt luôn tồn tại trong danh sách
                    app.route.specialRoutes.forEach(spec => {
                        if (!routes.some(r => r.route_no === spec || r.route_name === spec)) {
                            routes.unshift({
                                route_name: spec,
                                route_no: spec,
                                province: null,
                                is_special: true,
                                is_inactive: false
                            });
                        }
                    });

                    // Khử các tuyến rác trùng số hiệu không có tỉnh nếu đã có tuyến cùng số hiệu có tỉnh
                    const hasProvWithSameNo = (r) => {
                        if (r.province || r.is_special || r.metadata?.vehicle_type === 'coach') return false;
                        return routes.some(other => other !== r && other.route_no === r.route_no && other.province);
                    };
                    routes = routes.filter(r => !hasProvWithSameNo(r));
                    routes.sort(app.route.compareRoutes);

                    app.route.cachedRoutes = routes;
                    return routes;
                },

                openSelector: async (options = {}) => {
                    app.route.selectorCallback = options.onSelect || null;
                    app.route.selectorTargetInputId = options.targetInputId || null;
                    app.route.selectorExcludeRoute = options.excludeRoute || null;
                    app.route.selectorIsHistory = !!(options.isHistory || (options.targetInputId && (options.targetInputId.includes('hist') || options.targetInputId.includes('req-h-'))));
                    
                    let curSelected = '';
                    if (options.selectedRoute) {
                        curSelected = options.selectedRoute;
                    } else if (options.targetInputId) {
                        const el = document.getElementById(options.targetInputId);
                        if (el) {
                            curSelected = el.dataset.routeName || el.value || '';
                        }
                    }
                    app.route.selectorCurrentSelected = (curSelected || '').trim();
                    app.route.pendingSelectedRoute = null;
                    app.route.selectorDisplayLimit = 40;
                    let targetProv = options.province || '';
                    if (!targetProv && options.targetInputId) {
                        const targetEl = document.getElementById(options.targetInputId);
                        if (targetEl?.dataset?.routeName && targetEl.dataset.routeName.includes(' - ')) {
                            targetProv = targetEl.dataset.routeName.split(' - ').slice(1).join(' - ').trim();
                        } else if (targetEl?.dataset?.borrowed && targetEl.dataset.borrowed.includes(' - ')) {
                            targetProv = targetEl.dataset.borrowed.split(' - ').slice(1).join(' - ').trim();
                        }
                    }
                    if (!targetProv) {
                        targetProv = document.getElementById('up-province')?.value 
                            || document.getElementById('info-province')?.value 
                            || (app.currentPhoto?.license_plate ? app.utils.getProvinceFromPlate(app.currentPhoto.license_plate) : '')
                            || (app.currentVehicle?.license_plate ? app.utils.getProvinceFromPlate(app.currentVehicle.license_plate) : '')
                            || '';
                    }
                    if (targetProv === 'Không xác định' || targetProv === 'Biển tạm') targetProv = '';
                    app.route.selectorContextProvince = targetProv;

                    // Xác định bộ lọc loại xe ban đầu và khóa chặt nếu là xe buýt hoặc xe khách
                    let vType = options.vehicleType;
                    if (!vType) {
                        if (options.targetInputId === 'up-route') {
                            vType = document.getElementById('up-type')?.value || (app.upload && app.upload.selectedType) || '';
                        } else if (options.targetInputId === 'info-route') {
                            vType = document.getElementById('info-type')?.value || '';
                        } else if (app.currentVehicle && app.currentVehicle.type) {
                            vType = app.currentVehicle.type;
                        } else if (app.currentPhoto && app.currentPhoto.type) {
                            vType = app.currentPhoto.type;
                        }
                    }
                    
                    if (vType === 'bus' || vType === 'coach') {
                        app.route.selectorLockedType = vType;
                        app.route.selectorTypeFilter = vType;
                    } else {
                        app.route.selectorLockedType = null;
                        app.route.selectorTypeFilter = 'all';
                    }
                    app.route.updateSelectorTypeButtons();

                    const modal = document.getElementById('route-selector-modal');
                    const content = document.getElementById('route-selector-content');
                    if (!modal || !content) return;

                    // Khởi tạo menu dropdown tỉnh thành
                    const searchInput = document.getElementById('route-selector-search');
                    if (searchInput) searchInput.value = '';
                    const provFilter = document.getElementById('route-selector-prov-filter');
                    if (provFilter) provFilter.value = '';
                    const provLabel = document.getElementById('route-selector-prov-label');
                    if (provLabel) provLabel.innerText = 'Tất cả tỉnh thành';
                    const provSearch = document.getElementById('route-selector-prov-search');
                    if (provSearch) provSearch.value = '';
                    app.route.renderSelectorProvMenu();

                    modal.classList.remove('hidden');
                    app.ui.lockScroll();
                    setTimeout(() => {
                        content.classList.remove('opacity-0', 'scale-95');
                        content.classList.add('opacity-100', 'scale-100');
                    }, 10);

                    await app.route.fetchRoutes();
                    app.route.filterSelector();
                },

                closeSelector: () => {
                    const modal = document.getElementById('route-selector-modal');
                    const content = document.getElementById('route-selector-content');
                    if (!modal || !content) return;
                    content.classList.remove('opacity-100', 'scale-100');
                    content.classList.add('opacity-0', 'scale-95');
                    setTimeout(() => {
                        modal.classList.add('hidden');
                        const delModal = document.getElementById('route-delete-modal');
                        if (delModal && app.route.deletingRouteName && delModal.classList.contains('hidden') && !app.route._wasFromSelector) {
                            delModal.classList.remove('hidden');
                            app.ui.lockScroll();
                        } else if (!app.route._wasFromSelector && (!document.getElementById('route-edit-modal') || document.getElementById('route-edit-modal').classList.contains('hidden'))) {
                            app.ui.unlockScroll();
                        }
                    }, 200);
                },

                highlightSelectorRoute: (routeNo, routeName) => {
                    const selName = routeName || routeNo;
                    if (app.route.selectorCurrentSelected === selName) return;

                    const container = document.getElementById('route-selector-items');
                    
                    // FLIP: Ghi nhận vị trí (First) trước khi sắp xếp lại DOM
                    const firstTops = new Map();
                    if (container) {
                        const oldCards = container.querySelectorAll('.route-card-item');
                        oldCards.forEach(card => {
                            const key = card.dataset.routeItemKey;
                            if (key) {
                                firstTops.set(key, card.getBoundingClientRect().top);
                            }
                        });
                    }

                    app.route.selectorCurrentSelected = selName;
                    app.route.pendingSelectedRoute = {
                        route_no: routeNo,
                        route_name: selName
                    };

                    const scrollPos = container ? container.scrollTop : 0;
                    app.route.filterSelector(true);
                    if (container) container.scrollTop = scrollPos;

                    // FLIP: Đo vị trí mới (Last) và đảo ngược (Invert)
                    if (container && firstTops.size > 0) {
                        const newCards = container.querySelectorAll('.route-card-item');
                        const animatedCards = [];
                        newCards.forEach(card => {
                            const key = card.dataset.routeItemKey;
                            const firstTop = firstTops.get(key);
                            if (firstTop !== undefined) {
                                const lastTop = card.getBoundingClientRect().top;
                                const deltaY = firstTop - lastTop;
                                if (Math.abs(deltaY) > 0.5) {
                                    card.style.transform = `translateY(${deltaY}px)`;
                                    card.style.transition = 'none';
                                    animatedCards.push(card);
                                }
                            }
                        });

                        // FLIP: Kích hoạt chuyển động mượt mà (Play)
                        if (animatedCards.length > 0) {
                            requestAnimationFrame(() => {
                                animatedCards.forEach(card => {
                                    card.style.transition = 'transform 360ms cubic-bezier(0.16, 1, 0.3, 1)';
                                    card.style.transform = '';
                                });
                                setTimeout(() => {
                                    animatedCards.forEach(card => {
                                        card.style.transition = '';
                                        card.style.transform = '';
                                    });
                                }, 380);
                            });
                        }
                    }
                },

                confirmSelector: () => {
                    if (!app.route.pendingSelectedRoute && !app.route.selectorCurrentSelected) {
                        app.ui.showAlert("Vui lòng chọn một tuyến xe từ danh sách trước khi xác nhận lưu.");
                        return;
                    }
                    const sel = app.route.pendingSelectedRoute || {
                        route_no: (app.route.selectorCurrentSelected.includes(' - ')) ? app.route.selectorCurrentSelected.split(' - ')[0].trim() : app.route.selectorCurrentSelected,
                        route_name: app.route.selectorCurrentSelected
                    };
                    app.route.selectRoute(sel.route_no, sel.route_name);
                },

                loadMoreSelectorItems: () => {
                    app.route.selectorDisplayLimit = (app.route.selectorDisplayLimit || 40) + 40;
                    const container = document.getElementById('route-selector-items');
                    const scrollPos = container ? container.scrollTop : 0;
                    app.route.filterSelector(true);
                    if (container) container.scrollTop = scrollPos;
                },

                filterSelector: (preserveScroll = false) => {
                    const searchInput = document.getElementById('route-selector-search');
                    const provFilter = document.getElementById('route-selector-prov-filter');
                    const container = document.getElementById('route-selector-items');
                    if (!container) return;

                    const scrollPos = (preserveScroll && container) ? container.scrollTop : 0;

                    const q = (searchInput ? searchInput.value : '').trim().toLowerCase();
                    const prov = (provFilter ? provFilter.value : '').trim();
                    const typeFilter = app.route.selectorTypeFilter || 'all';
                    let curSelected = (app.route.selectorCurrentSelected || '').trim().toLowerCase();

                    const routes = app.route.cachedRoutes || [];
                    const exclude = app.route.selectorExcludeRoute || '';

                    // Tự động đối chiếu chuẩn hóa nếu curSelected chỉ là số hiệu tuyến (ví dụ "59")
                    if (curSelected) {
                        let matchedRoute = routes.find(r => (r.route_name || '').toLowerCase() === curSelected);
                        if (!matchedRoute) {
                            const targetProv = (app.route.selectorContextProvince || '').trim().toLowerCase();
                            const candidates = routes.filter(r => (r.route_no || '').toLowerCase() === curSelected);
                            if (candidates.length === 1) {
                                matchedRoute = candidates[0];
                            } else if (candidates.length > 1) {
                                if (targetProv) {
                                    matchedRoute = candidates.find(r => (r.province || '').toLowerCase() === targetProv) || candidates[0];
                                } else {
                                    matchedRoute = candidates[0];
                                }
                            }
                        }
                        if (matchedRoute) {
                            app.route.selectorCurrentSelected = matchedRoute.route_name;
                            curSelected = matchedRoute.route_name.toLowerCase();
                            if (!app.route.pendingSelectedRoute) {
                                app.route.pendingSelectedRoute = {
                                    route_no: matchedRoute.route_no,
                                    route_name: matchedRoute.route_name
                                };
                            }
                        }
                    }

                    // 1. Tuyến trạng thái đặc biệt
                    let specialList = routes.filter(r => r.is_special || app.route.specialRoutes.includes(r.route_no));
                    if (app.route.selectorIsHistory) {
                        // Lịch sử xe: CHỈ CÓ DỪNG HOẠT ĐỘNG ĐƯỢC GHI VÀO LỊCH SỬ
                        specialList = specialList.filter(r => r.route_no === 'Dừng hoạt động' || r.route_name === 'Dừng hoạt động');
                    } else if (typeFilter === 'bus') {
                        // Xe buýt: Loại bỏ "Hợp đồng"
                        specialList = specialList.filter(r => r.route_no !== 'Hợp đồng' && r.route_name !== 'Hợp đồng');
                    } else if (typeFilter === 'coach') {
                        // Xe khách: Tuyến Hợp đồng lên đầu
                        specialList.sort((a, b) => {
                            if (a.route_no === 'Hợp đồng') return -1;
                            if (b.route_no === 'Hợp đồng') return 1;
                            return 0;
                        });
                    }

                    // 2. Tuyến thông thường
                    let normalList = routes.filter(r => !r.is_special && !app.route.specialRoutes.includes(r.route_no));

                    if (exclude) {
                        normalList = normalList.filter(r => r.route_name !== exclude && r.route_no !== exclude);
                    }

                    if (prov && typeFilter !== 'coach') {
                        normalList = normalList.filter(r => r.province && r.province.toLowerCase() === prov.toLowerCase());
                    }

                    if (typeFilter === 'bus') {
                        normalList = normalList.filter(r => (r.metadata?.vehicle_type || 'bus') === 'bus');
                    } else if (typeFilter === 'coach') {
                        normalList = normalList.filter(r => r.metadata?.vehicle_type === 'coach');
                    }

                    if (q) {
                        normalList = normalList.filter(r => {
                            const noMatch = (r.route_no || '').toLowerCase().includes(q);
                            const nameMatch = (r.route_name || '').toLowerCase().includes(q);
                            const pathMatch = (r.short_path || '').toLowerCase().includes(q);
                            const provMatch = (r.province || '').toLowerCase().includes(q);
                            return noMatch || nameMatch || pathMatch || provMatch;
                        });
                    }

                    // Sắp xếp tự nhiên số hiệu tuyến và tỉnh thành
                    normalList.sort(app.route.compareRoutes);

                    // Đưa tuyến đang chọn lên đầu danh sách bình thường (ghim lên top)
                    const isNormalSelected = (r) => {
                        if (!curSelected) return false;
                        const rName = (r.route_name || '').toLowerCase();
                        const rNo = (r.route_no || '').toLowerCase();
                        if (rName === curSelected) return true;
                        if (rNo === curSelected) {
                            if (!app.route.selectorContextProvince) return true;
                            if (r.province && r.province.toLowerCase() === app.route.selectorContextProvince.toLowerCase()) return true;
                        }
                        return false;
                    };
                    const selectedNormal = normalList.filter(r => isNormalSelected(r));
                    const unselectedNormal = normalList.filter(r => !isNormalSelected(r));
                    normalList = [...selectedNormal, ...unselectedNormal];

                    let html = '';

                    // Khối 1: Các trường hợp đặc biệt (nếu không chọn lọc theo một tỉnh cụ thể)
                    if (!prov) {
                        const matchedSpecials = q
                            ? specialList.filter(r => (r.route_no || '').toLowerCase().includes(q))
                            : specialList;

                        if (matchedSpecials.length > 0) {
                            html += `
                                <div class="mb-3">
                                    <p class="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 px-1">Tuyến trạng thái đặc biệt</p>
                                    <div class="grid grid-cols-2 gap-1.5">
                                        ${matchedSpecials.map(r => {
                                            const isSel = curSelected && ((r.route_no || '').toLowerCase() === curSelected || (r.route_name || '').toLowerCase() === curSelected);
                                            const cardCls = isSel ? 'selected-route-card' : 'bg-white hover:bg-gray-100';
                                            return `
                                                <div onclick="app.route.highlightSelectorRoute('${app.utils.escapeAttr(r.route_no)}', '${app.utils.escapeAttr(r.route_name)}')"
                                                     ondblclick="app.route.selectRoute('${app.utils.escapeAttr(r.route_no)}', '${app.utils.escapeAttr(r.route_name)}')"
                                                     class="cursor-pointer border border-black rounded-md p-2.5 flex items-center gap-2 transition active:scale-98 select-none ${cardCls}">
                                                    <i class="fa-solid fa-tag text-xs ${isSel ? '' : 'text-black'}"></i>
                                                    <span class="text-xs font-bold truncate ${isSel ? '' : 'text-black'}">${app.utils.escapeHtml(r.route_no)}</span>
                                                </div>
                                            `;
                                        }).join('')}
                                    </div>
                                </div>
                            `;
                        }
                    }

                    // Khối 2: Danh sách các tuyến thông thường (Hỗ trợ lazyload phân trang 40 tuyến/trang)
                    const displayLimit = app.route.selectorDisplayLimit || 40;
                    const displayedItems = normalList.slice(0, displayLimit);

                    html += `<div class="mb-2"><p class="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 px-1">Danh sách tuyến xe (${normalList.length})</p>`;

                    if (normalList.length === 0) {
                        html += `
                            <div class="text-center py-8 text-gray-500 text-xs">
                                <i class="fa-solid fa-route text-gray-300 text-2xl block mb-2"></i>
                                Không tìm thấy tuyến phù hợp. Bạn có thể nhấn <strong>"+ Tạo tuyến mới"</strong> ở trên để thêm tuyến này.
                            </div>
                        `;
                    } else {
                        html += '<div class="space-y-1.5">';
                        displayedItems.forEach(r => {
                            const isSel = isNormalSelected(r);
                            const cardCls = isSel ? 'selected-route-card' : 'bg-white hover:bg-gray-50';
                            const badge = r.is_inactive 
                                ? `<span class="route-status-badge text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0 ${isSel ? '' : 'bg-black text-white dark:bg-white dark:text-black'}">Dừng HĐ</span>` 
                                : '';
                            const isCoach = r.metadata?.vehicle_type === 'coach';
                            const provLabel = r.province ? `<span class="text-[11px] ${isSel ? 'text-gray-200' : 'text-gray-500'} font-medium">(${app.utils.escapeHtml(r.province)})</span>` : '';
                            const pathLabel = r.short_path ? `<p class="route-path-label text-[11px] ${isSel ? 'text-gray-300' : 'text-gray-500'} truncate mt-0.5">${app.utils.escapeHtml(r.short_path)}</p>` : '';

                            html += `
                                <div onclick="app.route.highlightSelectorRoute('${app.utils.escapeAttr(r.route_no)}', '${app.utils.escapeAttr(r.route_name)}')"
                                     ondblclick="app.route.selectRoute('${app.utils.escapeAttr(r.route_no)}', '${app.utils.escapeAttr(r.route_name)}')"
                                     data-route-item-key="${app.utils.escapeAttr(r.route_name || r.route_no)}"
                                     class="route-card-item cursor-pointer border border-black rounded-md p-2.5 flex items-center justify-between gap-3 active:scale-[0.99] select-none group ${cardCls}">
                                    <div class="min-w-0 flex-1">
                                        <div class="flex items-center gap-2 flex-wrap">
                                            <span class="font-extrabold text-xs tracking-wide ${isSel ? '' : 'text-black'}">${app.utils.escapeHtml(r.route_no)}</span>
                                            ${provLabel}
                                            ${badge}
                                        </div>
                                        ${pathLabel}
                                    </div>
                                    <div class="flex items-center gap-1.5 shrink-0" onclick="event.stopPropagation()">
                                        <button type="button" title="Chỉnh sửa thông tin tuyến" onclick="app.route.openEditPrompt('${app.utils.escapeAttr(r.route_name)}', '${app.utils.escapeAttr(r.province || '')}', true)"
                                                class="w-7 h-7 flex items-center justify-center rounded-md border border-black ${isSel ? 'border-white text-white' : 'text-black hover:bg-black hover:text-white'} transition text-xs">
                                            <i class="fa-solid fa-pen"></i>
                                        </button>
                                        ${!isCoach ? `
                                        <a href="/route/${r.province ? encodeURIComponent(r.province) + '/' : ''}${encodeURIComponent(r.route_no)}"
                                           onclick="app.route.closeSelector()"
                                           title="Xem hồ sơ tuyến"
                                           class="w-7 h-7 flex items-center justify-center rounded-md border border-black ${isSel ? 'border-white text-white' : 'text-black hover:bg-black hover:text-white'} transition text-xs">
                                            <i class="fa-solid fa-arrow-up-right-from-square"></i>
                                        </a>` : ''}
                                    </div>
                                </div>
                            `;
                        });
                        html += '</div>';

                        if (normalList.length > displayLimit) {
                            html += `
                                <div class="pt-2 text-center">
                                    <button type="button" onclick="app.route.loadMoreSelectorItems()" class="w-full py-2.5 border border-black dark:border-white rounded-md text-xs font-bold bg-white dark:bg-[#18181b] text-black dark:text-white hover:bg-gray-100 dark:hover:bg-[#27272a] transition active:scale-[0.99]">
                                        <i class="fa-solid fa-angles-down mr-1"></i> Xem thêm (${normalList.length - displayLimit} tuyến khác)
                                    </button>
                                </div>
                            `;
                        }
                    }
                    html += '</div>';

                    container.innerHTML = html;
                    if (preserveScroll) {
                        container.scrollTop = scrollPos;
                    }
                },

                selectRoute: (routeNo, routeName) => {
                    const targetId = app.route.selectorTargetInputId;
                    const selectedDisplayName = (routeName && routeName !== routeNo) ? routeName : routeNo;
                    if (targetId) {
                        const targetEl = document.getElementById(targetId);
                        if (targetEl) {
                            targetEl.value = routeNo;
                            targetEl.dataset.routeName = selectedDisplayName;
                            targetEl.dataset.routeNo = routeNo;
                            targetEl.dispatchEvent(new Event('change', { bubbles: true }));
                            targetEl.dispatchEvent(new Event('input', { bubbles: true }));
                        }
                    }

                    if (typeof app.route.selectorCallback === 'function') {
                        app.route.selectorCallback({
                            route_no: routeNo,
                            route_name: routeName || routeNo
                        });
                    }

                    app.route.closeSelector();
                },

                openCreatePrompt: () => {
                    if (!app.user) return app.auth.check();
                    const selectorModal = document.getElementById('route-selector-modal');
                    app.route._wasFromSelector = !!(selectorModal && !selectorModal.classList.contains('hidden'));
                    if (app.route._wasFromSelector) {
                        selectorModal.classList.add('hidden');
                        const sc = document.getElementById('route-selector-content');
                        if (sc) {
                            sc.classList.remove('opacity-100', 'scale-100');
                            sc.classList.add('opacity-0', 'scale-95');
                        }
                    }

                    app.route.isEditingExisting = false;
                    app.route.editingOriginalRouteName = '';

                    const modal = document.getElementById('route-edit-modal');
                    const content = document.getElementById('route-edit-content');
                    const titleEl = document.getElementById('route-edit-modal-title');
                    const btnSave = document.getElementById('btn-save-route');
                    const btnDelete = document.getElementById('btn-delete-route');
                    const warningText = document.getElementById('route-edit-warning-text');
                    const provContainer = document.getElementById('route-edit-province-container');
                    const btnProv = document.getElementById('btn-route-edit-province');

                    if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-plus mr-2 text-gray-500"></i>Tạo Tuyến Mới';
                    if (btnDelete) btnDelete.classList.add('hidden');
                    if (provContainer) provContainer.classList.remove('hidden');

                    if (btnProv) {
                        btnProv.disabled = false;
                        btnProv.classList.remove('bg-gray-100', 'cursor-not-allowed', 'opacity-70');
                    }
                    app.route.selectEditProvince('');
                    app.route.renderEditProvMenu('');

                    const targetType = app.route.selectorLockedType || (app.route.selectorTypeFilter === 'coach' ? 'coach' : 'bus');
                    app.route.setEditVehicleType(targetType);
                    const btnTypeBus = document.getElementById('btn-route-type-bus');
                    const btnTypeCoach = document.getElementById('btn-route-type-coach');
                    if (app.route.selectorLockedType === 'bus') {
                        if (btnTypeCoach) { btnTypeCoach.disabled = true; btnTypeCoach.classList.add('opacity-40', 'cursor-not-allowed'); }
                        if (btnTypeBus) { btnTypeBus.disabled = false; btnTypeBus.classList.remove('opacity-40', 'cursor-not-allowed'); }
                    } else if (app.route.selectorLockedType === 'coach') {
                        if (btnTypeBus) { btnTypeBus.disabled = true; btnTypeBus.classList.add('opacity-40', 'cursor-not-allowed'); }
                        if (btnTypeCoach) { btnTypeCoach.disabled = false; btnTypeCoach.classList.remove('opacity-40', 'cursor-not-allowed'); }
                    } else {
                        if (btnTypeBus) { btnTypeBus.disabled = false; btnTypeBus.classList.remove('opacity-40', 'cursor-not-allowed'); }
                        if (btnTypeCoach) { btnTypeCoach.disabled = false; btnTypeCoach.classList.remove('opacity-40', 'cursor-not-allowed'); }
                    }

                    const inactiveContainer = document.getElementById('route-edit-inactive-container');
                    if (inactiveContainer) inactiveContainer.classList.add('hidden');

                    const nameInput = document.getElementById('route-edit-name');
                    if (nameInput) {
                        nameInput.value = '';
                        nameInput.disabled = false;
                        nameInput.readOnly = false;
                        nameInput.classList.remove('bg-gray-100', 'cursor-not-allowed', 'opacity-70');
                    }
                    document.getElementById('route-edit-inactive').checked = false;
                    document.getElementById('route-edit-short-path').value = '';
                    document.getElementById('route-edit-desc').value = '';
                    document.getElementById('route-edit-ticket-price').value = '';
                    document.getElementById('route-edit-headway').value = '';
                    document.getElementById('route-edit-wheelchair').checked = false;
                    document.getElementById('route-edit-icon').value = 'default';
                    document.getElementById('route-icon-label').innerText = 'Mặc định';

                    if (app.role === 'admin' || app.role === 'manager') {
                        btnSave.innerText = "Tạo tuyến mới";
                        if (warningText) warningText.innerText = "Tuyến mới sẽ được cập nhật trực tiếp vào hệ thống.";
                    } else {
                        btnSave.innerText = "Gửi yêu cầu tạo tuyến";
                        if (warningText) warningText.innerText = "Thông tin tuyến mới sẽ được gửi đến hàng đợi và kiểm duyệt bởi Admin.";
                    }

                    modal.classList.remove('hidden');
                    app.ui.lockScroll();
                    setTimeout(() => {
                        content.classList.remove('opacity-0', 'scale-95');
                        content.classList.add('opacity-100', 'scale-100');
                    }, 10);
                },

                openEditPrompt: async (targetRouteName, targetProvince, fromSelector = false) => {
                    if (!app.user) return app.auth.check();
                    const selectorModal = document.getElementById('route-selector-modal');
                    const isFromSelector = !!fromSelector || !!(selectorModal && !selectorModal.classList.contains('hidden'));
                    app.route._wasFromSelector = isFromSelector;
                    if (selectorModal && !selectorModal.classList.contains('hidden')) {
                        selectorModal.classList.add('hidden');
                        const sc = document.getElementById('route-selector-content');
                        if (sc) {
                            sc.classList.remove('opacity-100', 'scale-100');
                            sc.classList.add('opacity-0', 'scale-95');
                        }
                    }

                    const rName = targetRouteName || (app.route.currentProvince ? `${app.route.currentRoute} - ${app.route.currentProvince}` : app.route.currentRoute);
                    const cachedRouteMatch = (app.route.cachedRoutes || []).find(r => r.route_name === rName || r.route_no === rName);
                    const isTargetCoach = cachedRouteMatch?.metadata?.vehicle_type === 'coach';
                    let rNo = (!isTargetCoach && rName.includes(' - ')) ? rName.split(' - ')[0].trim() : rName;
                    let prov = isTargetCoach ? '' : (targetProvince || (rName.includes(' - ') ? rName.split(' - ')[1].trim() : app.route.currentProvince));

                    if (app.route.specialRoutes.includes(rNo) || app.route.specialRoutes.includes(rName)) {
                        app.toast.show('error', 'Tuyến không có hồ sơ', `Tuyến "${rNo}" là tuyến trạng thái đặc biệt mặc định của hệ thống, không có hồ sơ riêng và không thể chỉnh sửa.`);
                        return;
                    }

                    app.route.isEditingExisting = true;
                    app.route.editingOriginalRouteName = rName;

                    const modal = document.getElementById('route-edit-modal');
                    const content = document.getElementById('route-edit-content');
                    const titleEl = document.getElementById('route-edit-modal-title');
                    const btnSave = document.getElementById('btn-save-route');
                    const btnDelete = document.getElementById('btn-delete-route');
                    const warningText = document.getElementById('route-edit-warning-text');
                    const provContainer = document.getElementById('route-edit-province-container');
                    const btnProv = document.getElementById('btn-route-edit-province');

                    if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-route mr-2 text-gray-500"></i>Cập nhật Thông tin Tuyến';
                    if (btnDelete) btnDelete.classList.remove('hidden');
                    if (provContainer) provContainer.classList.remove('hidden');

                    const inactiveContainer = document.getElementById('route-edit-inactive-container');
                    if (inactiveContainer) inactiveContainer.classList.remove('hidden');

                    if (btnProv) {
                        btnProv.disabled = isFromSelector;
                        if (isFromSelector) {
                            btnProv.classList.add('bg-gray-100', 'cursor-not-allowed', 'opacity-70');
                        } else {
                            btnProv.classList.remove('bg-gray-100', 'cursor-not-allowed', 'opacity-70');
                        }
                    }
                    const btnTypeBus = document.getElementById('btn-route-type-bus');
                    const btnTypeCoach = document.getElementById('btn-route-type-coach');
                    if (btnTypeBus) { btnTypeBus.disabled = false; btnTypeBus.classList.remove('opacity-40', 'cursor-not-allowed'); }
                    if (btnTypeCoach) { btnTypeCoach.disabled = false; btnTypeCoach.classList.remove('opacity-40', 'cursor-not-allowed'); }

                    app.route.setEditVehicleType(isTargetCoach ? 'coach' : 'bus');

                    app.route.selectEditProvince(prov || '');
                    app.route.renderEditProvMenu(prov || '');

                    const nameInput = document.getElementById('route-edit-name');
                    if (nameInput) {
                        nameInput.value = rNo;
                        nameInput.disabled = isFromSelector;
                        if (isFromSelector) {
                            nameInput.classList.add('bg-gray-100', 'cursor-not-allowed', 'opacity-70');
                        } else {
                            nameInput.readOnly = false;
                            nameInput.classList.remove('bg-gray-100', 'cursor-not-allowed', 'opacity-70');
                        }
                    }
                    document.getElementById('route-edit-inactive').checked = false;
                    document.getElementById('route-edit-short-path').value = '';
                    document.getElementById('route-edit-desc').value = '';
                    document.getElementById('route-edit-ticket-price').value = '';
                    document.getElementById('route-edit-headway').value = '';
                    document.getElementById('route-edit-wheelchair').checked = false;
                    document.getElementById('route-edit-icon').value = 'default';
                    document.getElementById('route-icon-label').innerText = 'Mặc định';

                    if (app.role === 'admin' || app.role === 'manager') {
                        btnSave.innerText = "Lưu thông tin";
                        if (warningText) warningText.innerText = "";
                    } else {
                        btnSave.innerText = "Gửi yêu cầu chỉnh sửa";
                        if (warningText) warningText.innerText = "Thông tin này sẽ được gửi đến hàng đợi và kiểm duyệt bởi Admin.";
                    }

                    try {
                        const { data: exactInfo } = await window.sb.from('route_info').select('description, short_path, is_inactive, metadata').eq('route_name', rName).maybeSingle();
                        if (exactInfo) {
                            document.getElementById('route-edit-inactive').checked = exactInfo.is_inactive || false;
                            document.getElementById('route-edit-short-path').value = exactInfo.short_path || '';
                            document.getElementById('route-edit-desc').value = exactInfo.description || '';
                            if (exactInfo.metadata) {
                                document.getElementById('route-edit-ticket-price').value = exactInfo.metadata.ticket_price || '';
                                document.getElementById('route-edit-headway').value = exactInfo.metadata.headway || '';
                                document.getElementById('route-edit-wheelchair').checked = exactInfo.metadata.wheelchair_support || false;
                                app.route.setEditVehicleType(exactInfo.metadata.vehicle_type || (isTargetCoach ? 'coach' : 'bus'));
                                let iconTypeMeta = exactInfo.metadata.icon_type || 'default';
                                let iconLabelMeta = 'Mặc định';
                                if (iconTypeMeta === 'circle') iconLabelMeta = 'Hình tròn (Max 5 kí tự)';
                                else if (iconTypeMeta === 'trapezoid') iconLabelMeta = 'Hình thang cân (Max 5 kí tự)';
                                document.getElementById('route-edit-icon').value = iconTypeMeta;
                                document.getElementById('route-icon-label').innerText = iconLabelMeta;
                            } else {
                                app.route.setEditVehicleType(isTargetCoach ? 'coach' : 'bus');
                            }
                        } else {
                            app.route.setEditVehicleType(isTargetCoach ? 'coach' : 'bus');
                        }

                        // (Bỏ trường ID ảnh / Xe vá tuyến theo yêu cầu)
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
                    if (!modal || !content) return;
                    content.classList.remove('opacity-100', 'scale-100');
                    content.classList.add('opacity-0', 'scale-95');
                    setTimeout(() => {
                        modal.classList.add('hidden');
                        if (app.route._wasFromSelector) {
                            app.route._wasFromSelector = false;
                            app.route.openSelector({
                                targetInputId: app.route.selectorTargetInputId,
                                onSelect: app.route.selectorCallback
                            });
                        } else {
                            app.ui.unlockScroll();
                        }
                    }, 200);
                },

                submitEdit: async () => {
                    if (!app.user) return;
                    const routeNo = (document.getElementById('route-edit-name')?.value || '').trim();
                    const province = (document.getElementById('route-edit-province')?.value || '').trim();
                    const desc = (document.getElementById('route-edit-desc')?.value || '').trim();
                    const shortPath = (document.getElementById('route-edit-short-path')?.value || '').trim();
                    const isInactive = document.getElementById('route-edit-inactive')?.checked || false;
                    const ticketPrice = (document.getElementById('route-edit-ticket-price')?.value || '').trim();
                    const headway = (document.getElementById('route-edit-headway')?.value || '').trim();
                    const wheelchairSupport = document.getElementById('route-edit-wheelchair')?.checked || false;

                    const vehicleType = document.getElementById('route-edit-vehicle-type')?.value || 'bus';
                    const isCoach = vehicleType === 'coach';

                    if (!routeNo) {
                        return app.ui.showAlert(isCoach ? "Vui lòng nhập Tên tuyến / Lộ trình xe khách." : "Vui lòng nhập Số hiệu tuyến xe.");
                    }
                    if (!isCoach && !province) {
                        return app.ui.showAlert("Vui lòng chọn Tỉnh / Thành phố cho tuyến xe.");
                    }

                    // Kiểm tra không được tạo trùng tên với 4 trường hợp đặc biệt
                    if (app.route.specialRoutes.some(s => s.toLowerCase() === routeNo.toLowerCase())) {
                        return app.ui.showAlert(`Tên tuyến "${routeNo}" trùng với tuyến trạng thái đặc biệt mặc định của hệ thống và không được phép tạo mới.`);
                    }

                    const finalProvince = isCoach ? null : (province || null);
                    const routeName = (isCoach || !finalProvince) ? routeNo : `${routeNo} - ${finalProvince}`;

                    // Nếu tạo mới HOẶC đổi số hiệu / tỉnh thành từ trang chi tiết, kiểm tra trùng lặp
                    if (!app.route.isEditingExisting || (app.route.editingOriginalRouteName && routeName !== app.route.editingOriginalRouteName)) {
                        const { data: exist } = await window.sb.from('route_info').select('route_name').eq('route_name', routeName).maybeSingle();
                        if (exist) {
                            return app.ui.showAlert(`Tuyến "${routeName}" đã tồn tại trên hệ thống. Vui lòng chọn lộ trình khác!`);
                        }
                    }

                    let metadata = {};
                    metadata.vehicle_type = vehicleType;

                    let metadataObj = null;

                    if (vehicleType === 'coach') {
                        metadataObj = { vehicle_type: 'coach' };
                    } else {
                        if (ticketPrice) metadata.ticket_price = ticketPrice;
                        if (headway) metadata.headway = headway;
                        if (wheelchairSupport) metadata.wheelchair_support = wheelchairSupport;

                        const iconType = document.getElementById('route-edit-icon')?.value || 'default';
                        if (iconType !== 'default') {
                            if (routeNo.length <= 5) {
                                metadata.icon_type = iconType;
                            } else {
                                app.toast.show('warning', 'Lưu ý', 'Tên tuyến dài hơn 5 kí tự không thể sử dụng icon tùy chỉnh. Đã tự động chuyển về mặc định.');
                            }
                        }

                        metadataObj = Object.keys(metadata).length > 0 ? metadata : null;
                    }

                    const btn = document.getElementById('btn-save-route');
                    const origText = btn.innerHTML;
                    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Đang xử lý...';
                    btn.disabled = true;

                    try {
                        if (app.role === 'admin' || app.role === 'manager') {
                            const { error: upsertErr } = await window.sb.from('route_info').upsert({
                                route_name: routeName,
                                route_no: routeNo,
                                province: finalProvince,
                                short_path: isCoach ? null : (shortPath || null),
                                description: isCoach ? null : (desc || null),
                                is_inactive: isInactive,
                                is_special: false,
                                metadata: metadataObj
                            }, { onConflict: 'route_name' });
                            if (upsertErr) throw upsertErr;

                            // Nếu đổi tên tuyến từ trang chi tiết, dọn dẹp bản ghi cũ và di chuyển liên kết
                            if (app.route.isEditingExisting && app.route.editingOriginalRouteName && app.route.editingOriginalRouteName !== routeName) {
                                await window.sb.from('route_info').delete().eq('route_name', app.route.editingOriginalRouteName);
                                await window.sb.from('photos').update({ borrowed_route: routeName }).eq('borrowed_route', app.route.editingOriginalRouteName);
                            }

                            // (Bỏ xử lý cập nhật ID ảnh và biển số xe vá tuyến)

                            app.route.cachedRoutes = null;
                            app.toast.show('success', 'Thành công', app.route.isEditingExisting ? 'Đã lưu thông tin Tuyến!' : 'Đã tạo tuyến mới thành công!');
                            const wasFromSelector = app.route._wasFromSelector;
                            app.route._wasFromSelector = false;
                            app.route.closeEditPrompt();

                            if (app.route.isEditingExisting && app.route.editingOriginalRouteName && app.route.editingOriginalRouteName !== routeName) {
                                app.route.currentRoute = routeNo;
                                app.route.currentProvince = province;
                                app.utils.navigate('/route/' + (province ? encodeURIComponent(province) + '/' : '') + encodeURIComponent(routeNo));
                            } else if (app.route.currentRoute === routeNo && app.route.currentProvince === province) {
                                app.route.loadRoutePage(province, routeNo, true);
                            }
                            await app.route.fetchRoutes(true);
                            app.route.filterSelector();

                            if (wasFromSelector && (app.route.selectorTargetInputId || typeof app.route.selectorCallback === 'function')) {
                                app.route.selectRoute(routeNo, routeName);
                            }
                        } else {
                            // Người dùng thường gửi yêu cầu qua edit_requests
                            const wasFromSelector = app.route._wasFromSelector;
                            app.route._wasFromSelector = false;
                            const reqType = app.route.isEditingExisting ? 'update_route_info' : 'create_route_info';
                            let checkQuery = window.sb.from('edit_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending');
                            const { count, error: checkErr } = await checkQuery.contains('new_data', { request_type: reqType, route_name: routeName });
                            if (checkErr) throw checkErr;
                            if (count > 0) throw new Error("Đã có một yêu cầu cho tuyến này đang chờ duyệt.");

                            const reqData = {
                                requester_id: app.user.id,
                                license_plate: 'ROUTE_INFO',
                                new_data: {
                                    request_type: reqType,
                                    old_route_name: app.route.isEditingExisting ? app.route.editingOriginalRouteName : null,
                                    route_name: routeName,
                                    route_no: routeNo,
                                    province: finalProvince,
                                    short_path: isCoach ? null : (shortPath || null),
                                    description: isCoach ? null : (desc || null),
                                    is_inactive: isInactive,
                                    metadata: metadataObj
                                },
                                status: 'pending'
                            };
                            const { error } = await window.sb.from('edit_requests').insert(reqData);
                            if (error) throw error;
                            app.ui.showAlert(app.route.isEditingExisting ? "Đã gửi yêu cầu cập nhật thông tin Tuyến và đang chờ Admin duyệt." : "Đã gửi yêu cầu tạo Tuyến mới và đang chờ Admin duyệt. Tuyến này đã được tạm áp dụng vào biểu mẫu của bạn.");
                            app.route.closeEditPrompt();
                            if (wasFromSelector && (app.route.selectorTargetInputId || typeof app.route.selectorCallback === 'function')) {
                                app.route.selectRoute(routeNo, routeName);
                            }
                        }
                    } catch (err) {
                        app.ui.showAlert("Lỗi: " + err.message);
                    } finally {
                        btn.innerHTML = origText;
                        btn.disabled = false;
                    }
                },

                openDeletePrompt: (targetRouteName) => {
                    if (!app.user) return app.auth.check();
                    const target = targetRouteName || app.route.editingOriginalRouteName || (app.route.currentProvince ? `${app.route.currentRoute} - ${app.route.currentProvince}` : app.route.currentRoute);
                    if (!target) return;

                    const targetNo = target.split(' - ')[0].trim();
                    if (app.route.specialRoutes.includes(targetNo) || app.route.specialRoutes.includes(target)) {
                        return app.ui.showAlert("Các tuyến trạng thái đặc biệt mặc định của hệ thống không thể bị xóa.");
                    }

                    app.route.deletingRouteName = target;
                    document.getElementById('del-route-target-name').innerText = target;
                    document.getElementById('del-route-dest-display').value = 'Ngoài giờ hoạt động';
                    document.getElementById('del-route-dest-val').value = 'Ngoài giờ hoạt động';
                    document.getElementById('del-route-dest-val').dataset.routeName = 'Ngoài giờ hoạt động';

                    const modal = document.getElementById('route-delete-modal');
                    const content = document.getElementById('route-delete-content');
                    modal.classList.remove('hidden');
                    app.ui.lockScroll();
                    setTimeout(() => {
                        content.classList.remove('opacity-0', 'scale-95');
                        content.classList.add('opacity-100', 'scale-100');
                    }, 10);
                },

                closeDeletePrompt: () => {
                    const modal = document.getElementById('route-delete-modal');
                    const content = document.getElementById('route-delete-content');
                    if (!modal || !content) return;
                    content.classList.remove('opacity-100', 'scale-100');
                    content.classList.add('opacity-0', 'scale-95');
                    setTimeout(() => {
                        modal.classList.add('hidden');
                        app.ui.unlockScroll();
                    }, 200);
                },

                chooseDeleteDestination: () => {
                    const delModal = document.getElementById('route-delete-modal');
                    if (delModal) delModal.classList.add('hidden');
                    app.route.openSelector({
                        excludeRoute: app.route.deletingRouteName,
                        onSelect: (r) => {
                            const disp = r.route_name || r.route_no;
                            document.getElementById('del-route-dest-display').value = disp;
                            document.getElementById('del-route-dest-val').value = r.route_no;
                            document.getElementById('del-route-dest-val').dataset.routeName = disp;
                            if (delModal) {
                                delModal.classList.remove('hidden');
                                app.ui.lockScroll();
                            }
                        }
                    });
                },

                confirmDeleteRoute: async () => {
                    if (!app.user) return;
                    const deletingName = app.route.deletingRouteName;
                    if (!deletingName) return;
                    const cachedRoute = (app.route.cachedRoutes || []).find(r => r.route_name === deletingName);
                    const isDelCoach = cachedRoute?.metadata?.vehicle_type === 'coach';
                    const deletingNo = (!isDelCoach && deletingName.includes(' - ')) ? deletingName.split(' - ')[0].trim() : deletingName;
                    const deletingProv = isDelCoach ? '' : (deletingName.includes(' - ') ? deletingName.split(' - ').slice(1).join(' - ').trim() : '');

                    const destRouteNo = (document.getElementById('del-route-dest-val')?.value || 'Ngoài giờ hoạt động').trim();
                    const destRouteName = (document.getElementById('del-route-dest-val')?.dataset.routeName || destRouteNo).trim();

                    const btn = document.getElementById('btn-confirm-delete-route');
                    const origText = btn.innerHTML;
                    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Đang xóa...';
                    btn.disabled = true;

                    try {
                        if (app.role === 'admin' || app.role === 'manager') {
                            const newBorrowed = destRouteName !== destRouteNo ? destRouteName : null;
                            const provMatch = deletingProv && app.utils.provinceData ? app.utils.provinceData.find(p => p.ten.toLowerCase() === deletingProv.toLowerCase()) : null;
                            const provPrefixes = provMatch ? (Array.isArray(provMatch.ky_hieu) ? provMatch.ky_hieu : String(provMatch.ky_hieu).split(',').map(s => s.trim())) : [];

                            // 1. Chuyển tất cả ảnh thuộc tuyến bị xóa sang tuyến đích (chỉ các ảnh thực sự thuộc tuyến và tỉnh này)
                            const { data: candPhotos } = await window.sb.from('photos')
                                .select('id, license_plate, route_no, borrowed_route')
                                .or(`route_no.eq."${deletingNo}",borrowed_route.eq."${deletingName}"`);
                            
                            const isPhotoMatch = (p) => {
                                if (p.borrowed_route === deletingName) return true;
                                if (p.route_no === deletingNo && (!p.borrowed_route || p.borrowed_route === '')) {
                                    if (provMatch) {
                                        if (provPrefixes.some(pref => (p.license_plate || '').startsWith(pref))) return true;
                                        if (app.utils.getProvinceFromPlate && app.utils.getProvinceFromPlate(p.license_plate) === provMatch.ten) return true;
                                        return false;
                                    }
                                    return p.borrowed_route === deletingName || p.route_no === deletingName;
                                }
                                return false;
                            };

                            const targetPhotoIds = (candPhotos || []).filter(isPhotoMatch).map(p => p.id);
                            for (let i = 0; i < targetPhotoIds.length; i += 100) {
                                const chunk = targetPhotoIds.slice(i, i + 100);
                                await window.sb.from('photos').update({ route_no: destRouteNo, borrowed_route: newBorrowed }).in('id', chunk);
                            }

                            // 2. Chuyển tất cả lịch sử phương tiện (vehicle_history) sang tuyến đích (chỉ xe thuộc tỉnh này)
                            const { data: candHist } = await window.sb.from('vehicle_history')
                                .select('id, license_plate, route')
                                .or(`route.eq."${deletingNo}",route.eq."${deletingName}"`);

                            const isHistMatch = (h) => {
                                if (h.route === deletingName) return true;
                                if (h.route === deletingNo) {
                                    const vehiclePhotos = (candPhotos || []).filter(p => (p.license_plate || '').toUpperCase() === (h.license_plate || '').toUpperCase());
                                    const hasThisBorrowed = vehiclePhotos.some(p => p.borrowed_route === deletingName);
                                    if (hasThisBorrowed) return true;
                                    const hasOtherBorrowed = vehiclePhotos.some(p => p.borrowed_route && p.borrowed_route !== deletingName && p.route_no === deletingNo);
                                    if (hasOtherBorrowed) return false;

                                    if (provMatch) {
                                        if (provPrefixes.some(pref => (h.license_plate || '').startsWith(pref))) return true;
                                        if (app.utils.getProvinceFromPlate && app.utils.getProvinceFromPlate(h.license_plate) === provMatch.ten) return true;
                                        return false;
                                    }
                                    return h.route === deletingName;
                                }
                                return false;
                            };

                            const targetHistIds = (candHist || []).filter(isHistMatch).map(h => h.id);
                            for (let i = 0; i < targetHistIds.length; i += 100) {
                                const chunk = targetHistIds.slice(i, i + 100);
                                await window.sb.from('vehicle_history').update({ route: destRouteNo }).in('id', chunk);
                            }

                            // 3. Xóa hồ sơ tuyến khỏi bảng route_info
                            const { error: delErr } = await window.sb.from('route_info').delete().eq('route_name', deletingName);
                            if (delErr) throw delErr;

                            app.route.cachedRoutes = null;
                            app.toast.show('success', 'Đã xóa tuyến', `Đã chuyển toàn bộ ảnh và lịch sử xe sang tuyến "${destRouteName}" và xóa hồ sơ.`);
                            app.route.closeDeletePrompt();
                            app.route.closeEditPrompt();

                            if (app.route.currentRoute === deletingNo) {
                                app.utils.navigate('/');
                            }
                            await app.route.fetchRoutes(true);
                            app.route.filterSelector();
                        } else {
                            // Thành viên thường gửi yêu cầu duyệt xóa
                            const reqData = {
                                requester_id: app.user.id,
                                license_plate: 'ROUTE_INFO',
                                new_data: {
                                    request_type: 'delete_route',
                                    route_name: deletingName,
                                    route_no: deletingNo,
                                    province: deletingProv,
                                    dest_route_no: destRouteNo,
                                    dest_route_name: destRouteName
                                },
                                status: 'pending'
                            };
                            const { error } = await window.sb.from('edit_requests').insert(reqData);
                            if (error) throw error;
                            app.ui.showAlert(`Đã gửi yêu cầu xóa tuyến và chuyển dữ liệu sang tuyến "${destRouteName}". Admin sẽ kiểm duyệt yêu cầu của bạn.`);
                            app.route.closeDeletePrompt();
                            app.route.closeEditPrompt();
                        }
                    } catch (err) {
                        app.ui.showAlert("Lỗi khi xóa tuyến: " + err.message);
                    } finally {
                        btn.innerHTML = origText;
                        btn.disabled = false;
                    }
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
