window.app = window.app || {};

window.app.auth = {
                mode: 'login',
                uuidTimeout: null,
                unverifiedEmail: null,

                showVerificationModal: (email) => {
                    app.auth.unverifiedEmail = email;
                    const modal = document.getElementById('email-verify-modal');
                    const content = document.getElementById('email-verify-content');
                    if(document.getElementById('verify-modal-email')) document.getElementById('verify-modal-email').innerText = email;

                    modal.classList.remove('hidden');
                    setTimeout(() => {
                        content.classList.remove('scale-95', 'opacity-0');
                        content.classList.add('scale-100', 'opacity-100');
                    }, 10);
                },

                resendVerification: async () => {
                    const btn = document.getElementById('btn-resend-verify');
                    const origHTML = btn.innerHTML;
                    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang gửi...';
                    btn.disabled = true;

                    try {
                        const { error } = await window.sb.auth.resend({
                            type: 'signup',
                            email: app.auth.unverifiedEmail,
                            options: { emailRedirectTo: window.location.origin + '/auth' }
                        });

                        if (error) {
                            if (error.status === 429) throw new Error("Bạn đã yêu cầu quá nhiều lần. Vui lòng đợi ít phút rồi thử lại.");
                            throw error;
                        }
                        app.ui.showAlert("Đã gửi lại link xác nhận thành công! Vui lòng kiểm tra email.");
                    } catch (err) {
                        app.ui.showAlert("Lỗi: " + err.message);
                    } finally {
                        btn.innerHTML = origHTML;
                        btn.disabled = false;
                    }
                },

                logoutUnverified: async () => {
                    // Xóa session, đăng xuất và đẩy về Auth sạch sẽ
                    await window.sb.auth.signOut();
                    sessionStorage.removeItem('VNBA_SESS_AUTH');
                    window.location.href = '/auth'; // Reset về trang đăng nhập
                },

                signInWithProvider: async (provider) => {
                    let captchaResponse;
                    try {
                        captchaResponse = await app.captcha.request();
                    } catch (err) {
                        if (err.message === "CAPTCHA_CANCELLED") return;
                        return app.ui.showAlert("Lỗi xác thực Captcha.");
                    }

                    try {
                        const { error } = await window.sb.auth.signInWithOAuth({
                            provider: provider,
                            options: {
                                redirectTo: window.location.origin
                            }
                        });
                        if (error) throw error;
                    } catch (err) {
                        app.ui.showAlert("Lỗi đăng nhập: " + err.message);
                    }
                },

                revealUUID: () => {
                    const uuidInput = document.getElementById('set-uuid-input');
                    const revealBtn = document.getElementById('set-reveal-uuid');

                    if (uuidInput.type === 'password') {
                        uuidInput.type = 'text';
                        uuidInput.classList.remove('tracking-widest');
                        revealBtn.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';

                        if (app.auth.uuidTimeout) clearTimeout(app.auth.uuidTimeout);
                        app.auth.uuidTimeout = setTimeout(() => {
                            uuidInput.type = 'password';
                            uuidInput.classList.add('tracking-widest');
                            revealBtn.innerHTML = '<i class="fa-solid fa-eye"></i>';
                        }, 3000);
                    } else {
                        uuidInput.type = 'password';
                        uuidInput.classList.add('tracking-widest');
                        revealBtn.innerHTML = '<i class="fa-solid fa-eye"></i>';
                        if (app.auth.uuidTimeout) clearTimeout(app.auth.uuidTimeout);
                    }
                },

                submitForm: async (e) => {
                    e.preventDefault();


                    const formData = new FormData(e.target);
                    let captchaResponse;
                    try {
                        captchaResponse = await app.captcha.request();
                    } catch (err) {
                        if (err.message === "CAPTCHA_CANCELLED") return;
                        return app.ui.showAlert("Lỗi xác thực Captcha.");
                    }

                    const email = document.getElementById('auth-email').value.trim();
                    const password = document.getElementById('auth-password').value;
                    const msgEl = document.getElementById('auth-msg');
                    const btn = document.getElementById('auth-submit-btn');

                    const originalHTML = btn.innerHTML;

                    msgEl.innerText = "";
                    btn.disabled = true;
                    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...`;

                    try {
                        if (app.auth.mode === 'login') {
                            const { data, error } = await window.sb.auth.signInWithPassword({ email, password });

                            // BẮT LỖI TỪ SUPABASE NẾU BACKEND CẤM LOGIN KHI CHƯA XÁC MINH
                            if (error) {
                                if (error.message.includes('Email not confirmed') || error.message.includes('not confirmed')) {
                                    app.auth.showVerificationModal(email);
                                    btn.disabled = false;
                                    btn.innerHTML = originalHTML;
                                    return;
                                }
                                throw error;
                            }

                            // BẮT LỖI BẰNG FRONTEND NẾU BACKEND LỠ CHO ĐĂNG NHẬP NHƯNG CHƯA XÁC MINH
                            if (data.user && !data.user.email_confirmed_at) {
                                app.auth.showVerificationModal(data.user.email);
                                btn.disabled = false;
                                btn.innerHTML = originalHTML;
                                return;
                            }

                            // KIỂM TRA BAN TRỰC TIẾP TẠI FRONTEND
                            if (data.user) {
                                const banRes = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'check_ban', payload: { userId: data.user.id } }) });
                                const banJson = await banRes.json();
                                const profile = banJson.success ? banJson.data : null;
                                if (profile && profile.ban_status) {
                                    let banInfo = typeof profile.ban_status === 'string' ? JSON.parse(profile.ban_status) : profile.ban_status;
                                    if (banInfo.banned) {
                                        await window.sb.auth.signOut();
                                        app.ui.showAlert(`<b>ĐĂNG NHẬP THẤT BẠI</b><br>Tài khoản của bạn đã bị cấm với lý do: <b>${banInfo.reason || 'Không rõ'}</b>`);
                                        btn.disabled = false;
                                        btn.innerHTML = originalHTML;
                                        return;
                                    }
                                }
                            }

                            await app.setUser(data.user);
                            app.ui.showAlert("Đăng nhập thành công!", () => { window.location.reload(); });

                        } else if (app.auth.mode === 'register') {
                            const username = document.getElementById('auth-username').value.trim();
                            if (!username) throw new Error("Vui lòng nhập tên hiển thị.");
                            if (username.length < 3 || username.length > 20) throw new Error("Tên hiển thị từ 3 đến 20 ký tự.");

                            const euRes = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'check_username', payload: { username: username } }) });
                            const euJson = await euRes.json();
                            const existingUser = euJson.success ? euJson.data : null;

                            if (existingUser) {
                                throw new Error("Tên hiển thị này đã tồn tại (không phân biệt viết hoa/thường). Vui lòng chọn tên khác!");
                            }

                            const { data, error } = await window.sb.auth.signUp({
                                email,
                                password,
                                options: { data: { username: username } }
                            });

                            if (error) throw error;

                            app.ui.showAlert(
                                `<div class="text-left mt-1">
                                    <p class="text-sm text-gray-700 mb-3">Tạo tài khoản thành công! Vui lòng kiểm tra email <b>${email}</b> để xác thực.</p>
                                    <div class="bg-amber-50 border border-amber-200 rounded-md p-3">
                                        <p class="text-xs text-amber-800 font-medium leading-relaxed">
                                            <i class="fa-solid fa-envelope-circle-check mr-1 text-amber-600 text-sm"></i>
                                            <b>Lưu ý quan trọng:</b> Nếu không thấy thư trong hộp thư chính, vui lòng kiểm tra mục <b>Spam (Thư rác)</b> hoặc <b>Quảng cáo</b>.
                                        </p>
                                    </div>
                                </div>`,
                                () => { app.auth.mode = 'login'; },
                                null,
                                { title: "Xác thực tài khoản", btnOkText: "Đã hiểu" }
                            );

                            if (data.session) await app.setUser(data.user);

                        } else if (app.auth.mode === 'forgot') {
    const { error } = await window.sb.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/auth'
    });
    if (error) throw error;

    app.ui.showAlert(
        `<div class="text-left mt-1">
            <p class="text-sm text-gray-700 mb-3">Link khôi phục mật khẩu đã được gửi đến <b>${email}</b>.</p>
            <div class="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p class="text-xs text-blue-800 font-medium leading-relaxed">
                    <i class="fa-solid fa-circle-exclamation mr-1 text-blue-600 text-sm"></i>
                    <b>Lưu ý:</b> Đừng quên kiểm tra mục <b>Spam (Thư rác)</b> nếu bạn không tìm thấy thư nhé!
                </p>
            </div>
        </div>`,
        () => { app.auth.mode = 'login'; },
        null,
        { title: "Kiểm tra hộp thư", btnOkText: "Trở lại đăng nhập" }
    );

} else if (app.auth.mode === 'recovery') {
    const newPass = document.getElementById('auth-new-password').value;
    if (!newPass || newPass.length < 6) throw new Error("Mật khẩu phải từ 6 ký tự trở lên.");

    const { error } = await window.sb.auth.updateUser({ password: newPass });
    if (error) throw error;

    app.ui.showAlert("Đổi mật khẩu thành công! Bạn đã tự động đăng nhập vào hệ thống.", () => {
        window.location.hash = '';
        app.utils.navigate('/');
    });
}
                    } catch (err) {
                        let errorMsg = err.message;
                        if (errorMsg === 'Invalid login credentials') errorMsg = 'Sai email hoặc mật khẩu.';
                        if (errorMsg === 'User already registered') errorMsg = 'Email này đã được đăng ký.';
                        if (errorMsg.includes('Password should be at least')) errorMsg = 'Mật khẩu phải từ 6 ký tự trở lên.';
                        msgEl.innerText = errorMsg;


                        // Gọi hàm bắt lỗi Turnstile mới
                        if (window.turnstile) {
                            app.utils.resetTurnstile('#auth .cf-turnstile');
                        }
                    } finally {
                        btn.disabled = false;
                        btn.innerHTML = originalHTML;
                    }
                },

                check: () => {

                    app.utils.navigate('/auth');
                },

                close: () => {

                    return;
                },

                logout: async () => {
                    try {
                        await window.sb.auth.signOut(); sessionStorage.removeItem('VNBA_SESS_AUTH');
                        await app.setUser(null);
                        app.ui.toggleUserMenu(false);
                        app.ui.showAlert("Đã đăng xuất thành công!", () => {
                            window.location.reload();
                        });
                    } catch (err) {
                        console.error("Lỗi đăng xuất:", err);
                        app.ui.showAlert("Có lỗi xảy ra khi đăng xuất.");
                    }
                },
                logoutAll: async () => {
                    app.ui.showAlert(
                        "<b>CẢNH BÁO:</b> Bạn sẽ bị đăng xuất khỏi <b>TẤT CẢ</b> thiết bị và trình duyệt hiện tại. Bạn có chắc chắn muốn thực hiện?",
                        async () => {
                            try {
                                // Hiển thị trạng thái đang xử lý trên nút của Popup
                                const okBtn = document.getElementById('custom-alert-ok-btn');
                                if(okBtn) { okBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>'; okBtn.disabled = true; }

                                // 1. Gọi lệnh Global SignOut của Supabase
                                const { error } = await window.sb.auth.signOut({ scope: 'global' });
                                if (error) throw error;

                                // 2. Xóa sạch LocalStorage để đảm bảo không còn Token rác
                                localStorage.clear();

                                // 3. Reset state ứng dụng
                                await app.setUser(null);

                                app.ui.showAlert(
                                    `<div class="text-left">
                                        <p class="text-sm font-bold text-green-600 mb-2"><i class="fa-solid fa-check-circle mr-1"></i> Lệnh đăng xuất đã được gửi!</p>
                                        <p class="text-xs text-gray-700">Hệ thống đang tiến hành hủy các phiên làm việc cũ.</p>
                                        <p class="text-[10px] text-amber-600 font-bold mt-2 italic"><i class="fa-solid fa-clock mr-1"></i> Lưu ý: Có thể mất từ 1-5 phút để tất cả các thiết bị khác bị thoát hoàn toàn.</p>
                                    </div>`,
                                    () => { window.location.reload(); }
                                );
                            } catch (err) {
                                console.error("Logout All Error:", err);
                                app.ui.showAlert("Lỗi hệ thống: " + err.message);
                            }
                        },
                        () => {},
                        { btnOkText: "Xác nhận Đăng xuất tất cả", btnCancelText: "Hủy bỏ", title: "Bảo mật tài khoản", countdown: true }
                    );
                },
changePassword: async () => {
                    const oldPass = document.getElementById('set-cp-old').value;
                    const newPass = document.getElementById('set-cp-new').value;

                    if (!oldPass) return app.ui.showAlert("Vui lòng nhập mật khẩu hiện tại.");
                    if (!newPass || newPass.length < 6) return app.ui.showAlert("Mật khẩu mới phải ít nhất 6 ký tự.");

                    try { await app.captcha.request(); } catch (err) { if (err.message !== "CAPTCHA_CANCELLED") app.ui.showAlert("Lỗi xác thực Captcha."); return; }

                    const { error } = await window.sb.auth.updateUser({
                        password: newPass,
                        current_password: oldPass
                    });

                    if (error) {
                        let msg = error.message;
                        if (msg.includes('Current password is invalid')) msg = "Mật khẩu hiện tại không đúng.";
                        if (msg.includes('should be different')) msg = "Mật khẩu mới phải khác mật khẩu hiện tại.";
                        app.ui.showAlert("Lỗi: " + msg);
                    } else {
                        app.toast.show('success', 'Thành công', 'Đã đổi mật khẩu thành công!');
                        document.getElementById('set-cp-old').value = '';
                        document.getElementById('set-cp-new').value = '';
                    }
                },
                changeEmail: async (btn) => {
                    if (!app.user) return;

                    const newEmail = document.getElementById('set-ce-new').value.trim();
                    const password = document.getElementById('set-ce-password').value;

                    if (!newEmail) return app.ui.showAlert("Vui lòng nhập địa chỉ email mới.");
                    if (!password) return app.ui.showAlert("Vui lòng nhập mật khẩu hiện tại để xác nhận.");
                    if (newEmail === app.user.email) return app.ui.showAlert("Email mới không được trùng với email hiện tại.");

                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(newEmail)) return app.ui.showAlert("Định dạng email không hợp lệ.");

                    try { await app.captcha.request(); } catch (err) { if (err.message !== "CAPTCHA_CANCELLED") app.ui.showAlert("Lỗi xác thực Captcha."); return; }

                    const originalText = btn.innerHTML;
                    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...';
                    btn.disabled = true;

                    try {

                        const currentEmail = app.user.email;
                        const { error: signInError } = await window.sb.auth.signInWithPassword({ email: currentEmail, password: password });

                        if (signInError) {
                            throw new Error("Mật khẩu hiện tại không đúng.");
                        }


                        const { error: updateError } = await window.sb.auth.updateUser({ email: newEmail });

                        if (updateError) {
                            throw updateError;
                        }

                        app.ui.showAlert(
                            `<div class="text-left mt-1">
                                <p class="text-sm text-gray-700 mb-3">Vui lòng kiểm tra hộp thư của <b>${newEmail}</b> và bấm vào link xác nhận.</p>
                                <div class="bg-amber-50 border border-amber-200 rounded-md p-3">
                                    <p class="text-xs text-amber-800 font-medium leading-relaxed">
                                        <i class="fa-solid fa-envelope-open-text mr-1 text-amber-600 text-sm"></i>
                                        <b>Nhắc nhở:</b> Rất có thể thư bị lọt vào danh mục <b>Spam (Thư rác)</b>, vui lòng kiểm tra kỹ nhé!
                                    </p>
                                </div>
                            </div>`,
                            () => {
                                document.getElementById('set-ce-new').value = '';
                                document.getElementById('set-ce-password').value = '';
                            },
                            null,
                            { title: "Yêu cầu đổi Email thành công", btnOkText: "Đã hiểu" }
                        );

                    } catch (err) {
                        let msg = err.message;
                        if (msg.includes('already registered')) msg = "Email này đã được sử dụng bởi một tài khoản khác.";
                        if (msg.includes('rate limit')) msg = "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.";
                        app.ui.showAlert("Lỗi: " + msg);
                    } finally {
                        btn.innerHTML = originalText;
                        btn.disabled = false;
                    }
                },
                updateAvatar: () => {
                    if (!app.user) return;

                    const fileInput = document.createElement('input');
                    fileInput.type = 'file';
                    fileInput.accept = 'image/jpeg, image/png, image/webp';

                    fileInput.onchange = async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;


                        app.crop.open('avatar', file);
                    };

                    fileInput.click();
                },
                uploadAvatarBlob: async (blob) => {
                    const updateAvatarBtn = document.getElementById('set-update-avatar-btn');
                    const btnOriginalText = updateAvatarBtn ? updateAvatarBtn.innerHTML : '';
                    if (updateAvatarBtn) {
                        updateAvatarBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang upload...';
                        updateAvatarBtn.disabled = true;
                        updateAvatarBtn.classList.add('opacity-50', 'cursor-not-allowed');
                    }

                    let captchaResponse;
                    try { captchaResponse = await app.captcha.request(); } catch (err) {
                        if (err.message !== "CAPTCHA_CANCELLED") app.ui.showAlert("Lỗi xác thực Captcha.");
                        if (updateAvatarBtn) { updateAvatarBtn.innerHTML = btnOriginalText || '<i class="fa-solid fa-upload mr-1"></i> Tải ảnh lên từ máy'; updateAvatarBtn.disabled = false; updateAvatarBtn.classList.remove('opacity-50', 'cursor-not-allowed'); }
                        return;
                    }
                    try {
                        const avatarData = new FormData();
                        avatarData.append('file', blob);
                        avatarData.append('userId', app.user.id);
                        avatarData.append('isAvatar', 'true');
                        avatarData.append('captchaToken', captchaResponse);
                        avatarData.append('fileExtension', app.utils.getTargetExtension());

                        const { data: { session } } = await window.sb.auth.getSession();
                        const token = session?.access_token;

                        const res = await fetch('/api/upload', {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`
                            },
                            body: avatarData
                        });

                        const data = await res.json();

                        if (data.success) {
                            if (data.url) {
                                try {
                                    await app.utils.verifyImageLoaded(data.url, 3);
                                } catch (verifyErr) {
                                    console.warn('Backend đã lưu thành công, nhưng CDN đang chậm:', verifyErr);
                                }
                            }

                            app.user.user_metadata = app.user.user_metadata || {};
                            app.user.user_metadata.avatar_url = data.url;

                            const proxiedUrl = app.utils.getProxiedUrl(data.url, 'avatar.jpg', 'avatar');
                            const avatarImg = document.getElementById('acc-avatar-img');
                            const avatarIcon = document.getElementById('acc-avatar-icon');
                            if (avatarImg && avatarIcon) {
                                avatarImg.src = proxiedUrl;
                                avatarImg.classList.remove('hidden');
                                avatarIcon.classList.add('hidden');
                            }

                            const setAvatarImg = document.getElementById('set-avatar-img');
                            if(setAvatarImg) setAvatarImg.src = proxiedUrl;

                            app.toast.show('success', 'Thành công', 'Cập nhật ảnh đại diện thành công!');
                        } else {
                            throw new Error(data.error || 'Lỗi upload');
                        }
                    } catch (error) {
                        console.error('Avatar update error:', error);
                        app.ui.showAlert('Cập nhật thất bại: ' + error.message);
                    } finally {
                        if (updateAvatarBtn) {
                            updateAvatarBtn.innerHTML = btnOriginalText || '<i class="fa-solid fa-upload mr-1"></i> Tải ảnh lên từ máy';
                            updateAvatarBtn.disabled = false;
                            updateAvatarBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                        }
                    }
                },

                resetAvatar: async () => {
                    if (!app.user) return;
                    try {
                        const { data: { session } } = await window.sb.auth.getSession();
                        const res = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'reset_avatar', token: session?.access_token }) });
                        const resJson = await res.json();
                        let error = resJson.success ? null : new Error(resJson.error);
                        if (error) throw error;

                        app.ui.showAlert("Đã reset Avatar về mặc định!");
                        app.views.loadAccount();
                    } catch (err) {
                        app.ui.showAlert("Lỗi: " + err.message);
                    }
                },

                changeUsername: async () => {
                    if (!app.user) return;
                    const newName = document.getElementById('set-new-username').value.trim();

                    if (!newName) return app.ui.showAlert("Vui lòng nhập Tên hiển thị mới.");
                    if (newName.length < 3) return app.ui.showAlert("Tên hiển thị phải dài từ 3 ký tự trở lên.");
                    if (newName.length > 20) return app.ui.showAlert("Tên hiển thị quá dài (Tối đa 20 ký tự).");

                    const euRes = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'check_username', payload: { username: newName, excludeUserId: app.user.id } }) });
                    const euJson = await euRes.json();
                    const existingUser = euJson.success ? euJson.data : null;

                    if (existingUser) {
                        return app.ui.showAlert("Tên hiển thị này đã có người sử dụng (không phân biệt viết hoa/thường). Vui lòng chọn tên khác!");
                    }

                    app.ui.showAlert(
                        "Cảnh báo: Đổi tên hiển thị sẽ không làm thay đổi dấu bản quyền trên các ảnh đã duyệt trước đó. Bạn có chắc chắn muốn tiếp tục?",
                        async () => {

                            try {

                                try { await app.captcha.request(); } catch (err) { if (err.message !== "CAPTCHA_CANCELLED") app.ui.showAlert("Lỗi xác thực Captcha."); return; }
                                const { data: { session } } = await window.sb.auth.getSession();
                                const res = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update_username', payload: { newName }, token: session?.access_token }) });
                                const resJson = await res.json();
                                let dbError = resJson.success ? null : { code: resJson.code || 'UNKNOWN', message: resJson.error };
                                if (dbError) {
                                    if (dbError.code === '23505') throw new Error("Tên này đã có người sử dụng!");
                                    throw dbError;
                                }

                                app.username = newName; // Cập nhật biến cục bộ sau khi đổi tên thành công
                                app.toast.show('success', 'Thành công', 'Đổi Tên hiển thị thành công!');
                                document.getElementById('set-new-username').value = '';
                                document.getElementById('nav-username').innerText = newName;
                                app.views.loadAccount();
                            } catch (err) {
                                app.ui.showAlert("Lỗi: " + err.message);
                            }
                        },
                        () => {

                            console.log("Đã hủy đổi tên hiển thị");
                        },
                        {
                            btnOkText: "Vẫn đổi",
                            btnCancelText: "Hủy",
                            title: "Cảnh báo"
                        }
                    );
                },

                showUUID: () => {
                    if (!app.user) return;

                    const uuidForm = document.getElementById('show-uuid-form');

                    if (!uuidForm.classList.contains('hidden')) {
                        uuidForm.classList.add('hidden');
                        return;
                    }

                    app.ui.showAlert(
                        "CẢNH BÁO BẢO MẬT: Mã định danh (UUID) dùng để Admin tra cứu tài khoản của bạn.<br><br><b class='text-red-600'>Vui lòng CHỈ chia sẻ UUID trên các kênh hỗ trợ chính thức được công nhận của VNBUSARCHIVE. Tuyệt đối không gửi cho người lạ!</b>",
                        () => {
                            uuidForm.classList.remove('hidden');
                            document.getElementById('user-uuid-input').value = app.user.id;
                        },
                        () => {
                            uuidForm.classList.add('hidden');
                        },
                        {
                            countdown: true,
                            btnOkText: "Tôi đã hiểu",
                            btnCancelText: "Hủy",
                            title: "Xác nhận hiển thị UUID"
                        }
                    );
                },

                copyUUID: () => {
                    const uuidInput = document.getElementById('set-uuid-input');
                    const copyBtn = document.getElementById('set-copy-uuid');

                    if (!uuidInput.value) return;

                    navigator.clipboard.writeText(uuidInput.value).then(() => {
                        const originalHTML = copyBtn.innerHTML;
                        copyBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
                        copyBtn.classList.replace('bg-red-600', 'bg-green-600');
                        copyBtn.classList.replace('hover:bg-red-700', 'hover:bg-green-700');

                        setTimeout(() => {
                            copyBtn.innerHTML = originalHTML;
                            copyBtn.classList.replace('bg-green-600', 'bg-red-600');
                            copyBtn.classList.replace('hover:bg-green-700', 'hover:bg-red-700');
                        }, 2000);
                    }).catch(() => {
                        app.ui.showAlert("Trình duyệt không hỗ trợ sao chép tự động. Vui lòng sao chép thủ công.");
                        uuidInput.select();
                    });
                }
            },


