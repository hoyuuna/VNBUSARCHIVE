const fs = require('fs');
let js = fs.readFileSync('src/js/4_content.js', 'utf8');

js = js.replace(/setTheme:\s*\(\s*theme\s*\)\s*=>\s*\{/, 
`setTheme: (theme) => {
                    if (theme === 'dark') theme = 'light'; // TEMPORARILY FORCE LIGHT
`);

fs.writeFileSync('src/js/4_content.js', js);
console.log('Forced light mode in 4_content.js.');
