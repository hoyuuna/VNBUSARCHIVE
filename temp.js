const fs = require('fs');
let css = fs.readFileSync('public/css/dark.css', 'utf8');

// I will just completely clean the end of the file and append exactly what I want.
const cleanPoint = css.indexOf('/* FIX: Header links in dark mode */');
if (cleanPoint > -1) {
    css = css.substring(0, cleanPoint);
}

css += `/* FIX: Header links in dark mode */
.theme-dark .nav-link {
    color: #d4d4d8 !important; /* Xám sáng */
}
.theme-dark .nav-link:hover {
    color: #ffffff !important;
}

/* FIX: Table row hover effect in dark mode (prevent trắng móc on hover) */
.theme-dark tr:hover, 
.theme-dark tr:hover td,
.theme-dark tr:hover th {
    background-color: #27272a !important;
}

/* FIX: Ensure divide lines are dark gray instead of white to prevent glaring borders */
.theme-dark .divide-gray-100 > :not([hidden]) ~ :not([hidden]),
.theme-dark .divide-gray-200 > :not([hidden]) ~ :not([hidden]) {
    border-color: #3f3f46 !important;
}

/* FIX: Force light mode gray borders to be dark gray instead of stark white */
.theme-dark .border-gray-100,
.theme-dark .border-gray-200,
.theme-dark .border-gray-300 {
    border-color: #3f3f46 !important;
}
`;

fs.writeFileSync('public/css/dark.css', css);
console.log('Cleaned and fixed dark.css perfectly');
