const fs = require('fs');

// 1. Fix page_feed.js
let feed = fs.readFileSync('src/js/page_feed.js', 'utf8');
feed = feed.replace(
    /onclick="app\.vehicle\.saveHistory\(\)" class="bg-black text-white px-4 py-2 text-xs font-bold rounded-md hover:bg-gray-800 transition shadow-sm">Lưu thông tin<\/button>/,
    'id="btn-save-veh-history" onclick="app.vehicle.saveHistory()" class="bg-black text-white px-4 py-2 text-xs font-bold rounded-md hover:bg-gray-800 transition shadow-sm">Lưu thông tin</button>'
);
fs.writeFileSync('src/js/page_feed.js', feed, 'utf8');

// 2. Fix page_vehicle.js
let veh = fs.readFileSync('src/js/page_vehicle.js', 'utf8');

veh = veh.replace(
    /document\.getElementById\(prefix \+ 'hist-new-date'\)\.value = '';\r?\n\s*app\.vehicle\.renderEditList\(prefix\);/,
    "document.getElementById(prefix + 'hist-new-date').value = '';\n                    document.getElementById(prefix + 'hist-new-op').value = '';\n                    if(document.getElementById(prefix + 'hist-new-route')) document.getElementById(prefix + 'hist-new-route').value = '';\n                    app.vehicle.renderEditList(prefix);"
);

const oldSaveHistoryTop = /saveHistory: async \(\) => \{\r?\n\s*const prefix = app\.vehicle\.currentHistoryPrefix \|\| '';\r?\n\s*const proceedSave = async \(\) => \{/;

const newSaveHistoryTop = `saveHistory: async () => {
                    const prefix = app.vehicle.currentHistoryPrefix || '';
                    const dateInput = document.getElementById(prefix + 'hist-new-date');
                    const opInput = document.getElementById(prefix + 'hist-new-op');
                    
                    if (dateInput && opInput && (dateInput.value.trim() !== '' || opInput.value.trim() !== '')) {
                        const rawDate = dateInput.value.trim();
                        const op = opInput.value.trim();
                        const dateVal = app.utils.parseDDMMYYYYToDate(rawDate);
                        
                        if (rawDate && op && dateVal) {
                            const route = document.getElementById(prefix + 'hist-new-route') ? document.getElementById(prefix + 'hist-new-route').value.trim() : '';
                            const note = document.getElementById(prefix + 'hist-new-note') ? document.getElementById(prefix + 'hist-new-note').value.trim() : '';
                            const plate = document.getElementById(prefix + 'hist-new-plate') ? document.getElementById(prefix + 'hist-new-plate').value.trim() : '';
                            
                            app.vehicle.tempHistory.push({
                                license_plate: app.currentPlate,
                                plate: plate || app.currentPlate || null,
                                effective_date: dateVal,
                                operator: op,
                                route: route,
                                note: note
                            });
                            
                            dateInput.value = '';
                            opInput.value = '';
                            if(document.getElementById(prefix + 'hist-new-plate')) document.getElementById(prefix + 'hist-new-plate').value = '';
                            if(document.getElementById(prefix + 'hist-new-note')) document.getElementById(prefix + 'hist-new-note').value = '';
                            if(document.getElementById(prefix + 'hist-new-route')) document.getElementById(prefix + 'hist-new-route').value = '';
                            
                            app.vehicle.renderEditList(prefix);
                        }
                    }

                    const btnSaveHist = document.getElementById(prefix === 'veh-' ? 'btn-save-veh-history' : 'btn-save-history');
                    if (btnSaveHist) {
                        btnSaveHist.disabled = true;
                        btnSaveHist.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...';
                    }

                    const resetBtn = () => {
                        if (btnSaveHist) {
                            btnSaveHist.disabled = false;
                            btnSaveHist.innerHTML = 'Lưu thông tin';
                        }
                    };

                    const proceedSave = async () => {`;
veh = veh.replace(oldSaveHistoryTop, newSaveHistoryTop);

veh = veh.replace(
    /return app\.ui\.showAlert\(`Lỗi: Có 2 mục lịch sử cạnh nhau/g,
    "resetBtn();\n                                return app.ui.showAlert(`Lỗi: Có 2 mục lịch sử cạnh nhau"
);

veh = veh.replace(
    /if \(origClean === tempClean\) \{\r?\n\s*return app\.ui\.showAlert\("Không có sự thay đổi nào so với dữ liệu gốc\. Yêu cầu bị hủy\."\);\r?\n\s*\}/,
    `if (origClean === tempClean) {
                            resetBtn();
                            if (dateInput && opInput && (dateInput.value.trim() !== '' || opInput.value.trim() !== '')) {
                                return app.ui.showAlert("Bạn chưa điền đủ (Ngày và Đơn vị) cho mục mới nên hệ thống không thể tự lưu.\\n\\nVui lòng điền đủ để lưu, hoặc xóa trắng nếu không muốn thêm.");
                            }
                            return app.ui.showAlert("Không có sự thay đổi nào so với dữ liệu gốc. Yêu cầu bị hủy.");
                        }`
);

veh = veh.replace(
    /try \{ await app\.captcha\.request\(\); \} catch \(err\) \{ if \(err\.message !== "CAPTCHA_CANCELLED"\) app\.ui\.showAlert\("Lỗi xác thực Captcha\."\); return; \}/,
    "try { await app.captcha.request(); } catch (err) { resetBtn(); if (err.message !== \"CAPTCHA_CANCELLED\") app.ui.showAlert(\"Lỗi xác thực Captcha.\"); return; }"
);

veh = veh.replace(
    /\} catch \(err\) \{\r?\n\s*app\.ui\.showAlert\("Lỗi khi lưu: " \+ err\.message\);\r?\n\s*\}/g,
    "} catch (err) {\n                                app.ui.showAlert(\"Lỗi khi lưu: \" + err.message);\n                            } finally {\n                                resetBtn();\n                            }"
);

veh = veh.replace(
    /if \(count > 0\) return app\.ui\.showAlert\("Có yêu cầu chỉnh sửa lịch sử khác đang chờ duyệt cho xe này\. Vui lòng thử lại sau\."\);/,
    "if (count > 0) { resetBtn(); return app.ui.showAlert(\"Có yêu cầu chỉnh sửa lịch sử khác đang chờ duyệt cho xe này. Vui lòng thử lại sau.\"); }"
);

veh = veh.replace(
    /\} catch \(err\) \{\r?\n\s*app\.ui\.showAlert\("Lỗi gửi yêu cầu: " \+ err\.message\);\r?\n\s*\}/g,
    "} catch (err) {\n                                app.ui.showAlert(\"Lỗi gửi yêu cầu: \" + err.message);\n                            } finally {\n                                resetBtn();\n                            }"
);

fs.writeFileSync('src/js/page_vehicle.js', veh, 'utf8');
console.log('done fixes2');
