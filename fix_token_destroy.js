const fs = require('fs');
let text = fs.readFileSync('src/js/00_core.js', 'utf8');

text = text.replace(
    /if \(app\.role === 'manager'\) \{\s*sessionStorage\.setItem\('VNBA_SESS_AUTH', 'active'\);\s*\} else \{\s*sessionStorage\.removeItem\('VNBA_SESS_AUTH'\);\s*\}/,
    '// Removed legacy VNBA_SESS_AUTH flag handling that destroyed the JWT token'
);

fs.writeFileSync('src/js/00_core.js', text, 'utf8');
