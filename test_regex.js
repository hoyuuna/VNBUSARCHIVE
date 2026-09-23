const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const sqlToRegex = (sqlStr) => sqlStr.split('%').map(escapeRegExp).join('.*');

const q = 'Kim Long B60-EV (2026)';
const regex = sqlToRegex(q);
console.log('Regex:', regex);

fetch('https://api.vnbusarchive.io.vn/api/vehicles?model=ilike.%25' + encodeURIComponent(q) + '%25').then(r=>r.json()).then(j => console.log('Vehicles:', j.data.length));
