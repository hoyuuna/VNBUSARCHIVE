const fs = require('fs');
const files = fs.readdirSync('src/js').filter(f => f.endsWith('.js'));
for (const file of files) {
  let content = fs.readFileSync('src/js/' + file, 'utf8');
  // We want to match: fetch(quote/api/
  // And replace with: fetch(app.api.baseUrl + quote/api/
  let modified = content.replace(/fetch\((['"`])\/api\//g, "fetch(app.api.baseUrl + $1/api/");
  if (modified !== content) {
    fs.writeFileSync('src/js/' + file, modified);
    console.log('Updated', file);
  }
}
