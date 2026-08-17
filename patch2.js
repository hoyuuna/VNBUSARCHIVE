const fs = require('fs');
const file = 'src/js/1_init.js';
let content = fs.readFileSync(file, 'utf8');

const regex = /if\s*\(subroles\s*&&\s*subroles\.includes\('dev'\)\)\s*\{\s*html\s*\+=\s*`<span class="badge-shiny" style="background:\s*linear-gradient\(135deg,\s*#22c55e,\s*#15803d\);"\s*title="Developer"><i class="fa-solid fa-code mr-1 text-\[10px\]"><\/i>\s*Dev<\/span>`;\s*\}/g;

if (regex.test(content)) {
    content = content.replace(regex, '');
    fs.writeFileSync(file, content);
    console.log('Fixed 1_init.js successfully');
} else {
    console.log('Pattern not found');
}
