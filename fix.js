const fs = require('fs');
let code = fs.readFileSync('src/js/page_vehicle.js', 'utf8');

const regex = /<div class="flex flex-col sm:flex-1 min-w-0" style="\$\{isStopped \? 'display: none;' : ''\}">[\s\S]*?<input type="text" value="\$\{app\.utils\.escapeAttr\(h\.operator\)\}" placeholder="Đơn vị" oninput="app\.utils\.formatNoPunctuation\(this\)" onchange="app\.vehicle\.updateHistoryItem\(\$\{index\}, 'operator', this\.value, '\$\{prefix\}'\)" class="hist-input" \$\{isStopped \? 'disabled' : ''\}>[\s\S]*?<\/div>\s*<div class="flex flex-col sm:flex-1 min-w-0">\s*<span class="sm:hidden font-bold text-gray-500 mb-1">Tuyến<\/span>\s*<input type="text" value="\$\{app\.utils\.escapeAttr\(h\.route \|\| ''\)\}" placeholder="Tuyến" onchange="app\.vehicle\.updateHistoryItem\(\$\{index\}, 'route', this\.value, '\$\{prefix\}'\)" class="hist-input">\s*<\/div>/g;

const newStr = `<div id="\${prefix}hist-op-wrapper-\${index}" class="flex flex-col sm:flex-1 min-w-0 \${isStopped ? 'hidden' : ''}">
                                      <span class="sm:hidden font-bold text-gray-500 mb-1">Đơn vị</span>
                                      <input id="\${prefix}hist-op-input-\${index}" type="text" value="\${app.utils.escapeAttr(h.operator)}" placeholder="Đơn vị" oninput="app.utils.formatNoPunctuation(this)" onchange="app.vehicle.updateHistoryItem(\${index}, 'operator', this.value, '\${prefix}')" class="hist-input \${isStopped ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}" \${isStopped ? 'disabled' : ''}>
                                  </div>
                                  <div class="flex flex-col sm:flex-1 min-w-0">
                                      <span class="sm:hidden font-bold text-gray-500 mb-1">Tuyến</span>
                                      <input type="text" value="\${app.utils.escapeAttr(h.route || '')}" placeholder="Tuyến" oninput="app.utils.checkRouteStatus(this.value, '\${prefix}hist-op-input-\${index}', '\${prefix}hist-op-wrapper-\${index}')" onchange="app.vehicle.updateHistoryItem(\${index}, 'route', this.value, '\${prefix}'); app.vehicle.updateHistoryItem(\${index}, 'operator', document.getElementById('\${prefix}hist-op-input-\${index}').value, '\${prefix}')" class="hist-input">
                                  </div>`;

if (code.match(regex)) {
    code = code.replace(regex, newStr);
    fs.writeFileSync('src/js/page_vehicle.js', code, 'utf8');
    console.log('SUCCESS');
} else {
    console.log('STILL NOT FOUND!');
}
