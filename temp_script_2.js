const fs = require('fs');
let c = fs.readFileSync('src/js/02_settings.js', 'utf8');

c = c.replace(/unlinkIdentity: async \(identityId, providerName\) => \{[\s\S]*?catch \(err\) \{/m, 
\`unlinkIdentity: async (identityId, providerName) => {
                    app.ui.showAlert(
                        \\\`Bạn có chắc chắn muốn hủy liên kết tài khoản \${providerName}? Bạn sẽ không thể đăng nhập bằng nền tảng này nữa. Nếu đã được cấp danh hiệu thông qua nền tảng này, chúng cũng sẽ bị thu hồi.\\\`,
                        async () => {
                            try {
                                const { data: { session } } = await window.sb.auth.getSession();
                                if (!session) throw new Error("Chưa đăng nhập");

                                const { error } = await window.sb.auth.unlinkIdentity({ provider: providerName.toLowerCase() });
                                if (error) throw error;
                                app.ui.showAlert("Hủy liên kết thành công!");
                                app.settings.loadLinkedIdentities();
                            } catch (err) {\`
);
fs.writeFileSync('src/js/02_settings.js', c);
