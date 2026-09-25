const fs = require('fs');
let code = fs.readFileSync('temp/middle/src/routes/auth.ts', 'utf8');

const s = String.fromCharCode(36);
const newRecover = "// Password Recovery Request\n" +
"auth.post('/recover', async (c) => {\n" +
"  const { email } = await c.req.json()\n" +
"  \n" +
"  const doId = c.env.MONGO_DO.idFromName('global')\n" +
"  const db = c.env.MONGO_DO.get(doId) as any\n" +
"  const user = await db.findOne('users', { email: { [" + "`" + s + "regex`]: '^' + email + '$', [" + "`" + s + "options`]: 'i' } })\n" +
"  if (!user) return c.json({ error: 'User not found' }, 404)\n" +
"  \n" +
"  // Generate a long-lived JWT for magic login (1 week)\n" +
"  const loginToken = await sign({ id: user._id, email: user.email, role: user.role, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 }, c.env.JWT_SECRET)\n" +
"  const baseUrl = c.env.FRONTEND_URL || 'https://vnbusarchive.io.vn'\n" +
"  const loginUrl = baseUrl + '/?token=' + loginToken\n" +
"\n" +
"  // Send Email\n" +
"  const html = buildEmailHtml(\n" +
"    'Khôi phục / Đăng nhập không mật khẩu',\n" +
"    email,\n" +
"    '<p style=\"margin: 0;\">Bạn vừa yêu cầu đăng nhập không mật khẩu vào tài khoản VNBUSARCHIVE. Nhấn nút bên dưới để tự động đăng nhập. Nếu bạn quên mật khẩu, hãy truy cập Cài đặt -> Tài khoản -> Bảo mật để đổi mật khẩu mới sau khi đăng nhập thành công.</p>',\n" +
"    'Đăng nhập ngay',\n" +
"    loginUrl,\n" +
"    'Nếu nút bấm phía trên không hoạt động, vui lòng sao chép và dán đường dẫn này vào trình duyệt của bạn:'\n" +
"  )\n" +
"  await sendEmail(c.env.RESEND_API_KEY, email, 'Khôi phục / Đăng nhập không mật khẩu - VNBUSARCHIVE', html).catch(console.error)\n" +
"  \n" +
"  return c.json({ message: 'Recovery email sent' })\n" +
"})\n\n" +

"// Request Password Change OTP\n" +
"auth.post('/request-password-change-otp', authMiddleware, async (c) => {\n" +
"  const user = c.get('user')\n" +
"  const doId = c.env.MONGO_DO.idFromName('global')\n" +
"  const db = c.env.MONGO_DO.get(doId) as any\n" +
"  \n" +
"  const otp = Math.floor(100000 + Math.random() * 900000).toString()\n" +
"  const exp = new Date(Date.now() + 10 * 60 * 1000).toISOString()\n" +
"  \n" +
"  await db.updateOne('users', { _id: user.id }, { [" + "`" + s + "set`]: { password_reset_otp: otp, password_reset_otp_exp: exp } })\n" +
"  \n" +
"  const html = buildEmailHtml(\n" +
"    'Mã xác minh đổi mật khẩu',\n" +
"    user.email,\n" +
"    '<p style=\"margin: 0;\">Mã xác minh đổi mật khẩu của bạn là: <strong>' + otp + '</strong>. Mã này sẽ hết hạn sau 10 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>',\n" +
"    '',\n" +
"    '',\n" +
"    ''\n" +
"  )\n" +
"  await sendEmail(c.env.RESEND_API_KEY, user.email, 'Mã xác minh đổi mật khẩu - VNBUSARCHIVE', html).catch(console.error)\n" +
"  return c.json({ message: 'OTP sent' })\n" +
"})\n\n" +

"// Change Password with OTP\n" +
"auth.post('/change-password-otp', authMiddleware, async (c) => {\n" +
"  const user = c.get('user')\n" +
"  const { otp, new_password } = await c.req.json()\n" +
"  \n" +
"  const doId = c.env.MONGO_DO.idFromName('global')\n" +
"  const db = c.env.MONGO_DO.get(doId) as any\n" +
"  \n" +
"  const dbUser = await db.findOne('users', { _id: user.id })\n" +
"  if (!dbUser) return c.json({ error: 'User not found' }, 404)\n" +
"  \n" +
"  if (dbUser.password_reset_otp !== otp) return c.json({ error: 'Mã OTP không chính xác' }, 400)\n" +
"  if (new Date(dbUser.password_reset_otp_exp) < new Date()) return c.json({ error: 'Mã OTP đã hết hạn' }, 400)\n" +
"  \n" +
"  const hash = await bcrypt.hash(new_password, 10)\n" +
"  await db.updateOne('users', { _id: user.id }, { [" + "`" + s + "set`]: { password_hash: hash }, [" + "`" + s + "unset`]: { password_reset_otp: \"\", password_reset_otp_exp: \"\" } })\n" +
"  \n" +
"  return c.json({ message: 'Password changed successfully' })\n" +
"})\n";

const regex = /\/\/ Password Recovery Request[\s\S]*?\/\/ Change Email Request/;
code = code.replace(regex, newRecover + "\n  // Change Email Request");
fs.writeFileSync('temp/middle/src/routes/auth.ts', code);
console.log('Done!');
