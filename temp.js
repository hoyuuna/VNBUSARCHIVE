const fs = require('fs');
let html = fs.readFileSync('_core.html', 'utf8');

// Replace the broken -webkit- box-shadow in inline styles
html = html.replace(/;\s*-webkit-\s*box-shadow:\s*0\s*10px\s*30px\s*rgba\(0,\s*0,\s*0,\s*0\.1\)\s*!important;/g, '');
html = html.replace(/style="\s*-webkit-\s*box-shadow:\s*0\s*10px\s*30px\s*rgba\(0,\s*0,\s*0,\s*0\.1\)\s*!important;"/g, '');

fs.writeFileSync('_core.html', html);
console.log('Cleaned up broken box-shadow styles.');
