const fs = require('fs');
let code = fs.readFileSync('_core.html', 'utf8');

const oldText = 'Định dạng: x.xxxđ hoặc "Miễn phí". HN mới: "3.000đ mở cửa + 450đ x km". TPHCM: Ghi khoảng giá (VD: 5.000đ - 7.000đ).';
const newText = 'Định dạng: x.xxxđ hoặc "Miễn phí" hoặc khoảng giá (VD: 5.000đ - 7.000đ). HN mới: "3.000đ mở cửa + 450đ x km".';

if (code.includes(oldText)) {
    code = code.replace(oldText, newText);
    fs.writeFileSync('_core.html', code, 'utf8');
    console.log('Success _core.html');
} else {
    console.log('Not found in _core.html');
}
