const fs = require('fs');
let code = fs.readFileSync('src/js/3_views.js', 'utf8');

const regex = /if \(\!isInactive\) \{[\s\S]{1,100}const cleanRoute = latestCleanRouteMap\.get\(pl\);[\s\S]{1,600}rData\.models\[model\] = \(rData\.models\[model\] \|\| 0\) \+ 1;\s*if \(prov\) operatorProvinces\.add\(prov\);\s*\}\s*\}/;

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

if (regex.test(code)) {
    code = code.replace(regex, rep2);
    fs.writeFileSync('src/js/3_views.js', code, 'utf8');
    console.log('Success target 2');
} else {
    console.log('Failed to match target 2 with loose regex');
}
