const fs = require('fs');
const path = require('path');

try {
    const corePath = path.join(__dirname, '_core.html');
    
    // Đường dẫn tới thư mục chứa các file JS đã chia nhỏ
    const jsDir = path.join(__dirname, 'src', 'js'); 
    
    if (fs.existsSync(corePath)) {
        let content = fs.readFileSync(corePath, 'utf8');
        
        // Đọc tất cả các file JS theo thứ tự (rất quan trọng)
        const jsFiles = [
            '1_init.js',
            '2_auth.js',
            '3_views.js',
            '4_content.js',
            '5_admin.js'
        ];
        
        let combinedJs = '';
        jsFiles.forEach(file => {
            const filePath = path.join(jsDir, file);
            if (fs.existsSync(filePath)) {
                combinedJs += `\n/* --- MODULE: ${file} --- */\n`;
                combinedJs += fs.readFileSync(filePath, 'utf8');
            } else {
                console.warn(`File ${file} không tồn tại.`);
            }
        });

        // Tự động tìm thẻ <!-- INJECT_JS --> trong _core.html để chèn code vào
        const injectTag = '<!-- INJECT_JS -->';
        if (content.includes(injectTag)) {
            content = content.replace(injectTag, `\n${combinedJs}\n`);
            console.log('Đã gộp 5 file JS vào HTML thành công!');
        } else {
            console.warn('Không tìm thấy thẻ <!-- INJECT_JS --> trong _core.html. Bỏ qua gộp JS.');
        }

        // Mã hóa Base64
        const base64 = Buffer.from(content).toString('base64');
        
        const outPath = path.join(__dirname, 'functions', 'api', '_core.js');
        // Ensure functions/api exists
        if (!fs.existsSync(path.dirname(outPath))) {
            fs.mkdirSync(path.dirname(outPath), { recursive: true });
        }
        
        fs.writeFileSync(outPath, 'export const coreBase64 = `' + base64 + '`;\n');
        
        console.log('Tạo thành công functions/api/_core.js (Bảo mật Base64)');
    } else {
        console.warn('_core.html không tồn tại.');
    }
} catch (error) {
    console.error('Lỗi khi build:', error);
    process.exit(1);
}
