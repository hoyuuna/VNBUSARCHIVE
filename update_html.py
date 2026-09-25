# -*- coding: utf-8 -*-
import re
with open('_core.html', 'r', encoding='utf-8') as f:
    code = f.read()

# Change Quên mật khẩu? text
code = re.sub(
    r"Quên mật khẩu\?</button>",
    "Khôi phục / Đăng nhập không mật khẩu</button>",
    code
)

code = re.sub(
    r"<input type=\"password\" id=\"set-cp-old\".*?<button onclick=\"app\.auth\.changePassword\(\)\"",
    '''<input type="password" id="set-cp-new" placeholder="Mật khẩu mới (Tối thiểu 6 kí tự)" class="w-full border border-gray-300 p-2.5 text-sm rounded-md focus:ring-2 focus:ring-black outline-none"><input type="password" id="set-cp-new2" placeholder="Nhập lại mật khẩu mới" class="w-full border border-gray-300 p-2.5 text-sm rounded-md focus:ring-2 focus:ring-black outline-none"><div id="set-cp-otp-box" class="hidden space-y-3 pt-2"><p class="text-[11px] text-gray-500">Mã OTP 6 số đã được gửi tới email của bạn.</p><input type="text" id="set-cp-otp" placeholder="Nhập mã OTP 6 số" maxlength="6" class="w-full border border-gray-300 p-2.5 text-sm rounded-md focus:ring-2 focus:ring-black outline-none tracking-widest text-center"></div><button id="set-cp-btn" onclick="app.auth.changePassword()" ''',
    code,
    flags=re.DOTALL
)

with open('_core.html', 'w', encoding='utf-8') as f:
    f.write(code)
