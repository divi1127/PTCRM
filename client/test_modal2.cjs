const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5174/admin/leads');
  
  // Wait for login or table
  await new Promise(r => setTimeout(r, 2000));
  
  // If login is needed
  if (await page.$('input[type="email"]')) {
    await page.type('input[type="email"]', 'admin@playtime.com'); // assuming admin email
    await page.type('input[type="password"]', '123456');
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 2000));
  }

  // Click the first eye icon
  const eyeIcons = await page.$$('button[title="View"]'); // I don't know the exact selector, let's use svg or something
  // In AdminLeads, the view button has no title, but has an onClick.
  // It has a specific style: background: 'rgba(56,189,248,0.15)'
  // Let's just evaluate in page
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const viewBtn = buttons.find(b => b.innerHTML.includes('<svg') && b.style.color === 'rgb(56, 189, 248)');
    if (viewBtn) viewBtn.click();
  });
  
  await new Promise(r => setTimeout(r, 1000));

  const html = await page.evaluate(() => {
    const overlay = document.querySelector('.modal-overlay');
    return overlay ? overlay.outerHTML : 'No modal-overlay found';
  });
  
  console.log('HTML DUMP:');
  console.log(html);
  await browser.close();
})();
