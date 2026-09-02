const fs = require('fs');
const lines = fs.readFileSync('_core.html', 'utf8').split('\n');
// Find the actual crop-modal div
const start = lines.findIndex(l => l.includes('id="crop-modal"'));
console.log('Start:', start);
console.log(lines.slice(start, start + 15).join('\n'));
