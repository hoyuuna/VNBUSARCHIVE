const fs = require('fs');
let html = fs.readFileSync('_core.html', 'utf8');
const oldStr = '<h3 class="font-bold mb-3 text-base text-red-600 tracking-wide leading-relaxed"><i class="fa-solid fa-triangle-exclamation text-red-600 mr-1"></i> Ảnh của bạn <u class="uppercase font-bold">CÓ THỂ SẼ KHÔNG ĐƯỢC XUẤT HIỆN CÔNG KHAI</u> trên nền tảng, vui lòng tham khảo quy định kiểm duyệt dưới đây:</h3>';
const newStr = '<h3 class="font-bold mb-3 text-base text-amber-600 tracking-wide leading-relaxed"><i class="fa-solid fa-triangle-exclamation text-amber-600 mr-1"></i> Ảnh của bạn <u class="uppercase font-bold">CÓ THỂ SẼ KHÔNG ĐƯỢC XUẤT HIỆN CÔNG KHAI</u> trên nền tảng, vui lòng tham khảo quy định kiểm duyệt dưới đây:</h3>';
html = html.replace(oldStr, newStr);
fs.writeFileSync('_core.html', html, 'utf8');
