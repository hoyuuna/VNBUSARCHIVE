const fs = require('fs');
const iconv = require('iconv-lite');

function fixMojibakeFile(filePath) {
    console.log('Fixing: ' + filePath);
    // Read the file as UTF-8 (which has the double-encoded mojibake)
    const contentUtf8 = fs.readFileSync(filePath, 'utf8');
    
    // Convert the string back to bytes using Windows-1252 (or ISO-8859-1)
    // Actually, in Node, Buffer.from(contentUtf8, 'binary') does ISO-8859-1, but Windows-1252 is better handled by iconv-lite.
    // Let's try iconv-lite win1252 encoding to bytes, then decode as utf8.
    let buf;
    try {
        buf = iconv.encode(contentUtf8, 'win1252');
    } catch(e) {
        console.log('Failed win1252, trying binary...');
        buf = Buffer.from(contentUtf8, 'binary');
    }
    
    // Decode the bytes as UTF-8
    let fixedStr = buf.toString('utf8');
    
    // Check if it looks better
    if (fixedStr.includes('Lưu thông tin') || fixedStr.includes('Đã cập nhật')) {
        console.log('SUCCESS for ' + filePath);
    } else {
        console.log('Not sure if fixed for ' + filePath);
    }
    
    fs.writeFileSync(filePath, fixedStr, 'utf8');
}

// Fix page_vehicle.js
fixMojibakeFile('src/js/page_vehicle.js');
