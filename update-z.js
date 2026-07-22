const fs = require('fs');
let html = fs.readFileSync('_core.html', 'utf8');

// Replace Header z-index
html = html.replace(/z-\[1500\]/g, 'z-[2000]');
html = html.replace(/z-index:\s*1500\s*!important/g, 'z-index: 2000 !important');

// Toast container
html = html.replace(/z-\[1510\]([\s\S]*?toast-container)/g, 'z-[9000]$1');
// Ensure toast inline style is 9000
html = html.replace(/id="toast-container"([^>]*?)style="z-index: 1510 !important;"/g, 'id="toast-container"$1style="z-index: 9000 !important;"');

const replacements = [
    { regex: /id="onboarding-modal"([^>]*?)z-\[1490\]/g, rep: 'id="onboarding-modal"$1z-[3000]' },
    { regex: /id="maintenance-screen"([^>]*?)z-\[1499\]/g, rep: 'id="maintenance-screen"$1z-[5000]' },
    { regex: /id="custom-alert-modal"([\s\S]*?)z-\[1499\]/g, rep: 'id="custom-alert-modal"$1z-[5000]' },
    { regex: /id="crop-modal"([^>]*?)z-\[1485\]/g, rep: 'id="crop-modal"$1z-[4000]' },
    { regex: /id="custom-role-modal"([^>]*?)z-\[1480\]/g, rep: 'id="custom-role-modal"$1z-[5000]' },
    { regex: /id="ban-prompt-modal"([^>]*?)z-\[1475\]/g, rep: 'id="ban-prompt-modal"$1z-[5000]' },
    { regex: /id="newsboard-modal"([\s\S]*?)z-\[1490\]/g, rep: 'id="newsboard-modal"$1z-[3000]' },
    { regex: /id="admin-zoom-modal"([^>]*?)z-\[1460\]/g, rep: 'id="admin-zoom-modal"$1z-[4000]' },
    { regex: /z-\[1461\]/g, rep: 'z-[4010]' }, // close button
    { regex: /z-\[1465\]/g, rep: 'z-[4020]' }, // toolbar
    { regex: /z-index:\s*1465\s*!important/g, rep: 'z-index: 4020 !important' },
    { regex: /id="settings-modal"([^>]*?)z-\[1470\]/g, rep: 'id="settings-modal"$1z-[3000]' },
    { regex: /id="bio-edit-modal"([^>]*?)z-\[1490\]/g, rep: 'id="bio-edit-modal"$1z-[3000]' },
    { regex: /id="operator-edit-modal"([^>]*?)z-\[1490\]/g, rep: 'id="operator-edit-modal"$1z-[3000]' },
    { regex: /id="model-edit-modal"([^>]*?)z-\[1490\]/g, rep: 'id="model-edit-modal"$1z-[3000]' },
    { regex: /id="fav-photo-modal"([^>]*?)z-\[1490\]/g, rep: 'id="fav-photo-modal"$1z-[3000]' },
    { regex: /id="upload-progress-modal"([\s\S]*?)z-\[6000\]/g, rep: 'id="upload-progress-modal"$1z-[5000]' }
];

replacements.forEach(r => {
    html = html.replace(r.regex, r.rep);
});

// Fix the user-dropdown z-[1510] to z-[2100]
html = html.replace(/id="user-dropdown"([^>]*?)z-\[1510\]/g, 'id="user-dropdown"$1z-[2100]');
html = html.replace(/id="user-dropdown"([^>]*?)style="z-index: 1510 !important;"/g, 'id="user-dropdown"$1style="z-index: 2100 !important;"');

fs.writeFileSync('_core.html', html);
console.log('Replacements completed.');
