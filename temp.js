const fs = require('fs');
let light = fs.readFileSync('public/css/light.css', 'utf8');
light = light.replace(/background-attachment:\s*fixed\s*!important;\n?/g, '');
fs.writeFileSync('public/css/light.css', light);

let dark = fs.readFileSync('public/css/dark.css', 'utf8');
dark = dark.replace(/background-attachment:\s*fixed\s*!important;\n?/g, '');
fs.writeFileSync('public/css/dark.css', dark);

console.log('Removed background-attachment: fixed from both CSS files.');
