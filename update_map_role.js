const fs = require('fs');
let code = fs.readFileSync('src/js/page_map.js', 'utf8');

const roleRegex = /const\s*\{\s*data\s*\}\s*=\s*await\s*window\.sb\.from\('profiles'\)\.select\('role'\)\.eq\('id',\s*app\.user\.id\)\.single\(\);\s*if\s*\(data\s*&&\s*\(data\.role\s*===\s*'admin'\s*\|\|\s*data\.role\s*===\s*'manager'\)\)\s*\{/g;
code = code.replace(roleRegex, `if (app.role === 'admin' || app.role === 'manager') {`);

fs.writeFileSync('src/js/page_map.js', code);
console.log('Updated role check in page_map.js');
