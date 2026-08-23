const fs = require('fs');
let code = fs.readFileSync('src/js/1_init.js', 'utf8');

const regex = /if \(filterType === 'route' \|\| filterType === 'all'\) \{[\s\S]*?catch \(e\) \{ console\.error\(".*?:", e\); \}\s*\}\)\(\)\);\s*\}/;

const replacement = `                    if (filterType === 'route' || filterType === 'all') {
                        cardPromises.push((async () => {
                            try {
                                let rQuery = window.sb.from('photos').select('route_no, operator').eq('status', 'approved');
                                searchWords.forEach(w => { rQuery = rQuery.ilike('route_no', \`%\${w}%\`); });
                                const { data: rData } = await rQuery.limit(50);
                                if (rData) {
                                    let uniqueRoutesMap = new Map();
                                    rData.forEach(p => {
                                        if (p.route_no && p.route_no !== 'Khác' && p.route_no !== 'Không rõ') {
                                            const key = p.route_no.toLowerCase();
                                            if (!uniqueRoutesMap.has(key)) {
                                                uniqueRoutesMap.set(key, { r: p.route_no, op: p.operator });
                                            }
                                        }
                                    });
                                    const finalRoutes = Array.from(uniqueRoutesMap.values()).slice(0, 4);
                                    for (const info of finalRoutes) {
                                        const r = info.r;
                                        routeCards.push(\`
                                            <div class="bg-white border border-gray-200 rounded-md p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition" onclick="app.searchRedirect('\${app.utils.escapeAttr(r)}', 'route')">
                                                <div class="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl shrink-0"><i class="fa-solid fa-route"></i></div>
                                                <div class="overflow-hidden min-w-0 flex-1">
                                                    <div class="font-bold text-black text-sm overflow-x-auto whitespace-nowrap no-scrollbar">\${app.utils.cleanText(r)}</div>
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
