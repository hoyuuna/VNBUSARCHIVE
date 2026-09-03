const fs = require('fs');

let css = fs.readFileSync('public/css/dark.css', 'utf8');

css += `
/* FIX: Table row hover effect in dark mode */
.theme-dark tr:hover, 
.theme-dark tr:hover td,
.theme-dark tr:hover th {
    background-color: #27272a !important;
}
`;

fs.writeFileSync('public/css/dark.css', css);
console.log('dark.css updated with tr hover');
