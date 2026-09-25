const fs = require('fs');
let code = fs.readFileSync('temp/middle/src/routes/map.ts', 'utf8');

const s = String.fromCharCode(36);

// Map _id to id in GET /zones
const getZonesRegex = /const results = await db\.find\('no_photo_zones',\s*\{\},\s*\{\s*limit: 500\s*\}\);/;
code = code.replace(getZonesRegex, "const results = await db.find('no_photo_zones', {}, { limit: 500 });\n  results.forEach((r: any) => { r.id = r._id; });");

// Fix my dumb template literal string bug in previous file
code = code.replace(/\[\s*`\$\{s\}set`\s*\]/g, '$set');

fs.writeFileSync('temp/middle/src/routes/map.ts', code);
console.log('Updated map.ts again');
