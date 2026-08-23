const fs = require('fs');
let code = fs.readFileSync('_core.html', 'utf8');

const regex = /<label class="block text-xs font-bold text-gray-700 uppercase mb-1">ID [^<]+<\/label>\s*<input type="text" id="route-edit-borrowed" class="([^"]+)" placeholder="[^"]+">\s*<p class="text-\[10px\] text-gray-500 mt-1 font-medium">[^<]+<\/p>/;

const replacement = `<label class="block text-xs font-bold text-gray-700 uppercase mb-1">ID ảnh / Xe vá tuyến</label>
                    <input type="text" id="route-edit-borrowed" class="$1" placeholder="VD: 12345, 12A34567" oninput="this.value = this.value.toUpperCase()">
                    <p class="text-[10px] text-gray-500 mt-1 font-medium">Nhập ID ảnh (VD: 123) hoặc Biển số xe (VD: 12A34567, 12A34567-1). Ngăn cách bằng dấu phẩy. Ảnh/Xe sẽ tự động được gán về tuyến này.</p>`;

if (regex.test(code)) {
    fs.writeFileSync('_core.html', code.replace(regex, replacement), 'utf8');
    console.log("Success HTML");
} else {
    console.log("Regex failed HTML");
}
