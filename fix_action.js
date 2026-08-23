const fs = require('fs');
let code = fs.readFileSync('functions/api/admin/action.js', 'utf8');

const regex = /const \{ error: vError \} = await sbAdmin\.from\('vehicles'\)[\s\S]*?const \{ error: photoUpdateErr \} = await sbAdmin\.from\('photos'\)\.update\(\{([\s\S]*?)\}\)\.eq\('id', photoId\);/;

const replacement = `            let borrowedRouteToAssign = null;
            if (route) {
                const { data: rtInfo } = await sbAdmin.from('route_info')
                    .select('route_name, metadata')
                    .like('route_name', \`\${route} - %\`);
                if (rtInfo) {
                    for (const rt of rtInfo) {
                        if (rt.metadata && rt.metadata.borrowed_plates && Array.isArray(rt.metadata.borrowed_plates)) {
                            if (rt.metadata.borrowed_plates.some(p => p.toLowerCase() === plate.toLowerCase())) {
                                borrowedRouteToAssign = rt.route_name;
                                break;
                            }
                        }
                    }
                }
            }

            const { error: vError } = await sbAdmin.from('vehicles')
                .upsert({ license_plate: plate, model: model }, { onConflict: 'license_plate' });
            if (vError) throw vError;

            const updatePayload = {$1};
            if (borrowedRouteToAssign) {
                updatePayload.borrowed_route = borrowedRouteToAssign;
            }
            
            const { error: photoUpdateErr } = await sbAdmin.from('photos').update(updatePayload).eq('id', photoId);`;

if (regex.test(code)) {
    fs.writeFileSync('functions/api/admin/action.js', code.replace(regex, replacement), 'utf8');
    console.log("action.js updated");
} else {
    console.log("action.js regex failed");
}
