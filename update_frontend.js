const fs = require('fs');
let code = fs.readFileSync('src/js/03_auth.js', 'utf8');

// 1. Update the popup message for "forgot password" (which is now passwordless login)
const forgotRegex = /app\.ui\.showAlert\([\s\S]*?`\s*<div class="text-left mt-1">[\s\S]*?<\/div>\s*`\s*,\s*null\s*,\s*null\s*,\s*\{\s*title:\s*"[^"]*",\s*btnOkText:\s*"[^"]*"\s*\}\s*\);/;

const newForgotAlert = `app.ui.showAlert(
          \`<div class="text-left mt-1">
              <p class="text-sm text-gray-700 mb-3">Link đăng nhập đã được gửi đến <b>\${email}</b>.</p>
              <div class="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p class="text-xs text-blue-800 font-medium leading-relaxed">
                      <i class="fa-solid fa-circle-exclamation mr-1 text-blue-600 text-sm"></i>
                      Vui lòng kiểm tra Hộp thư đến (và cả mục Spam/Thư rác).
                  </p>
              </div>
          </div>\`,
          null, null,
          { title: "Gửi Link Đăng Nhập Thành Công", btnOkText: "Đã hiểu" }
      );`;

code = code.replace(forgotRegex, newForgotAlert);

// 2. Rewrite changePassword logic
const changePasswordRegex = /changePassword:\s*async\s*\(\)\s*=>\s*\{[\s\S]*?document\.getElementById\('set-cp-new'\)\.value\s*=\s*'';\s*\}\s*\}/;

const newChangePassword = `changePassword: async () => {
    const newPass = document.getElementById('set-cp-new').value;
    if (!newPass || newPass.length < 6) return app.ui.showAlert("Mật khẩu mới phải ít nhất 6 ký tự.");
    
    // Yêu cầu gửi OTP
    try {
        const btn = event.currentTarget;
        const ogHtml = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Đang xử lý...';
        btn.disabled = true;

        await app.api.post("/api/auth/request-password-change-otp");
        
        btn.innerHTML = ogHtml;
        btn.disabled = false;

        // Show OTP Modal
        const modal = document.getElementById('otp-modal');
        const input = document.getElementById('otp-input');
        const error = document.getElementById('otp-modal-error');
        const confirmBtn = document.getElementById('otp-confirm-btn');
        const cancelBtn = document.getElementById('otp-cancel-btn');

        input.value = '';
        error.classList.add('hidden');
        modal.classList.remove('hidden');
        input.focus();

        const closeHandler = () => {
            modal.classList.add('hidden');
            cancelBtn.removeEventListener('click', closeHandler);
            confirmBtn.removeEventListener('click', confirmHandler);
        };

        const confirmHandler = async () => {
            const otp = input.value.trim();
            if (otp.length !== 6) {
                error.innerText = "Vui lòng nhập đủ 6 số OTP.";
                error.classList.remove('hidden');
                return;
            }
            
            confirmBtn.disabled = true;
            confirmBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';
            error.classList.add('hidden');

            try {
                await app.api.post("/api/auth/change-password-otp", { otp, new_password: newPass });
                app.toast.show('success', 'Thành công', 'Đã đổi mật khẩu thành công!');
                document.getElementById('set-cp-new').value = '';
                closeHandler();
            } catch (err) {
                error.innerText = err.message || "Mã OTP không chính xác hoặc đã hết hạn.";
                error.classList.remove('hidden');
            } finally {
                confirmBtn.disabled = false;
                confirmBtn.innerHTML = 'Xác nhận';
            }
        };

        cancelBtn.addEventListener('click', closeHandler);
        confirmBtn.addEventListener('click', confirmHandler);

    } catch (err) {
        app.ui.showAlert("Lỗi: " + (err.message || "Không thể yêu cầu OTP."));
    }
}`;

code = code.replace(changePasswordRegex, newChangePassword);

// 3. Update the UI string in _core.html for Quên mật khẩu? and remove set-cp-old
let html = fs.readFileSync('_core.html', 'utf8');
html = html.replace(/<button type="button" @click="mode = 'forgot'".*?>.*?<\/button>/, `<button type="button" @click="mode = 'forgot'" class="text-xs font-semibold text-vbs-dark/70 hover:text-vbs-dark transition-colors drop-shadow-sm">Khôi phục / Đăng nhập không mật khẩu</button>`);

// Remove <input type="password" id="set-cp-old" ...>
html = html.replace(/<input type="password" id="set-cp-old"[\s\S]*?>/, '');

fs.writeFileSync('_core.html', html);
fs.writeFileSync('src/js/03_auth.js', code);
console.log('Frontend updated.');
