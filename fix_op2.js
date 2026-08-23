const fs = require('fs');
let code = fs.readFileSync('src/js/3_views.js', 'utf8');

const target2Regex = /if \(\!isInactive\) \{[\s\S]*?const cleanRoute = latestCleanRouteMap\.get\(pl\);[\s\S]*?if \(cleanRoute && cleanRoute !== '---\' && \!specialRoutes\.includes\(cleanRoute\)\) \{[\s\S]*?const extractedProv = app\.utils\.getProvinceFromPlate\(pl\);[\s\S]*?let prov = '';[\s\S]*?if \(extractedProv && [^\}]+\}?\s*const routeKey = cleanRoute\.toLowerCase\(\) \+ '\|' \+ prov;[\s\S]*?if \(\!activeRoutesMap\.has\(routeKey\)\) \{[\s\S]*?activeRoutesMap\.set\(routeKey, \{ route: cleanRoute, prov: prov, count: 0, models: \{\} \}\);[\s\S]*?\}[\s\S]*?const rData = activeRoutesMap\.get\(routeKey\);[\s\S]*?rData\.count\+\+;[\s\S]*?rData\.models\[model\] = \(rData\.models\[model\] \|\| 0\) \+ 1;[\s\S]*?if \(prov\) operatorProvinces\.add\(prov\);[\s\S]*?\}[\s\S]*?\}/;

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

if (target2Regex.test(code)) {
    code = code.replace(target2Regex, rep2);
    fs.writeFileSync('src/js/3_views.js', code, 'utf8');
    console.log('Success target 2');
} else {
    console.log('Failed to match target 2');
}
