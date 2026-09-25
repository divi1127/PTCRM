const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5174/admin/leads');
  await new Promise(r => setTimeout(r, 2000));
  
  if (await page.$('input[type="email"]')) {
    await page.type('input[type="email"]', 'admin@playtime.com');
    await page.type('input[type="password"]', '123456');
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 3000));
  }

  // Find buttons that have color rgb(56, 189, 248) (this is the View button)
  const clicked = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const viewBtn = buttons.find(b => b.style.color === 'rgb(56, 189, 248)' || b.innerHTML.includes('lucide-eye'));
    if (viewBtn) {
      viewBtn.click();
      return true;
    }
    return false;
  });
  
  console.log('Clicked:', clicked);
  await new Promise(r => setTimeout(r, 1000));

  const html = await page.evaluate(() => document.body.innerHTML);
  require('fs').writeFileSync('output.html', html);
  await browser.close();
})();
