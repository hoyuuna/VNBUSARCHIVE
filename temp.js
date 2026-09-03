const fs = require('fs');

const overrides = `
/* Override thêm cho Admin Card */
.admin-card {
    border: 1px solid #18181b !important;
    box-shadow: none !important;
}
.admin-card-header {
    border-bottom: 1px solid #18181b !important;
}
.admin-input {
    border: 1px solid #18181b !important;
}

/* Fix viền admin-content .border-gray-200 */
#admin-content .border-gray-200,
#admin-content .border-y {
    border-color: #18181b !important;
}
`;

let css = fs.readFileSync('public/css/light.css', 'utf8');
css += overrides;
fs.writeFileSync('public/css/light.css', css);
console.log('Added .admin-card overrides');
