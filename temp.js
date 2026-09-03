const fs = require('fs');
let js = fs.readFileSync('src/js/1_init.js', 'utf8');

const targetStr = `                    if (app.role === 'admin' || app.role === 'manager') {
                        document.getElementById('nav-admin').classList.remove('hidden');
                        app.admin.checkNotification();
                        if (app.role === 'manager') {
                            document.getElementById('adm-tab-manager').classList.remove('hidden');
                        }
                    }`;

const newStr = `                    if (app.role === 'admin' || app.role === 'manager') {
                        document.getElementById('nav-admin').classList.remove('hidden');
                        app.admin.checkNotification();
                        if (app.role === 'manager') {
                            document.getElementById('adm-tab-manager').classList.remove('hidden');
                        }
                    }
                    
                    if (app.role !== 'manager' && localStorage.getItem('vnbus_theme') === 'dark') {
                        if (app.preference && app.preference.setTheme) {
                            app.preference.setTheme('light');
                        }
                    }`;

js = js.replace(targetStr, newStr);
fs.writeFileSync('src/js/1_init.js', js);
console.log('Updated 1_init.js with theme check.');
