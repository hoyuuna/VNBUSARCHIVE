const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
console.log(escapeRegExp('Kim Long B60-EV (2026)'));
// Result: Kim Long B60\-EV \(2026\)

// Let's create an in-memory test.
const test = 'Kim Long B60-EV (2026)';
const regex = new RegExp(escapeRegExp(test), 'i');
console.log(regex.test(test)); // TRUE
