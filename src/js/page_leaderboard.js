// Extracted to page_leaderboard.js
Object.assign(window.app, {
    topUploaders: {},

    leaderboard: {
        load: async () => {
            if (window.location.pathname !== '/leaderboard') {
                app.utils.navigate('/leaderboard');
                return;
            }
            document.title = 'Bảng xếp hạng đóng góp | VNBUSARCHIVE';
            app.views.switch('leaderboard', false);
            const container = document.getElementById('leaderboard-content');
            if (!container) return;
            container.innerHTML = `
                <div class="py-16 text-center text-gray-500">
                    <i class="fa-solid fa-spinner fa-spin text-2xl mb-3 block text-black"></i>
                    <span class="text-sm font-medium">Đang tải bảng xếp hạng...</span>
                </div>
            `;
            try {
                await app.utils.fetchTopUploaders();
                const counts = app.topUploadersCounts || {};
                let allApprovedPhotos = [];
                let fromIndex = 0;
                let batchSize = 999;
                let hasMore = true;
                while (hasMore) {
                    const { data, error: phErr } = await window.sb
                        .from('photos')
                        .select('uploader_id, views')
                        .eq('status', 'approved')
                        .range(fromIndex, fromIndex + batchSize);
                    if (phErr || !data) break;
                    allApprovedPhotos.push(...data);
                    if (data.length <= batchSize) hasMore = false;
                    fromIndex += batchSize + 1;
                }
                const viewCounts = {};
                allApprovedPhotos.forEach(p => {
                    if (!p.uploader_id) return;
                    viewCounts[p.uploader_id] = (viewCounts[p.uploader_id] || 0) + (Number(p.views) || 0);
                });
                const { data: allProfiles, error: prErr } = await window.sb.from('profiles').select('id, username, avatar_url, role, subroles, ban_status');
                if (prErr) throw prErr;
                const activeProfiles = (allProfiles || []).filter(p => p.ban_status !== 'banned' && p.username);
                const totalAccounts = activeProfiles.length;
                activeProfiles.forEach(p => {
                    p.photoCount = counts[p.id] || 0;
                    p.viewCount = viewCounts[p.id] || 0;
                });
                const spotters = activeProfiles
                    .filter(p => p.photoCount > 0)
                    .sort((a, b) => {
                        if (b.photoCount !== a.photoCount) return b.photoCount - a.photoCount;
                        return b.viewCount - a.viewCount;
                    });
                const topSpotters = spotters.slice(0, 10);
                const adminManagers = activeProfiles
                    .filter(p => p.role === 'admin' || p.role === 'manager')
                    .sort((a, b) => {
                        if (a.role === 'manager' && b.role !== 'manager') return -1;
                        if (a.role !== 'manager' && b.role === 'manager') return 1;
                        if (b.photoCount !== a.photoCount) return b.photoCount - a.photoCount;
                        return b.viewCount - a.viewCount;
                    });
                const otherCount = Math.max(0, totalAccounts - 10);
                app.leaderboard.render(topSpotters, adminManagers, otherCount);
            } catch (err) {
                container.innerHTML = `
                    <div class="bg-white border border-gray-200 rounded-2xl shadow-sm p-10 text-center text-red-500 font-medium">
                        <i class="fa-solid fa-triangle-exclamation text-2xl mb-2 block"></i>
                        Lỗi khi tải dữ liệu bảng xếp hạng: ${err.message}
                    </div>
                `;
            } finally {
                app.loadingBar.finish();
            }
        },
        render: (topSpotters, adminManagers, otherCount) => {
            const container = document.getElementById('leaderboard-content');
            if (!container) return;
            const oldHeader = container.previousElementSibling;
            if (oldHeader && oldHeader.innerHTML.includes('Top những spotter')) {
                oldHeader.remove();
            }
            const top1 = topSpotters[0];
            const top2 = topSpotters[1];
            const top3 = topSpotters[2];
            const headerHtml = `
                <div class="bg-white border border-gray-200 rounded-2xl p-6 md:p-10 mb-8 shadow-sm text-center relative overflow-hidden flex flex-col items-center justify-center">
                    <div class="w-16 h-16 bg-gray-50 text-black border border-gray-200 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 shadow-sm">
                        <i class="fa-solid fa-ranking-star"></i>
                    </div>
                    <h2 class="text-2xl md:text-3xl font-black text-black mb-2 tracking-tight">Bảng xếp hạng đóng góp</h2>
                    <p class="text-sm text-gray-500 font-medium max-w-lg mx-auto leading-relaxed">
                        Vinh danh những Spotter xuất sắc nhất đã cống hiến xây dựng kho dữ liệu VNBUSARCHIVE.
                    </p>
                </div>
            `;
            const renderTopCard = (user, rank) => {
                if (!user) return '';
                const config = {
                    1: {
                        order: 'order-1 md:order-2', 
                        border: 'border-black border-2 shadow-md',
                        badgeStyle: 'bg-black text-white',
                        icon: '<i class="fa-solid fa-crown text-yellow-400"></i>',
                        title: 'TOP 1'
                    },
                    2: {
                        order: 'order-2 md:order-1',
                        border: 'border-gray-200 border shadow-sm',
                        badgeStyle: 'bg-gray-100 text-gray-700 border border-gray-200',
                        icon: '<i class="fa-solid fa-medal text-gray-500"></i>',
                        title: 'TOP 2'
                    },
                    3: {
                        order: 'order-3 md:order-3',
                        border: 'border-gray-200 border shadow-sm',
                        badgeStyle: 'bg-gray-100 text-gray-700 border border-gray-200',
                        icon: '<i class="fa-solid fa-award text-amber-700"></i>',
                        title: 'TOP 3'
                    }
                };
                const style = config[rank];
                const avatar = user.avatar_url ? app.utils.getProxiedUrl(user.avatar_url, 'avatar.jpg', 'avatar') : DEFAULT_AVATAR;
                return `
                    <div class="${style.order} flex-1 w-full min-w-0">
                        <div onclick="app.utils.navigate('/user/${encodeURIComponent(user.username)}')" 
                             class="cursor-pointer bg-white ${style.border} rounded-2xl p-6 flex flex-col items-center text-center group hover:-translate-y-1 hover:shadow-lg transition-all duration-300 h-full relative">
                            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-black uppercase tracking-wider mb-5 ${style.badgeStyle}">
                                ${style.icon} ${style.title}
                            </div>
                            <div class="w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden shrink-0 mx-auto border border-gray-200 bg-gray-50 shadow-inner mb-4 transition-transform">
                                <img loading="lazy" src="${avatar}" onerror="this.src='${DEFAULT_AVATAR}'" class="w-full h-full object-cover block">
                            </div>
                            <div class="font-extrabold text-black text-xl md:text-2xl w-full truncate mb-2 transition-colors">${app.utils.cleanText(user.username)}</div>
                            <div class="flex items-center justify-center gap-1.5 flex-wrap mb-6 min-h-[20px]">
                                ${app.utils.getBadgesHTML(user.id, user.role, user.subroles)}
                            </div>
                            <div class="w-full border-t border-gray-100 pt-4 mt-auto grid grid-cols-2 gap-2 divide-x divide-gray-100">
                                <div>
                                    <div class="font-black text-black text-xl leading-none mb-1">${user.photoCount}</div>
                                    <div class="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Ảnh</div>
                                </div>
                                <div>
                                    <div class="font-black text-gray-800 text-xl leading-none mb-1">${app.utils.formatCompact(user.viewCount)}</div>
                                    <div class="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Lượt xem</div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            };
            const top3Html = (top1 || top2 || top3) ? `
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 mb-10 items-stretch">
                    ${renderTopCard(top2, 2)}
                    ${renderTopCard(top1, 1)}
                    ${renderTopCard(top3, 3)}
                </div>
            ` : '';
            const restSpotters = topSpotters.slice(3, 10);
            const restHtml = restSpotters.length > 0 ? `
                <div class="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-10">
                    <div class="divide-y divide-gray-100">
                        ${restSpotters.map((user, idx) => {
                            const rank = idx + 4;
                            const avatar = user.avatar_url ? app.utils.getProxiedUrl(user.avatar_url, 'avatar.jpg', 'avatar') : DEFAULT_AVATAR;
                            return `
                                <div onclick="app.utils.navigate('/user/${encodeURIComponent(user.username)}')" 
                                     class="cursor-pointer px-5 md:px-6 py-4 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors group">
                                    <div class="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                                        <div class="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 text-gray-600 font-black text-sm flex items-center justify-center shrink-0 group-hover:bg-black group-hover:text-white transition-colors">
                                            #${rank}
                                        </div>
                                        <div class="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden shrink-0 border border-gray-200 bg-gray-50">
                                            <img loading="lazy" src="${avatar}" onerror="this.src='${DEFAULT_AVATAR}'" class="w-full h-full object-cover block">
                                        </div>
                                        <div class="min-w-0 flex-1">
                                            <div class="font-extrabold text-black text-sm md:text-base truncate transition-colors">${app.utils.cleanText(user.username)}</div>
                                            <div class="flex items-center gap-1.5 mt-1 flex-wrap">
                                                ${app.utils.getBadgesHTML(user.id, user.role, user.subroles)}
                                            </div>
                                        </div>
                                    </div>
                                    <div class="text-right shrink-0">
                                        <div class="font-black text-black text-base md:text-lg leading-none mb-1">${user.photoCount}</div>
                                        <div class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">${app.utils.formatCompact(user.viewCount)} Lượt xem</div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            ` : '';
            const adminManagersHtml = adminManagers.length > 0 ? `
                <div class="mb-10">
                    <div class="flex items-center gap-3 mb-5">
                        <h3 class="font-bold text-sm uppercase text-gray-500 tracking-widest"><i class="fa-solid fa-user-shield mr-1.5 text-black"></i> Đội ngũ quản trị</h3>
                        <div class="h-px bg-gray-200 flex-1"></div>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                        ${adminManagers.map(user => {
                            const avatar = user.avatar_url ? app.utils.getProxiedUrl(user.avatar_url, 'avatar.jpg', 'avatar') : DEFAULT_AVATAR;
                            return `
                                <div onclick="app.utils.navigate('/user/${encodeURIComponent(user.username)}')" 
                                     class="cursor-pointer bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:border-black hover:shadow-md transition-all flex items-center gap-3 md:gap-4 group">
                                    <div class="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-gray-200 bg-gray-50">
                                        <img loading="lazy" src="${avatar}" onerror="this.src='${DEFAULT_AVATAR}'" class="w-full h-full object-cover block">
                                    </div>
                                    <div class="min-w-0 flex-1">
                                        <div class="font-bold text-black text-sm truncate transition-colors">${app.utils.cleanText(user.username)}</div>
                                        <div class="mt-1 flex items-center gap-1 flex-wrap">${app.utils.getBadgesHTML(user.id, user.role, user.subroles)}</div>
                                    </div>
                                    <div class="text-right shrink-0 border-l border-gray-100 pl-3 md:pl-4">
                                        <div class="font-black text-black text-sm leading-none mb-1">${user.photoCount}</div>
                                        <div class="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Ảnh</div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            ` : '';
            const footerHtml = `
                <div class="text-center py-6">
                    <p class="text-[13px] font-bold text-gray-500">
                        Cùng với <span class="text-black font-black">${otherCount}</span> thành viên khác.
                    </p>
                    <p class="text-sm font-black text-black mt-1 uppercase tracking-tight">
                        Cảm ơn mọi sự đóng góp của các bạn!
                    </p>
                </div>
            `;
            container.innerHTML = headerHtml + top3Html + restHtml + adminManagersHtml + footerHtml;
        }
    }
});
