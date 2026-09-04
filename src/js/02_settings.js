// Extracted to 02_settings.js
Object.assign(window.app, {
    notifications: { init: ()=>{}, add: async ()=>{} },

    settings: {
                search: (query, inputId = 'set-search-input-main', sugId = 'set-search-sug-main') => {
                    const box = document.getElementById(sugId);
                    if (!query.trim()) {
                        box.classList.remove('active');
                        return;
                    }
                    const keywords = [
                        { text: "Tùy chỉnh hồ sơ", tab: "profile", parent: "account", icon: "fa-user-pen" },
                        { text: "Avatar", tab: "profile", parent: "account", icon: "fa-user-pen" },
                        { text: "Đổi tên", tab: "profile", parent: "account", icon: "fa-user-pen" },
                        { text: "Bảo mật", tab: "security", parent: "account", icon: "fa-shield-halved" },
                        { text: "Mật khẩu", tab: "security", parent: "account", icon: "fa-shield-halved" },
                        { text: "Email", tab: "security", parent: "account", icon: "fa-shield-halved" },
                        { text: "Mã định danh (UUID)", tab: "security", parent: "account", icon: "fa-shield-halved" },
                        { text: "Liên kết tài khoản", tab: "links", parent: "account", icon: "fa-link" },
                        { text: "Google", tab: "links", parent: "account", icon: "fa-link" },
                        { text: "Discord", tab: "links", parent: "account", icon: "fa-link" },
                        { text: "Danh hiệu", tab: "badges", parent: "main", icon: "fa-medal" },
                        { text: "Role", tab: "badges", parent: "main", icon: "fa-discord" },
                        { text: "Cá nhân hóa", tab: "preference", parent: "main", icon: "fa-layer-group" },
                        { text: "Xe buýt", tab: "preference", parent: "main", icon: "fa-layer-group" },
                        { text: "Xe khách", tab: "preference", parent: "main", icon: "fa-layer-group" },
                        { text: "Gợi ý thông minh", tab: "preference", parent: "main", icon: "fa-layer-group" },
                        { text: "Cài đặt thông báo", tab: "notifications", parent: "account", icon: "fa-bell" },
                        { text: "Bật tắt thông báo", tab: "notifications", parent: "account", icon: "fa-bell" },
                        { text: "Tài liệu", tab: "docs-intro", parent: "docs", icon: "fa-markdown" },
                        { text: "Giới thiệu hệ thống", tab: "docs-intro", parent: "docs", icon: "fa-markdown" },
                        { text: "Quy định", tab: "docs-requirements", parent: "docs", icon: "fa-list-check" },
                        { text: "Kiểm duyệt", tab: "docs-requirements", parent: "docs", icon: "fa-list-check" },
                        { text: "Chính sách bảo mật", tab: "docs-policy", parent: "docs", icon: "fa-shield" },
                        { text: "Tiêu chuẩn bình luận", tab: "docs-chatrule", parent: "docs", icon: "fa-comments" },
                        { text: "Quy tắc bình luận", tab: "docs-chatrule", parent: "docs", icon: "fa-comments" },
                        { text: "Chat rule", tab: "docs-chatrule", parent: "docs", icon: "fa-comments" }
                    ];
                    const lowerQ = app.utils.cleanText(query.toLowerCase());
                    const words = lowerQ.split(/\s+/);
                    const results = keywords.filter(k => {
                        const target = k.text.toLowerCase();
                        return words.every(w => target.includes(w));
                    });
                    if (results.length > 0) {
                        box.innerHTML = results.map(r => `
                            <div class="suggestion-item border-b border-gray-100 last:border-0 flex items-center gap-3 py-3"
                                 onmousedown="event.preventDefault(); app.settings.jumpTo('${r.tab}', '${r.parent}'); document.getElementById('${inputId}').value=''; document.getElementById('${sugId}').classList.remove('active');">
                                <div class="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-500 shrink-0"><i class="${r.icon.includes('discord') ? 'fa-brands' : 'fa-solid'} ${r.icon}"></i></div>
                                <div class="text-[13px] text-black font-medium leading-snug">${r.text}</div>
                            </div>
                        `).join('');
                        box.classList.add('active');
                    } else {
                        box.innerHTML = `<div class="p-4 text-xs text-gray-500 text-center"><i class="fa-solid fa-magnifying-glass mr-1"></i> Không tìm thấy cài đặt nào phù hợp.</div>`;
                        box.classList.add('active');
                    }
                },
                jumpTo: (tab, parent) => {
                    app.settings.closeDocsMenu(true);
                    app.settings.closeAccountMenu(true);
                    app.settings.closeAccountMenu(true);
                    if (parent === 'account') app.settings.openAccountMenu();
                    if (parent === 'docs') app.settings.openDocsMenu();
                    app.settings.switchTab(tab);
                },
                openAccountMenu: () => {
                    const main = document.getElementById('set-menu-main');
                    const acc = document.getElementById('set-menu-account');
                    main.classList.add('hidden');
                    main.classList.remove('flex');
                    acc.classList.remove('hidden');
                    acc.classList.add('flex', 'slide-left-enter');
                    acc.classList.remove('slide-right-enter');
                },
                closeAccountMenu: (instant = false) => {
                    const main = document.getElementById('set-menu-main');
                    const acc = document.getElementById('set-menu-account');
                    if (instant) {
                        acc.classList.add('hidden');
                        acc.classList.remove('flex', 'slide-left-enter', 'slide-right-enter');
                        main.classList.remove('hidden', 'slide-left-enter', 'slide-right-enter');
                        main.classList.add('flex');
                    } else {
                        acc.classList.add('hidden');
                        acc.classList.remove('flex');
                        main.classList.remove('hidden');
                        main.classList.add('flex', 'slide-right-enter');
                        main.classList.remove('slide-left-enter');
                    }
                },
                open: async (targetTab = null, targetParent = null) => {
                    const modal = document.getElementById('settings-modal');
                    const content = document.getElementById('settings-content');
                    app.ui.toggleUserMenu(false);
                    app.settings.closeDocsMenu(true);
                    app.settings.closeAccountMenu(true);
                    if (targetParent === 'account') app.settings.openAccountMenu();
                    else if (targetParent === 'docs') app.settings.openDocsMenu();
                    if (app.user) {
                        document.querySelectorAll('.account-only-btn').forEach(el => el.style.display = '');
                        if (app.user.email) {
                            const currentEmailEl = document.getElementById('set-current-email');
                            if (currentEmailEl) currentEmailEl.innerText = app.user.email;
                        }
                        app.settings.switchTab(targetTab || 'blank');
                        app.settings.loadIdentities();
                        const avatarImg = document.getElementById('set-avatar-img');
                        try {
                            const { data: profile } = await window.sb.from('profiles').select('avatar_url, preferences').eq('id', app.user.id).single();
                            if (profile && profile.avatar_url) {
                                const safeUrl = profile.avatar_url.replace(/"/g, '');
                                avatarImg.src = app.utils.getProxiedUrl(safeUrl, 'avatar.jpg', 'avatar');
                            } else {
                                avatarImg.src = DEFAULT_AVATAR;
                            }
                            const contactInput = document.getElementById('set-contact-email');
                            if (contactInput) {
                                contactInput.value = (profile && profile.preferences && profile.preferences.contact_email) ? profile.preferences.contact_email : '';
                            }
                        } catch (e) {
                            avatarImg.src = app.user.user_metadata?.avatar_url ? app.utils.getProxiedUrl(app.user.user_metadata.avatar_url, 'avatar.jpg', 'avatar') : DEFAULT_AVATAR;
                        }
                        avatarImg.onerror = () => { avatarImg.src = DEFAULT_AVATAR; };
                    } else {
                        document.querySelectorAll('.account-only-btn').forEach(el => el.style.display = 'none');
                        app.settings.switchTab(targetTab || 'blank');
                        app.preference.updateUI();
                    }
                    modal.classList.remove('hidden');
                    app.ui.lockScroll();
                    setTimeout(() => {
                        content.classList.remove('opacity-0', 'scale-95');
                        content.classList.add('opacity-100', 'scale-100');
                    }, 10);
                },
                close: () => {
                    const modal = document.getElementById('settings-modal');
                    const content = document.getElementById('settings-content');
                    content.classList.remove('opacity-100', 'scale-100');
                    content.classList.add('opacity-0', 'scale-95');
                    setTimeout(() => {
                        modal.classList.add('hidden');
                        app.ui.unlockScroll();
                    }, 200);
                },
                openDocsMenu: () => {
                    const main = document.getElementById('set-menu-main');
                    const docs = document.getElementById('set-menu-docs');
                    main.classList.add('hidden');
                    main.classList.remove('flex');
                    docs.classList.remove('hidden');
                    docs.classList.add('flex', 'slide-left-enter');
                    docs.classList.remove('slide-right-enter');
                },
                closeDocsMenu: (instant = false) => {
                    const main = document.getElementById('set-menu-main');
                    const docs = document.getElementById('set-menu-docs');
                    if (instant) {
                        docs.classList.add('hidden');
                        docs.classList.remove('flex', 'slide-left-enter', 'slide-right-enter');
                        main.classList.remove('hidden', 'slide-left-enter', 'slide-right-enter');
                        main.classList.add('flex');
                    } else {
                        docs.classList.add('hidden');
                        docs.classList.remove('flex');
                        main.classList.remove('hidden');
                        main.classList.add('flex', 'slide-right-enter');
                        main.classList.remove('slide-left-enter');
                    }
                },
                switchTab: (tab) => {
                    const tabs = ['blank', 'profile', 'security', 'links', 'badges', 'preference', 'docs-intro', 'docs-requirements', 'docs-policy', 'docs-chatrule'];
                    const activeClasses = ['bg-black', 'text-white', 'border-black', 'shadow-sm'];
                    const inactiveClasses = ['bg-white', 'text-gray-600', 'hover:bg-gray-50', 'border-gray-200'];
                    tabs.forEach(t => {
                        const btn = document.getElementById('set-tab-' + t);
                        const content = document.getElementById('set-content-' + t);
                        if(!btn || !content) return;
                        if(t === tab) {
                            btn.classList.remove(...inactiveClasses);
                            btn.classList.add(...activeClasses);
                            content.classList.remove('hidden');
                            content.classList.add('block');
                            if (t.startsWith('docs-')) {
                                app.docs.fetchContent(t);
                            } else if (t === 'X') {
                            } else if (t === 'preference') {
                                app.preference.tempSelection = app.preference.current || 'both';
                                app.preference.updateUI();
                            }
                        } else {
                            btn.classList.remove(...activeClasses);
                            btn.classList.add(...inactiveClasses);
                            content.classList.add('hidden');
                            content.classList.remove('block');
                        }
                    });
                    if (tab === 'links') {
                        app.settings.loadIdentities();
                        if (app.settings.loadDiscordVerifyStatus) app.settings.loadDiscordVerifyStatus();
                    }
                    if (tab === 'badges') {
                        app.settings.loadBadges();
                        app.settings.loadWebBadges();
                    }
                },
                loadDiscordVerifyStatus: async () => {
                    const actionBtn = document.getElementById('discord-verify-action');
                    if (!actionBtn) return;
                    actionBtn.innerHTML = `<button disabled class="px-4 py-2 bg-gray-200 text-gray-400 text-xs font-bold rounded cursor-not-allowed border border-gray-300 whitespace-nowrap"><i class="fa-solid fa-spinner fa-spin"></i></button>`;
                    try {
                        const { data: { session } } = await window.sb.auth.getSession();
                        if (!session) return;
                        const { count } = await window.sb.from('photos').select('*', { count: 'estimated', head: true }).eq('uploader_id', app.user.id).eq('status', 'approved');
                        const res = await fetch('/api/discord', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                            body: JSON.stringify({ action: 'status' })
                        });
                        const data = await res.json();
                        if (!data.linked) {
                            actionBtn.innerHTML = `<button onclick="app.settings.jumpTo('badges', 'main')" class="px-4 py-2 bg-black text-white text-xs font-bold rounded hover:bg-gray-800 transition shadow-sm border border-black whitespace-nowrap">Liên kết Discord</button>`;
                            return;
                        }
                        if (!data.inServer) {
                            actionBtn.innerHTML = `<a href="https://discord.com/invite/BNWyqbuvwq" target="_blank" class="px-4 py-2 bg-[#5865F2] text-white text-xs font-bold rounded hover:bg-[#4752C4] transition shadow-sm border border-[#5865F2] whitespace-nowrap inline-block text-center">Tham gia Server</a>`;
                            return;
                        }
                        const isClaimed = data.claimedRoles && data.claimedRoles.includes('1519296926477058203');
                        const isEligible = (count || 0) >= 1;
                        if (isClaimed) {
                            actionBtn.innerHTML = `<button disabled class="px-4 py-2 bg-gray-100 text-gray-400 text-xs font-bold rounded cursor-not-allowed border border-gray-200 whitespace-nowrap"><i class="fa-solid fa-check mr-1"></i> Đã xác minh</button>`;
                        } else if (isEligible) {
                            actionBtn.innerHTML = `<button id="btn-claim-discord-1" onclick="app.settings.claimDiscordVerify()" class="px-4 py-2 bg-black text-white text-xs font-bold rounded hover:bg-gray-800 transition shadow-sm border border-black whitespace-nowrap">Xác minh ngay</button>`;
                        } else {
                            actionBtn.innerHTML = `<button disabled class="px-4 py-2 bg-gray-50 text-gray-400 text-xs font-bold rounded cursor-not-allowed border border-gray-200 whitespace-nowrap"><i class="fa-solid fa-lock mr-1"></i> Chưa đủ đ/k</button>`;
                        }
                    } catch (err) {
                        actionBtn.innerHTML = `<p class="text-xs text-red-500">Lỗi: ${err.message}</p>`;
                    }
                },
                claimDiscordVerify: async () => {
                    const btn = document.getElementById('btn-claim-discord-1');
                    if (btn) btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;
                    try {
                        const { data: { session } } = await window.sb.auth.getSession();
                        const res = await fetch('/api/discord', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                            body: JSON.stringify({ action: 'claim', tier: 1 })
                        });
                        const data = await res.json();
                        if (res.ok) {
                            app.ui.showAlert(data.message || 'Xác minh Discord thành công!');
                            app.settings.loadDiscordVerifyStatus();
                        } else {
                            app.ui.showAlert(data.error || 'Lỗi xác minh.');
                            app.settings.loadDiscordVerifyStatus();
                        }
                    } catch (err) {
                        app.ui.showAlert('Lỗi: ' + err.message);
                        app.settings.loadDiscordVerifyStatus();
                    }
                },
                loadIdentities: async () => {
                    const container = document.getElementById('linked-accounts-container');
                    if(!app.user) return;
                    try {
                        const { data: { user }, error } = await window.sb.auth.getUser();
                        if (error || !user) throw error;
                        const identities = user.identities || [];
                        const providers = identities.map(id => id.provider);
                        const renderProvider = (name, iconClass, colorClass, providerKey) => {
                            const isLinked = providers.includes(providerKey);
                            const identity = identities.find(id => id.provider === providerKey);
                            const identityId = identity ? identity.identity_id : null;
                            return `
                            <div class="flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-gray-200 rounded-md bg-gray-50 gap-3">
                                <div class="flex items-center gap-3">
                                    <div class="w-8 h-8 rounded-full ${colorClass} text-white flex items-center justify-center text-lg shadow-sm shrink-0">
                                        <i class="${iconClass}"></i>
                                    </div>
                                    <div>
                                        <p class="font-bold text-sm text-gray-800">${name}</p>
                                        <p class="text-[10px] ${isLinked ? 'text-green-600 font-bold' : 'text-gray-500'}">${isLinked ? '<i class="fa-solid fa-check mr-1"></i> Đã liên kết' : 'Chưa liên kết'}</p>
                                    </div>
                                </div>
                                <div>
                                    ${isLinked
                                        ? `<button onclick="app.settings.unlinkIdentity('${identityId}', '${name}')" class="w-full sm:w-auto text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-4 py-2 rounded-md hover:bg-red-100 transition shadow-sm">Hủy liên kết</button>`
                                        : `<button onclick="app.settings.linkIdentity('${providerKey}')" class="w-full sm:w-auto text-xs font-bold text-black bg-white border border-black px-4 py-2 rounded-md hover:bg-gray-100 transition shadow-sm">Thêm liên kết</button>`
                                    }
                                </div>
                            </div>
                            `;
                        };
                        container.innerHTML =
                            renderProvider('Google', 'fa-brands fa-google', 'bg-red-500', 'google') +
                            renderProvider('Discord', 'fa-brands fa-discord', 'bg-[#5865F2]', 'discord') +
                            renderProvider('GitHub', 'fa-brands fa-github', 'bg-[#24292e]', 'github');
                    } catch (err) {
                        container.innerHTML = `<p class="text-xs text-red-500">Lỗi lấy thông tin liên kết: ${err.message}</p>`;
                    }
                },
                linkIdentity: async (provider) => {
                    try {
                        const { error } = await window.sb.auth.linkIdentity({
                            provider: provider,
                            options: { redirectTo: window.location.origin }
                        });
                        if (error) throw error;
                    } catch (err) {
                        app.ui.showAlert("Lỗi liên kết: " + err.message);
                    }
                },
                unlinkIdentity: async (identityId, providerName) => {
                    app.ui.showAlert(
                        `Bạn có chắc chắn muốn hủy liên kết tài khoản ${providerName}? Bạn sẽ không thể đăng nhập bằng nền tảng này nữa. Nếu đã được cấp danh hiệu thông qua nền tảng này, chúng cũng sẽ bị thu hồi.`,
                        async () => {
                            try {
                                const { data: { session } } = await window.sb.auth.getSession();
                                if (!session) throw new Error("Chưa đăng nhập");

                                // Call backend API to revoke roles/badges before unlinking
                                const apiRes = await fetch('/api/unlink', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${session.access_token}`
                                    },
                                    body: JSON.stringify({ provider: providerName.toLowerCase() })
                                });
                                
                                if (!apiRes.ok) {
                                    const apiData = await apiRes.json();
                                    console.error("Lỗi thu hồi quyền backend:", apiData.error);
                                    // Vẫn tiếp tục thực hiện unlink Identity dù backend có lỗi
                                }

                                const { error } = await window.sb.auth.unlinkIdentity({ identity_id: identityId });
                                if (error) throw error;

                                app.ui.showAlert(`Đã hủy liên kết với ${providerName} thành công!`);
                                app.settings.loadIdentities();
                            } catch (err) {
                                app.ui.showAlert("Lỗi hủy liên kết: " + err.message);
                            }
                        },
                        () => {},
                        { btnOkText: "Hủy liên kết", btnCancelText: "Đóng", title: "Xác nhận" }
                    );
                },
                claimWebBadge: async () => {
                    const btn = document.getElementById('web-req-claim-action');
                    if (btn) btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;
                    try {
                        const { data: { session } } = await window.sb.auth.getSession();
                        const res = await fetch('/api/github', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                            body: JSON.stringify({ action: 'claim' })
                        });
                        const data = await res.json();
                        if (res.ok) {
                            app.ui.showAlert(data.message || 'Nhận danh hiệu thành công!');
                            app.settings.loadWebBadges();
                        } else {
                            app.ui.showAlert(data.error || 'Lỗi nhận danh hiệu.');
                            app.settings.loadWebBadges();
                        }
                    } catch (err) {
                        app.ui.showAlert('Lỗi: ' + err.message);
                        app.settings.loadWebBadges();
                    }
                },
                loadWebBadges: async () => {
                    const loading = document.getElementById('web-badge-loading');
                    const claimBox = document.getElementById('web-badge-claim-list');
                    
                    if (loading) loading.classList.remove('hidden');
                    if (claimBox) claimBox.classList.add('hidden');
                    
                    try {
                        const { data: { session } } = await window.sb.auth.getSession();
                        if (!session) return;
                        
                        const res = await fetch('/api/github', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
                            body: JSON.stringify({ action: 'status' })
                        });
                        const data = await res.json();
                        
                        if (loading) loading.classList.add('hidden');
                        if (claimBox) claimBox.classList.remove('hidden');
                        
                        const claimActionContainer = document.getElementById('web-req-claim-action-container');
                        
                        if (data.isDev) {
                            if (claimActionContainer) {
                                claimActionContainer.innerHTML = `<button disabled class="px-4 py-2 bg-gray-100 text-gray-400 text-xs font-bold rounded cursor-not-allowed border border-gray-200 whitespace-nowrap"><i class="fa-solid fa-check mr-1"></i> Đã nhận</button>`;
                            }
                            return;
                        }
                        
                        if (data.linked) {
                            if (claimActionContainer) {
                                claimActionContainer.innerHTML = `<button id="web-req-claim-action" onclick="app.settings.claimWebBadge()" class="px-4 py-2 bg-black text-white text-xs font-bold rounded hover:bg-gray-800 transition shadow-sm whitespace-nowrap w-full sm:w-auto">Xác minh ngay</button>`;
                            }
                        } else {
                            if (claimActionContainer) {
                                claimActionContainer.innerHTML = `<button onclick="app.settings.switchTab('links')" class="px-4 py-2 bg-black text-white text-xs font-bold rounded hover:bg-gray-800 transition shadow-sm whitespace-nowrap w-full sm:w-auto">Liên kết GitHub</button>`;
                            }
                        }
                    } catch (err) {
                        if (loading) {
                            loading.innerHTML = `<p class="text-xs text-red-500">Lỗi: ${err.message}</p>`;
                            loading.classList.remove('hidden');
                        }
                    }
                },
                loadBadges: async () => {
                    const loading = document.getElementById('badge-loading');
                    const reqBox = document.getElementById('badge-requirements');
                    const claimBox = document.getElementById('badge-claim-list');
                    loading.classList.remove('hidden');
                    reqBox.classList.add('hidden');
                    claimBox.classList.add('hidden');
                    try {
                        const { data: { session } } = await window.sb.auth.getSession();
                        const token = session?.access_token;
                        if (!token) throw new Error("Chưa đăng nhập");
                        const res = await fetch('/api/discord', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ action: 'status' })
                        });
                        const data = await res.json();
                        app.customRoleDetails = data.customRoleDetails || null;
                        if (!data.linked || !data.inServer) {
                            loading.classList.add('hidden');
                            reqBox.classList.remove('hidden');
                            const reqLinkContainer = document.getElementById('req-link-container');
                            const reqLinkStatus = document.getElementById('req-link-status');
                            const reqLinkAction = document.getElementById('req-link-action');
                            const reqServerContainer = document.getElementById('req-server-container');
                            const reqServerStatus = document.getElementById('req-server-status');
                            const reqServerAction = document.getElementById('req-server-action');
                            const incompleteClasses = ['bg-red-50', 'border', 'border-red-200'];
                            const completeClasses = ['bg-green-50', 'border', 'border-green-200'];
                            if (data.linked) {
                                reqLinkContainer.classList.add(...completeClasses);
                                reqLinkContainer.classList.remove(...incompleteClasses);
                                reqLinkStatus.className = 'flex items-center gap-3 text-sm font-medium text-green-800';
                                reqLinkStatus.innerHTML = `<i class="fa-solid fa-check-circle w-5 text-center text-green-600"></i> <span>Đã liên kết tài khoản Discord</span>`;
                                reqLinkAction.classList.add('hidden');
                            } else {
                                reqLinkContainer.classList.add(...incompleteClasses);
                                reqLinkContainer.classList.remove(...completeClasses);
                                reqLinkStatus.className = 'flex items-center gap-3 text-sm font-medium text-red-800';
                                reqLinkStatus.innerHTML = `<i class="fa-solid fa-times-circle w-5 text-center text-red-600"></i> <span>Chưa liên kết tài khoản Discord</span>`;
                                reqLinkAction.classList.remove('hidden');
                            }
                            if (data.inServer) {
                                reqServerContainer.classList.add(...completeClasses);
                                reqServerContainer.classList.remove(...incompleteClasses);
                                reqServerStatus.className = 'flex items-center gap-3 text-sm font-medium text-green-800';
                                reqServerStatus.innerHTML = `<i class="fa-solid fa-check-circle w-5 text-center text-green-600"></i> <span>Đã tham gia Server</span>`;
                                reqServerAction.classList.add('hidden');
                            } else {
                                reqServerContainer.classList.add(...incompleteClasses);
                                reqServerContainer.classList.remove(...completeClasses);
                                reqServerStatus.className = 'flex items-center gap-3 text-sm font-medium text-red-800';
                                reqServerStatus.innerHTML = `<i class="fa-solid fa-times-circle w-5 text-center text-red-600"></i> <span>Chưa tham gia Server VNBUSARCHIVE</span>`;
                                reqServerAction.classList.remove('hidden');
                            }
                            return;
                        }
                        const { count } = await window.sb.from('photos')
                            .select('*', { count: 'estimated', head: true })
                            .eq('uploader_id', app.user.id)
                            .eq('status', 'approved');
                        document.getElementById('badge-photo-count').innerText = count || 0;
const ROLE_MAP_FRONTEND = {
    50: '1506239795175620728',
    100: '1505158627747561482',
    200: '1505158752372920320',
    500: '1505158986725462078',
    1000: '1505159111686488164'
};
const tiers = [50, 100, 200, 500, 1000, 2000];
const grid = document.getElementById('badges-grid');
grid.innerHTML = tiers.map(tier => {
    if (tier === 2000) {
        const hasCustomRole = !!data.customRoleId;
        const isEligible = (count || 0) >= 2000;
        let btnHtml = '';
        if (hasCustomRole) {
            btnHtml = `<button onclick="app.openCustomRolePrompt(true)" class="px-4 py-2 bg-gray-100 text-gray-800 text-xs font-bold rounded-md border border-gray-300 hover:bg-gray-200 transition whitespace-nowrap"><i class="fa-solid fa-pen mr-1"></i> Sửa Role</button>`;
        } else if (isEligible) {
            btnHtml = `<button onclick="app.openCustomRolePrompt(false)" class="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-md hover:opacity-90 transition shadow-sm whitespace-nowrap">Tạo Role Riêng</button>`;
        } else {
            btnHtml = `<button disabled class="px-4 py-2 bg-gray-50 text-gray-400 text-xs font-bold rounded cursor-not-allowed border border-gray-200 whitespace-nowrap"><i class="fa-solid fa-lock mr-1"></i> Chưa đủ đ/k</button>`;
        }
        return `
        <div class="flex items-center justify-between p-3 border border-purple-200 rounded-md bg-purple-50">
            <div class="flex items-center gap-3 overflow-hidden">
                <div class="w-10 h-10 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center text-lg text-purple-600 shrink-0">
                    <i class="fa-solid fa-wand-magic-sparkles"></i>
                </div>
                <div class="overflow-hidden">
                    <p class="font-bold text-sm text-purple-900 truncate">Cột mốc 2000 ảnh</p>
                    <p class="text-[10px] text-purple-700">Đặc quyền tạo Role Custom riêng biệt.</p>
                </div>
            </div>
            <div>${btnHtml}</div>
        </div>`;
    }
    const roleId = ROLE_MAP_FRONTEND[tier];
    const isClaimed = data.claimedRoles.includes(roleId);
    const isEligible = (count || 0) >= tier;
    let btnHtml = '';
    if (isClaimed) {
        btnHtml = `<button disabled class="px-4 py-2 bg-gray-100 text-gray-400 text-xs font-bold rounded cursor-not-allowed border border-gray-200 whitespace-nowrap"><i class="fa-solid fa-check mr-1"></i> Đã nhận</button>`;
    } else if (isEligible) {
        btnHtml = `<button id="btn-claim-${tier}" onclick="app.settings.claimBadge(${tier})" class="px-4 py-2 bg-black text-white text-xs font-bold rounded hover:bg-gray-800 transition shadow-sm border border-black whitespace-nowrap">Nhận Role</button>`;
    } else {
        btnHtml = `<button disabled class="px-4 py-2 bg-gray-50 text-gray-400 text-xs font-bold rounded cursor-not-allowed border border-gray-200 whitespace-nowrap"><i class="fa-solid fa-lock mr-1"></i> Chưa đủ đ/k</button>`;
    }
    return `
    <div class="flex items-center justify-between p-3 border border-gray-200 rounded-md bg-white">
        <div class="flex items-center gap-3 overflow-hidden">
            <div class="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-lg text-black shrink-0">
                <i class="fa-solid fa-medal"></i>
            </div>
            <div class="overflow-hidden">
                <p class="font-bold text-sm text-gray-800 truncate">Cột mốc ${tier} ảnh</p>
                <p class="text-[10px] text-gray-500">Yêu cầu: Đóng góp ${tier}+ ảnh được duyệt.</p>
            </div>
        </div>
        <div>${btnHtml}</div>
    </div>`;
}).join('');
                        loading.classList.add('hidden');
                        claimBox.classList.remove('hidden');
                    } catch (err) {
                        loading.innerHTML = `<span class="text-red-500"><i class="fa-solid fa-triangle-exclamation"></i> Lỗi: ${err.message}</span>`;
                    }
                },
                claimBadge: async (tier) => {
                    const btn = document.getElementById(`btn-claim-${tier}`);
                    const originalText = btn.innerHTML;
                    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                    btn.disabled = true;
                    try {
                        const { data: { session } } = await window.sb.auth.getSession();
                        const token = session?.access_token;
                        const res = await fetch('/api/discord', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ action: 'claim', tier: tier })
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error || 'Lỗi không xác định');
                        app.toast.show('success', 'Thành công', data.message || "Đã nhận Role thành công!");
                        app.settings.loadBadges();
                    } catch (err) {
                        app.ui.showAlert("Lỗi: " + err.message);
                        btn.innerHTML = originalText;
                        btn.disabled = false;
                    }
}
                },

    docs: {
                open: () => {
                    app.settings.open();
                    app.settings.openDocsMenu();
                },
                close: () => {
                },
                fetchContent: async (tab) => {
                    const container = document.getElementById('set-content-' + tab);
                    if (!container || container.dataset.loaded === 'true') return;
                    const url = container.dataset.url;
                    try {
                        const res = await fetch(url);
                        if (!res.ok) throw new Error('Lỗi mạng');
                        const text = await res.text();
                        const html = DOMPurify.sanitize(marked.parse(text));
                        container.innerHTML = html;
                        container.dataset.loaded = 'true';
                    } catch (e) {
                        container.innerHTML = `
                            <p class="text-red-500 font-bold py-4 text-center"><i class="fa-solid fa-triangle-exclamation"></i> Không thể tải nội dung tự động.</p>
                            <div class="text-center mt-2">
                                <a href="${url.replace('raw.githubusercontent.com/hoyuuna', 'github.com/hoyuuna').replace('/refs/heads/', '/blob/')}" target="_blank" class="inline-flex items-center gap-1.5 bg-black text-white px-4 py-2 rounded-md font-bold hover:bg-gray-800 transition text-[11px] uppercase">
                                    <i class="fa-solid fa-arrow-up-right-from-square text-sm"></i> Xem chi tiết
                                </a>
                            </div>
                        `;
                    }
                }
            }
});
