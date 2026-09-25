const fs = require('fs');
let code = fs.readFileSync('src/js/01_router.js', 'utf8');

code = code.replace(/app\.setRealtimeStatus\(false\);\s*if \(typeof app\.initRealtimeChannel === 'function'\)/g, "if (typeof app.initRealtimeChannel === 'function')");
fs.writeFileSync('src/js/01_router.js', code);
console.log('Fixed router');
