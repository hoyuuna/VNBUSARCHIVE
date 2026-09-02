const fs = require('fs');

// 1. Fix X button in _core.html
let html = fs.readFileSync('_core.html', 'utf8');
html = html.replace(
    'class="absolute top-4 right-4 text-black bg-white border border-black hover:text-red-600 text-3xl z-[4010] p-2 rounded-lg transition-transform active:scale-90"',
    'class="absolute top-4 right-4 text-black hover:text-red-600 text-3xl z-[4010] p-2 transition-transform active:scale-90"'
);
fs.writeFileSync('_core.html', html);

// 2. Add amber alerts (and others) to light.css
let css = fs.readFileSync('public/css/light.css', 'utf8');
const extraAlerts = `
/* Additional Tailwind colors for inline alerts */
.bg-amber-50, .bg-amber-100 { border: 1px solid #18181b !important; }
.border-amber-200, .border-amber-300 { border-color: #18181b !important; }

.bg-indigo-50, .bg-indigo-100 { border: 1px solid #18181b !important; }
.border-indigo-200, .border-indigo-300 { border-color: #18181b !important; }

.bg-emerald-50, .bg-emerald-100 { border: 1px solid #18181b !important; }
.border-emerald-200, .border-emerald-300 { border-color: #18181b !important; }
`;

css += extraAlerts;
fs.writeFileSync('public/css/light.css', css);

console.log('Fixed X button and added amber alert styles.');
