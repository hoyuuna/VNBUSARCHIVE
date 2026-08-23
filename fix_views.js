const fs = require('fs');
let code = fs.readFileSync('src/js/3_views.js', 'utf8');

// 1. Replace modal open logic
const openRegex = /\/\/ Fetch borrowed photos[\s\S]*?const \{ data: bPhotos \} = await window\.sb\.from\('photos'\)\.select\('id'\)\.eq\('borrowed_route', routeName\);[\s\S]*?if \(bPhotos && bPhotos\.length > 0\) \{[\s\S]*?document\.getElementById\('route-edit-borrowed'\)\.value = bPhotos\.map\(p => p\.id\)\.join\(', '\);[\s\S]*?\} else \{[\s\S]*?document\.getElementById\('route-edit-borrowed'\)\.value = '';[\s\S]*?\}/;
const openReplacement = `// Fetch borrowed photos
                          const { data: bPhotos } = await window.sb.from('photos').select('id').eq('borrowed_route', routeName);
                          let bList = [];
                          if (bPhotos && bPhotos.length > 0) bList.push(...bPhotos.map(p => p.id));
                          if (exactInfo && exactInfo.metadata && exactInfo.metadata.borrowed_plates) {
                              bList.push(...exactInfo.metadata.borrowed_plates);
                          }
                          document.getElementById('route-edit-borrowed').value = bList.join(', ');`;

code = code.replace(openRegex, openReplacement);

// 2. Replace submit logic
const submitRegex = /const metadataObj = Object\.keys\(metadata\)\.length > 0 \? metadata : null;([\s\S]*?)\/\/ Xử lý cập nhật ID ảnh vá tuyến[\s\S]*?const newBorrowedIds = borrowedPhotosStr \? borrowedPhotosStr\.split\(','\)\.map\(s => parseInt\(s\.trim\(\)\)\)\.filter\(n => !isNaN\(n\)\) : \[\];[\s\S]*?const \{ data: curBorrowed \} = await window\.sb\.from\('photos'\)\.select\('id, license_plate'\)\.eq\('borrowed_route', routeName\);[\s\S]*?const curIds = curBorrowed \? curBorrowed\.map\(p => p\.id\) : \[\];[\s\S]*?const addedIdsRaw = newBorrowedIds\.filter\(id => !curIds\.includes\(id\)\);[\s\S]*?const removedIds = curIds\.filter\(id => !newBorrowedIds\.includes\(id\)\);[\s\S]*?if \(addedIdsRaw\.length > 0\) \{[\s\S]*?const expectedRouteNo = routeName\.split\(' - '\)\[0\];[\s\S]*?const \{ data: validPhotos \} = await window\.sb\.from\('photos'\)\.select\('id, route_no'\)\.in\('id', addedIdsRaw\);[\s\S]*?const trulyAddedIds = \(validPhotos \|\| \[\]\)\.filter\(p => p\.route_no === expectedRouteNo\)\.map\(p => p\.id\);[\s\S]*?if \(trulyAddedIds\.length > 0\) \{[\s\S]*?await window\.sb\.from\('photos'\)\.update\(\{ borrowed_route: routeName \}\)\.in\('id', trulyAddedIds\);[\s\S]*?\}[\s\S]*?\}[\s\S]*?if \(removedIds\.length > 0\) \{/;

const submitReplacement = `let metadataObj = Object.keys(metadata).length > 0 ? metadata : null;
                      const rawInputList = borrowedPhotosStr ? borrowedPhotosStr.split(',').map(s => s.trim()).filter(Boolean) : [];
                      const enteredIdsStr = rawInputList.filter(s => /^\\d+$/.test(s));
                      const enteredPlates = rawInputList.filter(s => !/^\\d+$/.test(s));
                      const newBorrowedIds = enteredIdsStr.map(Number);
                      
                      if (enteredPlates.length > 0) {
                          metadataObj = metadataObj || {};
                          metadataObj.borrowed_plates = enteredPlates;
                      } else if (metadataObj && metadataObj.borrowed_plates) {
                          delete metadataObj.borrowed_plates;
                          if (Object.keys(metadataObj).length === 0) metadataObj = null;
                      }$1// Xử lý cập nhật ID ảnh và biển số xe vá tuyến
                                  const { data: curBorrowed } = await window.sb.from('photos').select('id, license_plate').eq('borrowed_route', routeName);
                                  const curIds = curBorrowed ? curBorrowed.map(p => p.id) : [];
                                  const addedIdsRaw = newBorrowedIds.filter(id => !curIds.includes(id));
                                  const removedIds = curIds.filter(id => !newBorrowedIds.includes(id));
                                  
                                  const expectedRouteNo = routeName.split(' - ')[0];
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
                                          await window.sb.from('photos').update({ borrowed_route: routeName }).in('id', trulyAddedIds);
                                      }
                                  }
                                  
                                  let finalRemovedIds = removedIds;
                                  if (enteredPlates.length > 0 && curBorrowed) {
                                      finalRemovedIds = removedIds.filter(id => {
                                          const photo = curBorrowed.find(p => p.id === id);
                                          return !(photo && enteredPlates.some(plate => plate.toLowerCase() === photo.license_plate.toLowerCase()));
                                      });
                                  }
                                  if (finalRemovedIds.length > 0) {`;

code = code.replace(submitRegex, submitReplacement);
fs.writeFileSync('src/js/3_views.js', code, 'utf8');
console.log("3_views.js updated");
