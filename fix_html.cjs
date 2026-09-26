const fs = require('fs');
let html = fs.readFileSync('_core.html', 'utf8');
const oldStr = '<h3 class="font-bold mb-3 text-sm uppercase text-black tracking-wide">\n                            <i class="fa-solid fa-book text-black mr-1"></i> QUY Ð?NH UPLOAD\n                        </h3>';
const newStr = '<h3 class="font-bold mb-3 text-base text-red-600 tracking-wide leading-relaxed"><i class="fa-solid fa-triangle-exclamation text-red-600 mr-1"></i> ?nh c?a b?n <u class="uppercase font-bold">CÓ TH? S? KHÔNG ÐU?C XU?T HI?N CÔNG KHAI</u> trên n?n t?ng, vui lòng tham kh?o quy d?nh ki?m duy?t du?i dây:</h3>';
html = html.replace(oldStr, newStr);
fs.writeFileSync('_core.html', html, 'utf8');
