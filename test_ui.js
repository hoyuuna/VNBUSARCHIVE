const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => {
        console.log(`PAGE LOG [${msg.type()}]: ${msg.text()}`);
    });
    page.on('pageerror', err => {
        console.log(`PAGE EXCEPTION: ${err.message}`);
    });
    
    console.log("Navigating to site...");
    await page.goto('https://www.vnbusarchive.io.vn/');
    
    console.log("Waiting for app init...");
    await page.waitForTimeout(2000);
    
    console.log("Typing 'kim long'...");
    await page.type('#page-search-input', 'kim long');
    
    console.log("Waiting for suggestions...");
    await page.waitForTimeout(3000);
    
    const html = await page.evaluate(() => {
        return document.getElementById('page-search-suggestions').innerHTML;
    });
    
    console.log("SUGGESTIONS HTML:");
    console.log(html);
    
    await browser.close();
})();
