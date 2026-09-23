const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const sqlToRegex = (sqlStr) => sqlStr ? sqlStr.split('%').map(escapeRegExp).join('.*') : '';

console.log(sqlToRegex('Kim Long B60-EV (2026)'));
console.log(sqlToRegex('Kim Long B60-EV (2026'));
