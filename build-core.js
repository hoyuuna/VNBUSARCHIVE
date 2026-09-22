const fs = require('fs');
const path = require('path');
const { execSync, execFileSync } = require('child_process');

try {
    const corePath = path.join(__dirname, '_core.html');
    
    // ÄÆ°á»ng dáº«n tá»›i thÆ° má»¥c chá»©a cÃ¡c file JS Ä‘Ã£ chia nhá»
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
                // Đảm bảo dùng LF thay vì CRLF để Cloudflare Pages (Linux) và Local (Windows) sinh ra hash giống nhau
                combinedJs += fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
            } else {
                console.warn(`File ${file} không tồn tại.`);
            }
        });

        // Hash ná»™i dung bundle -> tÃªn file báº¥t biáº¿n. CDN bá»  qua query string (?v=) khi cache
        // nÃªn pháº£i Ä‘á»•i háº³n path Ä‘á»ƒ khÃ´ng bao giá»  phá»¥c vá»¥ JS cÅ©.
        const bundleHash = require('crypto').createHash('sha256').update(combinedJs).digest('hex').slice(0, 12);
        const bundleName = `app.${bundleHash}.js`;
        const publicDir = path.join(__dirname, 'public');

        // Dá»n cÃ¡c bundle hash cÅ© Ä‘á»ƒ trÃ¡nh tá»“n Ä‘á»ng
        if (fs.existsSync(publicDir)) {
            fs.readdirSync(publicDir)
                .filter(f => /^app\.[0-9a-f]{12}\.js$/.test(f) && f !== bundleName)
                .forEach(f => { try { fs.unlinkSync(path.join(publicDir, f)); } catch (e) {} });
        }

        // LÆ°u bundle vá»›i tÃªn cÃ³ hash ná»™i dung
        fs.writeFileSync(path.join(publicDir, bundleName), combinedJs);
        console.log(`Táº¡o thÃ nh cÃ´ng public/${bundleName}`);

        // Váº«n ghi public/app.js Ä‘á»ƒ tÆ°Æ¡ng thÃ­ch ngÆ°á»£c
        fs.writeFileSync(path.join(publicDir, 'app.js'), combinedJs);

        // Cache-buster dÃ¹ng chung cho theme CSS
        const cacheBust = Date.now();

        // ChÃ¨n bundle cÃ³ hash vÃ o _core.html (index.html phá»¥c vá»¥ no-store nÃªn luÃ´n trá» Ä‘Ãºng bundle má»›i)
        let finalHtml = content.replace('</body>', `<script src="/${bundleName}"></script>\n</body>`);

        // Thay tháº¿ BUILD_VERSION_PLACEHOLDER trong link CSS theme
        finalHtml = finalHtml.replace(/BUILD_VERSION_PLACEHOLDER/g, String(cacheBust));

        // LÆ°u trá»±c tiáº¿p ná»™i dung sang public/index.html
        const indexHtmlPath = path.join(__dirname, 'public', 'index.html');
        fs.writeFileSync(indexHtmlPath, finalHtml);
        
        console.log('Táº¡o thÃ nh cÃ´ng public/index.html (Dáº¡ng trang web tiÃªu chuáº©n)');

        // (Tuá»³ chá»n) Cá»‘ gáº¯ng xÃ³a file _core.js cÅ© náº¿u tá»“n táº¡i
        const oldCorePath = path.join(__dirname, 'functions', 'api', '_core.js');
        if (fs.existsSync(oldCorePath)) {
            try { fs.unlinkSync(oldCorePath); } catch(e){}
        }
    } else {
        console.warn('_core.html khÃ´ng tá»“n táº¡i.');
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
        console.log('ÄÃ£ táº¡o public/_headers tá»« csp.json (kÃ¨m Cache-Control no-store cho má»i asset)');
    }

    // Build Tailwind CSS
    try {
        console.log('Äang biÃªn dá»‹ch Tailwind CSS...');
        const tailwindExe = path.join(__dirname, 'tailwind.exe');
        const inputCssPath = path.join(__dirname, 'src', 'input.css');
        const outputCssPath = path.join(__dirname, 'public', 'tailwind.css');

        if (fs.existsSync(tailwindExe)) {
            execFileSync(tailwindExe, ['-i', inputCssPath, '-o', outputCssPath, '--minify'], { stdio: 'inherit' });
            console.log('BiÃªn dá»‹ch Tailwind CSS thÃ nh cÃ´ng (qua tailwind.exe)!');
        } else {
            execSync(`npx -y tailwindcss -i "${inputCssPath}" -o "${outputCssPath}" --minify`, { stdio: 'inherit' });
            console.log('BiÃªn dá»‹ch Tailwind CSS thÃ nh cÃ´ng (qua npx tailwindcss)!');
        }
    } catch (twErr) {
        console.warn('Cáº£nh bÃ¡o: Lá»—i khi biÃªn dá»‹ch Tailwind CSS:', twErr.message);
    }
} catch (error) {
    console.error('Lá»—i khi build:', error);
    process.exit(1);
}

