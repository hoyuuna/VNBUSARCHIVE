const fs = require('fs');
let code = fs.readFileSync('src/js/1_init.js', 'utf8');

const regex = /if \(filterType === 'route' \|\| filterType === 'all'\) \{[\s\S]*?catch \(e\) \{ console\.error\("Lỗi tìm Tuyến:", e\); \}\s*\}\)\(\)\);\s*\}/;

const replacement = `                    if (filterType === 'route' || filterType === 'all') {
                        cardPromises.push((async () => {
                            try {
                                let rQuery = window.sb.from('photos').select('route_no, type, license_plate, borrowed_route').eq('status', 'approved');
                                searchWords.forEach(w => { rQuery = rQuery.ilike('route_no', \`%\${w}%\`); });
                                const { data: rData } = await rQuery.limit(50);
                                if (rData) {
                                    let uniqueRoutesMap = new Map();
                                    rData.forEach(p => {
                                        if (p.route_no && p.route_no !== 'Khác' && p.route_no !== 'Không rõ') {
                                            let prov = '';
                                            if (p.type !== 'coach') {
                                                if (p.borrowed_route) {
                                                    const parts = p.borrowed_route.split(' - ');
                                                    if (parts.length > 1) prov = parts.slice(1).join(' - ').trim();
                                                }
                                                if (!prov && p.license_plate) {
                                                    prov = app.utils.getProvPrefix ? app.utils.getProvPrefix(p.license_plate) : '';
                                                    if (prov === 'Không xác định' || prov === 'Biển tạm' || prov.includes('quân đội')) prov = '';
                                                }
                                            }
                                            const routeNameDB = prov ? \`\${p.route_no} - \${prov}\` : p.route_no;
                                            const key = routeNameDB.toLowerCase();
                                            if (!uniqueRoutesMap.has(key)) {
                                                uniqueRoutesMap.set(key, { r: p.route_no, p: prov, dbName: routeNameDB });
                                            }
                                        }
                                    });
                                    const finalRoutes = Array.from(uniqueRoutesMap.values()).slice(0, 4);
                                    let shortPaths = {};
                                    if (finalRoutes.length > 0) {
                                        const dbNames = finalRoutes.map(i => i.dbName);
                                        const { data: rtInfo } = await window.sb.from('route_info').select('route_name, short_path').in('route_name', dbNames);
                                        if (rtInfo) rtInfo.forEach(rt => { shortPaths[rt.route_name.toLowerCase()] = rt.short_path; });
                                    }
                                    for (const info of finalRoutes) {
                                        let displayR = app.utils.cleanText(info.r) + (info.p ? \` (\${info.p})\` : '');
                                        let sp = shortPaths[info.dbName.toLowerCase()];
                                        if (sp) displayR += \` (\${app.utils.cleanText(sp)})\`;
                                        const routeUrl = info.p ? \`/route/\${encodeURIComponent(info.p)}/\${encodeURIComponent(info.r)}\` : \`/route/\${encodeURIComponent(info.r)}\`;
                                        routeCards.push(\`
                                            <div class="bg-white border border-gray-200 rounded-md p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition" onclick="app.utils.navigate('\${routeUrl.replace(/'/g, "\\\\'")}')">
                                                <div class="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl shrink-0"><i class="fa-solid fa-route"></i></div>
                                                <div class="overflow-hidden min-w-0 flex-1">
                                                    <div class="font-bold text-black text-sm overflow-x-auto whitespace-nowrap no-scrollbar">\${displayR}</div>
                                                    <div class="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5 font-bold">Tuyến xe</div>
                                                </div>
                                            </div>
                                        \`);
                                    }
                                }
                            } catch (e) { console.error("Lỗi tìm Tuyến:", e); }
                        })());
                    }`;

if (regex.test(code)) {
    fs.writeFileSync('src/js/1_init.js', code.replace(regex, replacement), 'utf8');
    console.log("Success");
} else {
    console.log("Failed to match regex");
}
