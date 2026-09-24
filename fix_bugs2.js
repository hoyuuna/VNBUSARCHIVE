const fs = require('fs');

// Fix page_admin.js
let a = fs.readFileSync('src/js/page_admin.js', 'utf8');
a = a.replace(
    /const switches = \[\s*\{\s*id:\s*'global',\s*title:\s*'Cầu chì Tổng \(Toàn hệ thống\)',/m,
    `const switches = [
                    { id: 'global', key: 'maintenance_mode', title: 'Cầu chì Tổng (Toàn hệ thống)',`
);
a = a.replace(
    /\{\s*id:\s*'upload',\s*title:\s*'Khóa Upload Ảnh',/m,
    `{ id: 'upload', key: 'upload_maintenance', title: 'Khóa Upload Ảnh',`
);
a = a.replace(
    /\{\s*id:\s*'search',\s*title:\s*'Khóa Tìm kiếm',/m,
    `{ id: 'search', key: 'search_maintenance', title: 'Khóa Tìm kiếm',`
);
a = a.replace(
    /\{\s*id:\s*'users',\s*title:\s*'Khóa Đăng ký mới',/m,
    `{ id: 'users', key: 'user_registration_maintenance', title: 'Khóa Đăng ký mới',`
);
a = a.replace(
    /const isChecked = current\[s\.id\] === true \|\| current\[s\.id\] === 'true';/g,
    `const isChecked = current[s.key] === true || current[s.key] === 'true';`
);
fs.writeFileSync('src/js/page_admin.js', a);

// Fix 00_core.js for reset password endpoint
let c = fs.readFileSync('src/js/00_core.js', 'utf8');
c = c.replace(
    /await app\.api\.post\("\/api\/auth\/reset-password",\s*\{\s*new_password:\s*attrs\.password,\s*token:\s*attrs\.token\s*\}\);/g,
    `await app.api.post("/api/auth/reset-password-verify", { new_password: attrs.password, token: attrs.token });`
);
fs.writeFileSync('src/js/00_core.js', c);

// Fix auth.ts
let auth = fs.readFileSync('temp/middle/src/routes/auth.ts', 'utf8');
// Replace the SECOND occurrence of auth.post('/reset-password'
let count = 0;
auth = auth.replace(/auth\.post\('\/reset-password'/g, match => {
    count++;
    if (count === 2) return `auth.post('/reset-password-verify'`;
    return match;
});
fs.writeFileSync('temp/middle/src/routes/auth.ts', auth);

console.log("Fixed files!");
