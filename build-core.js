const fs = require('fs');
const path = require('path');
const { execSync, execFileSync } = require('child_process');

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

        // Lưu file public/app.js
        const appJsPath = path.join(__dirname, 'public', 'app.js');
        fs.writeFileSync(appJsPath, combinedJs);
        console.log('Tạo thành công public/app.js');

        // Lưu trực tiếp nội dung _core.html sang public/index.html
        const indexHtmlPath = path.join(__dirname, 'public', 'index.html');
        fs.writeFileSync(indexHtmlPath, content);
        
        console.log('Tạo thành công public/index.html (Dạng trang web tiêu chuẩn)');

        // (Tuỳ chọn) Cố gắng xóa file _core.js cũ nếu tồn tại
        const oldCorePath = path.join(__dirname, 'functions', 'api', '_core.js');
        if (fs.existsSync(oldCorePath)) {
            try { fs.unlinkSync(oldCorePath); } catch(e){}
        }
    } else {
        console.warn('_core.html không tồn tại.');
    }

    // Build CSP headers
    const cspPath = path.join(__dirname, 'csp.json');
    if (fs.existsSync(cspPath)) {
        const cspObj = JSON.parse(fs.readFileSync(cspPath, 'utf8'));
        let cspString = Object.entries(cspObj).map(([key, values]) => {
            return `${key} ${values.join(' ')}`;
        }).join('; ') + ';';
        
        const headersContent = `/*\n  Content-Security-Policy: ${cspString}\n  Referrer-Policy: strict-origin-when-cross-origin\n\n/tailwind.css\n  Cache-Control: no-store, no-cache, must-revalidate, max-age=0\n  Pragma: no-cache\n  Expires: 0\n`;
        fs.writeFileSync(path.join(__dirname, 'public', '_headers'), headersContent);
        console.log('Đã tạo public/_headers từ csp.json (kèm Cache-Control no-store cho tailwind.css)');
    }

    // Build Tailwind CSS
    try {
        console.log('Đang biên dịch Tailwind CSS...');
        const tailwindExe = path.join(__dirname, 'tailwind.exe');
        const inputCssPath = path.join(__dirname, 'src', 'input.css');
        const outputCssPath = path.join(__dirname, 'public', 'tailwind.css');

        if (fs.existsSync(tailwindExe)) {
            execFileSync(tailwindExe, ['-i', inputCssPath, '-o', outputCssPath, '--minify'], { stdio: 'inherit' });
            console.log('Biên dịch Tailwind CSS thành công (qua tailwind.exe)!');
        } else {
            execSync(`npx -y tailwindcss -i "${inputCssPath}" -o "${outputCssPath}" --minify`, { stdio: 'inherit' });
            console.log('Biên dịch Tailwind CSS thành công (qua npx tailwindcss)!');
        }
    } catch (twErr) {
        console.warn('Cảnh báo: Lỗi khi biên dịch Tailwind CSS:', twErr.message);
    }
} catch (error) {
    console.error('Lỗi khi build:', error);
    process.exit(1);
}
