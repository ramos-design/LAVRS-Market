
const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
        console.log('Navigating to http://localhost:3000');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

        console.log('Page title:', await page.title());

        // Check if Auth component is visible
        const loginHeader = await page.getByText('Přihlášení', { exact: true });
        const registerHeader = await page.getByText('Registrace', { exact: true });

        if (await loginHeader.isVisible() && await registerHeader.isVisible()) {
            console.log('SUCCESS: Auth component (Login/Register) is visible.');
        } else {
            console.log('FAILURE: Auth component not found on page.');
            // Take screenshot if failed
            await page.screenshot({ path: '/tmp/auth_fail.png' });
        }

        // Test switching to Registration
        await registerHeader.click();
        console.log('Clicked Registration tab.');

        const fullNameInput = await page.getByPlaceholder('Např. Jana Malá');
        if (await fullNameInput.isVisible()) {
            console.log('SUCCESS: Registration form fields are visible.');
        } else {
            console.log('FAILURE: Registration fields not visible after click.');
        }

    } catch (error) {
        console.error('Test error:', error);
    } finally {
        await browser.close();
    }
})();
