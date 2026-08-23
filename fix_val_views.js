const fs = require('fs');
let code = fs.readFileSync('src/js/3_views.js', 'utf8');

const regex = /btn\.disabled = true;\s*try \{\s*if \(app\.role === 'admin' \|\| app\.role === 'manager'\) \{/;
const replacement = `btn.disabled = true;
                        try {
                            if (enteredPlates.length > 0) {
                                const { data: existVeh, error: existErr } = await window.sb.from('vehicles').select('license_plate').in('license_plate', enteredPlates);
                                if (existErr) throw existErr;
                                const existingP = existVeh.map(v => v.license_plate.toUpperCase());
                                const invalidP = enteredPlates.filter(p => !existingP.includes(p.toUpperCase()));
                                if (invalidP.length > 0) {
                                    btn.innerHTML = origText;
                                    btn.disabled = false;
                                    return app.ui.showAlert(\`Lỗi: Các biển số xe sau không tồn tại trên hệ thống: \${invalidP.join(', ')}\`);
                                }
                            }
                            if (app.role === 'admin' || app.role === 'manager') {`;

if (regex.test(code)) {
    fs.writeFileSync('src/js/3_views.js', code.replace(regex, replacement), 'utf8');
    console.log("Success 3_views.js");
} else {
    console.log("Regex failed 3_views.js");
}
