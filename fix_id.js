const fs = require('fs');

let c = fs.readFileSync('src/js/00_core.js', 'utf8');
c = c.replace(/eq\('id', 1\)/g, "eq('id', 'SYSTEM_MAIN')");
fs.writeFileSync('src/js/00_core.js', c);

let a = fs.readFileSync('src/js/page_admin.js', 'utf8');
a = a.replace(/eq\('id', 1\)/g, "eq('id', 'SYSTEM_MAIN')");
fs.writeFileSync('src/js/page_admin.js', a);

console.log("Done");