window.app.setUser = async (user) => {
                app.user = user;
                const dropdown = document.getElementById('user-dropdown');

                if (user) {
                    // Lấy tên từ metadata (Hỗ trợ Google, Discord, Email)
                    let metaName = user.user_metadata?.username ||
                                   user.user_metadata?.full_name ||
                                   user.user_metadata?.name ||
                                   user.user_metadata?.custom_claims?.global_name ||
                                   (user.email ? user.email.split('@')[0] : 'User');

                    let finalName = metaName.substring(0, 20);
                    let finalAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

                    try {
                        const { data: { session } } = await window.sb.auth.getSession();
                        const profRes = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'get_profile', payload: { userId: user.id }, token: session?.access_token }) });
                        const profJson = await profRes.json();
                        const profile = profJson.success ? profJson.data : null;

                        // Đọc trạng thái lưu tạm ở trình duyệt (để dự phòng)
                        let localPref = localStorage.getItem('vnbus_preference') || 'both';
                        let localShowRec = localStorage.getItem('vnbus_show_rec');
                        localShowRec = localShowRec !== null ? localShowRec === 'true' : true;

                        if (!profile || !profile.username) {
                            // Tạo mới user và đẩy thiết lập trình duyệt hiện tại lên Database
                            const { data: { session: upSession } } = await window.sb.auth.getSession();
                            await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'upsert_profile', payload: { id: user.id, username: finalName, avatar_url: finalAvatar, preferences: { type: localPref, showRec: localShowRec } }, token: upSession?.access_token }) });

                            app.username = finalName;
                            app.role = 'user';
                            app.preference.current = localPref;
                            app.preference.showRecommendations = localShowRec;
                        } else {
                            app.username = profile.username;
                            app.role = profile.role || 'user';
                            // Cấp quyền bypass cho Manager trong phiên này
                            if (app.role === 'manager') {
                                sessionStorage.setItem('VNBA_SESS_AUTH', 'active');
                            } else {
                                sessionStorage.removeItem('VNBA_SESS_AUTH');
                            }

                            let dbPrefs = profile.preferences;
                            if (dbPrefs && Object.keys(dbPrefs).length > 0) {
                                // Nếu DB CÓ DỮ LIỆU -> Lấy DB đè lên LocalStorage (Ưu tiên DB)
                                app.preference.current = dbPrefs.type || 'both';
                                app.preference.showRecommendations = dbPrefs.showRec !== false;

                                localStorage.setItem('vnbus_preference', app.preference.current);
                                localStorage.setItem('vnbus_show_rec', app.preference.showRecommendations);
                            } else {
                                // Nếu DB TRỐNG (User cũ chưa lưu bao giờ) -> Lấy LocalStorage đẩy lên DB
                                window.sb.auth.getSession().then(({ data: { session } }) => {
                                    fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update_preferences', payload: { preferences: { type: localPref, showRec: localShowRec } }, token: session?.access_token }) });
                                });

                                app.preference.current = localPref;
                                app.preference.showRecommendations = localShowRec;
                            }
                        }
                    } catch (e) {
                        app.username = finalName;
                        app.role = 'user';
                    }

                    // Render tên lên UI Header
                    document.getElementById('nav-username').innerText = app.username;

