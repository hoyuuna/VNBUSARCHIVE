window.app = window.app || {};

Object.assign(window.app, {
  views: {
                currentProfileSort: 'newest',
                currentProfileFilter: 'all',
                _profileCache: {},
                _likedCache: {},
                updateSortFilterUI: () => {
                    const btns = ['all', 'approved', 'pending', 'denied'];
                    btns.forEach(btnId => {
                        const el = document.getElementById('btn-filter-' + btnId);
                        if (el) {
                            if (btnId === app.views.currentProfileFilter) el.className = "px-3 py-1.5 bg-black text-white text-xs font-bold rounded shadow-sm transition whitespace-nowrap border border-black";
                            else el.className = "px-3 py-1.5 bg-white text-gray-600 text-xs font-bold rounded hover:bg-gray-50 transition whitespace-nowrap border border-gray-300";
                        }
                    });

                    const labelEl = document.getElementById('profile-sort-label');
                    if (labelEl) labelEl.innerText = app.views.currentProfileSort === 'newest' ? 'Mới nhất' : 'Phổ biến nhất';

                    document.querySelectorAll('.profile-sort-item').forEach(item => {
                        item.classList.remove('selected');
                        const icon = item.querySelector('.check-icon');
                        if (icon) icon.classList.add('opacity-0');
                        if (item.dataset.sort === app.views.currentProfileSort) {
                            item.classList.add('selected');
                            if (icon) icon.classList.remove('opacity-0');
                        }
                    });
                },
                sortProfilePhotos: (type) => {
                    app.views.currentProfileSort = type;
                    app.profilePage = 1;
                    const menu = document.getElementById('profile-sort-menu');
                    if (menu) menu.classList.remove('active');
                    app.views.updateSortFilterUI();
                    app.views.fetchProfilePhotosPage(1);
                },
                filterProfilePhotos: (status) => {
                    app.views.currentProfileFilter = status;
                    app.profilePage = 1;
                    app.views.updateSortFilterUI();
                    app.views.fetchProfilePhotosPage(1);
                },
                switch: async (id, updateUrl = true) => {
                    if (id === 'home' && window.location.pathname !== '/' && !window.location.pathname.startsWith('/search')) {
                        app.utils.navigate('/'); return;
                    }
                    if (id === 'upload' && window.location.pathname !== '/upload') {
                        app.utils.navigate('/upload'); return;
                    }
                    if (id === 'admin' && window.location.pathname !== '/admin') {
                        app.utils.navigate('/admin'); return;
                    }

                    if (id === 'admin') {
                        if (!app.user) { app.utils.navigate('/auth'); return; }
                        const { data: securityCheck } = await window.sb.from('profiles').select('role').eq('id', app.user.id).single();
                        if (!securityCheck || (securityCheck.role !== 'admin' && securityCheck.role !== 'manager')) {
                            app.ui.showAlert("Truy cập bị từ chối: Bạn không có quyền truy cập.");
                            if (window.location.pathname === '/admin') window.history.pushState({}, '', '/');
                            app.views.switch('home', false);
                            return;
                        }
                    }

                    let mtCheck = false;
                    if (['home', 'search', 'detail', 'vehicle', 'account'].includes(id)) mtCheck = app.maintenance.check('global');
                    else if (id === 'auth') mtCheck = app.maintenance.check('auth');
                    else if (id === 'upload') mtCheck = app.maintenance.check('upload');

                    if (mtCheck) {
                        app.maintenance.showScreen(mtCheck);
                        return; // Đang bảo trì thì dừng đổi trang
                    } else {
                        app.maintenance.hideScreen();
                    }

                    if (id === 'auth') {
                        window.dispatchEvent(new CustomEvent('auth-opened'));
                        app.utils.resetTurnstile('#auth .cf-turnstile');
                    }

                    const searchBox = document.getElementById('header-search-box');
                    const headerSpacer = document.getElementById('header-spacer');

                    if (['upload', 'search', 'mobile-upload'].includes(id)) {
                        searchBox.classList.add('hidden');
                        if (headerSpacer) {
                            headerSpacer.classList.remove('h-28');
                            headerSpacer.classList.add('h-20');
                        }
                        if (id === 'upload') {
                            app.upload.fetchRequirements();
                            app.upload.checkQuota();
                            app.upload.checkAndPromptDraft();
                            setTimeout(() => app.uploadMap && app.uploadMap.invalidateSize(), 200);
                            app.utils.resetTurnstile('#upload .cf-turnstile');
                        }
                    } else {
                        searchBox.classList.remove('hidden');
                        if (headerSpacer) {
                            headerSpacer.classList.remove('h-20');
                            headerSpacer.classList.add('h-28');
                        }
                    }

                    if (id === 'upload' && !app.user) { app.utils.navigate('/auth'); return; }

                    if (app.currentViewMode === 'upload' && id !== 'upload') {
                        app.upload.saveDraft();
                    }

                    // --- LOGIC ANIMATION TRƯỢT NGANG ---
                    // Cấp bậc trang để biết nên trượt tiến (phải -> trái) hay lùi (trái -> phải)
                    const depths = {
                        'home': 0,
                        'search': 1, 'account': 1, 'upload': 1, 'mobile-upload': 1, 'admin': 1, 'contact': 1, 'help-list': 1, 'comment-dashboard': 1,
                        'detail': 2, 'vehicle': 2, 'operator-view': 2, 'model-view': 2, 'help-detail': 2
                    };

                    const currentId = document.querySelector('.view-section.active')?.id || 'home';
                    const currentDepth = depths[currentId] || 0;
                    const targetDepth = depths[id] || 0;

                    let animationClass = 'slide-in-right'; // Tiến tới
                    if (targetDepth < currentDepth) {
                        animationClass = 'slide-in-left';  // Quay lùi lại
                    } else if (targetDepth === currentDepth) {
                        animationClass = 'fade-zoom-in-page'; // Ngang cấp (Fade)
                    }

                    document.querySelectorAll('.view-section').forEach(el => {
                        el.classList.remove('active', 'slide-in-right', 'slide-in-left', 'fade-zoom-in-page');
                    });

                    const targetPath = window.location.pathname + window.location.search;
                    if (app.scrollPositions && app.scrollPositions[targetPath] !== undefined) {
                        window.scrollTo(0, app.scrollPositions[targetPath]);
                    } else {
                        window.scrollTo(0, 0);
                    }

                    const targetEl = document.getElementById(id);
                    if (targetEl) {
                        targetEl.classList.add('active', animationClass);
                        targetEl.onanimationend = () => {
                            targetEl.classList.remove(animationClass);
                            targetEl.onanimationend = null;
                        };
                    }
                },

                loadUserProfile: (username) => {
                    app.utils.navigate(`/user/${encodeURIComponent(username)}`);
                },

                loadHome: async (forceRefresh = false) => {
                    const wasSearch = app.currentViewMode === 'search';
                    app.currentViewMode = 'home';
                    document.title = 'VNBUSARCHIVE';

                    if (app.loadedCount > 0 && !forceRefresh && !wasSearch) {
                        document.getElementById('hero-section').style.display = 'block';
                        document.getElementById('db-stats-section').style.display = 'block';
                        document.getElementById('grid-title').innerText = "Ảnh mới nhất đã được duyệt";
                        document.getElementById('search-input').value = "";
                        document.getElementById('btn-clear-search').classList.add('hidden');
                        document.getElementById('search-profile-cards').classList.add('hidden');
                        document.getElementById('load-more-cards-container')?.classList.add('hidden');

                        if (app.loadedCount >= 20) document.getElementById('load-more-container').classList.remove('hidden');

                        app.ui.unlockScroll();
                        app.loadingBar.finish();
                        return;
                    }

                    document.getElementById('hero-section').style.display = 'block';
                    document.getElementById('db-stats-section').style.display = 'block';
                    document.getElementById('grid-title').innerText = "Ảnh mới nhất đã được duyệt";
                    document.getElementById('search-input').value = "";
                    document.getElementById('btn-clear-search').classList.add('hidden');
                    document.getElementById('load-more-container').classList.add('hidden');
                    document.getElementById('search-profile-cards').classList.add('hidden');
                    document.getElementById('load-more-cards-container')?.classList.add('hidden');
                    app.search.setFilter('all', false);

                    app.loadedCount = 0;

                    let topQuery = window.sb
                        .from('photos')
                        .select(`*, profiles(id, username, role, subroles), vehicles(model)`)
                        .eq('status', 'approved')
                        .order('views', { ascending: false, nullsFirst: false })
                        .limit(5);

                    topQuery = app.preference.applyFilter(topQuery);
                    const { data: topPhotos } = await topQuery;

// BẮT LỖI RACE CONDITION
                    if (app.currentViewMode !== 'home') return;

                    const heroMain = document.getElementById('hero-main');
                    const heroSub = document.getElementById('hero-sub');

                    if (topPhotos && topPhotos.length > 0) {
                        app.topPhotosCache = topPhotos;
                        const main = topPhotos[0];
                        const safeMainPlate = app.utils.displayPlate(app.utils.cleanText(main.license_plate));
                        const safeMainUser = app.utils.cleanText(main.profiles?.username);
                        heroMain.innerHTML = `
                            <img src="${app.utils.getProxiedUrl(main.url, 'main.jpg', 'full')}" onerror="app.utils.fallbackHeroImage(this, 'topPhotosCache', 0)" class="w-full h-[400px] object-cover block hover:scale-105 transition-transform duration-700 relative z-0">
                            <div class="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-12 pointer-events-none z-10">
                                <p class="text-white font-bold text-lg tracking-tight flex items-center flex-wrap gap-y-1 hero-main-text pointer-events-auto">${safeMainPlate} - ${safeMainUser}</p>
                                <p class="text-gray-300 text-xs mt-1 hero-main-views pointer-events-auto"><i class="fa-solid fa-eye mr-1"></i> ${main.views || 0} lượt xem</p>
                            </div>
                        `;
                        heroMain.onclick = () => app.views.loadDetail(main.id);

                        heroSub.innerHTML = '';
                        for (let i = 1; i < topPhotos.length; i++) {
                            const p = topPhotos[i];
                            heroSub.innerHTML += `
                                <div class="relative group cursor-pointer h-[196px] rounded-md overflow-hidden" onclick="app.views.loadDetail(${p.id})">
                                    <img src="${app.utils.getProxiedUrl(p.url, 'sub.jpg', 'thumb')}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                                    <div class="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent pt-6 pb-2 px-2 text-white text-[10px] truncate">
                                        <i class="fa-solid fa-eye mr-1"></i> ${p.views || 0}
                                    </div>
                                </div>`;
                        }
                    } else {
                        heroMain.innerHTML = '<div class="w-full h-[400px] flex items-center justify-center text-gray-400">Chưa có dữ liệu nổi bật</div>';
                        heroSub.innerHTML = '';
                    }

                    const grid = document.getElementById('photo-grid');
                    let gridQuery = window.sb
                        .from('photos')
                        .select(`*, profiles(id, username, role, subroles), vehicles(model)`)
                        .eq('status', 'approved')
                        .order('created_at', { ascending: false })
                        .range(0, 19);

                    gridQuery = app.preference.applyFilter(gridQuery);
                    const { data: photos } = await gridQuery;

// BẮT LỖI RACE CONDITION
                    if (app.currentViewMode !== 'home') return;

                    if (!photos || photos.length === 0) {
                        grid.innerHTML = '<div class="col-span-full text-center py-10">Chưa có ảnh nào.</div>';
                        return;
                    }

                    app.loadedCount = photos.length;
                    if (photos.length === 20) document.getElementById('load-more-container').classList.remove('hidden');

                    grid.innerHTML = photos.map(p => app.views.renderPhotoCard(p)).join('');

                    try {
                        // 1. Đếm tổng số ảnh
                        let countQuery = window.sb.from('photos').select('*', { count: 'exact', head: true }).eq('status', 'approved');
                        countQuery = app.preference.applyFilter(countQuery);
                        const { count: photoCount } = await countQuery;

                        // 2. Đếm số Xe và Tuyến (Sử dụng vòng lặp để vượt qua giới hạn 1000 row)
                        const uniquePlates = new Set();
                        const uniqueRoutes = new Set();
                        let from = 0;
                        const step = 999;
                        let fetchMore = true;

                        // Gom chung việc lấy Biển số và Tuyến vào 1 truy vấn để tiết kiệm API Call
                        while (fetchMore) {
                            let statsQuery = window.sb.from('photos')
                                .select('license_plate, route_no')
                                .eq('status', 'approved') // Chỉ lấy ảnh đã được duyệt
                                .range(from, from + step);

                            // Áp dụng bộ lọc cá nhân hóa nếu user đang chọn xem riêng Xe Buýt hoặc Xe Khách
                            statsQuery = app.preference.applyFilter(statsQuery);

                            const { data, error } = await statsQuery;

                            if (error || !data || data.length === 0) break;

                            data.forEach(item => {
                                if (item.license_plate) {
                                    uniquePlates.add(item.license_plate.trim().toUpperCase());
                                }
                                if (item.route_no && item.route_no !== '---') {
                                    uniqueRoutes.add(item.route_no.trim().toLowerCase());
                                }
                            });

                            if (data.length <= step) {
                                fetchMore = false;
                            } else {
                                from += step + 1;
                            }
                        }

                        // 3. Render ra giao diện
                        document.getElementById('db-stat-photos').innerText = app.utils.formatCompact(photoCount || 0);
                        document.getElementById('db-stat-vehicles').innerText = app.utils.formatCompact(uniquePlates.size || 0);
                        document.getElementById('db-stat-routes').innerText = app.utils.formatCompact(uniqueRoutes.size || 0);
                        
                    } catch (e) {
                        console.error("Lỗi tải thông kê:", e);
                    }

                    app.newsboard.checkAndShow();
                    app.views.loadRecommendations();
                    app.loadingBar.finish();
                },

                loadRecommendations: async () => {
                    const recSection = document.getElementById('recommendation-section');
                    const recGrid = document.getElementById('rec-grid');

                    if (!app.preference.showRecommendations) {
                        return recSection.classList.add('hidden');
                    }

                    try {
                        let prefs = JSON.parse(localStorage.getItem('vnbus_prefs'));
                        const getTop = (obj) => Object.keys(obj).reduce((a, b) => obj[a] > obj[b] ? a : b, '');
                        const topRoute = prefs ? getTop(prefs.routes || {}) : null;
                        const topOp = prefs ? getTop(prefs.ops || {}) : null;
                        const topModel = prefs ? getTop(prefs.models || {}) : null;

                        if (!app.user && !topRoute && !topOp && !topModel) {
                            return recSection.classList.add('hidden');
                        }

                        recSection.classList.remove('hidden');
                        recGrid.innerHTML = '<div class="col-span-full text-center py-2 text-xs font-bold text-gray-700"><i class="fa-solid fa-spinner fa-spin"></i> Đang chọn lọc...</div>';

                        const params = new URLSearchParams();
                        if (topRoute) params.append('topRoute', topRoute);
                        if (topOp) params.append('topOp', topOp);
                        if (topModel) params.append('topModel', topModel);

                        const response = await fetch(`/api/recommendations?${params.toString()}`);
                        let matched = await response.json();

                        if (!matched || matched.length === 0) return recSection.classList.add('hidden');

                        recGrid.innerHTML = matched.map(p => `
                            <div class="relative group cursor-pointer aspect-square rounded-md overflow-hidden shadow-sm hover:shadow-lg transition-all border border-white/40" onclick="app.views.loadDetail(${p.id})">
                                <img loading="lazy" decoding="async" src="${app.utils.getProxiedUrl(p.url, 'rec.jpg', 'thumb')}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                                <div class="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-2 text-white">
                                    <div class="text-[10px] font-bold truncate tracking-wide">${app.utils.displayPlate(p.license_plate)}</div>
                                </div>
                            </div>
                        `).join('');

                    } catch (e) {
                        console.error("Recommend logic error:", e);
                        recSection.classList.add('hidden');
                    }
                },
                loadMoreSearchCards: (isInitial = false) => {
                    const container = document.getElementById('search-profile-cards');
                    const btnContainer = document.getElementById('load-more-cards-container');
                    if (!container || !btnContainer) return;

                    if (isInitial) {
                        app.loadedSearchCardsCount = 0;
                        container.innerHTML = '';
                    }

                    const start = app.loadedSearchCardsCount || 0;
                    const limit = isInitial ? 4 : 12;
                    const end = start + limit;

                    const cardsToRender = app.currentSearchCards.slice(start, end);

                    if (cardsToRender.length > 0) {
                        container.innerHTML += cardsToRender.join('');
                        container.classList.remove('hidden');

                        app.loadedSearchCardsCount = start + cardsToRender.length;

                        if (app.loadedSearchCardsCount >= app.currentSearchCards.length) {
                            btnContainer.classList.add('hidden');
                        } else {
                            btnContainer.classList.remove('hidden');
                        }
                    } else if (isInitial) {
                        container.classList.add('hidden');
                        btnContainer.classList.add('hidden');
                    }
                },

                loadMorePhotos: async () => {
                    const isSearch = app.currentViewMode === 'search';
                    const btnContainerId = isSearch ? 'search-load-more-container' : 'load-more-container';
                    const gridId = isSearch ? 'search-photo-grid' : 'photo-grid';

                    const btn = document.querySelector(`#${btnContainerId} button`);
                    const originalText = btn.innerHTML;
                    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang tải...';
                    btn.disabled = true;

                    const start = app.loadedCount;
                    const end = start + 11;
                    const grid = document.getElementById(gridId);

                    if (isSearch) {
                        const photos = app.currentSearchResults.slice(start, end + 1);
                        if (photos.length > 0) {
                            grid.innerHTML += photos.map(p => app.views.renderPhotoCard(p)).join('');
                            app.loadedCount += photos.length;
                            if (app.loadedCount >= app.currentSearchResults.length) {
                                document.getElementById('search-load-more-container').classList.add('hidden');
                            } else {
                                document.getElementById('search-load-more-container').classList.remove('hidden');
                            }
                        } else {
                            document.getElementById('search-load-more-container').classList.add('hidden');
                        }
                    } else {
                        let moreQuery = window.sb
                            .from('photos')
                            .select(`*, profiles(id, username, role, subroles), vehicles(model)`)
                            .eq('status', 'approved')
                            .order('created_at', { ascending: false })
                            .range(start, end);

                        moreQuery = app.preference.applyFilter(moreQuery);
                        const { data: photos } = await moreQuery;

                        if (photos && photos.length > 0) {
                            const existingIds = Array.from(grid.querySelectorAll('[data-id]')).map(el => el.getAttribute('data-id'));
                            const uniquePhotos = photos.filter(p => !existingIds.includes(String(p.id)));

                            if (uniquePhotos.length > 0) {
                                grid.innerHTML += uniquePhotos.map(p => app.views.renderPhotoCard(p)).join('');
                            }
                            app.loadedCount += photos.length;
                            if (photos.length < 12) document.getElementById('load-more-container').classList.add('hidden');
                        } else {
                            document.getElementById('load-more-container').classList.add('hidden');
                        }
                    }

                    btn.innerHTML = originalText;
                    btn.disabled = false;
                },

                renderPhotoCard: (p) => {
                    const safePlate = app.utils.displayPlate(app.utils.cleanText(p.license_plate));
                    const safeOp = app.utils.cleanText(p.operator || 'Đã bị xóa');
                    const safeUser = app.utils.cleanText(p.profiles?.username || 'Ẩn danh');

                    // Sử dụng mode 'thumb' để tối ưu kích thước ảnh preview
                    const proxyUrl = app.utils.getProxiedUrl(p.url, `${safePlate}.jpg`, 'thumb');

                    // Lấy Ngày chụp (taken_at) thay vì Ngày đăng
                    const dateStr = p.taken_at ? p.taken_at.split('T')[0].split('-').reverse().join('/') : new Date(p.created_at).toLocaleDateString('vi-VN');

                    return `
                        <div data-id="${p.id}" class="bg-white border border-gray-200 hover:border-gray-300 hover:shadow-lg cursor-pointer rounded-xl p-2 transition-all flex flex-col fade-zoom-in-page" onclick="app.views.loadDetail(${p.id})">
                            <div class="img-wrapper relative w-full aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-100">
                                <div class="img-spinner absolute inset-0 flex items-center justify-center text-gray-400">
                                    <i class="fa-solid fa-circle-notch fa-spin text-2xl"></i>
                                </div>
                                <img loading="lazy" src="${proxyUrl}"
                                     onload="app.utils.handleImgLoad(this)"
                                     onerror="app.utils.handleImgError(this)"
                                     alt="Xe buýt ${safePlate}"
                                     class="absolute inset-0 w-full h-full object-cover opacity-0 transition-all duration-500 hover:scale-105">
                                <div class="img-error absolute inset-0 hidden flex-col items-center justify-center p-4 text-center bg-red-50/50">
                                    <i class="fa-solid fa-image-slash text-red-400 text-2xl mb-1"></i>
                                    <span class="text-[10px] font-bold text-red-500 leading-tight">Ảnh hiện không thể<br>được tải</span>
                                </div>
                            </div>

                            <div class="pt-3 px-1.5 pb-1 flex-1 flex flex-col justify-between">
                                <div>
                                    <div class="font-bold text-sm text-black">${safePlate}</div>
                                    <div class="text-xs text-gray-600 font-semibold truncate">${safeOp}</div>
                                </div>
                                <div class="text-[10px] text-gray-400 mt-2 flex justify-between">
                                    <span class="truncate pr-2">${safeUser}</span>
                                    <span class="shrink-0"><i class="fa-regular fa-calendar mr-1"></i>${dateStr}</span>
                                </div>
                            </div>
                        </div>
                    `;
                },

                loadAccount: async (usernameStr = null, forceRefresh = false) => {
                    let targetUsername = usernameStr;
                    let isOwnProfile = false;

                    if (!targetUsername) {
                        if (!app.user) return app.utils.navigate('/auth');
                        targetUsername = app.username;
                        isOwnProfile = true;
                        if (window.location.pathname !== '/profile') return app.utils.navigate('/profile');
                    } else {
                        isOwnProfile = (app.user && app.username === targetUsername);
                        if (isOwnProfile && window.location.pathname !== '/profile') return app.utils.navigate('/profile');
                        if (!isOwnProfile && window.location.pathname !== `/user/${encodeURIComponent(targetUsername)}`) return app.utils.navigate(`/user/${encodeURIComponent(targetUsername)}`);
                    }

                    // KIỂM TRA QUAY LẠI CÙNG 1 PROFILE (Tránh load lại từ đầu làm giật trang)
                    const isReturningToSameProfile = (app.lastLoadedUsername === targetUsername) && !forceRefresh;
                    app._isOwnProfile = isOwnProfile;
                    app.lastLoadedUsername = targetUsername;

                    app.views.switch('account', false);
                    document.title = isOwnProfile ? 'Tài khoản của tôi | VNBUSARCHIVE' : `Hồ sơ: ${targetUsername} | VNBUSARCHIVE`;

                    // Nếu quay lại cùng 1 profile và đã có giao diện -> Bỏ qua phần gọi API tạo giao diện lại
                    if (isReturningToSameProfile && document.getElementById('acc-name').innerText !== '...') {
                        app.loadingBar.finish();
                        return;
                    }

                    // --- RESET UI TRỐNG ĐỂ CHỐNG NHÁY THÔNG TIN CŨ ---
                    document.getElementById('acc-name').innerText = '...';
                    document.getElementById('acc-avatar-img').classList.add('hidden');
                    document.getElementById('acc-avatar-icon').classList.remove('hidden');
                    document.getElementById('profile-bio-content').innerHTML = '<i class="fa-solid fa-spinner fa-spin text-gray-400"></i>';
                    document.getElementById('profile-fav-photo-container').innerHTML = '';
                    document.getElementById('my-stat-photos').innerHTML = '<i class="fa-solid fa-spinner fa-spin text-gray-400"></i>';
                    document.getElementById('my-stat-views').innerHTML = '<i class="fa-solid fa-spinner fa-spin text-gray-400"></i>';
                    document.getElementById('my-stat-likes').innerHTML = '<i class="fa-solid fa-spinner fa-spin text-gray-400"></i>';
                    document.getElementById('my-photos-grid').innerHTML = '<p class="text-xs text-gray-500 col-span-4 text-center py-10"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải dữ liệu...</p>';
                    document.getElementById('liked-photos-grid').innerHTML = '<p class="text-xs text-gray-500 col-span-4 text-center py-10"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải dữ liệu...</p>';
                    document.getElementById('approval-rate-island').classList.add('hidden');
                    // --------------------------------------------------

                    const { data: profile } = await window.sb.from('profiles').select('id, username, avatar_url, role, subroles, favorite_photo_id, created_at').eq('username', targetUsername).single();
                    if (window.location.pathname !== (isOwnProfile ? '/profile' : `/user/${encodeURIComponent(targetUsername)}`)) return;

                    if (!profile) {
                        app.ui.showAlert("Không tìm thấy người dùng này.");
                        return app.views.loadHome();
                    }

                    const targetUserId = profile.id;
                    app.currentProfileId = targetUserId;

                    if (Object.keys(app.topUploaders).length === 0) await app.utils.fetchTopUploaders();

                    const badges = app.utils.getBadgesHTML(profile.id, profile.role, profile.subroles);
                    document.getElementById('acc-name').innerHTML = `${profile.username} ${badges}`;

                    const avatarIcon = document.getElementById('acc-avatar-icon');
                    const avatarImg = document.getElementById('acc-avatar-img');
                    const safeAvatar = profile.avatar_url ? app.utils.getProxiedUrl(profile.avatar_url, 'avatar.jpg', 'avatar') : DEFAULT_AVATAR;

                    avatarImg.src = safeAvatar;
                    avatarImg.onerror = () => { avatarImg.src = DEFAULT_AVATAR; };
                    avatarImg.classList.remove('hidden');
                    avatarIcon.classList.add('hidden');

                    // --- RENDER GIAO DIỆN GIỚI THIỆU (BIO & FAV PHOTO) ---
                    const bioContent = document.getElementById('profile-bio-content');
                    const bioControls = document.getElementById('profile-bio-controls');
                    
                    // Lấy ngày tạo tài khoản, nếu không có thì để 'Không rõ'
                    const createDateStr = profile.created_at ? new Date(profile.created_at).toLocaleDateString('vi-VN') : 'Không rõ';
                    if (bioContent) {
                        bioContent.innerHTML = `<span class="text-gray-700 font-medium leading-relaxed">Tài khoản tạo vào ngày <b>${createDateStr}</b>.</span>`;
                    }
                    
                    // Luôn ẩn nút chỉnh sửa tiểu sử
                    if (bioControls) {
                        bioControls.classList.add('hidden');
                        bioControls.classList.remove('flex');
                    }

                    const favContainer = document.getElementById('profile-fav-photo-container');
                    const favControls = document.getElementById('profile-fav-photo-controls');
                    const btnAddFav = document.getElementById('btn-add-fav-photo');
                    const placeholderWrap = document.getElementById('fav-photo-placeholder'); // <-- Lấy đúng Wrapper

                    if (profile.favorite_photo_id) {
                        window.sb.from('photos').select('id, url').eq('id', profile.favorite_photo_id).single()
                        .then(({data: favPhoto}) => {
                            if (favPhoto) {
                                // Ẩn cái nền rác đi
                                placeholderWrap.classList.add('hidden');
                                placeholderWrap.classList.remove('flex');

                                favContainer.innerHTML = `
                                    <img src="${app.utils.getProxiedUrl(favPhoto.url, 'fav.jpg', 'thumb')}" class="absolute inset-0 w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-700 pointer-events-auto" onclick="app.views.loadDetail(${favPhoto.id})">
                                `;
                                if (isOwnProfile) {
                                    favControls.classList.remove('hidden');
                                    favControls.classList.add('flex');
                                    btnAddFav.classList.add('hidden');
                                    btnAddFav.classList.remove('flex');
                                } else {
                                    favControls.classList.add('hidden');
                                    btnAddFav.classList.add('hidden');
                                }
                            } else {
                                favContainer.innerHTML = '';
                                favControls.classList.add('hidden');
                                favControls.classList.remove('flex');
                                if (isOwnProfile) {
                                    btnAddFav.classList.remove('hidden');
                                    btnAddFav.classList.add('flex');
                                    placeholderWrap.classList.add('hidden');
                                    placeholderWrap.classList.remove('flex');
                                } else {
                                    placeholderWrap.classList.remove('hidden');
                                    placeholderWrap.classList.add('flex');
                                    btnAddFav.classList.add('hidden');
                                }
                            }
                        });
                    } else {
                        favContainer.innerHTML = '';
                        favControls.classList.add('hidden');
                        favControls.classList.remove('flex');
                        if (isOwnProfile) {
                            btnAddFav.classList.remove('hidden');
                            btnAddFav.classList.add('flex');
                            
                            // Nick chủ thì ẨN "Chưa có ảnh"
                            placeholderWrap.classList.add('hidden');
                            placeholderWrap.classList.remove('flex');
                        } else {
                            // Người xem thì HIỆN "Chưa có ảnh"
                            placeholderWrap.classList.remove('hidden');
                            placeholderWrap.classList.add('flex');
                            btnAddFav.classList.add('hidden');
                        }
                    }
                    // --- KẾT THÚC RENDER GIỚI THIỆU ---

                    const likedSection = document.getElementById('acc-liked-section');
                    const reportBtn = document.getElementById('btn-report-profile');
                    const manageCommentBtn = document.getElementById('btn-manage-comments'); // Lấy nút Quản lý BL

                    if (isOwnProfile) {
                        likedSection.classList.remove('hidden');
                        reportBtn.classList.add('hidden');
                        if (document.getElementById('btn-detailed-stats')) document.getElementById('btn-detailed-stats').classList.remove('hidden');
                        if (manageCommentBtn) manageCommentBtn.classList.remove('hidden'); // HIỆN NÚT
                        document.getElementById('profile-stats-title').innerText = "THỐNG KÊ HOẠT ĐỘNG";
                        document.getElementById('profile-photos-title').innerText = "Ảnh của bạn";
                    } else {
                        likedSection.classList.add('hidden');
                        reportBtn.classList.remove('hidden');
                        if (document.getElementById('btn-detailed-stats')) document.getElementById('btn-detailed-stats').classList.add('hidden');
                        if (manageCommentBtn) manageCommentBtn.classList.add('hidden'); // ẨN NÚT
                        document.getElementById('profile-stats-title').innerText = "THỐNG KÊ CỦA " + profile.username.toUpperCase();
                        document.getElementById('profile-photos-title').innerText = "Ảnh đã đăng";
                    }

                    // GỌI HÀM RPC ĐỂ LẤY THỐNG KÊ SIÊU TỐC
                    document.getElementById('my-stat-photos').innerHTML = '<i class="fa-solid fa-spinner fa-spin text-gray-400"></i>';
                    document.getElementById('my-stat-views').innerHTML = '<i class="fa-solid fa-spinner fa-spin text-gray-400"></i>';
                    document.getElementById('my-stat-likes').innerHTML = '<i class="fa-solid fa-spinner fa-spin text-gray-400"></i>';

                    const { data: stats, error: statsError } = await window.sb.rpc('get_user_profile_stats', { target_user_id: targetUserId, is_own_profile: isOwnProfile });

                    if (!statsError && stats && stats.length > 0) {
                        document.getElementById('my-stat-photos').innerText = app.utils.formatCompact(stats[0].total_photos);
                        document.getElementById('my-stat-views').innerText = app.utils.formatCompact(stats[0].total_views);
                        document.getElementById('my-stat-likes').innerText = app.utils.formatCompact(stats[0].total_likes);

                        const approvalIsland = document.getElementById('approval-rate-island');
                        if (isOwnProfile && stats[0].total_photos > 0) {
                            const { count: approvedCount, error: approvedError } = await window.sb.from('photos').select('*', { count: 'exact', head: true }).eq('uploader_id', targetUserId).eq('status', 'approved');
                            const { count: deniedCount, error: deniedError } = await window.sb.from('photos').select('*', { count: 'exact', head: true }).eq('uploader_id', targetUserId).eq('status', 'denied');

                            const processedCount = (approvedError || deniedError) ? 0 : ((approvedCount || 0) + (deniedCount || 0));
                            if (processedCount > 0) {
                                const rate = Math.round(((approvedCount || 0) / processedCount) * 100);
                                const rateValueEl = document.getElementById('approval-rate-value');
                                const gradientEl = document.getElementById('approval-gradient');

                                rateValueEl.innerText = `${rate}%`;
                                rateValueEl.classList.remove('text-green-600', 'text-red-600');
                                gradientEl.classList.remove('from-green-100', 'from-red-100');

                                if (rate >= 85) { rateValueEl.classList.add('text-green-600'); gradientEl.classList.add('from-green-100'); }
                                else { rateValueEl.classList.add('text-red-600'); gradientEl.classList.add('from-red-100'); }

                                approvalIsland.classList.remove('hidden');
                            } else {
                                approvalIsland.classList.add('hidden');
                            }
                        } else if (approvalIsland) {
                            approvalIsland.classList.add('hidden');
                        }
                    }

                    if (!isReturningToSameProfile) {
                        app.views.currentProfileSort = 'newest';
                        app.views.currentProfileFilter = 'all';
                        app.profilePage = 1;
                        app.likedPage = 1;
                    }

                    const filterContainer = document.getElementById('profile-photo-filters');
                    if (filterContainer) {
                        if (isOwnProfile) filterContainer.classList.remove('hidden');
                        else filterContainer.classList.add('hidden');
                    }

                    app.views.updateSortFilterUI();
                    await app.views.fetchProfilePhotosPage(app.profilePage || 1);

                    if (isOwnProfile) await app.views.fetchLikedPhotosPage(app.likedPage || 1);

                    app.lastLoadedUsername = targetUsername;

                    app.loadingBar.finish();
                },

                fetchProfilePhotosPage: async (page) => {
                    app.profilePage = page;
                    const size = app.PROFILE_PAGE_SIZE || 12;
                    const fromRow = (page - 1) * size;
                    const toRow = fromRow + size - 1;
                    const grid = document.getElementById('my-photos-grid');

                    // TẠO KHÓA CACHE DUY NHẤT
                    const cacheKey = `${app.currentProfileId}_${app.views.currentProfileFilter}_${app.views.currentProfileSort}_${page}`;

                    // NẾU TRANG NÀY ĐÃ TẢI TRƯỚC ĐÓ -> LẤY TỪ CACHE RA XÀI NGAY LẬP TỨC
                    if (app.views._profileCache[cacheKey]) {
                        const { photos, count } = app.views._profileCache[cacheKey];
                        app.views.renderProfileGridHTML(photos, count, page);
                        return;
                    }

                    if (grid.children.length === 0) {
                        grid.innerHTML = '<p class="text-xs text-gray-500 col-span-4 text-center py-10"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải dữ liệu...</p>';
                    } else {
                        grid.style.opacity = '0.5';
                        grid.style.pointerEvents = 'none';
                    }

                    let query = window.sb.from('photos').select('id, url, status, views, license_plate', { count: 'exact' }).eq('uploader_id', app.currentProfileId);

                    if (!app._isOwnProfile) query = query.eq('status', 'approved');
                    else if (app.views.currentProfileFilter !== 'all') query = query.eq('status', app.views.currentProfileFilter);

                    query = app.preference.applyFilter(query);

                    if (app.views.currentProfileSort === 'newest') query = query.order('id', { ascending: false });
                    else if (app.views.currentProfileSort === 'popular') query = query.order('views', { ascending: false, nullsFirst: false });

                    const { data: photos, count, error } = await query.range(fromRow, toRow);

                    if (error || !photos || photos.length === 0) {
                        grid.style.opacity = '1';
                        grid.style.pointerEvents = 'auto';
                        grid.innerHTML = '<p class="text-xs text-gray-500 col-span-4 text-center py-4">Chưa có ảnh nào.</p>';
                        const pagerEl = document.getElementById('profile-pager');
                        if (pagerEl) pagerEl.innerHTML = '';
                        return;
                    }

                    // LƯU VÀO CACHE TRƯỚC KHI RENDER
                    app.views._profileCache[cacheKey] = { photos, count };
                    app.views.renderProfileGridHTML(photos, count, page);
                },

                // Hàm hỗ trợ render (để tránh lặp code)
                renderProfileGridHTML: (photos, count, page) => {
                    const grid = document.getElementById('my-photos-grid');
                    grid.style.opacity = '1';
                    grid.style.pointerEvents = 'auto';
                    grid.innerHTML = photos.map(p => {
                        let cardStyleClasses = "profile-photo-item cursor-pointer group transition-all duration-300 relative";
                        let textHtml = `<span class="block truncate">${app.utils.cleanText(app.utils.displayPlate(p.license_plate))}</span>`;

                        if (app._isOwnProfile) {
                            if (p.status === 'approved') {
                                cardStyleClasses += " !border-2 !border-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] hover:shadow-[0_0_14px_rgba(34,197,94,0.8)] hover:z-10";
                                textHtml = `<span class="block truncate font-bold drop-shadow-md">${app.utils.cleanText(app.utils.displayPlate(p.license_plate))}</span>`;
                            } else if (p.status === 'pending') {
                                cardStyleClasses += " !border-2 !border-[#f58e27] shadow-[0_0_8px_rgba(245,142,39,0.5)] hover:shadow-[0_0_14px_rgba(245,142,39,0.8)] hover:z-10";
                                textHtml = `<span class="block truncate group-hover:hidden">${app.utils.cleanText(app.utils.displayPlate(p.license_plate))}</span><span class="hidden truncate group-hover:block font-bold drop-shadow-md tracking-wide">Đang chờ duyệt...</span>`;
                            } else if (p.status === 'denied') {
                                cardStyleClasses += " !border-2 !border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] hover:shadow-[0_0_14px_rgba(239,68,68,0.8)] hover:z-10";
                                textHtml = `<span class="block truncate group-hover:hidden">${app.utils.cleanText(app.utils.displayPlate(p.license_plate))}</span><span class="hidden truncate group-hover:block font-bold drop-shadow-md tracking-wide">Đã bị từ chối</span>`;
                            }
                        }

                        return `
                            <div class="${cardStyleClasses}" onclick="app.views.loadDetail('${p.id}')">
                                <img loading="lazy" decoding="async" src="${app.utils.getProxiedUrl(p.url, 'profile.jpg', 'thumb')}" class="w-full h-full object-cover">
                                <div class="absolute bottom-0 left-0 bg-black/70 text-white text-[10px] w-full p-1.5 backdrop-blur-sm transition-all duration-300">
                                    ${textHtml}
                                </div>
                            </div>
                        `;
                    }).join('');

                    const size = app.PROFILE_PAGE_SIZE || 12;
                    const totalPages = Math.ceil(count / size);
                    let pagerEl = document.getElementById('profile-pager');
                    if (!pagerEl) {
                        pagerEl = document.createElement('div');
                        pagerEl.id = 'profile-pager';
                        grid.parentNode.insertBefore(pagerEl, grid.nextSibling);
                    }

                    if (totalPages <= 1) { pagerEl.innerHTML = ''; return; }
                    pagerEl.innerHTML = `<div id="profile-pagination-container" class="mt-4 w-full"></div><p class="text-center text-[10px] text-gray-400 mt-3">Trang ${page}/${totalPages} · Tổng ${count} ảnh</p>`;
                    app.utils.renderPagination('profile-pagination-container', page, totalPages, (newPage) => app.views.fetchProfilePhotosPage(newPage));
                },
                fetchLikedPhotosPage: async (page) => {
                    app.likedPage = page;
                    const size = app.PROFILE_PAGE_SIZE || 12;
                    const fromRow = (page - 1) * size;
                    const toRow = fromRow + size - 1;
                    const grid = document.getElementById('liked-photos-grid');

                    // CACHE LIKED PHOTOS
                    const cacheKey = `liked_${app.currentProfileId}_${page}`;
                    if (app.views._likedCache[cacheKey]) {
                        const { likedData, count } = app.views._likedCache[cacheKey];
                        app.views.renderLikedGridHTML(likedData, count, page);
                        return;
                    }

                    if (grid.children.length === 0) {
                        grid.innerHTML = '<p class="text-xs text-gray-500 col-span-4 text-center py-10"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải ảnh đã thích...</p>';
                    } else {
                        grid.style.opacity = '0.5';
                        grid.style.pointerEvents = 'none';
                    }

                    let query = window.sb.from('photo_likes').select('photo_id, photos!inner(id, url, license_plate, operator, type)', { count: 'exact' }).eq('user_id', app.user.id).order('created_at', { ascending: false });
                    if (app.preference.current !== 'both') query = query.eq('photos.type', app.preference.current);

                    const { data: likedData, count, error } = await query.range(fromRow, toRow);

                    if (error || !likedData || likedData.length === 0) {
                        grid.style.opacity = '1';
                        grid.style.pointerEvents = 'auto';
                        grid.innerHTML = '<p class="text-xs text-gray-500 col-span-4 text-center py-4">Bạn chưa thích ảnh nào.</p>';
                        const pagerEl = document.getElementById('liked-pager');
                        if (pagerEl) pagerEl.innerHTML = '';
                        return;
                    }

                    // LƯU CACHE VÀ RENDER
                    app.views._likedCache[cacheKey] = { likedData, count };
                    app.views.renderLikedGridHTML(likedData, count, page);
                },

                renderLikedGridHTML: (likedData, count, page) => {
                    const grid = document.getElementById('liked-photos-grid');
                    grid.style.opacity = '1';
                    grid.style.pointerEvents = 'auto';
                    grid.innerHTML = likedData.map(item => {
                        const p = item.photos;
                        return `
                        <div class="profile-photo-item cursor-pointer hover:shadow-md transition-shadow" onclick="app.views.loadDetail(${p.id})">
                            <img loading="lazy" decoding="async" src="${app.utils.getProxiedUrl(p.url, 'liked.jpg', 'thumb')}" class="w-full h-full object-cover">
                            <div class="absolute bottom-0 left-0 bg-black/60 text-white text-[10px] w-full p-1.5 truncate backdrop-blur-sm">
                                ${app.utils.displayPlate(p.license_plate)} - ${p.operator || 'N/A'}
                            </div>
                        </div>`
                    }).join('');

                    const size = app.PROFILE_PAGE_SIZE || 12;
                    const totalPages = Math.ceil(count / size);
                    let pagerEl = document.getElementById('liked-pager');
                    if (!pagerEl) {
                        pagerEl = document.createElement('div');
                        pagerEl.id = 'liked-pager';
                        grid.parentNode.insertBefore(pagerEl, grid.nextSibling);
                    }
                    if (totalPages <= 1) { pagerEl.innerHTML = ''; return; }
                    pagerEl.innerHTML = `<div id="liked-pagination-container" class="mt-4 w-full"></div><p class="text-center text-[10px] text-gray-400 mt-3">Trang ${page}/${totalPages} · Tổng ${count} ảnh</p>`;
                    app.utils.renderPagination('liked-pagination-container', page, totalPages, (newPage) => app.views.fetchLikedPhotosPage(newPage));
                },

                loadDetail: async (photoId, forceRefresh = false) => {
                    if (window.location.pathname !== `/photo/${photoId}`) {
                        app.utils.navigate(`/photo/${photoId}`);
                        return;
                    }

                    // --- KIỂM TRA BỘ NHỚ TẠM: NẾU VÀO LẠI ĐÚNG ẢNH ĐÓ THÌ MỞ LUÔN, KHÔNG TẢI LẠI ---
                    if (app.currentPhoto && String(app.currentPhoto.id) === String(photoId) && !forceRefresh) {
                        app.views.switch('detail', false);
                        app.loadingBar.finish();
                        return;
                    }

                    // --- RESET UI AN TOÀN TRƯỚC KHI TẢI DATA ---
                    document.getElementById('detail-title').innerText = 'Đang tải dữ liệu...';
                    document.getElementById('crumb-model').innerText = '...';
                    
                    const imgEl = document.getElementById('detail-img');
                    if (imgEl) {
                        imgEl.style.opacity = '0';
                        const wrapper = imgEl.closest('.img-wrapper');
                        if (wrapper) {
                            const errorBox = wrapper.querySelector('.img-error');
                            const spinner = wrapper.querySelector('.img-spinner');
                            if (errorBox) errorBox.classList.add('hidden');
                            if (spinner) spinner.style.display = 'flex';
                        }
                    }
                    
                    const statUploader = document.getElementById('stat-uploader');
                    if (statUploader) statUploader.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-gray-400"></i>';
                    
                    const statDate = document.getElementById('stat-date');
                    if (statDate) statDate.innerText = '...';
                    
                    const statViews = document.getElementById('stat-views');
                    if (statViews) statViews.innerText = '0';
                    
                    const statLikes = document.getElementById('stat-likes');
                    if (statLikes) statLikes.innerText = '0';
                    
                    ['info-plate', 'info-operator', 'info-route', 'info-model', 'info-location', 'info-note', 'info-camera', 'info-exif-params'].forEach(id => {
                        const el = document.getElementById(id);
                        if (el) el.value = '';
                    });
                    
                    const historyList = document.getElementById('history-list');
                    if (historyList) historyList.innerHTML = '<tr><td colspan="4" class="text-center py-2"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải...</td></tr>';
                    
                    const commentList = document.getElementById('comment-list');
                    if (commentList) commentList.innerHTML = '<p class="text-center text-gray-400 py-10"><i class="fa-solid fa-circle-notch fa-spin"></i> Đang tải...</p>';
                    
                    const detailRecGrid = document.getElementById('detail-rec-grid');
                    if (detailRecGrid) detailRecGrid.innerHTML = '';
                    
                    const fbCommentsWrapper = document.getElementById('fb-comments-wrapper');
                    if (fbCommentsWrapper) fbCommentsWrapper.innerHTML = '';
                    // -------------------------------------------------------------------

                    const { data: photo } = await window.sb
                        .from('photos')
                        .select(`*, profiles(id, username, avatar_url, role, subroles), vehicles(model)`)
                        .eq('id', photoId)
                        .single();

                    // BẮT LỖI RACE CONDITION
                    if (window.location.pathname !== `/photo/${photoId}`) return;

                    if (!photo) {
                        app.ui.showAlert("Ảnh không tồn tại hoặc đã bị xóa khỏi hệ thống.");
                        return app.views.loadHome();
                    }

                    app.currentPhoto = photo;
                    app.currentPlate = photo.license_plate;
                    const v = photo.vehicles;

                    const snapshot = {
                        operator: photo.operator,
                        type: photo.type || 'bus',
                        route_no: photo.route_no,
                        model: v?.model
                    };
                    app.currentVehicle = { ...v, ...snapshot };

                    if (snapshot) {
                        try {
                            let prefs = JSON.parse(localStorage.getItem('vnbus_prefs') || '{"routes":{}, "ops":{}, "models":{}}');
                            if (snapshot.route_no && snapshot.route_no !== '---') prefs.routes[snapshot.route_no] = (prefs.routes[snapshot.route_no] || 0) + 1;
                            if (snapshot.operator && snapshot.operator !== '---') prefs.ops[snapshot.operator] = (prefs.ops[snapshot.operator] || 0) + 1;
                            if (snapshot.model && snapshot.model !== '---') prefs.models[snapshot.model] = (prefs.models[snapshot.model] || 0) + 1;
                            localStorage.setItem('vnbus_prefs', JSON.stringify(prefs));
                        } catch (e) { }
                    }

                    const isDenied = photo.status === 'denied';
                    const isPending = photo.status === 'pending';

                    if (isPending) {
                        if (!app.user || app.user.id !== photo.uploader_id) {
                            app.ui.showAlert("Bạn không có quyền xem ảnh đang chờ duyệt này.");
                            return app.views.loadHome();
                        }
                    }

                    if (isDenied) {
                        if (!app.user || (app.user.id !== photo.uploader_id && app.role !== 'manager')) {
                            app.ui.showAlert("Bạn không có quyền xem ảnh bị từ chối này.");
                            return app.views.loadHome();
                        }
                        document.getElementById('denial-reason-box').classList.remove('hidden');
                        document.getElementById('denial-reason-text').innerText = photo.denial_reason || 'Không rõ lý do';
                    } else {
                        document.getElementById('denial-reason-box').classList.add('hidden');
                    }

                    if (isPending) {
                        document.getElementById('pending-status-box').classList.remove('hidden');
                        const queueBox = document.getElementById('pending-queue-box');
                        if (queueBox) {
                            queueBox.classList.remove('hidden');
                            document.getElementById('pending-queue-count').innerText = '...';

                            window.sb.from('photos').select('id, created_at, profiles(role)').eq('status', 'pending')
                                .then(({ data, error }) => {
                                    if (!error && data) {
                                        let ahead = 0;
                                        const myRole = photo.profiles?.role || 'user';
                                        const isMePrivileged = (myRole === 'admin' || myRole === 'manager');
                                        const myTime = new Date(photo.created_at).getTime();

                                        data.forEach(p => {
                                            if (p.id === photo.id) return;
                                            const pRole = p.profiles?.role || 'user';
                                            const pPrivileged = (pRole === 'admin' || pRole === 'manager');
                                            const pTime = new Date(p.created_at).getTime();

                                            if (isMePrivileged) {
                                                if (pPrivileged && pTime < myTime) ahead++;
                                            } else {
                                                if (pPrivileged) ahead++;
                                                else if (pTime < myTime) ahead++;
                                            }
                                        });
                                        document.getElementById('pending-queue-count').innerText = ahead;
                                    } else {
                                        document.getElementById('pending-queue-count').innerText = '?';
                                    }
                                });
                        }
                    } else {
                        document.getElementById('pending-status-box').classList.add('hidden');
                        const queueBox = document.getElementById('pending-queue-box');
                        if (queueBox) queueBox.classList.add('hidden');
                    }

                    const isMyOwnPhoto = app.user && app.user.id === photo.uploader_id;
                    const isValidViewer = app.user && !isMyOwnPhoto;
                    
                    const views = isDenied ? 0 : (isValidViewer ? ((photo.views || 0) + 1) : (photo.views || 0));

                    if (!isDenied && isValidViewer) {
                        await window.sb.from('photos').update({ views: views }).eq('id', photoId);
                    }
                    document.getElementById('detail-title').innerText = `${app.utils.displayPlate(photo.license_plate)} - ${snapshot.operator || 'Đã bị xóa'}`;

                    const pageTitle = `${app.utils.displayPlate(photo.license_plate)} - ${snapshot.operator || 'Đã bị xóa'} | VNBUSARCHIVE`;
                    const pageDesc = `Ảnh chụp chi tiết xe buýt/xe khách ${app.utils.displayPlate(photo.license_plate)} thuộc đơn vị ${snapshot.operator}, dòng xe ${snapshot.model}.`;
                    const pageImg = app.utils.getProxiedUrl(photo.url);
                    if (window.location.pathname === `/photo/${photoId}`) {
                        app.utils.updateMetaTags(pageTitle, pageDesc, pageImg);
                    }
                    document.getElementById('crumb-model').innerText = app.utils.displayPlate(photo.license_plate);


                    const proxyUrl = app.utils.getProxiedUrl(photo.url, `${app.utils.displayPlate(photo.license_plate)}.jpg`);

                    imgEl.style.display = 'block';
                    imgEl.style.opacity = '0';
                    const wrapper2 = imgEl.closest('.img-wrapper');
                    if(wrapper2) {
                        const errBox2 = wrapper2.querySelector('.img-error');
                        const spinner2 = wrapper2.querySelector('.img-spinner');
                        if (errBox2) errBox2.classList.add('hidden');
                        if (spinner2) spinner2.style.display = 'flex';
                    }

                    imgEl.onload = () => app.utils.handleImgLoad(imgEl);
                    imgEl.onerror = () => app.utils.handleImgError(imgEl);

                    imgEl.src = proxyUrl;
                    imgEl.alt = `Hình ảnh xe buýt ${app.utils.displayPlate(photo.license_plate)} - ${snapshot.operator || 'Đã bị xóa'}`;
                    imgEl.title = "Nhấn vào ảnh để phóng to toàn màn hình";
                    imgEl.style.cursor = 'zoom-in';

                    imgEl.onclick = () => {
                        app.admin.openZoom(proxyUrl, true);
                    };

                    const safeUploaderName = app.utils.cleanText(photo.profiles?.username || 'Ẩn danh');
                    document.getElementById('detail-copyright').innerHTML = `Bản quyền &copy; <strong>${safeUploaderName}</strong>`;

                    app.edit.cancel();

                    const elInfoPlate = document.getElementById('info-plate');
                    const elInfoOperator = document.getElementById('info-operator');
                    const elInfoRoute = document.getElementById('info-route');
                    const elInfoModel = document.getElementById('info-model');
                    const elInfoType = document.getElementById('info-type');
                    const elInfoLocation = document.getElementById('info-location');
                    const elInfoNote = document.getElementById('info-note');
                    const elInfoDate = document.getElementById('info-date');
                    const elInfoCamera = document.getElementById('info-camera');
                    const elInfoExif = document.getElementById('info-exif-params');

                    if (elInfoPlate) elInfoPlate.value = photo.license_plate;
                    if (elInfoOperator) elInfoOperator.value = snapshot.operator || 'Đã bị xóa';
                    if (elInfoType) elInfoType.value = snapshot.type || 'bus';
                    if (elInfoRoute) elInfoRoute.value = snapshot.route_no || 'Đã bị xóa';
                    const lblDetailRoute = document.getElementById('lbl-detail-route');
                    if (lblDetailRoute) lblDetailRoute.innerText = snapshot.type === 'coach' ? 'Lộ trình' : 'Mã số tuyến';
                    if (elInfoModel) elInfoModel.value = snapshot.model || 'Đã bị xóa';
                    if (elInfoLocation) elInfoLocation.value = photo.location || '---';
                    if (elInfoNote) elInfoNote.value = photo.note || '---';

                    const displayDate = photo.taken_at || photo.created_at;
                    if (elInfoDate) elInfoDate.value = displayDate ? displayDate.split('T')[0] : '';
                    if (elInfoCamera) elInfoCamera.value = photo.camera_model || 'N/A';
                    if (elInfoExif) elInfoExif.value = photo.exif_params || 'N/A';

                    const statUploaderEl = document.getElementById('stat-uploader');

                    if (Object.keys(app.topUploaders).length === 0) {
                        await app.utils.fetchTopUploaders();
                    }

                    const badges = app.utils.getBadgesHTML(photo.profiles?.id, photo.profiles?.role, photo.profiles?.subroles);
                    const safeAvatar = photo.profiles?.avatar_url ? app.utils.getProxiedUrl(photo.profiles.avatar_url.replace(/"/g, '&quot;'), 'avatar.jpg', 'avatar') : DEFAULT_AVATAR;

                    if (photo.profiles?.avatar_url) {
                        statUploaderEl.innerHTML = `<img loading="lazy" decoding="async" src="${safeAvatar}" onerror="this.onerror=null;this.src='${DEFAULT_AVATAR}';" class="w-5 h-5 rounded-full inline-block mr-1 object-cover align-middle"> ${safeUploaderName} ${badges}`;
                    } else {
                        statUploaderEl.innerHTML = `<img loading="lazy" decoding="async" src="${DEFAULT_AVATAR}" class="w-5 h-5 rounded-full inline-block mr-1 object-cover align-middle"> ${safeUploaderName} ${badges}`;
                    }
                    statUploaderEl.onclick = () => app.views.loadUserProfile(photo.profiles?.username);

                    document.getElementById('stat-date').innerText = new Date(photo.created_at).toLocaleDateString('vi-VN');
                    document.getElementById('stat-views').innerText = views;

                    let realLikeCount = 0;
                    const { count } = await window.sb.from('photo_likes').select('*', { count: 'exact', head: true }).eq('photo_id', photoId);
                    realLikeCount = isDenied ? 0 : (count || 0);

                    document.getElementById('stat-likes').innerText = realLikeCount;

                    let isLikedByMe = false;
                    if (app.user) {
                        const { data: likeData } = await window.sb.from('photo_likes').select('user_id').eq('photo_id', photoId).eq('user_id', app.user.id).maybeSingle();
                        if (likeData) isLikedByMe = true;
                    }

                    const likeBtn = document.getElementById('btn-like');
                    const deleteBtn = document.getElementById('btn-request-delete');

                    if (isLikedByMe || isDenied) {
                        likeBtn.classList.replace('bg-black', 'bg-gray-400');
                        likeBtn.innerHTML = isDenied ? 'Ảnh đã bị từ chối' : '<i class="fa-solid fa-check"></i> Đã thích';
                        likeBtn.disabled = isDenied;
                    } else {
                        likeBtn.classList.replace('bg-gray-400', 'bg-black');
                        likeBtn.innerHTML = '<i class="fa-regular fa-thumbs-up"></i> Thích ảnh này';
                        likeBtn.disabled = false;
                    }

                    const reapproveBtn = document.getElementById('btn-manager-reapprove');
                    deleteBtn.onclick = null;
                    deleteBtn.classList.add('hidden');
                    if (reapproveBtn) {
                        reapproveBtn.onclick = null;
                        reapproveBtn.classList.add('hidden');
                    }

                    if (app.user && app.user.id === photo.uploader_id) {
                        deleteBtn.classList.remove('hidden');
                        if (isPending || isDenied) {
                            deleteBtn.innerHTML = `<i class="fa-solid fa-trash-can mr-1"></i> Xóa ảnh ${isDenied ? '(Bị từ chối)' : '(Đang chờ duyệt)'}`;
                            deleteBtn.className = "w-full border border-gray-500 text-gray-600 py-2.5 text-sm font-bold rounded-md hover:bg-gray-50 transition shadow-sm";
                        } else {
                            deleteBtn.innerHTML = '<i class="fa-solid fa-trash-can mr-1"></i> Yêu cầu xóa ảnh';
                            deleteBtn.className = "w-full border border-red-500 text-red-600 py-2.5 text-sm font-bold rounded-md hover:bg-red-50 transition shadow-sm";
                        }
                        deleteBtn.onclick = () => app.photo.requestDelete();
                    }
                    else if (app.user && app.role === 'manager' && !isDenied) {
                        deleteBtn.classList.remove('hidden');
                        deleteBtn.innerHTML = '<i class="fa-solid fa-radiation mr-1"></i> Manager: Xóa ảnh này';
                        deleteBtn.className = "w-full bg-red-600 border border-red-600 text-white py-2.5 text-sm font-bold rounded-md hover:bg-red-700 transition shadow-sm";
                        deleteBtn.onclick = () => {
                            app.ui.showDenyPrompt("ADMIN - Xóa ảnh này", async (reason) => {
                                try {
                                    await window.sb.from('photos').update({ status: 'denied', denial_reason: reason }).eq('id', photo.id);
                                    app.admin.logAction('admin_delete_from_detail', photo.id, { plate: photo.license_plate, reason: reason });
                                    app.toast.show('success', 'Đã xóa ảnh', 'Ảnh đã được xóa khỏi hệ thống thành công.');
                                    app.views.loadHome();
                                } catch (e) { app.ui.showAlert("Lỗi: " + e.message); }
                            });
                        };
                    }

                    if (app.user && app.role === 'manager' && isDenied) {
                        if (reapproveBtn) {
                            reapproveBtn.classList.remove('hidden');
                            reapproveBtn.onclick = () => {
                                app.ui.showPrompt("Nhập ghi chú cho việc duyệt lại (Tùy chọn):", "", async (reason) => {
                                    try {
                                        const originalText = reapproveBtn.innerHTML;
                                        reapproveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Đang xử lý...';
                                        reapproveBtn.disabled = true;

                                        const { error } = await window.sb.from('photos').update({ status: 'approved', denial_reason: null }).eq('id', photo.id);
                                        if (error) throw error;
                                        app.admin.logAction('manager_reapprove', photo.id, { plate: photo.license_plate, reason: reason });

                                        app.toast.show('success', 'Đã duyệt lại', 'Ảnh này đã được cấp phép hiển thị trở lại trên hệ thống.');
                                        app.views.loadDetail(photo.id);
                                    } catch (e) {
                                        app.ui.showAlert("Lỗi: " + e.message);
                                        reapproveBtn.innerHTML = '<i class="fa-solid fa-rotate-left mr-1"></i> Manager: Duyệt lại ảnh này';
                                        reapproveBtn.disabled = false;
                                    }
                                });
                            };
                        }
                    }

                    const historyPlate = v?.license_plate || photo.license_plate;
                    
                    // --- CHỐT CHẶN CUỐI CÙNG TRÁNH LỖI KÉO NGƯỢC GIAO DIỆN ---
                    // Nếu URL hiện tại không còn là ảnh này nữa (do user đã bấm back/thoát ra), 
                    // Dừng ngay lập tức, không load Lịch sử, Bản đồ hay Bình luận Facebook nữa.
                    if (window.location.pathname !== `/photo/${photoId}`) return;
                    
                    app.views.loadHistory(historyPlate);

                    // ĐÃ XÓA LỆNH app.views.switch('detail', false); TẠI ĐÂY ĐỂ TRÁNH LỖI JUMP UI

                    if (photo.location && photo.location !== '---') {
                        app.utils.showDetailMap(photo.location);
                    } else {
                        document.getElementById('detail-map').style.display = 'none';
                    }

                    app.views.loadDetailRecommendations(photo, snapshot);
                    app.comments.init(photoId);

                    const fbSection = document.getElementById('fb-comments-section');
                    // fbCommentsWrapper đã được khai báo ở đầu hàm
                    
                    if (fbCommentsWrapper) {
                        if (photo.status === 'approved') {
                            if (fbSection) fbSection.classList.remove('hidden');
                            const currentUrl = window.location.origin + '/photo/' + photoId;
                            fbCommentsWrapper.innerHTML = '<div class="fb-comments" data-href="' + currentUrl + '" data-width="100%" data-numposts="5"></div>';
                            
                            const tryRenderFB = () => {
                                if (window.FB) window.FB.XFBML.parse(fbCommentsWrapper);
                                else setTimeout(tryRenderFB, 300);
                            };
                            tryRenderFB();
                        } else {
                            if (fbSection) fbSection.classList.add('hidden');
                            fbCommentsWrapper.innerHTML = '';
                        }
                    }

                    app.loadingBar.finish();
                },

                loadDetailRecommendations: async (photo, snapshot) => {
                    const recSection = document.getElementById('detail-recommendation-section');
                    const recGrid = document.getElementById('detail-rec-grid');
                    if (!recSection || !recGrid) return;

                    if (!app.preference.showRecommendations) {
                        return recSection.classList.add('hidden');
                    }

                    recSection.classList.add('hidden');
                    recGrid.innerHTML = '<div class="col-span-full text-center py-4 text-gray-500"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải gợi ý...</div>';
                    recSection.classList.remove('hidden');

                    try {
                        const params = new URLSearchParams({
                            photoId: photo.id,
                            uploaderId: photo.uploader_id
                        });
                        
                        if (snapshot.operator && snapshot.operator !== '---') params.append('operator', snapshot.operator);
                        if (snapshot.route_no && snapshot.route_no !== '---') params.append('routeNo', snapshot.route_no);
                        if (snapshot.model && snapshot.model !== '---') params.append('model', snapshot.model);

                        const response = await fetch(`/api/recommendations?${params.toString()}`);
                        const finalPhotos = await response.json();

                        if (app.currentPhoto && app.currentPhoto.id !== photo.id) return;
                        if (window.location.pathname !== `/photo/${photo.id}`) return;

                        if (!finalPhotos || finalPhotos.length === 0) {
                            return recSection.classList.add('hidden');
                        }

                        recGrid.innerHTML = finalPhotos.map(p => {
                            const uploaderName = p.profiles?.username || 'Ẩn danh';
                            const role = p.profiles?.role || 'user';
                            const badgeStr = app.utils.getRoleBadge(role, p.profiles?.subroles);

                            let extraInfo = '';
                            if (p.route_no && p.route_no !== '---') extraInfo = `<span class="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-bold">${p.route_no}</span>`;
                            else if (p.operator && p.operator !== '---') extraInfo = `<span class="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] font-bold">${p.operator}</span>`;
                            
                            return `
                            <div class="relative group cursor-pointer aspect-[4/3] rounded-md overflow-hidden shadow-sm hover:shadow-lg transition-all border border-gray-200" onclick="app.views.loadDetail(${p.id})">
                                <img loading="lazy" decoding="async" src="${app.utils.getProxiedUrl(p.url, 'det_rec.jpg', 'thumb')}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                                <div class="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 text-white flex flex-col justify-end">
                                    <div class="flex items-center justify-between">
                                        <div class="text-xs font-bold truncate tracking-wide">${app.utils.displayPlate(p.license_plate)}</div>
                                        ${extraInfo}
                                    </div>
                                    <div class="text-[10px] text-gray-300 truncate mt-0.5 flex items-center gap-1">
                                        <i class="fa-solid fa-user text-[8px]"></i> ${uploaderName} ${badgeStr}
                                    </div>
                                </div>
                            </div>
                            `;
                        }).join('');

                    } catch (e) {
                        console.error("Lỗi khi tải gợi ý chi tiết:", e);
                        recSection.classList.add('hidden');
                    }
                },
                loadHistory: async (plate) => {
                    const editUi = document.getElementById('history-edit-ui');
                    if(editUi) editUi.classList.add('hidden');
                    
                    const tbody = document.getElementById('history-list');
                    if(tbody) tbody.innerHTML = '<tr><td colspan="4" class="text-center py-2"><i class="fa-solid fa-spinner fa-spin text-gray-400"></i> Đang tải...</td></tr>';

                    const { data: history } = await window.sb
                        .from('vehicle_history')
                        .select('*')
                        .eq('license_plate', plate);

                    // --- CHỐT CHẶN ĐÃ SỬA LỖI: KIỂM TRA BẰNG BIẾN THAY VÌ URL ---
                    if (app.currentPlate !== plate) return;
                    if (!window.location.pathname.startsWith('/photo/') && !window.location.pathname.startsWith('/vehicle/')) return;
                    // -------------------------------------------------------------

                    let parsedHistory = (history || []).map(h => {
                        if (!h.effective_date && h.note) {
                            const dateMatch = h.note.match(/Từ ngày:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);
                            if (dateMatch) {
                                const parts = dateMatch[1].split('/');
                                h.effective_date = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                                h.note = h.note.replace(dateMatch[0], '').trim();
                            }
                        }
                        return h;
                    }).sort((a, b) => new Date(a.effective_date || '1970-01-01') - new Date(b.effective_date || '1970-01-01'));

                    app.vehicle.currentHistoryData = parsedHistory;
                    
                    if(!tbody) return; // Chặn lỗi nếu thẻ HTML đã bị hủy
                    tbody.innerHTML = '';

                    if (parsedHistory.length > 0) {
                        parsedHistory.forEach(h => {
                            let displayPlate = h.license_plate;
                            let displayNote = h.note || '';

                            const match = displayNote.match(/BKS cũ:\s*([A-Z0-9.-]+)/i);
                            if (match) {
                                displayPlate = match[1];
                                displayNote = displayNote.replace(match[0], '').trim();
                            }
                            displayNote = displayNote.replace(/^[-,]\s*/, '').trim();

                            const safePlate = app.utils.cleanText(displayPlate);
                            const safeOp = app.utils.cleanText(h.operator);
                            const safeRoute = app.utils.cleanText(h.route || '-');
                            const safeNote = app.utils.cleanText(displayNote);

                            tbody.innerHTML += `
                                <tr>
                                    <td class="font-bold">${safePlate}</td>
                                    <td>${safeOp}</td>
                                    <td>${safeRoute}</td>
                                    <td class="text-xs text-gray-500">${safeNote}</td>
                                </tr>
                            `;
                        });
                    } else {
                        tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-gray-500">Chưa có lịch sử hoạt động.</td></tr>';
                    }
                    if (document.getElementById('hist-new-plate')) document.getElementById('hist-new-plate').value = plate;
                },

                loadContact: () => {
                    if (window.location.pathname !== '/contact') {
                        app.utils.navigate('/contact');
                        return;
                    }
                    document.title = 'Liên hệ hỗ trợ | VNBUSARCHIVE';
                    app.views.switch('contact', false);
                    app.loadingBar.finish();
                },

                loadVehiclePage: async (plate, forceRefresh = false) => {
                    const decodedPath = decodeURIComponent(window.location.pathname);
                    if (decodedPath !== `/vehicle/${encodeURIComponent(plate)}`) {
                        app.utils.navigate(`/vehicle/${encodeURIComponent(plate)}`);
                        return;
                    }

                    // --- SỬA LỖI TRẮNG TRANG: TÁCH RIÊNG BIẾN CACHE CỦA XE ---
                    // Không dùng chung app.currentPlate với trang ảnh nữa, mà dùng app.vehicle._renderedPlate
                    if (app.vehicle._renderedPlate === plate && document.getElementById('vehicle').innerHTML.includes('history-table') && !forceRefresh) {
                        app.loadingBar.finish();
                        return;
                    }

                    app.vehicle._renderedPlate = null; // Đặt lại trạng thái
                    const container = document.getElementById('vehicle');
                    container.innerHTML = '<div class="text-center py-20"><i class="fa-solid fa-circle-notch fa-spin text-2xl text-gray-400"></i></div>';

                    try {

                        let pQuery = window.sb.from('photos').select(`*, profiles(id, username, role, subroles), vehicles(model)`)
                                .eq('license_plate', plate)
                                .eq('status', 'approved')
                                .order('taken_at', { ascending: false, nullsFirst: false })
                                .order('created_at', { ascending: false });

                        pQuery = app.preference.applyFilter(pQuery);

                        const [vehicleRes, allPhotosRes, historyRes] = await Promise.all([
                            window.sb.from('vehicles').select('*').eq('license_plate', plate).single(),
                            pQuery,
                            window.sb.from('vehicle_history').select('*').eq('license_plate', plate).order('display_order', { ascending: true })
                        ]);

// BẮT LỖI RACE CONDITION
                    if (window.location.pathname !== `/vehicle/${encodeURIComponent(plate)}`) return;

                        const vehicle = vehicleRes.data;
                        if (!vehicle) {
                            app.ui.showAlert("Không tìm thấy thông tin cho xe này.", () => app.views.loadHome());
                            return;
                        }

                        const allPhotos = allPhotosRes.data || [];
                        
                        // YÊU CẦU XE PHẢI CÓ ÍT NHẤT 1 ẢNH ĐƯỢC DUYỆT MỚI CHO XEM HỒ SƠ
                        if (allPhotos.length === 0) {
                            app.ui.showAlert("Hồ sơ ẩn: Xe này chưa có ảnh nào được duyệt trên hệ thống.", () => app.views.loadHome());
                            return;
                        }

                        const pageTitle = `Hồ sơ xe ${vehicle.license_plate} | VNBUSARCHIVE`;
                        app.vehiclePhotosCache = allPhotos;
                        // Lấy ảnh ở đầu danh sách (mới chụp nhất theo taken_at)
                        const topPhoto = allPhotos.length > 0 ? allPhotos[0] : null;
                        const isCoach = topPhoto && topPhoto.type === 'coach';


                        const specialRoutes = ['Dừng hoạt động', 'Ngoài giờ hoạt động', 'Chưa hoạt động'];
                        let currentRouteClientSide = '';
                        let currentOpClientSide = '';

                        if (allPhotos.length > 0) {
                            const latestPhoto = allPhotos[0];
                            currentOpClientSide = latestPhoto.operator || '';
                            const r = (latestPhoto.route_no || '').trim();
                            if (r && !specialRoutes.includes(r)) {
                                currentRouteClientSide = r;
                            } else if (r === 'Ngoài giờ hoạt động') {
                                const validPhotos = allPhotos.filter(p => p.route_no && !specialRoutes.includes(p.route_no));
                                if (validPhotos.length > 0) {
                                    const latestValid = validPhotos[0];
                                    currentRouteClientSide = (latestValid.route_no || '').trim();
                                    currentOpClientSide = latestValid.operator || '';
                                }
                            } else if (r === 'Dừng hoạt động' || r === 'Chưa hoạt động') {
                                currentRouteClientSide = r;
                            }
                        }

                        const pageDesc = `Lịch sử hoạt động và thư viện ảnh của xe ${vehicle.license_plate}${currentOpClientSide ? ' - ' + currentOpClientSide : ''}`;
                        app.utils.updateMetaTags(pageTitle, pageDesc, topPhoto ? app.utils.getProxiedUrl(topPhoto.url) : 'https://files.catbox.moe/ddvw49.png');


                        let rawHistory = historyRes.data || [];

                        let vehPrefix = '';
                        const vehProvName = app.utils.getProvinceFromPlate(vehicle.license_plate);
                        if (vehProvName && app.utils.provinceData && app.utils.provinceData.length) {
                            const pData = app.utils.provinceData.find(p => p.ten === vehProvName);
                            if (pData && pData.ky_hieu) {
                                vehPrefix = Array.isArray(pData.ky_hieu) ? String(pData.ky_hieu[0]).trim() : String(pData.ky_hieu).split(',')[0].trim();
                            }
                        }

                        let historyData = rawHistory.map(h => {
                            if (!h.effective_date && h.note) {
                                const dateMatch = h.note.match(/Từ ngày:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);
                                if (dateMatch) {
                                    const parts = dateMatch[1].split('/');
                                    h.effective_date = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                                    h.note = h.note.replace(dateMatch[0], '').trim();
                                }
                            }
                            return h;
                        }).sort((a, b) => new Date(a.effective_date || '1970-01-01') - new Date(b.effective_date || '1970-01-01'));

                        app.currentPlate = vehicle.license_plate;
                        app.vehicle.currentHistoryData = historyData;

                        let historyHTML = '<div class="p-3 text-xs text-gray-500">Chưa có lịch sử hoạt động.</div>';
                        if (historyData.length > 0) {
                            historyHTML = `
                                <div class="history-table-wrapper">
                                    <table class="history-table" style="margin-bottom: 0 !important;">
                                        <thead><tr>
                                            <th class="border-r border-gray-200">Đơn vị</th>
                                            <th class="border-r border-gray-200">${isCoach ? 'Lộ trình' : 'Mã số tuyến'}</th>
                                            <th>Ghi chú</th>
                                        </tr></thead>
                                        <tbody>
                                            ${historyData.map(h => {
                                                let displayNote = h.note || '';
                                                const oldBksMatch = displayNote.match(/BKS cũ:\s*([A-Z0-9.-]+)/i);
                                                let bksHtml = '';
                                                if (oldBksMatch) {
                                                    bksHtml = `<br><span class="text-[10px] bg-gray-100 px-1 rounded border">BKS cũ: ${oldBksMatch[1]}</span>`;
                                                    displayNote = displayNote.replace(oldBksMatch[0], '').trim();
                                                }
                                                displayNote = displayNote.replace(/^[-,]\s*/, '').trim();

                                                return `
                                                <tr>
                                                    <td class="font-bold border-r border-gray-200">${h.operator}${bksHtml}</td>
                                                    <td class="font-bold border-r border-gray-200">${h.route || '-'}</td>
                                                    <td class="text-xs text-gray-500">${displayNote}</td>
                                                </tr>`;
                                            }).join('')}
                                        </tbody>
                                    </table>
                                </div>`;
                        }

                        const editHistoryUI = `
                            <div id="veh-history-edit-ui" class="hidden mt-3 bg-amber-50 p-3 border border-amber-200 rounded-lg">
                                <div class="flex justify-between items-center mb-3">
                                    <h4 class="font-bold text-sm text-amber-900">Sửa trực tiếp danh sách</h4>
                                    <span class="text-[10px] font-bold text-amber-700 bg-amber-200 px-2 py-1 rounded">Tự động sắp xếp</span>
                                </div>
                                <div id="veh-sortable-history" class="space-y-2 mb-4"></div>

                                <h4 class="font-bold text-xs text-amber-900 mt-4 mb-2 border-t border-amber-200 pt-3">Thêm mốc lịch sử mới</h4>
                                <div class="flex flex-wrap sm:flex-nowrap gap-2">
                                    <input type="date" id="veh-hist-new-date" class="border border-amber-200 p-2 sm:p-1.5 text-xs w-full sm:w-[18%] rounded bg-white text-gray-700 outline-none focus:ring-1 focus:ring-amber-500 transition" title="Ngày áp dụng">
                                    <input type="text" id="veh-hist-new-op" placeholder="Đơn vị vận hành" class="border border-amber-200 p-2 sm:p-1.5 text-xs w-[48%] sm:w-[25%] rounded bg-white outline-none focus:ring-1 focus:ring-amber-500 transition" oninput="app.utils.formatNoPunctuation(this)">
                                    <input type="text" id="veh-hist-new-route" placeholder="Mã số tuyến" class="border border-amber-200 p-2 sm:p-1.5 text-xs w-[48%] sm:w-[15%] rounded bg-white outline-none focus:ring-1 focus:ring-amber-500 transition">
                                    <input type="text" id="veh-hist-new-note" placeholder="Ghi chú (BKS cũ...)" class="border border-amber-200 p-2 sm:p-1.5 text-xs w-full sm:flex-1 rounded bg-white outline-none focus:ring-1 focus:ring-amber-500 transition">
                                    <button onclick="app.vehicle.addHistoryItem('veh-')" class="bg-green-600 text-white p-2 text-xs rounded font-bold hover:bg-green-700 transition w-full sm:w-auto shadow-sm">Thêm Mới</button>
                                </div>
                                <div class="mt-3 pt-3 border-t border-amber-200 flex justify-end gap-3">
                                    <button onclick="app.vehicle.toggleEditHistory('veh-')" class="text-xs text-gray-500 hover:text-black font-medium">Hủy bỏ</button>
                                    <button onclick="app.vehicle.saveHistory()" class="bg-black text-white px-4 py-2 text-xs font-bold rounded-md hover:bg-gray-800 transition shadow-sm">Lưu dữ liệu / Gửi yêu cầu</button>
                                </div>
                            </div>
                        `;

                        let photosHTML = '<p class="text-xs text-gray-500">Chưa có ảnh nào cho xe này.</p>';
                        if (allPhotos.length > 0) {
                            photosHTML = `<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">${allPhotos.map(p => app.views.renderPhotoCard(p)).join('')}</div>`;
                        }

                        const html = `
                            <div class="flex flex-col lg:flex-row gap-6">
                                <div class="w-full lg:w-1/3 space-y-6">
                                    ${topPhoto ? `<div class="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden relative group cursor-pointer" onclick="app.views.loadDetail(${topPhoto.id})"><img src="${app.utils.getProxiedUrl(topPhoto.url, 'vehicle-top.jpg', 'thumb')}" onerror="app.utils.fallbackHeroImage(this, 'vehiclePhotosCache', 0)" class="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500 relative z-0"></div>` : '<div class="aspect-[4/3] bg-gray-100 flex items-center justify-center text-gray-400 rounded-xl border border-gray-200">Chưa có ảnh</div>'}

                                     <div class="bg-white border border-gray-200 shadow-sm rounded-xl p-2.5 pt-3.5 pb-2.5 md:p-3 md:pt-4 md:pb-3 overflow-hidden">
                                        <h3 class="font-black text-lg sm:text-xl uppercase text-black tracking-widest mb-3 px-1">${app.utils.displayPlate(vehicle.license_plate)}</h3>
                                        
                                        <div class="border border-gray-200 rounded-lg overflow-hidden bg-white mb-3">
                                            <table class="info-table border-gray-200 w-full" style="margin-bottom: 0 !important;">
                                                <tr>
                                                    <td class="label bg-gray-50 border-r border-b border-gray-200" style="width: 40%">Đơn vị vận hành</td>
                                                    <td class="value-cell border-b border-gray-200">
                                                        <input type="text" id="vehicle-edit-operator" value="${currentOpClientSide}" class="info-input text-gray-700 ${currentOpClientSide ? 'clickable-search' : 'cursor-not-allowed'}" readonly ${currentOpClientSide ? `onclick="if(this.readOnly && this.value && this.value!=='---') app.utils.navigate('/operator/' + encodeURIComponent(this.value))"` : ''}>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td class="label bg-gray-50 border-r border-b border-gray-200">${isCoach ? 'Lộ trình' : 'Mã số tuyến'} hiện tại</td>
                                                    <td class="value-cell border-b border-gray-200">
                                                        <div class="relative w-full h-full">
                                                            <input type="text" id="vehicle-edit-route" value="${currentRouteClientSide}" autocomplete="off" class="info-input text-gray-700 w-full ${currentRouteClientSide ? 'clickable-search' : 'cursor-not-allowed'}" readonly ${currentRouteClientSide ? `onclick="if(this.readOnly && this.value && this.value!=='---') app.searchRedirect(this.value, 'route', '${vehPrefix}')"` : ''} onfocus="if(!this.readOnly) app.utils.triggerRouteSuggestion('vehicle-edit-route', 'veh-sug-route', '')" oninput="app.utils.triggerRouteSuggestion('vehicle-edit-route', 'veh-sug-route', this.value)">
                                                            <div id="veh-sug-route" class="suggestion-box"></div>
                                                        </div>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td class="label bg-gray-50 border-r border-b border-gray-200">Dòng xe</td>
                                                    <td class="value-cell border-b border-gray-200">
                                                        <div class="relative w-full h-full">
                                                            <input type="text" id="vehicle-edit-model" value="${app.utils.escapeAttr(vehicle.model || '')}" autocomplete="off" class="info-input text-gray-700 w-full ${vehicle.model ? 'clickable-search' : 'cursor-not-allowed'}" readonly ${vehicle.model ? `onclick="if(this.readOnly && this.value && this.value!=='---') app.utils.navigate('/model/' + encodeURIComponent(this.value))"` : ''} oninput="app.utils.triggerSuggestion('vehicle-edit-model', 'veh-sug-model', this.value, 'model')">
                                                            <div id="veh-sug-model" class="suggestion-box"></div>
                                                        </div>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td class="label bg-gray-50 border-r border-b border-gray-200">Đăng ký tại</td>
                                                    <td class="value-cell border-b border-gray-200">
                                                        <input type="text" value="${app.utils.getProvinceFromPlate(vehicle.license_plate)}" class="info-input text-gray-700 cursor-not-allowed" readonly>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td class="label bg-gray-50 border-r border-gray-200">Ghi chú chung xe</td>
                                                    <td class="value-cell">
                                                        <textarea id="vehicle-edit-note" rows="3" class="info-input text-gray-700 w-full resize-y min-h-[40px] block cursor-not-allowed" readonly>${app.utils.escapeAttr(vehicle.note || '')}</textarea>
                                                    </td>
                                                </tr>
                                            </table>
                                        </div>

                                        <div id="veh-edit-trigger-container" class="mt-3 pt-3 border-t border-gray-100">
                                            <button id="btn-vehicle-edit" onclick="app.vehicle.toggleVehiclePageEdit('${plate}')" class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 text-sm font-bold rounded-md hover:bg-gray-50 transition shadow-sm flex justify-center items-center gap-1.5">
                                                <i class="fa-solid fa-pen-to-square"></i> <span id="btn-veh-edit-label">Sửa thông tin xe</span>
                                            </button>
                                        </div>

                                        <div id="vehicle-edit-actions" class="hidden mt-3 pt-3 border-t border-gray-100 justify-end gap-3">
                                            <button onclick="app.vehicle.toggleVehiclePageEdit('${plate}')" class="text-xs text-gray-500 hover:text-black font-medium">Hủy bỏ</button>
                                            <button id="btn-vehicle-save" onclick="app.vehicle.saveVehiclePageChanges('${plate}')" class="bg-black text-white text-xs font-bold px-4 py-2 rounded-md hover:bg-gray-800 transition shadow-sm">Gửi yêu cầu</button>
                                        </div>
                                    </div>
                                </div>

                                <div class="w-full lg:w-2/3 space-y-6">
                                    <div class="bg-white relative border border-gray-200 shadow-sm rounded-xl p-2.5 pt-3.5 pb-2.5 md:p-3 md:pt-4 md:pb-3 overflow-hidden">
                                        <h3 class="font-bold text-xs uppercase text-black tracking-wider mb-2.5 px-1">Lịch sử hoạt động</h3>
                                        
                                        <div class="border border-gray-200 rounded-lg overflow-hidden bg-white">
                                            ${historyHTML}
                                        </div>

                                        <div class="mt-3 pt-3 border-t border-gray-100">
                                            <button onclick="app.vehicle.toggleEditHistory('veh-')"
                                                class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 text-sm font-bold rounded-md hover:bg-gray-50 transition shadow-sm flex justify-center items-center gap-1.5">
                                                <i class="fa-solid fa-clock-rotate-left"></i> Cập nhật lịch sử
                                            </button>
                                        </div>
                                        ${editHistoryUI}
                                    </div>

                                    <div>
                                        <h3 class="font-bold text-lg mb-3 tracking-tight text-black uppercase">Thư viện ảnh (${allPhotos.length})</h3>
                                        ${photosHTML}
                                    </div>
                                </div>
                            </div>
                        `;
                        container.innerHTML = html;
                        app.vehicle._renderedPlate = plate; // ĐÁNH DẤU XE NÀY ĐÃ RENDER THÀNH CÔNG
                        app.loadingBar.finish();

                    } catch (err) {
                        console.error("Lỗi khi tải trang xe:", err);
                        container.innerHTML = `<p class="text-center text-red-500 p-10">Đã xảy ra lỗi: ${err.message}</p>`;
                        app.loadingBar.finish();
                    }
                },

                // --- BẮT ĐẦU LOGIC PROFILE ĐƠN VỊ VẬN HÀNH ---
                currentOperator: '',
                operatorLoadedCount: 0,
                operatorPhotos: [],

                loadOperatorPage: async (operatorName, forceRefresh = false) => {
                    const decodedPath = decodeURIComponent(window.location.pathname);
                    if (decodedPath !== `/operator/${operatorName}`) {
                        app.utils.navigate(`/operator/${encodeURIComponent(operatorName)}`);
                        return;
                    }

                    // --- KIỂM TRA BỘ NHỚ TẠM ---
                    if (app.currentOperator === operatorName && app.operatorPhotos && app.operatorPhotos.length > 0 && !forceRefresh) {
                        app.views.switch('operator-view', false);
                        app.loadingBar.finish();
                        return;
                    }

                    app.views.switch('operator-view', false);
                    document.title = `${operatorName} | VNBUSARCHIVE`;
                    app.currentOperator = operatorName;
                    app.operatorLoadedCount = 0;

                    // --- RESET UI TRỐNG ĐỂ CHỐNG NHÁY THÔNG TIN CŨ ---
                    document.getElementById('crumb-operator').innerText = operatorName;
                    document.getElementById('operator-title').innerText = operatorName;
                    document.getElementById('operator-logo').classList.add('hidden');
                    document.getElementById('operator-logo-fallback').classList.remove('hidden');
                    document.getElementById('operator-desc').classList.add('hidden');
                    document.getElementById('op-stat-photos').innerText = '...';
                    document.getElementById('op-stat-vehicles').innerText = '...';
                    document.getElementById('op-stat-routes').innerText = '...';
                    document.getElementById('op-stat-views').innerText = '...';
                    document.getElementById('op-stats-tabs-wrapper').classList.add('hidden');
                    
                    const grid = document.getElementById('operator-photo-grid');
                    grid.innerHTML = '<div class="col-span-full text-center py-10 text-gray-500"><i class="fa-solid fa-circle-notch fa-spin"></i> Đang tổng hợp dữ liệu...</div>';
                    document.getElementById('operator-load-more-container').classList.add('hidden');
                    // --------------------------------------------------

                    try {
                        // Gọi DB Lấy thông tin Operator (Logo, Mô tả)
                        const { data: opInfo } = await window.sb.from('operator_info').select('*').eq('operator_name', operatorName).maybeSingle();
                        
                        const logoEl = document.getElementById('operator-logo');
                        const fallbackEl = document.getElementById('operator-logo-fallback');
                        const descEl = document.getElementById('operator-desc');

                        if (opInfo && opInfo.logo_url) {
                            logoEl.src = opInfo.logo_url;
                            logoEl.classList.remove('hidden');
                            fallbackEl.classList.add('hidden');
                        } else {
                            logoEl.classList.add('hidden');
                            fallbackEl.classList.remove('hidden');
                        }

                        if (opInfo && opInfo.description) {
                            descEl.innerHTML = app.utils.cleanText(opInfo.description).replace(/\n/g, '<br>');
                            descEl.classList.remove('hidden');
                        } else {
                            descEl.classList.add('hidden');
                        }

                        // =========================================================
                        // LOGIC THÔNG MINH: VÒNG LẶP LẤY THỐNG KÊ (VƯỢT GIỚI HẠN 1000 DÒNG)
                        // Chỉ tải text (BKS, Tuyến, Dòng xe), tuyệt đối không tải URL ảnh để tiết kiệm RAM
                        // =========================================================
                        let allStatsData = [];
                        let from = 0;
                        const step = 999;
                        let fetchMore = true;

                        while (fetchMore) {
                            const { data, error } = await window.sb.from('photos')
                                .select('views, license_plate, route_no, vehicles(model)')
                                .eq('status', 'approved')
                                .ilike('operator', operatorName)
                                .order('taken_at', { ascending: false, nullsFirst: false }) // Ép ảnh mới nhất lên đầu
                                .range(from, from + step);

                            if (error || !data || data.length === 0) break;

                            allStatsData.push(...data);

                            if (data.length <= step) {
                                fetchMore = false;
                            } else {
                                from += step + 1;
                            }
                        }

                        if (allStatsData.length === 0) {
                            grid.innerHTML = '<div class="col-span-full text-center py-10 text-gray-500">Chưa có ảnh nào của đơn vị này được duyệt trên hệ thống.</div>';
                            document.getElementById('op-stat-photos').innerText = '0';
                            document.getElementById('op-stat-vehicles').innerText = '0';
                            document.getElementById('op-stat-routes').innerText = '0';
                            document.getElementById('op-stat-views').innerText = '0';
                            document.getElementById('op-stats-tabs-wrapper').classList.add('hidden');
                            app.loadingBar.finish();
                            return;
                        }

                        // 1. TÍNH TOÁN 4 Ô THỐNG KÊ TRÊN CÙNG
                        let totalViews = 0;
                        let uniquePlates = new Set();
                        let uniqueRoutes = new Set();

                        allStatsData.forEach(p => {
                            totalViews += (p.views || 0);
                            if (p.license_plate) uniquePlates.add(p.license_plate.toUpperCase());
                            if (p.route_no && p.route_no !== '---') uniqueRoutes.add(p.route_no.toLowerCase());
                        });

                        document.getElementById('op-stat-photos').innerText = app.utils.formatCompact(allStatsData.length);
                        document.getElementById('op-stat-vehicles').innerText = app.utils.formatCompact(uniquePlates.size);
                        document.getElementById('op-stat-routes').innerText = app.utils.formatCompact(uniqueRoutes.size);
                        document.getElementById('op-stat-views').innerText = app.utils.formatCompact(totalViews);

                        // 2. TÍNH TOÁN BẢNG CƠ CẤU DÒNG XE TỪ LỊCH SỬ HOẠT ĐỘNG (VEHICLE_HISTORY)
                        const absoluteLatestStatus = new Map();
                        const uniquePlatesArr = Array.from(uniquePlates);

                        for (let i = 0; i < uniquePlatesArr.length; i += 150) {
                            const chunk = uniquePlatesArr.slice(i, i + 150);
                            const { data } = await window.sb.from('vehicle_history')
                                .select('license_plate, operator, route, vehicles(model)')
                                .in('license_plate', chunk)
                                .order('effective_date', { ascending: false, nullsFirst: false })
                                .order('display_order', { ascending: false });

                            if (data) {
                                data.forEach(h => {
                                    const pl = h.license_plate.toUpperCase();
                                    if (!absoluteLatestStatus.has(pl)) {
                                        absoluteLatestStatus.set(pl, h);
                                    }
                                });
                            }
                        }

                        const modelStats = {};
                        let totalActive = 0;
                        let totalInactive = 0;

                        absoluteLatestStatus.forEach((h) => {
                            const currentOp = h.operator || '';
                            const route = (h.route || '').trim();
                            const model = h.vehicles?.model || 'Chưa cập nhật';
                            let isInactive = false;

                            if (currentOp.toLowerCase() !== operatorName.toLowerCase()) isInactive = true;
                            else if (route === 'Dừng hoạt động') isInactive = true;

                            if (!modelStats[model]) modelStats[model] = { active: 0, inactive: 0, total: 0 };
                            if (!isInactive) { modelStats[model].active++; totalActive++; } 
                            else { modelStats[model].inactive++; totalInactive++; }
                            modelStats[model].total++;
                        });

                        const sortedModels = Object.entries(modelStats)
                            .map(([name, stats]) => ({ name, ...stats }))
                            .sort((a, b) => b.total - a.total);

                        app.operator.modelStatsData = sortedModels;
                        app.operator.modelStatsTotals = { active: totalActive, inactive: totalInactive, all: totalActive + totalInactive };
                        app.operator.isModelTableExpanded = false;

                        // 3. TÍNH TOÁN CƠ CẤU TUYẾN CHUYẾN (THÔNG MINH DỰA TRÊN XE ACTIVE VÀ CLEAN ROUTE)
                        const specialRoutes = ['Dừng hoạt động', 'Ngoài giờ hoạt động', 'Chưa hoạt động', 'Hợp đồng', 'Xe hợp đồng / Đưa đón'];
                        
                        // Tìm clean route_no gần nhất cho mỗi xe (dựa trên ảnh duyệt)
                        const latestCleanRouteMap = new Map();
                        const sortedPhotos = [...allStatsData].sort((a,b) => new Date(b.taken_at || b.created_at || 0) - new Date(a.taken_at || a.created_at || 0));
                        sortedPhotos.forEach(p => {
                            if (p.license_plate && p.route_no && p.route_no !== '---') {
                                const pl = p.license_plate.toUpperCase();
                                if (!latestCleanRouteMap.has(pl)) {
                                    latestCleanRouteMap.set(pl, p.route_no.trim());
                                }
                            }
                        });

                        let activeRoutesMap = new Map();
                        const operatorProvinces = new Set();

                        absoluteLatestStatus.forEach((h) => {
                            const currentOp = h.operator || '';
                            const routeRaw = (h.route || '').trim();
                            const model = h.vehicles?.model || 'Chưa xác định';
                            const pl = h.license_plate.toUpperCase();

                            let isInactive = false;
                            if (currentOp.toLowerCase() !== operatorName.toLowerCase()) isInactive = true;
                            else if (routeRaw === 'Dừng hoạt động') isInactive = true;

                            if (!isInactive) {
                                const cleanRoute = latestCleanRouteMap.get(pl);
                                if (cleanRoute && cleanRoute !== '---' && !specialRoutes.includes(cleanRoute)) {
                                    
                                    const extractedProv = app.utils.getProvinceFromPlate(pl);
                                    let prov = '';
                                    if (extractedProv && extractedProv !== 'Không xác định' && extractedProv !== 'Biển tạm') {
                                        prov = extractedProv;
                                    }

                                    const routeKey = cleanRoute.toLowerCase() + '|' + prov;
                                    if (!activeRoutesMap.has(routeKey)) {
                                        activeRoutesMap.set(routeKey, { route: cleanRoute, prov: prov, count: 0, models: {} });
                                    }
                                    const rData = activeRoutesMap.get(routeKey);
                                    rData.count++;
                                    rData.models[model] = (rData.models[model] || 0) + 1;

                                    if (prov) operatorProvinces.add(prov);
                                }
                            }
                        });

                        const operatesInMultipleProvinces = operatorProvinces.size > 1;

                        let activeRoutes = [];
                        activeRoutesMap.forEach(rData => {
                            let maxModel = 'Chưa xác định';
                            let maxCount = 0;
                            for (let m in rData.models) {
                                if (rData.models[m] > maxCount) {
                                    maxCount = rData.models[m];
                                    maxModel = m;
                                }
                            }
                            
                            let displayName = rData.route;
                            let prefix = '';
                            if (operatesInMultipleProvinces && rData.prov) {
                                displayName = `${rData.route} (${rData.prov})`;
                            }
                            
                            try {
                                if (rData.prov && app.utils.provinceData && app.utils.provinceData.length) {
                                    const provData = app.utils.provinceData.find(p => p.ten === rData.prov);
                                    if (provData && provData.ky_hieu) {
                                        prefix = Array.isArray(provData.ky_hieu) ? String(provData.ky_hieu[0]).trim() : String(provData.ky_hieu).split(',')[0].trim();
                                    }
                                }
                            } catch (e) { }

                            activeRoutes.push({ route: rData.route, displayName: displayName, prefix: prefix, vehicleCount: rData.count, mainModel: maxModel });
                        });
                        
                        // Sắp xếp Tuyến theo số lượng xe giảm dần, nếu bằng thì theo mã số tuyến
                        activeRoutes.sort((a, b) => {
                            if (b.vehicleCount !== a.vehicleCount) {
                                return b.vehicleCount - a.vehicleCount;
                            }
                            return a.route.localeCompare(b.route, undefined, {numeric: true});
                        });
                        
                        app.operator.routeStatsData = activeRoutes;
                        app.operator.isRouteTableExpanded = false;

                        // TỔNG HỢP VÀ MỞ TABS
                        if (sortedModels.length > 0 || activeRoutes.length > 0) {
                            document.getElementById('op-stats-tabs-wrapper').classList.remove('hidden');
                            app.operator.renderModelTable();
                            app.operator.renderRouteTable();
                        } else {
                            document.getElementById('op-stats-tabs-wrapper').classList.add('hidden');
                        }

                        // LOAD ẢNH...
                        let pQuery = window.sb.from('photos').select(`*, profiles(id, username, role, subroles), vehicles(model)`)
                            .eq('status', 'approved')
                            .ilike('operator', operatorName)
                            .order('taken_at', { ascending: false, nullsFirst: false })
                            .order('created_at', { ascending: false });
                        
                        pQuery = app.preference.applyFilter(pQuery);

                        const { data: photos, error } = await pQuery;
                        if (error) throw error;

                        app.operatorPhotos = photos || [];
                        grid.innerHTML = '';
                        app.views.loadMoreOperatorPhotos();

                    } catch (err) {
                        grid.innerHTML = `<div class="col-span-full text-center py-10 text-red-500">Lỗi lấy dữ liệu: ${err.message}</div>`;
                    }
                    app.loadingBar.finish();
                },

                loadMoreOperatorPhotos: () => {
                    const start = app.operatorLoadedCount;
                    const limit = 12; // Load mỗi lần 12 ảnh
                    const end = start + limit;
                    const grid = document.getElementById('operator-photo-grid');
                    
                    const photosToRender = app.operatorPhotos.slice(start, end);
                    if (photosToRender.length > 0) {
                        grid.innerHTML += photosToRender.map(p => app.views.renderPhotoCard(p)).join('');
                        app.operatorLoadedCount += photosToRender.length;
                    }

                    if (app.operatorLoadedCount >= app.operatorPhotos.length) {
                        document.getElementById('operator-load-more-container').classList.add('hidden');
                    } else {
                        document.getElementById('operator-load-more-container').classList.remove('hidden');
                    }
                },

                loadMoreModelPhotos: () => {
                    const start = app.model.modelLoadedCount;
                    const limit = 12;
                    const end = start + limit;
                    const grid = document.getElementById('model-photo-grid');
                    
                    const photosToRender = app.model.modelPhotos.slice(start, end);
                    if (photosToRender.length > 0) {
                        grid.innerHTML += photosToRender.map(p => app.views.renderPhotoCard(p)).join('');
                        app.model.modelLoadedCount += photosToRender.length;
                    }

                    if (app.model.modelLoadedCount >= app.model.modelPhotos.length) {
                        document.getElementById('model-load-more-container').classList.add('hidden');
                    } else {
                        document.getElementById('model-load-more-container').classList.remove('hidden');
                    }
                }
                // --- KẾT THÚC LOGIC PROFILE ĐƠN VỊ ---

            }
});

Object.assign(window.app, {
  search: {
                currentExactPrefix: '', // Biến lưu prefix (mã tỉnh) cho Tuyến
                
                // Render danh sách tỉnh vào Dropdown
                initExactRouteMenu: () => {
                    const renderHtml = `<div class="filter-item ${!app.search.currentExactPrefix ? 'selected' : ''}" onclick="app.search.setExactRoute('')"><span><i class="fa-solid fa-power-off mr-1.5"></i> Tắt</span> <i class="fa-solid fa-check opacity-0 check-icon"></i></div>` 
                        + app.utils.provinceData.map(p => {
                            const prefix = Array.isArray(p.ky_hieu) ? p.ky_hieu[0] : p.ky_hieu.split(',')[0];
                            const isSelected = app.search.currentExactPrefix === prefix;
                            return `<div class="filter-item ${isSelected ? 'selected' : ''}" onclick="app.search.setExactRoute('${prefix}', '${p.ten}')">
                                <span>${p.ten}</span> <i class="fa-solid fa-check ${isSelected ? '' : 'opacity-0'} check-icon"></i>
                            </div>`;
                        }).join('');
                    
                    const hdMenu = document.getElementById('exact-route-header-menu');
                    const pgMenu = document.getElementById('exact-route-page-menu');
                    if (hdMenu) hdMenu.innerHTML = renderHtml;
                    if (pgMenu) pgMenu.innerHTML = renderHtml;
                },

                // Xử lý khi chọn 1 tỉnh (hoặc Tắt)
                setExactRoute: (prefix, name = 'Tắt') => {
                    app.search.currentExactPrefix = prefix;
                    
                    const hdLabel = document.getElementById('exact-route-header-label');
                    const pgLabel = document.getElementById('exact-route-page-label');
                    if (hdLabel) hdLabel.innerText = name;
                    if (pgLabel) pgLabel.innerText = name;

                    document.getElementById('exact-route-header-menu')?.classList.remove('active');
                    document.getElementById('exact-route-page-menu')?.classList.remove('active');
                    
                    // Render lại menu để cập nhật class 'selected'
                    app.search.initExactRouteMenu();
                    
                    // Gọi lại hàm search để apply
                    if (window.location.pathname.includes('/search')) {
                        app.handleSearch(true);
                    }
                },

                // Cập nhật UI Dropdown dựa theo URL hoặc gợi ý
                syncExactUI: (prefix) => {
                    app.search.currentExactPrefix = prefix || '';
                    let provName = 'Tắt';
                    if (prefix && app.utils.provinceData) {
                        const prov = app.utils.provinceData.find(p => {
                            const k = Array.isArray(p.ky_hieu) ? p.ky_hieu : p.ky_hieu.split(',');
                            return k.map(s => s.trim()).includes(prefix);
                        });
                        if (prov) provName = prov.ten;
                    }
                    
                    const hdLabel = document.getElementById('exact-route-header-label');
                    const pgLabel = document.getElementById('exact-route-page-label');
                    if (hdLabel) hdLabel.innerText = provName;
                    if (pgLabel) pgLabel.innerText = provName;
                    app.search.initExactRouteMenu();
                },

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

                    // HIỂN THỊ DROP DOWN NẾU LÀ ROUTE
                    const headerExact = document.getElementById('exact-route-header-box');
                    const pageExact = document.getElementById('exact-route-page-box');
                    if (type === 'route') {
                        if (headerExact) headerExact.classList.remove('hidden');
                        if (pageExact) pageExact.classList.remove('hidden');
                        if (app.utils.provinceData.length > 0) app.search.initExactRouteMenu();
                    } else {
                        if (headerExact) headerExact.classList.add('hidden');
                        if (pageExact) pageExact.classList.add('hidden');
                        app.search.currentExactPrefix = ''; // Tắt khi qua filter khác
                        app.search.syncExactUI('');
                    }

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
                                // Khôi phục lại trạng thái Prefix nếu lịch sử có lưu
                                let setPrefixAction = r.prefix ? `app.search.syncExactUI('${r.prefix}');` : `app.search.syncExactUI('');`;
                                let clickAction = `document.getElementById('${inputId}').value = '${safeRawJS}'; document.getElementById('${sugId}').classList.remove('active'); app.search.setFilter('${r.filter}', false); ${setPrefixAction} app.handleSearch(true);`;
                                
                                let extraLabel = (r.filter === 'route' && r.prefix) ? `<span class="text-[9px] bg-blue-100 text-blue-700 px-1 rounded ml-1 font-bold">Chính xác</span>` : '';
                                
                                return `<div class="suggestion-item border-b border-gray-100 last:border-0" onmousedown="event.preventDefault(); ${clickAction}">
                                    <div class="text-[13px] text-black font-medium leading-snug break-words whitespace-normal flex items-center gap-2"><i class="fa-solid fa-clock-rotate-left text-gray-400"></i> ${r.query} ${extraLabel}</div>
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
                            let results =[];

                            let normalizedQuery = query.toLowerCase()
                                .replace(/vin bus/g, 'vinbus')
                                .replace(/thanh buoi/g, 'thành bưởi')
                                .replace(/phuong trang/g, 'phương trang');

                            const searchWords = normalizedQuery.trim().split(/\s+/).filter(w => w.length > 0);

                            const fetchSugs = async (table, col, label) => {
                                let selectStr = col;
                                if (table === 'vehicles' && app.preference.current !== 'both') selectStr = `${col}, photos!inner(type)`;
                                if (table === 'photos' && col === 'route_no') selectStr = 'route_no, license_plate';

                                let sbQuery = window.sb.from(table).select(selectStr);
                                if (table === 'photos') sbQuery = sbQuery.eq('status', 'approved');

                                searchWords.forEach(word => {
                                    if (col === 'license_plate') sbQuery = sbQuery.ilike(col, `%${app.utils.normalizePlateQuery(word)}%`);
                                    else sbQuery = sbQuery.ilike(col, `%${word}%`);
                                });

                                sbQuery = app.preference.applyFilter(sbQuery, table);
                                const { data } = await sbQuery.limit(30).abortSignal(controller.signal);
                                
                                if (data) {
                                    if (col === 'route_no') {
                                        const routeProvSet = new Set();
                                        const routeResults = [];
                                        data.forEach(item => {
                                            const r = item.route_no;
                                            if (!r) return;
                                            let prov = '';
                                            if (item.license_plate) {
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
                                                routeResults.push({ text: prov ? `${r} (${prov})` : r, label: label, prefix: prefix, rawRoute: r });
                                            }
                                        });
                                        return routeResults;
                                    }

                                    const plates = [...new Set(data.map(item => item[col]).filter(Boolean))];
                                    if (col === 'license_plate') {
                                        const basePlates = plates.filter(p => !/-\d+$/.test(p));
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
                                if (data) results =[...new Set(data.map(item => item.username).filter(Boolean))].map(val => ({ text: val, label: 'Người đăng' }));
                            }

                            if (results.length > 0) {
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
            }
});

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
                                <span onclick="app.searchRedirect('${app.utils.escapeAttr(r.route)}', 'route', '${r.prefix || ''}')" class="cursor-pointer hover:text-blue-600 hover:underline font-bold transition text-black">
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
            }
});

Object.assign(window.app, {
  model: {
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
            }
});

Object.assign(window.app, {
  newsboard: {
            data: [],
            activeIndex: 0,


        init: async () => {
                    try {

                        const res = await fetch('/api/discord');
                        if (!res.ok) throw new Error("Không thể tải bảng tin");
                        const data = await res.json();

                        if (Array.isArray(data) && data.length > 0) {
                            app.newsboard.data = data.sort((a, b) => b.id.localeCompare(a.id));
                            app.newsboard.renderSidebar();
                            app.newsboard.renderContent(0);

                            if (app.currentViewMode === 'home') {
                                app.newsboard.checkAndShow();
                            }
                        }
                    } catch (e) {
                        console.log("Newsboard Error:", e);
                    }
                },
                renderSidebar: () => {
                    const toc = document.getElementById('newsboard-toc');
                    toc.innerHTML = app.newsboard.data.map((item, index) => {
                        const isActive = index === app.newsboard.activeIndex;
                        return `
                        <div class="news-card p-3 rounded-lg cursor-pointer mb-2 transition-colors ${isActive ? 'active' : ''}" onclick="app.newsboard.renderContent(${index})">
                            <div class="text-[10px] ${isActive ? 'text-gray-300' : 'text-gray-400'} font-bold uppercase mb-1">${item.date || 'Hôm nay'}</div>
                            <div class="text-sm font-bold ${isActive ? 'text-white' : 'text-gray-800'} line-clamp-2 leading-snug">${item.title || 'Thông báo hệ thống'}</div>
                            <div class="text-xs ${isActive ? 'text-gray-400' : 'text-gray-500'} mt-1 line-clamp-1">${app.utils.stripMarkdown(item.summary) || 'Nhấn để xem chi tiết...'}</div>
                        </div>
                        `;
                    }).join('');
                },
                renderContent: (index) => {
                    app.newsboard.activeIndex = index;
                    const item = app.newsboard.data[index];

                    document.getElementById('news-date').innerText = item.date || 'Hôm nay';
                    document.getElementById('news-title').innerText = item.title || 'Thông báo';
                    
                    const avatarEl = document.getElementById('news-author-avatar');
                    const nameEl = document.getElementById('news-author-name');
                    
                    if (item.authorName) {
                        nameEl.innerText = item.authorName;
                        nameEl.classList.remove('hidden');
                        if (item.authorAvatar) {
                            avatarEl.src = item.authorAvatar;
                            avatarEl.classList.remove('hidden');
                        } else {
                            avatarEl.classList.add('hidden');
                        }
                    } else {
                        nameEl.classList.add('hidden');
                        avatarEl.classList.add('hidden');
                    }

                    const contentHtml = marked.parse(item.content || '');
                    
                    const newsBody = document.getElementById('news-body');
                    newsBody.innerHTML = DOMPurify.sanitize(contentHtml);

                    // XÓA TIÊU ĐỀ TRÙNG LẶP DƯ THỪA TỪ MARKDOWN
                    const firstH1 = newsBody.querySelector('h1');
                    if (firstH1) firstH1.remove();

                    app.newsboard.renderSidebar();

                    const contentArea = document.querySelector('#newsboard-modal .overflow-y-auto');
                    if (contentArea) contentArea.scrollTop = 0;
                },
                checkAndShow: () => {
                    if (app.currentViewMode !== 'home' || !app.newsboard.data || app.newsboard.data.length === 0) {
                        return;
                    }

                    if (!localStorage.getItem('vnbus_onboarded')) {
                        return;
                    }

                    let lastSeen = null;
                    try {
                        lastSeen = localStorage.getItem('vnbus_news_last_seen');
                    } catch (err) {
                        console.warn("Trình duyệt chặn localStorage");
                    }

                    const today = new Date().toDateString();

                    if (lastSeen !== today) {
                        setTimeout(() => {
                            app.newsboard.open();
                            try {
                                localStorage.setItem('vnbus_news_last_seen', today);
                            } catch (err) { }
                        }, 500);
                    }
                },
                open: () => {
                    const modal = document.getElementById('newsboard-modal');
                    const content = document.getElementById('newsboard-content');
                    modal.classList.remove('hidden');
                    app.ui.lockScroll();

                    setTimeout(() => {
                        content.classList.remove('opacity-0', 'scale-95');
                        content.classList.add('opacity-100', 'scale-100');
                    }, 10);

                },
                close: () => {
                    const modal = document.getElementById('newsboard-modal');
                    const content = document.getElementById('newsboard-content');

                    content.classList.remove('opacity-100', 'scale-100');
                    content.classList.add('opacity-0', 'scale-95');

                    setTimeout(() => {
                        modal.classList.add('hidden');
                        // SỬA LỖI: Thay lockScroll thành unlockScroll
                        app.ui.unlockScroll();
                    }, 200);
                }
            }
});

Object.assign(window.app, {
  help: {
                data: [],
                
                loadList: async () => {
                    app.views.switch('help-list', false);
                    document.title = 'Trung tâm hỗ trợ | VNBUSARCHIVE';
                    const container = document.getElementById('help-grid');
                    
                    if (app.help.data.length === 0) {
                        container.innerHTML = '<div class="col-span-full text-center py-20 text-gray-500"><i class="fa-solid fa-circle-notch fa-spin text-2xl mb-2 text-black"></i><p>Đang tải dữ liệu...</p></div>';
                        try {
                            const res = await fetch('/api/discord?type=help');
                            if (!res.ok) throw new Error("Lỗi fetch API");
                            const data = await res.json();
                            app.help.data = data;
                        } catch (e) {
                            container.innerHTML = `<div class="col-span-full text-center py-10 text-red-500 font-bold"><i class="fa-solid fa-triangle-exclamation mr-1"></i> Không thể tải dữ liệu: ${e.message}</div>`;
                            app.loadingBar.finish();
                            return;
                        }
                    }

                    if (app.help.data.length === 0) {
                        container.innerHTML = '<div class="col-span-full text-center py-10 text-gray-500 font-medium">Chưa có bài viết hướng dẫn nào.</div>';
                    } else {
                        container.innerHTML = app.help.data.map(item => `
                            <div onclick="app.utils.navigate('/help/${item.id}')" class="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-black transition-all cursor-pointer flex flex-col h-full group">
                                <h3 class="font-bold text-base text-black mb-2 line-clamp-2 transition-colors">${item.title}</h3>
                                <p class="text-xs text-gray-600 line-clamp-3 mb-5 flex-1 leading-relaxed">${app.utils.stripMarkdown(item.summary)}</p>
                                <div class="flex items-center gap-2 mt-auto pt-2">
                                    <div class="w-7 h-7 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-[10px] shrink-0 group-hover:bg-black group-hover:text-white transition-colors">
                                        <i class="fa-solid fa-file-lines"></i>
                                    </div>
                                    <span class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">${item.date}</span>
                                </div>
                            </div>
                        `).join('');
                    }
                    app.loadingBar.finish();
                },

                // Hàm cuộn mượt mà có bù trừ chiều cao Header
                scrollToHeading: (id) => {
                    const el = document.getElementById(id);
                    if (el) {
                        const headerOffset = 110; // Khoảng cách chừa ra ở trên đỉnh
                        const elementPosition = el.getBoundingClientRect().top;
                        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                        window.scrollTo({
                            top: offsetPosition,
                            behavior: "smooth"
                        });
                    }
                },

                loadDetail: async (id) => {
                    app.views.switch('help-detail', false);
                    const container = document.getElementById('help-detail-container');
                    const loading = document.getElementById('help-detail-loading');
                    const tocBox = document.getElementById('help-toc-box');
                    const tocList = document.getElementById('help-toc-list');
                    
                    container.classList.add('hidden');
                    tocBox.classList.add('hidden');
                    loading.classList.remove('hidden');
                    document.getElementById('help-breadcrumb-title').innerText = "Đang tải...";
                    
                    try {
                        let item = app.help.data.find(h => h.id === id);
                        
                        if (!item) {
                            const res = await fetch(`/api/discord?type=help&id=${id}`);
                            if (!res.ok) throw new Error("Bài viết không tồn tại hoặc có lỗi xảy ra");
                            item = await res.json();
                        }

                        document.title = `${item.title} | VNBUSARCHIVE`;
                        document.getElementById('help-breadcrumb-title').innerText = item.title;
                        
                        document.getElementById('help-detail-title').innerText = item.title;
                        document.getElementById('help-detail-author').innerText = item.authorName;
                        document.getElementById('help-detail-date').innerText = item.date;
                        
                        const avatarEl = document.getElementById('help-detail-avatar');
                        avatarEl.src = item.authorAvatar;

                        const contentHtml = marked.parse(item.content || '');
                        const articleBody = document.getElementById('help-detail-body');
                        articleBody.innerHTML = DOMPurify.sanitize(contentHtml);

                        // XÓA TIÊU ĐỀ TRÙNG LẶP DƯ THỪA TỪ MARKDOWN
                        const firstH1 = articleBody.querySelector('h1');
                        if (firstH1) firstH1.remove();

                        // --- LOGIC TẠO MỤC LỤC TỰ ĐỘNG ---
                        // Bỏ qua H1 (tiêu đề chính), chỉ quét H2, H3, H4
                        const headings = articleBody.querySelectorAll('h2, h3, h4');
                        tocList.innerHTML = '';
                        tocBox.classList.remove('hidden'); // Luôn hiện Box

                        if (headings.length === 0) {
                            tocList.innerHTML = '<li class="text-gray-400 italic text-[13px] font-medium">Không có phân mục nội dung cụ thể.</li>';
                        } else {
                            headings.forEach((heading, index) => {
                                // Gán ID độc nhất cho mỗi thẻ H2, H3 để cuộn tới
                                const targetId = `help-heading-${index}`;
                                heading.id = targetId;

                                const li = document.createElement('li');
                                
                                // Thụt lề theo cấp bậc (H3 lùi 1 tí, H4 lùi nhiều tí)
                                const level = parseInt(heading.tagName.substring(1));
                                if (level === 3) li.classList.add('pl-4', 'text-[13px]', 'text-gray-600');
                                else if (level === 4) li.classList.add('pl-8', 'text-[12px]', 'text-gray-500');

                                // Link bấm gọi hàm scrollToHeading
                                li.innerHTML = `<a href="javascript:void(0)" onclick="app.help.scrollToHeading('${targetId}')" class="hover:text-black hover:underline transition-all flex items-start gap-2 leading-snug">
                                    <span class="text-black opacity-40 mt-[3px] shrink-0"><i class="fa-solid fa-angle-right text-[10px]"></i></span> 
                                    <span>${heading.innerText}</span>
                                </a>`;
                                
                                tocList.appendChild(li);
                            });
                        }
                        // ---------------------------------

                        loading.classList.add('hidden');
                        container.classList.remove('hidden');

                    } catch (e) {
                        loading.innerHTML = `<div class="text-red-500 font-bold"><i class="fa-solid fa-triangle-exclamation text-3xl mb-3"></i><p>${e.message}</p></div>`;
                    }
                    app.loadingBar.finish();
                }
            }
});

Object.assign(window.app, {
  topUploaders: {}
});

Object.assign(window.app, {
  activeAnnouncements: []
});

