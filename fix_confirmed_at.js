const fs = require('fs');
let text = fs.readFileSync('temp/middle/src/routes/auth.ts', 'utf8');

text = text.replace(/user\.subroles \} \}\)/g, 'user.subroles, email_confirmed_at: user.confirmed_at } })');

fs.writeFileSync('temp/middle/src/routes/auth.ts', text, 'utf8');
