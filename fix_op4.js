const fs = require('fs');
let code = fs.readFileSync('src/js/3_views.js', 'utf8');

const target1 = `                        sortedPhotos.forEach(p => {
                            if (p.license_plate && p.route_no && p.route_no !== '---') {
                                const pl = p.license_plate.toUpperCase();
                                if (!latestCleanRouteMap.has(pl)) {
                                    latestCleanRouteMap.set(pl, p.route_no.trim());
                                }
                            }
                        });`;

const rep1 = `                        sortedPhotos.forEach(p => {
                            if (p.license_plate && p.route_no && p.route_no !== '---') {
                                const pl = p.license_plate.toUpperCase();
                                if (!latestCleanRouteMap.has(pl)) {
                                    let r = p.route_no.trim();
                                    let prov = '';
                                    if (p.borrowed_route) {
                                        const parts = p.borrowed_route.split(' - ');
                                        r = parts[0].trim();
                                        if (parts.length > 1) prov = parts[1].trim();
                                    } else {
                                        const extractedProv = app.utils.getProvinceFromPlate(pl);
                                        if (extractedProv && !extractedProv.includes('hông xác') && !extractedProv.includes('iển tạm')) {
                                            prov = extractedProv;
                                        }
                                    }
                                    latestCleanRouteMap.set(pl, { route: r, prov: prov });
                                }
                            }
                        });`;

if (code.includes(target1)) {
    code = code.replace(target1, rep1);
    fs.writeFileSync('src/js/3_views.js', code, 'utf8');
    console.log('Success block 1');
} else {
    console.log('Failed to match block 1');
}
