const fs = require('fs');
let code = fs.readFileSync('src/js/3_views.js', 'utf8');

const regex1 = /sortedPhotos\.forEach\(p => \{\s*if \(p\.license_plate && p\.route_no && p\.route_no !== '---'\) \{\s*const pl = p\.license_plate\.toUpperCase\(\);\s*if \(!latestCleanRouteMap\.has\(pl\)\) \{\s*latestCleanRouteMap\.set\(pl, p\.route_no\.trim\(\)\);\s*\}\s*\}\s*\}\);/;

const rep1 = `sortedPhotos.forEach(p => {
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
                                        if (extractedProv && !extractedProv.includes('KhA') && !extractedProv.includes('Bi')) {
                                            prov = extractedProv;
                                        }
                                    }
                                    latestCleanRouteMap.set(pl, { route: r, prov: prov });
                                }
                            }
                        });`;

if (regex1.test(code)) {
    code = code.replace(regex1, rep1);
    fs.writeFileSync('src/js/3_views.js', code, 'utf8');
    console.log('Success block 1 regex');
} else {
    console.log('Failed block 1 regex');
}
