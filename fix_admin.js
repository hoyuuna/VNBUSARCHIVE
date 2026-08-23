const fs = require('fs');
let code = fs.readFileSync('src/js/5_admin.js', 'utf8');

const regex = /\/\/ Xử lý cập nhật ID ảnh vá tuyến[\s\S]*?const newBorrowedIds = borrowedPhotosStr \? borrowedPhotosStr\.split\(','\)\.map\(s => parseInt\(s\.trim\(\)\)\)\.filter\(n => !isNaN\(n\)\) : \[\];[\s\S]*?const \{ data: curBorrowed \} = await window\.sb\.from\('photos'\)\.select\('id, license_plate'\)\.eq\('borrowed_route', req\.new_data\.route_name\);[\s\S]*?const curIds = curBorrowed \? curBorrowed\.map\(p => p\.id\) : \[\];[\s\S]*?const addedIdsRaw = newBorrowedIds\.filter\(id => !curIds\.includes\(id\)\);[\s\S]*?const removedIds = curIds\.filter\(id => !newBorrowedIds\.includes\(id\)\);[\s\S]*?const targetProvince = req\.new_data\.route_name\.split\(' - '\)\[1\] \|\| '';[\s\S]*?if \(addedIdsRaw\.length > 0\) \{[\s\S]*?const expectedRouteNo = req\.new_data\.route_name\.split\(' - '\)\[0\];[\s\S]*?const \{ data: validPhotos \} = await window\.sb\.from\('photos'\)\.select\('id, route_no'\)\.in\('id', addedIdsRaw\);[\s\S]*?const trulyAddedIds = \(validPhotos \|\| \[\]\)\.filter\(p => p\.route_no === expectedRouteNo\)\.map\(p => p\.id\);[\s\S]*?if \(trulyAddedIds\.length > 0\) \{[\s\S]*?await window\.sb\.from\('photos'\)\.update\(\{ borrowed_route: req\.new_data\.route_name \}\)\.in\('id', trulyAddedIds\);[\s\S]*?\}[\s\S]*?\}[\s\S]*?if \(removedIds\.length > 0\) \{[\s\S]*?const removedPhotos = curBorrowed\.filter\(p => removedIds\.includes\(p\.id\)\);/;

const replacement = `// Xử lý cập nhật ID ảnh và biển số xe vá tuyến
                            const rawInputList = borrowedPhotosStr ? borrowedPhotosStr.split(',').map(s => s.trim()).filter(Boolean) : [];
                            const enteredIdsStr = rawInputList.filter(s => /^\\d+$/.test(s));
                            const enteredPlates = rawInputList.filter(s => !/^\\d+$/.test(s));
                            const newBorrowedIds = enteredIdsStr.map(Number);
                            
                            const { data: curBorrowed } = await window.sb.from('photos').select('id, license_plate').eq('borrowed_route', req.new_data.route_name);
                            const curIds = curBorrowed ? curBorrowed.map(p => p.id) : [];
                            
                            const addedIdsRaw = newBorrowedIds.filter(id => !curIds.includes(id));
                            const removedIds = curIds.filter(id => !newBorrowedIds.includes(id));
                            
                            const expectedRouteNo = req.new_data.route_name.split(' - ')[0];
                            const targetProvince = req.new_data.route_name.split(' - ')[1] || '';
                            
                            if (enteredPlates.length > 0) {
                                const { data: retroPhotos } = await window.sb.from('photos').select('id, route_no').in('license_plate', enteredPlates).eq('route_no', expectedRouteNo);
                                if (retroPhotos && retroPhotos.length > 0) {
                                    retroPhotos.forEach(p => {
                                        if (!curIds.includes(p.id) && !addedIdsRaw.includes(p.id)) {
                                            addedIdsRaw.push(p.id);
                                        }
                                    });
                                }
                            }
                            
                            if (addedIdsRaw.length > 0) {
                                const { data: validPhotos } = await window.sb.from('photos').select('id, route_no').in('id', addedIdsRaw);
                                const trulyAddedIds = (validPhotos || []).filter(p => p.route_no === expectedRouteNo).map(p => p.id);
                                
                                if (trulyAddedIds.length > 0) {
                                    await window.sb.from('photos').update({ borrowed_route: req.new_data.route_name }).in('id', trulyAddedIds);
                                }
                            }
                            
                            let finalRemovedIds = removedIds;
                            if (enteredPlates.length > 0 && curBorrowed) {
                                finalRemovedIds = removedIds.filter(id => {
                                    const photo = curBorrowed.find(p => p.id === id);
                                    return !(photo && enteredPlates.some(plate => plate.toLowerCase() === photo.license_plate.toLowerCase()));
                                });
                            }
                            
                            if (finalRemovedIds.length > 0) {
                                const removedPhotos = curBorrowed.filter(p => finalRemovedIds.includes(p.id));`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/js/5_admin.js', code, 'utf8');
console.log("5_admin.js updated");
