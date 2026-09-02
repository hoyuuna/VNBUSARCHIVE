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
        
        // Generate version string (Force UTC+7)
        const pad = (n) => String(n).padStart(2, '0');
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const gmt7 = new Date(utc + (3600000 * 7));
        const versionStr = `${String(gmt7.getFullYear()).slice(-2)}.${pad(gmt7.getMonth()+1)}.${pad(gmt7.getDate())}.${pad(gmt7.getHours())}.${pad(gmt7.getMinutes())}.${pad(gmt7.getSeconds())}`;
        
        const versionJsonPath = path.join(__dirname, 'version.json');
        fs.writeFileSync(versionJsonPath, JSON.stringify({ version: versionStr }));
        console.log(`Đã tạo version.json với phiên bản: ${versionStr}`);
        
        let combinedJs = `window.APP_VERSION = "${versionStr}";\n`;
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

        // Cache-buster dùng chung
        const cacheBust = Date.now();

        // Chèn script app.js với cache-buster vào _core.html
        let finalHtml = content.replace('</body>', `<script src="/app.js?v=${cacheBust}"></script>\n</body>`);

        // Thay thế BUILD_VERSION_PLACEHOLDER trong link CSS theme
        finalHtml = finalHtml.replace(/BUILD_VERSION_PLACEHOLDER/g, String(cacheBust));

        // Lưu trực tiếp nội dung sang public/index.html
        const indexHtmlPath = path.join(__dirname, 'public', 'index.html');
        fs.writeFileSync(indexHtmlPath, finalHtml);
        
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
        
        const noStore = 'no-store, no-cache, must-revalidate, max-age=0';
        const headersContent = [
            `/*`,
            `  Content-Security-Policy: ${cspString}`,
            `  Referrer-Policy: strict-origin-when-cross-origin`,
            ``,
            `/index.html`,
            `  Cache-Control: no-cache, no-store, must-revalidate`,
            ``,
            `/`,
            `  Cache-Control: no-cache, no-store, must-revalidate`,
            ``,
            `/app.js`,
            `  Cache-Control: ${noStore}`,
            `  Pragma: no-cache`,
            `  Expires: 0`,
            ``,
            `/tailwind.css`,
            `  Cache-Control: ${noStore}`,
            `  Pragma: no-cache`,
            `  Expires: 0`,
            ``,
            `/css/light.css`,
            `  Cache-Control: ${noStore}`,
            `  Pragma: no-cache`,
            `  Expires: 0`,
            ``,
            `/css/dark.css`,
            `  Cache-Control: ${noStore}`,
            `  Pragma: no-cache`,
            `  Expires: 0`,
            ``
        ].join('\n');

        fs.writeFileSync(path.join(__dirname, 'public', '_headers'), headersContent);
        console.log('Đã tạo public/_headers từ csp.json (kèm Cache-Control no-store cho mọi asset)');
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
