const fs = require('fs');
let code = fs.readFileSync('src/js/3_views.js', 'utf8');

const regex1 = /let currentRouteClientSide = '';\s*let currentOpClientSide = '';\s*if \(allPhotos\.length > 0\) \{/;
const replace1 = `let currentRouteClientSide = '';
                        let currentOpClientSide = '';
                        let currentRouteProvName = null;
                        if (allPhotos.length > 0) {`;
code = code.replace(regex1, replace1);

const regex2 = /currentRouteClientSide = r;\s*\} else if \(r === 'NgoAi gi\? hot \\`\Tng'\) \{/;
const replace2 = `currentRouteClientSide = r;
                                if (latestPhoto.borrowed_route) {
                                    const parts = latestPhoto.borrowed_route.split(' - ');
                                    if (parts.length > 1) currentRouteProvName = parts[1].trim();
                                }
                            } else if (r === 'Ngoài giờ hoạt động') {`;
code = code.replace(regex2, replace2); // Oh wait, powershell encoding might screw up the string 'Ngoài giờ hoạt động'. Let's use a simpler regex!
