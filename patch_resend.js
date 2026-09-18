const fs = require('fs');
let text = fs.readFileSync('temp/middle/src/routes/auth.ts', 'utf8');

const injection = `
// Resend Confirmation Email
auth.post('/resend', async (c) => {
  const { email } = await c.req.json();
  const doId = c.env.MONGO_DO.idFromName('global');
  const db = c.env.MONGO_DO.get(doId) as any;
  const user = await db.findOne('users', { email: { $regex: "^" + email + "$", $options: "i" } });
  
  if (!user) return c.json({ error: 'User not found' }, 404);
  if (user.confirmed_at) return c.json({ message: 'Email already confirmed' });

  const confirmToken = await sign({ id: user._id, purpose: 'email_confirm', exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 }, c.env.JWT_SECRET);
  const apiBase = new URL(c.req.url).origin + '/api';
  const confirmUrl = \`\${apiBase}/auth/verify-email?token=\${confirmToken}\`;

  const html = buildEmailHtml(
    'Xác minh d?a ch? Email',
    email,
    '<p style="margin: 0;">B?n v?a yêu c?u g?i l?i email xác minh tài kho?n VNBUSARCHIVE. Vui lòng xác minh d?a ch? email c?a b?n b?ng cách nh?n vào nút bên du?i.</p>',
    'Xác nh?n Email ngay',
    confirmUrl
  );
  
  await sendEmail(c.env.RESEND_API_KEY, email, 'Xác minh d?a ch? Email - VNBUSARCHIVE', html).catch(console.error);
  
  return c.json({ message: 'Confirmation email sent' });
});
`;

text = text.replace('auth.get(\'/verify-email\', async (c) => {', injection + '\nauth.get(\'/verify-email\', async (c) => {');
fs.writeFileSync('temp/middle/src/routes/auth.ts', text, 'utf8');
