import re

with open('src/js/3_views.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update FIELD_CONFIGS
field_configs = """                FIELD_CONFIGS: {
                    'license_plate': { label: 'Biển kiểm soát', type: 'text', ops: [{v:'ilike', l:'Chứa'}, {v:'eq', l:'Bằng'}, {v:'neq', l:'Khác'}, {v:'not_ilike', l:'Không chứa'}] },
                    'route_no':     { label: 'Mã số tuyến',   type: 'text', ops: [{v:'ilike', l:'Chứa'}, {v:'eq', l:'Bằng'}, {v:'neq', l:'Khác'}, {v:'not_ilike', l:'Không chứa'}] },
                    'operator':     { label: 'Đơn vị vận hành', type: 'text', ops: [{v:'ilike', l:'Chứa'}, {v:'eq', l:'Bằng'}, {v:'neq', l:'Khác'}, {v:'not_ilike', l:'Không chứa'}] },
                    'model':        { label: 'Dòng xe',        type: 'text', ops: [{v:'ilike', l:'Chứa'}, {v:'eq', l:'Bằng'}, {v:'neq', l:'Khác'}, {v:'not_ilike', l:'Không chứa'}] },
                    'location':     { label: 'Vị trí chụp',    type: 'text', ops: [{v:'ilike', l:'Chứa'}, {v:'not_ilike', l:'Không chứa'}, {v:'eq', l:'Bằng'}] },
                    'type':         { label: 'Loại xe',        type: 'select_type', ops: [{v:'eq', l:'Bằng'}, {v:'neq', l:'Khác'}] },
                    'province':     { label: 'Tuyến của tỉnh', type: 'select_province', ops: [{v:'eq', l:'Bằng'}, {v:'neq', l:'Khác'}] },
                    'camera_model': { label: 'Thiết bị chụp',  type: 'text', ops: [{v:'ilike', l:'Chứa'}, {v:'eq', l:'Bằng'}, {v:'neq', l:'Khác'}] },
                    'taken_at':     { label: 'Ngày chụp',      type: 'date', ops: [{v:'eq', l:'Bằng'}, {v:'gt', l:'> Sau ngày'}, {v:'gte', l:'≥ Từ ngày'}, {v:'lt', l:'< Trước ngày'}, {v:'lte', l:'≤ Đến ngày'}, {v:'neq', l:'Khác'}] },
                    'uploader':     { label: 'Người đăng',     type: 'text', ops: [{v:'ilike', l:'Chứa'}, {v:'eq', l:'Bằng'}, {v:'neq', l:'Khác'}] }
                },"""
content = re.sub(r"FIELD_CONFIGS: \{.*?'uploader':[^\}]+\n\s+\},", field_configs, content, flags=re.DOTALL)

# 2. openAdvancedFilterModal reset logic
old_modal_open = """                    document.getElementById('adv-field-select').value = '';
                    const opSelect = document.getElementById('adv-operator-select');
                    opSelect.innerHTML = '<option value="" disabled selected>-- Chọn điều kiện --</option>';
                    opSelect.disabled = true;
                    
                    const valContainer = document.getElementById('adv-filter-value-container');
                    valContainer.innerHTML = '<input type="text" id="adv-filter-value" placeholder="Nhập giá trị..." class="w-full px-3.5 py-2.5 text-sm font-medium bg-white/90 border border-gray-300 rounded-xl outline-none shadow-sm text-gray-700" disabled>';"""

new_modal_open = """                    document.getElementById('adv-field-select').value = '';
                    document.getElementById('adv-field-label').innerText = '-- Chọn trường --';
                    
                    document.getElementById('adv-operator-select').value = '';
                    document.getElementById('adv-operator-label').innerText = '-- Chọn điều kiện --';
                    document.getElementById('adv-operator-btn').disabled = true;
                    
                    const valContainer = document.getElementById('adv-filter-value-container');
                    valContainer.innerHTML = '<input type="text" id="adv-filter-value" placeholder="Nhập giá trị..." class="w-full px-3.5 py-2.5 text-sm font-medium bg-white/90 border border-gray-300 hover:border-black rounded-xl outline-none focus:ring-2 focus:ring-black transition-all shadow-sm disabled:bg-gray-100 disabled:shadow-none text-gray-800" disabled>';"""
content = content.replace(old_modal_open, new_modal_open)

# 3. Add selectAdvField and selectAdvOp
old_onchange = """                onAdvancedFieldChange: () => {
                    const fieldKey = document.getElementById('adv-field-select').value;"""
new_onchange = """                selectAdvField: (val, label) => {
                    document.getElementById('adv-field-select').value = val;
                    document.getElementById('adv-field-label').innerText = label;
                    document.getElementById('adv-field-menu').classList.remove('active');
                    app.search.onAdvancedFieldChange();
                },
                
                selectAdvOp: (val, label) => {
                    document.getElementById('adv-operator-select').value = val;
                    document.getElementById('adv-operator-label').innerText = label;
                    document.getElementById('adv-operator-menu').classList.remove('active');
                },

                selectAdvVal: (val, label) => {
                    document.getElementById('adv-filter-value').value = val;
                    document.getElementById('adv-val-label').innerText = label;
                    document.getElementById('adv-val-menu').classList.remove('active');
                },

                onAdvancedFieldChange: () => {
                    const fieldKey = document.getElementById('adv-field-select').value;"""
content = content.replace(old_onchange, new_onchange)

# 4. Update onAdvancedFieldChange implementation
old_onchange_body = """                    const opSelect = document.getElementById('adv-operator-select');
                    opSelect.innerHTML = config.ops.map(o => `<option value="${o.v}">${o.l}</option>`).join('');
                    opSelect.disabled = false;

                    const valContainer = document.getElementById('adv-filter-value-container');
                    if (config.type === 'date') {
                        valContainer.innerHTML = '<input type="date" id="adv-filter-value" class="w-full px-3.5 py-2.5 text-sm font-medium bg-white/90 border border-gray-300 hover:border-black rounded-xl outline-none focus:ring-2 focus:ring-black transition-all shadow-sm text-gray-800">';
                    } else if (config.type === 'select_type') {
                        valContainer.innerHTML = `
                            <select id="adv-filter-value" class="w-full px-3.5 py-2.5 text-sm font-medium bg-white/90 border border-gray-300 hover:border-black rounded-xl outline-none focus:ring-2 focus:ring-black transition-all shadow-sm text-gray-800 cursor-pointer">
                                <option value="bus">Xe Buýt</option>
                                <option value="coach">Xe Khách</option>
                            </select>`;
                    } else if (config.type === 'select_province') {
                        let provOptions = '<option value="" disabled selected>-- Chọn tỉnh thành --</option>';
                        if (app.utils.provinceData && app.utils.provinceData.length) {
                            provOptions += app.utils.provinceData.map(p => `<option value="${p.ten}">${p.ten}</option>`).join('');
                        }
                        valContainer.innerHTML = `<select id="adv-filter-value" class="w-full px-3.5 py-2.5 text-sm font-medium bg-white/90 border border-gray-300 hover:border-black rounded-xl outline-none focus:ring-2 focus:ring-black transition-all shadow-sm text-gray-800 cursor-pointer">${provOptions}</select>`;
                    } else {
                        valContainer.innerHTML = '<input type="text" id="adv-filter-value" placeholder="Nhập giá trị..." class="w-full px-3.5 py-2.5 text-sm font-medium bg-white/90 border border-gray-300 hover:border-black rounded-xl outline-none focus:ring-2 focus:ring-black transition-all shadow-sm text-gray-800">';
                    }"""

new_onchange_body = """                    const opMenu = document.getElementById('adv-operator-menu');
                    opMenu.innerHTML = config.ops.map(o => `<div class="filter-item" onclick="app.search.selectAdvOp('${o.v}', '${o.l}')"><span class="font-bold">${o.l}</span></div>`).join('');
                    
                    document.getElementById('adv-operator-select').value = config.ops[0].v;
                    document.getElementById('adv-operator-label').innerText = config.ops[0].l;
                    document.getElementById('adv-operator-btn').disabled = false;

                    const valContainer = document.getElementById('adv-filter-value-container');
                    if (config.type === 'date') {
                        valContainer.innerHTML = '<input type="date" id="adv-filter-value" class="w-full px-3.5 py-2.5 text-sm font-medium bg-white/90 border border-gray-300 hover:border-black rounded-xl outline-none focus:ring-2 focus:ring-black transition-all shadow-sm text-gray-800">';
                    } else if (config.type === 'select_type') {
                        valContainer.innerHTML = `
                            <input type="hidden" id="adv-filter-value" value="">
                            <button type="button" id="adv-val-btn" onclick="document.getElementById('adv-val-menu').classList.toggle('active')" class="w-full flex items-center justify-between bg-white/90 border border-gray-300 hover:border-black rounded-xl p-3.5 text-sm font-medium text-gray-800 transition-all shadow-sm focus:ring-2 focus:ring-black outline-none">
                                <span id="adv-val-label" class="truncate pr-4">-- Chọn loại xe --</span>
                                <i class="fa-solid fa-chevron-down text-gray-400 shrink-0"></i>
                            </button>
                            <div id="adv-val-menu" class="filter-menu left-0 right-0 origin-top mt-2 !max-h-[250px] !z-[999]" style="width: 100% !important;">
                                <div class="filter-item" onclick="app.search.selectAdvVal('bus', 'Xe Buýt')"><span class="font-bold">Xe Buýt</span></div>
                                <div class="filter-item" onclick="app.search.selectAdvVal('coach', 'Xe Khách')"><span class="font-bold">Xe Khách</span></div>
                            </div>
                        `;
                    } else if (config.type === 'select_province') {
                        let provOptions = '';
                        if (app.utils.provinceData && app.utils.provinceData.length) {
                            provOptions = app.utils.provinceData.map(p => `<div class="filter-item" onclick="app.search.selectAdvVal('${p.ten}', '${p.ten}')"><span class="font-bold">${p.ten}</span></div>`).join('');
                        }
                        valContainer.innerHTML = `
                            <input type="hidden" id="adv-filter-value" value="">
                            <button type="button" id="adv-val-btn" onclick="document.getElementById('adv-val-menu').classList.toggle('active')" class="w-full flex items-center justify-between bg-white/90 border border-gray-300 hover:border-black rounded-xl p-3.5 text-sm font-medium text-gray-800 transition-all shadow-sm focus:ring-2 focus:ring-black outline-none">
                                <span id="adv-val-label" class="truncate pr-4">-- Chọn tỉnh thành --</span>
                                <i class="fa-solid fa-chevron-down text-gray-400 shrink-0"></i>
                            </button>
                            <div id="adv-val-menu" class="filter-menu left-0 right-0 origin-top mt-2 !max-h-[250px] !z-[999]" style="width: 100% !important;">
                                ${provOptions}
                            </div>
                        `;
                    } else {
                        valContainer.innerHTML = '<input type="text" id="adv-filter-value" placeholder="Nhập giá trị..." class="w-full px-3.5 py-2.5 text-sm font-medium bg-white/90 border border-gray-300 hover:border-black rounded-xl outline-none focus:ring-2 focus:ring-black transition-all shadow-sm text-gray-800">';
                    }"""
content = content.replace(old_onchange_body, new_onchange_body)

# 5. Fix removeAdvancedFilter (call setFilter('all') instead of currentFilter = 'all')
old_remove = """                removeAdvancedFilter: (id) => {
                    app.search.advancedFilters = app.search.advancedFilters.filter(f => f.id !== id);
                    if (app.search.advancedFilters.length === 0) {
                        app.currentFilter = 'all';
                    }
                    app.search.renderAdvancedFilterChips();
                    app.handleSearch(true, 'page-search-input');
                },"""
new_remove = """                removeAdvancedFilter: (id) => {
                    app.search.advancedFilters = app.search.advancedFilters.filter(f => f.id !== id);
                    if (app.search.advancedFilters.length === 0) {
                        app.search.setFilter('all', false); // Fix: Re-enable default search input correctly
                    }
                    app.search.renderAdvancedFilterChips();
                    app.handleSearch(true, 'page-search-input');
                },"""
content = content.replace(old_remove, new_remove)

with open('src/js/3_views.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched 3_views.js")
