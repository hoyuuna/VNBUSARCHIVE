const fs = require('fs');

let auth = fs.readFileSync('temp/middle/src/routes/auth.ts', 'utf8');
auth = auth.replace("auth.post('/reset-password', async (c) => {\r\n  const { token, new_password }", "auth.post('/reset-password-verify', async (c) => {\r\n  const { token, new_password }");
auth = auth.replace("auth.post('/reset-password', async (c) => {\n  const { token, new_password }", "auth.post('/reset-password-verify', async (c) => {\n  const { token, new_password }");
fs.writeFileSync('temp/middle/src/routes/auth.ts', auth);

let c = fs.readFileSync('src/js/00_core.js', 'utf8');
c = c.replace(/app\.api\.post\("\/api\/auth\/reset-password",/g, 'app.api.post("/api/auth/reset-password-verify",');
fs.writeFileSync('src/js/00_core.js', c);

console.log('Done replacement');
