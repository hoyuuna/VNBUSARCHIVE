const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const r = escapeRegExp('Kim Long B60-EV (2026)');
const regex = new RegExp(r);
console.log(regex.test('Kim Long B60-EV (2026)'));
