const fs = require('fs');

function fix00Core() {
    let content = fs.readFileSync('src/js/00_core.js', 'utf8');
    if (!content.includes('abortSignal(signal)')) {
        content = content.replace(
            /limit\(n\) \{\s*this\.params\.limit = n;\s*return this;\s*\}/,
            "limit(n) {\n        this.params.limit = n;\n        return this;\n    }\n    abortSignal(signal) {\n        this.signal = signal;\n        return this;\n    }"
        );
        fs.writeFileSync('src/js/00_core.js', content, 'utf8');
    }
}
fix00Core();
