const fs = require('fs');

const overrides2 = `
/* ===== FIX: UI BORDERS & SEPARATORS (Bảng tin, Cài đặt, Chi tiết ảnh, Dropdown) ===== */

/* 1. BẢNG TIN HỆ THỐNG & CÀI ĐẶT */
#newsboard-content .border-gray-200\\/50,
#settings-content .border-gray-200\\/50,
#newsboard-content .border-gray-200,
#settings-content .border-gray-200,
#newsboard-content .border-gray-300,
#settings-content .border-gray-300,
#newsboard-toc, #set-menu-main {
    border-color: #18181b !important;
}

#newsboard-content .border-b,
#newsboard-content .border-r,
#settings-content .border-b,
#settings-content .border-r {
    border-color: #18181b !important;
}

/* Các nút trong sidebar cài đặt (trạng thái bình thường - override border-gray-200) */
#set-menu-main button.border-gray-200,
#set-menu-account button.border-gray-200,
#set-menu-docs button.border-gray-200 {
    border-color: #18181b !important;
}

/* Tab cài đặt đang active (JS gán bg-black text-white border-black) */
#set-menu-main button.bg-black,
#set-menu-account button.bg-black,
#set-menu-docs button.bg-black {
    background-color: #18181b !important;
    color: #ffffff !important;
    border-color: #18181b !important;
}
#set-menu-main button.bg-black i,
#set-menu-account button.bg-black i,
#set-menu-docs button.bg-black i {
    color: #ffffff !important;
}

/* Nút News card (Bảng tin) */
.news-card {
    border: 1px solid #18181b !important;
    margin-bottom: 8px;
}
.news-card.active {
    border-left: 1px solid #18181b !important;
    background-color: #18181b !important;
    color: #ffffff !important;
}
.news-card.active h4, .news-card.active p, .news-card.active span, .news-card.active i {
    color: #ffffff !important;
}

/* Nền modal Bảng tin & Cài đặt */
#newsboard-content .bg-white\\/30,
#newsboard-content .bg-gray-50\\/30,
#settings-content .bg-white\\/30,
#settings-content .bg-gray-50\\/30 {
    background-color: #ffffff !important;
}

/* 2. CHI TIẾT ẢNH & ẢNH TÂM ĐẮC */
/* Khung ảnh chi tiết (detail-image) */
#detail-img,
#detail-img-container,
#detail .aspect-\\[16\\/10\\],
#detail .aspect-\\[4\\/3\\],
#detail .aspect-\\[3\\/2\\],
#detail .aspect-\\[1\\/1\\] {
    border: 1px solid #18181b !important;
    box-sizing: border-box;
}

/* Ảnh tâm đắc trên Profile */
#profile-fav-photo-container,
#profile-fav-photo-container img,
#fav-photo-preview-img {
    border: 1px solid #18181b !important;
}

/* Khung chứa ảnh tâm đắc Profile (đang có border-gray-200/60) */
.border-gray-200\\/60 {
    border-color: #18181b !important;
}

/* Khung ảnh model preview trong upload */
#up-model-preview .border-gray-300 {
    border-color: #18181b !important;
}

/* 3. DROPDOWN (Search, Filter, v.v) */
/* Khung ngoài dropdown */
.suggestion-box,
.filter-menu,
#user-dropdown,
.dropdown-menu {
    border: 1px solid #18181b !important;
    box-shadow: none !important;
    background-color: #ffffff !important;
}

/* Phân cách giữa các item trong dropdown */
.suggestion-box .suggestion-item,
.filter-menu button,
.filter-menu a,
#user-dropdown a,
#user-dropdown button {
    border-bottom: 1px solid #18181b !important;
    border-radius: 0 !important;
    margin: 0 !important;
}
/* Xoá viền dưới cùng của item cuối */
.suggestion-box .suggestion-item:last-child,
.filter-menu button:last-child,
.filter-menu a:last-child,
#user-dropdown a:last-child,
#user-dropdown button:last-child {
    border-bottom: none !important;
}
`;

let css = fs.readFileSync('public/css/light.css', 'utf8');

if (css.includes('/* ===== FIX: UI BORDERS & SEPARATORS (Bảng tin, Cài đặt, Chi tiết ảnh, Dropdown) ===== */')) {
    const startIndex = css.indexOf('/* ===== FIX: UI BORDERS & SEPARATORS (Bảng tin, Cài đặt, Chi tiết ảnh, Dropdown) ===== */');
    css = css.substring(0, startIndex);
}

css += overrides2;
fs.writeFileSync('public/css/light.css', css);
console.log('Successfully updated light.css without breaking JS active tabs.');
