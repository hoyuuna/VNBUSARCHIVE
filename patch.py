import re
f = open('src/js/3_views.js', 'r', encoding='utf-8')
content = f.read()
f.close()

start_idx = content.find('openAdvancedFilterModal: () => {')
end_idx = content.find('triggerMainSuggestion: async (query, inputId', start_idx)

if start_idx == -1 or end_idx == -1:
    print('Error finding boundaries')
    exit(1)

new_content = content[:start_idx] + '''openAdvancedFilterModal: () => {
                    if (app.search.advancedFilters.length >= 15) {
                        if (app.toast) app.toast.show('error', 'Giới hạn', 'Bạn chỉ được thêm tối đa 15 bộ lọc!');
                        else alert('Bạn chỉ được thêm tối đa 15 bộ lọc!');
                        return;
                    }
                    const modal = document.getElementById('advanced-filter-modal');
                    if (!modal) return;
                    
                    document.getElementById('adv-field-select').value = '';
                    const opSelect = document.getElementById('adv-operator-select');
                    opSelect.innerHTML = '<option value="" disabled selected>-- Chọn toán tử --</option>';
                    opSelect.disabled = true;
                    
                    const valContainer = document.getElementById('adv-filter-value-container');
                    valContainer.innerHTML = '<input type="text" id="adv-filter-value" placeholder="Nhập giá trị..." class="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 hover:border-gray-300 rounded-md outline-none focus:border-gray-400 focus:ring-1 transition-all shadow-sm text-gray-700" disabled>';
                    
                    modal.classList.remove('hidden');
                    app.ui?.lockScroll?.();
                },

                closeAdvancedFilterModal: () => {
                    const modal = document.getElementById('advanced-filter-modal');
                    if (modal) modal.classList.add('hidden');
                    app.ui?.unlockScroll?.();
                },

                onAdvancedFieldChange: () => {
                    const fieldKey = document.getElementById('adv-field-select').value;
                    const config = app.search.FIELD_CONFIGS[fieldKey];
                    if (!config) return;

                    const opSelect = document.getElementById('adv-operator-select');
                    opSelect.innerHTML = config.ops.map(o => `<option value="${o.v}">${o.l}</option>`).join('');
                    opSelect.disabled = false;

                    const valContainer = document.getElementById('adv-filter-value-container');
                    if (config.type === 'date') {
                        valContainer.innerHTML = '<input type="date" id="adv-filter-value" class="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 hover:border-gray-300 rounded-md outline-none focus:border-gray-400 focus:ring-1 transition-all shadow-sm text-gray-700">';
                    } else if (config.type === 'select_type') {
                        valContainer.innerHTML = `
                            <select id="adv-filter-value" class="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 hover:border-gray-300 rounded-md outline-none focus:border-gray-400 focus:ring-1 transition-all shadow-sm text-gray-700 cursor-pointer">
                                <option value="bus">Xe Buýt</option>
                                <option value="coach">Xe Khách</option>
                            </select>`;
                    } else if (config.type === 'select_province') {
                        let provOptions = '<option value="" disabled selected>-- Chọn tỉnh thành --</option>';
                        if (app.utils.provinceData && app.utils.provinceData.length) {
                            provOptions += app.utils.provinceData.map(p => `<option value="${p.ten}">${p.ten}</option>`).join('');
                        }
                        valContainer.innerHTML = `<select id="adv-filter-value" class="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 hover:border-gray-300 rounded-md outline-none focus:border-gray-400 focus:ring-1 transition-all shadow-sm text-gray-700 cursor-pointer">${provOptions}</select>`;
                    } else {
                        valContainer.innerHTML = '<input type="text" id="adv-filter-value" placeholder="Nhập giá trị..." class="w-full px-3 py-2.5 text-sm bg-white border border-gray-200 hover:border-gray-300 rounded-md outline-none focus:border-gray-400 focus:ring-1 transition-all shadow-sm text-gray-700">';
                    }
                },

                applyAdvancedFilter: () => {
                    const fieldKey = document.getElementById('adv-field-select').value;
                    const opKey = document.getElementById('adv-operator-select').value;
                    const valInput = document.getElementById('adv-filter-value');
                    const val = valInput ? valInput.value.trim() : '';

                    if (!fieldKey || !opKey || !val) {
                        if (app.toast) app.toast.show('error', 'Chưa hoàn tất', 'Vui lòng chọn đầy đủ Trường, Điều kiện và Giá trị!');
                        else alert('Vui lòng chọn đầy đủ Trường, Điều kiện và Giá trị!');
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
                        opLabel: opConfig ? opConfig.l : opKey,
                        value: val,
                        displayVal: displayVal
                    };

                    app.search.advancedFilters = app.search.advancedFilters || [];
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
                            <span class="inline-flex items-center gap-1 bg-black text-white text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 shadow-sm">
                                <span>${f.fieldLabel}</span>
                                <span class="text-amber-300 font-bold">${f.opLabel}</span>
                                <span class="underline">${f.displayVal}</span>
                                <button type="button" onclick="event.stopPropagation(); app.search.removeAdvancedFilter('${f.id}')" class="ml-0.5 text-gray-300 hover:text-red-400">
                                    <i class="fa-solid fa-xmark"></i>
                                </button>
                            </span>
                        `).join('');

                        html += `
                            <button type="button" onclick="event.stopPropagation(); app.search.openAdvancedFilterModal()" class="shrink-0 text-[11px] font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 rounded-full px-2 py-0.5 shadow-sm transition">
                                + Thêm
                            </button>
                        `;

                        if (app.search.advancedFilters && app.search.advancedFilters.length > 0) {
                            html += `
                                <button type="button" onclick="event.stopPropagation(); app.search.clearAdvancedFilters()" class="shrink-0 text-[11px] font-bold text-red-600 hover:underline px-1 py-0.5">
                                    Xóa hết
                                </button>
                            `;
                        }

                        box.innerHTML = html;
                        // HIDE THE SEARCH TEXT UNDERNEATH
                        box.classList.add('bg-white');
                    });
                },

                removeAdvancedFilter: (id) => {
                    app.search.advancedFilters = app.search.advancedFilters.filter(f => f.id !== id);
                    if (app.search.advancedFilters.length === 0) {
                        app.currentFilter = 'all';
                    }
                    app.search.renderAdvancedFilterChips();
                    app.handleSearch(true, 'page-search-input');
                },

                clearAdvancedFilters: () => {
                    app.search.advancedFilters = [];
                    app.currentFilter = 'all';
                    app.search.renderAdvancedFilterChips();
                    app.handleSearch(true, 'page-search-input');
                },

                openAdvancedFilter: () => {
                    app.search.openAdvancedFilterModal();
                },

                setFilter: (filter, triggerSearch = true) => {
                    app.currentFilter = filter;

                    // Đánh dấu tick đen đồng bộ cho tất cả các menu filter
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

                    // An toàn: Đóng tất cả menu filter thả xuống
                    document.querySelectorAll('.filter-menu').forEach(m => m.classList.remove('active'));

                    app.search.renderAdvancedFilterChips();

                    // Restore exact-route toggling for route search
                    const pageExact = document.getElementById('exact-route-page-box');
                    const ctrlKHeader = document.getElementById('header-ctrl-k');
                    const ctrlKPage = document.getElementById('page-search-ctrl-k');
                    
                    if (filter === 'route') {
                        if (pageExact) pageExact.classList.remove('hidden');
                        if (ctrlKHeader) ctrlKHeader.classList.add('!hidden');
                        if (ctrlKPage) ctrlKPage.classList.add('!hidden');
                        if (app.utils.provinceData && app.utils.provinceData.length > 0) app.search.initExactRouteMenu();
                    } else {
                        if (pageExact) pageExact.classList.add('hidden');
                        if (filter !== 'advanced') {
                            if (ctrlKHeader) ctrlKHeader.classList.remove('!hidden');
                            if (ctrlKPage) ctrlKPage.classList.remove('!hidden');
                            app.search.currentExactPrefix = ''; 
                            app.search.syncExactUI('');
                        }
                    }

                    if (filter === 'advanced') {
                        if (ctrlKHeader) ctrlKHeader.classList.add('!hidden');
                        if (ctrlKPage) ctrlKPage.classList.add('!hidden');
                    }

                    // Chỉ mở popup nếu người dùng CHỦ ĐỘNG bấm chọn "Nâng cao" và CHƯA CÓ bộ lọc nào
                    if (filter === 'advanced' && triggerSearch && (!app.search.advancedFilters || app.search.advancedFilters.length === 0)) {
                        app.search.openAdvancedFilterModal();
                        return;
                    }

                    if (triggerSearch) {
                        app.handleSearch(true);
                    }
                },

                ''' + content[end_idx:]

f = open('src/js/3_views.js', 'w', encoding='utf-8')
f.write(new_content)
f.close()
print('Patched successfully!')
