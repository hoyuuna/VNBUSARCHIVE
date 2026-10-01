const fs = require('fs');
let content = fs.readFileSync('src/js/page_vehicle.js', 'utf8');

// Fix updateHistoryItem
content = content.replace(
    /return app\.vehicle\.renderEditList\(prefix\);\r?\n\s*\}\r?\n\s*\}\r?\n\s*app\.vehicle\.tempHistory\[index\]\[field\] = parsed \|\| '';/,
    "return app.vehicle.renderEditList(prefix);\n                        }\n                        app.vehicle.tempHistory[index][field] = parsed || '';"
);

// Fix the unclosed else block in saveHistory
// I will just find pp.vehicle.renderEditList(prefix);\n                    }\n\n                    const btnSaveHist
content = content.replace(
    /app\.vehicle\.renderEditList\(prefix\);\r?\n\s*\}\r?\n\r?\n\s*const btnSaveHist/,
    "app.vehicle.renderEditList(prefix);\n                        }\n                    }\n\n                    const btnSaveHist"
);

fs.writeFileSync('src/js/page_vehicle.js', content, 'utf8');
