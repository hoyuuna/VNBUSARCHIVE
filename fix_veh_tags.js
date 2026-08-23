const fs = require('fs');
let code = fs.readFileSync('src/js/3_views.js', 'utf8');

let regex1 = /let currentRouteClientSide = '';\s*let currentOpClientSide = '';/;
let replace1 = `let currentRouteClientSide = '';\nlet currentOpClientSide = '';\nlet currentRouteProvName = null;`;
code = code.replace(regex1, replace1);

let regex2 = /currentRouteClientSide = r;\s*\} else if \(r === 'Ngo[^']+'\)/;
let replace2 = `currentRouteClientSide = r;\nif (latestPhoto.borrowed_route) { const parts = latestPhoto.borrowed_route.split(' - '); if (parts.length > 1) currentRouteProvName = parts[1].trim(); }\n} else if (r === 'Ngoài giờ hoạt động')`;
// Actually, it's safer to capture the group:
regex2 = /(currentRouteClientSide = r;)(\s*\} else if \(r === 'Ngo[^']+'\))/;
replace2 = `$1\n                                if (latestPhoto.borrowed_route) { const parts = latestPhoto.borrowed_route.split(' - '); if (parts.length > 1) currentRouteProvName = parts[1].trim(); }$2`;
code = code.replace(regex2, replace2);

let regex3 = /(currentRouteClientSide = \(latestValid\.route_no \|\| ''\)\.trim\(\);)(\s*currentOpClientSide = latestValid\.operator \|\| '';)/;
let replace3 = `$1$2\n                                    if (latestValid.borrowed_route) { const parts = latestValid.borrowed_route.split(' - '); if (parts.length > 1) currentRouteProvName = parts[1].trim(); }`;
code = code.replace(regex3, replace3);

let regex4 = /const vehProvName = app\.utils\.getProvinceFromPlate\(vehicle\.license_plate\);/;
let replace4 = `const vehProvName = currentRouteProvName || app.utils.getProvinceFromPlate(vehicle.license_plate);`;
code = code.replace(regex4, replace4);

fs.writeFileSync('src/js/3_views.js', code, 'utf8');
console.log('Success vehicle profile tags');
