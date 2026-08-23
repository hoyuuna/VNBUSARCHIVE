const fs = require('fs');
let code = fs.readFileSync('src/js/5_admin.js', 'utf8');

const regex = /const rawInputListAdmin = borrowedPhotosStr \? borrowedPhotosStr\.split\(','\)\.map\(s => s\.trim\(\)\)\.filter\(Boolean\) : \[\];\s*const enteredPlatesAdmin = rawInputListAdmin\.filter\(s => ![^\)]+\.test\(s\)\);/;
const replacement = `const rawInputListAdmin = borrowedPhotosStr ? borrowedPhotosStr.split(',').map(s => s.trim()).filter(Boolean) : [];
                            const enteredPlatesAdmin = rawInputListAdmin.filter(s => !/^\\d+$/.test(s));
                            if (enteredPlatesAdmin.length > 0) {
                                const { data: existVeh, error: existErr } = await window.sb.from('vehicles').select('license_plate').in('license_plate', enteredPlatesAdmin);
                                if (existErr) throw existErr;
                                const existingP = existVeh.map(v => v.license_plate.toUpperCase());
                                const invalidP = enteredPlatesAdmin.filter(p => !existingP.includes(p.toUpperCase()));
                                if (invalidP.length > 0) {
                                    btn.innerHTML = originalText;
                                    btn.disabled = false;
                                    return app.ui.showAlert(\`Lỗi: Các biển số xe sau không tồn tại trên hệ thống: \${invalidP.join(', ')}\`);
                                }
                            }`;

if (regex.test(code)) {
    fs.writeFileSync('src/js/5_admin.js', code.replace(regex, replacement), 'utf8');
    console.log("Success 5_admin.js");
} else {
    console.log("Regex failed 5_admin.js");
}
