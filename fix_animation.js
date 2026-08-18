const fs = require('fs');
let content = fs.readFileSync('src/js/5_admin.js', 'utf8');

const replacement = `// ================= MANAGER EDIT PHOTO =================
                openEditPhotoModal: async () => {
                    if (!app.currentPhoto) return;
                    document.querySelectorAll('#manager-blur-container .blur-panel').forEach(p => p.remove());
                    app.admin.updateManagerBlurList();
                    const img = document.getElementById('manager-blur-img');
                    img.src = app.utils.getProxiedUrl(app.currentPhoto.url);
                    
                    const modal = document.getElementById('manager-edit-modal');
                    const content = document.getElementById('manager-edit-content');
                    
                    modal.classList.remove('hidden');
                    setTimeout(() => {
                        content.classList.remove('opacity-0', 'scale-95');
                        content.classList.add('opacity-100', 'scale-100');
                    }, 10);
                    
                    if (app.ui && app.ui.lockScroll) app.ui.lockScroll();
                },
                closeEditPhotoModal: () => {
                    const modal = document.getElementById('manager-edit-modal');
                    const content = document.getElementById('manager-edit-content');
                    
                    content.classList.remove('opacity-100', 'scale-100');
                    content.classList.add('opacity-0', 'scale-95');
                    
                    setTimeout(() => {
                        modal.classList.add('hidden');
                        document.getElementById('manager-blur-img').src = '';
                        document.querySelectorAll('#manager-blur-container .blur-panel').forEach(p => p.remove());
                        app.admin.updateManagerBlurList();
                        if (app.ui && app.ui.unlockScroll) app.ui.unlockScroll();
                    }, 200);
                },
                removeManagerBlurPanel`;

const startIdx = content.indexOf('// ================= MANAGER EDIT PHOTO =================');
const endIdx = content.indexOf('removeManagerBlurPanel');

if (startIdx !== -1 && endIdx !== -1) {
    const before = content.substring(0, startIdx);
    const after = content.substring(endIdx + 'removeManagerBlurPanel'.length);
    fs.writeFileSync('src/js/5_admin.js', before + replacement + after);
    console.log('Successfully replaced animations in 5_admin.js.');
} else {
    console.error('Could not find start or end index.');
}
