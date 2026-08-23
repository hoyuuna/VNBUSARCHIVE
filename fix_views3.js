const fs = require('fs');
let code = fs.readFileSync('src/js/3_views.js', 'utf8');

const regex = /\/\/ Fetch borrowed photos[\s\S]*?const \{ data: bPhotos \} = await window\.sb\.from\('photos'\)\.select\('id'\)\.eq\('borrowed_route', routeName\);[\s\S]*?let bList = \[\];[\s\S]*?if \(bPhotos && bPhotos\.length > 0\) bList\.push\(\.\.\.bPhotos\.map\(p => p\.id\)\);[\s\S]*?if \(exactInfo && exactInfo\.metadata && exactInfo\.metadata\.borrowed_plates\) \{[\s\S]*?bList\.push\(\.\.\.exactInfo\.metadata\.borrowed_plates\);[\s\S]*?\}[\s\S]*?document\.getElementById\('route-edit-borrowed'\)\.value = bList\.join\(', '\);/;

const replacement = `// Fetch borrowed photos
                          const { data: bPhotos } = await window.sb.from('photos').select('id, license_plate').eq('borrowed_route', routeName);
                          let bList = [];
                          let plates = [];
                          if (exactInfo && exactInfo.metadata && exactInfo.metadata.borrowed_plates) {
                              plates = exactInfo.metadata.borrowed_plates;
                          }
                          if (bPhotos && bPhotos.length > 0) {
                              bPhotos.forEach(p => {
                                  if (!plates.some(pl => pl.toLowerCase() === p.license_plate.toLowerCase())) {
                                      bList.push(p.id);
                                  }
                              });
                          }
                          bList.push(...plates);
                          document.getElementById('route-edit-borrowed').value = bList.join(', ');`;

if (regex.test(code)) {
    fs.writeFileSync('src/js/3_views.js', code.replace(regex, replacement), 'utf8');
    console.log("Success 3_views.js");
} else {
    console.log("Regex failed 3_views.js");
}
