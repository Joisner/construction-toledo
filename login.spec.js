
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Navigate to the login page
    await page.goto('http://localhost:4200/login', { waitUntil: 'networkidle', timeout: 10000 });

    // Fill in invalid credentials
    await page.fill('input[formcontrolname="user"]', 'wronguser');
    await page.fill('input[formcontrolname="password"]', 'wrongpassword');

    // Click the login button
    await page.click('button[type="submit"]');

    // Wait for the toastr notification to appear
    await page.waitForSelector('.toast-error', { timeout: 5000 });

    // Take a screenshot
    await page.screenshot({ path: '/home/jules/verification/toastr_error.png' });

    console.log('Screenshot taken successfully.');
  } catch (error) {
    console.error('An error occurred during verification:', error);
    await page.screenshot({ path: '/home/jules/verification/toastr_error_fail.png' });
  } finally {
    await browser.close();
  }
})();
