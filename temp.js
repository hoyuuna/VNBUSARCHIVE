const fs = require('fs');
const html = fs.readFileSync('_core.html', 'utf8');
const lines = html.split('\n');
lines.forEach((l, i) => {
    if (l.includes('-webkit-')) {
        console.log(`Line ${i}: ${l.trim()}`);
    }
});
