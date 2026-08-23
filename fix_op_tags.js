const fs = require('fs');
let code = fs.readFileSync('src/js/3_views.js', 'utf8');

const regex1 = /sortedPhotos\.forEach\(p => \{[\s\S]*?if \(p\.license_plate && p\.route_no && p\.route_no !== '---\'\) \{[\s\S]*?const pl = p\.license_plate\.toUpperCase\(\);[\s\S]*?if \(!latestCleanRouteMap\.has\(pl\)\) \{[\s\S]*?latestCleanRouteMap\.set\(pl, p\.route_no\.trim\(\)\);[\s\S]*?\}[\s\S]*?\}[\s\S]*?\}\);/;

const replace1 = `sortedPhotos.forEach(p => {
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
code = code.replace(regex1, replace1);

const regex2 = /if \(\!isInactive\) \{[\s\S]*?const cleanRoute = latestCleanRouteMap\.get\(pl\);[\s\S]*?if \(cleanRoute && cleanRoute !== '---\' && \!specialRoutes\.includes\(cleanRoute\)\) \{[\s\S]*?const extractedProv = app\.utils\.getProvinceFromPlate\(pl\);[\s\S]*?let prov = '';[\s\S]*?if \(extractedProv && extractedProv !== 'KhA'ng xAc `<nh' && extractedProv !== 'Bin tm'\) \{[\s\S]*?prov = extractedProv;[\s\S]*?\}[\s\S]*?const routeKey = cleanRoute\.toLowerCase\(\) \+ '\|' \+ prov;[\s\S]*?if \(\!activeRoutesMap\.has\(routeKey\)\) \{[\s\S]*?activeRoutesMap\.set\(routeKey, \{ route: cleanRoute, prov: prov, count: 0, models: \{\} \}\);[\s\S]*?\}[\s\S]*?const rData = activeRoutesMap\.get\(routeKey\);[\s\S]*?rData\.count\+\+;[\s\S]*?rData\.models\[model\] = \(rData\.models\[model\] \|\| 0\) \+ 1;[\s\S]*?if \(prov\) operatorProvinces\.add\(prov\);[\s\S]*?\}[\s\S]*?\}/;

// Wait, because of encoding issues, I'll use a simpler regex for the second part.
const regex3 = /if \(!isInactive\) \{[\s\S]*?const cleanRoute = latestCleanRouteMap\.get\(pl\);[\s\S]*?if \(cleanRoute && cleanRoute !== '---\' && \!specialRoutes\.includes\(cleanRoute\)\) \{[\s\S]*?const extractedProv = app\.utils\.getProvinceFromPlate\(pl\);[\s\S]*?let prov = '';[\s\S]*?if \(extractedProv && [^\}]+\}?\s*const routeKey = cleanRoute\.toLowerCase\(\) \+ '\|' \+ prov;[\s\S]*?if \(!activeRoutesMap\.has\(routeKey\)\) \{[\s\S]*?activeRoutesMap\.set\(routeKey, \{ route: cleanRoute, prov: prov, count: 0, models: \{\} \}\);[\s\S]*?\}[\s\S]*?const rData = activeRoutesMap\.get\(routeKey\);[\s\S]*?rData\.count\+\+;[\s\S]*?rData\.models\[model\] = \(rData\.models\[model\] \|\| 0\) \+ 1;[\s\S]*?if \(prov\) operatorProvinces\.add\(prov\);[\s\S]*?\}[\s\S]*?\}/;
