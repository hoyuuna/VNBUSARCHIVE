const fs = require('fs');
const path = require('path');

try {
    const corePath = path.join(__dirname, '_core.html');
    if (fs.existsSync(corePath)) {
        const content = fs.readFileSync(corePath, 'utf8');
        const base64 = Buffer.from(content).toString('base64');
        
        const outPath = path.join(__dirname, 'functions', 'api', '_core.js');
        fs.writeFileSync(outPath, 'export const coreBase64 = `' + base64 + '`;\n');
        
        console.log('Successfully generated functions/api/_core.js from _core.html');
    } else {
        console.warn('_core.html not found, skipping generation.');
    }
} catch (error) {
    console.error('Error generating _core.js:', error);
    process.exit(1);
}
