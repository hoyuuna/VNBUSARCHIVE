const fs = require('fs');
const file = 'src/js/1_init.js';
let content = fs.readFileSync(file, 'utf8');

const s1 = `} else if (type === 'vvbs') {`;
const r1 = `} else if (type === 'dev') {
                        helpUrl = 'https://www.vnbusarchive.io.vn/help/1538729901798989934';
                        desc = \`Danh hiệu <b>VNBUSARCHIVE Code Contributor</b> được cấp cho các lập trình viên đã có đóng góp mã nguồn (Pull Request) hợp lệ trên GitHub, góp phần xây dựng và phát triển nền tảng công nghệ của dự án.<br><br><a href="\${helpUrl}" target="_blank" class="text-black hover:underline font-bold text-[13px] inline-flex items-center">Tìm hiểu thêm về danh hiệu này</a>\`;
                        app.ui.showAlert(desc, 
                            null, 
                            null, 
                            {
                                title: "VNBUSARCHIVE Verified",
                                iconHtml: '<i class="fa-solid fa-code text-3xl text-black"></i>',
                                btnOkText: "Đóng"
                            }
                        );
                    } else if (type === 'vvbs') {`;

content = content.replace(s1, r1);

const s2 = `const vvbsRole = subroles.find(s => s === 'vvbs');`;
const r2 = `if (subroles.includes('dev')) {
                            const innerHtml = \`<i class="fa-solid fa-code text-[9px]" style="line-height: 15px; display: block;"></i>\`;
                            const styleStr = \`background-color: black; color: white; padding: 0; width: 15px; height: 15px; border-radius: 50%; justify-content: center; align-items: center;\${enableClick ? ' cursor: pointer;' : ''}\`;
                            if (enableClick) {
                                html += \`<span class="badge-shiny" style="\${styleStr}" onclick="app.ui.showVerifiedPopup('dev', '')" title="VNBUSARCHIVE Code Contributor">\${innerHtml}</span>\`;
                            } else {
                                html += \`<span class="badge-shiny" style="\${styleStr}" title="VNBUSARCHIVE Code Contributor">\${innerHtml}</span>\`;
                            }
                        }
                        const vvbsRole = subroles.find(s => s === 'vvbs');`;

content = content.replace(s2, r2);

const s3 = `if (subroles && subroles.includes('dev')) {
                        html += \`<span class="badge-shiny" style="background: linear-gradient(135deg, #22c55e, #15803d);" title="Developer"><i class="fa-solid fa-code mr-1 text-[10px]"></i> Dev</span>\`;
                    }`;
const r3 = ``;

content = content.replace(s3, r3);

fs.writeFileSync(file, content);
console.log('Fixed 1_init.js');
