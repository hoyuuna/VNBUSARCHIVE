// Extracted to page_help.js
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
                    const { count } = await window.sb.from('photos').select('*', { count: 'estimated', head: true }).eq('uploader_id', uData.id).eq('status', 'approved');
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
    }
});
