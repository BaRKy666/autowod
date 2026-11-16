import { Page } from 'puppeteer';

export async function login(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.type('#body_body_CtlLogin_IoEmail', email);
  await page.type('#body_body_CtlLogin_IoPassword', password);
  try {
    await Promise.all([
      page.waitForNavigation({ timeout: 30000 }),
      page.click('#body_body_CtlLogin_CtlAceptar'),
    ]);
  } catch (error) {
    const text = await page.evaluate(() => document.body.innerText);
    console.log('URL actual:', page.url());
    console.log(
      'Texto en pantalla:',
      text.slice(0, 1500).replace(/\n+/g, ' | ')
    );
    throw error;
  }

  // click in "Don't remember this browser" (second button in the device choice)
  const secondButtonSelector = '#body_body_CtlUp label.button:nth-of-type(2)';
  const secondButton = await page.$(secondButtonSelector);
  if (secondButton) {
    await secondButton.click();
    await page.waitForNetworkIdle({ timeout: 5000 }).catch(() => {});
  }
}
