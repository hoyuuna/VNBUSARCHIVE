const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    let apiRequests = 0;
    
    page.on('request', request => {
        const url = request.url();
        if (url.includes('/api/') || url.includes('/rest/v1/')) {
            apiRequests++;
            console.log(url);
        }
    });

    console.log('Navigating to site...');
    await page.goto('https://www.vnbusarchive.io.vn', { waitUntil: 'networkidle2' });
    
    console.log('Waiting 5 seconds...');
    await new Promise(r => setTimeout(r, 5000));
    
    console.log(`Total API requests in 5s: ${apiRequests}`);
    await browser.close();
})();
