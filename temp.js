const fs = require('fs');
const html = fs.readFileSync('public/index.html', 'utf8');
const m = html.match(/href="[^"]*light[^"]*"/);
console.log('CSS ref:', m ? m[0] : 'NOT FOUND');
const m2 = html.match(/src="\/app\.js[^"]*"/);
console.log('JS ref:', m2 ? m2[0] : 'NOT FOUND');
