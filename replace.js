const fs = require('fs');

let code = fs.readFileSync('temp/middle/src/routes/auth.ts', 'utf8');

const newRecover = `auth.post('/recover', async (c) => {
  const { email } = await c.req.json()
  
  const doId = c.env.MONGO_DO.idFromName('global')
  const db = c.env.MONGO_DO.get(doId) as any
  const user = await db.findOne('users', { email: { $regex: "^" + email + "$", $options: "i" } })
  if (!user) return c.json({ error: 'User not found' }, 404)
  
  // Generate a long-lived JWT for magic login (1 week)
  const loginToken = await sign({ id: user._id, email: user.email, role: user.role, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 }, c.env.JWT_SECRET)
  const baseUrl = c.env.FRONTEND_URL || 'https://vnbusarchive.io.vn'
  const loginUrl = baseUrl + '/?token=' + loginToken

  // Send Email
  const html = buildEmailHtml(
    'Khôi phục / Đăng nhập không mật khẩu',
    email,
    '<p style="margin: 0;">Bạn vừa yêu cầu đăng nhập không mật khẩu vào tài khoản VNBUSARCHIVE. Nhấn nút bên dưới để tự động đăng nhập. Nếu bạn quên mật khẩu, hãy truy cập Cài đặt -> Tài khoản -> Bảo mật để đổi mật khẩu mới sau khi đăng nhập thành công.</p>',
    'Đăng nhập ngay',
    loginUrl,
    'Nếu nút bấm phía trên không hoạt động, vui lòng sao chép và dán đường dẫn này vào trình duyệt của bạn:'
  )
  await sendEmail(c.env.RESEND_API_KEY, email, 'Khôi phục / Đăng nhập không mật khẩu - VNBUSARCHIVE', html).catch(console.error)
  
  return c.json({ message: 'Recovery email sent' })
})

// Request Password Change OTP
auth.post('/request-password-change-otp', authMiddleware, async (c) => {
  const user = c.get('user')
  const doId = c.env.MONGO_DO.idFromName('global')
  const db = c.env.MONGO_DO.get(doId) as any
  
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  const exp = new Date(Date.now() + 10 * 60 * 1000).toISOString()
  
  await db.updateOne('users', { _id: user.id }, { $set: { password_reset_otp: otp, password_reset_otp_exp: exp } })
  
  const html = buildEmailHtml(
    'Mã xác minh đổi mật khẩu',
    user.email,
    '<p style="margin: 0;">Mã xác minh đổi mật khẩu của bạn là: <strong>' + otp + '</strong>. Mã này sẽ hết hạn sau 10 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>',
    '',
    '',
    ''
  )
  await sendEmail(c.env.RESEND_API_KEY, user.email, 'Mã xác minh đổi mật khẩu - VNBUSARCHIVE', html).catch(console.error)
  return c.json({ message: 'OTP sent' })
})

// Change Password with OTP
auth.post('/change-password-otp', authMiddleware, async (c) => {
  const user = c.get('user')
  const { otp, new_password } = await c.req.json()
  
  const doId = c.env.MONGO_DO.idFromName('global')
  const db = c.env.MONGO_DO.get(doId) as any
  
  const dbUser = await db.findOne('users', { _id: user.id })
  if (!dbUser) return c.json({ error: 'User not found' }, 404)
  
  if (dbUser.password_reset_otp !== otp) return c.json({ error: 'Mã OTP không chính xác' }, 400)
  if (new Date(dbUser.password_reset_otp_exp) < new Date()) return c.json({ error: 'Mã OTP đã hết hạn' }, 400)
  
  const hash = await bcrypt.hash(new_password, 10)
  await db.updateOne('users', { _id: user.id }, { $set: { password_hash: hash }, $unset: { password_reset_otp: "", password_reset_otp_exp: "" } })
  
  return c.json({ message: 'Password changed successfully' })
})`;

// find start index of auth.post('/recover'
const startIdx = code.indexOf("auth.post('/recover'");

// find end index which is just before // Change Email Request
const endIdx = code.indexOf("// Change Email Request");

if (startIdx !== -1 && endIdx !== -1) {
    const before = code.substring(0, startIdx);
    const after = code.substring(endIdx);
    code = before + newRecover + "\n\n  " + after;
    fs.writeFileSync('temp/middle/src/routes/auth.ts', code);
    console.log("Success");
} else {
    console.log("Could not find start or end index", startIdx, endIdx);
}
