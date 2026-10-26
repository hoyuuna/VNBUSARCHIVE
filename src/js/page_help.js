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
                        const bgClass = isActive ? 'bg-black border-black shadow-sm' : 'bg-white hover:bg-gray-50 border-gray-200';
                        return `
                        <div class="p-3 rounded-lg cursor-pointer mb-2 border transition-colors ${bgClass}" onclick="app.newsboard.renderContent(${index})">
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
                        app.ui.unlockScroll();
                    }, 200);
                }
            },

    help: {
                data: [],
                policies: [
                    { slug: 'intro', title: 'Giới thiệu dự án', desc: 'Tổng quan về mục tiêu, phạm vi và cách VNBUSARCHIVE hoạt động.', icon: 'fa-circle-info', url: 'https://raw.githubusercontent.com/hoyuuna/VNBUSARCHIVE/refs/heads/main/README.md' },
                    { slug: 'ar', title: 'Quy định kiểm duyệt', desc: 'Điều kiện và tiêu chuẩn để ảnh được duyệt đăng tải lên hệ thống.', icon: 'fa-list-check', url: 'https://raw.githubusercontent.com/hoyuuna/VNBUSARCHIVE/refs/heads/main/doc/Requirements.md' },
                    { slug: 'tos', title: 'Chính sách & Điều khoản', desc: 'Chính sách bảo mật, bản quyền và các điều khoản khi sử dụng website.', icon: 'fa-shield-halved', url: 'https://raw.githubusercontent.com/hoyuuna/VNBUSARCHIVE/refs/heads/main/doc/Policy.md' },
                    { slug: 'cr', title: 'Tiêu chuẩn bình luận', desc: 'Quy tắc ứng xử và tiêu chuẩn khi bình luận trên hệ thống.', icon: 'fa-comments', url: 'https://raw.githubusercontent.com/hoyuuna/VNBUSARCHIVE/refs/heads/main/doc/Chat-rule.md' }
                ],
                renderPolicyGrid: () => {
                    const grid = document.getElementById('policy-grid');
                    if (!grid) return;
                    grid.innerHTML = app.help.policies.map(p => `
                        <div onclick="app.utils.navigate('/${p.slug}')" class="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-black transition-all cursor-pointer flex flex-col h-full group">
                            <div class="help-icon-circle w-10 h-10 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-base mb-4 shrink-0 group-hover:bg-black group-hover:text-white transition-colors">
                                <i class="fa-solid ${p.icon}"></i>
                            </div>
                            <h3 class="font-bold text-base text-black mb-2 line-clamp-2 transition-colors">${p.title}</h3>
                            <p class="text-xs text-gray-600 line-clamp-3 mb-2 flex-1 leading-relaxed">${p.desc}</p>
                            <span class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-auto pt-2">Xem chi tiết <i class="fa-solid fa-arrow-right ml-1"></i></span>
                        </div>
                    `).join('');
                },
                loadList: async () => {
                    app.views.switch('help-list', false);
                    document.title = 'Trung tâm hỗ trợ | VNBUSARCHIVE';
                    app.help.renderPolicyGrid();
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
                                    <div class="help-icon-circle w-7 h-7 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-[10px] shrink-0 group-hover:bg-black group-hover:text-white transition-colors">
                                        <i class="fa-solid fa-file-lines"></i>
                                    </div>
                                    <span class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">${item.date}</span>
                                </div>
                            </div>
                        `).join('');
                    }
                    app.loadingBar.finish();
                },
                scrollToHeading: (id) => {
                    const el = document.getElementById(id);
                    if (el) {
                        const headerOffset = 110; 
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
                        const firstH1 = articleBody.querySelector('h1');
                        if (firstH1) firstH1.remove();
                        const headings = articleBody.querySelectorAll('h2, h3, h4');
                        tocList.innerHTML = '';
                        tocBox.classList.remove('hidden'); 
                        if (headings.length === 0) {
                            tocList.innerHTML = '<li class="text-gray-400 italic text-[13px] font-medium">Không có phân mục nội dung cụ thể.</li>';
                        } else {
                            headings.forEach((heading, index) => {
                                const targetId = `help-heading-${index}`;
                                heading.id = targetId;
                                const li = document.createElement('li');
                                const level = parseInt(heading.tagName.substring(1));
                                if (level === 3) li.classList.add('pl-4', 'text-[13px]', 'text-gray-600');
                                else if (level === 4) li.classList.add('pl-8', 'text-[12px]', 'text-gray-500');
                                li.innerHTML = `<a href="javascript:void(0)" onclick="app.help.scrollToHeading('${targetId}')" class="hover:text-black hover:underline transition-all flex items-start gap-2 leading-snug">
                                    <span class="text-black opacity-40 mt-[3px] shrink-0"><i class="fa-solid fa-angle-right text-[10px]"></i></span> 
                                    <span>${heading.innerText}</span>
                                </a>`;
                                tocList.appendChild(li);
                            });
                        }
                        loading.classList.add('hidden');
                        container.classList.remove('hidden');
                    } catch (e) {
                        loading.innerHTML = `<div class="text-red-500 font-bold"><i class="fa-solid fa-triangle-exclamation text-3xl mb-3"></i><p>${e.message}</p></div>`;
                    }
                    app.loadingBar.finish();
                },
                loadPolicy: async (slug) => {
                    const policy = app.help.policies.find(p => p.slug === slug);
                    if (!policy) { app.utils.navigate('/help'); return; }
                    app.views.switch('policy-detail', false);
                    const container = document.getElementById('policy-detail-container');
                    const loading = document.getElementById('policy-detail-loading');
                    container.classList.add('hidden');
                    loading.classList.remove('hidden');
                    loading.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin text-3xl mb-3 text-black"></i><p class="font-medium">Đang tải tài liệu...</p>';
                    document.title = `${policy.title} | VNBUSARCHIVE`;
                    document.getElementById('policy-breadcrumb-title').innerText = policy.title;
                    document.getElementById('policy-detail-title').innerText = policy.title;
                    try {
                        const res = await fetch(policy.url);
                        if (!res.ok) throw new Error('Không thể tải nội dung tài liệu.');
                        let text = await res.text();
                        
                        try {
                            const fileName = policy.url.split('/').pop();
                            const commitRes = await fetch(`https://api.github.com/repos/hoyuuna/VNBUSARCHIVE/commits?path=doc/${fileName}&page=1&per_page=1`);
                            if (commitRes.ok) {
                                const commitData = await commitRes.json();
                                if (commitData && commitData.length > 0) {
                                    const commitHash = commitData[0].sha;
                                    const dateObj = new Date(commitData[0].commit.author.date);
                                    const formattedDate = ("0" + dateObj.getDate()).slice(-2) + "/" + ("0" + (dateObj.getMonth() + 1)).slice(-2) + "/" + dateObj.getFullYear();
                                    
                                    const updateBlock = `
                                        <div class="border border-black dark:border-white p-3 rounded-md mb-6 text-sm bg-white dark:bg-[#18181b] text-black dark:text-white font-medium">
                                            <i class="fa-solid fa-clock-rotate-left mr-2"></i>Thay đổi lần cuối: ${formattedDate} 
                                            <a href="https://github.com/hoyuuna/VNBUSARCHIVE/commits/main/doc/${fileName}" target="_blank" class="!text-black dark:!text-white underline hover:opacity-80 transition-opacity ml-1">(xem thay đổi)</a>
                                        </div>
                                    `;
                                    
                                    const body = document.getElementById('policy-detail-body');
                                    text = text.replace(/\*\*👉 LƯU Ý: Cập nhật lần cuối.*?\*\*\n*/, '');
                                    
                                    body.innerHTML = DOMPurify.sanitize(updateBlock, { ADD_ATTR: ['target'] }) + DOMPurify.sanitize(marked.parse(text));
                                    
                                    const firstH1 = body.querySelector('h1');
                                    if (firstH1) firstH1.remove();
                                    loading.classList.add('hidden');
                                    container.classList.remove('hidden');
                                    app.loadingBar.finish();
                                    return;
                                }
                            }
                        } catch(err) {}

                        text = text.replace(/\*\*👉 LƯU Ý: Cập nhật lần cuối.*?\*\*\n*/, '');
                        const body = document.getElementById('policy-detail-body');
                        body.innerHTML = DOMPurify.sanitize(marked.parse(text));
                        const firstH1 = body.querySelector('h1');
                        if (firstH1) firstH1.remove();
                        loading.classList.add('hidden');
                        container.classList.remove('hidden');
                    } catch (e) {
                        loading.innerHTML = `
                            <div class="text-red-500 font-bold"><i class="fa-solid fa-triangle-exclamation text-3xl mb-3"></i><p>Không thể tải nội dung tự động.</p></div>
                            <div class="text-center mt-3">
                                <a href="${policy.url.replace('raw.githubusercontent.com/hoyuuna', 'github.com/hoyuuna').replace('/refs/heads/', '/blob/')}" target="_blank" class="inline-flex items-center gap-1.5 bg-black text-white px-4 py-2 rounded-md font-bold hover:bg-gray-800 transition text-[11px] uppercase">
                                    <i class="fa-solid fa-arrow-up-right-from-square text-sm"></i> Xem chi tiết
                                </a>
                            </div>
                        `;
                    }
                    app.loadingBar.finish();
                }
            },

    activeAnnouncements: [],

    contact: {
        currentPreviewId: null,
        isExternalLink: false,
        currentMethod: 'account_email', 
        init: () => {
            const form = document.getElementById('contact-form');
            if(form) form.reset();
            const topicInput = document.getElementById('contact-topic');
            if(topicInput) topicInput.value = "";
            const topicLabel = document.getElementById('contact-topic-label');
            if(topicLabel) {
                topicLabel.innerText = "-- Vui lòng chọn một chủ đề --";
                topicLabel.classList.remove('text-black');
            }
            document.querySelectorAll('#contact-topic-menu .filter-item').forEach(item => {
                item.classList.remove('selected');
            });
            if (app.contact._animTimeout) clearTimeout(app.contact._animTimeout);
            const dynamicArea = document.getElementById('contact-dynamic-area');
            if(dynamicArea) { dynamicArea.classList.add('hidden'); dynamicArea.classList.remove('fade-zoom-in'); }
            const directBanner = document.getElementById('contact-direct-links-banner');
            if(directBanner) directBanner.classList.remove('hidden');
            const noticeEl = document.getElementById('contact-incorrect-info-notice');
            if(noticeEl) { noticeEl.classList.add('hidden'); noticeEl.classList.remove('fade-zoom-in'); }
            app.contact.currentPreviewId = null;
            app.contact.isExternalLink = false;
            if (app.user && app.user.email) {
                app.contact.setMethod('account_email');
            } else {
                app.contact.setMethod('custom_email');
            }
            if (app.auth && app.auth.updateUUIDBox) app.auth.updateUUIDBox();
            const chk1 = document.getElementById('contact-declare-1');
            const chk2 = document.getElementById('contact-declare-2');
            if (chk1) chk1.checked = false;
            if (chk2) chk2.checked = false;
        },
        selectTopic: (value, label, el) => {
            document.getElementById('contact-topic').value = value;
            const labelEl = document.getElementById('contact-topic-label');
            labelEl.innerText = label;
            labelEl.classList.add('text-black');
            document.querySelectorAll('#contact-topic-menu .filter-item').forEach(item => {
                item.classList.remove('selected');
            });
            if (el) {
                el.classList.add('selected');
            }
            document.getElementById('contact-topic-menu').classList.remove('active');
            app.contact.onTopicChange();
        },
        onTopicChange: () => {
            const topic = document.getElementById('contact-topic').value;
            const dynamicArea = document.getElementById('contact-dynamic-area');
            const photoSection = document.getElementById('contact-photo-section');
            const originalWorkSection = document.getElementById('contact-original-work-section');
            const descLabel = document.getElementById('contact-desc-label');
            const extLinkBtn = document.getElementById('contact-external-link-toggle');
            const photoUrlInput = document.getElementById('contact-photo-url');
            if ((topic === 'appeal' || topic === 'account' || topic === 'bad_photo') && !app.user) {
                app.ui.showAlert("Chức năng này yêu cầu bạn phải đăng nhập vào hệ thống để xác thực.", () => {
                    app.utils.navigate('/auth');
                });
                app.contact.init(); 
                return;
            }
            const directBanner = document.getElementById('contact-direct-links-banner');
            const noticeEl = document.getElementById('contact-incorrect-info-notice');
            const bugNoticeEl = document.getElementById('contact-bug-notice');
            if (app.contact._animTimeout) clearTimeout(app.contact._animTimeout);
            if (topic === 'incorrect_info' || topic === 'bug') {
                if (dynamicArea) {
                    dynamicArea.classList.add('hidden');
                    dynamicArea.classList.remove('fade-zoom-in');
                }
                if (directBanner) directBanner.classList.add('hidden');
                
                if (noticeEl) noticeEl.classList.add('hidden');
                if (bugNoticeEl) bugNoticeEl.classList.add('hidden');
                
                const activeNotice = topic === 'incorrect_info' ? noticeEl : bugNoticeEl;
                
                if (activeNotice) {
                    activeNotice.classList.remove('hidden');
                    activeNotice.classList.remove('fade-zoom-in');
                    void activeNotice.offsetWidth;
                    activeNotice.classList.add('fade-zoom-in');
                    app.contact._animTimeout = setTimeout(() => {
                        activeNotice.classList.remove('fade-zoom-in');
                    }, 500);
                }
                return;
            } else {
                if (noticeEl) {
                    noticeEl.classList.add('hidden');
                    noticeEl.classList.remove('fade-zoom-in');
                }
                if (bugNoticeEl) {
                    bugNoticeEl.classList.add('hidden');
                    bugNoticeEl.classList.remove('fade-zoom-in');
                }
                if (dynamicArea) {
                    dynamicArea.classList.remove('hidden');
                    dynamicArea.classList.remove('fade-zoom-in');
                    void dynamicArea.offsetWidth;
                    dynamicArea.classList.add('fade-zoom-in');
                    app.contact._animTimeout = setTimeout(() => {
                        dynamicArea.classList.remove('fade-zoom-in');
                    }, 500);
                }
                if (directBanner) directBanner.classList.add('hidden');
            }
            photoUrlInput.value = '';
            const origWorkInput = document.getElementById('contact-original-work');
            if (origWorkInput) origWorkInput.value = '';
            const legalNameInput = document.getElementById('contact-legal-name');
            if (legalNameInput) legalNameInput.value = '';
            const commentNote = document.getElementById('contact-comment-note');
            if (commentNote) {
                if (topic === 'report_violation') commentNote.classList.remove('hidden');
                else commentNote.classList.add('hidden');
            }
            app.contact.currentPreviewId = null;
            app.contact.currentOrigPreviewId = null;
            app.contact.isExternalLink = false;
            document.getElementById('contact-photo-preview').classList.add('hidden');
            const userPreviewBox = document.getElementById('contact-user-preview');
            if(userPreviewBox) userPreviewBox.classList.add('hidden');
            document.getElementById('contact-photo-error').classList.add('hidden');
            const origPreview = document.getElementById('contact-orig-preview');
            const origUserPreview = document.getElementById('contact-orig-user-preview');
            const origErrBox = document.getElementById('contact-orig-error');
            if (origPreview) origPreview.classList.add('hidden');
            if (origUserPreview) origUserPreview.classList.add('hidden');
            if (origErrBox) origErrBox.classList.add('hidden');
            const copySection = document.getElementById('contact-copyright-type-section');
            const titleEl = document.getElementById('contact-content-title');
            const policySection = document.getElementById('contact-policy-violation-section');
            const privacySection = document.getElementById('contact-privacy-action-section');
            const descSection = document.getElementById('contact-desc-section');
            if (descSection) descSection.classList.remove('hidden');

            if (topic === 'copyright') {
                photoSection.classList.remove('hidden');
                originalWorkSection.classList.remove('hidden');
                if (copySection) copySection.classList.remove('hidden');
                if (policySection) policySection.classList.add('hidden');
                if (privacySection) privacySection.classList.add('hidden');
                if (titleEl) titleEl.innerHTML = 'Nội dung vi phạm <span class="text-red-500">*</span>';
                descLabel.innerHTML = 'Mô tả chi tiết vi phạm <span class="text-red-500">*</span>';
                const firstCopyItem = document.querySelector('#contact-copyright-menu .filter-item');
                app.contact.selectCopyrightType('internal', 'Ảnh của tôi bị đăng trái luật lên nền tảng', firstCopyItem);
            } 
            else if (topic === 'report_violation') {
                photoSection.classList.remove('hidden');
                originalWorkSection.classList.add('hidden');
                if (copySection) copySection.classList.add('hidden');
                if (policySection) policySection.classList.add('hidden');
                if (privacySection) privacySection.classList.add('hidden');
                if (titleEl) titleEl.innerHTML = 'Nội dung vi phạm <span class="text-red-500">*</span>';
                descLabel.innerHTML = 'Mô tả chi tiết vi phạm <span class="text-red-500">*</span>';
                photoUrlInput.placeholder = "Paste link ảnh / link hồ sơ user / link bình luận vào đây...";
            }
            else if (topic === 'policy_violation') {
                photoSection.classList.remove('hidden');
                originalWorkSection.classList.add('hidden');
                if (copySection) copySection.classList.add('hidden');
                if (policySection) policySection.classList.remove('hidden');
                if (privacySection) privacySection.classList.add('hidden');
                if (titleEl) titleEl.innerHTML = 'Tác phẩm trên VNBUSARCHIVE <span class="text-red-500">*</span>';
                descLabel.innerHTML = 'Mô tả chi tiết vi phạm <span class="text-red-500">*</span>';
                photoUrlInput.placeholder = "Paste link ảnh trên VNBUSARCHIVE vào đây...";
            }
            else if (topic === 'appeal') {
                photoSection.classList.remove('hidden');
                originalWorkSection.classList.add('hidden');
                if (copySection) copySection.classList.add('hidden');
                if (policySection) policySection.classList.add('hidden');
                if (privacySection) privacySection.classList.add('hidden');
                if (titleEl) titleEl.innerHTML = 'Nội dung liên quan <span class="text-red-500">*</span>';
                descLabel.innerHTML = 'Lý do bạn cho rằng ảnh hợp lệ <span class="text-red-500">*</span>';
                photoUrlInput.placeholder = "Paste link ảnh BỊ TỪ CHỐI của bạn vào đây...";
            } 
            else if (topic === 'bad_photo') {
                photoSection.classList.remove('hidden');
                originalWorkSection.classList.add('hidden');
                if (copySection) copySection.classList.add('hidden');
                if (policySection) policySection.classList.add('hidden');
                if (privacySection) privacySection.classList.add('hidden');
                if (titleEl) titleEl.innerHTML = 'Nội dung liên quan <span class="text-red-500">*</span>';
                descLabel.innerHTML = 'Mô tả chi tiết <span class="text-red-500">*</span>';
                photoUrlInput.placeholder = "Paste link ảnh VNBUSARCHIVE chưa đạt chuẩn vào đây...";
            } 
            else if (topic === 'privacy') {
                photoSection.classList.remove('hidden');
                originalWorkSection.classList.add('hidden');
                if (copySection) copySection.classList.add('hidden');
                if (policySection) policySection.classList.add('hidden');
                if (privacySection) privacySection.classList.remove('hidden');
                if (descSection) descSection.classList.add('hidden');
                if (titleEl) titleEl.innerHTML = 'Nội dung liên quan <span class="text-red-500">*</span>';
                photoUrlInput.placeholder = "Paste link ảnh VNBUSARCHIVE vào đây...";
                const firstPrivacyItem = document.querySelector('#contact-privacy-action-menu .filter-item');
                if (app.contact.selectPrivacyAction) app.contact.selectPrivacyAction('blur', 'Che mờ các khuôn mặt xuất hiện trong ảnh', firstPrivacyItem);
            }
            else {
                photoSection.classList.add('hidden');
                originalWorkSection.classList.add('hidden');
                if (copySection) copySection.classList.add('hidden');
                if (policySection) policySection.classList.add('hidden');
                if (privacySection) privacySection.classList.add('hidden');
                if (titleEl) titleEl.innerHTML = 'Nội dung liên quan <span class="text-red-500">*</span>';
                descLabel.innerHTML = 'Mô tả chi tiết vấn đề <span class="text-red-500">*</span>';
            }
        },
        selectPrivacyAction: (val, label, el) => {
            const typeInput = document.getElementById('contact-privacy-action');
            if (typeInput) typeInput.value = val;
            const labelEl = document.getElementById('contact-privacy-action-label');
            if (labelEl) {
                labelEl.innerText = label;
                labelEl.classList.add('text-black');
            }
            document.querySelectorAll('#contact-privacy-action-menu .filter-item').forEach(item => {
                item.classList.remove('selected');
            });
            if (el) el.classList.add('selected');
            const menuEl = document.getElementById('contact-privacy-action-menu');
            if (menuEl) menuEl.classList.remove('active');
        },
        selectCopyrightType: (val, label, el) => {
            if (val === 'external' && !app.user) {
                const menuEl = document.getElementById('contact-copyright-menu');
                if (menuEl) menuEl.classList.remove('active');
                app.ui.showAlert("Chức năng này yêu cầu bạn phải đăng nhập vào hệ thống để xác thực quyền sở hữu.", () => {
                    app.utils.navigate('/auth');
                });
                return;
            }
            const typeInput = document.getElementById('contact-copyright-type');
            if (typeInput) typeInput.value = val;
            const labelEl = document.getElementById('contact-copyright-label');
            if (labelEl) {
                labelEl.innerText = label;
                labelEl.classList.add('text-black');
            }
            document.querySelectorAll('#contact-copyright-menu .filter-item').forEach(item => {
                item.classList.remove('selected');
            });
            if (el) el.classList.add('selected');
            const menuEl = document.getElementById('contact-copyright-menu');
            if (menuEl) menuEl.classList.remove('active');
            app.contact.isExternalLink = (val === 'external');
            const photoUrlInput = document.getElementById('contact-photo-url');
            const origWorkInput = document.getElementById('contact-original-work');
            const preview = document.getElementById('contact-photo-preview');
            const userPreview = document.getElementById('contact-user-preview');
            const errBox = document.getElementById('contact-photo-error');
            const origPreview = document.getElementById('contact-orig-preview');
            const origErrBox = document.getElementById('contact-orig-error');
            if (photoUrlInput) photoUrlInput.value = '';
            if (origWorkInput) origWorkInput.value = '';
            if (preview) preview.classList.add('hidden');
            if (userPreview) userPreview.classList.add('hidden');
            if (errBox) errBox.classList.add('hidden');
            if (origPreview) origPreview.classList.add('hidden');
            if (origErrBox) origErrBox.classList.add('hidden');
            app.contact.currentPreviewId = null;
            app.contact.currentOrigPreviewId = null;
            if (val === 'internal') {
                if (photoUrlInput) photoUrlInput.placeholder = "Paste link ảnh vào đây (VD: vnbusarchive.io.vn/photo/123)";
                if (origWorkInput) origWorkInput.placeholder = "Link ảnh gốc, link bài đăng gốc của bạn...";
            } else {
                if (photoUrlInput) photoUrlInput.placeholder = "Nhập link bài đăng/video vi phạm trên nền tảng bên ngoài (Facebook, TikTok...)";
                if (origWorkInput) origWorkInput.placeholder = "Paste link ảnh trên VNBUSARCHIVE vào đây (VD: vnbusarchive.io.vn/photo/123)";
            }
        },
        onLinkInput: async () => {
            const topic = document.getElementById('contact-topic').value;
            const url = document.getElementById('contact-photo-url').value.trim();
            const commentNote = document.getElementById('contact-comment-note');
            if (commentNote) {
                if (url || topic !== 'report_violation') commentNote.classList.add('hidden');
                else commentNote.classList.remove('hidden');
            }
            const previewBox = document.getElementById('contact-photo-preview');
            const userPreviewBox = document.getElementById('contact-user-preview');
            const errBox = document.getElementById('contact-photo-error');
            const errTxt = document.getElementById('contact-photo-err-txt');
            const imgEl = document.getElementById('contact-preview-img');
            if (app.contact.isExternalLink || !url) {
                previewBox.classList.add('hidden');
                if (userPreviewBox) userPreviewBox.classList.add('hidden');
                errBox.classList.add('hidden');
                app.contact.currentPreviewId = null;
                return;
            }
            const match = url.match(/\/photo\/(\d+)/i);
            const userMatch = (topic === 'report_violation') ? (url.match(/\/user\/([^\/\?#]+)/i) || url.match(/\/profile/i)) : null;
            if (!match && !userMatch) {
                previewBox.classList.add('hidden');
                if (userPreviewBox) userPreviewBox.classList.add('hidden');
                if (topic === 'report_violation') {
                    errBox.classList.add('hidden');
                    app.contact.currentPreviewId = null;
                    return;
                }
                errTxt.innerText = "Đường dẫn không hợp lệ. Vui lòng copy đúng link truy cập ảnh của VNBUSARCHIVE.";
                errBox.classList.remove('hidden');
                app.contact.currentPreviewId = null;
                return;
            }
            if (userMatch) {
                previewBox.classList.add('hidden');
                errBox.classList.add('hidden');
                let targetUsername = userMatch[1] ? decodeURIComponent(userMatch[1]) : (app.username || '');
                if (!targetUsername) return;
                try {
                    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetUsername);
                    let query = window.sb.from('profiles').select('id, username, avatar_url, role, subroles');
                    if (isUuid) {
                        query = query.eq('id', targetUsername);
                    } else {
                        query = query.eq('username', targetUsername);
                    }
                    const { data: uData, error: uErr } = await query.single();
                    if (uErr || !uData) throw new Error("Hồ sơ người dùng không tồn tại.");
                    const { count } = await window.sb.from('photos').select('*', { count: 'exact', head: true }).eq('uploader_id', uData.id).eq('status', 'approved');
                    const avatarSrc = uData.avatar_url ? app.utils.getProxiedUrl(uData.avatar_url.replace(/"/g, ''), 'avatar.jpg', 'avatar') : 'https://files.catbox.moe/zzh1q1.png';
                    const badges = app.utils.getBadgesHTML(uData.id, uData.role, uData.subroles, true);
                    document.getElementById('contact-preview-user-avatar').src = avatarSrc;
                    document.getElementById('contact-preview-user-name').innerHTML = `${uData.username} ${badges}`;
                    document.getElementById('contact-preview-user-stats').innerText = `${count || 0} ảnh đã đăng trên hệ thống`;
                    if (userPreviewBox) userPreviewBox.classList.remove('hidden');
                    app.contact.currentPreviewId = 'user:' + uData.username;
                } catch (err) {
                    if (userPreviewBox) userPreviewBox.classList.add('hidden');
                    app.contact.currentPreviewId = null;
                    errTxt.innerText = err.message;
                    errBox.classList.remove('hidden');
                }
                return;
            }
            if (userPreviewBox) userPreviewBox.classList.add('hidden');
            const photoId = match[1];
            errBox.classList.add('hidden');
            previewBox.classList.remove('hidden');
            imgEl.src = 'https://placehold.co/400x300/f3f4f6/a1a1aa?text=Dang+tai...';
            try {
                const { data, error } = await window.sb.from('photos').select('id, url, status, uploader_id, license_plate, operator').eq('id', photoId).single();
                if (error || !data) throw new Error("Ảnh không tồn tại trên hệ thống.");
                if (topic === 'appeal') {
                    if (data.status !== 'denied') throw new Error("Kháng cáo thất bại: Ảnh này KHÔNG ở trạng thái Bị từ chối.");
                    if (data.uploader_id !== app.user.id) throw new Error("Kháng cáo thất bại: Đây không phải là ảnh do bạn đăng tải.");
                } else if (topic === 'policy_violation') {
                    if (data.status !== 'approved') throw new Error("Chỉ có thể báo cáo các tác phẩm đã được duyệt trên hệ thống.");
                }
                app.contact.currentPreviewId = photoId;
                imgEl.src = app.utils.getProxiedUrl(data.url, 'preview.jpg', 'thumb');
                document.getElementById('contact-preview-plate').innerText = app.utils.displayPlate(data.license_plate);
                document.getElementById('contact-preview-op').innerText = data.operator || 'N/A';
            } catch (err) {
                previewBox.classList.add('hidden');
                app.contact.currentPreviewId = null;
                errTxt.innerText = err.message;
                errBox.classList.remove('hidden');
            }
        },
        onOrigWorkInput: async () => {
            const url = document.getElementById('contact-original-work').value.trim();
            const previewBox = document.getElementById('contact-orig-preview');
            const errBox = document.getElementById('contact-orig-error');
            const errTxt = document.getElementById('contact-orig-err-txt');
            const imgEl = document.getElementById('contact-orig-preview-img');
            if (!app.contact.isExternalLink || !url) {
                if (previewBox) previewBox.classList.add('hidden');
                if (errBox) errBox.classList.add('hidden');
                app.contact.currentOrigPreviewId = null;
                return;
            }
            const match = url.match(/\/photo\/(\d+)/i);
            if (!match) {
                if (previewBox) previewBox.classList.add('hidden');
                errTxt.innerText = "Đường dẫn không hợp lệ. Vui lòng copy đúng link truy cập ảnh của VNBUSARCHIVE.";
                if (errBox) errBox.classList.remove('hidden');
                app.contact.currentOrigPreviewId = null;
                return;
            }
            const photoId = match[1];
            if (errBox) errBox.classList.add('hidden');
            if (previewBox) previewBox.classList.remove('hidden');
            if (imgEl) imgEl.src = 'https://placehold.co/400x300/f3f4f6/a1a1aa?text=Dang+tai...';
            try {
                const { data, error } = await window.sb.from('photos').select('id, url, status, uploader_id, license_plate, operator').eq('id', photoId).single();
                if (error || !data) throw new Error("Ảnh không tồn tại trên hệ thống.");
                if (!app.user || data.uploader_id !== app.user.id) {
                    throw new Error("Đây không phải là ảnh do bạn đăng tải! Vui lòng chỉ chọn link ảnh của chính bạn trên hệ thống.");
                }
                app.contact.currentOrigPreviewId = photoId;
                if (imgEl) imgEl.src = app.utils.getProxiedUrl(data.url, 'preview.jpg', 'thumb');
                document.getElementById('contact-orig-preview-plate').innerText = app.utils.displayPlate(data.license_plate);
                document.getElementById('contact-orig-preview-op').innerText = data.operator || 'N/A';
            } catch (err) {
                if (previewBox) previewBox.classList.add('hidden');
                app.contact.currentOrigPreviewId = null;
                errTxt.innerText = err.message;
                if (errBox) errBox.classList.remove('hidden');
            }
        },
        setMethod: (method) => {
            if (method === 'account_email' && (!app.user || !app.user.email)) {
                method = 'custom_email';
            }
            app.contact.currentMethod = method;
            const methods = ['account_email', 'custom_email'];
            const input = document.getElementById('contact-method-value');
            const subText = document.getElementById('method-account-email-sub');
            const accountBox = document.getElementById('method-box-account_email');
            if (accountBox) {
                if (app.user && app.user.email) {
                    accountBox.classList.remove('opacity-50', 'pointer-events-none', 'bg-gray-100', 'border-gray-200', 'text-gray-400');
                    if (subText) subText.innerText = `(${app.user.email})`;
                } else {
                    accountBox.classList.add('opacity-50', 'pointer-events-none');
                    if (subText) subText.innerText = "(Chưa đăng nhập)";
                }
            }
            methods.forEach(m => {
                const box = document.getElementById(`method-box-${m}`);
                if (box) {
                    const isDisabledAccount = (m === 'account_email' && (!app.user || !app.user.email));
                    if (m === method) {
                        box.className = "cursor-pointer bg-black text-white border-black border-2 rounded-xl p-3 text-center transition-all shadow-sm flex flex-col items-center justify-center " + (isDisabledAccount ? 'opacity-50 pointer-events-none' : '');
                    } else {
                        box.className = "cursor-pointer bg-white text-gray-700 border-gray-300 border hover:border-black rounded-xl p-3 text-center transition-all shadow-sm flex flex-col items-center justify-center " + (isDisabledAccount ? 'opacity-50 pointer-events-none bg-gray-100 border-gray-200 text-gray-400' : '');
                    }
                }
            });
            if (method === 'account_email') {
                input.value = (app.user && app.user.email) ? app.user.email : '';
                input.disabled = true;
                input.placeholder = "Email của tài khoản";
            } else {
                if (input.disabled) input.value = '';
                input.disabled = false;
                input.placeholder = "Nhập địa chỉ email của bạn (VD: name@example.com)";
            }
        },
        submit: async (e) => {
            e.preventDefault();
            const topic = document.getElementById('contact-topic').value;
            const desc = document.getElementById('contact-description').value.trim();
            const method = app.contact.currentMethod;
            const methodVal = document.getElementById('contact-method-value').value.trim();
            const originalWork = document.getElementById('contact-original-work')?.value.trim();
            const legalName = document.getElementById('contact-legal-name')?.value.trim();
            const btn = document.getElementById('btn-submit-contact');
            if (!topic) return app.ui.showAlert("Vui lòng chọn Chủ đề cần hỗ trợ!");
            if ((topic === 'appeal' || topic === 'account' || topic === 'bad_photo') && !app.user) {
                return app.ui.showAlert("Chức năng này yêu cầu bạn phải đăng nhập vào hệ thống để xác thực.", () => {
                    app.utils.navigate('/auth');
                });
            }
            const chk1 = document.getElementById('contact-declare-1');
            const chk2 = document.getElementById('contact-declare-2');
            if ((chk1 && !chk1.checked) || (chk2 && !chk2.checked)) {
                return app.ui.showAlert("Vui lòng xác nhận và đồng ý với các mục tuyên bố cam kết bắt buộc!");
            }
            if (topic === 'copyright' || topic === 'appeal' || topic === 'report_violation' || topic === 'bad_photo' || topic === 'policy_violation' || topic === 'privacy') {
                if (!app.contact.isExternalLink && !app.contact.currentPreviewId && !(topic === 'report_violation' && document.getElementById('contact-photo-url').value.trim())) {
                    const msg = (topic === 'report_violation') ? "Vui lòng nhập Link ảnh / bình luận / hồ sơ hợp lệ." : "Vui lòng nhập Link ảnh VNBUSARCHIVE hợp lệ.";
                    return app.ui.showAlert(msg);
                }
                if (app.contact.isExternalLink && !document.getElementById('contact-photo-url').value.trim()) {
                    return app.ui.showAlert("Vui lòng nhập Link bài đăng/video vi phạm hợp lệ.");
                }
                if (topic === 'copyright') {
                    if (!legalName) {
                        return app.ui.showAlert("Vui lòng nhập Họ và tên hợp pháp của bạn.");
                    }
                    if (!originalWork) {
                        return app.ui.showAlert("Vui lòng nhập Link minh chứng / tác phẩm gốc của bạn.");
                    }
                    if (app.contact.isExternalLink && !app.contact.currentOrigPreviewId) {
                        return app.ui.showAlert("Vui lòng nhập Link minh chứng VNBUSARCHIVE hợp lệ (ảnh do chính bạn đăng tải trên hệ thống).");
                    }
                }
                if (topic === 'policy_violation') {
                    if (!document.getElementById('contact-policy-content').value.trim()) {
                        return app.ui.showAlert("Vui lòng nhập Link nội dung vi phạm.");
                    }
                }
            }
            if (topic !== 'privacy' && (!desc || desc.length < 10)) return app.ui.showAlert("Vui lòng mô tả chi tiết vấn đề (Ít nhất 10 ký tự).");
            if (!methodVal) return app.ui.showAlert("Vui lòng nhập địa chỉ email để chúng tôi có thể phản hồi.");
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(methodVal)) {
                return app.ui.showAlert("Email không hợp lệ.");
            }
            let captchaResponse;
            try {
                captchaResponse = await app.captcha.request();
            } catch (err) {
                if (err.message !== "CAPTCHA_CANCELLED") app.ui.showAlert("Lỗi xác thực Captcha.");
                return;
            }
            const origHTML = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu thông tin...';
            btn.disabled = true;
            const payload = {
                action: 'contact_submit',
                topic: topic,
                description: desc,
                contactMethod: method,
                contactInfo: methodVal,
                captcha: captchaResponse,
                userId: app.user ? app.user.id : null,
                userName: app.username || 'Khách (Chưa đăng nhập)',
                photoId: (topic === 'copyright' || topic === 'appeal' || topic === 'report_violation' || topic === 'bad_photo' || topic === 'policy_violation' || topic === 'privacy') ? (!app.contact.isExternalLink ? app.contact.currentPreviewId : null) : null,
                externalLink: (topic === 'copyright' || topic === 'appeal' || topic === 'report_violation' || topic === 'bad_photo' || topic === 'policy_violation' || topic === 'privacy') ? ((app.contact.isExternalLink || (topic === 'report_violation' && !app.contact.currentPreviewId)) ? document.getElementById('contact-photo-url').value.trim() : null) : null,
                originalWork: (topic === 'copyright') ? (app.contact.isExternalLink && app.contact.currentOrigPreviewId ? `https://www.vnbusarchive.io.vn/photo/${app.contact.currentOrigPreviewId}` : (originalWork || null)) : null,
                legalName: (topic === 'copyright') ? (legalName || null) : null,
                copyrightType: (topic === 'copyright') ? (document.getElementById('contact-copyright-type')?.value || 'internal') : null,
                policyContent: (topic === 'policy_violation') ? document.getElementById('contact-policy-content').value.trim() : null,
                privacyAction: (topic === 'privacy') ? (document.getElementById('contact-privacy-action')?.value || 'blur') : null
            };
            try {
                const reqOpts = {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                };
                if (app.user) {
                    const { data: { session } } = await window.sb.auth.getSession();
                    if (session) reqOpts.headers['Authorization'] = `Bearer ${session.access_token}`;
                }
                const res = await fetch('/api/discord', reqOpts);
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Gửi thất bại.");
                const msgDetail = data.ticketId
                    ? `Yêu cầu (ID: ${data.ticketId}) đã được ghi nhận và email xác nhận đã được gửi. Chúng tôi sẽ phản hồi sau 6-24 giờ.`
                    : 'Ban Quản Trị đã ghi nhận thông tin và sẽ sớm phản hồi cho bạn.';
                app.toast.show('success', 'Đã gửi yêu cầu', msgDetail);
                app.contact.init(); 
            } catch (err) {
                app.ui.showAlert("Lỗi hệ thống: " + err.message);
            } finally {
                btn.innerHTML = origHTML;
                btn.disabled = false;
            }
        }
    },
    donate: {
        currentOrder: null,
        _pollTimer: null,
        selectedAmount: 20000,
        isGuest: true,

        init: async () => {
            if (app.donate._pollTimer) {
                clearInterval(app.donate._pollTimer);
                app.donate._pollTimer = null;
            }
            app.donate.currentOrder = null;

            const isUser = !!app.user;
            app.donate.isGuest = !isUser;

            const avatarEl = document.getElementById('donate-user-avatar');
            const iconEl = document.getElementById('donate-user-icon');
            const nameEl = document.getElementById('donate-user-name');
            const descEl = document.getElementById('donate-user-desc');

            if (isUser) {
                const displayName = app.username || app.user.email?.split('@')[0] || 'Thành viên VNBUSARCHIVE';
                if (nameEl) nameEl.innerText = displayName;
                if (descEl) descEl.innerText = 'Khoản ủng hộ sẽ được ghi nhận và lưu lại trong hồ sơ cá nhân của bạn.';

                let userAvatar = app.avatarUrl || null;
                if (!userAvatar) {
                    const navAvatar = document.getElementById('nav-user-avatar');
                    if (navAvatar && navAvatar.src && !navAvatar.classList.contains('hidden')) {
                        userAvatar = navAvatar.src;
                    }
                }
                if (!userAvatar && app.user) {
                    userAvatar = app.user.user_metadata?.avatar_url || app.user.user_metadata?.picture || null;
                }

                if (avatarEl && iconEl) {
                    const defaultAv = (typeof DEFAULT_AVATAR !== 'undefined') ? DEFAULT_AVATAR : '/media/default-avatar.png';
                    const finalAvatar = userAvatar
                        ? (userAvatar.startsWith('http') && !userAvatar.includes('/avatar.jpg') ? app.utils.getProxiedUrl(userAvatar.replace(/"/g, ''), 'avatar.jpg', 'avatar') : userAvatar)
                        : defaultAv;
                    avatarEl.src = finalAvatar;
                    avatarEl.onerror = () => { avatarEl.src = defaultAv; };
                    avatarEl.classList.remove('hidden');
                    avatarEl.style.setProperty('display', 'block', 'important');
                    iconEl.classList.add('hidden', '!hidden');
                    iconEl.style.setProperty('display', 'none', 'important');
                }
            } else {
                if (nameEl) nameEl.innerText = 'Ẩn danh (Khách vãng lai)';
                if (descEl) descEl.innerText = 'Bạn đang ủng hộ với tư cách ẩn danh. Đăng nhập nếu bạn muốn lưu vào hồ sơ cá nhân.';
                if (avatarEl && iconEl) {
                    avatarEl.classList.add('hidden');
                    avatarEl.style.setProperty('display', 'none', 'important');
                    iconEl.classList.remove('hidden', '!hidden');
                    iconEl.style.setProperty('display', 'inline-block', 'important');
                }
            }

            const searchParams = new URLSearchParams(window.location.search);
            const orderCodeParam = searchParams.get('orderCode');
            const statusParam = searchParams.get('status');

            if (orderCodeParam && statusParam !== 'cancelled') {
                app.loadingBar.start();
                try {
                    const res = await fetch(`/api/donate/check?orderCode=${encodeURIComponent(orderCodeParam)}`);
                    const checkData = await res.json();
                    if (checkData.success && checkData.status === 'PAID') {
                        app.loadingBar.finish();
                        app.donate.renderThankYou(checkData.orderCode, checkData.amount, !checkData.is_logged_in, checkData.is_anonymous);
                        return;
                    }
                } catch(e) {}
                app.loadingBar.finish();
            }

            app.donate.showStep('form');
            app.donate.selectPreset(20000);
            const msgInput = document.getElementById('donate-message');
            if (msgInput) msgInput.value = '';
        },

        showStep: (step) => {
            const stepForm = document.getElementById('donate-step-form');
            const stepQr = document.getElementById('donate-step-qr');
            const stepThankYou = document.getElementById('donate-step-thankyou');
            const headerTitle = document.getElementById('donate-header-title');

            if (stepForm) stepForm.classList.toggle('hidden', step !== 'form');
            if (stepQr) stepQr.classList.toggle('hidden', step !== 'qr');
            if (stepThankYou) stepThankYou.classList.toggle('hidden', step !== 'thankyou');
            if (headerTitle) headerTitle.classList.toggle('hidden', step === 'thankyou');
        },

        selectPreset: (val) => {
            app.donate.selectedAmount = val;
            const input = document.getElementById('donate-amount-input');
            if (input) {
                input.value = new Intl.NumberFormat('vi-VN').format(val);
            }
            document.querySelectorAll('.donate-preset-btn').forEach(btn => {
                const bVal = parseInt(btn.dataset.amount, 10);
                if (bVal === val) {
                    btn.className = 'donate-preset-btn px-4 py-2.5 text-xs sm:text-sm font-bold rounded-lg border border-black bg-black text-white transition';
                } else {
                    btn.className = 'donate-preset-btn px-4 py-2.5 text-xs sm:text-sm font-bold rounded-lg border border-gray-300 hover:border-black bg-white text-gray-800 transition';
                }
            });
        },

        handleAmountInput: (e) => {
            let raw = e.target.value.replace(/[^0-9]/g, '');
            if (!raw) {
                e.target.value = '';
                app.donate.selectedAmount = 0;
                return;
            }
            const num = parseInt(raw, 10);
            app.donate.selectedAmount = num;
            e.target.value = new Intl.NumberFormat('vi-VN').format(num);

            document.querySelectorAll('.donate-preset-btn').forEach(btn => {
                const bVal = parseInt(btn.dataset.amount, 10);
                if (bVal === num) {
                    btn.className = 'donate-preset-btn px-4 py-2.5 text-xs sm:text-sm font-bold rounded-lg border border-black bg-black text-white transition';
                } else {
                    btn.className = 'donate-preset-btn px-4 py-2.5 text-xs sm:text-sm font-bold rounded-lg border border-gray-300 hover:border-black bg-white text-gray-800 transition';
                }
            });
        },

        createPayment: async () => {
            const amt = app.donate.selectedAmount;
            if (!amt || amt < 2000) {
                app.ui.showAlert("Số tiền ủng hộ tối thiểu là 2.000 VNĐ.");
                return;
            }
            if (amt > 100000000) {
                app.ui.showAlert("Số tiền ủng hộ vượt quá giới hạn cho phép.");
                return;
            }

            const msgInput = document.getElementById('donate-message');
            const message = msgInput ? msgInput.value.trim() : '';

            const btn = document.getElementById('btn-donate-submit');
            const origHTML = btn ? btn.innerHTML : 'Ủng hộ ngay';
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Đang tạo mã...';
            }

            try {
                const headers = { 'Content-Type': 'application/json' };
                if (app.user) {
                    const { data: { session } } = await window.sb.auth.getSession();
                    if (session?.access_token) {
                        headers['Authorization'] = `Bearer ${session.access_token}`;
                    }
                }

                const res = await fetch('/api/donate/create', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ amount: amt, message })
                });

                const data = await res.json();
                if (!res.ok || !data.success) {
                    throw new Error(data.error || 'Không thể tạo mã thanh toán.');
                }

                app.donate.currentOrder = data;
                app.donate.renderQrStep(data);

            } catch (err) {
                app.ui.showAlert("Không thể khởi tạo mã thanh toán: " + err.message);
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = 'Ủng hộ ngay';
                }
            }
        },

        renderQrStep: (data) => {
            app.donate.showStep('qr');

            const qrContainer = document.getElementById('donate-qr-box');
            if (qrContainer) {
                qrContainer.innerHTML = '';
                if (data.qrCode) {
                    new QRCode(qrContainer, {
                        text: data.qrCode,
                        width: 210,
                        height: 210,
                        colorDark: '#000000',
                        colorLight: '#ffffff',
                        correctLevel: QRCode.CorrectLevel.M
                    });
                } else if (data.checkoutUrl) {
                    qrContainer.innerHTML = `<div class="p-4 text-center text-xs text-gray-500">Mã QR tạm thời chưa tải được, bạn vui lòng thử lại sau.</div>`;
                }
            }

            const amtText = new Intl.NumberFormat('vi-VN').format(data.amount) + ' đ';
            const displayAmtEl = document.getElementById('donate-qr-amount');
            if (displayAmtEl) displayAmtEl.innerText = amtText;

            const orderCodeEl = document.getElementById('donate-qr-ordercode');
            if (orderCodeEl) orderCodeEl.innerText = `#${data.orderCode}`;

            const descEl = document.getElementById('donate-qr-desc');
            if (descEl) descEl.innerText = data.description || `VNBA ${data.orderCode}`;

            const accNumEl = document.getElementById('donate-qr-accnum');
            if (accNumEl) accNumEl.innerText = data.accountNumber || '---';

            const accNameEl = document.getElementById('donate-qr-accname');
            if (accNameEl) accNameEl.innerText = data.accountName || '---';

            if (app.donate._pollTimer) clearInterval(app.donate._pollTimer);
            app.donate._pollTimer = setInterval(async () => {
                try {
                    const res = await fetch(`/api/donate/check?orderCode=${data.orderCode}`);
                    const chk = await res.json();
                    if (chk.success && chk.status === 'PAID') {
                        clearInterval(app.donate._pollTimer);
                        app.donate._pollTimer = null;
                        app.donate.renderThankYou(data.orderCode, data.amount, !chk.is_logged_in, chk.is_anonymous);
                    } else if (chk.success && (chk.status === 'CANCELLED' || chk.status === 'EXPIRED')) {
                        clearInterval(app.donate._pollTimer);
                        app.donate._pollTimer = null;
                        app.ui.showAlert('Đơn ủng hộ đã hết hiệu lực hoặc bị hủy.', () => {
                            app.donate.showStep('form');
                            if (app.user && typeof app.donate.fetchProfileDonations === 'function') {
                                app.donate.fetchProfileDonations();
                            }
                        });
                    }
                } catch (e) {}
            }, 2500);
        },

        renderThankYou: (orderCode, amount, isGuest, isAnonymousDefault) => {
            if (app.donate._pollTimer) {
                clearInterval(app.donate._pollTimer);
                app.donate._pollTimer = null;
            }
            app.donate.showStep('thankyou');

            const amtEl = document.getElementById('donate-thankyou-amount');
            if (amtEl) amtEl.innerText = new Intl.NumberFormat('vi-VN').format(amount) + ' VNĐ';

            const codeEl = document.getElementById('donate-thankyou-code');
            if (codeEl) codeEl.innerText = `#VNBA-${orderCode}`;

            const toggle = document.getElementById('donate-anonymous-toggle');
            const hintEl = document.getElementById('donate-anonymous-hint');

            if (isGuest) {
                if (toggle) {
                    toggle.checked = true;
                    toggle.disabled = true;
                }
                if (hintEl) {
                    hintEl.innerText = 'Khách vãng lai mặc định được ẩn danh để bảo đảm quyền riêng tư.';
                }
            } else {
                if (toggle) {
                    toggle.checked = !!isAnonymousDefault;
                    toggle.disabled = false;
                    toggle.onchange = async () => {
                        try {
                            const headers = { 'Content-Type': 'application/json' };
                            if (window.sb && window.sb.auth) {
                                const { data: { session } } = await window.sb.auth.getSession();
                                if (session?.access_token) {
                                    headers['Authorization'] = `Bearer ${session.access_token}`;
                                }
                            }
                            await fetch('/api/donate/toggle-anonymous', {
                                method: 'POST',
                                headers,
                                body: JSON.stringify({
                                    orderCode: Number(orderCode),
                                    is_anonymous: toggle.checked
                                })
                            });
                            if (typeof app.donate.loadHomeSupporters === 'function') {
                                app.donate.loadHomeSupporters();
                            }
                        } catch(e) {}
                    };
                }
                if (hintEl) {
                    hintEl.innerText = 'Bật nếu bạn muốn giấu tên trên danh sách cảm ơn ở trang chủ.';
                }
            }
        },

        finish: async () => {
            if (app.donate._pollTimer) {
                clearInterval(app.donate._pollTimer);
                app.donate._pollTimer = null;
            }
            app.donate.currentOrder = null;

            if (typeof app.donate.loadHomeSupporters === 'function') {
                app.donate.loadHomeSupporters();
            }

            app.utils.navigate('/');
            if (app.toast && app.toast.show) {
                app.toast.show('success', 'Đóng góp thành công', 'Cảm ơn bạn rất nhiều vì đã đồng hành và ủng hộ VNBUSARCHIVE!');
            }
        },

        copyText: (elementId, label) => {
            const el = document.getElementById(elementId);
            if (!el) return;
            const val = el.innerText.trim();
            if (!val || val === '---') return;
            navigator.clipboard.writeText(val).then(() => {
                if (app.toast && app.toast.show) {
                    app.toast.show('success', 'Đã sao chép', `Đã sao chép ${label} vào bộ nhớ tạm.`);
                }
            }).catch(() => {});
        },

        downloadQr: () => {
            const container = document.getElementById('donate-qr-box');
            if (!container) return;

            const canvas = container.querySelector('canvas');
            const img = container.querySelector('img');
            let dataUrl = null;

            if (canvas) {
                dataUrl = canvas.toDataURL('image/png');
            } else if (img && img.src) {
                dataUrl = img.src;
            }

            if (!dataUrl) {
                app.ui.showAlert('Không tìm thấy hình ảnh mã QR để tải về.');
                return;
            }

            const orderCode = app.donate.currentOrder?.orderCode || 'donate';
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = `VNBA-QR-${orderCode}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        },

        cancelPayment: async () => {
            if (app.donate._pollTimer) {
                clearInterval(app.donate._pollTimer);
                app.donate._pollTimer = null;
            }
            const order = app.donate.currentOrder;
            app.donate.currentOrder = null;
            app.donate.showStep('form');

            if (order && order.orderCode) {
                try {
                    const res = await fetch('/api/donate/cancel', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ orderCode: order.orderCode })
                    });
                    const resJson = await res.json().catch(() => ({}));
                    if (resJson && resJson.paid) {
                        app.ui.showAlert('Ngân hàng đã ghi nhận khoản chuyển thành công của bạn!', () => {
                            app.donate.renderThankYou(order.orderCode, order.amount, app.donate.isGuest, false);
                        });
                        return;
                    }
                    if (app.user && typeof app.donate.fetchProfileDonations === 'function') {
                        app.donate.fetchProfileDonations();
                    }
                } catch (e) {
                    console.error('Error cancelling payment:', e);
                }
            }
        },

        resumePayment: async (orderCode) => {
            app.utils.navigate('/support-us');
            app.loadingBar.start();
            try {
                const res = await fetch(`/api/donate/check?orderCode=${encodeURIComponent(orderCode)}`);
                const checkData = await res.json();
                app.loadingBar.finish();

                if (!checkData || !checkData.success) {
                    app.ui.showAlert(checkData?.error || 'Đơn ủng hộ đã hết hạn hoặc không khả dụng.', () => {
                        app.donate.showStep('form');
                        if (app.user && typeof app.donate.fetchProfileDonations === 'function') {
                            app.donate.fetchProfileDonations();
                        }
                    });
                    return;
                }

                if (checkData.status === 'PAID') {
                    app.donate.renderThankYou(checkData.orderCode, checkData.amount, !checkData.is_logged_in, checkData.is_anonymous);
                    return;
                }

                if (checkData.status === 'CANCELLED' || checkData.status === 'EXPIRED') {
                    app.ui.showAlert('Đơn ủng hộ đã hết hiệu lực hoặc bị hủy.', () => {
                        app.donate.showStep('form');
                        if (app.user && typeof app.donate.fetchProfileDonations === 'function') {
                            app.donate.fetchProfileDonations();
                        }
                    });
                    return;
                }

                if (!checkData.qrCode) {
                    app.ui.showAlert('Đơn ủng hộ không còn mã QR khả dụng. Bạn hãy tạo một khoản ủng hộ mới nhé!', () => {
                        app.donate.showStep('form');
                        if (app.user && typeof app.donate.fetchProfileDonations === 'function') {
                            app.donate.fetchProfileDonations();
                        }
                    });
                    return;
                }

                app.donate.currentOrder = checkData;
                app.donate.renderQrStep(checkData);

            } catch (err) {
                app.loadingBar.finish();
                console.error('Error resuming donation:', err);
                app.ui.showAlert('Không thể mở lại đơn ủng hộ: ' + err.message);
            }
        },

        loadHomeSupporters: async () => {
            const container = document.getElementById('home-supporters-list');
            if (!container) return;

            try {
                const res = await fetch('/api/donate/supporters');
                const resData = await res.json();
                const list = (resData && resData.success && Array.isArray(resData.data)) ? resData.data : [];

                const top3 = list.slice(0, 3);
                const cards = [];

                for (let i = 0; i < 3; i++) {
                    const item = top3[i];
                    if (item) {
                        const amtStr = new Intl.NumberFormat('vi-VN').format(item.amount) + 'đ';
                        const safeName = app.utils.escapeHtml(item.donor_name);
                        const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString('vi-VN') : '';
                        const defaultAv = (typeof DEFAULT_AVATAR !== 'undefined') ? DEFAULT_AVATAR : '/media/default-avatar.png';

                        let iconOrAvatarHtml = '';
                        let clickAttr = '';
                        let cursorClass = 'cursor-default';

                        if (!item.is_anonymous && item.username) {
                            const rawAv = item.avatar_url;
                            const finalAv = rawAv 
                                ? (rawAv.startsWith('http') && !rawAv.includes('/avatar.jpg') ? app.utils.getProxiedUrl(rawAv.replace(/"/g, ''), 'avatar.jpg', 'avatar') : rawAv)
                                : defaultAv;
                            iconOrAvatarHtml = `
                                <div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200 mr-3 overflow-hidden">
                                    <img src="${finalAv}" alt="${safeName}" onerror="this.src='${defaultAv}'" class="w-full h-full object-cover">
                                </div>
                            `;
                            clickAttr = `onclick="app.utils.navigate('/user/${encodeURIComponent(item.username)}')"` ;
                            cursorClass = 'cursor-pointer hover:border-black';
                        } else {
                            iconOrAvatarHtml = `
                                <div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200 mr-3">
                                    <i class="fa-solid fa-user text-black text-xs"></i>
                                </div>
                            `;
                        }

                        const tooltipAttr = item.message ? `title="${app.utils.escapeHtml(item.message)}"` : '';
                        const subMsg = item.message ? app.utils.escapeHtml(item.message) : '';

                        cards.push(`
                            <div class="${cursorClass} transition-all duration-300 relative flex flex-row items-center p-3 text-left bg-white rounded-xl border border-gray-200 shadow-sm hover:border-black" ${clickAttr} ${tooltipAttr}>
                                ${iconOrAvatarHtml}
                                <div class="flex-1 min-w-0 flex flex-col justify-center">
                                    <div class="flex items-center justify-between gap-2">
                                        <span class="truncate font-bold text-gray-900 text-sm leading-tight">${safeName}</span>
                                        <span class="text-xs font-extrabold text-black shrink-0">+${amtStr}</span>
                                    </div>
                                    <div class="flex items-center justify-between gap-2 mt-0.5">
                                        <span class="block text-gray-500 text-xs tracking-wide truncate">${subMsg || 'Đồng hành cùng dự án'}</span>
                                        <span class="text-[11px] text-gray-400 shrink-0">${dateStr}</span>
                                    </div>
                                </div>
                            </div>
                        `);
                    } else {
                        cards.push(`
                            <div class="transition-all duration-300 relative flex flex-row items-center p-3 text-left bg-white rounded-xl border border-gray-200 shadow-sm opacity-60">
                                <div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200 mr-3">
                                    <i class="fa-solid fa-heart text-black text-xs"></i>
                                </div>
                                <div class="flex-1 min-w-0 flex flex-col justify-center">
                                    <div class="flex items-center justify-between gap-2">
                                        <span class="truncate font-bold text-gray-500 text-sm leading-tight">Vị trí chờ bạn</span>
                                        <span class="text-xs text-gray-400 shrink-0">---</span>
                                    </div>
                                    <span class="block text-gray-400 text-xs tracking-wide w-full truncate mt-0.5">Chưa có người ủng hộ</span>
                                </div>
                            </div>
                        `);
                    }
                }

                // 4th card: action card linking to /support-us
                cards.push(`
                    <div onclick="app.utils.navigate('/support-us')" class="cursor-pointer transition-all duration-300 relative flex flex-row items-center p-3 text-left bg-white rounded-xl border border-gray-200 shadow-sm hover:border-black group">
                        <div class="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-black group-hover:text-white flex items-center justify-center shrink-0 border border-gray-200 transition mr-3">
                            <i class="fa-solid fa-heart text-black group-hover:text-white text-xs"></i>
                        </div>
                        <div class="flex-1 min-w-0 flex flex-col justify-center">
                            <div class="flex items-center justify-between gap-2">
                                <span class="truncate font-bold text-gray-900 text-sm leading-tight">Tôi cũng muốn ủng hộ!</span>
                                <span class="text-xs font-bold text-gray-500 group-hover:text-black shrink-0">Ủng hộ ngay &rarr;</span>
                            </div>
                            <span class="block text-gray-500 text-xs tracking-wide w-full truncate mt-0.5">Tiếp sức cùng dự án duy trì máy chủ</span>
                        </div>
                    </div>
                `);

                container.innerHTML = cards.join('');

            } catch (e) {
                console.error('Error loading supporters:', e);
            }
        },

        _profileCache: {},

        fetchProfileDonations: async () => {
            const section = document.getElementById('my-donations-section');
            const grid = document.getElementById('my-donations-grid');
            if (!grid || !app.user) {
                if (section) section.classList.add('hidden');
                return;
            }

            try {
                const { data: { session } } = await window.sb.auth.getSession();
                const res = await fetch('/api/donate/history', {
                    headers: { 'Authorization': `Bearer ${session?.access_token || ''}` }
                });
                const resData = await res.json();
                const list = (resData && resData.success && Array.isArray(resData.data)) ? resData.data : [];

                if (!list.length) {
                    if (section) section.classList.add('hidden');
                    grid.innerHTML = '';
                    return;
                }

                if (section) section.classList.remove('hidden');
                app.donate._profileCache = {};

                const cardStyleClasses = "cursor-pointer transition-all duration-300 relative flex flex-row items-center p-3 text-left bg-white rounded-xl border border-gray-200 shadow-md hover:-translate-y-1 hover:shadow-xl";

                grid.innerHTML = list.map(item => {
                    app.donate._profileCache[item.order_code] = item;
                    const amtStr = new Intl.NumberFormat('vi-VN').format(item.amount) + ' đ';
                    const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString('vi-VN') : '';
                    const isPending = item.status === 'PENDING';
                    const dotColor = isPending ? 'bg-[#f58e27]' : 'bg-green-500';
                    const statusText = isPending ? 'Chờ thanh toán' : (dateStr || 'Đã ghi nhận');
                    const clickHandler = isPending 
                        ? `app.donate.resumePayment(${item.order_code})` 
                        : `app.donate.showDetailAlert('${item.order_code}')`;

                    return `
                        <div class="${cardStyleClasses}" onclick="${clickHandler}">
                            <span class="w-2 h-2 rounded-full ${dotColor} shrink-0 block mr-3"></span>
                            <div class="flex-1 min-w-0 flex flex-col justify-center">
                                <span class="truncate font-bold text-gray-900 text-sm leading-tight mb-0.5">+${amtStr}</span>
                                <span class="block text-gray-500 text-xs tracking-wide w-full truncate">#${item.order_code} · ${statusText}</span>
                            </div>
                        </div>
                    `;
                }).join('');

            } catch (err) {
                console.error('Error fetching profile donations:', err);
                if (section) section.classList.add('hidden');
            }
        },

        _activeDetailOrderCode: null,
        _activeDetailInitialAnon: false,
        _activeDetailCurrentAnon: false,
        _modalAnimTimeout: null,

        showDetailAlert: (orderCode) => {
            const item = app.donate._profileCache?.[orderCode];
            if (!item) return;

            const isAnon = Boolean(item.is_anonymous === true || item.is_anonymous === 'true' || item.is_anonymous === 1 || item.is_anonymous === '1');
            app.donate._activeDetailOrderCode = orderCode;
            app.donate._activeDetailInitialAnon = isAnon;
            app.donate._activeDetailCurrentAnon = isAnon;

            const amtStr = new Intl.NumberFormat('vi-VN').format(item.amount) + ' VNĐ';
            const dateStr = item.created_at ? new Date(item.created_at).toLocaleString('vi-VN') : '---';
            const safeMsg = item.message ? app.utils.escapeHtml(item.message) : '';

            const contentHtml = `
                <div class="text-left text-xs space-y-2.5 py-1">
                    <div class="flex justify-between items-center">
                        <span class="text-gray-500 font-medium">Mã ủng hộ:</span>
                        <span class="font-bold text-black font-mono">#${item.order_code}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-gray-500 font-medium">Số tiền:</span>
                        <span class="font-extrabold text-sm text-black">+${amtStr}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-gray-500 font-medium">Trạng thái:</span>
                        <span class="font-bold text-black">Đã ghi nhận</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-gray-500 font-medium">Thời gian:</span>
                        <span class="text-gray-700">${dateStr}</span>
                    </div>
                    ${safeMsg ? `
                    <div class="mt-2 text-left">
                        <span class="text-gray-500 font-medium block mb-1">Lời nhắn:</span>
                        <div class="bg-gray-50 p-2.5 rounded border border-gray-200 text-black italic text-xs">
                            "${safeMsg}"
                        </div>
                    </div>` : ''}

                    <div class="mt-4 pt-2">
                        <label class="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg border border-black cursor-pointer select-none">
                            <div class="min-w-0 pr-2">
                                <div class="text-xs font-bold text-black">
                                    Ẩn danh trên trang chủ
                                </div>
                                <p id="donation-modal-anon-desc" class="text-[11px] text-gray-500 mt-0.5 leading-normal">
                                    ${isAnon ? 'Khoản này đang được giấu tên trên danh sách tri ân.' : 'Khoản này đang được công khai tên trên danh sách tri ân.'}
                                </p>
                            </div>
                            <div class="relative shrink-0 flex items-center">
                                <input type="checkbox" id="donation-item-anon-toggle" class="custom-cb-input sr-only" ${isAnon ? 'checked' : ''} onchange="app.donate.onDetailAnonChange(this.checked)">
                                <div class="custom-cb-box shrink-0 shadow-sm" style="margin: 0 !important;">
                                    <i class="fa-solid fa-check"></i>
                                </div>
                            </div>
                        </label>
                    </div>

                    <div class="mt-5 pt-1 relative">
                        <!-- State 1: Chưa thay đổi -> Nút Đóng -->
                        <div id="donation-modal-btn-close" class="transition-all duration-300 ease-in-out">
                            <button type="button" onclick="app.ui.closeAlert()" class="w-full py-2.5 px-4 bg-black hover:bg-gray-800 text-white rounded-lg text-xs font-bold transition shadow-sm">
                                Đóng
                            </button>
                        </div>

                        <!-- State 2: Có thay đổi -> 2 nút Hủy và Lưu (Có Animation) -->
                        <div id="donation-modal-btn-actions" class="hidden opacity-0 translate-y-1 transition-all duration-300 ease-in-out flex items-center gap-2">
                            <button type="button" onclick="app.donate.cancelDetailChanges()" class="flex-1 py-2.5 px-4 bg-white border border-black hover:bg-gray-100 text-black rounded-lg text-xs font-bold transition shadow-sm">
                                Hủy
                            </button>
                            <button type="button" id="donation-modal-save-btn" onclick="app.donate.saveDetailChanges()" class="flex-1 py-2.5 px-4 bg-black hover:bg-gray-800 text-white rounded-lg text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5">
                                Lưu
                            </button>
                        </div>
                    </div>
                </div>
            `;

            app.ui.showAlert(contentHtml, () => {}, null, { 
                title: 'Chi tiết khoản ủng hộ',
                iconHtml: '<i class="fa-solid fa-heart text-xl text-black"></i>',
                btnOkText: 'Đóng'
            });

            // Hide the default modal footer container so our custom animated buttons handle everything
            const okBtn = document.getElementById('custom-alert-ok-btn');
            if (okBtn && okBtn.parentElement) {
                okBtn.parentElement.style.display = 'none';
            }

            // Explicitly sync the checkbox DOM checked state
            const toggleEl = document.getElementById('donation-item-anon-toggle');
            if (toggleEl) {
                toggleEl.checked = isAnon;
            }
        },

        onDetailAnonChange: (isChecked) => {
            app.donate._activeDetailCurrentAnon = isChecked;
            const hasChanged = app.donate._activeDetailCurrentAnon !== app.donate._activeDetailInitialAnon;

            const descEl = document.getElementById('donation-modal-anon-desc');
            if (descEl) {
                descEl.innerText = isChecked 
                    ? 'Khoản này đang được giấu tên trên danh sách tri ân.' 
                    : 'Khoản này đang được công khai tên trên danh sách tri ân.';
            }

            const closeBox = document.getElementById('donation-modal-btn-close');
            const actionsBox = document.getElementById('donation-modal-btn-actions');
            if (!closeBox || !actionsBox) return;

            if (app.donate._modalAnimTimeout) {
                clearTimeout(app.donate._modalAnimTimeout);
            }

            if (hasChanged) {
                // Animate Close out, Actions in
                closeBox.classList.add('opacity-0', '-translate-y-1');
                app.donate._modalAnimTimeout = setTimeout(() => {
                    if (app.donate._activeDetailCurrentAnon !== app.donate._activeDetailInitialAnon) {
                        closeBox.classList.add('hidden');
                        actionsBox.classList.remove('hidden');
                        void actionsBox.offsetWidth; // Trigger reflow for CSS transition
                        actionsBox.classList.remove('opacity-0', 'translate-y-1');
                        actionsBox.classList.add('opacity-100', 'translate-y-0');
                    }
                }, 150);
            } else {
                // Reverted back to initial state -> Animate Actions out, Close in
                actionsBox.classList.remove('opacity-100', 'translate-y-0');
                actionsBox.classList.add('opacity-0', 'translate-y-1');
                app.donate._modalAnimTimeout = setTimeout(() => {
                    if (app.donate._activeDetailCurrentAnon === app.donate._activeDetailInitialAnon) {
                        actionsBox.classList.add('hidden');
                        closeBox.classList.remove('hidden');
                        void closeBox.offsetWidth; // Trigger reflow for CSS transition
                        closeBox.classList.remove('opacity-0', '-translate-y-1');
                        closeBox.classList.add('opacity-100', 'translate-y-0');
                    }
                }, 150);
            }
        },

        cancelDetailChanges: () => {
            const toggle = document.getElementById('donation-item-anon-toggle');
            if (toggle) {
                toggle.checked = app.donate._activeDetailInitialAnon;
            }
            app.donate.onDetailAnonChange(app.donate._activeDetailInitialAnon);
        },

        saveDetailChanges: async () => {
            const orderCode = app.donate._activeDetailOrderCode;
            const targetAnon = app.donate._activeDetailCurrentAnon;
            const saveBtn = document.getElementById('donation-modal-save-btn');

            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1.5"></i> Đang lưu...';
            }

            try {
                const headers = { 'Content-Type': 'application/json' };
                if (window.sb && window.sb.auth) {
                    const { data: { session } } = await window.sb.auth.getSession();
                    if (session?.access_token) {
                        headers['Authorization'] = `Bearer ${session.access_token}`;
                    }
                }

                const res = await fetch('/api/donate/toggle-anonymous', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        orderCode: Number(orderCode),
                        is_anonymous: targetAnon
                    })
                });

                const resData = await res.json();
                if (!res.ok || !resData.success) {
                    throw new Error(resData.error || 'Lỗi khi cập nhật trạng thái');
                }

                // Update caches
                app.donate._activeDetailInitialAnon = targetAnon;
                const item = app.donate._profileCache?.[orderCode];
                if (item) item.is_anonymous = targetAnon;

                // Animate actions out, close button back in
                const closeBox = document.getElementById('donation-modal-btn-close');
                const actionsBox = document.getElementById('donation-modal-btn-actions');
                if (actionsBox && closeBox) {
                    actionsBox.classList.remove('opacity-100', 'translate-y-0');
                    actionsBox.classList.add('opacity-0', 'translate-y-1');
                    setTimeout(() => {
                        actionsBox.classList.add('hidden');
                        closeBox.classList.remove('hidden');
                        void closeBox.offsetWidth;
                        closeBox.classList.remove('opacity-0', '-translate-y-1');
                        closeBox.classList.add('opacity-100', 'translate-y-0');
                    }, 150);
                }

                // Refresh home supporters list in real-time
                if (typeof app.donate.loadHomeSupporters === 'function') {
                    app.donate.loadHomeSupporters();
                }

                if (app.toast && app.toast.show) {
                    app.toast.show('success', 'Đã lưu', 'Cập nhật trạng thái hiển thị thành công.');
                }

            } catch (err) {
                console.error('Error saving anonymity setting:', err);
                app.ui.showAlert('Không thể lưu thay đổi: ' + err.message);
            } finally {
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = 'Lưu';
                }
            }
        }
    }
});
