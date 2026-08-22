const fs = require('fs');
const path = require('path');

const walkSync = function(dir, filelist) {
  let files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(dir + '/' + file).isDirectory()) {
      filelist = walkSync(dir + '/' + file, filelist);
    }
    else {
      if (file.endsWith('.js')) filelist.push(dir + '/' + file);
    }
  });
  return filelist;
};

const validateFnStr = 'function validateOriginAndReferer(request) {';

const filesList = walkSync('functions/api');
for (const file of filesList) {
    let content = fs.readFileSync(file, 'utf8');
    let count = content.split(validateFnStr).length - 1;
    if (count > 1) {
        console.log('Fixing ' + file + ' count: ' + count);
        // We know exactly what the function looks like:
        const fullFnStr = `function validateOriginAndReferer(request) {
    const referer = request.headers.get('referer') || '';
    const origin = request.headers.get('origin') || '';
    const host = request.headers.get('host') || '';
    const isProduction = host.includes('vnbusarchive.io.vn');
    
    if (!isProduction) return true;
    if (!origin && !referer) return false;
    
    function checkDomain(str) {
        if (!str) return false;
        try {
            const u = new URL(str);
            return u.hostname === 'vnbusarchive.io.vn' || u.hostname.endsWith('.vnbusarchive.io.vn');
        } catch (e) {
            return false;
        }
    }
    return checkDomain(origin) || checkDomain(referer);
}`;
        // We will just do a string replace all occurrences, then add it back exactly once at the top of the file
        content = content.split(fullFnStr).join('');
        // Also sometimes there is a newline after it
        content = content.replace(/\n\n/g, '\n'); 
        
        // Put it back right after the first import or at the top
        if (content.includes('import ')) {
            content = content.replace(/(import .*?;\n)/, match => match + '\n' + fullFnStr + '\n');
        } else {
            content = fullFnStr + '\n' + content;
        }
        
        fs.writeFileSync(file, content);
    }
}
