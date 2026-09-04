// Extracted to page_feed.js
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
                    if (labelEl) {
                        if (app.views.currentProfileSort === 'newest') labelEl.innerText = 'Mới nhất';
                        else if (app.views.currentProfileSort === 'most_liked') labelEl.innerText = 'Được yêu thích nhất';
                        else labelEl.innerText = 'Phổ biến nhất';
                    }
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
                    if (id === 'leaderboard' && window.location.pathname !== '/leaderboard') {
                        app.utils.navigate('/leaderboard'); return;
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
                        return; 
                    } else {
                        app.maintenance.hideScreen();
                    }
                    if (id === 'auth') {
                        window.dispatchEvent(new CustomEvent('auth-opened'));
                        app.utils.resetTurnstile('#auth .cf-turnstile');
                    }
                    const searchBox = document.getElementById('header-search-box');
                    const headerSpacer = document.getElementById('header-spacer');
                    const mainHeader = document.querySelector('header');
                    
                    if (id === 'auth') {
                        if (mainHeader) mainHeader.style.display = 'none';
                        if (headerSpacer) headerSpacer.style.display = 'none';
                    } else {
                        if (mainHeader) mainHeader.style.display = '';
                        if (headerSpacer) headerSpacer.style.display = '';
                        
                        const footer = document.querySelector('footer');
                        if (footer) {
                            if (id === 'map') {
                                footer.parentElement.style.display = 'none';
                                document.body.style.overflow = 'hidden';
                            } else {
                                footer.parentElement.style.display = '';
                                document.body.style.overflow = '';
                            }
                        }
                        
                        if (['upload', 'search', 'mobile-upload', 'map'].includes(id)) {
                            if (searchBox) searchBox.classList.add('hidden');
                            if (headerSpacer) {
                                headerSpacer.classList.remove('h-28');
                                headerSpacer.classList.add('h-20');
                            }
                            if (id === 'upload') {
                                app.upload.fetchRequirements();
                                app.upload.checkQuota();
                                app.upload.checkAndPromptDraft();

                                app.utils.resetTurnstile('#upload .cf-turnstile');
                            }
                        } else {
                            if (searchBox) searchBox.classList.remove('hidden');
                            if (headerSpacer) {
                                headerSpacer.classList.remove('h-20');
                                headerSpacer.classList.add('h-28');
                            }
                        }
                    }
                    if (id === 'upload' && !app.user) { app.utils.navigate('/auth'); return; }
                    if (app.currentViewMode === 'upload' && id !== 'upload') {
                        app.upload.saveDraft();
                    }
                    const depths = {
                        'home': 0,
                        'search': 1, 'account': 1, 'upload': 1, 'mobile-upload': 1, 'admin': 1, 'contact': 1, 'help-list': 1, 'comment-dashboard': 1, 'leaderboard': 1,
                        'detail': 2, 'vehicle': 2, 'operator-view': 2, 'model-view': 2, 'route-view': 2, 'help-detail': 2
                    };
                    const currentId = document.querySelector('.view-section.active')?.id || 'home';
                    const currentDepth = depths[currentId] || 0;
                    const targetDepth = depths[id] || 0;
                    let animationClass = 'slide-in-right'; 
                    if (targetDepth < currentDepth) {
                        animationClass = 'slide-in-left';  
                    } else if (targetDepth === currentDepth) {
                        animationClass = 'fade-zoom-in-page'; 
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
                    if (app.utils && app.utils.updateCanonical) app.utils.updateCanonical();
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
                        document.getElementById('grid-title').innerText = "Ảnh mới nhất được đăng";
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
                    document.getElementById('grid-title').innerText = "Ảnh mới nhất được đăng";
                    document.getElementById('search-input').value = "";
                    document.getElementById('btn-clear-search').classList.add('hidden');
                    document.getElementById('load-more-container').classList.add('hidden');
                    document.getElementById('search-profile-cards').classList.add('hidden');
                    document.getElementById('load-more-cards-container')?.classList.add('hidden');
                    app.search.setFilter('all', false);
                    app.loadedCount = 0;
                    const heroMainEl = document.getElementById('hero-main');
                    const heroSubEl = document.getElementById('hero-sub');
                    if (heroMainEl && heroSubEl) {
                        heroMainEl.className = "w-full md:w-3/5 relative group cursor-pointer bg-gray-100 rounded-md overflow-hidden border border-gray-200 hover:-translate-y-1 hover:shadow-lg transition-all duration-300";
                        heroMainEl.innerHTML = `
                            <div class="w-full flex items-center justify-center text-gray-400" style="min-height: 404px;">
                                <i class="fa-solid fa-circle-notch fa-spin text-3xl"></i>
                            </div>
                        `;
                        heroSubEl.innerHTML = Array(4).fill(0).map(() => `
                            <div class="relative w-full h-[196px] bg-gray-100 rounded-md overflow-hidden border border-gray-200 flex items-center justify-center text-gray-400">
                                <i class="fa-solid fa-circle-notch fa-spin text-2xl"></i>
                            </div>
                        `).join('');
                    }
                    let topPhotos = null;
                    try {
                        const { data: trendingData, error: trendingErr } = await window.sb.rpc('get_trending_photos_24h', {
                            filter_type: app.preference.current || 'both',
                            limit_num: 5
                        });
                        if (!trendingErr && trendingData && trendingData.length > 0) {
                            topPhotos = trendingData;
                        }
                    } catch (e) {
                        console.warn("Chưa chạy RPC get_trending_photos_24h hoặc lỗi:", e);
                    }
                    if (!topPhotos || topPhotos.length === 0) {
                        let topQuery = window.sb
                            .from('photos')
                            .select(`id, url, license_plate, operator, type, route_no, taken_at, created_at, uploader_id, note, exif_params, borrowed_route, camera_model, location, status, denial_reason, views, profiles(id, username, role, subroles, ban_status), vehicles(model)`)
                            .eq('status', 'approved')
                            .order('views', { ascending: false, nullsFirst: false })
                            .limit(5);
                        topQuery = app.preference.applyFilter(topQuery);
                        const { data: fallbackPhotos } = await topQuery;
                        topPhotos = fallbackPhotos;
                    }
                    if (app.currentViewMode !== 'home') return;
                    const heroMain = document.getElementById('hero-main');
                    const heroSub = document.getElementById('hero-sub');
                    if (topPhotos && topPhotos.length > 0) {
                        app.topPhotosCache = topPhotos;
                        const main = topPhotos[0];
                        const safeMainPlate = app.utils.displayPlate(app.utils.cleanText(main.license_plate));
                        const safeMainOperator = app.utils.cleanText(main.operator || 'Đang cập nhật');
                        heroMain.className = "img-wrapper w-full md:w-3/5 relative group cursor-pointer bg-gray-100 rounded-md overflow-hidden border border-gray-200 hover:-translate-y-1 hover:shadow-lg transition-all duration-300";
                        heroMain.innerHTML = `
                            <div class="img-spinner absolute inset-0 flex items-center justify-center text-gray-400 z-0">
                                <i class="fa-solid fa-circle-notch fa-spin text-3xl"></i>
                            </div>
                            <img loading="lazy" decoding="async" src="${app.utils.getProxiedUrl(main.url, 'main.jpg', 'full')}"
                                 onload="app.utils.handleImgLoad(this)"
                                 onerror="app.utils.fallbackHeroImage(this, 'topPhotosCache', 0)"
                                 class="absolute inset-0 w-full h-full object-cover object-center block transition-all duration-700 opacity-0 z-10">
                            <div class="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/85 via-black/50 to-transparent p-4 pt-14 pointer-events-none z-20 flex flex-col gap-1" style="z-index: 20;">
                                <p class="text-white font-bold text-xl tracking-tight hero-main-text pointer-events-auto leading-tight truncate" style="text-shadow: 0 2px 4px rgba(0,0,0,0.95);">${safeMainPlate}</p>
                                <p class="text-white text-xs hero-main-views pointer-events-auto truncate leading-tight font-medium" style="text-shadow: 0 1px 3px rgba(0,0,0,0.95);">${safeMainOperator}</p>
                            </div>
                        `;
                        heroMain.onclick = () => app.views.loadDetail(main.id);
                        heroSub.innerHTML = '';
                        for (let i = 1; i < topPhotos.length; i++) {
                            const p = topPhotos[i];
                            const safeSubPlate = app.utils.displayPlate(app.utils.cleanText(p.license_plate));
                            const safeSubOperator = app.utils.cleanText(p.operator || 'Đang cập nhật');
                            heroSub.innerHTML += `
                                <div class="img-wrapper relative group cursor-pointer h-[196px] bg-gray-100 rounded-md overflow-hidden border border-gray-200 hover:-translate-y-1 hover:shadow-lg transition-all duration-300" onclick="app.views.loadDetail(${p.id})">
                                    <div class="img-spinner absolute inset-0 flex items-center justify-center text-gray-400 z-0">
                                        <i class="fa-solid fa-circle-notch fa-spin text-2xl"></i>
                                    </div>
                                    <img loading="lazy" decoding="async" src="${app.utils.getProxiedUrl(p.url, 'sub.jpg', 'thumb')}"
                                         onload="app.utils.handleImgLoad(this)"
                                         onerror="app.utils.fallbackHeroImage(this, 'topPhotosCache', ${i})"
                                         class="absolute inset-0 w-full h-full object-cover transition-all duration-500 opacity-0 z-10">
                                    <div class="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/85 via-black/40 to-transparent p-2.5 pt-8 pointer-events-none z-20 flex flex-col gap-0.5" style="z-index: 20;">
                                        <p class="text-white font-bold text-xs tracking-tight truncate leading-none hero-sub-text" style="text-shadow: 0 1px 3px rgba(0,0,0,0.95);">${safeSubPlate}</p>
                                        <p class="text-white text-[11px] truncate leading-none font-medium hero-sub-operator" style="text-shadow: 0 1px 3px rgba(0,0,0,0.95);">${safeSubOperator}</p>
                                    </div>
                                </div>`;
                        }
                    } else {
                        heroMain.className = "w-full md:w-3/5 relative group cursor-pointer bg-gray-100 rounded-md overflow-hidden border border-gray-200";
                        heroMain.innerHTML = '<div class="w-full flex items-center justify-center text-gray-400" style="min-height: 404px;">Chưa có dữ liệu nổi bật</div>';
                        heroSub.innerHTML = '';
                    }
                    const grid = document.getElementById('photo-grid');
                    app.homeCurrentPage = 1;
                    const homeSize = 20;
                    let gridQuery = window.sb
                        .from('photos')
                        .select(`id, url, license_plate, operator, type, route_no, taken_at, created_at, uploader_id, note, exif_params, borrowed_route, camera_model, location, status, denial_reason, views, profiles(id, username, role, subroles, ban_status), vehicles(model)`, { count: 'estimated' })
                        .eq('status', 'approved')
                        .order('created_at', { ascending: false })
                        .range(0, homeSize - 1);
                    gridQuery = app.preference.applyFilter(gridQuery);
                    const { data: photos, count: exactCount } = await gridQuery;
                    if (app.currentViewMode !== 'home') return;
                    if (!photos || photos.length === 0) {
                        grid.innerHTML = '<div class="col-span-full text-center py-10">Chưa có ảnh nào.</div>';
                        document.getElementById('load-more-container').classList.add('hidden');
                        return;
                    }
                    app.loadedCount = exactCount || photos.length;
                    app.homeTotalPages = Math.ceil(app.loadedCount / homeSize);
                    grid.innerHTML = photos.map(p => app.views.renderPhotoCard(p)).join('');
                    if (app.homeTotalPages > 1) {
                        const btnContainer = document.getElementById('load-more-container');
                        btnContainer.classList.remove('hidden');
                        btnContainer.innerHTML = `<button id="btn-home-load-more" onclick="app.views.loadMorePhotos()" class="bg-white border border-gray-300 text-gray-700 px-6 py-2.5 text-sm font-bold rounded-md hover:bg-gray-50 hover:border-gray-400 transition shadow-sm">Xem thêm <i class="fa-solid fa-chevron-down ml-1"></i></button>`;
                    } else {
                        document.getElementById('load-more-container').classList.add('hidden');
                    }
                    try {
                        const prefFilter = app.preference.current || 'both';
                        const stats = await app.utils.getCachedStats('home_stats_' + prefFilter, 10 * 60 * 1000, async () => {
                            const rpc = await app.utils.getHomeStats(prefFilter);
                            if (rpc) return rpc;
                            let countQuery = window.sb.from('photos').select('id', { count: 'estimated', head: true }).eq('status', 'approved');
                            countQuery = app.preference.applyFilter(countQuery);
                            const { count: photoCount } = await countQuery;
                            return { total_photos: photoCount || 0, total_vehicles: null, total_routes: null };
                        });
                        let photoCount = stats.total_photos || 0;
                        let uniquePlates = (stats.total_vehicles != null) ? stats.total_vehicles : null;
                        let uniqueRoutes = (stats.total_routes != null) ? stats.total_routes : null;
                        if (uniquePlates === null || uniqueRoutes === null) {
                            const plateSet = new Set();
                            const routeSet = new Set();
                            let from = 0; const step = 999; let fetchMore = true;
                            while (fetchMore) {
                                let statsQuery = window.sb.from('photos')
                                    .select('license_plate, route_no')
                                    .eq('status', 'approved')
                                    .range(from, from + step);
                                statsQuery = app.preference.applyFilter(statsQuery);
                                const { data, error } = await statsQuery;
                                if (error || !data || data.length === 0) break;
                                data.forEach(item => {
                                    if (item.license_plate) plateSet.add(item.license_plate.trim().toUpperCase());
                                    if (item.route_no && item.route_no !== '---') routeSet.add(item.route_no.trim().toLowerCase());
                                });
                                if (data.length <= step) fetchMore = false; else from += step + 1;
                            }
                            uniquePlates = plateSet.size;
                            uniqueRoutes = routeSet.size;
                        }
                        document.getElementById('db-stat-photos').innerText = app.utils.formatCompact(photoCount || 0);
                        document.getElementById('db-stat-vehicles').innerText = app.utils.formatCompact(uniquePlates || 0);
                        document.getElementById('db-stat-routes').innerText = app.utils.formatCompact(uniqueRoutes || 0);
                        if (app.views && app.views.updateMilestoneBanner) app.views.updateMilestoneBanner(photoCount || 0);
                    } catch (e) {
                        console.error("Lỗi tải thông kê:", e);
                    }
                    app.newsboard.checkAndShow();
                    app.loadingBar.finish();
                },
                updateMilestoneBanner: async (photoCount = null) => {
                    const banner = document.getElementById('milestone-banner');
                    if (!banner) return;
                    let totalPhotos = photoCount;
                    if (totalPhotos === null || typeof totalPhotos !== 'number') {
                        try {
                            let countQuery = window.sb.from('photos').select('id', { count: 'estimated', head: true }).eq('status', 'approved');
                            countQuery = app.preference.applyFilter(countQuery);
                            const { count } = await countQuery;
                            totalPhotos = count || 0;
                        } catch (e) {
                            console.warn("Lỗi tính tổng ảnh cột mốc:", e);
                            return;
                        }
                    }
                    const floorMilestone = Math.floor(totalPhotos / 5000) * 5000;
                    const ceilMilestone = Math.ceil(totalPhotos / 5000) * 5000;
                    const isAchieved = floorMilestone > 0 && (totalPhotos - floorMilestone) <= 50;
                    const remaining = ceilMilestone - totalPhotos;
                    const isApproaching = !isAchieved && ceilMilestone > 0 && remaining <= 200 && remaining > 0;
                    if (isAchieved || isApproaching) {
                        const targetMilestone = isAchieved ? floorMilestone : ceilMilestone;
                        const prevMilestone = targetMilestone - 5000;
                        const progressPercent = isAchieved ? 100 : Math.min(100, Math.max(0, ((totalPhotos - prevMilestone) / (targetMilestone - prevMilestone)) * 100));
                        banner.innerHTML = `
                            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3.5">
                                <span class="font-extrabold text-gray-900 text-sm md:text-base tracking-tight">
                                    Cột mốc ${targetMilestone.toLocaleString('vi-VN')} ảnh${isAchieved ? ' 🎉' : ''}
                                </span>
                                <span class="font-black text-base md:text-lg tracking-tight" style="background: linear-gradient(to right, #ff9005, #ff0000); -webkit-background-clip: text; -webkit-text-fill-color: transparent; filter: drop-shadow(0 1px 1px rgba(0,0,0,0.1));">
                                    ${totalPhotos.toLocaleString('vi-VN')}/${targetMilestone.toLocaleString('vi-VN')}
                                </span>
                            </div>
                            <div class="w-full bg-gray-100 border border-gray-200 rounded-full mb-4 overflow-hidden shadow-inner flex items-center" style="height: 14px;">
                                <div class="rounded-full transition-all duration-1000" style="height: 100%; width: ${progressPercent}%; background: linear-gradient(to right, #ff9005, #ff0000); min-width: 6px;"></div>
                            </div>
                            <div class="flex justify-start sm:justify-end">
                                <button onclick="app.utils.navigate('/upload')" class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-black text-white font-bold text-sm rounded-lg hover:bg-gray-800 transition shadow-md group">
                                    <i class="fa-solid fa-cloud-arrow-up text-white group-hover:-translate-y-0.5 transition-transform"></i>
                                    ${isAchieved ? `<span>Đóng góp ngay</span>` : `<span>Đóng góp ngay, còn lại <span class="font-black" style="background: linear-gradient(to right, #ff9005, #ff0000); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${remaining.toLocaleString('vi-VN')}</span> ảnh</span>`}
                                </button>
                            </div>
                        `;
                        banner.classList.remove('hidden');
                    } else {
                        banner.classList.add('hidden');
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
                fetchSearchPage: async (page) => {
                    const grid = document.getElementById('search-photo-grid');
                    grid.innerHTML = '<div class="col-span-full text-center py-10"><i class="fa-solid fa-spinner fa-spin text-2xl text-gray-400"></i></div>';
                    const fromRow = (page - 1) * app.searchPageSize;
                    const toRow = fromRow + app.searchPageSize - 1;
                    try {
                        const filterType = app.currentFilter;
                        const profileSelect = (filterType === 'uploader') ? 'profiles!inner(id, username, role, subroles, ban_status)' : 'profiles(id, username, role, subroles, ban_status)';
                        let sQuery = window.sb.from('photos').select(`id, url, license_plate, operator, type, route_no, taken_at, created_at, uploader_id, note, exif_params, borrowed_route, camera_model, location, status, denial_reason, views, ${profileSelect}, vehicles${filterType === 'model' ? '!inner' : ''}(model)`).eq('status', 'approved');
                        sQuery = app.preference.applyFilter(sQuery);
                        const query = (document.getElementById('page-search-input') || document.getElementById('search-input'))?.value.trim() || '';
                        const searchWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 0);
                        if (filterType === 'route') {
                            const prefix = app.lastSearchPrefix || new URLSearchParams(window.location.search).get('prefix') || '';
                            if (prefix) {
                                let provName = null;
                                if (app.utils.provinceData) {
                                    const prov = app.utils.provinceData.find(p => {
                                        const k = Array.isArray(p.ky_hieu) ? p.ky_hieu : p.ky_hieu.split(',');
                                        return k.map(s => s.trim()).includes(prefix);
                                    });
                                    if (prov) provName = prov.ten;
                                }
                                const relatedPrefixes = app.utils.getRelatedPrefixes(prefix);
                                const plateFilter = relatedPrefixes.length > 1 ? `or(${relatedPrefixes.map(p => `license_plate.ilike.${p}%`).join(',')})` : `license_plate.ilike.${relatedPrefixes[0]}%`;
                                if (provName) {
                                    sQuery = sQuery.eq('route_no', query).or(`borrowed_route.eq."${query} - ${provName}",and(borrowed_route.is.null,${plateFilter})`);
                                } else {
                                    sQuery = sQuery.eq('route_no', query).or(`and(borrowed_route.is.null,${plateFilter})`);
                                }
                            } else {
                                searchWords.forEach(w => { sQuery = sQuery.ilike('route_no', `%${w}%`); });
                            }
                        } else if (filterType === 'plate') {
                            searchWords.forEach(w => { sQuery = sQuery.ilike('license_plate', `%${app.utils.normalizePlateQuery(w)}%`); });
                        } else if (filterType === 'operator') {
                            searchWords.forEach(w => { sQuery = sQuery.ilike('operator', `%${w}%`); });
                        } else if (filterType === 'camera') {
                            searchWords.forEach(w => { sQuery = sQuery.ilike('camera_model', `%${w}%`); });
                        } else if (filterType === 'location') {
                            searchWords.forEach(w => { sQuery = sQuery.ilike('location', `%${w}%`); });
                        } else if (filterType === 'uploader') {
                            searchWords.forEach(w => { sQuery = sQuery.ilike('profiles.username', `%${w}%`); });
                        } else if (filterType === 'model') {
                            searchWords.forEach(w => { sQuery = sQuery.ilike('vehicles.model', `%${w}%`); });
                        } else if (filterType === 'advanced') {
                            if (app.search.advancedFilters && app.search.advancedFilters.length > 0) {
                                sQuery = app.search.applyAdvancedFiltersToQuery(sQuery);
                            }
                        } else {
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
                                sQuery = sQuery.or(orConditions.join(','));
                            });
                        }
                        const { data: photos } = await sQuery
                            .order('taken_at', { ascending: false, nullsFirst: false })
                            .order('created_at', { ascending: false })
                            .range(fromRow, toRow);
                        if (photos && photos.length > 0) {
                            grid.innerHTML = photos.map(p => app.views.renderPhotoCard(p)).join('');
                            app.currentSearchResults = photos;
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        } else {
                            grid.innerHTML = '<div class="col-span-full text-center py-10 text-gray-500">Không tìm thấy kết quả phù hợp.</div>';
                        }
                        app.searchCurrentPage = page;
                        if (app.searchTotalPages > 1) {
                            document.getElementById('search-load-more-container').classList.remove('hidden');
                            app.utils.renderPagination('search-load-more-container', page, app.searchTotalPages, (newPage) => {
                                app.views.fetchSearchPage(newPage);
                            });
                        } else {
                            document.getElementById('search-load-more-container').classList.add('hidden');
                        }
                    } catch (e) {
                        console.error("Lỗi tải trang tìm kiếm:", e);
                        grid.innerHTML = `<div class="col-span-full text-center py-10 text-red-500">Lỗi hệ thống: ${e.message}</div>`;
                    }
                },
                loadMorePhotos: async () => {
                    const btn = document.getElementById('btn-home-load-more');
                    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang tải...'; }
                    const grid = document.getElementById('photo-grid');
                    app.homeCurrentPage++;
                    const homeSize = 20;
                    const fromRow = (app.homeCurrentPage - 1) * homeSize;
                    const toRow = fromRow + homeSize - 1;
                    try {
                        let moreQuery = window.sb
                            .from('photos')
                            .select(`id, url, license_plate, operator, type, route_no, taken_at, created_at, uploader_id, note, exif_params, borrowed_route, camera_model, location, status, denial_reason, views, profiles(id, username, role, subroles, ban_status), vehicles(model)`)
                            .eq('status', 'approved')
                            .order('created_at', { ascending: false })
                            .range(fromRow, toRow);
                        moreQuery = app.preference.applyFilter(moreQuery);
                        const { data: photos, error } = await moreQuery;
                        if (error) throw error;
                        if (photos && photos.length > 0) {
                            grid.innerHTML += photos.map(p => app.views.renderPhotoCard(p)).join('');
                        }
                    } catch(e) {
                        console.error("Lỗi khi tải thêm ảnh:", e);
                    } finally {
                        if (btn) {
                            if (app.homeCurrentPage >= app.homeTotalPages) {
                                document.getElementById('load-more-container').classList.add('hidden');
                            } else {
                                btn.disabled = false;
                                btn.innerHTML = 'Xem thêm <i class="fa-solid fa-chevron-down ml-1"></i>';
                            }
                        }
                    }
                },
                renderPhotoCard: (p) => {
                    const safePlate = app.utils.displayPlate(app.utils.cleanText(p.license_plate));
                    let safeOp = app.utils.cleanText(p.operator || 'Đã bị xóa');
                    if (p.route_no && p.route_no.trim() === 'Dừng hoạt động') safeOp = 'Dừng hoạt động';
                    const uDisplay = app.utils.formatProfileDisplay(p.profiles);
                    const safeUser = app.utils.cleanText(uDisplay.username);
                    const proxyUrl = app.utils.getProxiedUrl(p.url, `${safePlate}.jpg`, 'thumb');
                    const dateHtml = p.taken_at ? `<span class="shrink-0"><i class="fa-regular fa-calendar mr-1"></i>${p.taken_at.split('T')[0].split('-').reverse().join('/')}</span>` : '';
                    return `
                        <div data-id="${p.id}" class="bg-white border border-gray-200 hover:border-gray-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer rounded-xl p-2 transition-all duration-300 flex flex-col fade-zoom-in-page" onclick="app.views.loadDetail(${p.id})">
                            <div class="img-wrapper relative w-full aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-100">
                                <div class="img-spinner absolute inset-0 flex items-center justify-center text-gray-400">
                                    <i class="fa-solid fa-circle-notch fa-spin text-2xl"></i>
                                </div>
                                <img loading="lazy" src="${proxyUrl}"
                                     onload="app.utils.handleImgLoad(this)"
                                     onerror="app.utils.handleImgError(this)"
                                     alt="Xe buýt ${safePlate}"
                                     class="absolute inset-0 w-full h-full object-cover opacity-0 transition-all duration-500">
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
                                    ${dateHtml}
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
                        isOwnProfile = (app.user && (app.username === targetUsername || app.user.id === targetUsername));
                        if (isOwnProfile && window.location.pathname !== '/profile') return app.utils.navigate('/profile');
                        if (!isOwnProfile && !window.location.pathname.startsWith('/user/')) return app.utils.navigate(`/user/${encodeURIComponent(targetUsername)}`);
                    }
                    const isReturningToSameProfile = (app.lastLoadedUsername === targetUsername) && !forceRefresh;
                    app._isOwnProfile = isOwnProfile;
                    app.lastLoadedUsername = targetUsername;
                    app.views.switch('account', false);
                    document.title = isOwnProfile ? 'Tài khoản của tôi | VNBUSARCHIVE' : `Hồ sơ: ${targetUsername} | VNBUSARCHIVE`;
                    if (isReturningToSameProfile && document.getElementById('acc-name').innerText !== '...') {
                        app.loadingBar.finish();
                        return;
                    }
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

                    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetUsername);
                    const queryCol = isUUID ? 'id' : 'username';
                    const { data: profile } = await window.sb.from('profiles').select('id, username, avatar_url, role, subroles, favorite_photo_id, created_at, ban_status, preferences').eq(queryCol, targetUsername).single();
                    if (!profile) {
                        app.ui.showAlert("Không tìm thấy người dùng này.");
                        return app.views.loadHome();
                    }
                    if (!isOwnProfile && window.location.pathname !== `/user/${profile.id}`) {
                        window.history.replaceState({}, '', `/user/${profile.id}`);
                    }
                    let banInfo = null;
                    if (profile.ban_status) {
                        try { banInfo = typeof profile.ban_status === 'string' ? JSON.parse(profile.ban_status) : profile.ban_status; } catch(e){}
                    }
                    const isBannedUser = banInfo && (banInfo.banned === true || banInfo.banned === 'true');
                    const displayUsername = isBannedUser ? 'Người dùng bị cấm' : profile.username;
                    document.title = isOwnProfile ? 'Tài khoản của tôi | VNBUSARCHIVE' : `Hồ sơ: ${displayUsername} | VNBUSARCHIVE`;
                    const targetUserId = profile.id;
                    app.currentProfileId = targetUserId;
                    if (Object.keys(app.topUploaders).length === 0) await app.utils.fetchTopUploaders();
                    const badges = isBannedUser ? '' : app.utils.getBadgesHTML(profile.id, profile.role, profile.subroles, true);
                    document.getElementById('acc-name').innerHTML = isBannedUser 
                        ? '<span class="text-black font-bold">Người dùng bị cấm</span>' 
                        : `${profile.username} ${badges}`;
                    const avatarIcon = document.getElementById('acc-avatar-icon');
                    const avatarImg = document.getElementById('acc-avatar-img');
                    const safeAvatar = isBannedUser 
                        ? DEFAULT_AVATAR 
                        : (profile.avatar_url ? app.utils.getProxiedUrl(profile.avatar_url, 'avatar.jpg', 'avatar') : DEFAULT_AVATAR);
                    avatarImg.src = safeAvatar;
                    avatarImg.onerror = () => { avatarImg.src = DEFAULT_AVATAR; };
                    avatarImg.classList.remove('hidden');
                    avatarIcon.classList.add('hidden');
                    const banAlertContainer = document.getElementById('profile-ban-alert-container');
                    if (banAlertContainer) {
                        if (isBannedUser) {
                            banAlertContainer.innerHTML = `
                                <div class="p-4 bg-red-50 border border-red-200 rounded-xl text-red-900 flex items-start gap-3 shadow-sm">
                                    <i class="fa-solid fa-ban text-red-600 mt-0.5 text-base shrink-0"></i>
                                    <div>
                                        <h4 class="font-bold text-sm text-red-700 uppercase tracking-wide">Tài khoản bị cấm</h4>
                                        <p class="text-xs text-red-900 mt-1 leading-relaxed">Tài khoản này đã bị cấm với lí do: <b class="font-bold text-red-950">${app.utils.cleanText(banInfo.reason || 'Vi phạm quy định của VNBUSARCHIVE')}</b></p>
                                    </div>
                                </div>
                            `;
                            banAlertContainer.classList.remove('hidden');
                        } else {
                            banAlertContainer.innerHTML = '';
                            banAlertContainer.classList.add('hidden');
                        }
                    }
                    const bioContent = document.getElementById('profile-bio-content');
                    const bioControls = document.getElementById('profile-bio-controls');
                    const createDateStr = profile.created_at ? new Date(profile.created_at).toLocaleDateString('vi-VN') : 'Không rõ';
                    if (bioContent) {
                        bioContent.innerHTML = `<span class="text-gray-700 font-medium leading-relaxed">Tài khoản tạo vào ngày <b>${createDateStr}</b>.</span>`;
                    }
                    if (bioControls) {
                        bioControls.classList.add('hidden');
                        bioControls.classList.remove('flex');
                    }
                    const favContainer = document.getElementById('profile-fav-photo-container');
                    const favControls = document.getElementById('profile-fav-photo-controls');
                    const btnAddFav = document.getElementById('btn-add-fav-photo');
                    const placeholderWrap = document.getElementById('fav-photo-placeholder'); 
                    if (profile.favorite_photo_id) {
                        window.sb.from('photos').select('id, url').eq('id', profile.favorite_photo_id).single()
                        .then(({data: favPhoto}) => {
                            if (favPhoto) {
                                placeholderWrap.classList.add('hidden');
                                placeholderWrap.classList.remove('flex');
                                favContainer.innerHTML = `
                                    <img loading="lazy" decoding="async" src="${app.utils.getProxiedUrl(favPhoto.url, 'fav.jpg', 'thumb')}" class="absolute inset-0 w-full h-full object-cover cursor-pointer transition-transform duration-700 pointer-events-auto" onclick="app.views.loadDetail(${favPhoto.id})">
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
                            placeholderWrap.classList.add('hidden');
                            placeholderWrap.classList.remove('flex');
                        } else {
                            placeholderWrap.classList.remove('hidden');
                            placeholderWrap.classList.add('flex');
                            btnAddFav.classList.add('hidden');
                        }
                    }
                    const likedSection = document.getElementById('acc-liked-section');
                    const reportBtn = document.getElementById('btn-report-profile');
                    const editProfileBtn = document.getElementById('btn-edit-profile');
                    const shareProfileBtn = document.getElementById('btn-share-profile');
                    const manageCommentBtn = document.getElementById('btn-manage-comments'); 
                    if (shareProfileBtn) {
                        shareProfileBtn.onclick = () => app.utils.shareProfile(targetUserId, displayUsername);
                    }
                    
                    const contactBtn = document.getElementById('btn-contact-profile');
                    if (contactBtn) {
                        const preferences = profile.preferences || {};
                        if (preferences.contact_email && !isBannedUser) {
                            contactBtn.classList.remove('hidden');
                            contactBtn.classList.add('flex');
                            contactBtn.onclick = () => {
                                const emailEscaped = app.utils.escapeHtml(preferences.contact_email);
                                const copyBoxHtml = `
                                    <p class="text-sm text-gray-600 mb-3">Liên hệ với <b>${app.utils.escapeHtml(displayUsername)}</b>:</p>
                                    <div class="flex flex-col sm:flex-row gap-2">
                                        <input type="text" readonly value="${emailEscaped}" class="w-full border border-gray-300 py-3 px-3.5 text-xs md:text-sm rounded-xl bg-gray-50 font-mono text-center text-black select-all outline-none font-bold shadow-inner">
                                        <button onclick="navigator.clipboard.writeText('${emailEscaped}').then(()=>app.toast.show('success', 'Thành công', 'Đã copy email liên hệ!'))" class="w-full sm:w-auto bg-black text-white px-5 py-3 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-gray-800 transition shrink-0 flex items-center justify-center gap-2 shadow-sm">
                                            <i class="fa-solid fa-copy"></i> Sao chép
                                        </button>
                                    </div>
                                    <div class="mt-5 text-center">
                                        <button onclick="app.ui.closeAlert(false); app.views.loadContact()" class="text-[10px] text-red-500 hover:text-red-700 font-bold items-center gap-1 transition">
                                            <i class="fa-solid fa-flag"></i> Báo cáo sai phạm
                                        </button>
                                    </div>
                                `;
                                app.ui.showAlert(
                                    copyBoxHtml,
                                    () => { window.location.href = `mailto:${preferences.contact_email}`; },
                                    null,
                                    { title: "Thông tin liên hệ", btnOkText: 'Gửi email <i class="fa-solid fa-arrow-up-right-from-square ml-1.5 text-xs"></i>', btnCancelText: "Đóng" }
                                );
                            };
                        } else {
                            contactBtn.classList.add('hidden');
                            contactBtn.classList.remove('flex');
                            contactBtn.onclick = null;
                        }
                    }
                    
                    if (isOwnProfile && document.getElementById('set-contact-email')) {
                        const preferences = profile.preferences || {};
                        document.getElementById('set-contact-email').value = preferences.contact_email || '';
                    }
                    if (isOwnProfile) {
                        likedSection.classList.remove('hidden');
                        reportBtn.classList.add('hidden');
                        if (editProfileBtn) {
                            if (isBannedUser) { editProfileBtn.classList.add('hidden'); editProfileBtn.classList.remove('flex'); }
                            else { editProfileBtn.classList.remove('hidden'); editProfileBtn.classList.add('flex'); }
                        }
                        if (document.getElementById('btn-detailed-stats')) document.getElementById('btn-detailed-stats').classList.remove('hidden');
                        if (manageCommentBtn) {
                            if (isBannedUser) manageCommentBtn.classList.add('hidden');
                            else manageCommentBtn.classList.remove('hidden');
                        }
                        document.getElementById('profile-stats-title').innerText = "THỐNG KÊ HOẠT ĐỘNG";
                        document.getElementById('profile-photos-title').innerText = "Ảnh của bạn";
                    } else {
                        likedSection.classList.add('hidden');
                        reportBtn.classList.toggle('hidden', isBannedUser);
                        if (editProfileBtn) { editProfileBtn.classList.add('hidden'); editProfileBtn.classList.remove('flex'); }
                        if (document.getElementById('btn-detailed-stats')) document.getElementById('btn-detailed-stats').classList.add('hidden');
                        if (manageCommentBtn) manageCommentBtn.classList.add('hidden');
                        document.getElementById('profile-stats-title').innerText = "THỐNG KÊ CỦA " + displayUsername.toUpperCase();
                        document.getElementById('profile-photos-title').innerText = "Ảnh đã đăng";
                    }
                    document.getElementById('my-stat-photos').innerHTML = '<i class="fa-solid fa-spinner fa-spin text-gray-400"></i>';
                    document.getElementById('my-stat-views').innerHTML = '<i class="fa-solid fa-spinner fa-spin text-gray-400"></i>';
                    document.getElementById('my-stat-likes').innerHTML = '<i class="fa-solid fa-spinner fa-spin text-gray-400"></i>';
                    
                    // 1. CHẠY NGẦM THỐNG KÊ (BỎ AWAIT)
                    window.sb.rpc('get_user_profile_stats', { target_user_id: targetUserId, is_own_profile: isOwnProfile })
                        .then(({ data: stats, error: statsError }) => {
                            if (!statsError && stats && stats.length > 0) {
                                document.getElementById('my-stat-photos').innerText = app.utils.formatCompact(stats[0].total_photos);
                                document.getElementById('my-stat-views').innerText = app.utils.formatCompact(stats[0].total_views);
                                document.getElementById('my-stat-likes').innerText = app.utils.formatCompact(stats[0].total_likes);
                            } else {
                                document.getElementById('my-stat-photos').innerText = '0';
                                document.getElementById('my-stat-views').innerText = '0';
                                document.getElementById('my-stat-likes').innerText = '0';
                            }
                        });

                    if (isOwnProfile) {
                        // Cảnh báo xóa ảnh
                        window.sb.from('photos')
                            .select('id, license_plate, audit_date')
                            .eq('uploader_id', app.currentProfileId)
                            .eq('status', 'denied')
                            .neq('url', 'https://cdn.vnbusarchive.io.vn/file/daonguyenthanhnhan')
                            .not('audit_date', 'is', null)
                            .then(({ data, error }) => {
                                const alertBox = document.getElementById('profile-pending-deletion-alert');
                                if (!alertBox) return;
                                if (error || !data || data.length === 0) {
                                    alertBox.classList.add('hidden');
                                    return;
                                }
                                const now = new Date();
                                now.setHours(0,0,0,0);
                                const expiringPhotos = data.filter(p => {
                                    const auditDate = new Date(p.audit_date);
                                    auditDate.setDate(auditDate.getDate() + 7);
                                    const expiryDate = new Date(auditDate);
                                    expiryDate.setHours(0,0,0,0);
                                    return (expiryDate - now) >= 0; 
                                }).sort((a, b) => new Date(b.audit_date) - new Date(a.audit_date));
                                if (expiringPhotos.length > 0) {
                                    let html = 'Bạn có ảnh ';
                                    const links = expiringPhotos.map(p => `<a href="javascript:void(0)" onclick="app.views.loadDetail('${p.id}')" class="font-bold underline hover:text-red-900">${app.utils.displayPlate(p.license_plate)}</a>`);
                                    if (links.length === 1) html += links[0];
                                    else if (links.length === 2) html += links.join(' và ');
                                    else { const last = links.pop(); html += links.join(', ') + ' và ' + last; }
                                    html += ' bị từ chối và sắp tự động xóa! Vui lòng kiểm tra và gửi yêu cầu kháng cáo trước thời hạn này. Sau khi ảnh bị xóa, bạn sẽ không thể thực hiện kháng cáo.';
                                    document.getElementById('profile-pending-deletion-alert-text').innerHTML = html;
                                    alertBox.classList.remove('hidden');
                                } else {
                                    alertBox.classList.add('hidden');
                                }
                            });
                    } else {
                        const alertBox = document.getElementById('profile-pending-deletion-alert');
                        if (alertBox) alertBox.classList.add('hidden');
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
                    
                    // 2. GỌI ĐỒNG LOẠT CÁC LƯỚI ẢNH (BỎ AWAIT ĐỂ CHẠY SONG SONG)
                    app.views.fetchProfilePhotosPage(app.profilePage || 1);
                    
                    if (isOwnProfile) {
                        app.views.fetchLikedPhotosPage(app.likedPage || 1);
                        app.views.fetchProfileRequests(1);
                    } else {
                        const reqSec = document.getElementById('my-requests-section');
                        if (reqSec) reqSec.classList.add('hidden');
                        const likedSec = document.getElementById('acc-liked-section');
                        if (likedSec) likedSec.classList.add('hidden');
                    }
                    
                    app.lastLoadedUsername = targetUsername;
                    app.loadingBar.finish(); // Dừng thanh bar trên cùng ngay lập tức, nhường lại màn hình cho các ô tự quay.
                },
                fetchProfilePhotosPage: async (page) => {
                    app.profilePage = page;
                    const size = app.PROFILE_PAGE_SIZE || 12;
                    const fromRow = (page - 1) * size;
                    const toRow = fromRow + size - 1;
                    const grid = document.getElementById('my-photos-grid');
                    const cacheKey = `${app.currentProfileId}_${app.views.currentProfileFilter}_${app.views.currentProfileSort}_${page}`;
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
                    let photos, count, error;
                    if (app.views.currentProfileSort === 'most_liked') {
                        let allQuery = window.sb.from('photos').select('id, url, status, views, license_plate, review_progress').eq('uploader_id', app.currentProfileId);
                        if (!app._isOwnProfile) allQuery = allQuery.eq('status', 'approved');
                        else if (app.views.currentProfileFilter !== 'all') allQuery = allQuery.eq('status', app.views.currentProfileFilter);
                        allQuery = app.preference.applyFilter(allQuery);
                        const { data: allPhotos, error: allErr } = await allQuery;
                        error = allErr;
                        if (!error && allPhotos && allPhotos.length > 0) {
                            const photoIds = allPhotos.map(p => p.id);
                            const likeCountMap = {};
                            for (let i = 0; i < photoIds.length; i += 300) {
                                const chunk = photoIds.slice(i, i + 300);
                                const { data: likeRows } = await window.sb.from('photo_likes').select('photo_id').in('photo_id', chunk);
                                (likeRows || []).forEach(r => {
                                    likeCountMap[r.photo_id] = (likeCountMap[r.photo_id] || 0) + 1;
                                });
                            }
                            allPhotos.sort((a, b) => {
                                const likesA = likeCountMap[a.id] || 0;
                                const likesB = likeCountMap[b.id] || 0;
                                if (likesB !== likesA) return likesB - likesA;
                                return (b.views || 0) - (a.views || 0);
                            });
                            count = allPhotos.length;
                            photos = allPhotos.slice(fromRow, toRow + 1);
                        }
                    } else {
                        let query = window.sb.from('photos').select('id, url, status, views, license_plate, review_progress', { count: 'estimated' }).eq('uploader_id', app.currentProfileId);
                        if (!app._isOwnProfile) query = query.eq('status', 'approved');
                        else if (app.views.currentProfileFilter !== 'all') query = query.eq('status', app.views.currentProfileFilter);
                        query = app.preference.applyFilter(query);
                        if (app.views.currentProfileSort === 'newest') query = query.order('id', { ascending: false });
                        else if (app.views.currentProfileSort === 'popular') query = query.order('views', { ascending: false, nullsFirst: false });
                        const res = await query.range(fromRow, toRow);
                        photos = res.data;
                        count = res.count;
                        error = res.error;
                    }
                    if (error || !photos || photos.length === 0) {
                        grid.style.opacity = '1';
                        grid.style.pointerEvents = 'auto';
                        grid.innerHTML = '<p class="text-xs text-gray-500 col-span-4 text-center py-4">Chưa có ảnh nào.</p>';
                        const pagerEl = document.getElementById('profile-pager');
                        if (pagerEl) pagerEl.innerHTML = '';
                        return;
                    }
                    app.views._profileCache[cacheKey] = { photos, count };
                    app.views.renderProfileGridHTML(photos, count, page);
                },
                renderProfileGridHTML: async (photos, count, page) => {
                    await app.utils.resolveSandboxUrls(photos);
                    const grid = document.getElementById('my-photos-grid');
                    grid.style.opacity = '1';
                    grid.style.pointerEvents = 'auto';
                    grid.innerHTML = photos.map(p => {
                        let footerStyleClasses = "absolute bottom-2 left-2 bg-white/90 text-gray-900 text-[10px] rounded-md pl-1.5 pr-2.5 h-[28px] flex items-center backdrop-blur-md shadow-sm font-medium transition-all duration-300 max-w-[calc(100%-1rem)] inline-flex";
                        let cardStyleClasses = "profile-photo-item cursor-pointer group relative bg-gray-100 rounded-md overflow-hidden border border-gray-200 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300";
                        let textHtml = `<span class="block truncate">${app.utils.cleanText(app.utils.displayPlate(p.license_plate))}</span>`;
                        
                        if (app._isOwnProfile) {
                            let dotColor = '';
                            let mainText = app.utils.cleanText(app.utils.displayPlate(p.license_plate));

                            if (p.status === 'approved') {
                                dotColor = 'bg-green-500';
                            } else if (p.status === 'pending') {
                                dotColor = 'bg-[#f58e27]';
                            } else if (p.status === 'denied') {
                                dotColor = 'bg-red-500';
                            }

                            if (dotColor) {
                                textHtml = `
                                    <span class="w-2 h-2 rounded-full ${dotColor} shrink-0 mr-1.5 block"></span>
                                    <div class="flex-1 min-w-0">
                                        <span class="truncate block font-bold">${mainText}</span>
                                    </div>
                                `;
                            }
                        }
                        const proxyUrl = app.utils.getProxiedUrl(p.url, 'profile.jpg', 'thumb');
                        if (p.url === 'https://cdn.vnbusarchive.io.vn/file/daonguyenthanhnhan') {
                            return `
                                <div class="${cardStyleClasses}" onclick="app.views.loadDetail('${p.id}')">
                                    <div class="w-full h-full bg-gray-500 flex flex-col items-center justify-center p-2 text-center text-white select-none">
                                        <i class="fa-solid fa-clock-rotate-left text-xl text-gray-300 mb-1"></i>
                                        <span class="font-bold text-xs tracking-wider">${app.utils.cleanText(app.utils.displayPlate(p.license_plate))}</span>
                                        <span class="text-[10px] text-gray-200 mt-0.5">Ảnh đã bị xóa</span>
                                    </div>
                                    <div class="${footerStyleClasses}">
                                        ${textHtml}
                                    </div>
                                </div>
                            `;
                        } else if (proxyUrl === 'SANDBOX_DELETED' || p._isSandboxMissing) {
                            return `
                                <div class="${cardStyleClasses}" onclick="app.views.loadDetail('${p.id}')">
                                    <div class="w-full h-full bg-gray-500 flex flex-col items-center justify-center p-2 text-center text-white select-none">
                                        <i class="fa-solid fa-clock-rotate-left text-xl text-gray-300 mb-1"></i>
                                        <span class="font-bold text-xs tracking-wider">${app.utils.cleanText(app.utils.displayPlate(p.license_plate))}</span>
                                        <span class="text-[10px] text-gray-200 mt-0.5">Ảnh không khả dụng</span>
                                    </div>
                                    <div class="${footerStyleClasses}">
                                        ${textHtml}
                                    </div>
                                </div>
                            `;
                        }
                        return `
                            <div class="${cardStyleClasses}" onclick="app.views.loadDetail('${p.id}')">
                                <img loading="lazy" decoding="async" src="${proxyUrl}" class="w-full h-full object-cover">
                                <div class="${footerStyleClasses}">
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
                fetchProfileRequests: async (page = 1) => {
                    const grid = document.getElementById('my-requests-grid');
                    if (!app.user) return;
                    if (page === 1) grid.innerHTML = '<p class="text-xs text-gray-500 col-span-full text-center py-10"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải dữ liệu...</p>';
                    const pageSize = 12;
                    const fromRow = (page - 1) * pageSize;
                    const toRow = fromRow + pageSize - 1;
                    try {
                        const { data: reqs, error, count } = await window.sb.from('edit_requests')
                            .select('*', { count: 'estimated' })
                            .eq('requester_id', app.user.id)
                            .order('created_at', { ascending: false })
                            .range(fromRow, toRow);
                        if (error) throw error;
                        app.views.renderProfileRequestsGridHTML(reqs, count, page);
                    } catch (err) {
                        console.error(err);
                        grid.innerHTML = '<p class="text-xs text-red-500 col-span-full text-center py-4">Lỗi tải dữ liệu.</p>';
                    }
                },
                renderProfileRequestsGridHTML: (requests, count, page) => {
                    const grid = document.getElementById('my-requests-grid');
                    const section = document.getElementById('my-requests-section');
                    if (!requests || requests.length === 0) {
                        if (page === 1) {
                            section.classList.add('hidden');
                        } else {
                            grid.innerHTML = '<p class="text-xs text-gray-500 col-span-full text-center py-4">Không có dữ liệu.</p>';
                        }
                        let pagerEl = document.getElementById('requests-pager');
                        if (pagerEl) pagerEl.innerHTML = '';
                        return;
                    }
                    section.classList.remove('hidden');
                    const reqTypeMap = {
                        'update_history': 'sửa lịch sử',
                        'delete_photo': 'xóa ảnh',
                        'update_vehicle_details': 'sửa chi tiết xe',
                        'update_vehicle_info': 'sửa thông tin xe',
                        'update_operator_info': 'sửa thông tin nhà xe',
                        'update_model_info': 'sửa thông tin dòng xe'
                    };
                    grid.innerHTML = requests.map(req => {
                        let cardStyleClasses = "cursor-pointer transition-all duration-300 relative flex flex-row items-center p-3 text-left bg-white rounded-xl border border-gray-200 shadow-md hover:-translate-y-1 hover:shadow-xl";
                        let typeText = reqTypeMap[req.new_data?.request_type] || 'khác';
                        let contextText = '';
                        if (req.new_data?.request_type === 'delete_photo' && req.new_data?.photo_id) {
                            contextText = `Ảnh ${req.new_data.photo_id} ${req.license_plate ? '- ' + req.license_plate : ''}`;
                        } else if (req.license_plate) {
                            contextText = req.license_plate;
                        } else if (req.new_data?.operator_name) {
                            contextText = req.new_data.operator_name;
                        } else if (req.new_data?.model_name) {
                            contextText = req.new_data.model_name;
                        }
                        let dotHtml = '';
                        if (req.status === 'approved') {
                            dotHtml = '<span class="w-2 h-2 rounded-full bg-green-500 shrink-0 block mr-3"></span>';
                        } else if (req.status === 'pending') {
                            dotHtml = '<span class="w-2 h-2 rounded-full bg-[#f58e27] shrink-0 block mr-3"></span>';
                        } else if (req.status === 'denied' || req.status === 'rejected') {
                            dotHtml = '<span class="w-2 h-2 rounded-full bg-red-500 shrink-0 block mr-3"></span>';
                        }
                        if (!app.views._requestsCache) app.views._requestsCache = {};
                        app.views._requestsCache[req.id] = req;
                        return `
                            <div class="${cardStyleClasses}" onclick="app.views.showRequestDetails('${req.id}')">
                                ${dotHtml}
                                <div class="flex-1 min-w-0 flex flex-col justify-center">
                                    <span class="truncate font-bold text-gray-900 text-sm leading-tight mb-0.5">Yêu cầu ${typeText}</span>
                                    ${contextText ? `<span class="block text-gray-500 text-xs tracking-wide w-full truncate">${app.utils.cleanText(contextText)}</span>` : '<span class="block text-gray-400 text-xs tracking-wide w-full truncate">Hệ thống</span>'}
                                </div>
                            </div>
                        `;
                    }).join('');
                    const size = 12;
                    const totalPages = Math.ceil(count / size);
                    let pagerEl = document.getElementById('requests-pager');
                    if (!pagerEl) {
                        pagerEl = document.createElement('div');
                        pagerEl.id = 'requests-pager';
                        grid.parentNode.insertBefore(pagerEl, grid.nextSibling);
                    }
                    if (totalPages <= 1) { pagerEl.innerHTML = ''; return; }
                    pagerEl.innerHTML = `<div id="requests-pagination-container" class="mt-4 w-full"></div><p class="text-center text-[10px] text-gray-400 mt-3">Trang ${page}/${totalPages} · Tổng ${count} yêu cầu</p>`;
                    app.utils.renderPagination('requests-pagination-container', page, totalPages, (newPage) => app.views.fetchProfileRequests(newPage));
                },
                showRequestDetails: (id) => {
                    const req = app.views._requestsCache?.[id];
                    if (!req) return;
                    const reqTypeMap = {
                        'update_history': 'Sửa lịch sử',
                        'delete_photo': 'Xóa ảnh',
                        'update_vehicle_details': 'Sửa thông tin chi tiết xe',
                        'update_vehicle_info': 'Sửa thông tin xe',
                        'update_operator_info': 'Sửa thông tin nhà xe',
                        'update_model_info': 'Sửa thông tin dòng xe'
                    };
                    let statusHtml = '';
                    if (req.status === 'approved') statusHtml = '<span class="text-green-600 font-bold bg-green-50 border border-green-200 px-2 py-0.5 rounded text-xs">Đã duyệt</span>';
                    else if (req.status === 'pending') statusHtml = '<span class="text-orange-500 font-bold bg-orange-50 border border-orange-200 px-2 py-0.5 rounded text-xs">Đang chờ</span>';
                    else statusHtml = '<span class="text-red-500 font-bold bg-red-50 border border-red-200 px-2 py-0.5 rounded text-xs">Từ chối</span>';
                    let contextText = '';
                    if (req.new_data?.request_type === 'delete_photo' && req.new_data?.photo_id) {
                        contextText = `Ảnh ${req.new_data.photo_id} ${req.license_plate ? '- ' + req.license_plate : ''}`;
                    } else if (req.license_plate) {
                        contextText = req.license_plate;
                    } else if (req.new_data?.operator_name) {
                        contextText = req.new_data.operator_name;
                    } else if (req.new_data?.model_name) {
                        contextText = req.new_data.model_name;
                    }
                    let detailsHtml = `
                        <div class="flex justify-between items-center mb-3">
                            <span class="text-gray-500 font-medium">Trạng thái:</span>
                            ${statusHtml}
                        </div>
                        <div class="flex justify-between items-center mb-3">
                            <span class="text-gray-500 font-medium">Loại yêu cầu:</span>
                            <span class="font-bold text-gray-800 text-right">${reqTypeMap[req.new_data?.request_type] || 'Khác'}</span>
                        </div>
                        <div class="flex justify-between items-center mb-3">
                            <span class="text-gray-500 font-medium">Đối tượng:</span>
                            <span class="font-bold text-gray-800 text-right">${contextText ? app.utils.cleanText(contextText) : 'Hệ thống'}</span>
                        </div>
                        <div class="flex justify-between items-center mb-3">
                            <span class="text-gray-500 font-medium">Ngày tạo:</span>
                            <span class="text-gray-700 text-right">${new Date(req.created_at).toLocaleString('vi-VN')}</span>
                        </div>
                    `;
                    if (req.new_data?.reason) {
                        detailsHtml += `
                            <div class="mt-4 text-left">
                                <span class="text-gray-500 font-medium block mb-1">Lý do/Ghi chú:</span>
                                <div class="bg-gray-50 p-2.5 rounded border border-gray-100 text-gray-700 italic text-sm">
                                    ${app.utils.cleanText(req.new_data.reason)}
                                </div>
                            </div>
                        `;
                    }
                    if (req.admin_note) {
                        detailsHtml += `
                            <div class="mt-4 text-left">
                                <span class="text-gray-500 font-medium block mb-1">Ghi chú của Admin:</span>
                                <div class="bg-gray-50 p-2.5 rounded border border-gray-100 text-gray-700 italic text-sm">
                                    ${app.utils.cleanText(req.admin_note)}
                                </div>
                            </div>
                        `;
                    }
                    if (req.status === 'pending') {
                        app.ui.showAlert(detailsHtml, () => {
                            app.views.cancelRequest(id);
                        }, () => {}, { 
                            title: 'Chi tiết yêu cầu', 
                            iconHtml: '<i class="fa-solid fa-file-invoice text-xl text-black"></i>',
                            btnOkText: 'Hủy yêu cầu',
                            btnCancelText: 'Đồng ý',
                            isDestructive: true,
                            isCancelPrimary: true
                        });
                    } else {
                        app.ui.showAlert(detailsHtml, null, null, { 
                            title: 'Chi tiết yêu cầu',
                            iconHtml: '<i class="fa-solid fa-file-invoice text-xl text-black"></i>'
                        });
                    }
                },
                cancelRequest: async (id) => {
                    const req = app.views._requestsCache?.[id];
                    if (!req || req.status !== 'pending') return;
                    app.ui.showAlert("Bạn có chắc chắn muốn hủy yêu cầu này không? Hành động này không thể hoàn tác.", async () => {
                        try {
                            const { error } = await window.sb.from('edit_requests').delete().eq('id', id).eq('requester_id', app.user.id);
                            if (error) throw error;
                            app.views.fetchProfileRequests(1);
                            app.ui.showAlert("Đã hủy yêu cầu thành công!", null, null, { title: 'Thành công' });
                        } catch (err) {
                            console.error(err);
                            app.ui.showAlert("Lỗi khi hủy yêu cầu: " + err.message);
                        }
                    }, () => {}, { title: "Xác nhận hủy", btnOkText: "Xác nhận", btnCancelText: "Hủy bỏ" });
                },
                fetchLikedPhotosPage: async (page) => {
                    app.likedPage = page;
                    const size = app.PROFILE_PAGE_SIZE || 12;
                    const fromRow = (page - 1) * size;
                    const toRow = fromRow + size - 1;
                    const grid = document.getElementById('liked-photos-grid');
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
                    let query = window.sb.from('photo_likes').select('photo_id, photos!inner(id, url, license_plate, operator, type)', { count: 'estimated' }).eq('user_id', app.user.id).order('created_at', { ascending: false });
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
                        <div class="profile-photo-item cursor-pointer group relative bg-gray-100 rounded-md overflow-hidden border border-gray-200 shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300" onclick="app.views.loadDetail(${p.id})">
                            <img loading="lazy" decoding="async" src="${app.utils.getProxiedUrl(p.url, 'liked.jpg', 'thumb')}" class="w-full h-full object-cover">
                            <div class="absolute bottom-2 left-2 bg-white/90 text-gray-900 text-[10px] rounded-md px-2 h-[28px] flex items-center backdrop-blur-md shadow-sm font-medium max-w-[calc(100%-1rem)] inline-flex">
                                <span class="truncate w-full">${app.utils.displayPlate(p.license_plate)} - ${p.operator || 'N/A'}</span>
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
                    app.views.switch('detail', false);
                    if (app.currentPhoto && String(app.currentPhoto.id) === String(photoId) && !forceRefresh) {
                        app.loadingBar.finish();
                        return;
                    }
                    document.getElementById('detail-title').innerText = 'Đang tải dữ liệu...';
                    document.getElementById('crumb-model').innerText = '...';
                    const btnToggleEdit = document.getElementById('btn-toggle-edit');
                    if (btnToggleEdit) btnToggleEdit.disabled = true;
                    const imgEl = document.getElementById('detail-img');
                    if (imgEl) {
                        imgEl.onload = null;
                        imgEl.onerror = null;
                        imgEl.style.opacity = '0';
                        imgEl.style.pointerEvents = 'none';
                        imgEl.removeAttribute('src'); 
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
                    const detailCopyright = document.getElementById('detail-copyright');
                    if (detailCopyright) detailCopyright.innerHTML = '...';
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
                    let { data: photo } = await window.sb
                        .from('photos')
                        .select(`id, url, license_plate, operator, type, route_no, taken_at, created_at, uploader_id, note, exif_params, borrowed_route, camera_model, location, status, denial_reason, audit_date, views, review_progress, reviewer_count, profiles(id, username, avatar_url, role, subroles, ban_status, preferences), vehicles(model)`)
                        .eq('id', photoId)
                        .single();
                    if (!photo && app.user) {
                        try {
                            const sessionRes = await window.sb.auth.getSession();
                            const token = sessionRes.data.session?.access_token;
                            if (token) {
                                const apiRes = await fetch(`/api/photo?id=${photoId}`, {
                                    headers: { 'Authorization': `Bearer ${token}` }
                                });
                                if (apiRes.ok) {
                                    const apiJson = await apiRes.json();
                                    if (apiJson && apiJson.data) photo = apiJson.data;
                                }
                            }
                        } catch(e) { console.warn('Lỗi tải chi tiết ảnh qua backend API:', e); }
                    }
                    if (window.location.pathname !== `/photo/${photoId}`) return;
                    if (!photo) {
                        app.ui.showAlert("Ảnh không tồn tại hoặc đã bị xóa khỏi hệ thống.");
                        return app.views.loadHome();
                    }
                    app.currentPhoto = photo;
                    app.currentPlate = photo.license_plate;
                    if (btnToggleEdit) btnToggleEdit.disabled = false;
                    await app.utils.resolveSandboxUrls([photo]);
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
                            document.getElementById('pending-status-box').classList.add('hidden');
                            document.getElementById('denial-reason-box').classList.add('hidden');
                            document.getElementById('denial-delete-warning-box').classList.add('hidden');
                            document.getElementById('denial-improvement-box').classList.add('hidden');
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
                        if (photo.audit_date && photo.url !== 'https://cdn.vnbusarchive.io.vn/file/daonguyenthanhnhan') {
                            const auditDate = new Date(photo.audit_date);
                            auditDate.setDate(auditDate.getDate() + 7);
                            const dateStr = auditDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const expiryDate = new Date(auditDate);
                            expiryDate.setHours(0, 0, 0, 0);
                            const diffTime = expiryDate - today;
                            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
                            let countdownStr = '';
                            if (diffDays > 0) {
                                countdownStr = ` (${diffDays} ngày nữa)`;
                            } else if (diffDays === 0) {
                                countdownStr = ` (hôm nay)`;
                            } else {
                                countdownStr = ` (đã quá hạn)`;
                            }
                            document.getElementById('denial-delete-date').innerText = dateStr + countdownStr;
                            document.getElementById('denial-delete-warning-box').classList.remove('hidden');
                        }
                        const suggestBox = document.getElementById('denial-improvement-box');
                        const suggestContent = document.getElementById('denial-improvement-content');
                        if (suggestBox && suggestContent) {
                            const suggestionsMap = {
                                'B1.1': 'Thư viện của chúng ta hiện chỉ lưu trữ dữ liệu các phương tiện mang biển số và hoạt động tại Việt Nam. Nếu bạn bắt gặp những chiếc xe đẹp ở nước ngoài, hãy giữ lại làm kỷ niệm cá nhân thay vì tải lên hệ thống nhé. Lần tới đi tác nghiệp, bạn để ý chút đến biển số là ổn ngay!',
                                'B1.2': 'Mẹo nhỏ để bạn không mất công tác nghiệp: Hãy bỏ qua các xe mang biển Xanh hoặc Đỏ, xe gia đình và ĐẶC BIỆT là các xe đang gặp tai nạn, va chạm. Với xe khách, bạn cứ nhắm vào các xe có logo/tên nhà xe lớn, hoặc có bảng LED/mica chạy tuyến cố định rõ ràng.',
                                'B1.3': 'Bối cảnh phía sau tôn lên vẻ đẹp của xe rất nhiều! Lần tới, bạn thử nán lại chờ xe đi qua những đoạn đường gọn gàng, sạch sẽ hơn nhé. Tránh bấm máy vội vã lúc xe chạy ngang bãi rác hoặc khu vực quá lộn xộn. Một hậu cảnh đẹp sẽ làm bức ảnh của bạn giá trị hơn hẳn đấy.',
                                'B1.4': 'Thư viện luôn tìm kiếm những bức ảnh có góc nhìn sinh động và ánh sáng hài hòa. Thay vì bấm máy vội để lấy số lượng, bạn hãy chăm chút thêm cho khung hình nhé. Chọn thời điểm ban ngày đủ sáng, canh góc sao cho tôn được dáng xe. Một bức ảnh có hồn chắc chắn sẽ mang lại giá trị lưu trữ tuyệt vời!',
                                'B2.1': 'Hơi tiếc một chút vì chiếc xe chưa nằm trọn vẹn trong ảnh. Lần tới, bạn nhớ thu nhỏ (zoom out) màn hình lại hoặc lùi ra sau một vài bước nhé. Hãy chừa một khoảng lề an toàn xung quanh xe, đảm bảo các chi tiết lồi ra như gương chiếu hậu, cục điều hòa trên nóc hay bánh xe không bị viền ảnh cắt cụt mất.',
                                'B2.2': 'Bức ảnh này xe đang bị lệch trọng tâm một chút. Để căn giữa chuẩn xác không trượt phát nào, bạn hãy dùng công cụ Thước ngang có sẵn trên web nhé! Mẹo canh như sau: Bạn xác định 2 mép ngoài cùng (trái/phải) của thân xe (không tính gương chiếu hậu), rồi chỉnh sao cho khoảng cách từ 2 mép này tới vạch tâm (0) của thước bằng nhau. Nhớ lưu ý: Dù không tính vào điểm canh mép, nhưng gương chiếu hậu vẫn phải nằm trọn trong ảnh, và tổng thể xe đừng để bị quá gần hay quá xa khung hình nhé.',
                                'B2.3': 'Khung hình đang hơi nghiêng so với thực tế rồi. Khi chụp, bạn để ý lấy mặt đường, cột điện hay tòa nhà phía sau làm chuẩn để giữ thẳng máy nhé. Nếu lỡ tay chụp nghiêng, bạn hoàn toàn có thể dùng công cụ Cắt/Xoay ảnh tích hợp sẵn trên web (hoặc chỉnh từ điện thoại) để cân bằng lại đường chân trời và đưa về tỷ lệ chuẩn (4:3, 3:2, 16:9) trước khi đăng tải.',
                                'B2.4': 'Chụp chính diện ngay đầu hoặc đuôi xe sẽ khó nhận diện được toàn bộ thiết kế. Lần tới, bạn thử chọn góc chếch (góc 3/4) xem sao nhé. Cứ chờ xe tiến lại gần hoặc chuẩn bị đi qua rồi bấm máy, như vậy ảnh sẽ lấy được cả mặt trước/sau và sườn xe, trông vừa mượt mắt lại vừa đúng chuẩn.',
                                'B2.5': 'Kiên nhẫn thêm một chút là có ảnh xịn ngay! Khi bấm máy, bạn cố gắng căn khoảnh khắc giao thông thông thoáng, không có xe máy, người đi đường hay cột điện vướng vào thân xe nhé. Chọn vị trí đứng thoáng đãng một chút sẽ giúp chủ thể xuất hiện trọn vẹn và đẹp mắt hơn rất nhiều.',
                                'B3.1': 'Bức ảnh đang hơi mờ nhòe hoặc thiếu sáng. Để cải thiện, bạn nhớ giữ chắc tay máy, chạm tay vào màn hình để khóa nét (focus) vào thân xe. Nên ưu tiên đi chụp vào ban ngày và đứng ở hướng thuận chiều ánh sáng. Nếu xe đang chạy nhanh, bạn thử tập kỹ năng lia máy (panning) theo tốc độ xe để ảnh sắc nét hơn nhé.',
                                'B3.2': 'Hệ thống đề cao vẻ đẹp nguyên bản và chân thực. Bạn cứ tự tin đăng tải trực tiếp ảnh gốc từ máy ảnh/điện thoại nhé. Tuyệt đối không dùng các app có AI làm nét (như Remini, Xingtu...) vì chúng hay làm bóp méo, biến dạng chữ và logo trên xe. Nếu ảnh gốc lỡ bị mờ, cách tốt nhất là chúng ta đi "săn" lại ở lần sau!',
                                'B3.4': 'Bạn hãy tải lên bức ảnh nguyên bản và sạch sẽ nhất nhé! Tuyệt đối không dùng app để chèn tên, logo cá nhân, và nhớ tắt cả tính năng tự đóng dấu watermark của camera điện thoại (ví dụ: chữ "Shot on..."). Bạn yên tâm, khi ảnh được duyệt, hệ thống sẽ tự động đóng dấu bản quyền xịn sò của VNBUSARCHIVE để bảo vệ tác phẩm cho bạn.',
                                'B3.5': 'Bức ảnh đang bị móp méo và sai lệch tỷ lệ thực tế. Lỗi này thường do bạn sử dụng camera góc siêu rộng (0.5x, 0.6x...) ở khoảng cách quá gần. Để cải thiện, hãy lùi ra xa hơn một chút và sử dụng camera chính (1x) hoặc camera zoom (2x, 3x) để giữ được hình dáng nguyên bản và bề thế của xe nhé.',
                                'B4.1': 'Biển số là linh hồn của dữ liệu! Bức ảnh này biển số đang bị lóa hoặc mờ quá. Lần sau, bạn để ý đứng ở khoảng cách vừa phải, chú ý hướng nắng để biển không bị chói trắng nhé. Bạn có thể chụp thử một tấm rồi zoom màn hình lên, nếu mắt thường đọc rõ mồn một được cả chữ và số thì hẵng chốt góc đó.',
                                'B4.2': 'Bức ảnh rất nét nhưng chúng ta cần bảo vệ quyền riêng tư của bác tài và hành khách nữa. Lưu ý cực kỳ quan trọng: Tuyệt đối không dùng app ngoài để bôi xóa (hệ thống sẽ từ chối tự động ảnh có nét vẽ từ app ngoài). Bạn cứ tải ảnh gốc trong vắt lên, sau đó dùng ngay công cụ Che mờ tích hợp sẵn trên web của chúng ta để làm mờ khuôn mặt, thao tác cực nhanh và đúng chuẩn!',
                                'B4.3': 'Vùng che mờ của bạn đang bị lem ra ngoài thân xe mất rồi. Nhớ là chúng ta chỉ sử dụng công cụ Che mờ có sẵn trên web nhé! Khi thao tác trên web, bạn chịu khó phóng to ảnh lên, chỉnh cỡ ô che nhỏ lại và kéo thật khéo léo đúng vào khuôn mặt cần che. Giữ cho kính xe và khung xe thật sạch sẽ là bức ảnh sẽ hoàn hảo ngay.',
                                'B4.4': 'Khung hình của bạn đang lọt biển số của các phương tiện khác đang có hành vi vi phạm giao thông. Để bảo vệ quyền riêng tư, bạn hãy tải ảnh gốc lên và dùng công cụ Che mờ trên web để che biển số của các phương tiện vi phạm đó đi (giữ nguyên không che biển số xe lưu thông bình thường) là ảnh sẽ đạt chuẩn duyệt.',
                                'B5.1': 'Thư viện chỉ tôn vinh những tác phẩm do chính tay bạn đi tác nghiệp. Đừng tải lại ảnh từ Facebook, hội nhóm hay các diễn đàn khác về đăng dưới tên mình nhé. Mỗi bức ảnh tự chụp là một trải nghiệm đẹp, hệ thống rất mong chờ những đóng góp "chính chủ" từ bạn!',
                                'B5.2': 'Sự an toàn của bạn luôn là ưu tiên số một! Lần sau tác nghiệp, chúng ta chỉ nên đứng ở lề đường, trạm dừng hoặc bến xe công cộng thôi nhé. Tuyệt đối không tiến vào các bến bãi nội bộ, xưởng sửa chữa hay khu vực tư nhân khi chưa xin phép bảo vệ/ban quản lý ở đó để tránh những rắc rối không đáng có.',
                                'B5.3': 'Trước khi đưa máy lên chụp ở khu vực lạ, bạn dành vài giây quan sát xem có biển báo "Cấm quay phim, chụp ảnh" không nhé. Kể cả có một chiếc xe cực kỳ hiếm chạy ngang qua các khu vực như an ninh quốc gia hay doanh trại quân đội, chúng ta cũng đành hạ máy xuống để tuân thủ pháp luật thôi. Cơ hội chụp xe đẹp còn rất nhiều mà!',
                                'B5.4': 'Góc chụp này có vẻ bạn đang đứng ở vị trí hơi nguy hiểm hoặc dưới lòng đường rồi. Khi đi săn ảnh, hãy chọn vị trí an toàn trên vỉa hè hoặc cầu vượt đi bộ nhé. Tuyệt đối không cản trở luồng giao thông. Nếu xe ở xa, cứ tận dụng tính năng zoom của camera. An toàn cho bạn và mọi người xung quanh là quan trọng nhất!'
                            };
                            const codes = [];
                            const fullReasons = {};
                            if (photo.denial_reason) {
                                const regex = /\[(B\d+\.\d+)\]([^\[]*)/g;
                                let match;
                                while ((match = regex.exec(photo.denial_reason)) !== null) {
                                    const code = match[1];
                                    let reasonText = match[2].trim();
                                    // Bỏ dấu +, dấu phẩy, hoặc các ký tự phân cách thừa ở cuối
                                    reasonText = reasonText.replace(/[\+\,\;]+$/, '').trim();
                                    // Bỏ đoạn kiểu `#2:` bị dính vào do format của chuỗi tổng
                                    reasonText = reasonText.replace(/#\d+:?$/, '').trim();
                                    // Đề phòng còn dấu + nữa
                                    reasonText = reasonText.replace(/\+$/, '').trim();
                                    if (suggestionsMap[code] && !codes.includes(code)) {
                                        codes.push(code);
                                        fullReasons[code] = reasonText;
                                    }
                                }
                            }
                            if (codes.length > 0) {
                                let html = '<div class="space-y-3">';
                                codes.forEach(c => {
                                    const titleStr = fullReasons[c] ? `LỖI [${c}]: ${fullReasons[c]}` : `LỖI [${c}]:`;
                                    html += `<div class="bg-gray-50 p-3.5 md:p-4 rounded-xl border border-gray-100 shadow-inner">
                                                <span class="text-sm font-bold text-black block mb-2 leading-snug">${titleStr}</span>
                                                <p class="text-[13px] text-gray-700 leading-relaxed">${suggestionsMap[c]}</p>
                                             </div>`;
                                });
                                html += '</div>';
                                html += '<p class="text-[11px] text-gray-400 italic mt-4 flex items-start gap-1.5"><i class="fa-solid fa-circle-info mt-0.5"></i> <span>Đây là góp ý tự động, có thể sẽ không phản ánh thực tế tình trạng ảnh. Vui lòng chỉ sử dụng để tham khảo.</span></p>';
                                suggestContent.innerHTML = html;
                                suggestBox.removeAttribute('open');
                                suggestBox.classList.remove('hidden');
                            } else {
                                suggestBox.removeAttribute('open');
                                suggestBox.classList.add('hidden');
                            }
                        }
                    } else {
                        document.getElementById('denial-reason-box').classList.add('hidden');
                        const suggestBox = document.getElementById('denial-improvement-box');
                        if (suggestBox) {
                            suggestBox.removeAttribute('open');
                            suggestBox.classList.add('hidden');
                        }
                    }
                    if (isPending) {
                        document.getElementById('pending-status-box').classList.remove('hidden');
                        const queueBox = document.getElementById('pending-queue-box');
                        if (queueBox) {
                            queueBox.classList.remove('hidden');
                            document.getElementById('pending-queue-count').innerText = '...';
                            const progEl = document.getElementById('pending-review-progress');
                            if (progEl) {
                                progEl.innerText = `Ảnh của bạn đã được ${photo.review_progress || '0/2'} người duyệt.`;
                            }
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
                    const isValidViewer = !isMyOwnPhoto && !isDenied;
                    const views = isDenied ? 0 : (isValidViewer ? ((photo.views || 0) + 1) : (photo.views || 0));
                    if (isValidViewer) {
                        window.sb.from('photos').update({ views: views }).eq('id', photoId).then();
                        window.sb.from('photo_views_log').insert({
                            photo_id: photoId,
                            viewer_id: app.user ? app.user.id : null
                        }).then();
                    }
                    const pageDisplayOp = (snapshot.route_no || '').trim() === 'Dừng hoạt động' ? 'Dừng hoạt động' : (snapshot.operator || 'Đã bị xóa');
                    document.getElementById('detail-title').innerText = `${app.utils.displayPlate(photo.license_plate)} - ${pageDisplayOp}`;
                    const pageTitle = `${app.utils.displayPlate(photo.license_plate)} - ${pageDisplayOp} | VNBUSARCHIVE`;
                    const pageDesc = `Ảnh chụp chi tiết xe buýt/xe khách ${app.utils.formatPlateVariations(photo.license_plate)} thuộc đơn vị ${pageDisplayOp}, dòng xe ${snapshot.model}.`;
                    const pageImg = app.utils.getProxiedUrl(photo.url);
                    if (window.location.pathname === `/photo/${photoId}`) {
                        app.utils.updateMetaTags(pageTitle, pageDesc, pageImg);
                    }
                    document.getElementById('crumb-model').innerText = app.utils.displayPlate(photo.license_plate);
                    const proxyUrl = app.utils.getProxiedUrl(photo.url, `${app.utils.displayPlate(photo.license_plate)}.jpg`);
                    const wrapper2 = imgEl.closest('.img-wrapper');
                    const errBox2 = wrapper2 ? wrapper2.querySelector('.img-error') : null;
                    const spinner2 = wrapper2 ? wrapper2.querySelector('.img-spinner') : null;
                    if (photo.url === 'https://cdn.vnbusarchive.io.vn/file/daonguyenthanhnhan') {
                        imgEl.style.display = 'none';
                        if (spinner2) spinner2.style.display = 'none';
                        if (errBox2) {
                            errBox2.className = "img-error absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gray-200 text-gray-800 z-10 select-none rounded-md";
                            errBox2.innerHTML = `
                                <i class="fa-solid fa-clock-rotate-left text-gray-500 text-5xl mb-4"></i>
                                <p class="text-base text-gray-800 font-bold mb-2">Ảnh bị từ chối đã xóa sau 7 ngày</p>
                                <p class="text-sm text-gray-600 mb-4">Bạn sẽ không thể thực hiện kháng cáo. Bạn có thể xóa thông tin khỏi cơ sở dữ liệu bằng cách <a href="javascript:void(0)" onclick="app.photo.requestDelete()" class="font-bold underline hover:text-gray-800 cursor-pointer">Yêu cầu xóa ảnh</a>.</p>
                            `;
                            errBox2.classList.remove('hidden');
                        }
                    } else if (proxyUrl === 'SANDBOX_DELETED' || photo._isSandboxMissing) {
                        imgEl.style.display = 'none';
                        if (spinner2) spinner2.style.display = 'none';
                        if (errBox2) {
                            errBox2.className = "img-error absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gray-200 text-gray-800 z-10 select-none rounded-md";
                            errBox2.innerHTML = `
                                <i class="fa-solid fa-clock-rotate-left text-gray-500 text-5xl mb-4"></i>
                                <p class="text-base text-gray-800 font-bold mb-2">Ảnh không khả dụng (dữ liệu cũ).</p>
                                <p class="text-sm text-gray-600 mb-4">Bạn sẽ không thể kháng cáo hoặc làm hành động khác. Bạn có thể yêu cầu xóa cơ sở dữ liệu của ảnh này bằng nút "Yêu cầu xóa ảnh".</p>
                            `;
                            errBox2.classList.remove('hidden');
                        }
                    } else {
                        imgEl.style.display = 'block';
                        imgEl.style.opacity = '0';
                        if (errBox2) {
                            errBox2.className = "img-error absolute inset-0 hidden flex-col items-center justify-center p-6 text-center bg-gray-50 rounded-md";
                            errBox2.innerHTML = `
                                <i class="fa-solid fa-image-slash text-red-400 text-5xl mb-4"></i>
                                <p class="text-base text-gray-800 font-bold mb-2">Ảnh hiện không thể được tải</p>
                                <p class="text-sm text-gray-600 mb-2">Bạn có thể thử:</p>
                                <ul class="text-sm text-gray-500 text-left list-disc pl-6 mb-4">
                                    <li>Báo cáo với bộ phận CSKH để kiểm tra</li>
                                    <li>Thử lại sau ít phút</li>
                                </ul>
                                <p class="text-xs text-gray-400 italic">Bạn có thể truy cập vào <a href="https://www.vnbusarchive.io.vn/help/1519976872316764260" class="text-blue-600 hover:underline font-medium">đây</a> để tìm hiểu thêm và tham khảo các cách khắc phục. Xin cảm ơn sự thấu hiểu của bạn!</p>
                            `;
                            errBox2.classList.add('hidden');
                        }
                        if (spinner2) spinner2.style.display = 'flex';
                        imgEl.onload = () => app.utils.handleImgLoad(imgEl);
                        imgEl.onerror = () => app.utils.handleImgError(imgEl);
                        imgEl.crossOrigin = "anonymous";
                        imgEl.src = proxyUrl;
                        imgEl.alt = `Hình ảnh xe buýt ${app.utils.displayPlate(photo.license_plate)} - ${snapshot.operator || 'Đã bị xóa'}`;
                        imgEl.title = "Nhấn vào ảnh để phóng to toàn màn hình";
                        imgEl.style.cursor = 'zoom-in';
                        imgEl.onclick = () => {
                            app.admin.openZoom(proxyUrl, true);
                        };
                    }
                    const uploaderDisplay = app.utils.formatProfileDisplay(photo.profiles);
                    const safeUploaderName = app.utils.cleanText(uploaderDisplay.username);
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
                    if (elInfoRoute) {
                        elInfoRoute.value = snapshot.route_no || 'Đã bị xóa';
                        if (photo.borrowed_route) {
                            elInfoRoute.dataset.borrowed = photo.borrowed_route;
                        } else {
                            delete elInfoRoute.dataset.borrowed;
                        }
                    }
                    const lblDetailRoute = document.getElementById('lbl-detail-route');
                    if (lblDetailRoute) lblDetailRoute.innerText = snapshot.type === 'coach' ? 'Lộ trình' : 'Mã số tuyến';
                    if (elInfoRoute) app.utils.checkRouteStatus(elInfoRoute.value, 'info-operator', 'info-operator-row');
                    if (elInfoModel) elInfoModel.value = snapshot.model || 'Đã bị xóa';
                    if (elInfoLocation) {
                        elInfoLocation.value = photo.location || '---';
                        const warningEl = document.getElementById('info-interior-warning');
                        if (warningEl) {
                            if ((photo.location || '').trim() === 'Chụp trong xe') {
                                warningEl.classList.remove('hidden');
                            } else {
                                warningEl.classList.add('hidden');
                            }
                        }
                    }
                    if (elInfoNote) {
                        elInfoNote.value = photo.note || '---';
                        const elInfoNoteDisplay = document.getElementById('info-note-display');
                        if (elInfoNoteDisplay) {
                            if (photo.note) {
                                elInfoNoteDisplay.innerHTML = app.utils.linkify(app.utils.escapeAttr(photo.note));
                            } else {
                                elInfoNoteDisplay.innerText = '---';
                            }
                        }
                    }
                    const trInfoDate = document.getElementById('tr-info-date');
                    if (elInfoDate) {
                        if (photo.taken_at) {
                            elInfoDate.value = photo.taken_at.split('T')[0];
                            if (trInfoDate) trInfoDate.style.display = '';
                        } else {
                            elInfoDate.value = '';
                            if (trInfoDate) trInfoDate.style.display = 'none';
                        }
                    }
                    if (elInfoCamera) elInfoCamera.value = photo.camera_model || 'N/A';
                    if (elInfoExif) elInfoExif.value = photo.exif_params || 'N/A';
                    const statUploaderEl = document.getElementById('stat-uploader');
                    if (Object.keys(app.topUploaders).length === 0) {
                        await app.utils.fetchTopUploaders();
                    }
                    const badges = uploaderDisplay.isBanned ? '' : app.utils.getBadgesHTML(photo.profiles?.id, photo.profiles?.role, photo.profiles?.subroles);
                    statUploaderEl.innerHTML = `<img loading="lazy" decoding="async" src="${uploaderDisplay.avatar}" onerror="this.onerror=null;this.src='${DEFAULT_AVATAR}';" class="w-5 h-5 rounded-full inline-block mr-1 object-cover align-middle"> ${safeUploaderName} ${badges}`;
                    statUploaderEl.onclick = () => app.views.loadUserProfile(uploaderDisplay.linkId);
                    document.getElementById('stat-date').innerText = new Date(photo.created_at).toLocaleDateString('vi-VN');
                    document.getElementById('stat-views').innerText = views;
                    let realLikeCount = 0;
                    const { count } = await window.sb.from('photo_likes').select('*', { count: 'estimated', head: true }).eq('photo_id', photoId);
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
                    deleteBtn.disabled = false;
                    deleteBtn.classList.add('hidden');
                    if (reapproveBtn) {
                        reapproveBtn.onclick = null;
                        reapproveBtn.disabled = false;
                        reapproveBtn.classList.add('hidden');
                    }
                    if (app.user && app.user.id === photo.uploader_id) {
                        deleteBtn.classList.remove('hidden');
                        deleteBtn.disabled = false;
                        if (proxyUrl === 'SANDBOX_DELETED' || photo._isSandboxMissing) {
                            deleteBtn.innerHTML = '<i class="fa-solid fa-trash-can mr-1"></i> Yêu cầu xóa ảnh';
                            deleteBtn.className = "w-full border border-red-500 text-red-600 py-2.5 text-sm font-bold rounded-md hover:bg-red-50 transition shadow-sm";
                        } else if (isPending || isDenied) {
                            deleteBtn.innerHTML = `<i class="fa-solid fa-trash-can mr-1"></i> Xóa ảnh ${isDenied ? '(Bị từ chối)' : '(Đang chờ duyệt)'}`;
                            deleteBtn.className = "w-full border border-gray-500 text-gray-600 py-2.5 text-sm font-bold rounded-md hover:bg-gray-50 transition shadow-sm";
                        } else {
                            deleteBtn.innerHTML = '<i class="fa-solid fa-trash-can mr-1"></i> Yêu cầu xóa ảnh';
                            deleteBtn.className = "w-full border border-red-500 text-red-600 py-2.5 text-sm font-bold rounded-md hover:bg-red-50 transition shadow-sm";
                        }
                        deleteBtn.onclick = () => app.photo.requestDelete();
                    }
                    
                    const editBtn = document.getElementById('btn-manager-edit-photo');
                    if (editBtn) editBtn.classList.add('hidden');
                    
                    if (app.user && (app.role === 'manager' || app.role === 'admin') && !isDenied) {
                        if (editBtn) editBtn.classList.remove('hidden');
                        if (app.user.id !== photo.uploader_id && app.role === 'manager') {
                            deleteBtn.classList.remove('hidden');
                            deleteBtn.disabled = false;
                            deleteBtn.innerHTML = '<i class="fa-solid fa-radiation mr-1"></i> Quản lý: Xóa ảnh này';
                            deleteBtn.className = "w-full bg-red-600 border border-red-600 text-white py-2.5 text-sm font-bold rounded-md hover:bg-red-700 transition shadow-sm";
                            deleteBtn.onclick = () => {
                                app.ui.showDenyPrompt("QUẢN LÝ - Xóa ảnh này", async (reason) => {
                                    try {
                                        const originalBtnText = deleteBtn.innerHTML;
                                        deleteBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Đang xử lý...';
                                        deleteBtn.disabled = true;
                                        const sessionRes = await window.sb.auth.getSession();
                                        const token = sessionRes.data.session?.access_token;
                                        const res = await fetch('/api/admin/action', {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'Authorization': `Bearer ${token}`
                                            },
                                            body: JSON.stringify({
                                                action: 'deny',
                                                photoId: photo.id,
                                                reason: reason,
                                                plate: photo.license_plate
                                            })
                                        });
                                        if (!res.ok) {
                                            let errText = 'Lỗi server (' + res.status + ')';
                                            try {
                                                const rawText = await res.text();
                                                const json = JSON.parse(rawText);
                                                if (json && json.error) errText = json.error;
                                                else errText = rawText;
                                            } catch (e) {}
                                            throw new Error(errText);
                                        }
                                        app.toast.show('success', 'Đã xử lý', 'Ảnh đã bị từ chối và bắt đầu đếm ngược 7 ngày trước khi bị xóa vĩnh viễn.');
                                        deleteBtn.disabled = false;
                                        deleteBtn.innerHTML = '<i class="fa-solid fa-radiation mr-1"></i> Quản lý: Xóa ảnh này';
                                        if (typeof app.ui.closeModal === 'function') app.ui.closeModal('photo-detail-modal');
                                        app.views.loadHome();
                                    } catch (e) {
                                        app.ui.showAlert("Lỗi: " + e.message);
                                        deleteBtn.innerHTML = '<i class="fa-solid fa-radiation mr-1"></i> Quản lý: Xóa ảnh này';
                                        deleteBtn.disabled = false;
                                    }
                                });
                            };
                        }
                    }
                    if (app.user && app.role === 'manager' && isDenied) {
                        if (reapproveBtn) {
                            reapproveBtn.innerHTML = '<i class="fa-solid fa-rotate-left mr-1"></i> Quản lý: Duyệt lại ảnh này';
                            reapproveBtn.classList.remove('hidden');
                            reapproveBtn.disabled = false;
                            reapproveBtn.onclick = () => {
                                app.ui.showPrompt("Nhập ghi chú cho việc duyệt lại / đẩy ảnh lên CDN (Tùy chọn):", "", async (reason) => {
                                    try {
                                        const originalText = reapproveBtn.innerHTML;
                                        reapproveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Đang tải lên CDN...';
                                        reapproveBtn.disabled = true;
                                        const sessionRes = await window.sb.auth.getSession();
                                        const token = sessionRes.data.session?.access_token;
                                        const res = await fetch('/api/admin/action', {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'Authorization': `Bearer ${token}`
                                            },
                                            body: JSON.stringify({
                                                action: 'approve',
                                                photoId: photo.id,
                                                plate: photo.license_plate,
                                                op: photo.operator || '',
                                                type: photo.type || 'bus',
                                                route: photo.route_no || '',
                                                model: photo.vehicles?.model || photo.model || '',
                                                location: photo.location || '',
                                                note: photo.note || '',

                                            })
                                        });
                                        if (!res.ok) {
                                            let errText = 'Lỗi server (' + res.status + ')';
                                            try {
                                                const rawText = await res.text();
                                                const json = JSON.parse(rawText);
                                                if (json && json.error) errText = json.error;
                                                else errText = rawText.replace(/<[^>]*>?/gm, '').trim().slice(0, 200);
                                            } catch (e) {}
                                            throw new Error(errText);
                                        }
                                        app.admin.logAction('manager_reapprove', photo.id, { plate: photo.license_plate, reason: reason });
                                        app.toast.show('success', 'Đã duyệt & đẩy lên CDN', 'Ảnh đã được đẩy thành công lên máy chủ CDN thực và hiển thị trên hệ thống.');
                                        reapproveBtn.disabled = false;
                                        reapproveBtn.innerHTML = isDenied ? '<i class="fa-solid fa-rotate-left mr-1"></i> Quản lý: Duyệt lại ảnh này' : '<i class="fa-solid fa-cloud-arrow-up mr-1"></i> Quản lý: Đẩy ảnh này lên CDN';
                                        app.views.loadDetail(photo.id);
                                    } catch (e) {
                                        app.ui.showAlert("Lỗi: " + e.message);
                                        reapproveBtn.innerHTML = isDenied ? '<i class="fa-solid fa-rotate-left mr-1"></i> Quản lý: Duyệt lại ảnh này' : '<i class="fa-solid fa-cloud-arrow-up mr-1"></i> Quản lý: Đẩy ảnh này lên CDN';
                                        reapproveBtn.disabled = false;
                                    }
                                });
                            };
                        }
                    }
                    const historyPlate = v?.license_plate || photo.license_plate;
                    if (window.location.pathname !== `/photo/${photoId}`) return;
                    app.views.loadHistory(historyPlate);

                    app.comments.init(photoId);
                    const fbSection = document.getElementById('fb-comments-section');
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

                loadHistory: async (plate) => {
                    const btnEditHist = document.getElementById('btn-edit-history');
                    if (btnEditHist) btnEditHist.disabled = true;
                    const editUi = document.getElementById('history-edit-ui');
                    if(editUi) editUi.classList.add('hidden');
                    const tbody = document.getElementById('history-list');
                    if(tbody) tbody.innerHTML = '<tr><td colspan="4" class="text-center py-2"><i class="fa-solid fa-spinner fa-spin text-gray-400"></i> Đang tải...</td></tr>';
                        const { data: history } = await window.sb
                            .from('vehicle_history')
                            .select('id, license_plate, plate, operator, route, note, effective_date, display_order')
                            .eq('license_plate', plate);
                    if (app.currentPlate !== plate) return;
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
                    if(!tbody) return; 
                    tbody.innerHTML = '';
                    if (parsedHistory.length > 0) {
                        parsedHistory.forEach((h, idx) => {
                            let displayPlate = h.plate || h.license_plate;
                            let displayNote = h.note || '';
                            const match = displayNote.match(/BKS cũ:\s*([A-Z0-9.-]+)/i);
                            if (match) {
                                displayPlate = match[1];
                                displayNote = displayNote.replace(match[0], '').trim();
                            }
                            displayNote = displayNote.replace(/^[-,]\s*/, '').trim();
                            const safePlate = app.utils.cleanText(displayPlate);
                            let safeOp = app.utils.cleanText(h.operator);
                            if ((h.route || '').trim() === 'Dừng hoạt động') safeOp = '';
                            const safeRoute = app.utils.cleanText(h.route || '-');
                            const safeNote = app.utils.cleanText(displayNote);
                            const isLatest = idx === parsedHistory.length - 1;
                            const textCheck = `${h.operator || ''} ${h.route || ''} ${h.note || ''}`.toLowerCase();
                            const isStopped = textCheck.includes('dừng hoạt động') || textCheck.includes('ngừng hoạt động') || textCheck.includes('thanh lý') || textCheck.includes('thu hồi');
                            const barColor = !isLatest ? '#9ca3af' : (isStopped ? '#ef4444' : '#22c55e');
                            tbody.innerHTML += `
                                <tr>
                                    <td class="font-bold border-r border-gray-200" style="border-left: 4px solid ${barColor} !important;">${safePlate}</td>
                                    <td class="border-r border-gray-200">${safeOp}</td>
                                    <td class="border-r border-gray-200">${safeRoute}</td>
                                    <td class="text-xs text-gray-500 whitespace-pre-wrap break-words">${app.utils.linkify(safeNote)}</td>
                                </tr>
                            `;
                        });
                    } else {
                        tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-gray-500">Chưa có lịch sử hoạt động.</td></tr>';
                    }
                    if (document.getElementById('hist-new-plate')) document.getElementById('hist-new-plate').value = plate;
                    if (btnEditHist) btnEditHist.disabled = false;
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
                    app.views.switch('vehicle', false);
                    if (app.vehicle._renderedPlate === plate && document.getElementById('vehicle').innerHTML.includes('history-table') && !forceRefresh) {
                        app.loadingBar.finish();
                        return;
                    }
                    app.vehicle._renderedPlate = null; 
                    const container = document.getElementById('vehicle');
                    container.innerHTML = '<div class="text-center py-20"><i class="fa-solid fa-circle-notch fa-spin text-2xl text-gray-400"></i></div>';
                    try {
                        app.vehicle.currentPage = 1;
                        const vehSize = app.vehicle.VEHICLE_PAGE_SIZE || 12;
                        const [vehicleRes, historyRes] = await Promise.all([
                            window.sb.from('vehicles').select('license_plate, model, note').eq('license_plate', plate).maybeSingle(),
                            window.sb.from('vehicle_history').select('id, license_plate, plate, operator, route, note, effective_date, display_order').eq('license_plate', plate).order('display_order', { ascending: true })
                        ]);
                        if (vehicleRes.data && vehicleRes.data.note) {
                            const match = vehicleRes.data.note.match(/\[MERGED_INTO:([^\]]+)\]/);
                            if (match && match[1]) {
                                app.toast.show('info', 'Chuyển hướng', `Hồ sơ xe này đã được ẩn và gộp chung vào xe ${match[1]}`);
                                return app.views.loadVehiclePage(match[1], forceRefresh);
                            }
                        }
                        const historyPlates = historyRes.data ? historyRes.data.map(h => h.plate).filter(Boolean) : [];
                        const allPlatesToFetch = [...new Set([plate, ...historyPlates])];
                        let pQuery = window.sb.from('photos').select(`id, url, license_plate, operator, type, route_no, taken_at, created_at, uploader_id, note, exif_params, borrowed_route, camera_model, location, status, denial_reason, views, profiles(id, username, role, subroles, ban_status), vehicles(model)`)
                                .in('license_plate', allPlatesToFetch)
                                .eq('status', 'approved');
                        pQuery = app.preference.applyFilter(pQuery);
                        const allPhotosRes = await pQuery; 
                    if (window.location.pathname !== `/vehicle/${encodeURIComponent(plate)}`) return;
                        let allPhotos = allPhotosRes.data || [];
                        allPhotos.sort((a, b) => {
                            if (!a.taken_at && !b.taken_at) {
                                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                            }
                            if (!a.taken_at) return 1;
                            if (!b.taken_at) return -1;
                            return new Date(b.taken_at).getTime() - new Date(a.taken_at).getTime();
                        });
                        let vehicle = vehicleRes.data;
                        if (!vehicle) {
                            if (allPhotos.length === 0) {
                                app.ui.showAlert("Không tìm thấy thông tin cho xe này.", () => app.views.loadHome());
                                return;
                            }
                            const topP = allPhotos[0];
                            const fallbackModel = allPhotos.find(p => p.vehicles?.model)?.vehicles?.model || null;
                            vehicle = {
                                license_plate: plate,
                                model: fallbackModel,
                                operator: topP.operator || null,
                                note: null
                            };
                        }
                        if (allPhotos.length === 0) {
                            app.ui.showAlert("Hồ sơ ẩn: Xe này chưa có ảnh nào được duyệt trên hệ thống.", () => app.views.loadHome());
                            return;
                        }
                        const pageTitle = `Hồ sơ xe ${vehicle.license_plate} | VNBUSARCHIVE`;
                        app.vehiclePhotosCache = allPhotos;
                        app.vehicle.totalCount = allPhotos.length;
                        app.vehicle.totalPages = Math.ceil(app.vehicle.totalCount / vehSize);
                        const firstPagePhotos = allPhotos.slice(0, vehSize);
                        let topPhoto = null;
                        if (allPhotos.length > 0) {
                            topPhoto = allPhotos.find(p => (p.location || '').trim() !== 'Chụp trong xe') || allPhotos[0];
                        }
                        const isCoach = topPhoto && topPhoto.type === 'coach';
                        let rawHistory = historyRes.data || [];
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
                        const specialRoutes = ['Dừng hoạt động', 'Ngoài giờ hoạt động', 'Chưa hoạt động'];
                        let currentRouteClientSide = '';
let currentOpClientSide = '';
let currentRouteProvName = null;
                        if (allPhotos.length > 0) {
                            const latestPhoto = allPhotos[0];
                            currentOpClientSide = latestPhoto.operator || '';
                            const r = (latestPhoto.route_no || '').trim();
                            if (r && !specialRoutes.includes(r)) {
                                currentRouteClientSide = r;
                                if (latestPhoto.borrowed_route) { const parts = latestPhoto.borrowed_route.split(' - '); if (parts.length > 1) currentRouteProvName = parts[1].trim(); }
                            } else if (r === 'Ngoài giờ hoạt động') {
                                const validPhotos = allPhotos.filter(p => p.route_no && !specialRoutes.includes(p.route_no));
                                if (validPhotos.length > 0) {
                                    const latestValid = validPhotos[0];
                                    currentRouteClientSide = (latestValid.route_no || '').trim();
                                    currentOpClientSide = latestValid.operator || '';
                                    if (latestValid.borrowed_route) { const parts = latestValid.borrowed_route.split(' - '); if (parts.length > 1) currentRouteProvName = parts[1].trim(); }
                                }
                            } else if (r === 'Dừng hoạt động' || r === 'Chưa hoạt động') {
                                currentRouteClientSide = r;
                            }
                        }
                        if (historyData.length > 0) {
                            const latestHist = historyData[historyData.length - 1];
                            const histRoute = (latestHist.route || '').trim();
                            if (histRoute && histRoute !== '-' && histRoute !== '---') {
                                currentRouteClientSide = histRoute;
                            }
                            const histOp = (latestHist.operator || '').trim();
                            if (histOp && histOp !== '-' && histOp !== '---') {
                                currentOpClientSide = histOp;
                            }
                        }
                        const baseDescClient = `Lịch sử hoạt động và thư viện ảnh của xe ${vehicle.model ? vehicle.model + ' ' : ''}biển kiểm soát ${app.utils.formatPlateVariations(vehicle.license_plate)}`;
                        const tailPartsClient = [];
                        if (currentOpClientSide) tailPartsClient.push(currentOpClientSide);
                        if (currentRouteClientSide && currentRouteClientSide !== '---') tailPartsClient.push(`Tuyến ${currentRouteClientSide}`);
                        const pageDesc = tailPartsClient.length > 0 ? `${baseDescClient} - ${tailPartsClient.join(' - ')}.` : `${baseDescClient}.`;
                        app.utils.updateMetaTags(pageTitle, pageDesc, topPhoto ? app.utils.getProxiedUrl(topPhoto.url) : '');
                        let vehPrefix = '';
                        const vehProvName = currentRouteProvName || app.utils.getProvinceFromPlate(vehicle.license_plate);
                        if (vehProvName && app.utils.provinceData && app.utils.provinceData.length) {
                            const pData = app.utils.provinceData.find(p => p.ten === vehProvName);
                            if (pData && pData.ky_hieu) {
                                vehPrefix = Array.isArray(pData.ky_hieu) ? String(pData.ky_hieu[0]).trim() : String(pData.ky_hieu).split(',')[0].trim();
                            }
                        }
                        app.currentPlate = vehicle.license_plate;
                        app.currentVehicle = vehicle;
                        app.vehicle.currentHistoryData = historyData;
                        let historyHTML = '<div class="p-3 text-xs text-gray-500">Chưa có lịch sử hoạt động.</div>';
                        if (historyData.length > 0) {
                            historyHTML = `
                                <div class="history-table-wrapper">
                                    <table class="history-table" style="margin-bottom: 0 !important;">
                                        <thead><tr>
                                            <th class="border-r border-gray-200" style="border-left: 4px solid #f4f4f5;">BKS</th>
                                            <th class="border-r border-gray-200">Đơn vị</th>
                                            <th class="border-r border-gray-200">Tuyến</th>
                                            <th>Ghi chú</th>
                                        </tr></thead>
                                        <tbody>
                                            ${historyData.map((h, idx) => {
                                                let displayPlate = h.plate || h.license_plate || vehicle.license_plate;
                                                let displayNote = h.note || '';
                                                const match = displayNote.match(/BKS cũ:\s*([A-Z0-9.-]+)/i);
                                                if (match) {
                                                    displayPlate = match[1];
                                                    displayNote = displayNote.replace(match[0], '').trim();
                                                }
                                                displayNote = displayNote.replace(/^[-,]\s*/, '').trim();
                                                const safePlate = app.utils.cleanText(displayPlate);
                                                let safeOp = app.utils.cleanText(h.operator);
                                                if ((h.route || '').trim() === 'Dừng hoạt động') safeOp = '';
                                                const safeRoute = app.utils.cleanText(h.route || '-');
                                                const safeNote = app.utils.cleanText(displayNote);
                                                const isLatest = idx === historyData.length - 1;
                                                const textCheck = `${h.operator || ''} ${h.route || ''} ${h.note || ''}`.toLowerCase();
                                                const isStopped = textCheck.includes('dừng hoạt động') || textCheck.includes('ngừng hoạt động') || textCheck.includes('thanh lý') || textCheck.includes('thu hồi');
                                                const barColor = !isLatest ? '#9ca3af' : (isStopped ? '#ef4444' : '#22c55e');
                                                return `
                                                <tr>
                                                    <td class="font-bold border-r border-gray-200" style="border-left: 4px solid ${barColor} !important;">${safePlate}</td>
                                                    <td class="border-r border-gray-200">${safeOp}</td>
                                                    <td class="border-r border-gray-200">${safeRoute}</td>
                                                    <td class="text-xs text-gray-500 whitespace-pre-wrap break-words">${app.utils.linkify(safeNote)}</td>
                                                </tr>`;
                                            }).join('')}
                                        </tbody>
                                    </table>
                                </div>`;
                        }
                        const editHistoryUI = `
                            <div id="veh-history-edit-ui" class="hidden mt-3 bg-gray-50 p-3 border border-gray-200 rounded-lg">
                                <div class="flex justify-between items-center mb-3">
                                    <h4 class="font-bold text-sm text-gray-900">Sửa trực tiếp danh sách</h4>
                                    <span class="text-[10px] font-bold text-gray-700 bg-gray-200 px-2 py-1 rounded">Tự động sắp xếp</span>
                                </div>
                                <div id="veh-sortable-history" class="space-y-2 mb-4"></div>
                                <h4 class="font-bold text-xs text-gray-900 mt-4 mb-2">Thêm mốc lịch sử mới</h4>
                                <div class="flex flex-col gap-2 bg-white p-3 border border-gray-200 rounded-md text-xs">
                                    <div class="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                                        <div class="flex flex-col sm:flex-1 min-w-0">
                                            <span class="sm:hidden font-bold text-gray-500 mb-1">Biển số</span>
                                            <input type="text" id="veh-hist-new-plate" placeholder="Biển số" class="hist-input" oninput="app.utils.formatPlateInput(this)">
                                        </div>
                                        <div class="flex flex-col sm:flex-1 min-w-0">
                                            <span class="sm:hidden font-bold text-gray-500 mb-1">Ngày áp dụng</span>
                                            <input type="text" id="veh-hist-new-date" placeholder="DD/MM/YYYY" maxlength="10" oninput="app.utils.formatDateInput(this)" class="hist-input text-center font-mono w-full sm:w-28" title="Ngày áp dụng">
                                        </div>
                                        <div class="flex flex-col sm:flex-1 min-w-0" id="veh-hist-new-op-wrapper">
                                            <span class="sm:hidden font-bold text-gray-500 mb-1">Đơn vị</span>
                                            <input type="text" id="veh-hist-new-op" placeholder="Đơn vị" class="hist-input" oninput="app.utils.formatNoPunctuation(this)">
                                        </div>
                                        <div class="flex flex-col sm:flex-1 min-w-0">
                                            <span class="sm:hidden font-bold text-gray-500 mb-1">Tuyến</span>
                                            <input type="text" id="veh-hist-new-route" placeholder="Tuyến" class="hist-input" oninput="app.utils.checkRouteStatus(this.value, 'veh-hist-new-op', 'veh-hist-new-op-wrapper')">
                                        </div>
                                    </div>
                                    <div class="flex flex-col sm:flex-row gap-2 items-start mt-1">
                                        <div class="flex flex-col flex-1 min-w-0 w-full">
                                            <span class="sm:hidden font-bold text-gray-500 mb-1">Ghi chú</span>
                                            <textarea id="veh-hist-new-note" placeholder="Ghi chú" class="hist-input resize-y min-h-[50px] p-2 overflow-hidden w-full" oninput="this.style.height = 'auto'; this.style.height = (this.scrollHeight + (this.offsetHeight - this.clientHeight)) + 'px'"></textarea>
                                        </div>
                                        <div class="flex justify-end gap-2 mt-2 sm:mt-0 w-full sm:w-auto h-full">
                                            <button type="button" onclick="app.vehicle.addHistoryItem('veh-')" class="bg-black text-white px-4 py-2 text-xs rounded-md font-bold hover:bg-gray-800 transition shadow-sm w-full sm:w-auto min-h-[42px] whitespace-nowrap">Thêm Mới</button>
                                        </div>
                                    </div>
                                </div>
                                <div class="mt-3 flex justify-end gap-3">
                                    <button onclick="app.vehicle.toggleEditHistory('veh-')" class="text-xs text-gray-500 hover:text-black font-medium">Hủy bỏ</button>
                                    <button onclick="app.vehicle.saveHistory()" class="bg-black text-white px-4 py-2 text-xs font-bold rounded-md hover:bg-gray-800 transition shadow-sm">Lưu thông tin</button>
                                </div>
                            </div>
                        `;
                        let photosHTML = '<p class="text-xs text-gray-500">Chưa có ảnh nào cho xe này.</p>';
                        let loadMoreHtml = '';
                        if (allPhotos.length > 0) {
                            photosHTML = `<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" id="vehicle-photo-grid">${firstPagePhotos.map(p => app.views.renderPhotoCard(p)).join('')}</div>`;
                            if (app.vehicle.totalPages > 1) {
                                loadMoreHtml = '<div id="vehicle-load-more-container" class="mt-6 w-full flex justify-center hidden"></div>';
                            }
                        }
                        const html = `
                            <div class="text-[11px] sm:text-xs text-gray-500 mb-4 bg-white px-3 py-2 border border-vbs-border rounded-md shadow-sm flex items-center gap-1.5 sm:gap-2 w-max max-w-full">
                                <span class="crumb-back cursor-pointer hover:text-black font-medium transition-colors truncate shrink min-w-0" onclick="app.views.loadHome()">Trang chủ</span>
                                <i class="fa-solid fa-chevron-right text-[8px] sm:text-[10px] shrink-0 text-gray-400"></i>
                                <span id="crumb-vehicle-profile" class="font-bold text-black overflow-x-auto whitespace-nowrap no-scrollbar shrink min-w-0 block">${app.utils.displayPlate(vehicle.license_plate)}</span>
                            </div>
                            <div class="bg-white border border-vbs-border shadow-sm rounded-lg p-6 md:p-8 mb-6 relative overflow-hidden">
                                <div class="flex items-center gap-4 sm:gap-6 w-full min-w-0 max-w-full mb-6">
                                    ${topPhoto ? `
                                    <img loading="lazy" decoding="async" src="${app.utils.getProxiedUrl(topPhoto.url, 'vehicle-top.jpg', 'thumb')}" onerror="app.utils.fallbackHeroImage(this, 'vehiclePhotosCache', 0)" onclick="app.views.loadDetail(${topPhoto.id})" class="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-xl object-cover shrink-0 border border-gray-200 shadow-sm cursor-pointer transition duration-300">
                                    ` : `
                                    <div class="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center font-bold text-3xl shrink-0 border border-gray-200">
                                        <i class="fa-solid fa-bus"></i>
                                    </div>
                                    `}
                                    <div class="overflow-hidden min-w-0 flex-1 text-left">
                                        <p class="text-[10px] md:text-xs text-gray-500 uppercase tracking-widest font-bold mb-1">${isCoach ? 'Xe khách' : 'Xe buýt'}</p>
                                        <h2 class="text-xl md:text-3xl font-black uppercase text-black tracking-tight leading-tight overflow-x-auto whitespace-nowrap no-scrollbar block w-full">${app.utils.displayPlate(vehicle.license_plate)}</h2>
                                    </div>
                                </div>
                                <div class="mb-8">
                                    <h3 class="font-bold text-xs uppercase text-black tracking-wider mb-2.5 px-1">Thông tin chi tiết</h3>
                                    <div class="border border-gray-200 rounded-lg overflow-hidden bg-white mb-3 shadow-sm">
                                        <table class="info-table border-gray-200 w-full" style="margin-bottom: 0 !important;">
                                            <tr id="vehicle-edit-operator-row" ${currentRouteClientSide === 'Dừng hoạt động' ? 'class="hidden"' : ''}>
                                                <td class="label bg-gray-50 border-r border-b border-gray-200" style="width: 35%">Đơn vị vận hành</td>
                                                <td class="value-cell border-b border-gray-200">
                                                    <input type="text" id="vehicle-edit-operator" value="${currentRouteClientSide === 'Dừng hoạt động' ? 'N/A' : currentOpClientSide}" class="info-input text-gray-700 w-full ${currentOpClientSide ? 'clickable-search' : 'cursor-not-allowed'}" readonly ${currentOpClientSide ? `onclick="if(this.readOnly && this.value && this.value!=='---' && this.value!=='N/A') app.utils.navigate('/operator/' + encodeURIComponent(this.value))"` : ''}>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td class="label bg-gray-50 border-r border-b border-gray-200">${isCoach ? 'Lộ trình' : 'Mã số tuyến'} hiện tại</td>
                                                <td class="value-cell border-b border-gray-200">
                                                    <div class="relative w-full h-full">
                                                        <input type="text" id="vehicle-edit-route" value="${currentRouteClientSide}" autocomplete="off" class="info-input text-gray-700 w-full ${currentRouteClientSide ? 'clickable-search' : 'cursor-not-allowed'}" readonly ${currentRouteClientSide ? `onclick="if(this.readOnly && this.value && this.value!=='---') { const special = ['Dừng hoạt động', 'Ngoài giờ hoạt động', 'Chưa hoạt động']; if (${isCoach} || special.includes(this.value.trim())) { app.searchRedirect(this.value, 'route'); } else { app.utils.navigate('${vehProvName}' ? '/route/' + encodeURIComponent('${vehProvName}') + '/' + encodeURIComponent(this.value) : '/route/' + encodeURIComponent(this.value)); } }"` : ''} onfocus="if(!this.readOnly) app.utils.triggerRouteSuggestion('vehicle-edit-route', 'veh-sug-route', '')" oninput="app.utils.triggerRouteSuggestion('vehicle-edit-route', 'veh-sug-route', this.value); app.utils.checkRouteStatus(this.value, 'vehicle-edit-operator', 'vehicle-edit-operator-row')">
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
                                                <td class="label bg-gray-50 border-r border-gray-200">Ghi chú</td>
                                                <td class="value-cell relative">
                                                    <div id="vehicle-note-display" class="info-input text-gray-700 w-full min-h-[40px] block bg-gray-50 cursor-not-allowed whitespace-pre-wrap break-words border border-transparent px-3 py-2 text-sm">${app.utils.linkify(app.utils.escapeAttr(vehicle.note || ''))}</div>
                                                    <textarea id="vehicle-edit-note" rows="2" class="info-input text-gray-700 w-full resize-y min-h-[40px] hidden cursor-not-allowed" readonly>${app.utils.escapeAttr(vehicle.note || '')}</textarea>
                                                </td>
                                            </tr>
                                        </table>
                                    </div>
                                    <div id="veh-edit-trigger-container" class="mb-6">
                                        <button id="btn-vehicle-edit" onclick="app.vehicle.toggleVehiclePageEdit('${plate}')" class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 text-sm font-bold rounded-md hover:bg-gray-50 transition shadow-sm flex justify-center items-center gap-1.5">
                                            <i class="fa-solid fa-pen-to-square"></i> Cập nhật thông tin
                                        </button>
                                    </div>
                                    <div id="vehicle-edit-actions" class="hidden mb-6 flex-col gap-3">
                                        <div class="flex justify-end gap-3">
                                            <button onclick="app.vehicle.toggleVehiclePageEdit('${plate}')" class="text-xs text-gray-500 hover:text-black font-medium">Hủy bỏ</button>
                                            <button id="btn-vehicle-save" onclick="app.vehicle.saveVehiclePageChanges('${plate}')" class="bg-black text-white text-xs font-bold px-4 py-2 rounded-md hover:bg-gray-800 transition shadow-sm">Lưu thông tin</button>
                                        </div>
                                        <div class="bg-amber-50 text-amber-800 text-xs p-3 border border-amber-200 rounded-lg">
                                            <div class="flex gap-2 items-start">
                                                <i class="fa-solid fa-circle-info mt-0.5"></i>
                                                <div class="leading-relaxed">
                                                    Hãy đánh dấu trích dẫn ngay sau nội dung bằng ký hiệu <code>(x)</code> (với x là số thứ tự bắt đầu từ 1, tăng dần liên tục), sau đó cách đúng một dòng trống để tạo phần danh sách nguồn ở dưới cùng theo cú pháp <code>(x): [URL báo chính thống]</code>; khi cần bổ sung thông tin, hãy viết tiếp nội dung mới lên phía trên dòng trống và chèn link nguồn tương ứng xuống cuối danh sách.
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h3 class="font-bold text-xs uppercase text-black tracking-wider mb-2.5 px-1">Lịch sử hoạt động</h3>
                                    <div id="veh-history-table-container" class="border border-gray-200 rounded-lg overflow-hidden bg-white mb-3 shadow-sm">
                                        ${historyHTML}
                                    </div>
                                    <div id="veh-btn-edit-history-container" class="mb-6">
                                        <button onclick="app.vehicle.toggleEditHistory('veh-')" class="w-full bg-white border border-gray-300 text-gray-700 py-2.5 text-sm font-bold rounded-md hover:bg-gray-50 transition shadow-sm flex justify-center items-center gap-1.5">
                                            <i class="fa-solid fa-clock-rotate-left"></i> Cập nhật lịch sử
                                        </button>
                                    </div>
                                    ${editHistoryUI}
                                </div>
                            </div>
                            <div class="flex items-center gap-2 mb-4">
                                <h3 class="text-lg font-bold uppercase text-black tracking-tight">Thư viện ảnh (${app.vehicle.totalCount})</h3>
                            </div>
                            ${photosHTML}
                            ${loadMoreHtml}
                        `;
                        container.innerHTML = html;
                        if (typeof app.vehicle.renderVehiclePagination === 'function') {
                            app.vehicle.renderVehiclePagination();
                        }
                        app.vehicle._renderedPlate = plate; 
                        app.loadingBar.finish();
                    } catch (err) {
                        console.error("Lỗi khi tải trang xe:", err);
                        container.innerHTML = `<p class="text-center text-red-500 p-10">Đã xảy ra lỗi: ${err.message}</p>`;
                        app.loadingBar.finish();
                    }
                },
                currentOperator: '',
                operatorLoadedCount: 0,
                operatorPhotos: [],
                OPERATOR_PAGE_SIZE: 12,
                loadOperatorPage: async (operatorName, forceRefresh = false) => {
                    const decodedPath = decodeURIComponent(window.location.pathname);
                    if (decodedPath !== `/operator/${operatorName}`) {
                        app.utils.navigate(`/operator/${encodeURIComponent(operatorName)}`);
                        return;
                    }
                    app.views.switch('operator-view', false);
                    if (app.currentOperator === operatorName && app.operatorLoaded && !forceRefresh) {
                        app.loadingBar.finish();
                        return;
                    }
                    document.title = `${operatorName} | VNBUSARCHIVE`;
                    app.currentOperator = operatorName;
                    app.operatorLoaded = false;
                    app.operatorLoadedCount = 0;
                    app.operator.totalPages = 0;
                    document.getElementById('operator-empty-state').classList.add('hidden');
                    document.getElementById('operator-profile-content').classList.remove('hidden');
                    document.getElementById('crumb-operator').innerText = operatorName;
                    document.getElementById('operator-title').innerText = operatorName;
                    document.getElementById('operator-logo').classList.add('hidden');
                    document.getElementById('operator-logo-fallback').classList.remove('hidden');
                    document.getElementById('operator-desc').classList.add('hidden');
                    const parentChildEl = document.getElementById('operator-parent-child');
                    if (parentChildEl) {
                        parentChildEl.innerHTML = '';
                        parentChildEl.classList.add('hidden');
                    }
                    document.getElementById('op-stat-photos').innerText = '...';
                    document.getElementById('op-stat-vehicles').innerText = '...';
                    document.getElementById('op-stat-routes').innerText = '...';
                    document.getElementById('op-stat-views').innerText = '...';
                    document.getElementById('op-stats-tabs-wrapper').classList.add('hidden');
                    document.getElementById('op-stats-grid').classList.remove('hidden');
                    const grid = document.getElementById('operator-photo-grid');
                    grid.innerHTML = '<div class="col-span-full text-center py-10 text-gray-500"><i class="fa-solid fa-circle-notch fa-spin"></i> Đang tổng hợp dữ liệu...</div>';
                    document.getElementById('operator-load-more-container').innerHTML = '';
                    document.getElementById('operator-load-more-container').classList.add('hidden');
                    const targetNorm = app.utils.normOperator(operatorName).toLowerCase();
                    let resolvedOperator = operatorName;
                    try {
                        const { data: opCandidates } = await window.sb
                            .from('photos')
                            .select('operator')
                            .eq('status', 'approved')
                            .not('operator', 'is', null)
                            .limit(50);
                        if (opCandidates && opCandidates.length > 0) {
                            const match = opCandidates.find(r => app.utils.normOperator(r.operator).toLowerCase() === targetNorm);
                            if (match) resolvedOperator = match.operator;
                        }
                    } catch (e) {  }
                    try {
                        const { data: allOps } = await window.sb.from('operator_info').select('operator_name, logo_url, description, parent_operator');
                        let opInfo = null;
                        let rawChildOps = [];
                        if (allOps) {
                            opInfo = allOps.find(o => o.operator_name === operatorName) || allOps.find(o => app.utils.normOperator(o.operator_name).toLowerCase() === targetNorm);
                            rawChildOps = allOps.filter(o => o.parent_operator);
                        }
                        const childOps = rawChildOps.filter(op => {
                            const parents = op.parent_operator.split(';').map(s => app.utils.normOperator(s).toLowerCase());
                            return parents.includes(targetNorm);
                        }).sort((a, b) => a.operator_name.localeCompare(b.operator_name, 'vi'));
                        const logoEl = document.getElementById('operator-logo');
                        const fallbackEl = document.getElementById('operator-logo-fallback');
                        const descEl = document.getElementById('operator-desc');
                        if (opInfo && opInfo.logo_url) {
                            logoEl.src = opInfo.logo_url.includes('wsrv.nl') ? opInfo.logo_url : 'https://wsrv.nl/?url=' + encodeURIComponent(opInfo.logo_url);
                            logoEl.classList.remove('hidden');
                            fallbackEl.classList.add('hidden');
                        } else {
                            logoEl.classList.add('hidden');
                            fallbackEl.classList.remove('hidden');
                        }
                        if (opInfo && opInfo.description) {
                            let desc = opInfo.description;
                            let inactiveBadge = '';
                            if (desc.startsWith('[STOPPED]')) {
                                inactiveBadge = '<span class="bg-black text-white text-[10px] px-2 py-0.5 rounded font-bold border border-black shrink-0 uppercase tracking-widest">Dừng hoạt động</span>';
                                desc = desc.replace(/^\[STOPPED\]\s*/, '');
                            }
                            if (inactiveBadge) {
                                document.getElementById('operator-title').innerHTML = app.utils.escapeHtml(resolvedOperator) + inactiveBadge;
                            }
                            if (desc) {
                                descEl.innerHTML = app.utils.cleanText(desc).replace(/\n/g, '<br>');
                                descEl.classList.remove('hidden');
                            } else {
                                descEl.classList.add('hidden');
                            }
                        } else {
                            descEl.classList.add('hidden');
                        }
                        const ecoEl = document.getElementById('operator-parent-child');
                        let ecoHtml = '';
                        if (opInfo && opInfo.parent_operator) {
                            const parents = opInfo.parent_operator.split(';').map(s => s.trim()).filter(Boolean).sort((a, b) => a.localeCompare(b, 'vi'));
                            if (parents.length > 0) {
                                const parentLinks = parents.map(p => {
                                    let isParentInactive = false;
                                    if (allOps) {
                                        const pInfo = allOps.find(o => app.utils.normOperator(o.operator_name).toLowerCase() === app.utils.normOperator(p).toLowerCase());
                                        if (pInfo && pInfo.description && pInfo.description.startsWith('[STOPPED]')) isParentInactive = true;
                                    }
                                    const classes = isParentInactive ? "text-gray-400 opacity-70 font-bold leading-tight" : "text-black font-bold hover:underline leading-tight";
                                    const suffix = isParentInactive ? " (Dừng hoạt động)" : "";
                                    return `<div><a href="javascript:void(0)" onclick="app.utils.navigate('/operator/' + encodeURIComponent('${app.utils.escapeAttr(p)}'))" class="${classes}">${app.utils.escapeHtml(p)}${suffix}</a></div>`;
                                }).join('');
                                ecoHtml += `<div class="flex items-baseline"><div class="font-bold text-gray-500 uppercase text-[10px] tracking-widest mr-2 shrink-0">ĐVVH mẹ:</div><div class="flex flex-col gap-1.5">${parentLinks}</div></div>`;
                            }
                        }
                        if (childOps && childOps.length > 0) {
                            const childLinks = childOps.map(c => {
                                let isChildInactive = c.description && c.description.startsWith('[STOPPED]');
                                const classes = isChildInactive ? "text-gray-400 opacity-70 font-bold leading-tight" : "text-black font-bold hover:underline leading-tight";
                                const suffix = isChildInactive ? " (Dừng hoạt động)" : "";
                                return `<div><a href="javascript:void(0)" onclick="app.utils.navigate('/operator/' + encodeURIComponent('${app.utils.escapeAttr(c.operator_name)}'))" class="${classes}">${app.utils.escapeHtml(c.operator_name)}${suffix}</a></div>`;
                            }).join('');
                            ecoHtml += `<div class="flex items-baseline"><div class="font-bold text-gray-500 uppercase text-[10px] tracking-widest mr-2 shrink-0">ĐVVH con:</div><div class="flex flex-col gap-1.5">${childLinks}</div></div>`;
                        }
                        if (ecoHtml) {
                            ecoEl.innerHTML = ecoHtml;
                            ecoEl.classList.remove('hidden');
                        } else {
                            ecoEl.classList.add('hidden');
                        }
                        const stats = await app.utils.getCachedStats('op_stats_' + resolvedOperator, 10 * 60 * 1000, async () => {
                            const rpc = await app.utils.getOperatorStats(resolvedOperator);
                            if (rpc) return rpc;
                            let cq = window.sb.from('photos').select('id', { count: 'estimated', head: true }).eq('status', 'approved').ilike('operator', resolvedOperator);
                            const { count } = await cq;
                            return { total_photos: count || 0, total_views: 0, total_vehicles: null, total_routes: null };
                        });
                        let allStatsData = [];
                        const platesRpc = await app.utils.getCachedStats('op_plates_' + resolvedOperator, 10 * 60 * 1000, async () => {
                            try {
                                const { data } = await window.sb.rpc('get_operator_plates', { op_name: resolvedOperator });
                                return data || [];
                            } catch (e) { return null; }
                        });
                        if (platesRpc && platesRpc.length > 0) {
                            allStatsData = platesRpc.map(p => ({
                                license_plate: p.license_plate,
                                route_no: p.route || null,
                                views: 0,
                                vehicles: p.model ? { model: p.model } : null
                            }));
                        } else {
                            const { data } = await window.sb.from('photos')
                                .select('views, license_plate, route_no, vehicles(model)')
                                .eq('status', 'approved')
                                .ilike('operator', resolvedOperator)
                                .order('taken_at', { ascending: false, nullsFirst: false })
                                .limit(200);
                            allStatsData = data || [];
                        }
                        let hasMainPhotos = true;
                        if (allStatsData.length === 0 && (!stats.total_photos || stats.total_photos === 0)) {
                            document.getElementById('op-main-photos-wrapper').classList.add('hidden');
                            document.getElementById('op-stat-photos').innerText = '0';
                            document.getElementById('op-stat-vehicles').innerText = '0';
                            document.getElementById('op-stat-routes').innerText = '0';
                            document.getElementById('op-stat-views').innerText = '0';
                            document.getElementById('op-stats-tabs-wrapper').classList.add('hidden');
                            document.getElementById('op-stats-grid').classList.add('hidden');
                            hasMainPhotos = false;
                        }
                        let totalViews = stats.total_views || 0;
                        let uniquePlates = new Set();
                        let uniqueRoutes = new Set();
                        allStatsData.forEach(p => {
                            if (p.license_plate) uniquePlates.add(p.license_plate.toUpperCase());
                            if (p.route_no && p.route_no !== '---') uniqueRoutes.add(p.route_no.toLowerCase());
                        });
                        const totalVehicles = (stats.total_vehicles != null) ? stats.total_vehicles : uniquePlates.size;
                        const totalRoutes = (stats.total_routes != null) ? stats.total_routes : uniqueRoutes.size;
                        const totalPhotosStat = stats.total_photos || allStatsData.length;
                        document.getElementById('op-stat-photos').innerText = app.utils.formatCompact(totalPhotosStat);
                        document.getElementById('op-stat-vehicles').innerText = app.utils.formatCompact(totalVehicles);
                        document.getElementById('op-stat-routes').innerText = app.utils.formatCompact(totalRoutes);
                        document.getElementById('op-stat-views').innerText = app.utils.formatCompact(totalViews);
                        if (totalPhotosStat === 0 && totalVehicles === 0 && totalRoutes === 0 && totalViews === 0) {
                            document.getElementById('op-stats-grid').classList.add('hidden');
                        } else {
                            document.getElementById('op-stats-grid').classList.remove('hidden');
                        }
                        const absoluteLatestStatus = new Map();
                        const uniquePlatesArr = Array.from(uniquePlates);
                        let plateToBorrowed = new Map();
                        let plateToType = new Map();
                        for (let i = 0; i < uniquePlatesArr.length; i += 150) {
                            const chunk = uniquePlatesArr.slice(i, i + 150);
                            const { data: bData } = await window.sb.from('photos')
                                .select('license_plate, borrowed_route, type')
                                .in('license_plate', chunk)
                                .eq('status', 'approved');
                            if (bData) {
                                bData.forEach(p => {
                                    const pl = p.license_plate.toUpperCase();
                                    if (p.borrowed_route) plateToBorrowed.set(pl, p.borrowed_route);
                                    if (p.type === 'coach') plateToType.set(pl, 'coach');
                                });
                            }
                        }
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
                        const specialRoutes = ['Dừng hoạt động', 'Ngoài giờ hoạt động', 'Chưa hoạt động', 'Hợp đồng', 'Xe hợp đồng / Đưa đón'];
                        const latestCleanRouteMap = new Map();
                        const sortedPhotos = [...allStatsData].sort((a,b) => new Date(b.taken_at || b.created_at || 0) - new Date(a.taken_at || a.created_at || 0));
                        sortedPhotos.forEach(p => {
                            if (p.license_plate && p.route_no && p.route_no !== '---') {
                                const pl = p.license_plate.toUpperCase();
                                if (!latestCleanRouteMap.has(pl)) {
                                    let r = p.route_no.trim();
                                    let prov = '';
                                    const bRoute = p.borrowed_route || plateToBorrowed.get(pl);
                                    if (bRoute) {
                                        const parts = bRoute.split(' - ');
                                        r = parts[0].trim();
                                        if (parts.length > 1) prov = parts[1].trim();
                                    } else {
                                        const extractedProv = app.utils.getProvinceFromPlate(pl);
                                        if (extractedProv && !extractedProv.includes('KhA') && !extractedProv.includes('Bi')) {
                                            prov = extractedProv;
                                        }
                                    }
                                    latestCleanRouteMap.set(pl, { route: r, prov: prov });
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
                                const rDataMap = latestCleanRouteMap.get(pl);
                                if (rDataMap && rDataMap.route && rDataMap.route !== '---' && !specialRoutes.includes(rDataMap.route)) {
                                    const cleanRoute = rDataMap.route;
                                    const prov = rDataMap.prov;
                                    const routeKey = cleanRoute.toLowerCase() + '|' + prov;
                                    if (!activeRoutesMap.has(routeKey)) {
                                        activeRoutesMap.set(routeKey, { route: cleanRoute, prov: prov, count: 0, models: {}, isCoach: false });
                                    }
                                    const rData = activeRoutesMap.get(routeKey);
                                    if (plateToType.get(pl) === 'coach') rData.isCoach = true;
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
                            activeRoutes.push({ route: rData.route, displayName: displayName, prov: rData.prov, vehicleCount: rData.count, mainModel: maxModel, isCoach: rData.isCoach });
                        });
                        activeRoutes.sort((a, b) => {
                            if (b.vehicleCount !== a.vehicleCount) {
                                return b.vehicleCount - a.vehicleCount;
                            }
                            return a.route.localeCompare(b.route, undefined, {numeric: true});
                        });
                        app.operator.routeStatsData = activeRoutes;
                        app.operator.isRouteTableExpanded = false;
                        if (sortedModels.length > 0 || activeRoutes.length > 0) {
                            document.getElementById('op-stats-tabs-wrapper').classList.remove('hidden');
                            app.operator.renderModelTable();
                            app.operator.renderRouteTable();
                        } else {
                            document.getElementById('op-stats-tabs-wrapper').classList.add('hidden');
                        }
                        app.currentOperatorResolved = resolvedOperator;
                        app.views.operatorCurrentPage = 1;
                        const opSize = app.views.OPERATOR_PAGE_SIZE || 12;
                        let pQuery = window.sb.from('photos').select(`id, url, license_plate, operator, type, route_no, taken_at, created_at, uploader_id, note, exif_params, borrowed_route, camera_model, location, status, denial_reason, views, profiles(id, username, role, subroles, ban_status), vehicles(model)`, { count: 'estimated' })
                            .eq('status', 'approved')
                            .ilike('operator', resolvedOperator)
                            .order('taken_at', { ascending: false, nullsFirst: false })
                            .order('created_at', { ascending: false });
                        pQuery = app.preference.applyFilter(pQuery);
                        const { data: photos, error, count } = await pQuery.range(0, opSize - 1);
                        if (error) throw error;
                        app.operatorPhotos = photos || [];
                        app.operator.totalCount = count || (photos ? photos.length : 0);
                        app.operator.totalPages = Math.ceil(app.operator.totalCount / opSize);
                        if (photos && photos.length > 0) {
                            grid.innerHTML = photos.map(p => app.views.renderPhotoCard(p)).join('');
                            document.getElementById('op-main-photos-wrapper').classList.remove('hidden');
                        } else {
                            grid.innerHTML = '';
                            document.getElementById('op-main-photos-wrapper').classList.add('hidden');
                        }
                        app.views.renderOperatorPagination();
                        if (childOps && childOps.length > 0) {
                            app.operator.allChildOps = childOps;
                            await app.views.fetchChildOpsPage(1);
                        } else {
                            app.operator.allChildOps = [];
                            document.getElementById('op-child-photos-wrapper').classList.add('hidden');
                        }
                        if (!hasMainPhotos && childOps.length === 0) {
                            document.getElementById('operator-profile-content').classList.add('hidden');
                            document.getElementById('operator-empty-state').classList.remove('hidden');
                        }
                        app.operatorLoaded = true;
                    } catch (err) {
                        const grid = document.getElementById('operator-photo-grid');
                        grid.innerHTML = `<div class="col-span-full text-center py-10 text-red-500">Lỗi lấy dữ liệu: ${err.message}</div>`;
                        document.getElementById('op-main-photos-wrapper').classList.remove('hidden');
                    }
                    app.loadingBar.finish();
                },
                fetchChildOpsPage: async (page) => {
                    const container = document.getElementById('op-child-photos-container');
                    app.operator.childOpsCurrentPage = page;
                    const opSize = 5;
                    const childOps = app.operator.allChildOps || [];
                    const totalPages = Math.ceil(childOps.length / opSize);
                    app.operator.childOpsTotalPages = totalPages;
                    const fromIdx = (page - 1) * opSize;
                    const toIdx = fromIdx + opSize;
                    const pageChildOps = childOps.slice(fromIdx, toIdx);
                    container.style.opacity = '0.5';
                    container.style.pointerEvents = 'none';
                    try {
                        const childPhotosHtml = [];
                        for (const child of pageChildOps) {
                            let cQuery = window.sb.from('photos').select(`id, url, license_plate, operator, type, route_no, taken_at, created_at, uploader_id, note, exif_params, borrowed_route, camera_model, location, status, denial_reason, views, profiles(id, username, role, subroles, ban_status), vehicles(model)`)
                                .eq('status', 'approved')
                                .ilike('operator', child.operator_name)
                                .order('taken_at', { ascending: false, nullsFirst: false })
                                .order('created_at', { ascending: false })
                                .limit(4);
                            cQuery = app.preference.applyFilter(cQuery);
                            const { data: cPhotos, error: cErr } = await cQuery;
                            if (!cErr && cPhotos && cPhotos.length > 0) {
                                const encodedName = encodeURIComponent(child.operator_name);
                                let html = `
                                    <div class="child-operator-section">
                                        <div class="flex items-center gap-2 mb-3">
                                            <h4 class="text-md font-bold uppercase text-black tracking-tight">${app.utils.escapeHtml(child.operator_name)}</h4>
                                        </div>
                                        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                            ${cPhotos.map(p => app.views.renderPhotoCard(p)).join('')}
                                        </div>
                                        <div class="text-center mt-4">
                                            <button onclick="app.utils.navigate('/operator/' + encodeURIComponent('${app.utils.escapeAttr(child.operator_name)}'))" class="bg-white border border-gray-300 text-gray-700 px-6 py-2 text-sm font-bold rounded-md hover:bg-gray-50 hover:border-gray-400 transition shadow-sm">
                                                Xem chi tiết đơn vị này <i class="fa-solid fa-arrow-right ml-1"></i>
                                            </button>
                                        </div>
                                    </div>
                                `;
                                childPhotosHtml.push(html);
                            }
                        }
                        if (childPhotosHtml.length > 0) {
                            document.getElementById('op-child-photos-wrapper').classList.remove('hidden');
                            container.innerHTML = childPhotosHtml.join('');
                        } else {
                            container.innerHTML = `<div class="text-center text-gray-500 py-4">Không có ảnh nào từ các đơn vị con trong danh sách này.</div>`;
                            document.getElementById('op-child-photos-wrapper').classList.remove('hidden');
                        }
                        app.views.renderChildOpsPagination();
                    } catch (err) {
                        console.error("Lỗi lấy ảnh công ty con:", err);
                    } finally {
                        container.style.opacity = '1';
                        container.style.pointerEvents = 'auto';
                    }
                },
                renderChildOpsPagination: () => {
                    const paginator = document.getElementById('op-child-pagination');
                    if (paginator) {
                        paginator.innerHTML = '';
                        if (app.operator.childOpsTotalPages > 1) {
                            paginator.classList.remove('hidden');
                            app.utils.renderPagination('op-child-pagination', app.operator.childOpsCurrentPage, app.operator.childOpsTotalPages, (newPage) => {
                                const container = document.getElementById('op-child-photos-container');
                                if (container) {
                                    const offset = 80; 
                                    const elementPosition = container.getBoundingClientRect().top;
                                    const offsetPosition = elementPosition + window.pageYOffset - offset;
                                    window.scrollTo({ top: offsetPosition, behavior: "smooth" });
                                }
                                app.views.fetchChildOpsPage(newPage);
                            });
                        } else {
                            paginator.classList.add('hidden');
                        }
                    }
                },
                fetchOperatorPhotosPage: async (page) => {
                    const grid = document.getElementById('operator-photo-grid');
                    app.views.operatorCurrentPage = page;
                    const opSize = app.views.OPERATOR_PAGE_SIZE || 12;
                    const fromRow = (page - 1) * opSize;
                    const toRow = fromRow + opSize - 1;
                    grid.style.opacity = '0.5';
                    grid.style.pointerEvents = 'none';
                    try {
                        let pQuery = window.sb.from('photos').select(`id, url, license_plate, operator, type, route_no, taken_at, created_at, uploader_id, note, exif_params, borrowed_route, camera_model, location, status, denial_reason, views, profiles(id, username, role, subroles, ban_status), vehicles(model)`)
                            .eq('status', 'approved')
                            .ilike('operator', app.currentOperatorResolved)
                            .order('taken_at', { ascending: false, nullsFirst: false })
                            .order('created_at', { ascending: false });
                        pQuery = app.preference.applyFilter(pQuery);
                        const { data: photos, error } = await pQuery.range(fromRow, toRow);
                        if (error) throw error;
                        if (photos && photos.length > 0) {
                            grid.innerHTML = photos.map(p => app.views.renderPhotoCard(p)).join('');
                        } else {
                            grid.innerHTML = '<div class="col-span-full text-center py-10 text-gray-500">Không tìm thấy ảnh nào.</div>';
                        }
                    } catch (err) {
                        console.error("Lỗi tải trang ảnh đơn vị:", err);
                    } finally {
                        grid.style.opacity = '1';
                        grid.style.pointerEvents = 'auto';
                    }
                    app.views.renderOperatorPagination();
                },
                renderOperatorPagination: () => {
                    const btnContainer = document.getElementById('operator-load-more-container');
                    if (btnContainer) {
                        btnContainer.innerHTML = '';
                        if (app.operator.totalPages > 1) {
                            btnContainer.classList.remove('hidden');
                            app.utils.renderPagination('operator-load-more-container', app.views.operatorCurrentPage, app.operator.totalPages, (newPage) => {
                                const grid = document.getElementById('operator-photo-grid');
                                if (grid) {
                                    const offset = 80; 
                                    const elementPosition = grid.getBoundingClientRect().top;
                                    const offsetPosition = elementPosition + window.pageYOffset - offset;
                                    window.scrollTo({ top: offsetPosition, behavior: "smooth" });
                                }
                                app.views.fetchOperatorPhotosPage(newPage);
                            });
                        } else {
                            btnContainer.classList.add('hidden');
                        }
                    }
                },
                fetchModelPhotosPage: async (page) => {
                    const grid = document.getElementById('model-photo-grid');
                    app.views.modelCurrentPage = page;
                    const mdlSize = app.views.MODEL_PAGE_SIZE || 12;
                    const fromRow = (page - 1) * mdlSize;
                    const toRow = fromRow + mdlSize - 1;
                    grid.style.opacity = '0.5';
                    grid.style.pointerEvents = 'none';
                    try {
                        let pQuery = window.sb.from('photos').select(`id, url, license_plate, operator, type, route_no, taken_at, created_at, uploader_id, note, exif_params, borrowed_route, camera_model, location, status, denial_reason, views, profiles(id, username, role, subroles, ban_status), vehicles!inner(model)`)
                            .eq('status', 'approved')
                            .eq('vehicles.model', app.model.currentModel)
                            .order('taken_at', { ascending: false, nullsFirst: false })
                            .order('created_at', { ascending: false });
                        pQuery = app.preference.applyFilter(pQuery);
                        const { data: photos, error } = await pQuery.range(fromRow, toRow);
                        if (error) throw error;
                        if (photos && photos.length > 0) {
                            grid.innerHTML = photos.map(p => app.views.renderPhotoCard(p)).join('');
                        } else {
                            grid.innerHTML = '<div class="col-span-full text-center py-10 text-gray-500">Không tìm thấy ảnh nào.</div>';
                        }
                    } catch (err) {
                        console.error("Lỗi tải trang ảnh dòng xe:", err);
                    } finally {
                        grid.style.opacity = '1';
                        grid.style.pointerEvents = 'auto';
                    }
                    app.views.renderModelPagination();
                },
                renderModelPagination: () => {
                    const btnContainer = document.getElementById('model-load-more-container');
                    if (btnContainer) {
                        btnContainer.innerHTML = '';
                        if (app.model.totalPages > 1) {
                            btnContainer.classList.remove('hidden');
                            app.utils.renderPagination('model-load-more-container', app.views.modelCurrentPage, app.model.totalPages, (newPage) => {
                                const grid = document.getElementById('model-photo-grid');
                                if (grid) {
                                    const offset = 80; 
                                    const elementPosition = grid.getBoundingClientRect().top;
                                    const offsetPosition = elementPosition + window.pageYOffset - offset;
                                    window.scrollTo({ top: offsetPosition, behavior: "smooth" });
                                }
                                app.views.fetchModelPhotosPage(newPage);
                            });
                        } else {
                            btnContainer.classList.add('hidden');
                        }
                    }
                },
                fetchRoutePhotosPage: async (page) => {
                    const grid = document.getElementById('route-photo-grid');
                    app.views.routeCurrentPage = page;
                    const rteSize = app.route.ROUTE_PAGE_SIZE || 12;
                    const fromRow = (page - 1) * rteSize;
                    const toRow = fromRow + rteSize - 1;
                    grid.style.opacity = '0.5';
                    grid.style.pointerEvents = 'none';
                    try {
                        let pQuery = window.sb.from('photos').select(`id, url, license_plate, operator, type, route_no, taken_at, created_at, uploader_id, note, exif_params, borrowed_route, camera_model, location, status, denial_reason, views, profiles(id, username, role, subroles, ban_status), vehicles(model)`)
                            .eq('status', 'approved')
                            .eq('route_no', app.route.currentRoute)
                            .order('taken_at', { ascending: false, nullsFirst: false })
                            .order('created_at', { ascending: false });
                        
                        if (app.route.currentProvince) {
                            let prefix = '';
                            if (app.utils.provinceData) {
                                const prov = app.utils.provinceData.find(p => p.ten === app.route.currentProvince);
                                if (prov) {
                                    if (Array.isArray(prov.ky_hieu)) prefix = prov.ky_hieu[0];
                                    else prefix = String(prov.ky_hieu).split(',')[0].trim();
                                }
                            }
                            if (prefix) {
                                const relatedPrefixes = app.utils.getRelatedPrefixes(prefix);
                                const plateFilter = relatedPrefixes.length > 1 ? `or(${relatedPrefixes.map(p => `license_plate.ilike.${p}%`).join(',')})` : `license_plate.ilike.${relatedPrefixes[0]}%`;
                                pQuery = pQuery.or(`borrowed_route.eq."${app.route.currentRoute} - ${app.route.currentProvince}",and(borrowed_route.is.null,${plateFilter})`);
                            } else {
                                pQuery = pQuery.eq('borrowed_route', `${app.route.currentRoute} - ${app.route.currentProvince}`);
                            }
                        }
                        
                        pQuery = app.preference.applyFilter(pQuery);
                        const { data: photos, error } = await pQuery.range(fromRow, toRow);
                        if (error) throw error;
                        if (photos && photos.length > 0) {
                            grid.innerHTML = photos.map(p => app.views.renderPhotoCard(p)).join('');
                        } else {
                            grid.innerHTML = '<div class="col-span-full text-center py-10 text-gray-500">Không tìm thấy ảnh nào.</div>';
                        }
                    } catch (err) {
                        console.error("Lỗi tải trang ảnh tuyến:", err);
                    } finally {
                        grid.style.opacity = '1';
                        grid.style.pointerEvents = 'auto';
                    }
                    app.views.renderRoutePagination();
                },
                renderRoutePagination: () => {
                    const btnContainer = document.getElementById('route-load-more-container');
                    if (btnContainer) {
                        btnContainer.innerHTML = '';
                        if (app.route.totalPages > 1) {
                            btnContainer.classList.remove('hidden');
                            app.utils.renderPagination('route-load-more-container', app.views.routeCurrentPage, app.route.totalPages, (newPage) => {
                                const grid = document.getElementById('route-photo-grid');
                                if (grid) {
                                    const offset = 80; 
                                    const elementPosition = grid.getBoundingClientRect().top;
                                    const offsetPosition = elementPosition + window.pageYOffset - offset;
                                    window.scrollTo({ top: offsetPosition, behavior: "smooth" });
                                }
                                app.views.fetchRoutePhotosPage(newPage);
                            });
                        } else {
                            btnContainer.classList.add('hidden');
                        }
                    }
                },
                initInfoProvinceSelect: () => {
                    const menuEl = document.getElementById('info-province-menu');
                    if (!menuEl || !app.utils.provinceData) return;
                    const itemsHtml = app.utils.provinceData.map(p => {
                        return `<div class="filter-item" data-prov="${p.ten}" onclick="app.views.selectInfoProvince('${p.ten}', this)">
                            <span class="font-bold">${p.ten}</span>
                        </div>`;
                    }).join('');
                    menuEl.innerHTML = itemsHtml;
                },
                selectInfoProvince: (provName, el) => {
                    const hiddenInput = document.getElementById('info-province');
                    const labelEl = document.getElementById('info-province-label');
                    const menuEl = document.getElementById('info-province-menu');
                    if (hiddenInput) hiddenInput.value = provName || '';
                    if (labelEl) {
                        labelEl.innerText = provName || '-- Chọn Tuyến của tỉnh --';
                        if (provName) {
                            labelEl.classList.remove('text-gray-400');
                            labelEl.classList.add('text-gray-700');
                        } else {
                            labelEl.classList.remove('text-gray-700');
                            labelEl.classList.add('text-gray-400');
                        }
                    }
                    document.querySelectorAll('#info-province-menu .filter-item').forEach(item => {
                        item.classList.remove('selected');
                    });
                    if (el && el.classList) {
                        el.classList.add('selected');
                    } else if (menuEl) {
                        const target = menuEl.querySelector(`.filter-item[data-prov="${provName || ''}"]`);
                        if (target) target.classList.add('selected');
                    }
                    if (menuEl) menuEl.classList.remove('active');
                }
            }
});
