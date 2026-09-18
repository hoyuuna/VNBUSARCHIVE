const fs = require('fs');

function fixRegexProperly(file) {
    let text = fs.readFileSync(file, 'utf8');
    
    // page_search.js fetchSugs / 00_core.js fetchSugs
    text = text.replace(
        /searchWords\.forEach\(w => \{\s*let q = \(col === 'license_plate'\) \? app\.utils\.normalizePlateQuery\(w\) : w;\s*sbQuery = sbQuery\.ilike\(col, `%\$\{q\}%`\);\s*\}\);/g,
        `let conditions = searchWords.map(w => {
                                    let q = (col === 'license_plate') ? app.utils.normalizePlateQuery(w) : w;
                                    return \`\${col}.ilike.%\${q}%\`;
                                });
                                sbQuery = sbQuery.or(\`and(\${conditions.join(',')})\`);`
    );

    // page_search.js opLookaheadRegex
    text = text.replace(
        /searchWords\.forEach\(w => \{\s*infoQuery = infoQuery\.ilike\('operator_name', `%\$\{w\}%`\);\s*\}\);/g,
        `let opConds = searchWords.map(w => \`operator_name.ilike.%\${w}%\`);
                                    infoQuery = infoQuery.or(\`and(\${opConds.join(',')})\`);`
    );

    // 00_core.js triggerSuggestion (selectField)
    text = text.replace(
        /searchWords\.forEach\(w => \{\s*let q = \(selectField === 'license_plate'\) \? app\.utils\.normalizePlateQuery\(w\) : w;\s*sbQuery = sbQuery\.ilike\(selectField, `%\$\{q\}%`\);\s*\}\);/g,
        `if (searchWords.length > 0) {
                                let conditions = searchWords.map(w => {
                                    let q = (selectField === 'license_plate') ? app.utils.normalizePlateQuery(w) : w;
                                    return \`\${selectField}.ilike.%\${q}%\`;
                                });
                                sbQuery = sbQuery.or(\`and(\${conditions.join(',')})\`);
                            }`
    );

    fs.writeFileSync(file, text, 'utf8');
}

fixRegexProperly('src/js/page_search.js');
fixRegexProperly('src/js/00_core.js');

