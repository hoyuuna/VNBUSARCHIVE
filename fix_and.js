const fs = require('fs');

function fixAndInCore() {
    let text = fs.readFileSync('src/js/00_core.js', 'utf8');
    
    // Add .and(str) to VnbusQueryBuilder
    if (!text.includes('and(str) {')) {
        text = text.replace(
            /or\(str\) \{/,
            `and(str) {\n        this.params.and = str;\n        return this;\n    }\n    or(str) {`
        );
    }
    
    // Change .or(`and(...)`) to .and(`...`) in page_search.js and 00_core.js
    text = text.replace(
        /sbQuery = sbQuery\.or\(`and\(\$\{conditions\.join\(\',\'\)\}\)`\);/g,
        `sbQuery = sbQuery.and(\`\${conditions.join(',')}\`);`
    );
    
    // Also change infoQuery
    text = text.replace(
        /infoQuery = infoQuery\.or\(`and\(\$\{opConds\.join\(\',\'\)\}\)`\);/g,
        `infoQuery = infoQuery.and(\`\${opConds.join(',')}\`);`
    );

    fs.writeFileSync('src/js/00_core.js', text, 'utf8');
}

fixAndInCore();

// Same replacements for page_search.js
function fixAndInSearch() {
    let text = fs.readFileSync('src/js/page_search.js', 'utf8');
    text = text.replace(
        /sbQuery = sbQuery\.or\(`and\(\$\{conditions\.join\(\',\'\)\}\)`\);/g,
        `sbQuery = sbQuery.and(\`\${conditions.join(',')}\`);`
    );
    text = text.replace(
        /infoQuery = infoQuery\.or\(`and\(\$\{opConds\.join\(\',\'\)\}\)`\);/g,
        `infoQuery = infoQuery.and(\`\${opConds.join(',')}\`);`
    );
    fs.writeFileSync('src/js/page_search.js', text, 'utf8');
}
fixAndInSearch();