dropdown.innerHTML = `
                         <a href="/profile" class="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100 font-bold"><i class="fa-solid fa-address-card w-5 text-center mr-1"></i> Hồ sơ của tôi</a>
                         <button onclick="app.settings.open()" class="w-full text-left block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100 font-bold"><i class="fa-solid fa-gear w-5 text-center mr-1"></i> Cài đặt</button>
                         <a href="/help" class="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100 font-bold"><i class="fa-solid fa-book-open w-5 text-center mr-1"></i> Trung tâm hỗ trợ</a>
                         <a href="/contact" class="w-full text-left block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100 font-bold"><i class="fa-solid fa-headset w-5 text-center mr-1"></i> Liên hệ hỗ trợ</a>
                         <button onclick="app.auth.logout()" class="w-full text-left block px-4 py-3 text-sm text-red-600 hover:bg-red-50 font-bold"><i class="fa-solid fa-right-from-bracket w-5 text-center mr-1"></i> Đăng xuất</button>
                     `;

                    app.auth.close();

                    if (app.role === 'admin' || app.role === 'manager') {
                        document.getElementById('nav-admin').classList.remove('hidden');
                        app.admin.checkNotification();

                        // [THÊM MỚI] Hiển thị tab Quản lý nếu là Manager
                        if (app.role === 'manager') {
                            document.getElementById('adm-tab-manager').classList.remove('hidden');
                        }
                    } else {
                        document.getElementById('nav-admin').classList.add('hidden');
                    }

                    // Đã tắt tự động nhảy sang Telegram




                } else {
                    document.getElementById('nav-username').innerText = 'Tài khoản';
                    document.getElementById('nav-admin').classList.add('hidden');
                    app.username = 'Guest';
                    app.role = 'user';


dropdown.innerHTML = `
                         <a href="/auth" class="w-full text-left block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100 font-bold"><i class="fa-solid fa-arrow-right-to-bracket w-5 text-center mr-1"></i> Đăng nhập</a>
                         <a href="/auth" class="w-full text-left block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100 font-bold"><i class="fa-solid fa-user-plus w-5 text-center mr-1"></i> Tạo tài khoản</a>
                         <button onclick="app.settings.open()" class="w-full text-left block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100 font-bold"><i class="fa-solid fa-gear w-5 text-center mr-1"></i> Cài đặt</button>
                         <a href="/help" class="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100 font-bold"><i class="fa-solid fa-book-open w-5 text-center mr-1"></i> Trung tâm hỗ trợ</a>
                         <a href="/contact" class="w-full text-left block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 font-bold"><i class="fa-solid fa-headset w-5 text-center mr-1"></i> Liên hệ hỗ trợ</a>
                     `;



                    // Đã tắt tự động nhảy sang Telegram

                }
            },


