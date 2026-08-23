const fs = require('fs');
let code = fs.readFileSync('src/js/1_init.js', 'utf8');

const regex = /rData\.forEach\(p => \{\s*if \(p\.route_no && p\.route_no !== \'[^\']+\' && p\.route_no !== \'[^\']+\'\) \{\s*let prov = \'\';/g;

const replace = `const specialRoutes = ['Dừng hoạt động', 'Ngoại giờ hoạt động', 'Chưa hoạt động', 'Hợp đồng', 'Xe hợp đồng / Đưa đón'];
                                    rData.forEach(p => {
                                        if (p.type === 'coach') return;
                                        if (p.route_no && p.route_no !== 'Khác' && p.route_no !== 'Không rõ' && !specialRoutes.includes(p.route_no)) {
                                            let prov = '';`;

if(regex.test(code)) {
    code = code.replace(regex, replace);
    fs.writeFileSync('src/js/1_init.js', code, 'utf8');
    console.log('Success card logic');
} else {
    console.log('Failed to match');
}
