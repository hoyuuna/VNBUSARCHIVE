const fs = require('fs');
let content = fs.readFileSync('src/js/page_vehicle.js', 'utf8');

content = content.replace(
    /if \(!rawDate \|\| !op\) return app\.ui\.showAlert\([^;]+\);\r?\n\s*if \(!dateVal\) return app\.ui\.showAlert\([^;]+\);/,
    "if (!rawDate || !op || !dateVal) { /* Silently ignore incomplete new item */ } else {"
);
fs.writeFileSync('src/js/page_vehicle.js', content, 'utf8');
