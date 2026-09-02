const fs = require('fs');

// Run the previous watermark protection fix first
const wmProtection = `
/* ===== WATERMARK PROTECTION (không override màu) ===== */
.wm-draggable,
.wm-draggable * {
    color: inherit !important;
}
.wm-draggable.wm-black,
.wm-draggable.wm-black * {
    color: black !important;
}
.footer-text-left,
.footer-text-right,
#preview-footer-copy {
    color: white !important;
}

/* ===== FIX: PREVIEW FOOTER BAR - Restore blur gradient ===== */
#preview-footer-bar {
    background: linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%) !important;
    backdrop-filter: blur(4px) !important;
    -webkit-backdrop-filter: blur(4px) !important;
    padding-bottom: 6px !important;
    padding-top: 6px !important;
}
`;

let css = fs.readFileSync('public/css/light.css', 'utf8');

// Remove the broken #preview-footer-bar rule we added earlier (just gradient, no blur)
css = css.replace(/#preview-footer-bar \{\n    background: linear-gradient.*?\n\}\n/s, '');

css += wmProtection;
fs.writeFileSync('public/css/light.css', css);
console.log('Added watermark protection and preview footer blur fix');
