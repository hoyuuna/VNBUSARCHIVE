const fs = require('fs');
let code = fs.readFileSync('temp/middle/src/routes/vehicles.ts', 'utf8');

const target2 = `      if (val.startsWith('ilike.')) {
        val = val.substring(6);
        if (val.startsWith('"') && val.endsWith('"')) val = val.substring(1, val.length - 1);
        filter.model = { $regex: sqlToRegex(val), $options: 'i' };
      } else if (val.startsWith('in.(') && val.endsWith(')')) {
        const items = val.substring(4, val.length - 1).split(',');
        filter.model = { $in: items };
      } else {
        if (val.startsWith('eq.')) val = val.substring(3);
        filter.model = val;
      }`;

code = code.replace(
    /if \(val\.startsWith\('ilike\.'\)\) \{\s*val = val\.substring\(6\);\s*if \(val\.startsWith\('\"'\) && val\.endsWith\('\"'\)\) val = val\.substring\(1, val\.length - 1\);\s*filter\.model = \{ \$regex: sqlToRegex\(val\), \$options: 'i' \};\s*\}/,
    target2
);

fs.writeFileSync('temp/middle/src/routes/vehicles.ts', code);
