const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const r = escapeRegExp('Kim Long B60-EV (2026)');
console.log(r);
console.log(r.length);
