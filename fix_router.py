import re

with open('src/js/01_router.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Add app.setUser to SIGNED_IN event
replacement = """else if (event === 'SIGNED_IN') {
                            if (session && session.user) {
                                await app.setUser(session.user);
                            }
                            const hash = window.location.hash;
                            if (hash && hash.includes('type=signup')) {
                                setTimeout(() => {
                                    app.ui.showAlert("Xác thực Email thành công! Chào mừng bạn đến với hệ thống.");
                                    window.history.replaceState(null, null, window.location.pathname);
                                }, 500);
                            } else if (hash && hash.includes('type=magiclink')) {
                                setTimeout(() => {
                                    app.toast.show('success', 'Thành công', 'Đăng nhập thành công!');
                                    window.history.replaceState(null, null, window.location.pathname);
                                }, 500);
                            }
                        }"""

code = re.sub(
    r"else if \(event === 'SIGNED_IN'\) \{\s*const hash = window\.location\.hash;[\s\S]*?\}, 500\);\s*\}\s*\}",
    replacement,
    code
)

with open('src/js/01_router.js', 'w', encoding='utf-8') as f:
    f.write(code)
