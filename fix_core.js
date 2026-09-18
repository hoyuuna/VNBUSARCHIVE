const fs = require('fs');
let content = fs.readFileSync('src/js/00_core.js', 'utf8');

content = content.replace(
    /const lookaheadRegex = searchWords\.map\(w => `\(\?=.*?\$\{w\}\)`\)\.join\(''\);\s*if \(lookaheadRegex\) \{\s*sbQuery = sbQuery\.ilike\(selectField, `%\$\{lookaheadRegex\}%`\);\s*\}/g,
    "searchWords.forEach(w => { sbQuery = sbQuery.ilike(selectField, `%\${w}%`); });"
);

content = content.replace(
    /const lookaheadRegex = searchWords\.map\(w => `\(\?=.*?\$\{w\}\)`\)\.join\(''\);\s*uQuery = uQuery\.ilike\('username', `%\$\{lookaheadRegex\}%`\);/g,
    "searchWords.forEach(w => { uQuery = uQuery.ilike('username', `%\${w}%`); });"
);

content = content.replace(
    /const lookaheadRegex = searchWords\.map\(w => `\(\?=.*?\$\{w\}\)`\)\.join\(''\);\s*opInfoQuery = opInfoQuery\.ilike\('operator_name', `%\$\{lookaheadRegex\}%`\);\s*opPhotoQuery = opPhotoQuery\.ilike\('operator', `%\$\{lookaheadRegex\}%`\);/g,
    "searchWords.forEach(w => { opInfoQuery = opInfoQuery.ilike('operator_name', `%\${w}%`); opPhotoQuery = opPhotoQuery.ilike('operator', `%\${w}%`); });"
);

content = content.replace(
    /const lookaheadRegex = searchWords\.map\(w => `\(\?=.*?\$\{w\}\)`\)\.join\(''\);\s*mdlInfoQuery = mdlInfoQuery\.ilike\('model_name', `%\$\{lookaheadRegex\}%`\);\s*mdlVehicleQuery = mdlVehicleQuery\.ilike\('model', `%\$\{lookaheadRegex\}%`\);/g,
    "searchWords.forEach(w => { mdlInfoQuery = mdlInfoQuery.ilike('model_name', `%\${w}%`); mdlVehicleQuery = mdlVehicleQuery.ilike('model', `%\${w}%`); });"
);

content = content.replace(
    /const lookaheadRegex = searchWords\.map\(w => `\(\?=.*?\$\{w\}\)`\)\.join\(''\);\s*rQuery = rQuery\.ilike\('route_no', `%\$\{lookaheadRegex\}%`\);/g,
    "searchWords.forEach(w => { rQuery = rQuery.ilike('route_no', `%\${w}%`); });"
);

content = content.replace(
    /const lookaheadRegex = searchWords\.map\(w => `\(\?=.*?\$\{w\}\)`\)\.join\(''\);\s*const plateRegex = searchWords\.map\(w => `\(\?=.*?\$\{app\.utils\.normalizePlateQuery\(w\)\}\)`\)\.join\(''\);\s*vQuery = vQuery\.or\(`license_plate\.ilike\."%\$\{plateRegex\}%",model\.ilike\."%\$\{lookaheadRegex\}%",note\.ilike\."%\$\{lookaheadRegex\}%"`\);/g,
    "const plateAnd = searchWords.map(w => `license_plate.ilike.\"%${app.utils.normalizePlateQuery(w)}%\"`).join(',');\nconst modelAnd = searchWords.map(w => `model.ilike.\"%${w}%\"`).join(',');\nconst noteAnd = searchWords.map(w => `note.ilike.\"%${w}%\"`).join(',');\nvQuery = vQuery.or(`and(${plateAnd}),and(${modelAnd}),and(${noteAnd})`);"
);

content = content.replace(
    /let orConditions = \[\];\s*if \(plateRegex\) orConditions\.push\(`license_plate\.ilike\."%\$\{plateRegex\}%"`\);\s*orConditions\.push\(`operator\.ilike\."%\$\{lookaheadRegex\}%"`\);\s*orConditions\.push\(`route_no\.ilike\."%\$\{lookaheadRegex\}%"`\);\s*orConditions\.push\(`camera_model\.ilike\."%\$\{lookaheadRegex\}%"`\);\s*orConditions\.push\(`location\.ilike\."%\$\{lookaheadRegex\}%"`\);\s*orConditions\.push\(`note\.ilike\."%\$\{lookaheadRegex\}%"`\);/g,
    "let orConditions = [];\nif (searchWords.length > 0) {\n  orConditions.push(`and(${searchWords.map(w => `license_plate.ilike.\"%${app.utils.normalizePlateQuery(w)}%\"`).join(',')})`);\n  orConditions.push(`and(${searchWords.map(w => `operator.ilike.\"%${w}%\"`).join(',')})`);\n  orConditions.push(`and(${searchWords.map(w => `route_no.ilike.\"%${w}%\"`).join(',')})`);\n  orConditions.push(`and(${searchWords.map(w => `camera_model.ilike.\"%${w}%\"`).join(',')})`);\n  orConditions.push(`and(${searchWords.map(w => `location.ilike.\"%${w}%\"`).join(',')})`);\n  orConditions.push(`and(${searchWords.map(w => `note.ilike.\"%${w}%\"`).join(',')})`);\n}"
);

content = content.replace(
    /const lookaheadRegex = searchWords\.map\(w => `\(\?=.*?\$\{w\}\)`\)\.join\(''\);\s*const plateRegex = searchWords\.map\(w => `\(\?=.*?\$\{app\.utils\.normalizePlateQuery\(w\)\}\)`\)\.join\(''\);\s*mQ = mQ\.or\(`model\.ilike\."%\$\{lookaheadRegex\}%",note\.ilike\."%\$\{lookaheadRegex\}%"`\);\s*uQ = uQ\.ilike\('username', `%\$\{lookaheadRegex\}%`\);/g,
    "const modelAnd = searchWords.map(w => `model.ilike.\"%${w}%\"`).join(',');\nconst noteAnd = searchWords.map(w => `note.ilike.\"%${w}%\"`).join(',');\nmQ = mQ.or(`and(${modelAnd}),and(${noteAnd})`);\nsearchWords.forEach(w => { uQ = uQ.ilike('username', `%\${w}%`); });"
);


fs.writeFileSync('src/js/00_core.js', content, 'utf8');
