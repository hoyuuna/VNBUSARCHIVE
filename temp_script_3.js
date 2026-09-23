const fs = require('fs');
let c = fs.readFileSync('src/js/00_core.js', 'utf8');

const searchAuth = `            linkIdentity: async (options) => {
                try {
                    await app.api.post("/api/system/unlink", { provider: options.provider || "discord" }); // Temporary fallback if provider isn't passed perfectly
                    return { error: null };
                } catch(error) {
                    return { error };
                }
            },
            unlinkIdentity: async (options) => {
                try {
                    await app.api.post("/api/system/unlink", { provider: options.provider || "discord" }); // Temporary fallback if provider isn't passed perfectly
                    return { error: null };
                } catch(error) {
                    return { error };
                }
            },`;

const repAuth = `            linkIdentity: async (options) => {
                try {
                    const { data: { session } } = await window.sb.auth.getSession();
                    window.location.href = app.api.baseUrl + "/api/auth/" + options.provider + "?action=link&token=" + session.access_token;
                    return { error: null };
                } catch(error) {
                    return { error };
                }
            },
            unlinkIdentity: async (options) => {
                try {
                    await app.api.post("/api/system/unlink", { provider: options.provider || "discord" }); 
                    return { error: null };
                } catch(error) {
                    return { error };
                }
            },`;

c = c.replace(searchAuth, repAuth);

// Fix oauth_error
const searchOauth = `                const oauthError = searchParams.get('oauth_error');
                if (oauthError === 'not_registered' || oauthError === 'flow_failed' || oauthError === 'no_email_provided') {`;

const repOauth = `                const actionVal = searchParams.get('action');
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
                if (oauthError) {`;

c = c.replace(searchOauth, repOauth);

// Fix oauthError checking
const searchOauthErr = `                    if (oauthError === 'not_registered') {
                        app.auth.mode = 'register';
                        setTimeout(() => {
                            if (window.location.pathname !== '/auth') app.utils.navigate('/auth');
                            setTimeout(() => {
                                const emailInput = document.getElementById('auth-email');
                                const nameInput = document.getElementById('auth-username');
                                if (emailInput) emailInput.value = newEmail;
                                if (nameInput) nameInput.value = newName;
                                app.ui.showAlert(\`<b>TÀI KHOẢN CHƯA ĐĂNG KÝ</b><br>Tài khoản mạng xã hội của bạn chưa được liên kết với bất kỳ người dùng nào trên hệ thống.<br><br>Vui lòng <b>Tạo tài khoản mới</b> sử dụng email này.\`);
                            }, 500);
                        }, 100);
                    } else if (oauthError === 'flow_failed') {
                        app.ui.showAlert("Đăng nhập thất bại do lỗi kết nối với máy chủ xác thực.");
                    } else if (oauthError === 'no_email_provided') {
                        app.ui.showAlert("Tài khoản của bạn không cung cấp Email công khai. Vui lòng cấp quyền truy cập Email để tiếp tục.");
                    }`;

const repOauthErr = `                    if (oauthError === 'not_registered') {
                        app.ui.showAlert("Lỗi chưa đăng ký, nhưng hệ thống mới tự tạo tài khoản.");
                    } else if (oauthError === 'email_exists') {
                        app.ui.showAlert(\`<b>EMAIL ĐÃ TỒN TẠI</b><br>Email của tài khoản mạng xã hội này đã được sử dụng bởi một tài khoản khác trên hệ thống.<br><br>Vui lòng đăng nhập bằng Mật khẩu (hoặc Khôi phục mật khẩu), sau đó vào <b>Cài đặt -> Liên kết tài khoản</b>.\`);
                    } else if (oauthError === 'identity_already_linked') {
                        app.ui.showAlert("Tài khoản mạng xã hội này đã được liên kết với một người dùng khác trên hệ thống VNBUSARCHIVE!");
                    } else if (oauthError === 'flow_failed') {
                        app.ui.showAlert("Đăng nhập thất bại do lỗi kết nối với máy chủ xác thực.");
                    } else if (oauthError === 'no_email_provided') {
                        app.ui.showAlert("Tài khoản của bạn không cung cấp Email công khai. Vui lòng cấp quyền truy cập Email để tiếp tục.");
                    }`;

c = c.replace(searchOauthErr, repOauthErr);

fs.writeFileSync('src/js/00_core.js', c);
