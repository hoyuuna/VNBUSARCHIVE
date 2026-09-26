const fs = require('fs');
let code = fs.readFileSync('_core.html', 'utf8');

// Insert window.INITIAL_HASH before initializing app
code = code.replace(
    /<script>\s*document\.addEventListener\('DOMContentLoaded'/g,
    `<script>\n        window.INITIAL_HASH = window.location.hash;\n        document.addEventListener('DOMContentLoaded'`
);

fs.writeFileSync('_core.html', code);

let routerCode = fs.readFileSync('src/js/01_router.js', 'utf8');
routerCode = routerCode.replace(/const hash = window\.location\.hash;/g, 'const hash = window.INITIAL_HASH || window.location.hash;');
fs.writeFileSync('src/js/01_router.js', routerCode);
