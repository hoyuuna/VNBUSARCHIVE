const fs = require('fs');
let c = fs.readFileSync('src/js/00_core.js', 'utf8');

const replacement = "const actionVal = searchParams.get('action');\n" +
"                const toastMsg = searchParams.get('toast');\n" +
"                if (toastMsg) {\n" +
"                    setTimeout(() => app.ui.showToast(toastMsg, 'success'), 500);\n" +
"                    if (actionVal === 'open_settings_account') {\n" +
"                        setTimeout(() => app.settings.open('profile', 'account'), 1000);\n" +
"                    }\n" +
"                    searchParams.delete('toast');\n" +
"                    searchParams.delete('action');\n" +
"                    let newUrl = window.location.pathname;\n" +
"                    if (searchParams.toString()) newUrl += '?' + searchParams.toString();\n" +
"                    window.history.replaceState(null, '', newUrl);\n" +
"                }\n" +
"\n" +
"                const oauthError = searchParams.get('oauth_error');\n" +
"                if (oauthError) {\n" +
"                    searchParams.delete('oauth_error');\n" +
"                    let newUrl = window.location.pathname;\n" +
"                    if (searchParams.toString()) newUrl += '?' + searchParams.toString();\n" +
"                    window.history.replaceState(null, '', newUrl);\n" +
"                    \n" +
"                    if (oauthError === 'not_registered') {\n" +
"                        app.ui.showAlert('Lỗi chưa đăng ký, nhưng hệ thống mới tự tạo tài khoản.');\n" +
"                    } else if (oauthError === 'email_exists') {\n" +
"                        app.ui.showAlert('<b>EMAIL ĐÃ TỒN TẠI</b><br>Email của tài khoản mạng xã hội này đã được sử dụng bởi một tài khoản khác trên hệ thống.<br><br>Vui lòng đăng nhập bằng Mật khẩu (hoặc Khôi phục mật khẩu), sau đó vào <b>Cài đặt -> Liên kết tài khoản</b>.');\n" +
"                    } else if (oauthError === 'identity_already_linked') {\n" +
"                        app.ui.showAlert('Tài khoản mạng xã hội này đã được liên kết với một người dùng khác trên hệ thống VNBUSARCHIVE!');\n" +
"                    } else if (oauthError === 'flow_failed') {\n" +
"                        app.ui.showAlert('Đăng nhập thất bại do lỗi kết nối với máy chủ xác thực.');\n" +
"                    } else if (oauthError === 'no_email_provided') {\n" +
"                        app.ui.showAlert('Tài khoản của bạn không cung cấp Email công khai. Vui lòng cấp quyền truy cập Email để tiếp tục.');\n" +
"                    }\n" +
"                }";

c = c.replace(/const oauthError = searchParams\.get\('oauth_error'\);[\s\S]*?app\.ui\.showAlert\("Tài khoản của bạn không cung cấp Email công khai\. Vui lòng cấp quyền truy cập Email để tiếp tục\."\);\s*\}/, replacement);

fs.writeFileSync('src/js/00_core.js', c);
