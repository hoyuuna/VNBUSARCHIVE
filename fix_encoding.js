const fs = require('fs');
let content = fs.readFileSync('src/js/5_admin.js', 'utf8');

const replacement = `                updateManagerBlurList: () => {
                    const panels = document.querySelectorAll('#manager-blur-container .blur-panel');
                    const count = panels.length;
                    const btn = document.getElementById('btn-manager-add-blur');
                    if (btn) {
                        btn.innerHTML = \`<i class="fa-solid fa-plus"></i> Thêm vùng làm mờ (\${count})\`;
                    }
                    const list = document.getElementById('manager-blur-list');
                    if (list) {
                        if (count === 0) {
                            list.innerHTML = \`<p class="text-[11px] text-gray-400 font-medium italic text-center py-1">Chưa có vùng làm mờ nào.</p>\`;
                        } else {
                            let html = '';
                            for (let i = 0; i < count; i++) {
                                html += \`<div class="flex items-center justify-between gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                                    <span class="text-[11px] font-bold text-gray-700 truncate flex-1"><i class="fa-solid fa-droplet-slash mr-1.5 text-gray-400"></i>Vùng \${i + 1}</span>
                                    <div class="flex items-center gap-1.5">
                                        <button type="button" onclick="app.admin.duplicateManagerBlurPanelByIndex(\${i})" class="shrink-0 flex items-center justify-center w-7 h-7 rounded-md bg-white border border-gray-200 text-gray-700 hover:bg-black hover:text-white hover:border-black transition" title="Nhân bản vùng này"><i class="fa-solid fa-copy text-xs"></i></button>
                                        <button type="button" onclick="app.admin.removeManagerBlurPanelByIndex(\${i})" class="shrink-0 flex items-center justify-center w-7 h-7 rounded-md bg-white border border-gray-200 text-gray-700 hover:bg-black hover:text-white hover:border-black transition" title="Xóa vùng này"><i class="fa-solid fa-xmark text-xs"></i></button>
                                    </div>
                                </div>\`;
                            }
                            list.innerHTML = html;
                        }
                    }
                },`;

const startIdx = content.indexOf('updateManagerBlurList: () => {');
const endIdx = content.indexOf('saveEditPhotoBlur: async () => {');

if (startIdx !== -1 && endIdx !== -1) {
    const before = content.substring(0, startIdx);
    const after = content.substring(endIdx);
    fs.writeFileSync('src/js/5_admin.js', before + replacement + '\n                ' + after);
    console.log('Successfully replaced updateManagerBlurList.');
} else {
    console.error('Could not find start or end index.');
}
