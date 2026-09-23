const fs = require('fs');
let c = fs.readFileSync('src/js/00_core.js', 'utf8');

c = c.replace('const headers = { "Content-Type": "application/json" };', 'const headers = { "Content-Type": "application/json", "x-api-key": "VNBUS-AUTH-KEY-2026" };');
fs.writeFileSync('src/js/00_core.js', c);
