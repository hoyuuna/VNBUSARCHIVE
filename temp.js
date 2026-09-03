const fs = require('fs');

const overrides = `
/* ===== FIX: PAGINATION (Phân trang) ===== */
.page-btn {
    border: 1px solid #18181b !important;
    color: #18181b !important;
}
.page-btn:hover:not(:disabled):not(.active) {
    background-color: #f4f4f5 !important;
}
.page-btn.active, .page-btn.active:hover {
    background: #18181b !important;
    color: #ffffff !important;
    border-color: #18181b !important;
}
.page-btn.dots {
    border: none !important;
    background: transparent !important;
}
`;

let css = fs.readFileSync('public/css/light.css', 'utf8');

if (!css.includes('/* ===== FIX: PAGINATION (Phân trang) ===== */')) {
    css += overrides;
    fs.writeFileSync('public/css/light.css', css);
    console.log('Added Pagination flat UI overrides.');
} else {
    const start = css.indexOf('/* ===== FIX: PAGINATION (Phân trang) ===== */');
    css = css.substring(0, start) + overrides;
    fs.writeFileSync('public/css/light.css', css);
    console.log('Replaced Pagination flat UI overrides.');
}
