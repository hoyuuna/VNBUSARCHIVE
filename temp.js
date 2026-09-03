const fs = require('fs');
let text = fs.readFileSync('.agents/AGENTS.md', 'utf8');

const newRule = `
## Flat UI & Border Rules (NEW INVARIANT)
- **100% Flat UI:** The system now strictly uses a Flat UI design. There should be NO transparent glassmorphism, NO gray borders (\`border-gray-200/300\`), NO soft backgrounds for modals, and NO shadow depth. Everything must use solid \`1px solid #18181b\` (black) borders and pure white (\`#ffffff\`) backgrounds for popup/modal bodies.
- **Double Border Prevention (Đè Nét):** When applying borders to components, BE EXTREMELY CAREFUL to avoid "double borders" (2px thick borders caused by two adjacent elements both having 1px borders, e.g., a header with \`border-b\` sitting on top of an image wrapper with \`border-t\`, or a wrapper with a border enclosing a child image that also has a border). You MUST carefully inspect the DOM structure and apply \`border-top: none\` or similar CSS overrides to eliminate overlapping borders (chống đè nét).
`;

text += newRule;
fs.writeFileSync('.agents/AGENTS.md', text);
console.log('Appended Flat UI rules to AGENTS.md');