window.app.settings = {

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
                        { text: "Huy hiệu Discord", tab: "badges", parent: "main", icon: "fa-discord" },
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

                    // app.settings.switchTab('profile');
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
                        // Tắt tự động nhảy tab để nội dung bên phải độc lập với menu
            // app.settings.switchTab(app.user ? 'badges' : 'preference');
                    }
                },

                open: async () => {
                    const modal = document.getElementById('settings-modal');
                    const content = document.getElementById('settings-content');

                    app.ui.toggleUserMenu(false);

                    // Reset menu trượt về menu chính
                    app.settings.closeDocsMenu(true);
                    app.settings.closeAccountMenu(true);

                    if (app.user) {
                        document.querySelectorAll('.account-only-btn').forEach(el => el.style.display = '');

                        const uuidInput = document.getElementById('set-uuid-input');
                        if(uuidInput) {
                            uuidInput.value = app.user.id;
                            uuidInput.type = 'password';
                            uuidInput.classList.add('tracking-widest');
                        }
                        const revealBtn = document.getElementById('set-reveal-uuid');
                        if(revealBtn) revealBtn.innerHTML = '<i class="fa-solid fa-eye"></i>';
                        if (app.auth.uuidTimeout) clearTimeout(app.auth.uuidTimeout);

                        if (app.user.email) {
                            const currentEmailEl = document.getElementById('set-current-email');
                            if (currentEmailEl) currentEmailEl.innerText = app.user.email;
                        }

                        app.settings.switchTab('blank');
                        app.settings.loadIdentities();

                        const avatarImg = document.getElementById('set-avatar-img');
                        try {
                            const profRes = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'get_avatar_url', payload: { userId: app.user.id } }) });
                            const profJson = await profRes.json();
                            const profile = profJson.success ? profJson.data : null;
                            if (profile && profile.avatar_url) {
                                const safeUrl = profile.avatar_url.replace(/"/g, '');
                                avatarImg.src = app.utils.getProxiedUrl(safeUrl, 'avatar.jpg', 'avatar');
                            } else {
                                avatarImg.src = DEFAULT_AVATAR;
                            }
                        } catch (e) {
                            avatarImg.src = app.user.user_metadata?.avatar_url ? app.utils.getProxiedUrl(app.user.user_metadata.avatar_url, 'avatar.jpg', 'avatar') : DEFAULT_AVATAR;
                        }
                        avatarImg.onerror = () => { avatarImg.src = DEFAULT_AVATAR; };
                    } else {
                        // Khách ẩn phần Tài khoản, mở thẳng Cá nhân hóa
                        document.querySelectorAll('.account-only-btn').forEach(el => el.style.display = 'none');
                        app.settings.switchTab('blank');
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

                    // app.settings.switchTab('docs-intro');
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
                        // Tắt tự động nhảy tab để nội dung bên phải độc lập với menu
            // app.settings.switchTab(app.user ? 'badges' : 'preference');
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

                            // Nếu là tab tài liệu thì tải nội dung
                            if (t.startsWith('docs-')) {
                                app.docs.fetchContent(t);
                            } else if (t === 'X') {

                            } else if (t === 'preference') {
                                app.preference.tempSelection = app.preference.current || 'both';
                                app.preference.tempShowRec = app.preference.showRecommendations; // FIX: Đồng bộ đúng trạng thái
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
                    if (tab === 'badges') app.settings.loadBadges();
                },
                loadDiscordVerifyStatus: async () => {
                    const actionBtn = document.getElementById('discord-verify-action');
                    if (!actionBtn) return;
                    actionBtn.innerHTML = `<button disabled class="px-4 py-2 bg-gray-200 text-gray-400 text-xs font-bold rounded cursor-not-allowed border border-gray-300 whitespace-nowrap"><i class="fa-solid fa-spinner fa-spin"></i></button>`;
                    try {
                        const { data: { session } } = await window.sb.auth.getSession();
                        if (!session) return;
                        
                        const cRes = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'get_approved_photos_count', payload: { userId: app.user.id }, token: session?.access_token }) });
                        const cJson = await cRes.json();
                        const count = cJson.success ? cJson.count : 0;
                        
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
                            renderProvider('Discord', 'fa-brands fa-discord', 'bg-[#5865F2]', 'discord');

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
                        `Bạn có chắc chắn muốn hủy liên kết tài khoản ${providerName}? Bạn sẽ không thể đăng nhập bằng nền tảng này nữa.`,
                        async () => {
                            try {
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

                        const { data: { session: countSession } } = await window.sb.auth.getSession();
                        const cRes = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'get_approved_photos_count', payload: { userId: app.user.id }, token: countSession?.access_token }) });
                        const cJson = await cRes.json();
                        const count = cJson.success ? cJson.count : 0;

                        document.getElementById('badge-photo-count').innerText = count || 0;

