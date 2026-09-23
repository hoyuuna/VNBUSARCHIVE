const fs = require('fs');
let c = fs.readFileSync('src/js/00_core.js', 'utf8');

c = c.replace(/const oauthError = searchParams\.get\('oauth_error'\);[\s\S]*?app\.ui\.showAlert\("Tài khoản của bạn không cung cấp Email công khai\. Vui lòng cấp quyền truy cập Email để tiếp tục\."\);\s*\}/, 
\`const actionVal = searchParams.get('action');
                const toastMsg = searchParams.get('toast');
                if (toastMsg) {
                    setTimeout(() => app.ui.showToast(toastMsg, 'success'), 500);
                    if (actionVal === 'open_settings_account') {
                        setTimeout(() => app.settings.open('profile', 'account'), 1000);
                    }
                    searchParams.delete('toast');
                    searchParams.delete('action');
                    let newUrl = window.location.pathname;
                    if (searchParams.toString()) newUrl += '?' + searchParams.toString();
                    window.history.replaceState(null, '', newUrl);
                }

                const oauthError = searchParams.get('oauth_error');
                if (oauthError) {
                    searchParams.delete('oauth_error');
                    let newUrl = window.location.pathname;
                    if (searchParams.toString()) newUrl += '?' + searchParams.toString();
                    window.history.replaceState(null, '', newUrl);
                    
                    if (oauthError === 'not_registered') {
                        app.ui.showAlert("Lỗi chưa đăng ký, nhưng hệ thống mới tự tạo tài khoản.");
                    } else if (oauthError === 'email_exists') {
                        app.ui.showAlert(\\\`<b>EMAIL ĐÃ TỒN TẠI</b><br>Email của tài khoản mạng xã hội này đã được sử dụng bởi một tài khoản khác trên hệ thống.<br><br>Vui lòng đăng nhập bằng Mật khẩu (hoặc Khôi phục mật khẩu), sau đó vào <b>Cài đặt -> Liên kết tài khoản</b>.\\\`);
                    } else if (oauthError === 'identity_already_linked') {
                        app.ui.showAlert("Tài khoản mạng xã hội này đã được liên kết với một người dùng khác trên hệ thống VNBUSARCHIVE!");
                    } else if (oauthError === 'flow_failed') {
                        app.ui.showAlert("Đăng nhập thất bại do lỗi kết nối với máy chủ xác thực.");
                    } else if (oauthError === 'no_email_provided') {
                        app.ui.showAlert("Tài khoản của bạn không cung cấp Email công khai. Vui lòng cấp quyền truy cập Email để tiếp tục.");
                    }
                }\`);

fs.writeFileSync('src/js/00_core.js', c);
