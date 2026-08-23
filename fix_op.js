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

code = code.replace(target1, rep1);

const target2Regex = /if \(!isInactive\) \{\s*const cleanRoute = latestCleanRouteMap\.get\(pl\);\s*if \(cleanRoute && cleanRoute !== '---' && !specialRoutes\.includes\(cleanRoute\)\) \{\s*const extractedProv = app\.utils\.getProvinceFromPlate\(pl\);\s*let prov = '';\s*if \(extractedProv && [^\{]+\{\s*prov = extractedProv;\s*\}\s*const routeKey = cleanRoute\.toLowerCase\(\) \+ '\|' \+ prov;\s*if \(!activeRoutesMap\.has\(routeKey\)\) \{\s*activeRoutesMap\.set\(routeKey, \{ route: cleanRoute, prov: prov, count: 0, models: \{\} \}\);\s*\}\s*const rData = activeRoutesMap\.get\(routeKey\);\s*rData\.count\+\+;\s*rData\.models\[model\] = \(rData\.models\[model\] \|\| 0\) \+ 1;\s*if \(prov\) operatorProvinces\.add\(prov\);\s*\}\s*\}/;

const rep2 = `if (!isInactive) {
                                const rDataMap = latestCleanRouteMap.get(pl);
                                if (rDataMap && rDataMap.route && rDataMap.route !== '---' && !specialRoutes.includes(rDataMap.route)) {
                                    const cleanRoute = rDataMap.route;
                                    const prov = rDataMap.prov;
                                    const routeKey = cleanRoute.toLowerCase() + '|' + prov;
                                    if (!activeRoutesMap.has(routeKey)) {
                                        activeRoutesMap.set(routeKey, { route: cleanRoute, prov: prov, count: 0, models: {} });
                                    }
                                    const rData = activeRoutesMap.get(routeKey);
                                    rData.count++;
                                    rData.models[model] = (rData.models[model] || 0) + 1;
                                    if (prov) operatorProvinces.add(prov);
                                }
                            }`;

code = code.replace(target2Regex, rep2);

fs.writeFileSync('src/js/3_views.js', code, 'utf8');
console.log('Success operator routes');
