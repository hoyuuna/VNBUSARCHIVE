const fs = require('fs');
let c = fs.readFileSync('src/js/02_settings.js', 'utf8');
const search = `                                // Call backend API to revoke roles/badges before unlinking
                                const apiRes = await fetch('/api/unlink', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': \`Bearer \${session.access_token}\`
                                    },
                                    body: JSON.stringify({ provider: providerName.toLowerCase() })
                                });
                                
                                if (!apiRes.ok) {
                                    const apiData = await apiRes.json();
                                    console.error("Lỗi thu hồi quyền backend:", apiData.error);
                                    // Vẫn tiếp tục thực hiện unlink Identity dù backend có lỗi
                                }

                                const { error } = await window.sb.auth.unlinkIdentity({ identity: identityId });`;
const rep = `                                const { error } = await window.sb.auth.unlinkIdentity({ provider: providerName.toLowerCase() });`;
c = c.replace(search, rep);
fs.writeFileSync('src/js/02_settings.js', c);
