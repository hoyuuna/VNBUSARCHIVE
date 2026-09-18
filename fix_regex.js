const fs = require('fs');

function fixRegex(file) {
    let text = fs.readFileSync(file, 'utf8');
    
    // Replace in page_search.js and 00_core.js
    text = text.replace(
        /let lookaheadRegex = searchWords\.map\(w => \{\s*if \(col === 'license_plate'\) return `\(\?=\.\*\$\{app\.utils\.normalizePlateQuery\(w\)\}\)`;\s*return `\(\?=\.\*\$\{w\}\)`;\s*\}\)\.join\(''\);\s*sbQuery = sbQuery\.ilike\(col, `%\$\{lookaheadRegex\}%`\);/g,
        `searchWords.forEach(w => {
                                    let q = (col === 'license_plate') ? app.utils.normalizePlateQuery(w) : w;
                                    sbQuery = sbQuery.ilike(col, \`%\${q}%\`);
                                });`
    );

    // Also the operator_info one
    text = text.replace(
        /let opLookaheadRegex = searchWords\.map\(w => `\(\?=\.\*\$\{w\}\)`\)\.join\(''\);\s*infoQuery = infoQuery\.ilike\('operator_name', `%\$\{opLookaheadRegex\}%`\);/g,
        `searchWords.forEach(w => {
                                        infoQuery = infoQuery.ilike('operator_name', \`%\${w}%\`);
                                    });`
    );

    // And the ones with selectField
    text = text.replace(
        /let lookaheadRegex = searchWords\.map\(w => \{\s*if \(selectField === 'license_plate'\) return `\(\?=\.\*\$\{app\.utils\.normalizePlateQuery\(w\)\}\)`;\s*return `\(\?=\.\*\$\{w\}\)`;\s*\}\)\.join\(''\);\s*if \(lookaheadRegex\) \{\s*sbQuery = sbQuery\.ilike\(selectField, `%\$\{lookaheadRegex\}%`\);\s*\}/g,
        `searchWords.forEach(w => {
                                let q = (selectField === 'license_plate') ? app.utils.normalizePlateQuery(w) : w;
                                sbQuery = sbQuery.ilike(selectField, \`%\${q}%\`);
                            });`
    );

    fs.writeFileSync(file, text, 'utf8');
}

fixRegex('src/js/page_search.js');
fixRegex('src/js/00_core.js');

