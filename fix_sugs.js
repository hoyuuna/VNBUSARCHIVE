const fs = require('fs');
let code = fs.readFileSync('src/js/3_views.js', 'utf8');

const target1 = `if (table === 'photos' && col === 'route_no') selectStr = 'route_no, borrowed_route, license_plate';`;
const replace1 = `if (table === 'photos' && col === 'route_no') selectStr = 'route_no, borrowed_route, license_plate, type';`;
code = code.replace(target1, replace1);

const target2 = `                                        data.forEach(item => {
                                            const r = item.route_no;
                                            if (!r) return;`;
const replace2 = `                                        const specialRoutes = ['Dừng hoạt động', 'Ngoại giờ hoạt động', 'Chưa hoạt động', 'Hợp đồng', 'Xe hợp đồng / Đưa đón'];
                                        data.forEach(item => {
                                            if (item.type === 'coach') return;
                                            const r = item.route_no;
                                            if (!r || r === 'Khác' || r === 'Không rõ' || specialRoutes.includes(r)) return;`;
code = code.replace(target2, replace2);

fs.writeFileSync('src/js/3_views.js', code, 'utf8');
console.log('Success fetchSugs fix');
