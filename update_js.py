# -*- coding: utf-8 -*-
import re
with open('src/js/03_auth.js', 'r', encoding='utf-8') as f:
    code = f.read()

change_password_func = '''changePassword: async () => {
    const newPass = document.getElementById('set-cp-new').value;
    const newPass2 = document.getElementById('set-cp-new2').value;
    const otpBox = document.getElementById('set-cp-otp-box');
    const otpInput = document.getElementById('set-cp-otp');
    const btn = document.getElementById('set-cp-btn');
    
    if (!newPass || newPass.length < 6) return app.ui.showAlert("Mật khẩu mới phải ít nhất 6 kí tự.");
    if (newPass !== newPass2) return app.ui.showAlert("Hai mật khẩu không khớp nhau.");
    
    const { data: sessionData } = await window.sb.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) return app.ui.showAlert("Không tìm thấy phiên đăng nhập.");

    if (otpBox.classList.contains('hidden')) {
        try { await app.captcha.request(); } catch (err) { if (err.message !== "CAPTCHA_CANCELLED") app.ui.showAlert("Lỗi xác thực Captcha."); return; }
        
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang gửi...';
        try {
            const res = await fetch('/api/auth/request-password-otp', {
                method: 'POST',
                headers: { 'Authorization': Bearer  }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Không thể gửi OTP");
            
            otpBox.classList.remove('hidden');
            btn.innerText = 'Xác nhận đổi mật khẩu';
            app.ui.showAlert("Mã OTP 6 số đã được gửi tới email của bạn. Vui lòng kiểm tra hộp thư (cả mục Spam) và nhập mã để xác nhận.");
        } catch (e) {
            app.ui.showAlert("Lỗi: " + e.message);
        } finally {
            btn.disabled = false;
        }
    } else {
        const otp = otpInput.value.trim();
        if (!otp || otp.length !== 6) return app.ui.showAlert("Vui lòng nhập đủ mã OTP 6 số.");
        
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...';
        try {
            const res = await fetch('/api/auth/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': Bearer  },
                body: JSON.stringify({ password: newPass, otp: otp })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Cập nhật thất bại");
            
            app.toast.show('success', 'Thành công', 'Đã đổi mật khẩu thành công!');
            document.getElementById('set-cp-new').value = '';
            document.getElementById('set-cp-new2').value = '';
            otpInput.value = '';
            otpBox.classList.add('hidden');
            btn.innerText = 'Tiếp tục';
        } catch (e) {
            app.ui.showAlert("Lỗi: " + e.message);
        } finally {
            btn.disabled = false;
        }
    }
},'''

code = re.sub(
    r"changePassword: async \(\) => \{[\s\S]*?\},(?=\n\s*changeEmail:)",
    change_password_func,
    code
)

with open('src/js/03_auth.js', 'w', encoding='utf-8') as f:
    f.write(code)