const ROLE_MAP_FRONTEND = {
    50: '1506239795175620728',
    100: '1505158627747561482',
    200: '1505158752372920320',
    500: '1505158986725462078',
    1000: '1505159111686488164'
};

const tiers = [50, 100, 200, 500, 1000, 1500];
const grid = document.getElementById('badges-grid');

grid.innerHTML = tiers.map(tier => {
    if (tier === 1500) {
        const hasCustomRole = !!data.customRoleId;
        const isEligible = (count || 0) >= 1500;
        let btnHtml = '';

        if (hasCustomRole) {
            btnHtml = `<button onclick="app.settings.openCustomRolePrompt()" class="px-4 py-2 bg-gray-100 text-gray-800 text-xs font-bold rounded border border-gray-300 hover:bg-gray-200 transition whitespace-nowrap"><i class="fa-solid fa-pen mr-1"></i> Sửa Role</button>`;
        } else if (isEligible) {
            btnHtml = `<button onclick="app.settings.openCustomRolePrompt()" class="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded hover:opacity-90 transition shadow-sm border border-transparent whitespace-nowrap">Tạo Role Riêng</button>`;
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
                    <p class="font-bold text-sm text-purple-900 truncate">Cột mốc 1500 ảnh (Tùy chỉnh)</p>
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
            <div class="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-lg text-[#5865F2] shrink-0">
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

                openCustomRolePrompt: () => {
                    const modal = document.getElementById('custom-role-modal');
                    const content = document.getElementById('custom-role-content');
                    const okBtn = document.getElementById('cr-ok-btn');

                    app.ui.lockScroll();

                    okBtn.onclick = async () => {
                        const name = document.getElementById('cr-name-input').value.trim();
                        const color = document.getElementById('cr-color-input').value.trim();

                        if (!name || name.length < 2) return app.ui.showAlert("Tên Role phải từ 2 ký tự trở lên!");
                        if (!color.match(/^#[0-9A-Fa-f]{6}$/)) return app.ui.showAlert("Mã màu Hex không hợp lệ!");

                        const originalText = okBtn.innerHTML;
                        okBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                        okBtn.disabled = true;

                        try {
                            const { data: { session } } = await window.sb.auth.getSession();
                            const token = session?.access_token;

                            const res = await fetch('/api/discord', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                body: JSON.stringify({ action: 'claim', tier: 1500, customName: name, customColor: color })
                            });

                            const data = await res.json();
                            if (!res.ok) throw new Error(data.error || 'Lỗi không xác định');

                            app.ui.closeCustomRolePrompt();
                            app.toast.show('success', 'Thành công', data.message || "Tạo/Sửa Role thành công!");
                            app.settings.loadBadges();
                        } catch (err) {
                            app.ui.showAlert("Lỗi: " + err.message);
                        } finally {
                            okBtn.innerHTML = originalText;
                            okBtn.disabled = false;
                        }
                    };

                    modal.classList.remove('hidden');
                    content.classList.remove('modal-content-leave');
                    content.classList.add('modal-content-enter');
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
                                    <i class="fa-brands fa-github text-sm"></i> Xem trực tiếp trên GitHub
                                </a>
                            </div>
                        `;
                    }
                }
            },


window.app.profileIntro = {
                previewedPhoto: null,

                openBioEditor: () => {
                    // (Hàm này giữ nguyên như cũ của bạn)
                    const modal = document.getElementById('bio-edit-modal');
                    const content = document.getElementById('bio-edit-content');
                    const textarea = document.getElementById('bio-input-textarea');

                    const currentBio = document.getElementById('profile-bio-content').innerText;
                    textarea.value = currentBio === 'Chưa có thông tin giới thiệu.' ? '' : currentBio;
                    textarea.removeEventListener('input', app.profileIntro.updateCharCount);
                    textarea.addEventListener('input', app.profileIntro.updateCharCount);
                    app.profileIntro.updateCharCount();

                    modal.classList.remove('hidden');
                    app.ui.lockScroll();
                    setTimeout(() => {
                        content.classList.remove('opacity-0', 'scale-95');
                        content.classList.add('opacity-100', 'scale-100');
                        textarea.focus();
                    }, 10);
                },

                closeBioEditor: () => {
                    // (Hàm này giữ nguyên)
                    const modal = document.getElementById('bio-edit-modal');
                    const content = document.getElementById('bio-edit-content');
                    content.classList.remove('opacity-100', 'scale-100');
                    content.classList.add('opacity-0', 'scale-95');
                    setTimeout(() => {
                        modal.classList.add('hidden');
                        app.ui.unlockScroll();
                    }, 200);
                },

                updateCharCount: () => {
                    // (Hàm này giữ nguyên)
                    const textarea = document.getElementById('bio-input-textarea');
                    const counter = document.getElementById('bio-char-count');
                    const len = textarea.value.length;
                    counter.innerText = `${len}/800`;
                    if (len > 800) counter.classList.add('text-red-500');
                    else counter.classList.remove('text-red-500');
                },

                saveBio: async () => {
                    // (Hàm này giữ nguyên)
                    const btn = document.getElementById('btn-save-bio');
                    const text = document.getElementById('bio-input-textarea').value.trim();

                    if (text.length > 800) return app.ui.showAlert("Tiểu sử không được vượt quá 800 ký tự.");
                    const hasLink = /https?:\/\/|www\.|\.com|\.vn|\.io|\.net|\.org/i.test(text);
                    if (hasLink) return app.ui.showAlert("Không được phép chèn đường dẫn (link) vào tiểu sử.");

                    try {
                        await app.captcha.request();
                    } catch (err) {
                        if (err.message !== "CAPTCHA_CANCELLED") app.ui.showAlert("Lỗi xác thực Captcha.");
                        return;
                    }

                    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';
                    btn.disabled = true;

                    try {
                        const { data: { session } } = await window.sb.auth.getSession();
                        const bRes = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update_bio', payload: { bio: text || null }, token: session?.access_token }) });
                        const bJson = await bRes.json();
                        let error = bJson.success ? null : new Error(bJson.error);
                        if (error) throw error;

                        app.profileIntro.closeBioEditor();
                        app.toast.show('success', 'Thành công', 'Đã cập nhật tiểu sử thành công!');

                        const bioContent = document.getElementById('profile-bio-content');
                        if (text) bioContent.innerHTML = app.utils.cleanText(text);
                        else bioContent.innerHTML = '<span class="text-gray-400 italic">Chưa có thông tin giới thiệu.</span>';

                    } catch (e) {
                        app.ui.showAlert("Lỗi lưu tiểu sử: " + e.message);
                    } finally {
                        btn.innerHTML = 'Lưu tiểu sử';
                        btn.disabled = false;
                    }
                },

                // ============================================
                // CÁC HÀM MỚI DÀNH CHO XÁC NHẬN ẢNH BẰNG LINK
                // ============================================
                
                openPhotoSelector: async () => {
                    const modal = document.getElementById('fav-photo-modal');
                    const content = document.getElementById('fav-photo-content');

                    // Reset giao diện về trạng thái rỗng
                    document.getElementById('fav-photo-url-input').value = '';
                    document.getElementById('fav-photo-preview-area').classList.add('hidden');
                    document.getElementById('fav-photo-error').classList.add('hidden');
                    
                    const btnSave = document.getElementById('btn-save-fav-photo');
                    btnSave.disabled = true;
                    btnSave.classList.add('opacity-50', 'cursor-not-allowed');
                    app.profileIntro.previewedPhoto = null;

                    modal.classList.remove('hidden');
                    app.ui.lockScroll();
                    setTimeout(() => {
                        content.classList.remove('opacity-0', 'scale-95');
                        content.classList.add('opacity-100', 'scale-100');
                    }, 10);
                },

                closePhotoSelector: () => {
                    const modal = document.getElementById('fav-photo-modal');
                    const content = document.getElementById('fav-photo-content');
                    content.classList.remove('opacity-100', 'scale-100');
                    content.classList.add('opacity-0', 'scale-95');
                    setTimeout(() => {
                        modal.classList.add('hidden');
                        app.ui.unlockScroll();
                    }, 200);
                },

                previewFavPhotoFromUrl: async (url) => {
                    const previewArea = document.getElementById('fav-photo-preview-area');
                    const errorBox = document.getElementById('fav-photo-error');
                    const errorText = document.getElementById('fav-photo-error-text');
                    const btnSave = document.getElementById('btn-save-fav-photo');
                    const imgEl = document.getElementById('fav-photo-preview-img');
                    const plateEl = document.getElementById('fav-photo-preview-plate');
                    const opEl = document.getElementById('fav-photo-preview-op');

                    // Câu báo lỗi chung
                    const genericErrorMsg = "Ảnh không hợp lệ. Chỉ chấp nhận ảnh VNBUSARCHIVE và là của bạn.";

                    // Reset mọi trạng thái
                    btnSave.disabled = true;
                    btnSave.classList.add('opacity-50', 'cursor-not-allowed');
                    errorBox.classList.add('hidden');
                    previewArea.classList.add('hidden');
                    app.profileIntro.previewedPhoto = null;

                    const val = url.trim();
                    if (!val) return;

                    // Kiểm tra URL có đúng định dạng không
                    const match = val.match(/\/photo\/(\d+)/i);
                    if (!match) {
                        errorText.innerText = genericErrorMsg;
                        errorBox.classList.remove('hidden');
                        return; // Dừng, không hiện preview
                    }

                    const photoId = match[1];
                    
                    // Trong lúc chờ API, hiện tạm khung preview dạng đang tải
                    previewArea.classList.remove('hidden');
                    imgEl.src = 'https://placehold.co/400x300/f3f4f6/a1a1aa?text=Dang+tai...';
                    plateEl.innerText = 'Đang kiểm tra dữ liệu...';
                    opEl.innerText = '';

                    try {
                        const pRes = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'get_photo_details', payload: { photoId } }) });
                        const pJson = await pRes.json();
                        const data = pJson.success ? pJson.data : null;
                        const error = pJson.success ? null : new Error(pJson.error);

                        // Các điều kiện từ chối
                        if (error || !data) throw new Error();
                        if (data.status !== 'approved') throw new Error();
                        if (data.uploader_id !== app.user.id) throw new Error();

                        // Nếu qua hết các bài test -> Render ảnh thật
                        app.profileIntro.previewedPhoto = data;
                        imgEl.src = app.utils.getProxiedUrl(data.url, 'preview.jpg', 'thumb');
                        plateEl.innerText = app.utils.displayPlate(data.license_plate);
                        opEl.innerText = data.operator || 'Không rõ đơn vị';

                        btnSave.disabled = false;
                        btnSave.classList.remove('opacity-50', 'cursor-not-allowed');

                    } catch (e) {
                        // Nếu ảnh bị lỗi (không tồn tại, chưa duyệt, của người khác) 
                        // -> ẨN KHUNG PREVIEW ĐI, CHỈ SHOW Ô BÁO LỖI
                        previewArea.classList.add('hidden');
                        errorText.innerText = genericErrorMsg;
                        errorBox.classList.remove('hidden');
                    }
                },

                confirmSaveFavPhoto: async () => {
                    if (!app.profileIntro.previewedPhoto) return;
                    
                    // ===================================
                    // GỌI CAPTCHA TRƯỚC KHI XỬ LÝ LƯU ẢNH
                    // ===================================
                    try {
                        await app.captcha.request();
                    } catch (err) {
                        if (err.message !== "CAPTCHA_CANCELLED") {
                            app.ui.showAlert("Lỗi xác thực Captcha.");
                        }
                        return; // Ngừng thực thi nếu Captcha bị hủy hoặc lỗi
                    }

                    const { id, url } = app.profileIntro.previewedPhoto;
                    const btnSave = document.getElementById('btn-save-fav-photo');
                    const origText = btnSave.innerHTML;
                    
                    btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...';
                    btnSave.disabled = true;

                    await app.profileIntro.saveFavPhoto(id, url);
                    
                    btnSave.innerHTML = origText;
                    btnSave.disabled = false;
                },

                saveFavPhoto: async (photoId, url) => {
                    try {
                        const { data: { session } } = await window.sb.auth.getSession();
                        const fRes = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update_favorite_photo', payload: { photoId }, token: session?.access_token }) });
                        const fJson = await fRes.json();
                        let error = fJson.success ? null : new Error(fJson.error);
                        if (error) throw error;

                        app.profileIntro.closePhotoSelector();

                        const favContainer = document.getElementById('profile-fav-photo-container');
                        const favControls = document.getElementById('profile-fav-photo-controls');
                        const btnAddFav = document.getElementById('btn-add-fav-photo');
                        const placeholderWrap = document.getElementById('fav-photo-placeholder');

                        if(placeholderWrap) {
                            placeholderWrap.classList.add('hidden');
                            placeholderWrap.classList.remove('flex');
                        }

                        favContainer.innerHTML = `
                            <img src="${app.utils.getProxiedUrl(url, 'fav.jpg', 'thumb')}" class="absolute inset-0 w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-700 pointer-events-auto" onclick="app.views.loadDetail(${photoId})">
                        `;
                        favControls.classList.remove('hidden');
                        favControls.classList.add('flex');
                        btnAddFav.classList.add('hidden');
                        btnAddFav.classList.remove('flex');

                        app.toast.show('success', 'Thành công', 'Đã đặt ảnh tâm đắc thành công!');

                    } catch (e) {
                        app.ui.showAlert("Lỗi cài đặt ảnh: " + e.message);
                    }
                },

                deleteFavPhoto: async () => {
                    app.ui.showAlert("Bạn có chắc chắn muốn gỡ Ảnh tâm đắc?", async () => {
                        try {
                            const { data: { session } } = await window.sb.auth.getSession();
                            const fRes = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'update_favorite_photo', payload: { photoId: null }, token: session?.access_token }) });
                            const fJson = await fRes.json();
                            let error = fJson.success ? null : new Error(fJson.error);
                            if (error) throw error;

                            const favContainer = document.getElementById('profile-fav-photo-container');
                            const favControls = document.getElementById('profile-fav-photo-controls');
                            const btnAddFav = document.getElementById('btn-add-fav-photo');
                            const placeholderWrap = document.getElementById('fav-photo-placeholder');

                            favContainer.innerHTML = '';
                            
                            if(placeholderWrap) {
                                placeholderWrap.classList.add('hidden');
                                placeholderWrap.classList.remove('flex');
                            }

                            favControls.classList.add('hidden');
                            favControls.classList.remove('flex');
                            btnAddFav.classList.remove('hidden');
                            btnAddFav.classList.add('flex');

                        } catch (e) {
                            app.ui.showAlert("Lỗi gỡ ảnh: " + e.message);
                        }
                    }, null, { title: "Xác nhận gỡ ảnh", btnOkText: "Gỡ ảnh", btnCancelText: "Hủy" });
                }
            },

window.app.achievement = {
                open: async () => {
                    const modal = document.getElementById('achievement-modal');
                    const content = document.getElementById('achievement-content');

                    document.getElementById('my-top-route').innerHTML = '<i class="fa-solid fa-spinner fa-spin text-sm text-gray-400"></i>';
                    document.getElementById('my-top-plate').innerHTML = '<i class="fa-solid fa-spinner fa-spin text-sm text-gray-400"></i>';
                    document.getElementById('my-top-model').innerHTML = '<i class="fa-solid fa-spinner fa-spin text-sm text-gray-400"></i>';

                    modal.classList.remove('hidden');
                    app.ui.lockScroll();
                    setTimeout(() => {
                        content.classList.remove('opacity-0', 'scale-95');
                        content.classList.add('opacity-100', 'scale-100');
                    }, 10);

                    try {
                        const pRes = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'get_user_approved_photos', payload: { targetUserId: app.currentProfileId || app.user.id } }) });
                        const pJson = await pRes.json();
                        const photos = pJson.success ? pJson.data : null;
                        const error = pJson.success ? null : new Error(pJson.error);

                        if (error) throw error;

                        const routeFreq = {}; const plateFreq = {}; const modelFreq = {};
                        (photos || []).forEach(p => {
                            const r = p.route_no;
                            const pl = p.license_plate;
                            const m = p.vehicles ? p.vehicles.model : null;

                            if (r && r !== '---' && r !== 'N/A') routeFreq[r] = (routeFreq[r] || 0) + 1;
                            if (pl) plateFreq[pl] = (plateFreq[pl] || 0) + 1;
                            if (m && m !== '---' && m !== 'N/A') modelFreq[m] = (modelFreq[m] || 0) + 1;
                        });

                        const getTop = (obj) => {
                            const entries = Object.entries(obj);
                            if (entries.length === 0) return '---';
                            return entries.sort((a, b) => b[1] - a[1])[0][0];
                        };

                        const topRoute = getTop(routeFreq);
                        const topPlateRaw = getTop(plateFreq);
                        const topModel = getTop(modelFreq);

                        document.getElementById('my-top-route').innerText = topRoute;
                        document.getElementById('my-top-plate').innerText = topPlateRaw !== '---' ? app.utils.displayPlate(topPlateRaw) : '---';
                        document.getElementById('my-top-model').innerText = topModel;
                    } catch (e) {
                        console.error("Lỗi tải Thống kê chi tiết:", e);
                        document.getElementById('my-top-route').innerText = 'Lỗi dữ liệu';
                        document.getElementById('my-top-plate').innerText = 'Lỗi dữ liệu';
                        document.getElementById('my-top-model').innerText = 'Lỗi dữ liệu';
                    }
                },
                close: () => {
                    const modal = document.getElementById('achievement-modal');
                    const content = document.getElementById('achievement-content');
                    content.classList.remove('opacity-100', 'scale-100');
                    content.classList.add('opacity-0', 'scale-95');
                    setTimeout(() => {
                        modal.classList.add('hidden');
                        app.ui.unlockScroll();
                    }, 200);
                }
            },

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
            },


