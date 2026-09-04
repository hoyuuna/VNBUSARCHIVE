// Extracted to page_photo.js
Object.assign(window.app, {
    photo: {
                downloadImage: async (e) => {
                    if (!app.currentPhoto) return;
                    const btn = e.currentTarget;
                    
                    const profile = app.currentPhoto.profiles || {};
                    const prefs = profile.preferences || {};
                    const hasContact = !!prefs.contact_email;
                    
                    let banInfo = null;
                    if (profile.ban_status) {
                        try { banInfo = typeof profile.ban_status === 'string' ? JSON.parse(profile.ban_status) : profile.ban_status; } catch(e){}
                    }
                    const isBanned = banInfo && (banInfo.banned === true || banInfo.banned === 'true');
                    
                    const downloadLogic = async () => {
                        const origHtml = btn.innerHTML;
                        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Đang tải...';
                        try {
                            const plateName = app.utils.displayPlate(app.currentPhoto.license_plate) || 'VNBUSARCHIVE';
                            let proxyUrl = app.utils.getProxiedUrl(app.currentPhoto.url, `${plateName}.jpg`);
                            const response = await fetch(proxyUrl);
                            const blob = await response.blob();
                            const img = new Image();
                            const objectUrl = window.URL.createObjectURL(blob);
                            await new Promise((resolve, reject) => {
                                img.onload = resolve;
                                img.onerror = reject;
                                img.src = objectUrl;
                            });
                            const canvas = document.createElement('canvas');
                            canvas.width = img.width;
                            canvas.height = img.height;
                            const ctx = canvas.getContext('2d');
                            ctx.fillStyle = '#FFFFFF';
                            ctx.fillRect(0, 0, canvas.width, canvas.height);
                            ctx.drawImage(img, 0, 0);
                            canvas.toBlob((jpgBlob) => {
                                const blobUrl = window.URL.createObjectURL(jpgBlob);
                                const a = document.createElement('a');
                                a.href = blobUrl;
                                a.download = plateName + '.jpg';
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                window.URL.revokeObjectURL(blobUrl);
                                window.URL.revokeObjectURL(objectUrl);
                            }, 'image/jpeg', 0.95);
                        } catch (err) {
                            app.ui.showAlert('Lỗi: Không thể tải hình ảnh từ máy chủ!');
                        } finally {
                            btn.innerHTML = origHtml;
                        }
                    };

                    let termsHtml = '';
                    if (isBanned) {
                        termsHtml = `
                            <div class="text-left text-sm text-gray-600 space-y-2">
                                <p>Do tác giả đã bị cấm khỏi hệ thống, bạn tuyệt đối không được phép tải về để chia sẻ công khai, đăng tải lại (re-up) lên mạng xã hội hoặc sử dụng cho bất kỳ mục đích nào khác. Mọi hành vi sử dụng trái phép đều có thể bị khiếu nại bản quyền hoặc xử lý theo quy định.</p>
                                <p>Hình ảnh và dữ liệu này chỉ được phép sử dụng cho mục đích tra cứu, học tập và nghiên cứu cá nhân. Nghiêm cấm cào dữ liệu tự động, thương mại hóa, hoặc cắt ghép chỉnh sửa phục vụ mục đích bôi nhọ, xuyên tạc.</p>
                                <p>Toàn bộ tư liệu chỉ mang tính chất tham khảo, không có giá trị làm bằng chứng pháp lý để xử lý vi phạm.</p>
                            </div>
                        `;
                    } else if (hasContact) {
                        termsHtml = `
                            <div class="text-left text-sm text-gray-600 space-y-2">
                                <p>Bạn bắt buộc phải chủ động <a href="/user/${profile.id}" onclick="event.preventDefault(); app.ui.closeAlert(false); app.utils.navigate('/user/${profile.id}')" class="font-bold underline hover:text-black">liên hệ</a> và nhận được sự đồng ý bằng văn bản từ tác giả gốc trước khi tái sử dụng ảnh cho bất kỳ mục đích nào. Nếu sử dụng trái phép khi chưa có sự cho phép, tác giả có toàn quyền gửi yêu cầu gỡ bỏ vi phạm bản quyền hoặc thực hiện các biện pháp khiếu nại pháp lý liên quan.</p>
                                <p>Khi sử dụng lại ảnh từ hệ thống, bạn phải trích dẫn nguồn đầy đủ và rõ ràng. Tuyệt đối không được xóa, che mờ hoặc chỉnh sửa dấu bản quyền gắn trên ảnh.</p>
                                <p>Dữ liệu và hình ảnh được cung cấp cho mục đích tra cứu, học tập, nghiên cứu cá nhân. Nghiêm cấm mọi hành vi cào dữ liệu tự động quy mô lớn để kinh doanh hoặc thương mại hóa trái phép.</p>
                                <p>Nghiêm cấm cắt ghép, chỉnh sửa ảnh để lồng ghép vào các nội dung sai sự thật, tin đồn thất thiệt, bôi nhọ hoặc gây ảnh hưởng đến danh dự của nhân viên vận tải.</p>
                                <p>Bạn chỉ được cấp quyền sử dụng lại theo quy định cộng đồng. Tác giả gốc hoặc VNBUSARCHIVE có toàn quyền khiếu nại bản quyền và yêu cầu gỡ bỏ nếu bạn sử dụng ảnh sai mục đích hoặc vi phạm các điều khoản.</p>
                                <p>Toàn bộ hình ảnh tải về chỉ mang tính chất tham khảo, không được sử dụng làm bằng chứng pháp lý để xử lý vi phạm.</p>
                            </div>
                        `;
                    } else {
                        termsHtml = `
                            <div class="text-left text-sm text-gray-600 space-y-2">
                                <p>Do tác giả không cung cấp thông tin liên hệ công khai, bạn tuyệt đối <strong>không được phép</strong> tải về để chia sẻ công khai, đăng tải lại (re-up) lên mạng xã hội hoặc sử dụng cho bất kỳ mục đích nào khác khi chưa có văn bản đồng ý từ tác giả gốc. Mọi hành vi sử dụng trái phép đều có thể bị khiếu nại bản quyền hoặc xử lý theo quy định.</p>
                                <p>Hình ảnh và dữ liệu này chỉ được phép sử dụng cho mục đích tra cứu, học tập và nghiên cứu cá nhân. Nghiêm cấm cào dữ liệu tự động, thương mại hóa, hoặc cắt ghép chỉnh sửa phục vụ mục đích bôi nhọ, xuyên tạc.</p>
                                <p>Toàn bộ tư liệu chỉ mang tính chất tham khảo, không có giá trị làm bằng chứng pháp lý để xử lý vi phạm.</p>
                            </div>
                        `;
                    }

                    app.ui.showAlert(
                        termsHtml,
                        downloadLogic,
                        () => {},
                        {
                            title: "Lưu ý bản quyền",
                            btnOkText: "Đồng ý",
                            btnCancelText: "Đóng"
                        }
                    );

                },
                requestDelete: async () => {
                    if (!app.user || !app.currentPhoto) return;
                    const p = app.currentPhoto;
                    
                    if (p.status === 'approved' || p.status === 'denied') {
                        const uploadedTime = new Date(p.created_at).getTime();
                        const hoursSinceUpload = (Date.now() - uploadedTime) / (1000 * 60 * 60);
                        if (hoursSinceUpload < 24) {
                            const remainingHours = Math.ceil(24 - hoursSinceUpload);
                            return app.ui.showAlert(`Ảnh này mới được đăng tải. Bạn chỉ có thể xóa hoặc yêu cầu xóa ảnh sau khi đã trôi qua 24 giờ kể từ lúc đăng (Vui lòng quay lại sau khoảng ${remainingHours} tiếng nữa).`);
                        }
                    }

                    const isPendingOrDenied = (p.status === 'pending' || p.status === 'denied');
                    if (isPendingOrDenied) {
                        app.ui.showAlert(
                            "Bạn có chắc chắn muốn xóa ảnh này? Ảnh sẽ bị xóa vĩnh viễn khỏi hệ thống.",
                            async () => {
                                try {
                                    try { await app.captcha.request(); } catch (err) { if (err.message !== "CAPTCHA_CANCELLED") app.ui.showAlert("Lỗi xác thực Captcha."); return; }
                                    const { data: { session } } = await window.sb.auth.getSession();
                                    if (session && p.url) {
                                        await fetch('/api/delete-image', {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'Authorization': `Bearer ${session.access_token}`
                                            },
                                            body: JSON.stringify({ imageUrl: p.url, photoId: p.id })
                                        });
                                    }
                                    await window.sb.from('photos').delete().eq('id', p.id);
                                    await app.vehicle.cleanupVehicle(p.license_plate);
                                    app.toast.show('success', 'Thành công', 'Ảnh đã được xóa vĩnh viễn khỏi hệ thống.');
                                    app.views.loadHome();
                                } catch (err) { app.ui.showAlert("Lỗi khi xóa ảnh: " + err.message); }
                            },
                            () => { console.log("Hủy xóa"); },
                            { countdown: true, btnOkText: "Xóa ảnh", btnCancelText: "Hủy bỏ", title: "Xác nhận xóa" }
                        );
                    } else {
                        try {
                            const { count, error: checkErr } = await window.sb.from('edit_requests')
                                .select('*', { count: 'estimated', head: true })
                                .eq('status', 'pending')
                                .contains('new_data', { photo_id: p.id });
                            if (checkErr) throw checkErr;
                            if (count > 0) {
                                return app.ui.showAlert("Ảnh này đang có một yêu cầu chỉnh sửa hoặc xóa khác chờ duyệt. Vui lòng đợi Admin xử lý xong trước khi gửi yêu cầu mới.");
                            }
                        } catch (e) {
                            return app.ui.showAlert("Lỗi kiểm tra hệ thống: " + e.message);
                        }
                        app.ui.showPrompt("Vui lòng nhập lý do xóa ảnh này (Bắt buộc):", "", async (reason) => {
                            try {
                                try { await app.captcha.request(); } catch (err) { if (err.message !== "CAPTCHA_CANCELLED") app.ui.showAlert("Lỗi xác thực Captcha."); return; }
                                const { error } = await window.sb.from('edit_requests').insert({
                                    requester_id: app.user.id,
                                    license_plate: p.license_plate,
                                    new_data: { request_type: 'delete_photo', photo_id: p.id, reason: reason },
                                    status: 'pending'
                                });
                                if (error) throw error;
                                app.ui.showAlert("Yêu cầu xóa ảnh đã được gửi và đang chờ Admin duyệt. Bạn có thể kiểm tra trạng thái trong trang Hồ sơ của tôi.");
                            } catch (err) { app.ui.showAlert("Lỗi: " + err.message); }
                        });
                    }
                }
            },

    comments: {
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
                    const from = (app.comments.page - 1) * limit;
                    const to = from + limit - 1;
                    try {
                        let parents, count, error;
                        let useThreads = true;
                        if (countEl) {
                            const { count: totalCount } = await window.sb
                                .from('photo_comments')
                                .select('*', { count: 'estimated', head: true })
                                .eq('photo_id', photoId);
                            countEl.innerText = totalCount || 0;
                        }
                        const result = await window.sb
                            .from('photo_comments')
                            .select('*, profiles(id, username, avatar_url, role, subroles, ban_status)', { count: 'estimated' })
                            .eq('photo_id', photoId)
                            .is('parent_id', null)
                            .order('created_at', { ascending: false })
                            .range(from, to);
                        parents = result.data;
                        count = result.count;
                        error = result.error;
                        if (error) {
                            useThreads = false;
                            const fallback = await window.sb
                                .from('photo_comments')
                                .select('*, profiles(id, username, avatar_url, role, subroles, ban_status)', { count: 'estimated' })
                                .eq('photo_id', photoId)
                                .order('created_at', { ascending: false })
                                .range(from, to);
                            parents = fallback.data;
                            count = fallback.count;
                            error = fallback.error;
                        }
                        if (error) throw error;
                        if (app.currentPhoto && String(app.currentPhoto.id) !== String(photoId)) return;
                        const currentPath = window.location.pathname;
                        if (!currentPath.includes(`/photo/${photoId}`) && !currentPath.includes('/profile/comments')) return;
                        const btnMore = document.getElementById('btn-load-more-comments');
                        if (btnMore) btnMore.classList.toggle('hidden', count <= (to + 1));
                        let repliesMap = {};
                        if (useThreads && parents && parents.length > 0) {
                            const parentIds = parents.map(p => p.id);
                            const { data: replies } = await window.sb
                                .from('photo_comments')
                                .select('*, profiles(id, username, avatar_url, role, subroles, ban_status)')
                                .in('parent_id', parentIds)
                                .order('created_at', { ascending: true });
                            if (replies) {
                                replies.forEach(r => {
                                    if (!repliesMap[r.parent_id]) repliesMap[r.parent_id] = [];
                                    repliesMap[r.parent_id].push(r);
                                });
                            }
                        }
                        const html = (parents || []).map(c => app.comments.renderItem(c, repliesMap[c.id] || [])).join('');
                        if (append) listEl.innerHTML += html;
                        else listEl.innerHTML = html || '<p class="text-center text-gray-400 py-10 text-xs italic">Chưa có bình luận nào.</p>';
                    } catch (e) { console.error(e); }
                },
                renderItem: (c, replies = []) => {
                    const isMe = app.user && c.user_id === app.user.id;
                    const canDelete = isMe || app.role === 'admin' || app.role === 'manager';
                    const authorDisplay = app.utils.formatProfileDisplay(c.profiles);
                    const avatar = authorDisplay.avatar;
                    let badges = authorDisplay.isBanned ? '' : app.utils.getBadgesHTML(c.user_id, c.profiles?.role, c.profiles?.subroles);
                    if (app.currentPhoto && c.user_id === app.currentPhoto.uploader_id) {
                        badges += `<span class="badge-shiny" style="background: linear-gradient(135deg, #3b82f6, #1d4ed8);" title="Người đăng"><i class="fa-solid fa-pen mr-1 text-[10px]"></i> Người đăng</span>`;
                    }
                    const toolbar = app.user ? `
                        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px;">
                            <button style="display: flex; align-items: center; gap: 6px; background: white; border: 1px solid #d1d5db; color: #374151; padding: 6px 12px; border-radius: 8px; font-weight: bold; font-size: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);" onclick="app.comments.startReply('${c.id}', '${authorDisplay.username}')" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='white'"><i class="fa-solid fa-reply"></i> Phản hồi</button>
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
                                    <span onclick="app.views.loadUserProfile('${authorDisplay.linkId}')" style="font-size: 14px; font-weight: bold; color: black; cursor: pointer; flex-shrink: 0;">${authorDisplay.username}</span>
                                    <div style="display: flex; gap: 4px; flex-shrink: 0; align-items: center;">
                                        ${badges}
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
                    const authorDisplay = app.utils.formatProfileDisplay(r.profiles);
                    const avatar = authorDisplay.avatar;
                    let badges = authorDisplay.isBanned ? '' : app.utils.getBadgesHTML(r.user_id, r.profiles?.role, r.profiles?.subroles);
                    if (app.currentPhoto && r.user_id === app.currentPhoto.uploader_id) {
                        badges += `<span class="badge-shiny" style="background: linear-gradient(135deg, #3b82f6, #1d4ed8);" title="Người đăng"><i class="fa-solid fa-pen mr-1 text-[10px]"></i> Người đăng</span>`;
                    }
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
                                <span onclick="app.views.loadUserProfile('${authorDisplay.linkId}')" style="font-size: 12px; font-weight: bold; color: black; cursor: pointer; flex-shrink: 0;">${authorDisplay.username}</span>
                                <div style="display: flex; gap: 4px; flex-shrink: 0; align-items: center; transform: scale(0.8); transform-origin: left;">
                                    ${badges}
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
                        const { data: myComments } = await window.sb.from('photo_comments').select('id').eq('user_id', app.user.id);
                        const myCommentIds = myComments ? myComments.map(c => c.id).slice(0, 500) : []; 
                        const p1 = window.sb
                            .from('photo_comments')
                            .select('*, photos!inner(license_plate, url, uploader_id, id), profiles(username, avatar_url, role, subroles)')
                            .eq('photos.uploader_id', app.user.id);
                        let p2 = null;
                        if (myCommentIds.length > 0) {
                            p2 = window.sb
                                .from('photo_comments')
                                .select('*, photos!inner(license_plate, url, uploader_id, id), profiles(username, avatar_url, role, subroles)')
                                .in('parent_id', myCommentIds);
                        }
                        const [res1, res2] = await Promise.all([p1, p2 || Promise.resolve({ data: [] })]);
                        if (res1.error) throw res1.error;
                        if (res2.error) throw res2.error;
                        const combinedData = [...(res1.data || []), ...(res2.data || [])];
                        const uniqueDataMap = new Map();
                        combinedData.forEach(item => {
                            uniqueDataMap.set(item.id, item);
                        });
                        const data = Array.from(uniqueDataMap.values())
                                          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
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
                                        const isReplyToMe = myCommentIds.includes(c.parent_id);
                                        const replyBadge = isReplyToMe ? `<span class="bg-blue-100 text-blue-700 text-[9px] px-1.5 py-0.5 rounded ml-2 font-bold border border-blue-200 whitespace-nowrap"><i class="fa-solid fa-reply"></i> Trả lời bạn</span>` : '';
                                        return `
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
                                    `}).join('')}
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
                        user_id: app.user.id,
                        content: content
                    };
                    if (app.comments.replyingTo) {
                        insertData.parent_id = app.comments.replyingTo;
                    }
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
                        const modifiedFakeHtml = fakeHtml.replace('<div class="flex justify-between items-start gap-3 bg-white border border-gray-200', '<div id="'+fakeId+'" class="flex justify-between items-start gap-3 bg-white border border-gray-200 opacity-70').replace('</div>\n                                            <button', '<span class="text-[10px] text-blue-500 font-bold ml-2 italic">Đang gửi...</span></div>\n                                            <button');
                        if (listEl.innerHTML.includes('Chưa có bình luận')) listEl.innerHTML = '';
                        listEl.insertAdjacentHTML('afterbegin', modifiedFakeHtml);
                        input.value = '';
                    }
                    let { error } = await window.sb.from('photo_comments').insert(insertData);
                    if (error && error.message && error.message.includes('JWT')) {
                        const { data: { session: newSession } } = await window.sb.auth.refreshSession();
                        if (newSession) {
                            const retry = await window.sb.from('photo_comments').insert(insertData);
                            error = retry.error;
                        } else {
                            app.ui.showAlert('Phiên đã hết hạn. Vui lòng tải lại trang và đăng nhập lại.');
                        }
                    }
                    if (error && app.comments.replyingTo) {
                        delete insertData.parent_id;
                        const retry = await window.sb.from('photo_comments').insert(insertData);
                        error = retry.error;
                        if (!error) app.comments.cancelReply();
                    }
                    if (error) {
                        app.ui.showAlert("Lỗi: " + error.message);
                        const fakeEl = document.getElementById(fakeId);
                        if(fakeEl) fakeEl.remove();
                    }
                    else {
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
                        await window.sb.from('photo_comments').delete().or(`id.eq.${id},parent_id.eq.${id}`);
                        if (app.currentViewMode === 'comment-dashboard') app.comments.openDashboard();
                        else if (app.adminTab === 'comments') app.admin.loadTab('comments');
                        else app.comments.load(app.currentPhoto.id);
                    }, () => {
                    }, { title: "Xác nhận xóa", btnOkText: "Xóa", btnCancelText: "Hủy bỏ" });
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
            },

    edit: {
                isEditing: false,
                toggleInlineEdit: () => {
                    if (!app.user) return app.auth.check();
                    const formInputs = document.querySelectorAll('#inline-edit-form .info-input');
                    const actions = document.getElementById('edit-actions');
                    const triggerContainer = document.getElementById('edit-trigger-container');
                    const notice = document.getElementById('edit-mode-notice');
                    const noticeText = document.getElementById('edit-notice-text');
                    const btnSave = document.getElementById('btn-save-inline');
                    app.edit.isEditing = !app.edit.isEditing;
                    if (app.edit.isEditing) {
                        formInputs.forEach(input => {
                            if (input.tagName === 'SELECT') { input.disabled = false; } 
                            else {
                                if (input.id !== 'info-plate' && input.id !== 'info-date') input.readOnly = false;
                                if (input.id === 'info-note') {
                                    const displayDiv = document.getElementById('info-note-display');
                                    if (displayDiv) displayDiv.classList.add('hidden');
                                    input.classList.remove('hidden', 'cursor-not-allowed');
                                    input.classList.add('bg-white', 'focus:ring-2', 'focus:ring-black', 'block');
                                }
                            }
                        });
                        const provBtn = document.getElementById('info-province-btn');
                        const provCaret = document.getElementById('info-province-caret');
                        if (provBtn) {
                            provBtn.disabled = false;
                            provBtn.classList.remove('border-transparent');
                            provBtn.classList.add('border-gray-300');
                        }
                        if (provCaret) provCaret.classList.remove('hidden');
                        actions.classList.remove('hidden');
                        actions.classList.add('flex');
                        if (triggerContainer) triggerContainer.classList.add('hidden');
                        notice.classList.remove('hidden');
                        noticeText.innerText = "Bạn đang ở chế độ chỉnh sửa (Ngày chụp đã được khóa cố định). Thay đổi sẽ được gửi yêu cầu duyệt hoặc cập nhật trực tiếp tùy quyền hạn.";
                        if (app.role === 'admin' || app.role === 'manager') {
                            btnSave.innerText = "Lưu thông tin";
                            document.getElementById('info-plate').readOnly = false;
                        } else {
                            btnSave.innerText = "Lưu thông tin";
                        }
                        app.utils.checkRouteStatus(document.getElementById('info-route').value, 'info-operator', 'info-operator-row');
                    } else {
                        app.edit.cancel();
                    }
                },
                cancel: () => {
                    const formInputs = document.querySelectorAll('#inline-edit-form .info-input');
                    formInputs.forEach(input => {
                        if (input.tagName === 'SELECT') input.disabled = true;
                        else {
                            input.readOnly = true;
                            if (input.id === 'info-note') {
                                const displayDiv = document.getElementById('info-note-display');
                                if (displayDiv) displayDiv.classList.remove('hidden');
                                input.classList.add('hidden', 'cursor-not-allowed');
                                input.classList.remove('bg-white', 'focus:ring-2', 'focus:ring-black', 'block');
                            }
                        }
                    });
                    const provBtn = document.getElementById('info-province-btn');
                    const provCaret = document.getElementById('info-province-caret');
                    const provMenu = document.getElementById('info-province-menu');
                    if (provBtn) {
                        provBtn.disabled = true;
                        provBtn.classList.add('border-transparent');
                        provBtn.classList.remove('border-gray-300');
                    }
                    if (provCaret) provCaret.classList.add('hidden');
                    if (provMenu) provMenu.classList.remove('active');
                    const triggerContainer = document.getElementById('edit-trigger-container');
                    if (triggerContainer) triggerContainer.classList.remove('hidden');
                    document.getElementById('edit-actions').classList.add('hidden');
                    document.getElementById('edit-actions').classList.remove('flex');
                    document.getElementById('edit-mode-notice').classList.add('hidden');
                    app.edit.isEditing = false;
                },
                submitInline: async (e) => {
                    e.preventDefault();
                    if (!app.user) return;
                    const btn = document.getElementById('btn-save-inline');
                    const originalText = btn.innerText;
                    btn.innerText = "Đang xử lý..."; btn.disabled = true;
                    const payload = {
                        license_plate: document.getElementById('info-plate').value.replace(/[^A-Z0-9-]/gi, '').toUpperCase(),
                        operator: document.getElementById('info-operator').value,
                        type: document.getElementById('info-type').value,
                        route: document.getElementById('info-route').value,
                        model: document.getElementById('info-model').value,
                        location: document.getElementById('info-location').value,
                        note: document.getElementById('info-note').value,
                        taken_at: app.currentPhoto.taken_at || null
                    };
                    let missingFields = [];
                    if (!payload.type) missingFields.push("Loại xe");
                    if (!payload.license_plate) missingFields.push("Biển kiểm soát");
                    if (!payload.route) missingFields.push("Mã số tuyến / Lộ trình");
                    if (!payload.operator) missingFields.push("Đơn vị vận hành");
                    if (!payload.model) missingFields.push("Dòng xe (Model)");
                    if (!payload.location) missingFields.push("Vị trí chụp");
                    if (missingFields.length > 0) {
                        let msg = `Vui lòng điền đủ các trường bắt buộc: <b>${missingFields.join(', ')}</b>.`;
                        btn.innerText = originalText; btn.disabled = false;
                        return app.ui.showAlert(msg, null, null, { title: "Thiếu thông tin" });
                    }
                    if (app.role !== 'admin' && app.role !== 'manager') {
                        try { await app.captcha.request(); } catch (err) {
                            if (err.message !== "CAPTCHA_CANCELLED") app.ui.showAlert("Lỗi xác thực Captcha.");
                            btn.innerText = originalText; btn.disabled = false;
                            return;
                        }
                    }
                    try {
                        const takenAtChanged = false; 
                        if (takenAtChanged || payload.license_plate !== app.currentPhoto.license_plate) {
                            const targetDate = payload.taken_at || app.currentPhoto.taken_at;
                            if (targetDate) {
                                const datePart = targetDate.split('T')[0];
                                const { data: existingPhotos, error: checkErr } = await window.sb
                                    .from('photos')
                                    .select('id, taken_at')
                                    .eq('uploader_id', app.currentPhoto.uploader_id)
                                    .eq('license_plate', payload.license_plate)
                                    .neq('id', app.currentPhoto.id)
                                    .neq('status', 'denied');
                                if (!checkErr && existingPhotos && existingPhotos.length > 0) {
                                    const isDuplicateDate = existingPhotos.some(p => p.taken_at && p.taken_at.split('T')[0] === datePart);
                                    if (isDuplicateDate) {
                                        const displayDate = datePart.split('-').reverse().join('/');
                                        app.ui.showAlert(`Lỗi: Tài khoản này đã có ảnh của xe <b>${payload.license_plate}</b> vào ngày <b>${displayDate}</b> rồi. Không thể đổi thành ngày/biển số này để tránh trùng lặp 1 xe/1 ngày.`);
                                        btn.innerText = originalText; btn.disabled = false;
                                        return;
                                    }
                                }
                            }
                        }
                        const beforeSnapshot = {
                            photo_id: app.currentPhoto.id,
                            taken_at: app.currentPhoto.taken_at,
                            license_plate: app.currentPhoto.license_plate,
                            location: app.currentPhoto.location,
                            note: app.currentPhoto.note,
                            operator: app.currentPhoto.operator || app.currentVehicle?.operator,
                            type: app.currentPhoto.type || app.currentVehicle?.type,
                            route_no: app.currentPhoto.route_no || app.currentVehicle?.route_no,
                            model: app.currentPhoto.model || app.currentVehicle?.model
                        };
                        if (app.user.id === app.currentPhoto.uploader_id || app.role === 'admin' || app.role === 'manager') {
                            if (takenAtChanged) {
                                await window.sb.from('photos').update({ taken_at: payload.taken_at }).eq('id', app.currentPhoto.id);
                                app.currentPhoto.taken_at = payload.taken_at;
                            }
                        }
                        if (app.role === 'admin' || app.role === 'manager') {
                            const { error: vError } = await window.sb.from('vehicles').upsert({
                                license_plate: payload.license_plate,
                                model: payload.model
                            }, { onConflict: 'license_plate' });
                            if (vError) throw vError;
                            const { error: pError } = await window.sb.from('photos').update({
                                license_plate: payload.license_plate,
                                location: payload.location,
                                note: payload.note,
                                operator: payload.operator,
                                type: payload.type,
                                route_no: payload.route
                            }).eq('id', app.currentPhoto.id);
                            if (pError) throw pError;
                            const afterSnapshot = {
                                photo_id: app.currentPhoto.id,
                                taken_at: takenAtChanged ? payload.taken_at : beforeSnapshot.taken_at,
                                license_plate: payload.license_plate,
                                location: payload.location,
                                note: payload.note,
                                operator: payload.operator,
                                type: payload.type,
                                route_no: payload.route,
                                model: payload.model
                            };
                            app.admin.logAction(
                                'update_photo_info_direct',
                                app.currentPhoto.id,
                                { taken_at_changed: takenAtChanged, before: beforeSnapshot, after: afterSnapshot }
                            );
                            const isPlateChanged = beforeSnapshot.license_plate !== payload.license_plate;
                            if (isPlateChanged || takenAtChanged || beforeSnapshot.operator !== payload.operator || beforeSnapshot.route_no !== payload.route) {
                                await app.vehicle.syncHistoryOnPhotoEdit(
                                    payload.license_plate,
                                    takenAtChanged ? payload.taken_at : beforeSnapshot.taken_at,
                                    { operator: beforeSnapshot.operator, route_no: beforeSnapshot.route_no },
                                    { operator: payload.operator, route_no: payload.route },
                                    isPlateChanged
                                );
                            }
                            app.toast.show('success', 'Lưu thành công', 'Dữ liệu của ảnh này đã được cập nhật.');
                            if (isPlateChanged) {
                                await app.vehicle.cleanupVehicle(beforeSnapshot.license_plate);
                            }
                            await app.vehicle.cleanupVehicle(payload.license_plate);
                            app.currentPhoto.license_plate = payload.license_plate;
                            app.currentPhoto.location = payload.location;
                            app.currentPhoto.note = payload.note;
                            app.currentPhoto.operator = payload.operator;
                            app.currentPhoto.type = payload.type;
                            app.currentPhoto.route_no = payload.route;
                            if (app.currentVehicle) {
                                app.currentVehicle.model = payload.model;
                            }
                            document.getElementById('detail-title').innerText = `${payload.license_plate} - ${payload.operator}`;
                            document.getElementById('crumb-model').innerText = payload.license_plate;
                            document.getElementById('info-plate').value = payload.license_plate;
                            app.edit.cancel();
                        } else {
                            const { count, error: checkErr } = await window.sb.from('edit_requests')
                                .select('*', { count: 'estimated', head: true })
                                .eq('status', 'pending')
                                .contains('new_data', { photo_id: app.currentPhoto.id });
                            if (checkErr) throw checkErr;
                            if (count > 0) {
                                btn.innerText = originalText; btn.disabled = false;
                                return app.ui.showAlert("Ảnh này đang có một yêu cầu chỉnh sửa hoặc xóa khác chờ duyệt. Vui lòng đợi Admin xử lý xong trước khi gửi yêu cầu mới.");
                            }
                            const reqData = {
                                requester_id: app.user.id,
                                license_plate: payload.license_plate,
                                new_data: {
                                    ...payload,
                                    request_type: 'update_vehicle_info',
                                    photo_id: app.currentPhoto.id
                                },
                                status: 'pending'
                            };
                            const { data, error } = await window.sb.from('edit_requests').insert(reqData).select().single();
                            if (error) throw error;
                            app.ui.showAlert("Yêu cầu chỉnh sửa đã được gửi và đang chờ Admin duyệt. Bạn có thể kiểm tra trạng thái trong trang Hồ sơ của tôi.");
                            app.edit.cancel();
                        }
                    } catch (err) {
                        app.ui.showAlert("Lỗi: " + err.message);
                        console.error(err);
                    } finally {
                        btn.innerText = originalText; btn.disabled = false;
                    }
                }
            }
});
