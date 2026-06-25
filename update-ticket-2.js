const fs = require('fs');

let html = fs.readFileSync('_core.html', 'utf8');

// 2. Remove old #mgr-sec-tickets
const mgrRegex = /<!-- TAB: QUẢN LÝ TICKETS -->[\s\S]*?<div id="mgr-sec-tickets" class="hidden">[\s\S]*?<\/div>/;
if (mgrRegex.test(html)) {
    html = html.replace(mgrRegex, '');
    console.log("Chunk 2 mgrTickets Removed.");
} else {
    console.log("Chunk 2 not found");
}

// 4. Update app.setUser
const setUserRegex = /if \(app\.role === 'manager'\) \{\s*document\.getElementById\('adm-tab-manager'\)\.classList\.remove\('hidden'\);\s*\}/;
const setUserReplace = `if (app.role === 'manager') {
                            document.getElementById('adm-tab-manager').classList.remove('hidden');
                            document.getElementById('adm-tab-tickets').classList.remove('hidden');
                        }`;
if (setUserRegex.test(html)) {
    html = html.replace(setUserRegex, setUserReplace);
    console.log("Chunk 4 app.setUser Updated.");
} else {
    console.log("Chunk 4 not found");
}

// 5. Update refreshCounts
const refreshCountsRegex = /document\.getElementById\('count-delete'\)\.innerText = delCount;\s*return \(pCount \|\| 0\) \+ editCount \+ delCount;/;
const refreshCountsReplace = `document.getElementById('count-delete').innerText = delCount;

                        // ĐOẠN THÊM MỚI: FETCH SỐ LƯỢNG TIN NHẮN TỪ FIREBASE CHO MANAGER
                        if (app.role === 'manager') {
                            app.ticket.initFirebase().then(() => {
                                app.ticket.db.ref('tickets').once('value', snapshot => {
                                    let unread = 0;
                                    snapshot.forEach(child => { if (child.val().unread_manager > 0) unread++; });
                                    const countEl = document.getElementById('count-tickets');
                                    if (countEl) countEl.innerText = unread;
                                    if (unread > 0) document.getElementById('adm-tab-tickets').classList.add('text-blue-600', 'border-blue-400');
                                    else document.getElementById('adm-tab-tickets').classList.remove('text-blue-600', 'border-blue-400');
                                });
                            }).catch(e => console.log(e));
                        }

                        // CHÚ Ý: Không cộng số Ticket vào return để tránh chuông báo của Admin thường bị nhảy!
                        return (pCount || 0) + editCount + delCount;`;
if (refreshCountsRegex.test(html)) {
    html = html.replace(refreshCountsRegex, refreshCountsReplace);
    console.log("Chunk 5 refreshCounts Updated.");
} else {
    console.log("Chunk 5 not found");
}

// 7. Update loadTab
const loadTabLogicRegex = /app\.admin\.renderCommentsData\(\);\s*\} else if \(tab === 'manager'\) \{/;
const loadTabLogicReplace = `app.admin.renderCommentsData();
                        } else if (tab === 'tickets') {
                            content.className = "col-span-full";
                            content.innerHTML = \`
                                <div class="col-span-full bg-white border border-gray-200 rounded-2xl p-8 md:p-12 text-center shadow-sm">
                                    <div class="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-sm border border-blue-100"><i class="fa-solid fa-headset"></i></div>
                                    <h3 class="text-2xl font-black uppercase text-black mb-3">Hệ thống Trò chuyện Hỗ trợ</h3>
                                    <p class="text-gray-600 text-sm mb-8 max-w-lg mx-auto leading-relaxed">Để đảm bảo trải nghiệm nhắn tin tốt nhất (Realtime, thông báo gõ phím), tính năng trò chuyện được thiết kế ở một <b>giao diện độc lập hoàn toàn</b>.</p>
                                    <button onclick="app.utils.navigate('/ticket')" class="bg-black text-white px-8 py-3.5 rounded-xl font-bold shadow-lg hover:bg-gray-800 transition hover:-translate-y-0.5"><i class="fa-solid fa-up-right-from-square mr-2"></i> Mở không gian làm việc</button>
                                </div>
                            \`;
                        } else if (tab === 'manager') {`;
if (loadTabLogicRegex.test(html)) {
    html = html.replace(loadTabLogicRegex, loadTabLogicReplace);
    console.log("Chunk 7 loadTab logic Updated.");
} else {
    console.log("Chunk 7 not found");
}

fs.writeFileSync('_core.html', html, 'utf8');
console.log("File updated successfully.");
