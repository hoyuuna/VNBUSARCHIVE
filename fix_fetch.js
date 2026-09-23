const fs = require('fs');
const glob = require('glob');

// I will just use readdirSync and process all js files in src/js
const files = fs.readdirSync('src/js').filter(f => f.endsWith('.js'));
for (const file of files) {
  let content = fs.readFileSync('src/js/' + file, 'utf8');
  // replace fetch('/api/ with fetch(app.api.baseUrl + '/api/
  let modified = content.replace(/fetch\(['"`]\/api\//g, "fetch(app.api.baseUrl + '/api/");
  if (modified !== content) {
    fs.writeFileSync('src/js/' + file, modified);
    console.log('Updated', file);
  }
}
