// Extracted to page_search.js
Object.assign(window.app, {
    search: {
                advancedFilters: [],
                FIELD_CONFIGS: {
                    'license_plate': { label: 'Biển kiểm soát', type: 'text', ops: [{v:'ilike', l:'Chứa'}, {v:'eq', l:'Bằng'}, {v:'neq', l:'Khác'}, {v:'not_ilike', l:'Không chứa'}] },
                    'route_no':     { label: 'Mã số tuyến',   type: 'text', ops: [{v:'ilike', l:'Chứa'}, {v:'eq', l:'Bằng'}, {v:'neq', l:'Khác'}, {v:'not_ilike', l:'Không chứa'}] },
                    'operator':     { label: 'Đơn vị vận hành', type: 'text', ops: [{v:'ilike', l:'Chứa'}, {v:'eq', l:'Bằng'}, {v:'neq', l:'Khác'}, {v:'not_ilike', l:'Không chứa'}] },
                    'model':        { label: 'Dòng xe',        type: 'text', ops: [{v:'ilike', l:'Chứa'}, {v:'eq', l:'Bằng'}, {v:'neq', l:'Khác'}, {v:'not_ilike', l:'Không chứa'}] },
                    'location':     { label: 'Vị trí chụp',    type: 'text', ops: [{v:'ilike', l:'Chứa'}, {v:'not_ilike', l:'Không chứa'}, {v:'eq', l:'Bằng'}] },
                    'type':         { label: 'Loại xe',        type: 'select_type', ops: [{v:'eq', l:'Bằng'}, {v:'neq', l:'Khác'}] },
                    'camera_model': { label: 'Thiết bị chụp',  type: 'text', ops: [{v:'ilike', l:'Chứa'}, {v:'eq', l:'Bằng'}, {v:'neq', l:'Khác'}] },
                    'taken_at':     { label: 'Ngày chụp',      type: 'date', ops: [{v:'eq', l:'Bằng'}, {v:'gt', l:'Sau ngày'}, {v:'gte', l:'Từ ngày'}, {v:'lt', l:'Trước ngày'}, {v:'lte', l:'Đến ngày'}, {v:'neq', l:'Khác'}] },
                    'uploader':     { label: 'Người đăng',     type: 'text', ops: [{v:'ilike', l:'Chứa'}, {v:'eq', l:'Bằng'}, {v:'neq', l:'Khác'}] }
                },
                openAdvancedFilterModal: () => {
                    if (app.search.advancedFilters.length >= 15) {
                        if (app.toast) app.toast.show('error', 'Giới hạn', 'Tối đa 15 bộ lọc!');
                        else alert('Tối đa 15 bộ lọc!');
                        return;
                    }
                    const modal = document.getElementById('advanced-filter-modal');
                    const content = document.getElementById('advanced-filter-content');
                    if (!modal || !content) return;
                    if (!app.search.editingFilterId) {
                        const btn = document.getElementById('btn-adv-filter-apply');
                        if(btn) btn.innerText = 'Thêm vào bộ lọc';
                    }
                    document.getElementById('adv-field-select').value = '';
                    document.getElementById('adv-field-label').innerText = '-- Chọn trường --';
                    document.getElementById('adv-operator-select').value = '';
                    document.getElementById('adv-operator-label').innerText = '-- Chọn điều kiện --';
                    document.getElementById('adv-operator-btn').disabled = true;
                    const valContainer = document.getElementById('adv-filter-value-container');
                    valContainer.innerHTML = '<input type="text" id="adv-filter-value" placeholder="Nhập giá trị..." autocomplete="off" value="" class="w-full bg-white border border-gray-300 hover:border-black rounded-xl p-3.5 text-sm font-bold text-gray-700 transition-all shadow-sm focus:ring-2 focus:ring-black outline-none disabled:bg-gray-100 disabled:shadow-none disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:font-medium disabled:text-gray-400" disabled>';
                    const valInp = document.getElementById('adv-filter-value');
                    if (valInp) valInp.value = '';
                    document.querySelectorAll('#advanced-filter-modal .filter-item').forEach(item => {
                        item.classList.remove('selected');
                        const icon = item.querySelector('.check-icon');
                        if (icon) icon.classList.add('opacity-0');
                    });
                    modal.classList.remove('hidden');
                    content.classList.remove('modal-content-leave');
                    content.classList.add('modal-content-enter');
                    app.ui?.lockScroll?.();
                    setTimeout(() => {
                        content.classList.remove('modal-content-enter');
                    }, 300);
                },
                openAdvancedFilter: () => {
                    app.search.openAdvancedFilterModal();
                },
                closeAdvancedFilterModal: () => {
                    const modal = document.getElementById('advanced-filter-modal');
                    const content = document.getElementById('advanced-filter-content');
                    if (!modal || !content) return;
                    content.classList.remove('modal-content-enter');
                    content.classList.add('modal-content-leave');
                    setTimeout(() => {
                        modal.classList.add('hidden');
                        content.classList.remove('modal-content-leave');
                        app.ui?.unlockScroll?.();
                        app.search.editingFilterId = null;
                        const btn = document.getElementById('btn-adv-filter-apply');
                        if(btn) btn.innerText = 'Thêm vào bộ lọc';
                    }, 200);
                },
                selectAdvField: (val, label, el) => {
                    document.getElementById('adv-field-select').value = val;
                    document.getElementById('adv-field-label').innerText = label;
                    document.getElementById('adv-field-menu').classList.remove('active');
                    document.querySelectorAll('#adv-field-menu .filter-item').forEach(item => {
                        item.classList.remove('selected');
                        const icon = item.querySelector('.check-icon');
                        if (icon) icon.classList.add('opacity-0');
                    });
                    if (el) {
                        el.classList.add('selected');
                        const icon = el.querySelector('.check-icon');
                        if (icon) icon.classList.remove('opacity-0');
                    }
                    app.search.onAdvancedFieldChange();
                },
                selectAdvOp: (val, label, el) => {
                    document.getElementById('adv-operator-select').value = val;
                    document.getElementById('adv-operator-label').innerText = label;
                    document.getElementById('adv-operator-menu').classList.remove('active');
                    document.querySelectorAll('#adv-operator-menu .filter-item').forEach(item => {
                        item.classList.remove('selected');
                        const icon = item.querySelector('.check-icon');
                        if (icon) icon.classList.add('opacity-0');
                    });
                    if (el) {
                        el.classList.add('selected');
                        const icon = el.querySelector('.check-icon');
                        if (icon) icon.classList.remove('opacity-0');
                    }
                },
                selectAdvVal: (val, label, el) => {
                    document.getElementById('adv-filter-value').value = val;
                    document.getElementById('adv-val-label').innerText = label;
                    document.getElementById('adv-val-menu').classList.remove('active');
                    document.querySelectorAll('#adv-val-menu .filter-item').forEach(item => {
                        item.classList.remove('selected');
                        const icon = item.querySelector('.check-icon');
                        if (icon) icon.classList.add('opacity-0');
                    });
                    if (el) {
                        el.classList.add('selected');
                        const icon = el.querySelector('.check-icon');
                        if (icon) icon.classList.remove('opacity-0');
                    }
                },
                onAdvancedFieldChange: () => {
                    const fieldKey = document.getElementById('adv-field-select').value;
                    const config = app.search.FIELD_CONFIGS[fieldKey];
                    if (!config) return;
                    const opMenu = document.getElementById('adv-operator-menu');
                    opMenu.innerHTML = config.ops.map(o => `<div class="filter-item" onclick="app.search.selectAdvOp('${o.v}', '${o.l}', this)"><span class="font-bold">${o.l}</span><i class="fa-solid fa-check opacity-0 check-icon ml-auto"></i></div>`).join('');
                    document.getElementById('adv-operator-select').value = config.ops[0].v;
                    document.getElementById('adv-operator-label').innerText = config.ops[0].l;
                    const firstOp = opMenu.querySelector('.filter-item');
                    if (firstOp) {
                        firstOp.classList.add('selected');
                        const icon = firstOp.querySelector('.check-icon');
                        if (icon) icon.classList.remove('opacity-0');
                    }
                    document.getElementById('adv-operator-btn').disabled = false;
                    const valContainer = document.getElementById('adv-filter-value-container');
                    if (config.type === 'date') {
                        valContainer.innerHTML = '<input type="date" id="adv-filter-value" class="w-full px-3.5 py-2.5 text-sm font-medium bg-white/90 border border-gray-300 hover:border-black rounded-xl outline-none focus:ring-2 focus:ring-black transition-all shadow-sm text-gray-800">';
                    } else if (config.type === 'select_type') {
                        valContainer.innerHTML = `
                            <input type="hidden" id="adv-filter-value" value="">
                            <button type="button" id="adv-val-btn" onclick="document.getElementById('adv-val-menu').classList.toggle('active')" class="w-full flex items-center justify-between bg-white border border-gray-300 hover:border-black hover:bg-gray-50 rounded-xl p-3.5 text-sm font-bold text-gray-700 transition-all shadow-sm focus:ring-2 focus:ring-black outline-none">
                                <span id="adv-val-label" class="truncate pr-4">-- Chọn loại xe --</span>
                                <i class="fa-solid fa-chevron-down text-gray-400 shrink-0"></i>
                            </button>
                            <div id="adv-val-menu" class="filter-menu left-0 right-0 origin-top mt-2 !max-h-[250px] !z-[999]" style="width: 100% !important;">
                                <div class="filter-item" onclick="app.search.selectAdvVal('bus', 'Xe Buýt', this)"><span class="font-bold">Xe Buýt</span><i class="fa-solid fa-check opacity-0 check-icon ml-auto"></i></div>
                                <div class="filter-item" onclick="app.search.selectAdvVal('coach', 'Xe Khách', this)"><span class="font-bold">Xe Khách</span><i class="fa-solid fa-check opacity-0 check-icon ml-auto"></i></div>
                            </div>
                        `;
                    } else {
                        valContainer.innerHTML = '<input type="text" id="adv-filter-value" placeholder="Nhập giá trị..." autocomplete="off" oninput="app.search.triggerAdvSuggestion(this.value)" onkeydown="if(event.key===\'Escape\') { const box = document.getElementById(\'adv-filter-suggestions\'); if(box) box.classList.remove(\'active\'); } if(event.key===\'Enter\') { const box = document.getElementById(\'adv-filter-suggestions\'); if(box) box.classList.remove(\'active\'); app.search.applyAdvancedFilter(); }" class="w-full bg-white border border-gray-300 hover:border-black rounded-xl p-3.5 text-sm font-bold text-gray-700 transition-all shadow-sm focus:ring-2 focus:ring-black outline-none">';
                    }
                },
                applyAdvancedFilter: () => {
                    const fieldKey = document.getElementById('adv-field-select').value;
                    const opKey = document.getElementById('adv-operator-select').value;
                    const valInput = document.getElementById('adv-filter-value');
                    const val = valInput ? valInput.value.trim() : '';
                    if (!fieldKey || !opKey || !val) {
                        if (app.toast) app.toast.show('error', 'Lỗi', 'Vui lòng điền đủ Trường, Điều kiện và Giá trị!');
                        else alert('Vui lòng điền đủ Trường, Điều kiện và Giá trị!');
                        return;
                    }
                    const fieldConfig = app.search.FIELD_CONFIGS[fieldKey] || { label: fieldKey, ops: [] };
                    const opConfig = (fieldConfig.ops || []).find(o => o.v === opKey);
                    let displayVal = val;
                    if (fieldKey === 'type') displayVal = (val === 'bus' ? 'Xe Buýt' : 'Xe Khách');
                    const filterObj = {
                        id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
                        field: fieldKey,
                        fieldLabel: fieldConfig.label,
                        op: opKey,
                        opLabel: opConfig ? opConfig.l.split(' ')[0] : opKey,
                        value: val,
                        displayVal: displayVal
                    };
                    app.search.advancedFilters = app.search.advancedFilters || [];
                    if (app.search.editingFilterId) {
                        filterObj.id = app.search.editingFilterId;
                        app.search.advancedFilters = app.search.advancedFilters.filter(x => x.id !== app.search.editingFilterId);
                        app.search.editingFilterId = null;
                        const btn = document.getElementById('btn-adv-filter-apply');
                        if(btn) btn.innerText = 'Thêm vào bộ lọc';
                    }
                    app.search.advancedFilters.push(filterObj);
                    app.currentFilter = 'advanced';
                    app.search.renderAdvancedFilterChips();
                    app.search.closeAdvancedFilterModal();
                    app.views.switch('search', false);
                    app.handleSearch(true, 'page-search-input');
                },
                renderAdvancedFilterChips: () => {
                    const headerBox = document.getElementById('header-advanced-modules');
                    const pageBox = document.getElementById('page-advanced-modules');
                    const isAdvanced = app.currentFilter === 'advanced';
                    [headerBox, pageBox].forEach(box => {
                        if (!box) return;
                        if (!isAdvanced) {
                            box.classList.add('hidden');
                            box.innerHTML = '';
                            return;
                        }
                        box.classList.remove('hidden');
                        let html = (app.search.advancedFilters || []).map(f => `
                            <div class="inline-flex items-center gap-1.5 py-1 px-2.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:border-gray-500 rounded-md shadow-sm shrink-0 cursor-pointer transition-colors" onclick="event.stopPropagation(); app.search.editAdvancedFilter('${f.id}')">
                                <span class="text-gray-500 font-normal">${f.fieldLabel}:</span>
                                <span class="font-bold text-black">${f.opLabel} "${f.displayVal}"</span>
                                <button type="button" onclick="event.stopPropagation(); app.search.removeAdvancedFilter('${f.id}')" class="ml-1 text-gray-400 hover:text-red-600 transition">
                                    <i class="fa-solid fa-xmark"></i>
                                </button>
                            </div>
                        `).join('');
                        html += `
                            <button type="button" onclick="event.stopPropagation(); app.search.openAdvancedFilterModal()" class="shrink-0 text-xs font-bold text-gray-600 bg-white border border-gray-300 hover:border-gray-400 hover:text-black rounded-md py-1 px-2.5 shadow-sm transition">
                                + Thêm
                            </button>
                        `;
                        box.innerHTML = html;
                    });
                },
                removeAdvancedFilter: (id) => {
                    app.search.advancedFilters = app.search.advancedFilters.filter(f => f.id !== id);
                    if (app.search.advancedFilters.length === 0) {
                        app.search.setFilter('all', false); 
                    }
                    app.search.renderAdvancedFilterChips();
                    app.handleSearch(true, 'page-search-input');
                },
                editAdvancedFilter: (id) => {
                    const f = app.search.advancedFilters.find(x => x.id === id);
                    if (!f) return;
                    app.search.openAdvancedFilterModal();
                    app.search.editingFilterId = id;
                    const btn = document.getElementById('btn-adv-filter-apply');
                    if(btn) btn.innerText = 'Cập nhật';
                    const fieldItems = document.querySelectorAll('#adv-field-menu .filter-item');
                    let fieldEl = null;
                    fieldItems.forEach(item => {
                        if (item.getAttribute('onclick').includes(`'${f.field}'`)) fieldEl = item;
                    });
                    app.search.selectAdvField(f.field, f.fieldLabel, fieldEl);
                    setTimeout(() => {
                        const opItems = document.querySelectorAll('#adv-operator-menu .filter-item');
                        let opEl = null;
                        opItems.forEach(item => {
                            if (item.getAttribute('onclick').includes(`'${f.op}'`)) opEl = item;
                        });
                        app.search.selectAdvOp(f.op, f.opLabel, opEl);
                        const valInput = document.getElementById('adv-filter-value');
                        if (valInput) valInput.value = f.value;
                        const valLabel = document.getElementById('adv-val-label');
                        if (valLabel && f.displayVal) valLabel.innerText = f.displayVal;
                    }, 10);
                },
                clearAdvancedFilters: () => {
                    app.search.advancedFilters = [];
                    app.search.setFilter('all', false); 
                    app.search.renderAdvancedFilterChips();
                    app.handleSearch(true, 'page-search-input');
                },
                applyAdvancedFiltersToQuery: (q) => {
                    if (!app.search.advancedFilters || app.search.advancedFilters.length === 0) return q;
                    const grouped = {};
                    app.search.advancedFilters.forEach(f => {
                        if (!grouped[f.field]) grouped[f.field] = [];
                        grouped[f.field].push(f);
                    });
                    Object.keys(grouped).forEach(rawFld => {
                        const filters = grouped[rawFld];
                        let fld = rawFld;
                        let foreignTbl = null;
                        if (fld === 'uploader') {
                            fld = 'username';
                            foreignTbl = 'profiles';
                        } else if (fld === 'model') {
                            fld = 'model';
                            foreignTbl = 'vehicles';
                        }
                        const eqLikeFilters = filters.filter(f => f.op === 'eq' || f.op === 'ilike');
                        const otherFilters = filters.filter(f => f.op !== 'eq' && f.op !== 'ilike');
                        if (eqLikeFilters.length > 1) {
                            const orConds = eqLikeFilters.map(f => {
                                const safeVal = (f.value || '').replace(/"/g, '').replace(/,/g, '\\,');
                                if (f.op === 'eq') return `${fld}.eq."${safeVal}"`;
                                if (f.op === 'ilike') return `${fld}.ilike."%${safeVal}%"`;
                            });
                            if (foreignTbl) {
                                q = q.or(orConds.join(','), { referencedTable: foreignTbl });
                            } else {
                                q = q.or(orConds.join(','));
                            }
                        } else {
                            eqLikeFilters.forEach(f => otherFilters.push(f));
                        }
                        otherFilters.forEach(f => {
                            let dbFld = fld;
                            if (foreignTbl) dbFld = `${foreignTbl}.${fld}`;
                            if (f.op === 'eq') q = q.eq(dbFld, f.value);
                            else if (f.op === 'neq') q = q.neq(dbFld, f.value);
                            else if (f.op === 'ilike') q = q.ilike(dbFld, `%${f.value}%`);
                            else if (f.op === 'not_ilike') q = q.not('ilike', dbFld, `%${f.value}%`);
                            else if (f.op === 'gt') q = q.gt(dbFld, f.value);
                            else if (f.op === 'gte') q = q.gte(dbFld, f.value);
                            else if (f.op === 'lt') q = q.lt(dbFld, f.value);
                            else if (f.op === 'lte') q = q.lte(dbFld, f.value);
                        });
                    });
                    return q;
                },
                currentExactPrefix: '', 
                initExactRouteMenu: () => {
                    const renderHtml = `<div class="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 mb-1 bg-gray-50">Tìm theo khu vực</div>`
                        + `<div class="filter-item ${!app.search.currentExactPrefix ? 'selected' : ''}" onclick="app.search.setExactRoute('')"><span>Toàn quốc</span> <i class="fa-solid fa-check ${!app.search.currentExactPrefix ? '' : 'opacity-0'} check-icon"></i></div>` 
                        + app.utils.provinceData.map(p => {
                            const prefix = Array.isArray(p.ky_hieu) ? p.ky_hieu[0] : p.ky_hieu.split(',')[0];
                            const isSelected = app.search.currentExactPrefix === prefix;
                            return `<div class="filter-item ${isSelected ? 'selected' : ''}" onclick="app.search.setExactRoute('${prefix}', '${p.ten}')">
                                <span>${p.ten}</span> <i class="fa-solid fa-check ${isSelected ? '' : 'opacity-0'} check-icon"></i>
                            </div>`;
                        }).join('');
                    const pgMenu = document.getElementById('exact-route-page-menu');
                    if (pgMenu) pgMenu.innerHTML = renderHtml;
                },
                setExactRoute: (prefix, name = 'Toàn quốc') => {
                    app.search.currentExactPrefix = prefix;
                    app.search.currentExactProvName = prefix ? name : null;
                    document.getElementById('exact-route-page-menu')?.classList.remove('active');
                    app.search.syncExactUI(prefix, prefix ? name : null);
                    if (window.location.pathname.includes('/search')) {
                        app.handleSearch(true);
                    }
                },
                syncExactUI: (prefix, explicitName = null) => {
                    app.search.currentExactPrefix = prefix || '';
                    let provName = 'Toàn quốc'; 
                    if (explicitName && explicitName !== 'Toàn quốc') {
                        provName = explicitName;
                        app.search.currentExactProvName = explicitName;
                    } else if (prefix && app.utils.provinceData) {
                        const prov = app.utils.provinceData.find(p => {
                            const k = Array.isArray(p.ky_hieu) ? p.ky_hieu : p.ky_hieu.split(',');
                            return k.map(s => s.trim()).includes(prefix);
                        });
                        if (prov) {
                            provName = prov.ten;
                            app.search.currentExactProvName = prov.ten;
                        }
                    } else {
                        app.search.currentExactProvName = null;
                    }
                    const pgLabel = document.getElementById('exact-route-page-label');
                    if (pgLabel) {
                        pgLabel.innerText = provName;
                        const btn = pgLabel.parentElement;
                        if (prefix) {
                            btn.className = "py-1.5 px-3 md:py-2 md:px-3.5 text-[11px] md:text-xs font-bold text-white bg-black border border-black rounded-md transition-all duration-200 flex items-center justify-center max-w-[140px] shadow-md cursor-pointer hover:bg-gray-800";
                        } else {
                            btn.className = "py-1.5 px-3 md:py-2 md:px-3.5 text-[11px] md:text-xs font-semibold text-gray-600 bg-white border border-gray-300 hover:border-gray-400 hover:text-black hover:bg-gray-50 rounded-md transition-all duration-200 flex items-center justify-center max-w-[140px] shadow-sm cursor-pointer";
                        }
                    }
                    app.search.initExactRouteMenu();
                },
                toggleFilter: (menuId = 'search-filter-menu') => {
                    document.getElementById(menuId).classList.toggle('active');
                },
                setFilter: (filter, triggerSearch = true) => {
                    app.currentFilter = filter;
                    document.querySelectorAll('.filter-menu .filter-item').forEach(item => {
                        const itemFilter = item.getAttribute('data-filter');
                        const checkIcon = item.querySelector('.check-icon');
                        if (itemFilter === filter) {
                            item.classList.add('selected');
                            if (checkIcon) checkIcon.classList.remove('opacity-0');
                        } else {
                            item.classList.remove('selected');
                            if (checkIcon) checkIcon.classList.add('opacity-0');
                        }
                    });
                    document.querySelectorAll('.filter-menu').forEach(m => m.classList.remove('active'));
                    app.search.renderAdvancedFilterChips();
                    const pageExact = document.getElementById('exact-route-page-box');
                    const ctrlKHeader = document.getElementById('header-ctrl-k');
                    const ctrlKPage = document.getElementById('page-search-ctrl-k');
                    if (filter === 'route') {
                        if (pageExact) pageExact.classList.remove('hidden');
                        if (ctrlKHeader) ctrlKHeader.classList.add('!hidden');
                        if (ctrlKPage) ctrlKPage.classList.add('!hidden');
                        if (app.utils.provinceData && app.utils.provinceData.length > 0) app.search.initExactRouteMenu();
                        const hInp = document.getElementById('search-input');
                        const pInp = document.getElementById('page-search-input');
                        if(hInp) hInp.placeholder = 'Tìm kiếm...';
                        if(pInp) pInp.placeholder = 'Tìm kiếm...';
                    } else {
                        if (pageExact) pageExact.classList.add('hidden');
                        if (filter !== 'advanced') {
                            if (ctrlKHeader) ctrlKHeader.classList.remove('!hidden');
                            if (ctrlKPage) ctrlKPage.classList.remove('!hidden');
                            app.search.currentExactPrefix = ''; 
                            app.search.syncExactUI('');
                            const hInp = document.getElementById('search-input');
                            const pInp = document.getElementById('page-search-input');
                            if(hInp) hInp.placeholder = 'Tìm kiếm...';
                            if(pInp) pInp.placeholder = 'Tìm kiếm...';
                        }
                    }
                    if (filter === 'advanced') {
                        if (ctrlKHeader) ctrlKHeader.classList.add('!hidden');
                        if (ctrlKPage) ctrlKPage.classList.add('!hidden');
                        const hInp = document.getElementById('search-input');
                        const pInp = document.getElementById('page-search-input');
                        if(hInp) { hInp.placeholder = ''; hInp.value = ''; }
                        if(pInp) { pInp.placeholder = ''; pInp.value = ''; }
                    }
                    if (filter === 'advanced' && triggerSearch && (!app.search.advancedFilters || app.search.advancedFilters.length === 0)) {
                        app.search.openAdvancedFilterModal();
                        return;
                    }
                    if (triggerSearch) {
                        app.handleSearch(true);
                    }
                },
                triggerAdvSuggestion: async (query) => {
                    const box = document.getElementById('adv-filter-suggestions');
                    const fieldKey = document.getElementById('adv-field-select').value;
                    if (!app.suggestionTimeouts) app.suggestionTimeouts = {};
                    if (app.suggestionTimeouts['adv']) clearTimeout(app.suggestionTimeouts['adv']);
                    if (!fieldKey || query.length < 1) {
                        if (box) box.classList.remove('active');
                        return;
                    }
                    const supportedFields = ['license_plate', 'route_no', 'operator', 'model', 'location', 'camera_model', 'uploader'];
                    if (!supportedFields.includes(fieldKey)) {
                        if (box) box.classList.remove('active');
                        return;
                    }
                    app.suggestionTimeouts['adv'] = setTimeout(async () => {
                        if (app.suggestionControllers && app.suggestionControllers['adv']) app.suggestionControllers['adv'].abort();
                        const controller = new AbortController();
                        if (!app.suggestionControllers) app.suggestionControllers = {};
                        app.suggestionControllers['adv'] = controller;
                        try {
                            let table = 'photos';
                            let col = fieldKey;
                            let selectStr = col;
                            if (fieldKey === 'license_plate') {
                                table = 'vehicles';
                                selectStr = 'license_plate, photos!inner(status)';
                            } else if (fieldKey === 'uploader') {
                                table = 'profiles';
                                col = 'username';
                                selectStr = 'username';
                            }
                            let sbQuery = window.sb.from(table).select(selectStr);
                            if (table === 'photos') {
                                sbQuery = sbQuery.eq('status', 'approved').not(col, 'is', null).neq(col, '').neq(col, '---');
                            } else if (table === 'vehicles') {
                                sbQuery = sbQuery.eq('photos.status', 'approved');
                            }
                            let normalizedQuery = query.toLowerCase().trim();
                            if (fieldKey === 'license_plate') normalizedQuery = app.utils.normalizePlateQuery(normalizedQuery);
                            sbQuery = sbQuery.ilike(col, `%${normalizedQuery}%`);
                            const { data } = await sbQuery.limit(30).abortSignal(controller.signal);
                            if (data && data.length > 0) {
                                const uniqueVals = new Set();
                                data.forEach(item => {
                                    if (item[col]) uniqueVals.add(String(item[col]));
                                });
                                const valList = Array.from(uniqueVals).slice(0, 10);
                                if (valList.length > 0) {
                                    const html = valList.map(v => {
                                        let safeRawJS = v.replace(/'/g, "\\'").replace(/"/g, '\\"');
                                        let clickAction = `document.getElementById('adv-filter-value').value = '${safeRawJS}'; document.getElementById('adv-filter-suggestions').classList.remove('active');`;
                                        return `<div class="filter-item flex items-center p-2.5 rounded-lg cursor-pointer hover:bg-black/5 text-sm transition-colors text-gray-700" onmousedown="event.preventDefault(); ${clickAction}">
                                            <span class="font-bold">${v}</span>
                                        </div>`;
                                    }).join('');
                                    if (box) {
                                        box.innerHTML = `<div class="p-1.5 flex flex-col gap-1 custom-scrollbar max-h-60 overflow-y-auto bg-white/70 backdrop-blur-xl border border-white/60 rounded-xl shadow-lg">${html}</div>`;
                                        box.classList.add('active');
                                    }
                                } else {
                                    if (box) box.classList.remove('active');
                                }
                            } else {
                                if (box) box.classList.remove('active');
                            }
                        } catch (err) {
                            if (err.name !== 'AbortError') {
                                console.error('Adv suggestion error:', err);
                            }
                        }
                    }, 250);
                },
                triggerMainSuggestion: async (query, inputId = 'search-input', sugId = 'main-search-suggestions') => {
                    const box = document.getElementById(sugId);
                    if (app.suggestionTimeouts[inputId]) clearTimeout(app.suggestionTimeouts[inputId]);
                    if (query.length < 1) {
                        let recents = JSON.parse(localStorage.getItem('vnbus_recent_searches') || '[]');
                        if (recents.length > 0) {
                            const html = `<div class="p-3 text-xs text-gray-400 font-bold uppercase tracking-wider flex justify-between items-center bg-gray-50 border-b border-gray-100">
                                <span>Lịch sử tìm kiếm</span>
                                <button onmousedown="event.preventDefault(); localStorage.removeItem('vnbus_recent_searches'); document.getElementById('${sugId}').classList.remove('active')" class="hover:text-red-500 transition-colors p-1"><i class="fa-solid fa-trash"></i></button>
                            </div>` + recents.map(r => {
                                let safeRawJS = r.query.replace(/'/g, "\\'").replace(/"/g, '\\"');
                                let setPrefixAction = r.prefix ? `app.search.syncExactUI('${r.prefix}');` : `app.search.syncExactUI('');`;
                                let clickAction = `document.getElementById('${inputId}').value = '${safeRawJS}'; document.getElementById('${sugId}').classList.remove('active'); app.search.setFilter('${r.filter}', false); ${setPrefixAction} app.handleSearch(true, '${inputId}');`;
                                return `<div class="suggestion-item border-b border-gray-100 last:border-0" onmousedown="event.preventDefault(); ${clickAction}">
                                    <div class="text-[13px] text-black font-medium leading-snug break-words whitespace-normal flex items-center gap-2"><i class="fa-solid fa-clock-rotate-left text-gray-400"></i> <span class="truncate">${r.query}</span></div>
                                </div>`;
                            }).join('');
                            box.innerHTML = html;
                            box.classList.add('active');
                        } else {
                            box.classList.remove('active');
                        }
                        return;
                    }
                    app.suggestionTimeouts[inputId] = setTimeout(async () => {
                        if (app.suggestionControllers && app.suggestionControllers[inputId]) app.suggestionControllers[inputId].abort();
                        const controller = new AbortController();
                        if (!app.suggestionControllers) app.suggestionControllers = {};
                        app.suggestionControllers[inputId] = controller;
                        try {
                            const filter = app.currentFilter;
                            let results = [];
                            let normalizedQuery = query.toLowerCase()
                                .replace(/vin bus/g, 'vinbus')
                                .replace(/thanh buoi/g, 'thành bưởi')
                                .replace(/phuong trang/g, 'phương trang');
                            const searchWords = normalizedQuery.trim().split(/\s+/).filter(w => w.length > 0);
                            const fetchSugs = async (table, col, label) => {
                                let selectStr = col;
                                if (table === 'vehicles') {
                                    selectStr = `${col}, photos!inner(status${app.preference.current !== 'both' ? ', type' : ''})`;
                                }
                                if (table === 'photos' && col === 'route_no') selectStr = 'route_no, borrowed_route, license_plate';
                                let sbQuery = window.sb.from(table).select(selectStr);
                                if (table === 'photos') {
                                    sbQuery = sbQuery.eq('status', 'approved').not(col, 'is', null).neq(col, '').neq(col, '---');
                                } else if (table === 'vehicles') {
                                    sbQuery = sbQuery.eq('photos.status', 'approved');
                                }
                                searchWords.forEach(word => {
                                    if (col === 'license_plate') sbQuery = sbQuery.ilike(col, `%${app.utils.normalizePlateQuery(word)}%`);
                                    else sbQuery = sbQuery.ilike(col, `%${word}%`);
                                });
                                sbQuery = app.preference.applyFilter(sbQuery, table);
                                let data = [];
                                if (table === 'photos' && col === 'operator') {
                                    let infoQuery = window.sb.from('operator_info').select('operator_name');
                                    searchWords.forEach(word => { infoQuery = infoQuery.ilike('operator_name', `%${word}%`); });
                                    const [infoRes, photoRes] = await Promise.all([
                                        infoQuery.limit(30).abortSignal(controller.signal),
                                        sbQuery.limit(30).abortSignal(controller.signal)
                                    ]);
                                    if (photoRes.data) data = data.concat(photoRes.data);
                                    const { data: allOpsForSug } = await window.sb.from('operator_info').select('parent_operator');
                                    const parentMapForSug = new Map();
                                    if (allOpsForSug) {
                                        allOpsForSug.forEach(op => {
                                            if (op.parent_operator) {
                                                op.parent_operator.split(';').forEach(p => {
                                                    const orig = p.trim();
                                                    if (orig) parentMapForSug.set(app.utils.normOperator(orig).toLowerCase(), orig);
                                                });
                                            }
                                        });
                                    }
                                    parentMapForSug.forEach((origName, normKey) => {
                                        const matches = searchWords.every(w => origName.toLowerCase().includes(w));
                                        if (matches) {
                                            data.push({ operator: origName });
                                        }
                                    });
                                } else {
                                    const res = await sbQuery.limit(30).abortSignal(controller.signal);
                                    data = res.data;
                                }
                                if (data) {
                                    if (col === 'route_no') {
                                        const routeProvSet = new Set();
                                        const routeResults = [];
                                        data.forEach(item => {
                                            const r = item.route_no;
                                            if (!r) return;
                                            let prov = item.borrowed_route ? item.borrowed_route.split(' - ')[1] : '';
                                            if (prov === 'Không xác định') prov = '';
                                            if (!prov && item.license_plate) {
                                                const extractedProv = app.utils.getProvinceFromPlate(item.license_plate);
                                                if (extractedProv && extractedProv !== 'Không xác định' && extractedProv !== 'Biển tạm') prov = extractedProv;
                                            }
                                            const key = r + '|' + prov;
                                            if (!routeProvSet.has(key)) {
                                                routeProvSet.add(key);
                                                let prefix = '';
                                                try {
                                                    if (prov && app.utils.provinceData) {
                                                        const provData = app.utils.provinceData.find(p => p.ten === prov);
                                                        if (provData && provData.ky_hieu) prefix = Array.isArray(provData.ky_hieu) ? String(provData.ky_hieu[0]).trim() : String(provData.ky_hieu).split(',')[0].trim();
                                                    }
                                                } catch (e) { }
                                                routeResults.push({ text: prov ? `${r} (BKS ${prov})` : r, label: label, prefix: prefix, rawRoute: r });
                                            }
                                        });
                                        return routeResults;
                                    }
                                    let vals = data.map(item => (item[col] || '').toString().trim()).filter(Boolean);
                                    if (col === 'operator') {
                                        const seen = new Map();
                                        vals.forEach(v => {
                                            const key = app.utils.normOperator(v).toLowerCase();
                                            if (!seen.has(key)) seen.set(key, app.utils.normOperator(v));
                                        });
                                        vals = [...seen.values()];
                                    } else {
                                        vals = [...new Set(vals)];
                                    }
                                    if (col === 'license_plate') {
                                        const basePlates = vals.filter(p => !/-\d+$/.test(p));
                                        const uniqueBases = [...new Set(basePlates.map(p => p.replace(/-\d+$/, '')))];
                                        return uniqueBases.map(val => ({ text: val, label }));
                                    }
                                    return vals.map(val => ({ text: val, label }));
                                }
                                return [];
                            };
                            if (filter === 'all') {
                                const [plates, routes, ops, models] = await Promise.all([
                                    fetchSugs('vehicles', 'license_plate', 'BKS'),
                                    fetchSugs('photos', 'route_no', 'Tuyến'),
                                    fetchSugs('photos', 'operator', 'Đơn vị vận hành'),
                                    fetchSugs('vehicles', 'model', 'Dòng xe')
                                ]);
                                let out = [];
                                let pools = [ { data: plates, limit: 4 }, { data: routes, limit: 2 }, { data: ops, limit: 2 }, { data: models, limit: 2 } ];
                                pools.forEach(p => { p.added = p.data.slice(0, p.limit); out.push(...p.added); p.remain = p.data.slice(p.limit); });
                                let slotsLeft = 10 - out.length;
                                if (slotsLeft > 0) {
                                    for (let p of pools) {
                                        if (slotsLeft <= 0) break;
                                        if (p.remain.length > 0) {
                                            let toAdd = p.remain.slice(0, slotsLeft);
                                            out.push(...toAdd);
                                            slotsLeft -= toAdd.length;
                                        }
                                    }
                                }
                                results = out;
                            } else if (filter === 'plate') results = await fetchSugs('vehicles', 'license_plate', 'BKS');
                            else if (filter === 'route') results = await fetchSugs('photos', 'route_no', 'Tuyến');
                            else if (filter === 'operator') results = await fetchSugs('photos', 'operator', 'Đơn vị vận hành');
                            else if (filter === 'model') results = await fetchSugs('vehicles', 'model', 'Dòng xe');
                            else if (filter === 'location') results = await fetchSugs('photos', 'location', 'Vị trí');
                            else if (filter === 'camera') results = await fetchSugs('photos', 'camera_model', 'Thiết bị');
                            else if (filter === 'uploader') {
                                let sbQuery = window.sb.from('profiles').select('username');
                                searchWords.forEach(word => { sbQuery = sbQuery.ilike('username', `%${word}%`); });
                                const { data } = await sbQuery.limit(5).abortSignal(controller.signal);
                                if (data) results = [...new Set(data.map(item => item.username).filter(Boolean))].map(val => ({ text: val, label: 'Người đăng' }));
                            }
                            if (results.length > 0) {
                                // GỌI HÀM SẮP XẾP ĐỐI TƯỢNG {text, label}
                                results = app.utils.sortMatchesByRelevance(results, query, item => item.text);

                                const labelToFilter = { 'BKS': 'plate', 'Tuyến': 'route', 'Đơn vị vận hành': 'operator', 'Dòng xe': 'model', 'Vị trí': 'location', 'Thiết bị': 'camera', 'Người đăng': 'uploader' };
                                box.innerHTML = results.slice(0, 10).map(item => {
                                    const safeText = app.utils.cleanText(item.text);
                                    const safeJS = item.text.replace(/'/g, "\\'").replace(/"/g, '&quot;');
                                    let displayHTML = safeText;
                                    if (searchWords.length > 0) {
                                        const escapedWords = searchWords.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
                                        const regex = new RegExp(`(${escapedWords})`, 'gi');
                                        displayHTML = safeText.replace(regex, '<strong class="font-extrabold">$1</strong>');
                                    }
                                    const labelHTML = (filter === 'all' || item.label.includes('(')) ? `<div class=\"text-[10px] text-gray-400 font-normal mt-0.5\">${item.label}</div>` : '';
                                    let filterKey = filter;
                                    if (item.label && item.label.startsWith('Tuyến')) filterKey = 'route';
                                    else if (labelToFilter[item.label]) filterKey = labelToFilter[item.label];
                                    const safeRawJS = (item.rawRoute || item.text).replace(/'/g, "\\'").replace(/"/g, '&quot;');
                                    let setPrefixAction = `app.search.syncExactUI('');`;
                                    if (filterKey === 'route' && item.prefix) {
                                        setPrefixAction = `app.search.syncExactUI('${item.prefix}');`;
                                    }
                                    let clickAction = `document.getElementById('${inputId}').value = '${safeRawJS}'; document.getElementById('${sugId}').classList.remove('active'); app.search.setFilter('${filterKey}', false); ${setPrefixAction} app.handleSearch(true, '${inputId}');`;
                                    return `<div class="suggestion-item border-b border-gray-100 last:border-0" onmousedown="event.preventDefault(); ${clickAction}">
                                        <div class="text-[13px] text-black font-medium leading-snug break-words whitespace-normal">${displayHTML}</div>
                                        ${labelHTML}
                                    </div>`;
                                }).join('');
                                box.classList.add('active');
                            } else {
                                box.classList.remove('active');
                            }
                        } catch (e) {
                            if (e.name !== 'AbortError') console.log("Main search suggestion error:", e);
                        }
                    }, 300);
                }
            }
});
