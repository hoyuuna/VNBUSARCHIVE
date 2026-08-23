const fs = require('fs');
let code = fs.readFileSync('src/js/3_views.js', 'utf8');

const target1 = /\/route\/\' \+ encodeURIComponent\(\'\$\{vehPrefix\}\'\) \+/g;
const replace1 = "/route/' + encodeURIComponent('${vehProvName}') +";
code = code.replace(target1, replace1);

const target2 = /app\.utils\.navigate\(\'\$\{vehPrefix\}\' \?/g;
const replace2 = "app.utils.navigate('${vehProvName}' ?";
code = code.replace(target2, replace2);

fs.writeFileSync('src/js/3_views.js', code, 'utf8');
console.log('Success vehProvName fix');
