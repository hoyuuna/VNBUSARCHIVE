window.app = window.app || {};

Object.assign(window.app, {
  auth: {
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
                                const { data: profile } = await window.sb.from('profiles').select('ban_status').eq('id', data.user.id).single();
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

                            const { data: existingUser } = await window.sb.from('profiles')
                                .select('username')
                                .ilike('username', username)
                                .maybeSingle();

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
                        const { error } = await window.sb.from('profiles').update({ avatar_url: null }).eq('id', app.user.id);
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

                    const { data: existingUser } = await window.sb.from('profiles')
                        .select('username')
                        .ilike('username', newName)
                        .neq('id', app.user.id)
                        .maybeSingle();

                    if (existingUser) {
                        return app.ui.showAlert("Tên hiển thị này đã có người sử dụng (không phân biệt viết hoa/thường). Vui lòng chọn tên khác!");
                    }

                    app.ui.showAlert(
                        "Cảnh báo: Đổi tên hiển thị sẽ không làm thay đổi dấu bản quyền trên các ảnh đã duyệt trước đó. Bạn có chắc chắn muốn tiếp tục?",
                        async () => {

                            try {

                                try { await app.captcha.request(); } catch (err) { if (err.message !== "CAPTCHA_CANCELLED") app.ui.showAlert("Lỗi xác thực Captcha."); return; }
                                const { error: dbError } = await window.sb.from('profiles').update({ username: newName }).eq('id', app.user.id);
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
            }
});

Object.assign(window.app, {
  user: null
});

Object.assign(window.app, {
  username: 'Guest'
});

Object.assign(window.app, {
  role: 'user'
});

Object.assign(window.app, {
  captcha: {
                widgetId: null,
                resolvePromise: null,
                rejectPromise: null,
                timeoutTimer: null,
                isOpen: false,

                request: () => {
                    return new Promise((resolve, reject) => {
                        app.captcha.resolvePromise = resolve;
                        app.captcha.rejectPromise = reject;
                        app.captcha.openModal();
                    });
                },

                openModal: () => {
                    if(app.captcha.isOpen) return;
                    app.captcha.isOpen = true;
                    const modal = document.getElementById('captcha-modal');
                    const content = document.getElementById('captcha-content');
                    const container = document.getElementById('captcha-container');
                    const status = document.getElementById('captcha-status');
                    const actions = document.getElementById('captcha-actions');

                    modal.classList.remove('hidden');
                    setTimeout(() => {
                        modal.classList.remove('opacity-0');
                        content.classList.remove('scale-95');
                    }, 10);

                    status.innerText = "Đang kiểm tra...";
                    status.className = "text-xs font-bold text-gray-500 mt-2 h-4 text-center";
                    actions.classList.add('hidden');

                    if (window.turnstile) {
                        if (app.captcha.widgetId !== null) {
                            window.turnstile.reset(app.captcha.widgetId);
                        } else {
                            container.innerHTML = '';
                            app.captcha.widgetId = window.turnstile.render(container, {
                                sitekey: '0x4AAAAAAC0MVeewmy6kwkTF',
                                callback: app.captcha.onSuccess,
                                'error-callback': app.captcha.onError,
                                'timeout-callback': app.captcha.onError
                            });
                        }
                    } else {
                        status.innerText = "Lỗi: Không tải được hệ thống xác thực.";
                        status.className = "text-xs font-bold text-red-500 mt-2 h-4 text-center";
                        actions.classList.remove('hidden');
                    }

                    clearTimeout(app.captcha.timeoutTimer);
                    app.captcha.timeoutTimer = setTimeout(() => {
                        status.innerText = "Kiểm tra quá hạn (12s). Vui lòng thử lại.";
                        status.className = "text-xs font-bold text-amber-600 mt-2 h-4 text-center";
                        actions.classList.remove('hidden');
                    }, 12000);
                },

                onSuccess: (token) => {
                    clearTimeout(app.captcha.timeoutTimer);
                    const status = document.getElementById('captcha-status');
                    status.innerText = "Xác thực thành công!";
                    status.className = "text-xs font-bold text-green-600 mt-2 h-4 text-center";

                    setTimeout(() => {
                        app.captcha.closeModal();
                        if (app.captcha.resolvePromise) {
                            app.captcha.resolvePromise(token);
                            app.captcha.resolvePromise = null;
                            app.captcha.rejectPromise = null;
                        }
                    }, 500);
                },

                onError: () => {
                    clearTimeout(app.captcha.timeoutTimer);
                    const status = document.getElementById('captcha-status');
                    const actions = document.getElementById('captcha-actions');
                    status.innerText = "Xác thực thất bại.";
                    status.className = "text-xs font-bold text-red-600 mt-2 h-4 text-center";
                    actions.classList.remove('hidden');
                },

                retry: () => {
                    const actions = document.getElementById('captcha-actions');
                    const status = document.getElementById('captcha-status');
                    actions.classList.add('hidden');
                    status.innerText = "Đang tải lại...";
                    status.className = "text-xs font-bold text-gray-500 mt-2 h-4 text-center";

                    if (window.turnstile && app.captcha.widgetId !== null) {
                        window.turnstile.reset(app.captcha.widgetId);
                    }

                    clearTimeout(app.captcha.timeoutTimer);
                    app.captcha.timeoutTimer = setTimeout(() => {
                        status.innerText = "Kiểm tra quá hạn (12s). Vui lòng thử lại.";
                        status.className = "text-xs font-bold text-amber-600 mt-2 h-4 text-center";
                        actions.classList.remove('hidden');
                    }, 12000);
                },

                closeModal: () => {
                    app.captcha.isOpen = false;
                    clearTimeout(app.captcha.timeoutTimer);
                    const modal = document.getElementById('captcha-modal');
                    const content = document.getElementById('captcha-content');

                    modal.classList.add('opacity-0');
                    content.classList.add('scale-95');

                    setTimeout(() => {
                        modal.classList.add('hidden');
                    }, 300);
                },

                cancel: () => {
                    app.captcha.closeModal();
                    if (app.captcha.rejectPromise) {
                        app.captcha.rejectPromise(new Error("CAPTCHA_CANCELLED"));
                        app.captcha.resolvePromise = null;
                        app.captcha.rejectPromise = null;
                    }
                }
            }
});

Object.assign(window.app, {
  qrLogin: {
            peer: null,
            conn: null,
            timer: null,
            timeLeft: 180,

            // --- HOST: Máy PC (Mở Modal, Tạo QR, Chờ kết nối) ---
            startHost: () => {
                const modal = document.getElementById('qr-login-host-modal');
                const loading = document.getElementById('qr-login-loading');
                const qrContainer = document.getElementById('qr-login-qrcode-container');
                const countdownEl = document.getElementById('qr-login-countdown');
                const statusText = document.getElementById('qr-login-status-text');

                modal.classList.remove('hidden');
                qrContainer.innerHTML = '';
                loading.classList.remove('hidden');
                statusText.innerText = "Đang tạo mã QR...";
                countdownEl.innerText = "03:00";
                app.ui.lockScroll();

                if (app.qrLogin.peer) app.qrLogin.peer.destroy();
                app.qrLogin.peer = new Peer();

                app.qrLogin.peer.on('open', (id) => {
                    loading.classList.add('hidden');
                    const loginUrl = window.location.origin + '/login?qr=' + id;

                    new QRCode(qrContainer, {
                        text: loginUrl, width: 224, height: 224,
                        colorDark : "#000000", colorLight : "#ffffff",
                        correctLevel : QRCode.CorrectLevel.H
                    });

                    app.qrLogin.startCountdown();
                });

                app.qrLogin.peer.on('connection', (conn) => {
                    app.qrLogin.conn = conn;

                    conn.on('open', () => {
                        loading.classList.remove('hidden');
                        statusText.innerText = "Vui lòng xác nhận trên thiết bị quét...";
                        if(app.qrLogin.timer) clearInterval(app.qrLogin.timer);
                        countdownEl.innerText = "Đang chờ...";

                        // GỬI RAW USER-AGENT TỪ MÁY TÍNH QUA ĐIỆN THOẠI
                        conn.send({ type: 'host_info', userAgent: navigator.userAgent });
                    });

                    conn.on('data', async (data) => {
                        if (data.type === 'login_link') {
                            statusText.innerText = "Đang chuyển hướng đăng nhập...";
                            conn.send({ type: 'success' });

                            // CHUẨN CHUYÊN NGHIỆP: ĐIỀU HƯỚNG PC ĐẾN MAGIC LINK DO BACKEND TẠO RA
                            window.location.href = data.url;

                        } else if (data.type === 'cancel') {
                            app.ui.showAlert("Đăng nhập bị từ chối từ thiết bị quét.");
                            app.qrLogin.cancelHost();
                        }
                    });

                    conn.on('close', () => {
                        app.qrLogin.cancelHost();
                    });
                });
            },

            startCountdown: () => {
                app.qrLogin.timeLeft = 180;
                const timerEl = document.getElementById('qr-login-countdown');

                if(app.qrLogin.timer) clearInterval(app.qrLogin.timer);
                app.qrLogin.timer = setInterval(() => {
                    app.qrLogin.timeLeft--;
                    const m = Math.floor(app.qrLogin.timeLeft / 60).toString().padStart(2, '0');
                    const s = (app.qrLogin.timeLeft % 60).toString().padStart(2, '0');
                    timerEl.innerText = `${m}:${s}`;

                    if (app.qrLogin.timeLeft <= 0) {
                        app.ui.showAlert("Mã QR đã hết hạn (3 phút). Vui lòng tạo lại.");
                        app.qrLogin.cancelHost();
                    }
                }, 1000);
            },

            cancelHost: () => {
                if(app.qrLogin.timer) clearInterval(app.qrLogin.timer);
                if(app.qrLogin.conn) app.qrLogin.conn.close();
                if(app.qrLogin.peer) app.qrLogin.peer.destroy();

                document.getElementById('qr-login-host-modal').classList.add('hidden');
                app.ui.unlockScroll();
            },

            // --- CLIENT: Điện thoại quét mã ---
            initClient: async (hostId) => {
                if (!app.user) {
                    app.ui.showAlert("Bạn chưa đăng nhập! Vui lòng đăng nhập trên điện thoại này trước khi quét mã QR.", () => {
                        app.utils.navigate('/auth');
                    });
                    return;
                }

                const modal = document.getElementById('qr-login-confirm-modal');
                const btnConfirm = document.getElementById('qr-confirm-btn');
                const avatarImg = document.getElementById('qr-confirm-avatar');
                const deviceText = document.getElementById('qr-confirm-device');

                btnConfirm.disabled = true;
                btnConfirm.classList.add('opacity-50', 'cursor-not-allowed');
                let timeLeft = 10;
                btnConfirm.innerText = `Đăng nhập (${timeLeft})`;

                document.getElementById('qr-confirm-name').innerText = app.username;

                try {
                    const { data: profile } = await window.sb.from('profiles').select('avatar_url').eq('id', app.user.id).single();
                    if (profile && profile.avatar_url) {
                        avatarImg.src = app.utils.getProxiedUrl(profile.avatar_url.replace(/"/g, ''), 'avatar.jpg', 'avatar');
                    } else if (app.user.user_metadata?.avatar_url) {
                        avatarImg.src = app.utils.getProxiedUrl(app.user.user_metadata.avatar_url, 'avatar.jpg', 'avatar');
                    } else {
                        avatarImg.src = 'https://files.catbox.moe/zzh1q1.png';
                    }
                } catch(e) {
                    avatarImg.src = 'https://files.catbox.moe/zzh1q1.png';
                }

                deviceText.innerText = "Đang kết nối để lấy thông tin thiết bị...";
                app.qrLogin.getIP();

                modal.classList.remove('hidden');
                app.ui.lockScroll();

                const cTimer = setInterval(() => {
                    timeLeft--;
                    if (timeLeft <= 0) {
                        clearInterval(cTimer);
                        btnConfirm.disabled = false;
                        btnConfirm.classList.remove('opacity-50', 'cursor-not-allowed');
                        btnConfirm.innerText = "Đăng nhập";
                    } else {
                        btnConfirm.innerText = `Đăng nhập (${timeLeft})`;
                    }
                }, 1000);

                if (app.qrLogin.peer) app.qrLogin.peer.destroy();
                app.qrLogin.peer = new Peer();

                app.qrLogin.peer.on('open', () => {
                    app.qrLogin.conn = app.qrLogin.peer.connect(hostId, { reliable: true });

                    app.qrLogin.conn.on('data', (data) => {
                        if (data.type === 'host_info') {
                            deviceText.innerText = data.userAgent || 'Trình duyệt không xác định';
                            deviceText.className = "text-[10px] font-mono text-gray-800 break-words leading-tight mt-0.5";
                        }
                        else if (data.type === 'success') {
                            app.ui.showAlert(
                                `<div class="text-left">
                                    <p class="text-sm font-bold text-green-600 mb-2"><i class="fa-solid fa-check-circle mr-1"></i> Đăng nhập thành công!</p>
                                    <p class="text-xs text-gray-700 mb-2">Thiết bị yêu cầu đã được cấp quyền truy cập hệ thống.</p>
                                    <div class="bg-gray-50 border border-gray-200 p-3 rounded-md mt-3 shadow-sm">
                                        <p class="text-[10.5px] text-gray-600 font-medium leading-relaxed m-0">
                                            <i class="fa-solid fa-triangle-exclamation text-amber-500 mr-1"></i>
                                            Nếu bạn lỡ tay hoặc nghi ngờ rủi ro, hãy vào <a href="javascript:void(0)" onclick="app.ui.closeAlert(true); setTimeout(() => { app.settings.open(); app.settings.switchTab('security'); }, 300);" class="font-bold text-red-600 hover:text-red-800 transition underline">Cài đặt > Bảo mật > Đăng xuất tất cả</a> để vô hiệu hóa quyền truy cập ngay lập tức.
                                        </p>
                                    </div>
                                </div>`,
                                () => { app.utils.navigate('/'); },
                                null,
                                { title: "Xác thực QR hoàn tất", btnOkText: "Đã hiểu" }
                            );
                            app.qrLogin.closeClient();
                        }
                    });

                    app.qrLogin.conn.on('close', () => {
                        app.ui.showAlert("Mất kết nối với thiết bị chờ đăng nhập. Vui lòng quét lại.");
                        app.utils.navigate('/');
                        app.qrLogin.closeClient();
                    });
                });
            },

            getIP: async () => {
                try {
                    const res = await fetch('https://api.ipify.org?format=json');
                    const data = await res.json();
                    document.getElementById('qr-confirm-ip').innerText = data.ip || 'Không thể lấy IP';
                } catch(e) {
                    document.getElementById('qr-confirm-ip').innerText = 'Không thể lấy IP';
                }
            },

            confirmClient: async () => {
                const btn = document.getElementById('qr-confirm-btn');
                btn.disabled = true;
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...';

                try {
                    const { data, error } = await window.sb.auth.getSession();
                    if (error || !data.session) throw new Error("Lấy Token thất bại. Vui lòng tải lại trang.");

                    if (!app.qrLogin.conn || !app.qrLogin.conn.open) {
                        throw new Error("Không thể kết nối với máy chủ chờ. Vui lòng quét lại mã QR.");
                    }

                    // --- CHUẨN CHUYÊN NGHIỆP: GỌI API BACKEND ĐỂ TẠO MAGIC LINK ---
                    const res = await fetch('/api/system', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${data.session.access_token}`
                        },
                        body: JSON.stringify({ action: 'qr-login' })
                    });

                    const apiData = await res.json();
                    if (!res.ok) throw new Error(apiData.error || "Không thể tạo token đăng nhập mới từ máy chủ.");

                    // Bắn Magic Link qua cho PC
                    app.qrLogin.conn.send({
                        type: 'login_link',
                        url: apiData.url
                    });

                } catch (e) {
                    app.ui.showAlert(e.message);
                    btn.disabled = false;
                    btn.innerText = "Thử lại";
                }
            },

            cancelClient: () => {
                if (app.qrLogin.conn && app.qrLogin.conn.open) {
                    app.qrLogin.conn.send({ type: 'cancel' });
                }
                app.ui.showAlert("Đã hủy quá trình đăng nhập qua QR.", () => {
                    app.utils.navigate('/');
                });
                app.qrLogin.closeClient();
            },

            closeClient: () => {
                if(app.qrLogin.conn) app.qrLogin.conn.close();
                if(app.qrLogin.peer) app.qrLogin.peer.destroy();
                document.getElementById('qr-login-confirm-modal').classList.add('hidden');
                app.ui.unlockScroll();
            }
        }
});

Object.assign(window.app, {
  profileIntro: {
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

                    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang kiểm duyệt nội dung...';
                    btn.disabled = true;

                    try {
                        // ==========================================
                        // [BƯỚC KIỂM DUYỆT AI]
                        // ==========================================
                        if (text !== '') { // Chỉ kiểm duyệt nếu người dùng có nhập chữ
                            const aiResult = await app.ai.moderateBio(text);
                            
                            if (!aiResult.is_safe) {
                                // Nếu AI báo không an toàn -> Dừng lại và hiện cảnh báo
                                btn.innerHTML = 'Lưu tiểu sử';
                                btn.disabled = false;
                                return app.ui.showAlert(
                                    `<div class="text-left">
                                        <p class="text-sm font-bold text-red-600 mb-2"><i class="fa-solid fa-shield-halved mr-1"></i> Nội dung bị từ chối!</p>
                                        <p class="text-xs text-gray-700 leading-relaxed mb-3">Hệ thống AI tự động đã phát hiện tiểu sử của bạn vi phạm tiêu chuẩn cộng đồng.</p>
                                        <div class="bg-red-50 border border-red-200 p-3 rounded-lg">
                                            <p class="text-[11px] font-bold text-red-800 uppercase tracking-widest mb-1">Lý do:</p>
                                            <p class="text-xs text-red-700 italic">"${aiResult.reason}"</p>
                                        </div>
                                    </div>`,
                                    null, null, { title: "Kiểm duyệt tự động" }
                                );
                            }
                        }
                        // ==========================================

                        // Nếu AI cho qua (hoặc text rỗng) -> Tiến hành update Database
                        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';

                        const { error } = await window.sb.from('profiles').update({ bio: text || null }).eq('id', app.user.id);
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
                        const { data, error } = await window.sb.from('photos')
                            .select('id, url, license_plate, operator, uploader_id, status')
                            .eq('id', photoId)
                            .single();

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
                        const { error } = await window.sb.from('profiles').update({ favorite_photo_id: photoId }).eq('id', app.user.id);
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
                            const { error } = await window.sb.from('profiles').update({ favorite_photo_id: null }).eq('id', app.user.id);
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
            }
});

Object.assign(window.app, {
  onboarding: {
                currentStep: 1,
                isOpen: false,

                check: () => {
                    const isHome = window.location.pathname === '/' || window.location.pathname === '';
                    const onboarded = localStorage.getItem('vnbus_onboarded');

                    if (!onboarded && isHome) {
                        setTimeout(() => { app.onboarding.open(); }, 800);
                    }
                },

                open: () => {
                    if (app.onboarding.isOpen) return;
                    app.onboarding.isOpen = true;
                    app.onboarding.currentStep = 1;

                    app.preference.tempSelection = app.preference.current || 'both';
                    app.onboarding.updatePrefUI();

                    if (app.user) {
                        document.getElementById('onb-auth-guest').classList.add('hidden');
                        document.getElementById('onb-auth-logged').classList.remove('hidden');
                        document.getElementById('onb-user-name').innerText = app.username || 'Bạn';
                        const avatarEl = document.getElementById('onb-user-avatar');
                        try {
                            window.sb.from('profiles').select('avatar_url').eq('id', app.user.id).single().then(({data}) => {
                                if (data && data.avatar_url) avatarEl.src = app.utils.getProxiedUrl(data.avatar_url.replace(/"/g, ''), 'avatar.jpg', 'avatar');
                                else avatarEl.src = 'https://files.catbox.moe/zzh1q1.png';
                            });
                        } catch(e) {}
                    } else {
                        document.getElementById('onb-auth-guest').classList.remove('hidden');
                        document.getElementById('onb-auth-logged').classList.add('hidden');
                    }

                    app.onboarding.renderStep(1, false);

                    const modal = document.getElementById('onboarding-modal');
                    const content = document.getElementById('onboarding-content');
                    modal.classList.remove('hidden');
                    app.ui.lockScroll();
                    setTimeout(() => {
                        content.classList.remove('opacity-0', 'scale-95');
                        content.classList.add('opacity-100', 'scale-100');
                    }, 10);
                },

                next: () => {
                    if (app.onboarding.currentStep < 4) {
                        app.onboarding.currentStep++;
                        app.onboarding.renderStep(app.onboarding.currentStep, false);
                    } else {
                        app.onboarding.complete(true);
                    }
                },

                prev: () => {
                    if (app.onboarding.currentStep > 1) {
                        app.onboarding.currentStep--;
                        app.onboarding.renderStep(app.onboarding.currentStep, true);
                    }
                },

                renderStep: (step, isBackwards) => {
                    const segments = document.querySelectorAll('.onb-segment');
                    segments.forEach((seg, idx) => {
                        if (idx < step) seg.classList.add('active');
                        else seg.classList.remove('active');
                    });

                    document.querySelectorAll('.onb-slide').forEach(slide => {
                        slide.classList.remove('active', 'slide-left');
                    });

                    const activeSlide = document.getElementById('onb-step-' + step);
                    if (isBackwards) activeSlide.classList.add('slide-left', 'active');
                    else activeSlide.classList.add('active');

                    const btnPrev = document.getElementById('onb-btn-prev');
                    const btnNext = document.getElementById('onb-btn-next');

                    if (step === 1) {
                        btnPrev.style.visibility = 'hidden';
                        btnNext.innerHTML = 'Tiếp tục <i class="fa-solid fa-arrow-right"></i>';
                        btnNext.style.visibility = 'visible';
                    } else if (step === 4) {
                        btnPrev.style.visibility = 'visible';
                        btnNext.innerHTML = 'Hoàn thành <i class="fa-solid fa-check"></i>';
                        btnNext.style.visibility = 'visible';
                    } else if (step === 3 && !app.user) {
                        btnPrev.style.visibility = 'visible';
                        btnNext.style.visibility = 'hidden';
                    } else {
                        btnPrev.style.visibility = 'visible';
                        btnNext.innerHTML = 'Tiếp tục <i class="fa-solid fa-arrow-right"></i>';
                        btnNext.style.visibility = 'visible';
                    }
                },

                updatePrefUI: () => {
                    ['bus', 'coach', 'both'].forEach(type => {
                        const btn = document.getElementById(`onb-pref-${type}`);
                        if (!btn) return;
                        if (app.preference.tempSelection === type) {
                            btn.className = "pref-option cursor-pointer border border-black bg-black text-white rounded-xl p-3.5 shadow-md transition-all flex items-center gap-4 scale-[1.02]";
                            btn.querySelector('.rounded-full').className = "w-10 h-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center shrink-0 transition-colors";
                            btn.querySelector('p').className = "text-[11px] font-medium text-gray-300 mt-0.5";
                        } else {
                            btn.className = "pref-option cursor-pointer border border-gray-300 bg-white/70 backdrop-blur-md rounded-xl p-3.5 shadow-sm hover:shadow-md hover:border-black transition-all flex items-center gap-4 scale-100";
                            btn.querySelector('.rounded-full').className = "w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0 transition-colors";
                            btn.querySelector('p').className = "text-[11px] font-medium text-gray-500 mt-0.5";
                        }
                    });
                },

                complete: (savePreferences = true, redirectUrl = null) => {
                    localStorage.setItem('vnbus_onboarded', 'true');
                    localStorage.setItem('vnbus_news_last_seen', new Date().toDateString());

                    if (savePreferences) {
                        app.preference.current = app.preference.tempSelection || 'both';
                        localStorage.setItem('vnbus_preference', app.preference.current);
                        if (app.user) {
                            window.sb.from('profiles').update({
                                preferences: { type: app.preference.current, showRec: app.preference.showRecommendations }
                            }).eq('id', app.user.id).then(()=>{});
                        }
                    }

                    const modal = document.getElementById('onboarding-modal');
                    const content = document.getElementById('onboarding-content');
                    content.classList.remove('opacity-100', 'scale-100');
                    content.classList.add('opacity-0', 'scale-95');

                    setTimeout(() => {
                        modal.classList.add('hidden');
                        app.ui.unlockScroll();
                        app.onboarding.isOpen = false;

                        if (redirectUrl) {
                            app.utils.navigate(redirectUrl);
                        } else {
                            app.views.loadHome(true);
                        }
                    }, 200);
                }
            }
});
