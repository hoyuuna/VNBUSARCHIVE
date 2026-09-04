const fs = require('fs');

let c = fs.readFileSync('src/js/page_upload.js', 'utf8');

const missingCode = `

window.addEventListener('keydown', (e) => {
    const cropModal = document.getElementById('crop-modal');
    if (!cropModal || cropModal.classList.contains('hidden') || !app.crop) return;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target && e.target.tagName)) return;
    if (e.key === '=' || e.key === '+' || e.key === '-') {
        e.preventDefault();
        const isZoomIn = (e.key === '=' || e.key === '+');
        const zoomFactor = e.ctrlKey ? (isZoomIn ? 1.15 : 1/1.15) : (isZoomIn ? 1.02 : 1/1.02);
        app.crop.state.scale *= zoomFactor;
        if (app.crop.state.scale < app.crop.state.minScale) {
            app.crop.state.scale = app.crop.state.minScale;
        }
        if (app.crop.state.scale > 5) {
            app.crop.state.scale = 5;
        }
        app.crop.applyTransform();
        return;
    }
    let dx = 0, dy = 0;
    const step = e.ctrlKey ? 20 : 1;
    if (e.key === 'ArrowLeft') dx = -step;
    else if (e.key === 'ArrowRight') dx = step;
    else if (e.key === 'ArrowUp') dy = -step;
    else if (e.key === 'ArrowDown') dy = step;
    else return;
    e.preventDefault();
    app.crop.state.x -= dx;
    app.crop.state.y -= dy;
    app.crop.applyTransform();
});

document.addEventListener('DOMContentLoaded', () => {
    window.addEventListener('resize', () => {
        if (window.app && window.app.upload && window.app.upload.updateWmModeSlider) {
            window.app.upload.updateWmModeSlider();
        }
    });
    setTimeout(() => {
        const savedMode = (typeof localStorage !== 'undefined' && localStorage.getItem('vnbus_wm_mode')) || 'basic';
        if (window.app && window.app.upload && window.app.upload.setWmMode) {
            window.app.upload.setWmMode(savedMode);
        }
    }, 500);
});
`;

if (!c.includes("ArrowLeft")) {
    c += missingCode;
    fs.writeFileSync('src/js/page_upload.js', c);
    console.log("Appended to page_upload.js");
}
