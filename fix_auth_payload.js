const fs = require('fs');
let text = fs.readFileSync('temp/middle/src/middlewares/auth.ts', 'utf8');

text = text.replace("c.set('user', payload)", "c.set('user', userProfile)");

fs.writeFileSync('temp/middle/src/middlewares/auth.ts', text, 'utf8');
