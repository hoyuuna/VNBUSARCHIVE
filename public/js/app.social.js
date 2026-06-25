window.app = window.app || {};

window.app.comments = {
    page: 1,
    lastPostTime: 0,
    replyingTo: null,
    init: async (photoId) => {
        const form = document.getElementById('comment-form-wrapper');
        const notice = document.getElementById('comment-auth-notice');
        const input = document.getElementById('comment-input');
        const warning = document.getElementById('comment-warning');

        if (app.currentPhoto && (app.currentPhoto.status === 'pending' || app.currentPhoto.status === 'denied')) {
            if (form) form.classList.add('hidden');
            if (notice) {
                notice.classList.remove('hidden');
                notice.innerHTML = '<p class="text-sm text-gray-500 font-medium">Bình luận sẽ không được mở cho các trường hợp ảnh đang chờ duyệt hoặc ảnh bị từ chối.</p>';
            }

            const listEl = document.getElementById('comment-list');
            if (listEl) listEl.innerHTML = '<p class="text-center text-gray-400 py-10 text-xs italic">Bình luận bị vô hiệu hóa.</p>';

            const countEl = document.getElementById('comment-count');
            if (countEl) countEl.innerText = '0';

            const btnMore = document.getElementById('btn-load-more-comments');
            if (btnMore) btnMore.classList.add('hidden');

            return;
        }

        if (app.user) {
            form?.classList.remove('hidden');
            notice?.classList.add('hidden');
            input?.addEventListener('input', (e) => {
                warning?.classList.toggle('hidden', e.target.value.length === 0);
            });
        } else {
            form?.classList.add('hidden');
            if (notice) {
                notice.classList.remove('hidden');
                notice.innerHTML = '<p class="text-sm text-gray-500 font-medium">Vui lòng <a href="/auth" class="font-bold text-black underline">đăng nhập</a> để bình luận.</p>';
            }
        }
        app.comments.page = 1;
        app.comments.load(photoId);
    },
    load: async (photoId, append = false) => {
        const listEl = document.getElementById('comment-list');
        const countEl = document.getElementById('comment-count');
        if (!listEl) return;
        const limit = 12;

        try {
            const response = await fetch('/api/social', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'get_comments',
                    payload: { photoId, page: app.comments.page, limit }
                })
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error);

            const { parents, repliesMap, totalCount, count } = data;
            if (countEl) countEl.innerText = totalCount || 0;

            // --- THÊM CHỐT CHẶN RACE CONDITION CHO BÌNH LUẬN VÀO ĐÂY ---
            if (app.currentPhoto && String(app.currentPhoto.id) !== String(photoId)) return;
            const currentPath = window.location.pathname;
            if (!currentPath.includes(`/photo/${photoId}`) && !currentPath.includes('/profile/comments')) return;
            // -------------------------------------------------------------

            const to = (app.comments.page - 1) * limit + limit - 1;
            const btnMore = document.getElementById('btn-load-more-comments');
            if (btnMore) btnMore.classList.toggle('hidden', count <= (to + 1));

            const html = (parents || []).map(c => app.comments.renderItem(c, repliesMap[c.id] || [])).join('');

            if (append) listEl.innerHTML += html;
            else listEl.innerHTML = html || '<p class="text-center text-gray-400 py-10 text-xs italic">Chưa có bình luận nào.</p>';
        } catch (e) { console.error(e); }
    },
    renderItem: (c, replies = []) => {
        const isMe = app.user && c.user_id === app.user.id;
        const canDelete = isMe || app.role === 'admin' || app.role === 'manager';
        const avatar = c.profiles?.avatar_url
            ? app.utils.getProxiedUrl(c.profiles.avatar_url.replace(/"/g, ''), 'avatar.jpg', 'avatar')
            : 'https://files.catbox.moe/zzh1q1.png';

        const toolbar = app.user ? `
            <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px;">
                <button style="display: flex; align-items: center; gap: 6px; background: white; border: 1px solid #d1d5db; color: #374151; padding: 6px 12px; border-radius: 8px; font-weight: bold; font-size: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);" onclick="app.comments.startReply('${c.id}', '${c.profiles?.username || ''}')" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='white'"><i class="fa-solid fa-reply"></i> Phản hồi</button>
                <button style="display: flex; align-items: center; gap: 6px; background: white; border: 1px solid #d1d5db; color: #374151; padding: 6px 12px; border-radius: 8px; font-weight: bold; font-size: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);" onclick="app.utils.navigate('/contact')" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='white'"><i class="fa-solid fa-flag"></i> Báo cáo</button>
                ${canDelete ? `<button style="display: flex; align-items: center; gap: 6px; background: white; border: 1px solid #fca5a5; color: #dc2626; padding: 6px 12px; border-radius: 8px; font-weight: bold; font-size: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);" onclick="app.comments.delete('${c.id}')" onmouseover="this.style.background='#fef2f2'" onmouseout="this.style.background='white'"><i class="fa-solid fa-trash-can"></i> Xóa</button>` : ''}
            </div>` : `
            <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px;">
                ${canDelete ? `<button style="display: flex; align-items: center; gap: 6px; background: white; border: 1px solid #fca5a5; color: #dc2626; padding: 6px 12px; border-radius: 8px; font-weight: bold; font-size: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);" onclick="app.comments.delete('${c.id}')" onmouseover="this.style.background='#fef2f2'" onmouseout="this.style.background='white'"><i class="fa-solid fa-trash-can"></i> Xóa</button>` : ''}
            </div>`;

        let repliesHTML = '';
        if (replies.length > 0) {
            const shown = replies.slice(0, 2);
            const hidden = replies.length - 2;

            repliesHTML = `
            <div class="reply-group relative" id="reply-group-${c.id}" style="margin-top: 12px; margin-left: 48px; margin-right: 16px;">
                <div style="position: absolute; left: -24px; top: 0; bottom: 10px; width: 2px; background-color: #e5e7eb; border-radius: 4px; pointer-events: none; z-index: 0;"></div>
            `;

            shown.forEach(r => {
                repliesHTML += app.comments.renderReplyItem(r);
            });

            if (hidden > 0) {
                repliesHTML += `<div style="display: flex; justify-content: center; margin-top: 4px; margin-bottom: 8px;"><button style="font-family: inherit; font-size: 11px; font-weight: bold; color: #4b5563; background: white; border: 1px solid #e5e7eb; padding: 6px 16px; border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);" onclick="app.comments.toggleReplies('${c.id}', ${replies.length})" id="btn-toggle-replies-${c.id}" onmouseover="this.style.background='#f9fafb'" onmouseout="this.style.background='white'"><i class="fa-solid fa-chevron-down" style="margin-right: 4px;"></i>Xem thêm ${hidden} phản hồi</button></div>`;
                repliesHTML += `<div id="reply-hidden-${c.id}" class="hidden">`;
                replies.slice(2).forEach(r => {
                    repliesHTML += app.comments.renderReplyItem(r);
                });
                repliesHTML += '</div>';
            }
            repliesHTML += '</div>';
        }

        return `
        <div style="margin-bottom: 20px;">
            <div id="comment-${c.id}" class="bg-white border border-gray-200 shadow-sm z-10 relative" style="padding: 16px; border-radius: 16px; display: flex; gap: 12px; align-items: flex-start;">
                <img src="${avatar}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; flex-shrink: 0; border: 1px solid #f3f4f6; margin-top: 2px;">
                <div style="flex: 1; min-width: 0;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px; overflow-x: auto; white-space: nowrap; scrollbar-width: none;">
                        <span onclick="app.views.loadUserProfile('${c.profiles?.username}')" style="font-size: 14px; font-weight: bold; color: black; cursor: pointer; flex-shrink: 0;">${c.profiles?.username || 'Ẩn danh'}</span>
                        <div style="display: flex; gap: 4px; flex-shrink: 0; align-items: center;">
                            ${app.utils.getBadgesHTML(c.user_id, c.profiles?.role, c.profiles?.subroles)}
                        </div>
                    </div>
                    <span style="font-size: 11px; font-weight: bold; color: #9ca3af; display: block; margin-bottom: 8px;"><i class="fa-regular fa-clock" style="margin-right: 4px;"></i>${new Date(c.created_at).toLocaleString('vi-VN')}</span>
                    <p style="font-size: 14px; color: #1f2937; line-height: 1.6; word-break: break-word; white-space: pre-wrap; margin: 0;">${app.utils.cleanText(c.content)}</p>
                    ${toolbar}
                </div>
            </div>
            ${repliesHTML}
        </div>`;
    },

    renderReplyItem: (r) => {
        const isMe = app.user && r.user_id === app.user.id;
        const canDelete = isMe || app.role === 'admin' || app.role === 'manager';
        const avatar = r.profiles?.avatar_url
            ? app.utils.getProxiedUrl(r.profiles.avatar_url.replace(/"/g, ''), 'avatar.jpg', 'avatar')
            : 'https://files.catbox.moe/zzh1q1.png';

        const toolbar = app.user ? `
            <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px;">
                <button style="display: flex; align-items: center; gap: 4px; background: white; border: 1px solid #d1d5db; color: #4b5563; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 10px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);" onclick="app.utils.navigate('/contact')" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='white'"><i class="fa-solid fa-flag" style="font-size: 10px;"></i> Báo cáo</button>
                ${canDelete ? `<button style="display: flex; align-items: center; gap: 4px; background: white; border: 1px solid #fca5a5; color: #dc2626; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 10px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);" onclick="app.comments.delete('${r.id}')" onmouseover="this.style.background='#fef2f2'" onmouseout="this.style.background='white'"><i class="fa-solid fa-trash-can" style="font-size: 10px;"></i> Xóa</button>` : ''}
            </div>` : `
            <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px;">
                ${canDelete ? `<button style="display: flex; align-items: center; gap: 4px; background: white; border: 1px solid #fca5a5; color: #dc2626; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 10px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);" onclick="app.comments.delete('${r.id}')" onmouseover="this.style.background='#fef2f2'" onmouseout="this.style.background='white'"><i class="fa-solid fa-trash-can" style="font-size: 10px;"></i> Xóa</button>` : ''}
            </div>`;

        return `
        <div id="comment-${r.id}" class="bg-gray-50 border border-gray-200 shadow-sm z-10 relative" style="padding: 12px; border-radius: 12px; display: flex; gap: 10px; align-items: flex-start; margin-bottom: 12px;">
            <img src="${avatar}" style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover; flex-shrink: 0; border: 1px solid #e5e7eb; margin-top: 2px;">
            <div style="flex: 1; min-width: 0;">
                <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px; overflow-x: auto; white-space: nowrap; scrollbar-width: none;">
                    <span onclick="app.views.loadUserProfile('${r.profiles?.username}')" style="font-size: 12px; font-weight: bold; color: black; cursor: pointer; flex-shrink: 0;">${r.profiles?.username || 'Ẩn danh'}</span>
                    <div style="display: flex; gap: 4px; flex-shrink: 0; align-items: center; transform: scale(0.8); transform-origin: left;">
                        ${app.utils.getBadgesHTML(r.user_id, r.profiles?.role, r.profiles?.subroles)}
                    </div>
                </div>
                <span style="font-size: 10px; font-weight: bold; color: #9ca3af; display: block; margin-bottom: 4px;"><i class="fa-regular fa-clock" style="margin-right: 4px;"></i>${new Date(r.created_at).toLocaleString('vi-VN')}</span>
                <p style="font-size: 12px; color: #374151; line-height: 1.5; word-break: break-word; white-space: pre-wrap; margin: 0;">${app.utils.cleanText(r.content)}</p>
                ${toolbar}
            </div>
        </div>`;
    },
    openDashboard: async () => {
        app.views.switch('comment-dashboard', false);
        const container = document.getElementById('dashboard-content');
        container.innerHTML = '<p class="text-center py-20 text-gray-400"><i class="fa-solid fa-spinner fa-spin"></i> Đang tổng hợp bình luận...</p>';

        try {
            const { data: { session } } = await window.sb.auth.getSession();
            const token = session?.access_token;
            if (!token) throw new Error("Chưa đăng nhập.");

            const response = await fetch('/api/social', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'get_dashboard',
                    token: token
                })
            });
            const resData = await response.json();
            if (!resData.success) throw new Error(resData.error);
            
            const data = resData.data;
            const myCommentIds = resData.myCommentIds;

            const groups = {};
            data.forEach(c => {
                const plate = c.photos.license_plate;
                if (!groups[plate]) groups[plate] = { info: c.photos, comments: [] };
                groups[plate].comments.push(c);
            });

            const html = Object.values(groups).map(g => `
                <div class="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                    <div class="bg-gray-50 px-4 py-3 flex items-center gap-3 border-b border-gray-100 cursor-pointer hover:bg-gray-100 transition" onclick="app.views.loadDetail('${g.info.id}')">
                        <img src="${app.utils.getProxiedUrl(g.info.url, 'thumb.jpg', 'thumb')}" class="w-12 h-8 object-cover rounded shadow-sm border border-white">
                        <span class="font-black text-sm text-black uppercase">${g.info.license_plate}</span>
                        <span class="text-[10px] text-gray-400 font-bold ml-auto">${g.comments.length} TƯƠNG TÁC</span>
                    </div>
                    <div class="p-3 space-y-2 bg-white/50">
                        ${g.comments.map(c => {
                            // NẾU BÌNH LUẬN NÀY LÀ REPLY CHO BÌNH LUẬN CỦA USER, HIỂN THỊ THÊM BADGE "ĐÃ TRẢ LỜI BẠN"
                            const isReplyToMe = myCommentIds.includes(c.parent_id);
                            const replyBadge = isReplyToMe ? \`<span class="bg-blue-100 text-blue-700 text-[9px] px-1.5 py-0.5 rounded ml-2 font-bold border border-blue-200 whitespace-nowrap"><i class="fa-solid fa-reply"></i> Trả lời bạn</span>\` : '';

                            return \`
                            <div class="flex justify-between items-start gap-3 bg-white border border-gray-200 p-3 rounded-xl shadow-sm hover:shadow-md transition cursor-pointer" onclick="app.utils.navigate('/photo/${g.info.id}'); setTimeout(()=> { const el = document.getElementById('comment-${c.id}'); if(el) el.scrollIntoView({behavior: 'smooth', block: 'center'}); }, 1000);">
                                <div class="overflow-hidden flex-1">
                                    <div class="flex items-center">
                                        <span class="text-[11px] font-bold text-black">${c.profiles.username}</span>
                                        ${replyBadge}
                                    </div>
                                    <p class="text-xs text-gray-700 mt-1 mb-1.5 line-clamp-2 leading-relaxed">${c.content}</p>
                                    <span class="text-[9px] text-gray-400 font-bold uppercase"><i class="fa-regular fa-clock mr-1"></i>${new Date(c.created_at).toLocaleString('vi-VN')}</span>
                                </div>
                                <button onclick="event.stopPropagation(); app.comments.delete('${c.id}')" class="text-red-400 hover:text-red-600 bg-red-50 p-2 rounded-lg transition shrink-0"><i class="fa-solid fa-trash-can text-sm"></i></button>
                            </div>
                        \`}).join('')}
                    </div>
                </div>
            `).join('');

            container.innerHTML = html || '<p class="text-center py-20 text-gray-400">Chưa có ai bình luận trên bài đăng của bạn hoặc phản hồi lại bạn.</p>';
        } catch (e) { container.innerHTML = '<p class="text-red-500 text-center mt-10">Lỗi: ' + e.message + '</p>'; }
    },
    post: async () => {
        const input = document.getElementById('comment-input');
        const content = input?.value.trim();
        if (!content || !app.currentPhoto) return;

        if (app.currentPhoto.status === 'pending' || app.currentPhoto.status === 'denied') {
            return app.ui.showAlert("Hành vi bị từ chối. Không thể bình luận trên ảnh chưa được duyệt!");
        }

        if (/https?:\/\/|www\.|\.com|\.vn|\.io|\.net|\.org/i.test(content)) {
            return app.ui.showAlert("Bình luận chứa liên kết không được phép. Vui lòng xóa link và thử lại.");
        }

        const now = Date.now();
        if (now - app.comments.lastPostTime < 30000) {
            return app.ui.showAlert("<b>Rate Limit:</b> Vui lòng đợi 30 giây.");
        }

        // YÊU CẦU GIẢI CAPTCHA TRƯỚC KHI COMMENT
        try {
            await app.captcha.request();
        } catch (err) {
            if (err.message === "CAPTCHA_CANCELLED") return;
            return app.ui.showAlert("Lỗi xác thực Captcha.");
        }

        const btn = document.getElementById('btn-post-comment');
        btn.disabled = true;

        const insertData = {
            photo_id: app.currentPhoto.id,
            content: content
        };
        if (app.comments.replyingTo) {
            insertData.parent_id = app.comments.replyingTo;
        }

        // Optimistic UI Update: Fake comment
        const fakeId = 'temp-' + Date.now();
        const listEl = document.getElementById('comment-list');
        if (listEl) {
            const fakeHtml = app.comments.renderItem({
                id: fakeId,
                user_id: app.user.id,
                content: content,
                created_at: new Date().toISOString(),
                profiles: { username: app.username || 'Bạn', avatar_url: app.user.user_metadata?.avatar_url || '' }
            }, []);
            // Thay đổi style để hiển thị "Đang gửi"
            const modifiedFakeHtml = fakeHtml.replace('<div class="flex justify-between items-start gap-3 bg-white border border-gray-200', '<div id="'+fakeId+'" class="flex justify-between items-start gap-3 bg-white border border-gray-200 opacity-70').replace('</div>\n                                            <button', '<span class="text-[10px] text-blue-500 font-bold ml-2 italic">Đang gửi...</span></div>\n                                            <button');
            if (listEl.innerHTML.includes('Chưa có bình luận')) listEl.innerHTML = '';
            listEl.insertAdjacentHTML('afterbegin', modifiedFakeHtml);
            
            // Xóa text input ngay lập tức
            input.value = '';
        }

        let error = null;
        try {
            let { data: { session } } = await window.sb.auth.getSession();
            let token = session?.access_token;

            let response = await fetch('/api/social', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'post_comment', payload: insertData, token })
            });
            let resData = await response.json();

            if (!resData.success && resData.error && resData.error.includes('JWT')) {
                const { data: { session: newSession } } = await window.sb.auth.refreshSession();
                if (newSession) {
                    token = newSession.access_token;
                    response = await fetch('/api/social', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'post_comment', payload: insertData, token })
                    });
                    resData = await response.json();
                } else {
                    app.ui.showAlert('Phiên đã hết hạn. Vui lòng tải lại trang và đăng nhập lại.');
                    error = { message: 'Phiên đã hết hạn.' };
                }
            }

            if (!resData.success && !error) error = { message: resData.error };
        } catch (e) {
            error = e;
        }

        if (error) {
            app.ui.showAlert("Lỗi: " + error.message);
            const fakeEl = document.getElementById(fakeId);
            if(fakeEl) fakeEl.remove();
        } else {
            document.getElementById('comment-warning')?.classList.add('hidden');
            app.comments.cancelReply();
            app.comments.lastPostTime = now;
            app.comments.page = 1;
            app.comments.load(app.currentPhoto.id);
        }
        btn.disabled = false;
    },
    delete: async (id) => {
        app.ui.showAlert("Bạn có chắc chắn muốn xóa bình luận này? (Các phản hồi bên trong cũng sẽ bị xóa theo)", async () => {
            try {
                const { data: { session } } = await window.sb.auth.getSession();
                const token = session?.access_token;
                
                const res = await fetch('/api/social', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'delete_comment', payload: { id }, token })
                });
                const data = await res.json();
                if (!data.success) throw new Error(data.error);

                if (app.currentViewMode === 'comment-dashboard') app.comments.openDashboard();
                else if (app.adminTab === 'comments') app.admin.loadTab('comments');
                else app.comments.load(app.currentPhoto.id);
            } catch (err) {
                app.ui.showAlert("Lỗi xóa bình luận: " + err.message);
            }
        }, () => {
            // Hàm Hủy
        }, { title: "Xác nhận xóa", btnOkText: "Xóa", btnCancelText: "Hủy" });
    },
    loadMore: () => {
        app.comments.page++;
        app.comments.load(app.currentPhoto.id, true);
    },
    startReply: (commentId, username) => {
        app.comments.replyingTo = commentId;
        const indicator = document.getElementById('reply-indicator');
        const nameEl = document.getElementById('reply-to-name');
        if (indicator && nameEl) {
            nameEl.textContent = username || 'Ẩn danh';
            indicator.classList.remove('hidden');
        }
        const input = document.getElementById('comment-input');
        if (input) {
            input.placeholder = `Trả lời ${username}...`;
            input.focus();
        }
    },
    cancelReply: () => {
        app.comments.replyingTo = null;
        const indicator = document.getElementById('reply-indicator');
        if (indicator) indicator.classList.add('hidden');
        const input = document.getElementById('comment-input');
        if (input) input.placeholder = 'Viết bình luận...';
    },
    toggleReplies: (commentId, total) => {
        const hidden = document.getElementById(`reply-hidden-${commentId}`);
        const btn = document.getElementById(`btn-toggle-replies-${commentId}`);
        if (!hidden || !btn) return;
        const isHidden = hidden.classList.contains('hidden');
        hidden.classList.toggle('hidden');
        const remaining = total - 2;
        btn.textContent = isHidden ? 'Ẩn bớt phản hồi' : `Xem thêm ${remaining} phản hồi`;
    }
};

window.app.notifications = { init: ()=>{}, add: async ()=>{} };

window.app.topUploaders = {};

window.app.activeAnnouncements = [];
