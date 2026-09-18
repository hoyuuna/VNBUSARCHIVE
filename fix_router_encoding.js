const fs = require('fs');

let text = fs.readFileSync('src/js/01_router.js', 'utf8');
text = text.replace("Ti kho?n chua du?c dang k. Vui lng t?o ti kho?n m?i.", "Tài khoản chưa được đăng ký. Vui lòng tạo tài khoản mới.");
text = text.replace("Khng l?y du?c email t? nh cung c?p. Vui lng th? l?i.", "Không lấy được email từ nhà cung cấp. Vui lòng thử lại.");
text = text.replace("ang nh?p th?t b?i. Vui lng th? l?i.", "Đăng nhập thất bại. Vui lòng thử lại.");
fs.writeFileSync('src/js/01_router.js', text, 'utf8');
