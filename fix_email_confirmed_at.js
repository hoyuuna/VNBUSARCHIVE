const fs = require('fs');
let text = fs.readFileSync('temp/middle/src/routes/auth.ts', 'utf8');

text = text.replace(/user\.confirmed_at/g, 'user.email_confirmed_at');
text = text.replace(/confirmed_at:/g, 'email_confirmed_at:');

fs.writeFileSync('temp/middle/src/routes/auth.ts', text, 'utf8');
