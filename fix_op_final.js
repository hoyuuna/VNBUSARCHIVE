const fs = require('fs');
let code = fs.readFileSync('src/js/3_views.js', 'utf8');

const regex1 = /const uniquePlatesArr = Array\.from\(uniquePlates\);/;
const replace1 = `const uniquePlatesArr = Array.from(uniquePlates);
                        let plateToBorrowed = new Map();
                        for (let i = 0; i < uniquePlatesArr.length; i += 150) {
                            const chunk = uniquePlatesArr.slice(i, i + 150);
                            const { data: bData } = await window.sb.from('photos')
                                .select('license_plate, borrowed_route')
                                .in('license_plate', chunk)
                                .eq('status', 'approved')
                                .not('borrowed_route', 'is', null);
                            if (bData) {
                                bData.forEach(p => {
                                    plateToBorrowed.set(p.license_plate.toUpperCase(), p.borrowed_route);
                                });
                            }
                        }`;
code = code.replace(regex1, replace1);

const regex2 = /const bRoute = p\.borrowed_route;/g; // wait, my previous code didn't use `const bRoute`, it used `if (p.borrowed_route)`
const target2 = `                                    let prov = '';
                                    if (p.borrowed_route) {
                                        const parts = p.borrowed_route.split(' - ');`;
const replace2 = `                                    let prov = '';
                                    const bRoute = p.borrowed_route || plateToBorrowed.get(pl);
                                    if (bRoute) {
                                        const parts = bRoute.split(' - ');`;
code = code.replace(target2, replace2);

fs.writeFileSync('src/js/3_views.js', code, 'utf8');
console.log('Success operator logic');
