const fs = require('fs');

let text = fs.readFileSync('temp/middle/src/routes/photos.ts', 'utf8');

if (!text.includes("k === 'and'")) {
    text = text.replace(
        /if \(k === 'or'\) \{/,
        `if (k === 'and') {
      const parts = splitByComma(v);
      const andClauses = parts.map(parseCondition).filter(Boolean);
      if (andClauses.length > 0) {
        if (!match.$and) match.$and = [];
        match.$and.push(...andClauses);
      }
    } else if (k === 'or') {`
    );
    fs.writeFileSync('temp/middle/src/routes/photos.ts', text, 'utf8');
}
