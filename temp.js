const fs = require('fs');
let buildCore = fs.readFileSync('build-core.js', 'utf8');

const newHeaders = "const headersContent = `/*\\n  Content-Security-Policy: ${cspString}\\n  Referrer-Policy: strict-origin-when-cross-origin\\n\\n/index.html\\n  Cache-Control: no-cache, no-store, must-revalidate\\n\\n/\\n  Cache-Control: no-cache, no-store, must-revalidate\\n\\n/tailwind.css\\n  Cache-Control: no-store, no-cache, must-revalidate, max-age=0\\n  Pragma: no-cache\\n  Expires: 0\\n`;";

buildCore = buildCore.replace(/const headersContent = `\/\*\\n  Content-Security-Policy: \$\{cspString\}\\n  Referrer-Policy: strict-origin-when-cross-origin\\n\\n\/tailwind\.css\\n  Cache-Control: no-store, no-cache, must-revalidate, max-age=0\\n  Pragma: no-cache\\n  Expires: 0\\n`;/, newHeaders);

fs.writeFileSync('build-core.js', buildCore);
console.log('Updated headers in build-core.js.');
