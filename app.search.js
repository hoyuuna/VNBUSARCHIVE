window.app = window.app || {};

window.app.search = {
                toggleFilter: (menuId = 'search-filter-menu') => {
                    document.getElementById(menuId).classList.toggle('active');
                },
                setFilter: (type, updateUrl = true) => {
                    app.currentFilter = type;

                    document.querySelectorAll('#search-filter-menu .filter-item, #page-search-filter-menu .filter-item').forEach(item => {
                        item.classList.remove('selected');
                        item.querySelector('.check-icon').classList.add('opacity-0');
                        if (item.dataset.filter === type) {
                            item.classList.add('selected');
                            item.querySelector('.check-icon').classList.remove('opacity-0');
                        }
                    });

                    document.getElementById('search-filter-menu')?.classList.remove('active');
                    document.getElementById('page-search-filter-menu')?.classList.remove('active');

                    if (updateUrl && window.location.pathname.includes('/search')) {
                        app.handleSearch(true);
                    }
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
                                let clickAction = `document.getElementById('${inputId}').value = '${safeRawJS}'; document.getElementById('${sugId}').classList.remove('active'); app.search.setFilter('${r.filter}', false); app.handleSearch(true);`;
                                return `<div class="suggestion-item border-b border-gray-100 last:border-0" onmousedown="event.preventDefault(); ${clickAction}">
                                    <div class="text-[13px] text-black font-medium leading-snug break-words whitespace-normal flex items-center gap-2"><i class="fa-solid fa-clock-rotate-left text-gray-400"></i> ${r.query}</div>
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
                        if (app.suggestionControllers && app.suggestionControllers[inputId]) {
                            app.suggestionControllers[inputId].abort();
                        }

                        const controller = new AbortController();
                        if (!app.suggestionControllers) app.suggestionControllers = {};
                        app.suggestionControllers[inputId] = controller;

                        try {
                            const filter = app.currentFilter;
                            let results =[];

                            let normalizedQuery = query.toLowerCase()
                                .replace(/vin bus/g, 'vinbus')
                                .replace(/thanh buoi/g, 'thành bưởi')
                                .replace(/phuong trang/g, 'phương trang');

                            const searchWords = normalizedQuery.trim().split(/\s+/).filter(w => w.length > 0);

                            const isBasePlate = (plate) => !/-\d+$/.test(plate);

                            const fetchSugs = async (table, col, label) => {
                                let selectStr = col;
                                if (table === 'vehicles' && app.preference.current !== 'both') {
                                    selectStr = `${col}, photos!inner(type)`;
                                }
                                if (table === 'photos' && col === 'route_no') {
                                    selectStr = 'route_no, license_plate';
                                }

                                let sbQuery = window.sb.from(table).select(selectStr);

                                // CHỈ GỢI Ý TỪ ẢNH ĐÃ ĐƯỢC DUYỆT
                                if (table === 'photos') {
                                    sbQuery = sbQuery.eq('status', 'approved');
                                }

                                searchWords.forEach(word => {
                                    if (col === 'license_plate') {
                                        sbQuery = sbQuery.ilike(col, `%${app.utils.normalizePlateQuery(word)}%`);
                                    } else {
                                        sbQuery = sbQuery.ilike(col, `%${word}%`);
                                    }
                                });

                                sbQuery = app.preference.applyFilter(sbQuery, table);

                                const { data } = await sbQuery.limit(30).abortSignal(controller.signal);
                                if (data) {
                                    // XỬ LÝ RIÊNG CHO TUYẾN: TÌM TỈNH HOẠT ĐỘNG (TÁCH THEO YÊU CẦU MỚI)
                                    if (col === 'route_no') {
                                        const routeProvSet = new Set();
                                        const routeResults = [];
                                        data.forEach(item => {
                                            const r = item.route_no;
                                            if (!r) return;

                                            let prov = '';
                                            if (item.license_plate) {
                                                const extractedProv = app.utils.getProvinceFromPlate(item.license_plate);
                                                if (extractedProv && extractedProv !== 'Không xác định' && extractedProv !== 'Biển tạm') {
                                                    prov = extractedProv;
                                                }
                                            }

                                            const key = r + '|' + prov;
                                            if (!routeProvSet.has(key)) {
                                                routeProvSet.add(key);
                                                let prefix = '';
                                try {
                                    if (prov && app.utils.provinceData && app.utils.provinceData.length) {
                                        const provData = app.utils.provinceData.find(p => p.ten === prov);
                                        if (provData && provData.ky_hieu) {
                                            prefix = Array.isArray(provData.ky_hieu) ? String(provData.ky_hieu[0]).trim() : String(provData.ky_hieu).split(',')[0].trim();
                                        }
                                    }
                                } catch (e) { }

                                                routeResults.push({
                                                    text: prov ? `${r} (${prov})` : r,
                                                    label: label, // Chỉ để "Tuyến" bên dưới
                                                    prefix: prefix,
                                                    rawRoute: r // Giữ lại mã số tuyến gốc để fill vào ô tìm kiếm
                                                });
                                            }
                                        });
                                        return routeResults;
                                    }

                                    const plates = [...new Set(data.map(item => item[col]).filter(Boolean))];
                                    if (col === 'license_plate') {
                                        const basePlates = plates.filter(p => isBasePlate(p));
                                        const uniqueBases =[...new Set(basePlates.map(p => p.replace(/-\d+$/, '')))];
                                        return uniqueBases.map(val => ({ text: val, label }));
                                    }
                                    return plates.map(val => ({ text: val, label }));
                                }
                                return[];
                            };

                            if (filter === 'all') {
                                const [plates, routes, ops, models] = await Promise.all([
                                    fetchSugs('vehicles', 'license_plate', 'BKS'),
                                    fetchSugs('photos', 'route_no', 'Tuyến'),
                                    fetchSugs('photos', 'operator', 'Đơn vị vận hành'),
                                    fetchSugs('vehicles', 'model', 'Dòng xe')
                                ]);

                                // THUẬT TOÁN CHIA SLOT: Đảm bảo chừa chỗ cho các mục khác nếu có
                                let out = [];
                                let pools = [
                                    { data: plates, limit: 4 }, // BKS ưu tiên 4 slot
                                    { data: routes, limit: 2 }, // Tuyến 2 slot
                                    { data: ops, limit: 2 },    // Đơn vị 2 slot
                                    { data: models, limit: 2 }  // Model 2 slot
                                ];

                                // B1: Rút dữ liệu theo limit tối đa được phân bổ
                                pools.forEach(p => {
                                    p.added = p.data.slice(0, p.limit);
                                    out.push(...p.added);
                                    p.remain = p.data.slice(p.limit); // Phần dư chưa được hiển thị
                                });

                                // B2: Nếu tổng chưa tới 10, vớt phần dư từ các pool (BKS sẽ tràn xuống lấy hết nếu các mục kia rỗng)
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
                            } else if (filter === 'plate') {
                                results = await fetchSugs('vehicles', 'license_plate', 'BKS');
                            } else if (filter === 'route' || filter === 'absolute_route') {
                                results = await fetchSugs('photos', 'route_no', 'Tuyến');
                            } else if (filter === 'operator') {
                                results = await fetchSugs('photos', 'operator', 'Đơn vị vận hành');
                            } else if (filter === 'model') {
                                results = await fetchSugs('vehicles', 'model', 'Dòng xe');
                            } else if (filter === 'location') {
                                results = await fetchSugs('photos', 'location', 'Vị trí');
                            } else if (filter === 'camera') {
                                results = await fetchSugs('photos', 'camera_model', 'Thiết bị');
                            } else if (filter === 'uploader') {
                                let sbQuery = window.sb.from('profiles').select('username');
                                searchWords.forEach(word => { sbQuery = sbQuery.ilike('username', `%${word}%`); });
                                const { data } = await sbQuery.limit(5).abortSignal(controller.signal);
                                if (data) results =[...new Set(data.map(item => item.username).filter(Boolean))].map(val => ({ text: val, label: 'Người đăng' }));
                            }

                            if (results.length > 0) {
                                // TỪ ĐIỂN ĐỂ ÁNH XẠ LABEL SANG FILTER ID CỦA HỆ THỐNG
                                const labelToFilter = {
                                    'BKS': 'plate',
                                    'Tuyến': 'route',
                                    'Đơn vị vận hành': 'operator',
                                    'Dòng xe': 'model',
                                    'Vị trí': 'location',
                                    'Thiết bị': 'camera',
                                    'Người đăng': 'uploader'
                                };

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

                                    // LẤY FILTER KEY DỰA TRÊN LABEL (NẾU LÀ TUYẾN THÌ ÉP CHỌN absolute_route)
                                    let filterKey = filter;
                                    if (item.label && item.label.startsWith('Tuyến')) {
                                        filterKey = 'absolute_route';
                                    } else if (labelToFilter[item.label]) {
                                        filterKey = labelToFilter[item.label];
                                    }

                                    // Xử lý lấy mã số tuyến nguyên bản thay vì nhét cả chữ "(Hà Nội)" vào ô search
                                    const safeRawJS = (item.rawRoute || item.text).replace(/'/g, "\\'").replace(/"/g, '&quot;');

                                    let clickAction = `document.getElementById('${inputId}').value = '${safeRawJS}'; document.getElementById('${sugId}').classList.remove('active'); app.search.setFilter('${filterKey}', false); app.handleSearch(true);`;

                                    if (filterKey === 'absolute_route' && item.prefix) {
                                        clickAction = `document.getElementById('${inputId}').value = '${safeRawJS}'; document.getElementById('${sugId}').classList.remove('active'); app.searchRedirect('${safeRawJS}', 'absolute_route', '${item.prefix}');`;
                                    }

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
            },


window.app.handleSearch = async (forceRefresh = false) => {
                // Đồng bộ từ khóa giữa 2 ô input (header và page)
                const headerInput = document.getElementById('search-input');
                const pageInput = document.getElementById('page-search-input');

                // Ưu tiên ô nào đang có giá trị nhập mới nhất
                let query = '';
                if (app.currentViewMode === 'search' && pageInput && document.activeElement === pageInput) {
                    query = pageInput.value.trim();
                    headerInput.value = query;
                } else {
                    query = headerInput.value.trim();
                    if(pageInput) pageInput.value = query;
                }

                // ==========================================
                // TỰ ĐỘNG NHẬN DIỆN "01 (Hà Nội)" KHI NHẬP TAY
                // ==========================================
                let autoPrefix = null;
                const provMatch = query.match(/^(.*?)\s*\((.+?)\)$/);
                if (provMatch) {
                    const extractedRoute = provMatch[1].trim();
                    const extractedProvName = provMatch[2].trim();

                    if (app.utils.provinceData && app.utils.provinceData.length) {
                        const prov = app.utils.provinceData.find(p => p.ten.toLowerCase() === extractedProvName.toLowerCase());
                        if (prov && prov.ky_hieu) {
                            autoPrefix = Array.isArray(prov.ky_hieu) ? String(prov.ky_hieu[0]).trim() : String(prov.ky_hieu).split(',')[0].trim();
                            query = extractedRoute;

                            headerInput.value = query;
                            if (pageInput) pageInput.value = query;

                            app.currentFilter = 'absolute_route';
                        }
                    }
                }

                const clearBtn = document.getElementById('btn-clear-search');
                const pageClearBtn = document.getElementById('btn-page-clear-search');
                const filterType = app.currentFilter;

                if (!query) {
                    if (clearBtn) clearBtn.classList.add('hidden');
                    if (pageClearBtn) pageClearBtn.classList.add('hidden');
                    if (window.location.pathname !== '/') app.utils.navigate('/');
                    return app.views.loadHome();
                } else {
                    if (clearBtn) clearBtn.classList.remove('hidden');
                    if (pageClearBtn) pageClearBtn.classList.remove('hidden');
                }

                const currentParams = new URLSearchParams(window.location.search);
                let filterFromUrl = currentParams.get('filter') || 'all';

                if (filterFromUrl === 'absolute_route') {
                    app.currentFilter = 'absolute_route';
                }

                // Nếu autoPrefix phát hiện ra Tỉnh, lấy nó làm prefix để đẩy lên URL
                let prefixToUrl = autoPrefix || currentParams.get('prefix');

                if (!window.location.pathname.includes('/search') || currentParams.get('q') !== query || filterFromUrl !== filterType || (filterType === 'absolute_route' && currentParams.get('prefix') !== prefixToUrl)) {
                    let url = `/search?q=${encodeURIComponent(query)}&filter=${filterType}`;
                    if (prefixToUrl) url += `&prefix=${encodeURIComponent(prefixToUrl)}`;
                    app.utils.navigate(url);
                    return;
                }

                if (app.lastSearchQuery === query && app.lastSearchFilter === filterType && !forceRefresh) {
                    app.views.switch('search', false);
                    app.loadingBar.finish();
                    return;
                }
                app.lastSearchQuery = query;
                app.lastSearchFilter = filterType;

                // Save recent search
                let recents = JSON.parse(localStorage.getItem('vnbus_recent_searches') || '[]');
                recents = recents.filter(r => r.query !== query);
                recents.unshift({ query, filter: filterType });
                if (recents.length > 5) recents.pop();
                localStorage.setItem('vnbus_recent_searches', JSON.stringify(recents));

                // Tách biệt hẳn ra tab search
                app.views.switch('search', false);
                app.currentViewMode = 'search';
                document.title = 'Tìm kiếm | VNBUSARCHIVE';

                const profileCardsContainer = document.getElementById('search-profile-cards');
                profileCardsContainer.innerHTML = '';
                profileCardsContainer.classList.add('hidden');
                document.getElementById('load-more-cards-container')?.classList.add('hidden');
                app.currentSearchCards =[];
                app.loadedSearchCardsCount = 0;

                if (clearBtn) clearBtn.classList.remove('hidden');
                if (pageClearBtn) pageClearBtn.classList.remove('hidden');

                const grid = document.getElementById('search-photo-grid');
                grid.innerHTML = '<div class="col-span-full text-center py-10 text-gray-500"><i class="fa-solid fa-circle-notch fa-spin"></i> Đang tìm kiếm...</div>';

                try {
                    // 1. TỰ ĐỘNG CHUYỂN HƯỚNG NẾU NHẬP LINK HOẶC ID ẢNH
                    const isIdSearch = query.match(/\/photo\/(\d+)/i) || (filterType === 'all' ? query.match(/^#(\d+)$/) : null);
                    if (isIdSearch) {
                        const directId = isIdSearch[1];
                        app.loadingBar.finish();
                        app.utils.navigate(`/photo/${directId}`);
                        return;
                    }

                    // ================= TẠO THẺ CARD GỢI Ý (CHẠY SONG SONG & ÉP THỨ TỰ ƯU TIÊN) =================
                    // Tách riêng 4 giỏ chứa để không bị lộn xộn do tốc độ phản hồi của mạng
                    let uploaderCards = [];
                    let operatorCards = [];
                    let modelCards = [];
                    let plateCards = [];
                    
                    let normalizedQuery = query.toLowerCase()
                        .replace(/vin bus/g, 'vinbus')
                        .replace(/thanh buoi/g, 'thành bưởi')
                        .replace(/phuong trang/g, 'phương trang');
                    const searchWords = normalizedQuery.trim().split(/\s+/).filter(w => w.length > 0);

                    // Mảng chứa các tiến trình lấy dữ liệu
                    const cardPromises = [];

                    // 1. LẤY UPLOADER
                    if (filterType === 'uploader' || filterType === 'all') {
                        cardPromises.push((async () => {
                            try {
                                let uQuery = window.sb.from('profiles').select('id, username, avatar_url, role, subroles');
                                searchWords.forEach(w => { uQuery = uQuery.ilike('username', `%${w}%`); });
                                const { data: usersData } = await uQuery.limit(5);

                                if (usersData && usersData.length > 0) {
                                    for (const user of usersData) {
                                        const { count } = await window.sb.from('photos').select('*', { count: 'exact', head: true }).eq('uploader_id', user.id).eq('status', 'approved');
                                        const avatarSrc = user.avatar_url ? app.utils.getProxiedUrl(user.avatar_url, 'avatar.jpg', 'avatar') : DEFAULT_AVATAR;
                                        const userBadges = app.utils.getBadgesHTML(user.id, user.role, user.subroles);
                                        uploaderCards.push(`
                                            <div class="bg-white border border-gray-200 rounded-md p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition" onclick="app.views.loadUserProfile('${user.username}')">
                                                <img src="${avatarSrc}" onerror="this.onerror=null;this.src='${DEFAULT_AVATAR}';" class="w-12 h-12 rounded-full object-cover bg-gray-100 shrink-0">
                                                <div class="overflow-hidden">
                                                    <div class="font-bold text-black text-sm flex items-center truncate">${user.username} ${userBadges}</div>
                                                    <div class="text-xs text-gray-500">${count || 0} ảnh đã đăng</div>
                                                </div>
                                            </div>
                                        `);
                                    }
                                }
                            } catch (e) { console.error("Lỗi tìm Uploader:", e); }
                        })());
                    }

                    // 2. LẤY ĐƠN VỊ VẬN HÀNH
                    if (filterType === 'operator' || filterType === 'all') {
                        cardPromises.push((async () => {
                            try {
                                let opInfoQuery = window.sb.from('operator_info').select('*');
                                let opPhotoQuery = window.sb.from('photos').select('operator').eq('status', 'approved');
                                
                                searchWords.forEach(w => { 
                                    opInfoQuery = opInfoQuery.ilike('operator_name', `%${w}%`); 
                                    opPhotoQuery = opPhotoQuery.ilike('operator', `%${w}%`); 
                                });

                                const [infoRes, photoRes] = await Promise.all([
                                    opInfoQuery.limit(10),
                                    opPhotoQuery.limit(200)
                                ]);

                                let uniqueOpsMap = new Map();
                                const opInfoMap = {};

                                if (infoRes.data) {
                                    infoRes.data.forEach(info => {
                                        if (info.operator_name) {
                                            const key = info.operator_name.toLowerCase();
                                            uniqueOpsMap.set(key, info.operator_name);
                                            opInfoMap[key] = info;
                                        }
                                    });
                                }

                                if (photoRes.data) {
                                    photoRes.data.forEach(p => {
                                        if (p.operator) {
                                            const key = p.operator.toLowerCase();
                                            if (!uniqueOpsMap.has(key)) {
                                                uniqueOpsMap.set(key, p.operator);
                                            }
                                        }
                                    });
                                }

                                const finalOps = Array.from(uniqueOpsMap.values()).slice(0, 4);

                                const missingInfos = finalOps.filter(op => !opInfoMap[op.toLowerCase()]);
                                if (missingInfos.length > 0) {
                                    const { data: extraInfos } = await window.sb.from('operator_info').select('*').in('operator_name', missingInfos);
                                    if (extraInfos) {
                                        extraInfos.forEach(info => { opInfoMap[info.operator_name.toLowerCase()] = info; });
                                    }
                                }

                                for (const op of finalOps) {
                                    const info = opInfoMap[op.toLowerCase()] || {};
                                    const logo = info.logo_url ? app.utils.escapeAttr(info.logo_url) : '';
                                    
                                    const iconHtml = logo 
                                        ? `<img src="${logo}" class="w-12 h-12 object-contain shrink-0" onerror="this.outerHTML='<div class=&quot;w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl shrink-0&quot;><i class=&quot;fa-solid fa-building&quot;></i></div>';">` 
                                        : `<div class="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl shrink-0"><i class="fa-solid fa-building"></i></div>`;

                                    operatorCards.push(`
                                        <div class="bg-white border border-gray-200 rounded-md p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition" onclick="app.views.loadOperatorPage('${app.utils.escapeAttr(op)}')">
                                            ${iconHtml}
                                            <div class="overflow-hidden">
                                                <div class="font-bold text-black text-sm truncate">${app.utils.cleanText(op)}</div>
                                                <div class="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5 font-bold">Đơn vị vận hành</div>
                                            </div>
                                        </div>
                                    `);
                                }
                            } catch (e) { console.error("Lỗi tìm Đơn vị:", e); }
                        })());
                    }

                    // 3. LẤY DÒNG XE (MODEL)
                    if (filterType === 'model' || filterType === 'all') {
                        cardPromises.push((async () => {
                            try {
                                let mdlInfoQuery = window.sb.from('model_info').select('*');
                                let mdlVehicleQuery = window.sb.from('vehicles').select('model');
                                
                                searchWords.forEach(w => { 
                                    mdlInfoQuery = mdlInfoQuery.ilike('model_name', `%${w}%`); 
                                    mdlVehicleQuery = mdlVehicleQuery.ilike('model', `%${w}%`); 
                                });

                                const [infoRes, vehicleRes] = await Promise.all([
                                    mdlInfoQuery.limit(10),
                                    mdlVehicleQuery.limit(200)
                                ]);

                                let uniqueModelsMap = new Map();
                                const mdlInfoMap = {};

                                if (infoRes.data) {
                                    infoRes.data.forEach(info => {
                                        if (info.model_name) {
                                            const key = info.model_name.toLowerCase();
                                            uniqueModelsMap.set(key, info.model_name);
                                            mdlInfoMap[key] = info;
                                        }
                                    });
                                }

                                if (vehicleRes.data) {
                                    vehicleRes.data.forEach(v => {
                                        if (v.model) {
                                            const key = v.model.toLowerCase();
                                            if (!uniqueModelsMap.has(key)) {
                                                uniqueModelsMap.set(key, v.model);
                                            }
                                        }
                                    });
                                }

                                const finalModels = Array.from(uniqueModelsMap.values()).slice(0, 4);

                                const missingInfos = finalModels.filter(m => !mdlInfoMap[m.toLowerCase()]);
                                if (missingInfos.length > 0) {
                                    const { data: extraInfos } = await window.sb.from('model_info').select('*').in('model_name', missingInfos);
                                    if (extraInfos) {
                                        extraInfos.forEach(info => { mdlInfoMap[info.model_name.toLowerCase()] = info; });
                                    }
                                }

                                for (const m of finalModels) {
                                    const info = mdlInfoMap[m.toLowerCase()] || {};
                                    let logo = info.logo_url ? app.utils.escapeAttr(info.logo_url) : '';
                                    
                                    if (!logo) {
                                        const brandName = m.split(' ')[0];
                                        const { data: brandLogoData } = await window.sb.from('model_info')
                                            .select('logo_url')
                                            .ilike('model_name', `${brandName}%`)
                                            .not('logo_url', 'is', null)
                                            .limit(1)
                                            .maybeSingle();
                                        if (brandLogoData && brandLogoData.logo_url) {
                                            logo = app.utils.escapeAttr(brandLogoData.logo_url);
                                        }
                                    }

                                    const iconHtml = logo 
                                        ? `<img src="${logo}" class="w-12 h-12 object-contain shrink-0" onerror="this.outerHTML='<div class=&quot;w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl shrink-0&quot;><i class=&quot;fa-solid fa-layer-group&quot;></i></div>';">` 
                                        : `<div class="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl shrink-0"><i class="fa-solid fa-layer-group"></i></div>`;

                                    modelCards.push(`
                                        <div class="bg-white border border-gray-200 rounded-md p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition" onclick="app.model.loadModelPage('${app.utils.escapeAttr(m)}')">
                                            ${iconHtml}
                                            <div class="overflow-hidden">
                                                <div class="font-bold text-black text-sm truncate">${app.utils.cleanText(m)}</div>
                                                <div class="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5 font-bold">Dòng xe</div>
                                            </div>
                                        </div>
                                    `);
                                }
                            } catch (e) { console.error("Lỗi tìm Dòng xe:", e); }
                        })());
                    }

                    // 4. LẤY XE (VEHICLE / PLATE)
                    if (filterType === 'plate' || filterType === 'model' || filterType === 'all') {
                        cardPromises.push((async () => {
                            try {
                                let selectStr = '*';
                                if (app.preference.current !== 'both') selectStr = '*, photos!inner(type)';

                                let vQuery = window.sb.from('vehicles').select(selectStr).limit(10);
                                if (filterType === 'plate') {
                                    searchWords.forEach(w => { vQuery = vQuery.ilike('license_plate', `%${app.utils.normalizePlateQuery(w)}%`); });
                                } else if (filterType === 'model') {
                                    searchWords.forEach(w => { vQuery = vQuery.ilike('model', `%${w}%`); });
                                } else {
                                    searchWords.forEach(w => {
                                        const safeW = w.replace(/"/g, '');
                                        const safeWPlate = app.utils.normalizePlateQuery(safeW);
                                        if (safeWPlate) vQuery = vQuery.or(`license_plate.ilike."%${safeWPlate}%",model.ilike."%${safeW}%",note.ilike."%${safeW}%"`);
                                        else vQuery = vQuery.or(`model.ilike."%${safeW}%",note.ilike."%${safeW}%"`);
                                    });
                                }

                                vQuery = app.preference.applyFilter(vQuery, 'vehicles');
                                const { data: vData } = await vQuery;

                                if (vData && vData.length > 0) {
                                    for (const v of vData) {
                                        const rawPlate = app.utils.cleanText(v.license_plate);
                                        const displayPlate = app.utils.displayPlate(rawPlate);
                                        const safeModel = app.utils.cleanText(v.model || 'Chưa rõ Model');
                                        const iconClass = (app.preference.current === 'coach') ? 'fa-van-shuttle' : 'fa-bus';

                                        plateCards.push(`
                                            <div class="bg-white border border-gray-200 rounded-md p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition" onclick="app.views.loadVehiclePage('${rawPlate}')">
                                                <div class="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl shrink-0"><i class="fa-solid ${iconClass}"></i></div>
                                                <div class="overflow-hidden">
                                                    <div class="font-bold text-black text-sm truncate">${displayPlate}</div>
                                                    <div class="text-xs text-gray-500 truncate" title="${safeModel}">${safeModel}</div>
                                                </div>
                                            </div>
                                        `);
                                    }
                                }
                            } catch (e) { console.error("Lỗi tìm Xe:", e); }
                        })());
                    }

                    // ÉP TRÌNH DUYỆT CHẠY 4 TIẾN TRÌNH TRÊN CÙNG 1 LÚC (TỐC ĐỘ X4)
                    await Promise.all(cardPromises);

                    // XUẤT RA UI THEO ĐÚNG THỨ TỰ ƯU TIÊN: Đơn Vị -> Dòng Xe -> Biển Số -> Người Đăng
                    app.currentSearchCards = [...operatorCards, ...modelCards, ...plateCards, ...uploaderCards];
                    app.views.loadMoreSearchCards(true);


                    // ================= TÌM KIẾM ẢNH CHÍNH =================
                    const profileSelect = (filterType === 'uploader') ? 'profiles!inner(id, username, role, subroles)' : 'profiles(id, username, role, subroles)';
                    let photoQuery;

                    // FIX LỖI: Dùng INNER JOIN cho 'model' để Database tự lọc mà không bị lỡ ảnh cũ
                    if (filterType === 'model') {
                        photoQuery = window.sb.from('photos').select(`*, ${profileSelect}, vehicles!inner(model)`).eq('status', 'approved');
                    } else {
                        photoQuery = window.sb.from('photos').select(`*, ${profileSelect}, vehicles(model)`).eq('status', 'approved');
                    }

                    photoQuery = app.preference.applyFilter(photoQuery);
                    let forceEmptyResult = false;

                    if (filterType === 'absolute_route') {
                        const prefix = prefixToUrl || currentParams.get('prefix') || '';
                        const relatedPrefixes = app.utils.getRelatedPrefixes(prefix);
                        const prefixOrCond = relatedPrefixes.map(p => `license_plate.ilike.${p}%`).join(',');
                        photoQuery = photoQuery.eq('route_no', query).or(prefixOrCond);
                    } else if (filterType === 'plate') {
                        searchWords.forEach(w => { photoQuery = photoQuery.ilike('license_plate', `%${app.utils.normalizePlateQuery(w)}%`); });
                    } else if (filterType === 'route') {
                        searchWords.forEach(w => { photoQuery = photoQuery.ilike('route_no', `%${w}%`); });
                    } else if (filterType === 'operator') {
                        searchWords.forEach(w => { photoQuery = photoQuery.ilike('operator', `%${w}%`); });
                    } else if (filterType === 'camera') {
                        searchWords.forEach(w => { photoQuery = photoQuery.ilike('camera_model', `%${w}%`); });
                    } else if (filterType === 'location') {
                        searchWords.forEach(w => { photoQuery = photoQuery.ilike('location', `%${w}%`); });
                    } else if (filterType === 'uploader') {
                        searchWords.forEach(w => { photoQuery = photoQuery.ilike('profiles.username', `%${w}%`); });
                    } else if (filterType === 'model') {
                        // Kích hoạt tìm kiếm Model bằng INNER JOIN
                        searchWords.forEach(w => { photoQuery = photoQuery.ilike('vehicles.model', `%${w}%`); });
                    } else {
                                                // LỌC ALL (TỐI ƯU HÓA)
                        let mQ = window.sb.from('vehicles').select('license_plate');
                        let uQ = window.sb.from('profiles').select('id');

                        searchWords.forEach(w => {
                            const safeW = w.replace(/"/g, '');
                            mQ = mQ.or(`model.ilike."%${safeW}%",note.ilike."%${safeW}%"`);
                            uQ = uQ.ilike('username', `%${w}%`);
                        });

                        // Chạy 2 truy vấn MỞ RỘNG CÙNG 1 LÚC để giảm nửa thời gian chờ
                        // CHÚ Ý: Đã giảm limit(800) xuống 150 để URL API không bị quá tải do chuỗi IN() quá dài
                        const [mRes, uRes] = await Promise.all([
                            mQ.limit(150), 
                            uQ.limit(10)
                        ]);

                        const plates = mRes.data ? mRes.data.map(v => v.license_plate) : [];
                        const uploaderIds = uRes.data ? uRes.data.map(u => u.id) : [];

                        searchWords.forEach(w => {
                            const safeW = w.replace(/"/g, '');
                            const safeWPlate = app.utils.normalizePlateQuery(safeW);
                            
                            let orConditions = [];
                            if (safeWPlate) orConditions.push(`license_plate.ilike."%${safeWPlate}%"`);
                            
                            orConditions.push(`operator.ilike."%${safeW}%"`);
                            orConditions.push(`route_no.ilike."%${safeW}%"`);
                            orConditions.push(`camera_model.ilike."%${safeW}%"`);
                            orConditions.push(`location.ilike."%${safeW}%"`);
                            orConditions.push(`note.ilike."%${safeW}%"`);

                            if (plates.length > 0) orConditions.push(`license_plate.in.(${plates.join(',')})`);
                            if (uploaderIds.length > 0) orConditions.push(`uploader_id.in.(${uploaderIds.join(',')})`);
                            
                            photoQuery = photoQuery.or(orConditions.join(','));
                        });
                    }

                    if (forceEmptyResult) {
                        grid.innerHTML = '<div class="col-span-full text-center py-10 text-gray-500">Không tìm thấy kết quả phù hợp.</div>';
                        app.loadingBar.finish();
                        return;
                    }

                    const { data: results, error } = await photoQuery
                        .order('taken_at', { ascending: false, nullsFirst: false })
                        .order('created_at', { ascending: false })
                        .limit(500);

                    if (app.currentViewMode !== 'search') return;
                    if (error) throw error;

                    if (!results || results.length === 0) {
                        grid.innerHTML = '<div class="col-span-full text-center py-10 text-gray-500">Không tìm thấy ảnh nào trùng khớp.</div>';
                        return;
                    }

                    app.currentSearchResults = results;
                    app.loadedCount = 0;
                    grid.innerHTML = '';

                    app.views.loadMorePhotos();

                } catch (err) {
                    console.error(err);
                    grid.innerHTML = `<div class="col-span-full text-center py-10 text-red-500">Lỗi hệ thống: ${err.message}</div>`;
                }
                app.loadingBar.finish();
            },


window.app.searchRedirect = (query, filterType = 'all', prefix = '') => {
                let url = `/search?q=${encodeURIComponent(query)}&filter=${filterType}`;
                if (prefix) url += `&prefix=${encodeURIComponent(prefix)}`;
                app.utils.navigate(url);
            },


window.app.handleRoute = () => {
                app.loadingBar.start(); // Bật thanh loading ngay lập tức
                app.utils.cleanupState();

                const path = window.location.pathname;
                const searchParams = new URLSearchParams(window.location.search);
                app.currentPathForScroll = path + window.location.search;

                // CHUYỂN GIAO DIỆN (UI) NGAY LẬP TỨC TRƯỚC, DATA LOAD NGẦM SAU
                if (path === '/login' && searchParams.get('qr')) {
                    app.views.switch('home', false);
                    setTimeout(() => app.qrLogin.initClient(searchParams.get('qr')), 500);
                } else if (path === '/auth') {
                    document.title = 'Xác thực | VNBUSARCHIVE';
                    const isRecovery = window.location.hash.includes('type=recovery') || app.auth.mode === 'recovery';
                    if (app.user && !isRecovery) app.utils.navigate('/');
                    else app.views.switch('auth', false);
                } else if (path === '/setting' || path === '/settings') {
                    app.views.switch('account', false);
                    app.views.loadAccount();
                    setTimeout(() => {
                        app.settings.open();
                        const tab = searchParams.get('tab') || searchParams.get('caigido');
                        if (tab) {
                            app.settings.jumpTo(tab, 'account');
                        }
                    }, 400);
                } else if (path === '/profile/comments') {
                    app.comments.openDashboard();
                } else if (path === '/profile') {
                    app.views.switch('account', false);
                    app.views.loadAccount();
                } else if (path.startsWith('/user/')) {
                    const username = decodeURIComponent(path.split('/')[2]);
                    if (username) {
                        app.views.switch('account', false);
                        app.views.loadAccount(username);
                    } else app.views.loadHome();
                } else if (path === '/upload') {
                    document.title = 'Đăng tải ảnh | VNBUSARCHIVE';
                    app.views.switch('upload', false);
                } else if (path === '/mobile-upload') {
                    document.title = 'Tải ảnh từ thiết bị | VNBUSARCHIVE';
                    app.views.switch('mobile-upload', false);
                } else if (path === '/admin') {
                    document.title = 'Quản trị hệ thống | VNBUSARCHIVE';
                    app.views.switch('admin', false);
                    app.admin.refreshCounts();
                    app.admin.loadTab(app.adminTab);
                } else if (path === '/contact') {
                    app.views.loadContact();
                } else if (path === '/help' || path === '/help/') {
                    app.help.loadList();
                } else if (path.startsWith('/help/')) {
                    const id = path.split('/')[2];
                    if (id) app.help.loadDetail(id);
                    else app.help.loadList();
                } else if (path.startsWith('/photo/')) {
                    const id = path.split('/')[2];
                    if (id) {
                        app.views.switch('detail', false);
                        app.views.loadDetail(id);
                    }
                } else if (path.startsWith('/vehicle/')) {
                    const plate = decodeURIComponent(path.split('/')[2]);
                    if (plate) {
                        app.views.switch('vehicle', false);
                        app.views.loadVehiclePage(plate);
                    } else app.views.loadHome();
                } else if (path.startsWith('/operator/')) {
                    const operatorName = decodeURIComponent(path.substring('/operator/'.length));
                    if (operatorName) {
                        app.views.switch('operator-view', false);
                        app.views.loadOperatorPage(operatorName);
                    } else app.views.loadHome();
                } else if (path.startsWith('/model/')) {
                    const modelName = decodeURIComponent(path.substring('/model/'.length));
                    if (modelName) {
                        app.views.switch('model-view', false);
                        app.model.loadModelPage(modelName);
                    } else app.views.loadHome();
                } else if (path.startsWith('/search')) {
                    document.title = 'Tìm kiếm | VNBUSARCHIVE';
                    const q = searchParams.get('q');
                    const filter = searchParams.get('filter') || 'all';

                    if (filter === 'absolute_route') app.currentFilter = 'absolute_route';
                    else app.search.setFilter(filter, false);

                    if (q) {
                        document.getElementById('search-input').value = decodeURIComponent(q);
                        app.views.switch('search', false);
                        app.handleSearch();
                    } else app.views.loadHome();
                } else {
                    app.views.switch('home', false);
                    app.views.loadHome();
                }

                app.utils.updateBreadcrumbs();
                
                // Trả cảm giác mượt mà: Bất chấp Database load lâu cỡ nào, thanh Loading chạy xong ngay sau khi đổi UI!
                setTimeout(() => {
                    app.loadingBar.finish();
                }, 150);
            },


window.app.vehicle = {
                currentHistoryData: [],
                tempHistory:[],
                currentHistoryPrefix: '',

                cleanupVehicle: async (plate) => {
                    if (!plate) return;
                    try {


                        const { data, error } = await window.sb.from('photos').select('id').eq('license_plate', plate).limit(1);
                        if (!error && (!data || data.length === 0)) {
                            await window.sb.from('vehicles').delete().eq('license_plate', plate);
                            await window.sb.from('vehicle_history').delete().eq('license_plate', plate);
                        }
                    } catch (err) {}
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
                    if (app.vehicle.tempHistory.length === 0 && !confirm("Danh sách lịch sử đang trống. Bạn có muốn xóa hết lịch sử không?")) return;

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
                },

                syncHistoryOnPhotoEdit: async (plate, takenAtIso, oldData, newData) => {
                    if (!takenAtIso) return;
                    if (oldData.operator === newData.operator && oldData.route_no === newData.route_no) return;

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
                                await window.sb.from('vehicle_history').update({
                                    operator: newData.operator,
                                    route: newData.route_no
                                }).eq('id', history[0].id);
                            } else {
                                await window.sb.from('vehicle_history').insert({
                                    license_plate: plate,
                                    effective_date: targetDate,
                                    operator: newData.operator,
                                    route: newData.route_no,
                                    display_order: 999
                                });
                            }
                        }
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
            },


window.app.operator = {
                modelStatsData: [],
                modelStatsTotals: {},
                isModelTableExpanded: false,

                renderModelTable: () => {
                    const tbody = document.getElementById('op-model-tbody');
                    const btnExpand = document.getElementById('btn-op-model-expand');
                    
                    const data = app.operator.modelStatsData;
                    const totals = app.operator.modelStatsTotals;
                    const isExpanded = app.operator.isModelTableExpanded;

                    // Javascript cứng rắn: Cắt đúng 5 dòng nếu chưa bấm Xem thêm
                    const displayData = isExpanded ? data : data.slice(0, 5);

                    tbody.innerHTML = displayData.map(m => `
                        <tr class="hover:bg-gray-50 transition group">
                            <td class="font-medium text-gray-700 max-w-[200px] truncate border-r border-gray-200" title="${app.utils.cleanText(m.name)}">
                                <span onclick="app.utils.navigate('/model/${encodeURIComponent(m.name)}')" class="cursor-pointer hover:text-black hover:underline font-bold transition">
                                    ${app.utils.cleanText(m.name)}
                                </span>
                            </td>
                            <td class="text-center font-bold text-black border-r border-gray-200">${m.active > 0 ? m.active : ''}</td>
                            <td class="text-center font-bold text-black border-r border-gray-200">${m.inactive > 0 ? m.inactive : ''}</td>
                            <td class="text-center font-black text-black">${m.total}</td>
                        </tr>
                    `).join('');

                    // Render dòng TỔNG CỘNG (Nếu = 0 thì làm rỗng trống trơn)
                    document.getElementById('op-model-total-active').innerText = totals.active > 0 ? totals.active : '';
                    document.getElementById('op-model-total-inactive').innerText = totals.inactive > 0 ? totals.inactive : '';
                    document.getElementById('op-model-total-all').innerText = totals.all;

                    // Xử lý nút Xem thêm
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
                    app.operator.renderModelTable(); // Gọi lại hàm render để load Full mảng
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
                            <td class="font-medium text-gray-700 max-w-[200px] truncate border-r border-gray-200" title="${app.utils.cleanText(r.displayName || r.route)}">
                                <span onclick="app.searchRedirect('${app.utils.escapeAttr(r.route)}', 'absolute_route', '${r.prefix || ''}')" class="cursor-pointer hover:text-blue-600 hover:underline font-bold transition text-black">
                                    ${app.utils.cleanText(r.displayName || r.route)}
                                </span>
                            </td>
                            <td class="text-center font-bold text-black border-r border-gray-200">${r.vehicleCount}</td>
                            <td class="text-center text-black max-w-[150px] truncate" title="${r.mainModel || 'Chưa xác định'}">
                                <span onclick="if('${r.mainModel || 'Chưa xác định'}' !== 'Chưa xác định') app.utils.navigate('/model/${encodeURIComponent(r.mainModel || '')}')" class="${r.mainModel && r.mainModel !== 'Chưa xác định' ? 'cursor-pointer hover:underline transition' : ''}">
                                    ${r.mainModel || 'Chưa xác định'}
                                </span>
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
                    
                    // Cập nhật UI theo Role (Quyền)
                    if (app.role === 'admin' || app.role === 'manager') {
                        btnSave.innerText = "Lưu ngay lập tức";
                        warningText.innerHTML = "";
                    } else {
                        btnSave.innerText = "Gửi yêu cầu";
                        warningText.innerText = "Thông tin này sẽ được kiểm duyệt bởi Admin. Việc để trống cả 2 ô sẽ gửi yêu cầu xóa thông tin hiện tại.";
                    }

                    try {
                        const { data: opInfo } = await window.sb.from('operator_info').select('*').eq('operator_name', app.currentOperator).maybeSingle();
                        if (opInfo) {
                            document.getElementById('op-edit-logo').value = opInfo.logo_url || '';
                            document.getElementById('op-edit-desc').value = opInfo.description || '';
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
                    const desc = document.getElementById('op-edit-desc').value.trim();
                    const btn = document.getElementById('btn-save-operator');
                    
                    if (!logo && !desc) {
                        if (!confirm("Bạn đã để trống cả 2 ô. Điều này sẽ XÓA thông tin của Đơn vị vận hành hiện tại (trở về mặc định). Bạn có chắc chắn muốn tiếp tục?")) {
                            return;
                        }
                    }

                    if (logo && !/^https?:\/\//i.test(logo)) {
                        return app.ui.showAlert("Logo URL phải bắt đầu bằng http:// hoặc https://");
                    }

                    // User thường mới phải check Captcha
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
                            // ==========================================
                            // LUỒNG DÀNH CHO ADMIN: LƯU THẲNG VÀO DB
                            // ==========================================
                            const { error } = await window.sb.from('operator_info').upsert({
                                operator_name: app.currentOperator,
                                logo_url: logo || null,
                                description: desc || null
                            });
                            if (error) throw error;
                            
                            app.toast.show('success', 'Thành công', 'Đã lưu thông tin Đơn vị vận hành!');
                            app.operator.closeEditPrompt();
                            app.views.loadOperatorPage(app.currentOperator); // Tải lại trang ngay lập tức
                            
                            // Ghi Log cho Admin
                            if (app.admin && app.admin.logAction) {
                                app.admin.logAction('update_operator_direct', app.currentOperator, { logo_url: logo, description: desc });
                            }
                            
                        } else {
                            // ==========================================
                            // LUỒNG DÀNH CHO USER: GỬI YÊU CẦU DUYỆT
                            // ==========================================
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
                                license_plate: 'OP_INFO', // Giả lập để vượt qua bắt buộc NOT NULL (Nếu có)
                                new_data: {
                                    request_type: 'update_operator_info',
                                    operator_name: app.currentOperator,
                                    description: desc,
                                    logo_url: logo
                                },
                                status: 'pending'
                            };

                            const { error } = await window.sb.from('edit_requests').insert(reqData);
                            if (error) throw error;

                            app.ui.showAlert("Đã gửi yêu cầu cập nhật thông tin đơn vị vận hành và đang chờ Admin duyệt.");
                            app.operator.closeEditPrompt();
                        }
                    } catch (err) {
                        app.ui.showAlert("Lỗi: " + err.message);
                    } finally {
                        btn.innerHTML = origText;
                        btn.disabled = false;
                    }
                }
            },

            // --- BẮT ĐẦU LOGIC PROFILE DÒNG XE ---

window.app.model = {
                currentModel: '',
                modelLoadedCount: 0,
                modelPhotos: [],

                loadModelPage: async (modelName, forceRefresh = false) => {
                    const decodedPath = decodeURIComponent(window.location.pathname);
                    if (decodedPath !== `/model/${modelName}`) {
                        app.utils.navigate(`/model/${encodeURIComponent(modelName)}`);
                        return;
                    }

                    // --- KIỂM TRA BỘ NHỚ TẠM ---
                    if (app.model.currentModel === modelName && app.model.modelPhotos && app.model.modelPhotos.length > 0 && !forceRefresh) {
                        app.views.switch('model-view', false);
                        app.loadingBar.finish();
                        return;
                    }

                    app.views.switch('model-view', false);
                    document.title = `${modelName} | VNBUSARCHIVE`;
                    app.model.currentModel = modelName;
                    app.model.modelLoadedCount = 0;

                    // --- RESET UI TRỐNG ĐỂ CHỐNG NHÁY THÔNG TIN CŨ ---
                    document.getElementById('crumb-model-profile').innerText = modelName;
                    document.getElementById('model-profile-title').innerText = modelName;
                    document.getElementById('model-logo').classList.add('hidden');
                    document.getElementById('model-logo-fallback').classList.remove('hidden');
                    document.getElementById('model-desc').classList.add('hidden');
                    document.getElementById('mdl-stat-photos').innerText = '...';
                    document.getElementById('mdl-stat-vehicles').innerText = '...';
                    document.getElementById('mdl-stat-ops').innerText = '...';
                    document.getElementById('mdl-stat-views').innerText = '...';
                    
                    const grid = document.getElementById('model-photo-grid');
                    grid.innerHTML = '<div class="col-span-full text-center py-10 text-gray-500"><i class="fa-solid fa-circle-notch fa-spin"></i> Đang tổng hợp dữ liệu...</div>';
                    document.getElementById('model-load-more-container').classList.add('hidden');
                    // --------------------------------------------------

                    try {
                        // 1. Tách lấy tên hãng xe (Từ khóa đầu tiên: ví dụ "Thaco Mobihome" -> "Thaco")
                        const brandName = modelName.split(' ')[0];

                        // 2. Lấy dữ liệu Mô tả của CHÍNH XÁC dòng xe này
                        const { data: exactInfo } = await window.sb.from('model_info').select('*').eq('model_name', modelName).maybeSingle();

                        // 3. Tìm Logo của hãng (Tìm dòng xe bất kỳ bắt đầu bằng tên hãng và có logo)
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
                            logoEl.src = brandLogoData.logo_url;
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

                        // 4. Lấy dữ liệu ảnh và thống kê thông qua INNER JOIN bảng vehicles
                        const { data: statsData, error: statsErr } = await window.sb.from('photos')
                            .select('views, license_plate, operator, vehicles!inner(model)')
                            .eq('status', 'approved')
                            .eq('vehicles.model', modelName);

                        if (statsErr) throw statsErr;

                        if (!statsData || statsData.length === 0) {
                            grid.innerHTML = '<div class="col-span-full text-center py-10 text-gray-500">Chưa có ảnh xe nào thuộc dòng này được duyệt trên hệ thống.</div>';
                            document.getElementById('mdl-stat-photos').innerText = '0';
                            document.getElementById('mdl-stat-vehicles').innerText = '0';
                            document.getElementById('mdl-stat-ops').innerText = '0';
                            document.getElementById('mdl-stat-views').innerText = '0';
                            app.loadingBar.finish();
                            return;
                        }

                        let totalViews = 0;
                        let uniquePlates = new Set();
                        let uniqueOps = new Set();

                        statsData.forEach(p => {
                            totalViews += (p.views || 0);
                            if (p.license_plate) uniquePlates.add(p.license_plate.toUpperCase());
                            if (p.operator && p.operator !== '---') uniqueOps.add(p.operator.toLowerCase());
                        });

                        document.getElementById('mdl-stat-photos').innerText = app.utils.formatCompact(statsData.length);
                        document.getElementById('mdl-stat-vehicles').innerText = app.utils.formatCompact(uniquePlates.size);
                        document.getElementById('mdl-stat-ops').innerText = app.utils.formatCompact(uniqueOps.size);
                        document.getElementById('mdl-stat-views').innerText = app.utils.formatCompact(totalViews);

                        let pQuery = window.sb.from('photos').select(`*, profiles(id, username, role, subroles), vehicles!inner(model)`)
                            .eq('status', 'approved')
                            .eq('vehicles.model', modelName)
                            .order('taken_at', { ascending: false, nullsFirst: false })
                            .order('created_at', { ascending: false });
                        
                        pQuery = app.preference.applyFilter(pQuery);

                        const { data: photos, error } = await pQuery;
                        if (error) throw error;

                        app.model.modelPhotos = photos || [];
                        grid.innerHTML = '';
                        app.views.loadMoreModelPhotos();

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
                        btnSave.innerText = "Lưu ngay lập tức";
                        warningText.innerHTML = "";
                    } else {
                        btnSave.innerText = "Gửi yêu cầu";
                        warningText.innerText = "Thông tin này sẽ được kiểm duyệt bởi Admin. Việc để trống cả 2 ô sẽ gửi yêu cầu xóa thông tin hiện tại.";
                    }

                    try {
                        const brandName = app.model.currentModel.split(' ')[0];
                        
                        // Lấy Mô tả của dòng xe này
                        const { data: exactInfo } = await window.sb.from('model_info').select('description').eq('model_name', app.model.currentModel).maybeSingle();
                        if (exactInfo) document.getElementById('mdl-edit-desc').value = exactInfo.description || '';

                        // Lấy Logo của hãng (tìm bất kỳ dòng xe nào cùng hãng có logo)
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
                    
                    if (!logo && !desc) {
                        if (!confirm("Bạn đã để trống cả 2 ô. Bạn có chắc chắn muốn XÓA thông tin của Dòng xe hiện tại không?")) {
                            return;
                        }
                    }

                    if (logo && !/^https?:\/\//i.test(logo)) {
                        return app.ui.showAlert("Logo URL phải bắt đầu bằng http:// hoặc https://");
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
                            // BƯỚC 1: Lưu (Upsert) thông tin cho dòng xe hiện tại
                            const { error: upsertErr } = await window.sb.from('model_info').upsert({
                                model_name: app.model.currentModel,
                                logo_url: logo || null,
                                description: desc || null
                            });
                            if (upsertErr) throw upsertErr;

                            // BƯỚC 2: Đồng bộ Logo cho tất cả dòng xe cùng hãng (Nếu có thay đổi Logo)
                            // Sử dụng .ilike để bao quát (Ví dụ: Thaco Mobihome, Thaco County...)
                            await window.sb.from('model_info')
                                .update({ logo_url: logo || null })
                                .ilike('model_name', `${brandName}%`);
                            
                            app.toast.show('success', 'Thành công', 'Đã lưu và đồng bộ thông tin Dòng xe!');
                            app.model.closeEditPrompt();
                            app.model.loadModelPage(app.model.currentModel);
                            
                            if (app.admin && app.admin.logAction) {
                                app.admin.logAction('update_model_direct', app.model.currentModel, { logo_url: logo, description: desc, brand_sync: brandName });
                            }
                        } else {
                            // GỬI YÊU CẦU DUYỆT (CHO USER THƯỜNG)
                            const { count, error: checkErr } = await window.sb.from('edit_requests')
                                .select('*', { count: 'exact', head: true })
                                .eq('status', 'pending')
                                .contains('new_data', { request_type: 'update_model_info', model_name: app.model.currentModel });
                                
                            if (checkErr) throw checkErr;
                            if (count > 0) throw new Error("Đã có một yêu cầu cập nhật thông tin cho dòng xe này đang chờ duyệt. Vui lòng đợi!");

                            const reqData = {
                                requester_id: app.user.id,
                                license_plate: 'MODEL_INFO', // Giả lập để qua Validate
                                new_data: {
                                    request_type: 'update_model_info',
                                    model_name: app.model.currentModel,
                                    description: desc,
                                    logo_url: logo
                                },
                                status: 'pending'
                            };

                            const { error } = await window.sb.from('edit_requests').insert(reqData);
                            if (error) throw error;

                            app.ui.showAlert("Đã gửi yêu cầu cập nhật thông tin Dòng xe và đang chờ Admin duyệt.");
                            app.model.closeEditPrompt();
                        }
                    } catch (err) {
                        app.ui.showAlert("Lỗi: " + err.message);
                    } finally {
                        btn.innerHTML = origText;
                        btn.disabled = false;
                    }
                }
            },
            // --- KẾT THÚC LOGIC PROFILE DÒNG XE ---

        init: async () => {
            let session = null;

            try {
                const { data } = await window.sb.auth.getSession();
                session = data.session;

                // --- CHẶN TÀI KHOẢN CHƯA XÁC MINH NGAY TỪ ĐẦU ---
                if (session && session.user && !session.user.email_confirmed_at) {
                    document.getElementById('loading-screen').style.display = 'none';
                    if(document.getElementById('app-container')) document.getElementById('app-container').style.display = 'none';
                    app.auth.showVerificationModal(session.user.email);
                    return;
                }
                // ---------------------------------------------------

                setTimeout(() => {
                    document.getElementById('loading-screen').style.display = 'none';
                    const appContainer = document.getElementById('app-container');
                    appContainer.style.display = 'block';
                    setTimeout(() => {
                        appContainer.style.opacity = '1';
                        if (!localStorage.getItem('vnbus_donate_toast_shown')) {
                            localStorage.setItem('vnbus_donate_toast_shown', 'true');
                            setTimeout(() => {
                                app.toast.show('heart', 'Website phi lợi nhuận', 'Không quảng cáo, không nguồn thu - VNBA duy trì bằng sự ủng hộ của các bạn. Nhấn vào đây để chia sẻ website nhé!', 0, async () => {
                                    const shareText = 'Web lưu trữ hình ảnh xe buýt/khách Việt Nam phi lợi nhuận https://www.vnbusarchive.io.vn';
                                    if (navigator.share) {
                                        try { await navigator.share({ text: shareText }); } catch (err) {}
                                    } else {
                                        try {
                                            await navigator.clipboard.writeText(shareText);
                                            app.toast.show('success', 'Đã copy', 'Thiết bị không hỗ trợ chia sẻ, đã copy nội dung!');
                                        } catch (e) {}
                                    }
                                });
                            }, 1000);
                        }
                    }, 50);
                }, 400);

                await app.setUser(session ? session.user : null);

                window.sb.auth.onAuthStateChange(async (event, session) => {

                        if (event === 'PASSWORD_RECOVERY') {
    // Chỉ xử lý trên TAB MỚI (Tab được mở từ Link Email sẽ có chứa chữ type=recovery trên URL)
    if (window.location.hash.includes('type=recovery')) {
        app.auth.mode = 'recovery';

        // Điều hướnh thẳng vào trang Auth để hiện form
        if (window.location.pathname !== '/auth') {
            app.utils.navigate('/auth');
        } else {
            app.views.switch('auth', false);
        }

        // Bắn event gọi AlpineJS đổi giao diện sang Form Nhập mật khẩu mới
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('set-auth-mode', { detail: 'recovery' }));
        }, 100);
    }
    // Nếu là TAB CŨ (Trang bạn vừa bấm gửi yêu cầu) -> Return, không làm gì cả!
    return;
}

                        else if (event === 'USER_UPDATED') {
                            const hash = window.location.hash;
                            if (hash && hash.includes('type=email_change')) {
                                setTimeout(() => {
                                    app.ui.showAlert("Xác nhận đổi địa chỉ Email thành công!");
                                    window.history.replaceState(null, null, window.location.pathname);
                                }, 500);
                            }
                        }

                        else if (event === 'SIGNED_IN') {
                            const hash = window.location.hash;
                            if (hash && hash.includes('type=signup')) {
                                setTimeout(() => {
                                    app.ui.showAlert("Xác thực Email thành công! Chào mừng bạn đến với hệ thống.");
                                    window.history.replaceState(null, null, window.location.pathname);
                                }, 500);
                            }
                        }
                    });

                } catch (e) {
                    document.getElementById('loading-screen').style.display = 'none';
                    const appContainer = document.getElementById('app-container');
                    if(appContainer) {
                        appContainer.style.display = 'block';
                        appContainer.style.opacity = '1';
                    }
                    await app.setUser(null);
                }

                window.onpopstate = () => app.handleRoute();

                // Network Resilience (Tích hợp Toast mới)
                window.addEventListener('offline', () => {
                    document.body.classList.add('is-offline');
                    if (app.toast.currentOfflineToast) app.toast.currentOfflineToast(); // Đóng cái cũ nếu có
                    app.toast.currentOfflineToast = app.toast.show('offline', 'Mất kết nối Internet', 'Bạn đang ngoại tuyến. Dữ liệu sẽ không thể đồng bộ.', 0);
                });
                
                window.addEventListener('online', () => {
                    document.body.classList.remove('is-offline');
                    if (app.toast.currentOfflineToast) {
                        app.toast.currentOfflineToast(); // Ẩn thông báo lỗi
                        app.toast.currentOfflineToast = null;
                    }
                    app.toast.show('success', 'Đã khôi phục kết nối', 'Mạng Internet đã hoạt động trở lại.', 5000);
                });
                
                if (!navigator.onLine) {
                    document.body.classList.add('is-offline');
                    app.toast.currentOfflineToast = app.toast.show('offline', 'Mất kết nối Internet', 'Bạn đang ngoại tuyến. Dữ liệu sẽ không thể đồng bộ.', 0);
                }


                // Upload Form Auto-save Draft on Exit
                window.addEventListener('beforeunload', (e) => {
                    if (app.currentViewMode === 'upload') {
                        app.upload.saveDraft();
                    }
                    if (app.upload && app.upload.isQueueProcessing) {
                        e.preventDefault();
                        e.returnValue = ''; // Chặn đóng tab nếu đang tải dữ liệu ngầm lên
                    }
                });

                app.scrollPositions = {};
                app.currentPathForScroll = window.location.pathname + window.location.search;
                window.addEventListener('scroll', () => {
                    app.scrollPositions[app.currentPathForScroll] = window.scrollY;
                }, { passive: true });
                app.lastSearchQuery = '';
                app.lastSearchFilter = '';
                app.lastLoadedUsername = '';
                app.utils.updateBreadcrumbs();
                await app.utils.loadProvinceData();
                await app.maintenance.fetch();

                app.preference.load();

                app.onboarding.check();



                app.handleRoute();

                document.getElementById('up-file').addEventListener('change', app.upload.handleFileSelect);

                // Logic Drag & Drop TOÀN MÀN HÌNH (Clean UI: Hình tròn trắng không viền)
                const dropZone = document.getElementById('drop-zone');
                if (dropZone) {
                    let dragCounter = 0;

                    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                        window.addEventListener(eventName, e => {
                            e.preventDefault();
                            e.stopPropagation();
                        }, false);
                    });

                    window.addEventListener('dragenter', (e) => {
                        const uploadView = document.getElementById('upload');
                        if (!uploadView || !uploadView.classList.contains('active')) return;

                        dragCounter++;
                        if (dragCounter === 1) {
                            // Giao diện ô thông báo màu xanh
                            dropZone.style.backgroundColor = '#eff6ff';
                            dropZone.style.borderColor = '#3b82f6';
                            dropZone.style.color = '#1e40af';
                            dropZone.style.transform = 'scale(1.03)';
                            dropZone.style.boxShadow = '0 25px 50px -12px rgba(59, 130, 246, 0.3)';
                            dropZone.style.transition = 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

                            const icon = dropZone.querySelector('i');
                            const iconContainer = dropZone.querySelector('.w-16');

                            if (icon) {
                                icon.classList.add('animate-bounce');
                                icon.style.color = '#000000'; // Đám mây màu đen
                            }
                            if (iconContainer) {
                                iconContainer.style.backgroundColor = '#ffffff'; // Hình tròn trắng tinh
                                iconContainer.style.border = 'none';            // Bỏ hoàn toàn viền
                                iconContainer.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'; // Thêm đổ bóng nhẹ cho hình tròn nổi lên
                            }
                        }
                    });

                    const resetDropZoneUI = () => {
                        dropZone.style.backgroundColor = '';
                        dropZone.style.borderColor = '';
                        dropZone.style.color = '';
                        dropZone.style.transform = '';
                        dropZone.style.boxShadow = '';
                        const icon = dropZone.querySelector('i');
                        const iconContainer = dropZone.querySelector('.w-16');
                        if (icon) {
                            icon.classList.remove('animate-bounce');
                            icon.style.color = '';
                        }
                        if (iconContainer) {
                            iconContainer.style.backgroundColor = '';
                            iconContainer.style.border = '';
                            iconContainer.style.boxShadow = '';
                        }
                    };

                    window.addEventListener('dragleave', (e) => {
                        dragCounter--;
                        if (dragCounter <= 0) {
                            dragCounter = 0;
                            resetDropZoneUI();
                        }
                    });

                    window.addEventListener('drop', (e) => {
                        dragCounter = 0;
                        resetDropZoneUI();

                        const uploadView = document.getElementById('upload');
                        if (uploadView && uploadView.classList.contains('active')) {
                            const dt = e.dataTransfer;
                            if (dt.files && dt.files.length > 0) {
                                const fileInput = document.getElementById('up-file');
                                fileInput.files = dt.files;
                                app.upload.handleFileSelect({ target: fileInput });
                            }
                        }
                    });
                }
                app.upload.initDraggable();

                document.getElementById('upload-form').addEventListener('submit', app.upload.submit);
                document.getElementById('inline-edit-form').addEventListener('submit', app.edit.submitInline);
                document.getElementById('up-plate').addEventListener('blur', app.upload.checkDuplicateRealtime);
                document.getElementById('up-date').addEventListener('change', app.upload.checkDuplicateRealtime);
                app.upload.initValidation();

                const fieldMap = {
                    'info-plate': 'plate',
                    'info-operator': 'operator',
                    'info-route': 'route',
                    'info-camera': 'camera'
                };

                Object.keys(fieldMap).forEach(id => {
                    const el = document.getElementById(id);
                    if(!el) return;
                    el.addEventListener('click', function () {
                        if (this.readOnly && this.value && this.value !== '---' && this.value !== 'N/A') {
                            if (id === 'info-plate') {
                                app.utils.navigate(`/vehicle/${encodeURIComponent(this.value)}`);
                            }
                            else if (id === 'info-operator') {
                                app.utils.navigate(`/operator/${encodeURIComponent(this.value)}`);
                            }
                            else if (id === 'info-route') {
                                const plateValue = document.getElementById('info-plate').value;
                                let routePrefix = '';
                                const provName = app.utils.getProvinceFromPlate(plateValue);
                                if (provName && app.utils.provinceData && app.utils.provinceData.length) {
                                    const pData = app.utils.provinceData.find(p => p.ten === provName);
                                    if (pData && pData.ky_hieu) {
                                        routePrefix = Array.isArray(pData.ky_hieu) ? String(pData.ky_hieu[0]).trim() : String(pData.ky_hieu).split(',')[0].trim();
                                    }
                                }
                                app.searchRedirect(this.value, 'absolute_route', routePrefix);
                            }
                            else {
                                app.searchRedirect(this.value, fieldMap[id]);
                            }
                        }
                    });
                });

                // XỬ LÝ RIÊNG CHO INFO-MODEL (ĐIỀU HƯỚNG SANG PROFILE DÒNG XE)
                const elInfoModel = document.getElementById('info-model');
                if (elInfoModel) {
                    elInfoModel.addEventListener('click', function() {
                        if (this.readOnly && this.value && this.value !== '---' && this.value !== 'N/A') {
                            app.utils.navigate(`/model/${encodeURIComponent(this.value)}`);
                        }
                    });
                }

                // ---- KÍCH HOẠT SỰ KIỆN CHO CẢ 2 Ô TÌM KIẾM ----
                const clearSearchInput = (inputEl, sugId) => {
                    inputEl.value = '';
                    document.getElementById(sugId).classList.remove('active');
                    app.search.triggerMainSuggestion('', inputEl.id, sugId);
                };

                document.getElementById('search-input').addEventListener('keydown', function (e) {
                    if (e.key === 'Enter') { document.getElementById('main-search-suggestions').classList.remove('active'); app.handleSearch(); }
                    if (e.key === 'Escape') clearSearchInput(e.target, 'main-search-suggestions');
                });
                document.getElementById('search-input').addEventListener('input', function (e) {
                    app.search.triggerMainSuggestion(e.target.value.trim(), 'search-input', 'main-search-suggestions');
                });
                document.getElementById('search-input').addEventListener('focus', function (e) {
                    app.search.triggerMainSuggestion(e.target.value.trim(), 'search-input', 'main-search-suggestions');
                });

                const pageSearchInput = document.getElementById('page-search-input');
                if (pageSearchInput) {
                    pageSearchInput.addEventListener('keydown', function (e) {
                        if (e.key === 'Enter') { document.getElementById('page-search-suggestions').classList.remove('active'); app.handleSearch(true); }
                        if (e.key === 'Escape') clearSearchInput(e.target, 'page-search-suggestions');
                    });
                    pageSearchInput.addEventListener('input', function (e) {
                        app.search.triggerMainSuggestion(e.target.value.trim(), 'page-search-input', 'page-search-suggestions');
                    });
                    pageSearchInput.addEventListener('focus', function (e) {
                        app.search.triggerMainSuggestion(e.target.value.trim(), 'page-search-input', 'page-search-suggestions');
                    });
                }

                document.getElementById('up-location').addEventListener('input', function () {
                    clearTimeout(app.searchTimeout);
                    app.searchTimeout = setTimeout(() => {
                        app.utils.geocodeAddress(this.value);
                    }, 1000);
                });

                // Sửa logic ẩn menu thả xuống để hỗ trợ nhiều menu Filter
                document.addEventListener('click', function (e) {
                    document.querySelectorAll('.filter-menu').forEach(menu => {
                        const btn = menu.previousElementSibling;
                        if (!menu.contains(e.target) && btn && !btn.contains(e.target)) {
                            menu.classList.remove('active');
                        }
                    });

                    document.querySelectorAll('.suggestion-box').forEach(box => {
                        if (!box.contains(e.target) && !box.previousElementSibling.contains(e.target)) {
                            box.classList.remove('active');
                        }
                    });

                    const userMenuDropdown = document.getElementById('user-dropdown');
                    const userMenuContainer = document.getElementById('user-menu-container');
                    if (userMenuDropdown && userMenuContainer && !userMenuDropdown.contains(e.target) && !userMenuContainer.contains(e.target)) {
                        app.ui.toggleUserMenu(false);
                    }
                });

                app.upload.initMap();
                app.utils.loadAnnouncements();
                await app.utils.fetchTopUploaders();


                if (app.realtimeChannel) {
                    window.sb.removeChannel(app.realtimeChannel);
                }

                app.realtimeChannel = window.sb.channel('global-changes')
                    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'photos', filter: 'status=eq.approved' }, payload => {
                        if (app.currentViewMode === 'home') {
                            app.views.loadHome(true);
                        }
                    })
                    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'photos' }, payload => {
                        if (app.currentPhoto && app.currentPhoto.id === payload.new.id) {
                            const viewEl = document.getElementById('stat-views');
                            if (viewEl) viewEl.innerText = payload.new.views || 0;
                        }
                    })
                    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'vehicles' }, payload => {
                        const upPlate = document.getElementById('up-plate');
                        if (document.getElementById('upload').classList.contains('active') && upPlate && upPlate.value) {
                            if (upPlate.value.replace(/[^A-Z0-9]/gi, '').toUpperCase() === payload.new.license_plate) {
                                app.upload.checkPlate(upPlate.value);
                            }
                        }
                    })

                    .subscribe((status, err) => {
                        if (status === 'SUBSCRIBED') {
                            console.log('🔌 Connected to Realtime');
                        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
                            console.error('🔌 Realtime Error:', err);

                        }
                    });

                window.addEventListener('visibilitychange', () => {

                    if (document.visibilityState === 'visible') {
                        if (!app.isReinitializing) {
                            app.reinitializeComponents();
                        }

                        const state = app.realtimeChannel?.state;
                        if (state !== 'joined' && state !== 'joining') {
                            console.log('🔄 Tab visible: Reconnecting Realtime...');
                            if (app.realtimeChannel) window.sb.removeChannel(app.realtimeChannel);
                            window.sb.realtime.connect();
                        }
                    }
                });

                document.body.addEventListener('click', e => {
                    const a = e.target.closest('a');
                    if (a && a.getAttribute('href') && a.getAttribute('href').startsWith('/') && !a.getAttribute('target')) {
                        e.preventDefault();
                        app.utils.navigate(a.getAttribute('href'));
                    }
                });
            },


window.app.suggestionTimeouts = {}

window.app.suggestionControllers = {}

window.app.currentSearchResults = []

window.app.currentSearchCards = []

