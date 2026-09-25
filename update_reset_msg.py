# -*- coding: utf-8 -*-
import re
with open('src/js/03_auth.js', 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace("Link khôi phục mật khẩu đã được gửi đến", "Link đăng nhập không mật khẩu đã được gửi đến")

with open('src/js/03_auth.js', 'w', encoding='utf-8') as f:
    f.write(code)
