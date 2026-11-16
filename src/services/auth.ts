import { Page } from 'puppeteer';

const DEVICE_CHOICE = '#body_body_CtlUp label.button';

export async function login(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'es-ES,es;q=0.9' });
  await page.type('#body_body_CtlLogin_IoEmail', email);
  await page.type('#body_body_CtlLogin_IoPassword', password);
  await page.click('#body_body_CtlLogin_CtlAceptar');

  // Esperar a la pregunta del dispositivo o a que cargue otra página
  await Promise.race([
    page.waitForSelector(DEVICE_CHOICE, { timeout: 45000 }),
    page.waitForNavigation({ timeout: 45000 }),
  ]).catch(async () => {
    const text = await page.evaluate(() => document.body.innerText);
    console.log('URL actual:', page.url());
    console.log(
      'Texto en pantalla:',
      text.slice(0, 1500).replace(/\n+/g, ' | ')
    );
  });

  // "No recordar" (segundo botón de la pregunta del dispositivo)
  const secondButton = await page.$(
    '#body_body_CtlUp label.button:nth-of-type(2)'
  );
  if (secondButton) {
    await secondButton.click();
    await page.waitForNetworkIdle({ timeout: 5000 }).catch(() => {});
  }
}
