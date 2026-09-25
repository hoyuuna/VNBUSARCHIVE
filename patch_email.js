const fs = require('fs');
let code = fs.readFileSync('temp/middle/src/routes/auth.ts', 'utf8');
const original = "magicUrl,\n        'Đăng nhập ngay'";
const target = "'Đăng nhập ngay',\n        magicUrl";
code = code.replace(original, target);
// fallback if encoding issue
code = code.replace(/magicUrl,\s+['"]Đăng nhập ngay['"]/g, "'Đăng nhập ngay',\n        magicUrl");
// fallback for utf-8 weirdness
code = code.replace(/magicUrl,\s+['"]\u0110\u0103ng nh\u1EADp ngay['"]/g, "'\u0110\u0103ng nh\u1EADp ngay',\n        magicUrl");
// Let's just do a string replacement that catches the actual file contents (since it might be encoded differently)
fs.writeFileSync('temp/middle/src/routes/auth.ts', code);
