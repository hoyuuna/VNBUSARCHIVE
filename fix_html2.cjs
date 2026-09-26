const fs = require('fs');
let html = fs.readFileSync('_core.html', 'utf8');
const regex = /<h3 class="font-bold mb-3 text-sm uppercase text-black tracking-wide">\s*<i class="fa-solid fa-book text-black mr-1"><\/i>\s*QUY ĐỊNH UPLOAD\s*<\/h3>/g;
const newStr = '<h3 class="font-bold mb-3 text-base text-red-600 tracking-wide leading-relaxed"><i class="fa-solid fa-triangle-exclamation text-red-600 mr-1"></i> Ảnh của bạn <u class="uppercase font-bold">CÓ THỂ SẼ KHÔNG ĐƯỢC XUẤT HIỆN CÔNG KHAI</u> trên nền tảng, vui lòng tham khảo quy định kiểm duyệt dưới đây:</h3>';
html = html.replace(regex, newStr);
fs.writeFileSync('_core.html', html, 'utf8');
