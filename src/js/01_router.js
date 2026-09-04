// Extracted to 01_router.js
Object.assign(window.app, {
    init: async () => {
        window.onpopstate = () => app.handleRoute();
        if (!window._spaClickListenerRegistered) {
            window._spaClickListenerRegistered = true;
            document.body.addEventListener('click', e => {
                const a = e.target.closest('a');
                if (a && a.getAttribute('href') && a.getAttribute('href').startsWith('/') && !a.getAttribute('target')) {
                    e.preventDefault();
                    app.utils.navigate(a.getAttribute('href'));
                }
            });
        }
            let session = null;
            try {
                const { data } = await window.sb.auth.getSession();
                session = data.session;
                if (session && session.access_token) {
                    fetch('/api/system', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                        body: JSON.stringify({ action: 'log_ip' })
                    }).catch(()=>{});
                }
                if (session && session.user && !session.user.email_confirmed_at) {
                    document.getElementById('loading-screen').style.display = 'none';
                    if(document.getElementById('app-container')) document.getElementById('app-container').style.display = 'none';
                    app.auth.showVerificationModal(session.user.email);
                    return;
                }
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
                // Check if there is an error from OAuth linking
                if (window.location.hash.includes('error_description=')) {
                    const params = new URLSearchParams(window.location.hash.substring(1));
                    const errorDesc = params.get('error_description');
                    if (errorDesc && errorDesc.includes('already linked')) {
                        setTimeout(() => {
                            app.ui.showAlert("Tài khoản này đã được liên kết với một người dùng khác. Vui lòng sử dụng tài khoản khác.");
                            window.history.replaceState(null, null, window.location.pathname);
                        }, 500);
                    }
                }

                await app.setUser(session ? session.user : null);
                window.sb.auth.onAuthStateChange(async (event, session) => {
                        if (event === 'PASSWORD_RECOVERY') {
    if (window.location.hash.includes('type=recovery')) {
        app.auth.mode = 'recovery';
        if (window.location.pathname !== '/auth') {
            app.utils.navigate('/auth');
        } else {
            app.views.switch('auth', false);
        }
        setTimeout(() => {
            window.dispatchEvent(new CustomEvent('set-auth-mode', { detail: 'recovery' }));
        }, 100);
    }
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
                let offlineTimer = null;
                window.addEventListener('offline', () => {
                    offlineTimer = setTimeout(() => {
                        document.body.classList.add('is-offline');
                        if (app.toast.currentOfflineToast) app.toast.currentOfflineToast(); 
                        app.toast.currentOfflineToast = app.toast.show('offline', 'Mất kết nối Internet', 'Bạn đang ngoại tuyến. Dữ liệu sẽ không thể đồng bộ.', 0);
                    }, 3000);
                });
                window.addEventListener('online', () => {
                    if (offlineTimer) clearTimeout(offlineTimer);
                    document.body.classList.remove('is-offline');
                    if (app.toast.currentOfflineToast) {
                        app.toast.currentOfflineToast(); 
                        app.toast.currentOfflineToast = null;
                        app.toast.show('success', 'Đã khôi phục kết nối', 'Mạng Internet đã hoạt động trở lại.', 5000);
                    }
                });
                window.addEventListener('beforeunload', (e) => {
                    if (app.currentViewMode === 'upload') {
                        app.upload.saveDraft();
                    }
                    if (app.upload && app.upload.isQueueProcessing) {
                        e.preventDefault();
                        e.returnValue = ''; 
                    }
                });
                app.scrollPositions = {};
                app.currentPathForScroll = window.location.pathname + window.location.search;
                app._isUserScrolling = false;
                let _scrollTimer = null;
                window.addEventListener('scroll', () => {
                    app.scrollPositions[app.currentPathForScroll] = window.scrollY;
                    app._isUserScrolling = true;
                    if (_scrollTimer) clearTimeout(_scrollTimer);
                    _scrollTimer = setTimeout(() => { app._isUserScrolling = false; }, 400);
                }, { passive: true });
                app.lastSearchQuery = '';
                app.lastSearchFilter = '';
                app.lastLoadedUsername = '';
                app.utils.updateBreadcrumbs();
                await app.utils.loadProvinceData();
                app.search.initExactRouteMenu();
                await app.maintenance.fetch();
                app.preference.load();
                app.onboarding.check();
                app.handleRoute();
                const upFileEl = document.getElementById('up-file');
                if (upFileEl) upFileEl.addEventListener('change', app.upload.handleFileSelect);
                const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
                const webrtcFileEl = document.getElementById('webrtc-mobile-file');
                const formatHintEl = document.getElementById('upload-format-hint');
                if (!isMobileDevice) {
                    const pcAccept = "image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif,.nef,.cr2,.cr3,.arw,.dng,.orf,.rw2,.pef,.raf,.srw,.raw";
                    if (upFileEl) upFileEl.accept = pcAccept;
                    if (webrtcFileEl) webrtcFileEl.accept = pcAccept;
                    if (formatHintEl) formatHintEl.innerText = "ĐỊNH DẠNG JPG, PNG, HEIC, RAW (TỐI ĐA 30MB)";
                } else {
                    const mobileAccept = "image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif";
                    if (upFileEl) upFileEl.accept = mobileAccept;
                    if (webrtcFileEl) webrtcFileEl.accept = mobileAccept;
                    if (formatHintEl) formatHintEl.innerText = "ĐỊNH DẠNG JPG, PNG, HEIC (RAW CHỈ TRÊN PC)";
                }
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
                        const fileInput = document.getElementById('up-file');
                        if (fileInput && fileInput.disabled) return;
                        dragCounter++;
                        if (dragCounter === 1) {
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
                                icon.style.color = '#000000'; 
                            }
                            if (iconContainer) {
                                iconContainer.style.backgroundColor = '#ffffff'; 
                                iconContainer.style.border = 'none';            
                                iconContainer.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'; 
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
                            const fileInput = document.getElementById('up-file');
                            if (fileInput && fileInput.disabled) return;
                            const dt = e.dataTransfer;
                            if (dt.files && dt.files.length > 0) {
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
                                const typeVal = document.getElementById('info-type')?.value;
                                const specialRoutes = ['Dừng hoạt động', 'Ngoài giờ hoạt động', 'Chưa hoạt động'];
                                // Gộp chung điều kiện Xe khách (coach) và Các tuyến đặc biệt
                                if (typeVal === 'coach' || specialRoutes.includes(this.value.trim())) {
                                    app.searchRedirect(this.value, fieldMap[id]);
                                } else {
                                    let provName = '';
                                    if (el.dataset.borrowed) {
                                        provName = el.dataset.borrowed.split(' - ')[1];
                                    } else {
                                        const plateValue = document.getElementById('info-plate')?.value;
                                        if (plateValue) provName = app.utils.getProvinceFromPlate(plateValue);
                                    }
                                    if (provName && provName !== 'Không xác định' && provName !== 'Biển tạm') {
                                        app.utils.navigate(`/route/${encodeURIComponent(provName)}/${encodeURIComponent(this.value)}`);
                                    } else {
                                        app.utils.navigate(`/route/${encodeURIComponent(this.value)}`);
                                    }
                                }
                            }
                            else {
                                app.searchRedirect(this.value, fieldMap[id]);
                            }
                        }
                    });
                });
                const elInfoModel = document.getElementById('info-model');
                if (elInfoModel) {
                    elInfoModel.addEventListener('click', function() {
                        if (this.readOnly && this.value && this.value !== '---' && this.value !== 'N/A') {
                            app.utils.navigate(`/model/${encodeURIComponent(this.value)}`);
                        }
                    });
                }
                const clearSearchInput = (inputEl, sugId) => {
                    inputEl.value = '';
                    document.getElementById(sugId).classList.remove('active');
                    app.search.triggerMainSuggestion('', inputEl.id, sugId);
                };
                document.getElementById('search-input').addEventListener('keydown', function (e) {
                    if (e.key === 'Enter') { document.getElementById('main-search-suggestions').classList.remove('active'); app.handleSearch(true, 'search-input'); }
                    if (e.key === 'Escape') clearSearchInput(e.target, 'main-search-suggestions');
                });
                document.getElementById('search-input').addEventListener('input', app.utils.debounce(function (e) {
                    const val = e.target.value;
                    const pageInp = document.getElementById('page-search-input');
                    if (pageInp && document.activeElement === e.target) pageInp.value = val;
                    app.search.triggerMainSuggestion(val.trim(), 'search-input', 'main-search-suggestions');
                }, 300));
                document.getElementById('search-input').addEventListener('focus', function (e) {
                    app.search.triggerMainSuggestion(e.target.value.trim(), 'search-input', 'main-search-suggestions');
                });
                const pageSearchInput = document.getElementById('page-search-input');
                if (pageSearchInput) {
                    pageSearchInput.addEventListener('keydown', function (e) {
                        if (e.key === 'Enter') { document.getElementById('page-search-suggestions').classList.remove('active'); app.handleSearch(true, 'page-search-input'); }
                        if (e.key === 'Escape') clearSearchInput(e.target, 'page-search-suggestions');
                    });
                    pageSearchInput.addEventListener('input', app.utils.debounce(function (e) {
                        const val = e.target.value;
                        const headerInp = document.getElementById('search-input');
                        if (headerInp && document.activeElement === e.target) headerInp.value = val;
                        app.search.triggerMainSuggestion(val.trim(), 'page-search-input', 'page-search-suggestions');
                    }, 300));
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
                    const advSugBox = document.getElementById('adv-filter-suggestions');
                    const advInputContainer = document.getElementById('adv-filter-value-container');
                    if (advSugBox && advInputContainer && !advSugBox.contains(e.target) && !advInputContainer.contains(e.target)) {
                        advSugBox.classList.remove('active');
                    }
                    const userMenuDropdown = document.getElementById('user-dropdown');
                    const userMenuContainer = document.getElementById('user-menu-container');
                    if (userMenuDropdown && userMenuContainer && !userMenuDropdown.contains(e.target) && !userMenuContainer.contains(e.target)) {
                        app.ui.toggleUserMenu(false);
                    }
                });

                app.utils.loadAnnouncements();
                app.utils.fetchTopUploaders();
                app.initRealtimeChannel = () => {
                    if (app.realtimeChannel) {
                    window.sb.removeChannel(app.realtimeChannel);
                }
                let channel = window.sb.channel('global-changes')
                    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'photos', filter: 'status=eq.approved' }, payload => {
                        if (app.currentViewMode === 'home') {
                            const now = Date.now();
                            if (app._lastHomeRealtimeReload && now - app._lastHomeRealtimeReload < 30000) return;
                            if (app._isUserScrolling) return;
                            app._lastHomeRealtimeReload = now;
                            app.views.loadHome(true);
                        }
                    });
                if (app.role === 'admin' || app.role === 'manager') {
                    channel = channel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'admin_notes' }, payload => {
                        if (payload.new && payload.new.id === 1) {
                            const noteEl = document.getElementById('adm-board-note');
                            if (noteEl && document.activeElement !== noteEl) {
                                noteEl.value = payload.new.content || '';
                            }
                        }
                    })
                    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_notes' }, payload => {
                        if (payload.new && payload.new.id === 1) {
                            const noteEl = document.getElementById('adm-board-note');
                            if (noteEl && document.activeElement !== noteEl) {
                                noteEl.value = payload.new.content || '';
                            }
                        }
                    });
                }
                channel = channel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'photos' }, payload => {
                        if (app.currentPhoto && app.currentPhoto.id === payload.new.id) {
                            const viewEl = document.getElementById('stat-views');
                            if (viewEl) viewEl.innerText = payload.new.views || 0;
                        }
                        if (payload.new && payload.new.status !== 'pending') {
                            const cardEl = document.getElementById(`adm-photo-card-${payload.new.id}`);
                            if (cardEl) {
                                if (document.activeElement && cardEl.contains(document.activeElement)) {
                                    document.activeElement.blur();
                                }
                                cardEl.style.transition = 'all 0.35s ease';
                                cardEl.style.opacity = '0';
                                cardEl.style.transform = 'scale(0.92)';
                                cardEl.style.maxHeight = '0px';
                                cardEl.style.margin = '0px';
                                cardEl.style.padding = '0px';
                                cardEl.style.overflow = 'hidden';
                                setTimeout(() => {
                                    cardEl.remove();
                                    const content = document.getElementById('admin-content');
                                    if (content && content.querySelectorAll('.admin-card').length === 0 && app.adminTab === 'photos') {
                                        content.innerHTML = '<p class="p-4">Không có ảnh nào chờ duyệt.</p>';
                                    }
                                }, 350);
                                if (app.admin && app.admin.refreshCounts) app.admin.refreshCounts();
                            }
                        }
                    })
                    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'photos' }, payload => {
                        const cardEl = document.getElementById(`adm-photo-card-${payload.old?.id}`);
                        if (cardEl) {
                            if (document.activeElement && cardEl.contains(document.activeElement)) {
                                document.activeElement.blur();
                            }
                            cardEl.style.transition = 'all 0.35s ease';
                            cardEl.style.opacity = '0';
                            cardEl.style.transform = 'scale(0.92)';
                            cardEl.style.maxHeight = '0px';
                            cardEl.style.margin = '0px';
                            cardEl.style.padding = '0px';
                            cardEl.style.overflow = 'hidden';
                            setTimeout(() => {
                                cardEl.remove();
                                const content = document.getElementById('admin-content');
                                if (content && content.querySelectorAll('.admin-card').length === 0 && app.adminTab === 'photos') {
                                    content.innerHTML = '<p class="p-4">Không có ảnh nào chờ duyệt.</p>';
                                }
                            }, 350);
                            if (app.admin && app.admin.refreshCounts) app.admin.refreshCounts();
                        }
                    });
                if (app.role === 'admin' || app.role === 'manager') {
                    channel = channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'photos', filter: 'status=eq.pending' }, async payload => {
                        if (app.adminTab === 'photos' && (app.role === 'admin' || app.role === 'manager') && payload.new && payload.new.id) {
                            try {
                                const { data: newPhoto } = await window.sb.from('photos').select('*, profiles(username, role), vehicles(model)').eq('id', payload.new.id).maybeSingle();
                                if (newPhoto && !document.getElementById(`adm-photo-card-${newPhoto.id}`)) {
                                    await app.utils.resolveSandboxUrls([newPhoto]);
                                    const content = document.getElementById('admin-content');
                                    if (content && app.admin && app.admin.renderSinglePhotoCardHTML) {
                                        const noDataMsg = content.querySelector('p');
                                        if (noDataMsg && noDataMsg.innerText.includes('Không có ảnh nào')) {
                                            content.innerHTML = '';
                                        }
                                        let plateSet = app.admin?.approvedPlateSet || new Set();
                                        let opSet = app.admin?.approvedOpSet || new Set();
                                        let routeSet = app.admin?.approvedRouteSet || new Set();
                                        let modelSet = app.admin?.approvedModelSet || new Set();
                                        const plateKey = (newPhoto.license_plate || '').trim().toUpperCase();
                                        if (plateKey && !plateSet.has(plateKey)) {
                                            const { data: vData } = await window.sb.from('vehicles').select('license_plate').eq('license_plate', plateKey).limit(1);
                                            const { data: pData } = await window.sb.from('photos').select('license_plate').eq('status', 'approved').eq('license_plate', plateKey).limit(1);
                                            if ((vData && vData.length > 0) || (pData && pData.length > 0)) plateSet.add(plateKey);
                                        }
                                        const opKey = app.utils.cleanText(newPhoto.operator || '').trim().toLowerCase();
                                        if (opKey && opKey !== '---' && !opSet.has(opKey)) {
                                            const { data: oData } = await window.sb.from('operator_info').select('operator_name').ilike('operator_name', opKey).limit(1);
                                            const { data: pData } = await window.sb.from('photos').select('operator').eq('status', 'approved').ilike('operator', opKey).limit(1);
                                            if ((oData && oData.length > 0) || (pData && pData.length > 0)) opSet.add(opKey);
                                        }
                                        const routeKey = app.utils.cleanText(newPhoto.route_no || '').trim().toLowerCase();
                                        if (routeKey && routeKey !== '---' && !routeSet.has(routeKey)) {
                                            const stripped = routeKey.replace(/^tuyến\s+/i, '').trim();
                                            const variants = [...new Set([routeKey, stripped, 'tuyến ' + stripped])];
                                            if (/^\d+$/.test(stripped)) {
                                                const num = String(parseInt(stripped, 10));
                                                const pad = stripped.padStart(2, '0');
                                                variants.push(num, pad, 'tuyến ' + num, 'tuyến ' + pad);
                                            }
                                            const { data: pData } = await window.sb.from('photos').select('route_no').eq('status', 'approved').in('route_no', variants).limit(1);
                                            if (pData && pData.length > 0) {
                                                variants.forEach(v => routeSet.add(v.toLowerCase()));
                                            }
                                        }
                                        const modelKey = app.utils.cleanText(newPhoto.vehicles?.model || '').trim().toLowerCase();
                                        if (modelKey && modelKey !== '---' && !modelSet.has(modelKey)) {
                                            const { data: vData } = await window.sb.from('vehicles').select('model').ilike('model', modelKey).limit(1);
                                            const { data: pData } = await window.sb.from('photos').select('vehicles!inner(model)').eq('status', 'approved').ilike('vehicles.model', modelKey).limit(1);
                                            if ((vData && vData.length > 0) || (pData && pData.length > 0)) modelSet.add(modelKey);
                                        }
                                        const tempDiv = document.createElement('div');
                                        tempDiv.innerHTML = app.admin.renderSinglePhotoCardHTML(newPhoto, plateSet, opSet, routeSet, modelSet);
                                        const newCard = tempDiv.firstElementChild;
                                        if (newCard) {
                                            newCard.style.opacity = '0';
                                            newCard.style.transform = 'translateY(-15px)';
                                            newCard.style.transition = 'all 0.4s ease';
                                            const isNewPrivileged = (newPhoto.profiles?.role === 'admin' || newPhoto.profiles?.role === 'manager');
                                            const newId = Number(newPhoto.id) || 0;
                                            const existingCards = Array.from(content.querySelectorAll('.admin-card'));
                                            let insertBeforeTarget = null;
                                            for (const card of existingCards) {
                                                const isCardPrivileged = card.getAttribute('data-privileged') === 'true';
                                                const cardId = Number(card.getAttribute('data-photo-id')) || 0;
                                                if (isNewPrivileged) {
                                                    if (!isCardPrivileged || cardId > newId) {
                                                        insertBeforeTarget = card;
                                                        break;
                                                    }
                                                } else {
                                                    if (!isCardPrivileged && cardId > newId) {
                                                        insertBeforeTarget = card;
                                                        break;
                                                    }
                                                }
                                            }
                                            if (insertBeforeTarget) {
                                                content.insertBefore(newCard, insertBeforeTarget);
                                            } else {
                                                content.appendChild(newCard);
                                            }
                                            requestAnimationFrame(() => {
                                                newCard.style.opacity = '1';
                                                newCard.style.transform = 'translateY(0)';
                                            });
                                        }
                                    }
                                    if (app.admin && app.admin.refreshCounts) app.admin.refreshCounts();
                                }
                            } catch (err) {
                                console.error('Realtime insert photo error:', err);
                            }
                        }
                    });
                }
                channel = channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'vehicles' }, payload => {
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
                            app.setRealtimeStatus(true);
                        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
                            console.error('🔌 Realtime Error:', err);
                            app.setRealtimeStatus(false);
                        }
                    });
                app.realtimeChannel = channel;
                };
                app.initRealtimeChannel();
                
                window.addEventListener('visibilitychange', () => {
                    if (document.visibilityState === 'visible') {
                        if (!app.isReinitializing) {
                            app.reinitializeComponents();
                        }
                        const state = (app.realtimeChannel?.state || '').toLowerCase();
                        if (state !== 'joined' && state !== 'joining') {
                            console.log('🔄 Tab visible: Reconnecting Realtime...');
                            app.setRealtimeStatus(false);
                            if (typeof app.initRealtimeChannel === 'function') app.initRealtimeChannel();
                        }
                    }
                });
                window.addEventListener('offline', () => app.setRealtimeStatus(false));
                window.addEventListener('online', () => {
                    const state = (app.realtimeChannel?.state || '').toLowerCase();
                    if (app.realtimeChannel && state !== 'joined' && state !== 'joining') {
                        app.setRealtimeStatus(false);
                        if (typeof app.initRealtimeChannel === 'function') app.initRealtimeChannel();
                    } else {
                        app.setRealtimeStatus(true);
                    }
                });
            }
});
