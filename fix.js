const fs = require('fs');
let code = fs.readFileSync('src/js/page_admin.js', 'utf8');

const oldStr = 'fetch(`/api/photo?status=pending&page=${app.adminPendingPage}&limit=${pageSize}`, { headers: { \'Authorization\': `Bearer ${token}` } });';
const newStr = 'fetch(`/api/photo?status=pending&page=${app.adminPendingPage}&limit=${pageSize}&_t=${new Date().getTime()}`, { headers: { \'Authorization\': `Bearer ${token}` }, cache: \'no-store\' });';

if (code.includes(oldStr)) {
    code = code.replace(oldStr, newStr);
    fs.writeFileSync('src/js/page_admin.js', code, 'utf8');
    console.log('SUCCESS page_admin.js');
} else {
    console.log('NOT FOUND in page_admin.js!');
}
