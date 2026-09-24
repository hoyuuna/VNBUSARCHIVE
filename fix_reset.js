const fs = require('fs');

// 1. Modify 00_core.js to add /reset-password
let coreJs = fs.readFileSync('src/js/00_core.js', 'utf8');
if (!coreJs.includes("path === '/reset-password'")) {
    coreJs = coreJs.replace("else if (path === '/auth' || path === '/login' || path === '/register') {", 
`else if (path === '/reset-password') {
                              if (app.user) app.utils.navigate('/', true);
                              else app.views.switch('reset-password-view', false);
                              handled = true;
                          } else if (path === '/auth' || path === '/login' || path === '/register') {`);
    fs.writeFileSync('src/js/00_core.js', coreJs);
}

// 2. Append form submit logic to 03_auth.js
let authJs = fs.readFileSync('src/js/03_auth.js', 'utf8');
if (!authJs.includes("document.getElementById('reset-password-form')")) {
    const appendStr = `\n
document.addEventListener('DOMContentLoaded', () => {
    const resetForm = document.getElementById('reset-password-form');
    if (resetForm) {
        resetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newPass = document.getElementById('reset-password-new').value;
            const confirmPass = document.getElementById('reset-password-confirm').value;
            
            if (!newPass || newPass.length < 6) return app.ui.showAlert("Mật khẩu phải từ 6 ký tự trở lên.");
            if (newPass !== confirmPass) return app.ui.showAlert("Mật khẩu xác nhận không khớp.");
            
            const btn = document.getElementById('reset-password-submit');
            const ogText = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Đang xử lý...';
            btn.disabled = true;
            
            const urlParams = new URLSearchParams(window.location.search);
            const token = urlParams.get('token');
            
            try {
                if (!token) throw new Error("Link không hợp lệ hoặc đã hết hạn.");
                const { error } = await window.sb.auth.updateUser({ password: newPass, token: token });
                if (error) throw error;
                
                app.ui.showAlert("Đổi mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.", () => {
                    app.utils.navigate('/auth');
                });
            } catch (err) {
                app.ui.showAlert(err.message || "Có lỗi xảy ra, vui lòng thử lại.");
            } finally {
                btn.innerHTML = ogText;
                btn.disabled = false;
            }
        });
    }
});
`;
    fs.writeFileSync('src/js/03_auth.js', authJs + appendStr);
}

console.log("Done fixing reset password logic");
