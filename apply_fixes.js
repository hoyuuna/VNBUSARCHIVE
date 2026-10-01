const fs = require('fs');

// 1. Fix 02_settings.js
let settings = fs.readFileSync('src/js/02_settings.js', 'utf8');
settings = settings.replace('identity ? identity.identity_id : null', 'identity ? (identity.id || identity.identity_id) : null');
fs.writeFileSync('src/js/02_settings.js', settings, 'utf8');

// 2. Fix _core.html
let html = fs.readFileSync('_core.html', 'utf8');
// Hide OAuth buttons on Sign Up tab (2d1e920)
html = html.replace(
    /onclick="app\.auth\.switchTab\('register'\)"[^>]*>Đăng ký<\/button>/,
    'onclick="app.auth.switchTab(\'register\'); document.getElementById(\'oauth-buttons-container\').classList.add(\'hidden\');" class="flex-1 pb-3 text-sm font-bold text-gray-500 border-b-2 border-transparent hover:text-gray-900 transition-colors">Đăng ký</button>'
);
html = html.replace(
    /onclick="app\.auth\.switchTab\('login'\)"[^>]*>Đăng nhập<\/button>/,
    'onclick="app.auth.switchTab(\'login\'); document.getElementById(\'oauth-buttons-container\').classList.remove(\'hidden\');" class="flex-1 pb-3 text-sm font-bold text-black border-b-2 border-black transition-colors">Đăng nhập</button>'
);

// Update blur warning text (6e5f109)
const oldBlurWarning = "Vùng làm mờ/che vật thể tuyệt đối không được đè lên bất kỳ bộ phận nào của xe (thân xe, bánh xe, kính, đèn...), tránh làm ảnh hưởng đến tính toàn vẹn và chi tiết của chủ thể.";
const newBlurWarning = "Vùng làm mờ/che vật thể tuyệt đối không được đè lên bất kỳ bộ phận nào của xe (thân xe, bánh xe, kính, đèn...), không được có kích thước quá lớn tránh làm ảnh hưởng đến tính toàn vẹn và chi tiết của chủ thể. Vui lòng:<br>- Chỉ che mặt, không che toàn thân trừ trường hợp quá nhạy cảm.<br>- Không che BKS xe lưu thông bình thường khác.<br>- Không dùng chung 1 ô che cho nhiều khuôn mặt khác nhau.";
html = html.replace(new RegExp(oldBlurWarning.replace(/[.*+?^$|{}()[\\]\\\\]/g, '\\\\$&'), 'g'), newBlurWarning);
fs.writeFileSync('_core.html', html, 'utf8');

// 3. Fix page_vehicle.js and page_feed.js logic!
