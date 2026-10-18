const fs = require('fs');
const path = require('path');
const { execSync, execFileSync } = require('child_process');

try {
    const corePath = path.join(__dirname, '_core.html');
    
    // Đường dẫn tới thư mục chứa các file JS đã chia nhỏ
    const jsDir = path.join(__dirname, 'src', 'js'); 
    
    if (fs.existsSync(corePath)) {
        let content = fs.readFileSync(corePath, 'utf8');
        
        const jsFiles = [
            '00_core.js',
            '01_router.js',
            '02_settings.js',
            '03_auth.js',
            'page_feed.js',
            'page_search.js',
            'page_leaderboard.js',
            'page_help.js',
            'page_reference.js',
            'page_upload.js',
            'page_photo.js',
            'page_vehicle.js',
            'page_admin.js',
            'page_map.js'
        ];
        
        // Generate version string (Force UTC+7)
        const pad = (n) => String(n).padStart(2, '0');
        let combinedJs = ``;
        jsFiles.forEach(file => {
            const filePath = path.join(jsDir, file);
            if (fs.existsSync(filePath)) {
                combinedJs += `\n/* --- MODULE: ${file} --- */\n`;
                combinedJs += fs.readFileSync(filePath, 'utf8');
            } else {
                console.warn(`File ${file} không tồn tại.`);
            }
        });

        // Hash nội dung bundle -> tên file bất biến. CDN bỏ qua query string (?v=) khi cache
        // nên phải đổi hẳn path để không bao giờ phục vụ JS cũ.
        const bundleHash = require('crypto').createHash('sha256').update(combinedJs).digest('hex').slice(0, 12);
        const bundleName = `app.${bundleHash}.js`;
        const publicDir = path.join(__dirname, 'public');

        // Lưu bundle với tên có hash nội dung
        fs.writeFileSync(path.join(publicDir, bundleName), combinedJs);
        console.log(`Tạo thành công public/${bundleName}`);

        // Vẫn ghi public/app.js để tương thích ngược
        fs.writeFileSync(path.join(publicDir, 'app.js'), combinedJs);

        // Tạo/giữ các hash gần đây để phục vụ client có index.html cũ chưa kịp refresh
        const recentLegacyHashes = [
            'app.a5da4f08ea78.js',
            'app.173e67643aa2.js',
            'app.9c0a48a0fcd6.js',
            'app.5eed30d20a62.js',
            'app.ddce8fe63cac.js'
        ];
        recentLegacyHashes.forEach(h => {
            const hPath = path.join(publicDir, h);
            if (!fs.existsSync(hPath)) {
                fs.writeFileSync(hPath, combinedJs);
            }
        });

        // Giữ lại tối đa 30 bundle gần nhất thay vì xóa ngay lập tức
        if (fs.existsSync(publicDir)) {
            const allBundles = fs.readdirSync(publicDir)
                .filter(f => /^app\.[0-9a-f]{12}\.js$/.test(f))
                .map(f => {
                    const filePath = path.join(publicDir, f);
                    return { name: f, time: fs.statSync(filePath).mtimeMs };
                })
                .sort((a, b) => b.time - a.time);

            // Xóa các bundle vượt quá 30 files gần nhất (ngoại trừ các hash legacy quan trọng)
            allBundles.slice(30).forEach(b => {
                if (!recentLegacyHashes.includes(b.name)) {
                    try { fs.unlinkSync(path.join(publicDir, b.name)); } catch (e) {}
                }
            });
        }

        // Cache-buster dùng chung cho theme CSS
        const cacheBust = Date.now();

        // Chèn bundle có hash vào _core.html kèm cơ chế onerror tự động nạp /app.js dự phòng
        const scriptTag = `<script src="/${bundleName}" onerror="if(!window.__app_fallback_loaded){window.__app_fallback_loaded=true;var s=document.createElement('script');s.src='/app.js?v=' + Date.now();document.head.appendChild(s);}"></script>`;
        let finalHtml = content.replace('</body>', `${scriptTag}\n</body>`);

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
            `/app.*.js`,
            `  Cache-Control: public, max-age=31536000, immutable`,
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

    // Build _routes.json for Cloudflare Pages (Only route API and dynamic SSR to Functions)
    const routesConfig = {
        version: 1,
        include: [
            '/api/*',
            '/photo/*',
            '/vehicle/*',
            '/operator/*',
            '/model/*',
            '/route/*',
            '/user/*',
            '/help/*',
            '/sitemap.xml'
        ],
        exclude: []
    };
    fs.writeFileSync(path.join(__dirname, 'public', '_routes.json'), JSON.stringify(routesConfig, null, 2));
    console.log('Đã tạo public/_routes.json (Chỉ route API và dynamic SSR sang Functions)');

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
