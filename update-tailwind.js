const fs = require('fs');

let twConfig = fs.readFileSync('tailwind.config.js', 'utf8');
if (!twConfig.includes('./_core.html')) {
    twConfig = twConfig.replace('"./index.html",', '"./index.html",\n    "./_core.html",');
    fs.writeFileSync('tailwind.config.js', twConfig, 'utf8');
}

let inputCss = fs.readFileSync('src/input.css', 'utf8');
if (!inputCss.includes('@config')) {
    inputCss = '@config "../tailwind.config.js";\n' + inputCss;
    fs.writeFileSync('src/input.css', inputCss, 'utf8');
}

console.log("Tailwind config updated.");
