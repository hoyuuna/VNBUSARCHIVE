const fs = require('fs');
let code = fs.readFileSync('src/js/3_views.js', 'utf8');

const regex = /const removedPhotos = curBorrowed\.filter\(p => removedIds\.includes\(p\.id\)\);/;
const replacement = `const removedPhotos = curBorrowed.filter(p => finalRemovedIds.includes(p.id));`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/js/3_views.js', code, 'utf8');
console.log("3_views.js removedPhotos updated");
