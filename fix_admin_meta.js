const fs = require('fs');
let code = fs.readFileSync('src/js/5_admin.js', 'utf8');

const regex = /const metadataObj = Object\.keys\(metadata\)\.length > 0 \? metadata : null;/;
const replacement = `let metadataObj = Object.keys(metadata).length > 0 ? metadata : null;
                            const rawInputListAdmin = borrowedPhotosStr ? borrowedPhotosStr.split(',').map(s => s.trim()).filter(Boolean) : [];
                            const enteredPlatesAdmin = rawInputListAdmin.filter(s => !/^\\d+$/.test(s));
                            if (enteredPlatesAdmin.length > 0) {
                                metadataObj = metadataObj || {};
                                metadataObj.borrowed_plates = enteredPlatesAdmin;
                            } else if (metadataObj && metadataObj.borrowed_plates) {
                                delete metadataObj.borrowed_plates;
                                if (Object.keys(metadataObj).length === 0) metadataObj = null;
                            }`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/js/5_admin.js', code, 'utf8');
console.log("5_admin.js metadata updated");
