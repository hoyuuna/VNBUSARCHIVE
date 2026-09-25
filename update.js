const fs = require('fs');
let code = fs.readFileSync('src/js/00_core.js', 'utf8');

const regex = /\} else if \(path === '\/reset-password'\) \{[\s\S]*?app\.views\.switch\('reset-password', false\);/g;
code = code.replace(regex, '');

const regex2 = / && path !== '\/reset-password'/g;
code = code.replace(regex2, '');

fs.writeFileSync('src/js/00_core.js', code);
console.log('Removed /reset-password from 00_core.js');
