import { Page } from 'puppeteer';

const DEVICE_CHOICE = '#body_body_CtlUp label.button';

export async function login(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.type('#body_body_CtlLogin_IoEmail', email);
  await page.type('#body_body_CtlLogin_IoPassword', password);
  await page.click('#body_body_CtlLogin_CtlAceptar');

  // Esperar a la pregunta "¿recordar este dispositivo?" (o a que ya haya entrado)
  await Promise.race([
    page.waitForSelector(DEVICE_CHOICE, { timeout: 45000 }),
    page.waitForFunction(() => !location.href.includes('login.aspx'), {
      timeout: 45000,
    }),
  ]).catch(() => {});

  const buttons = await page.$$(DEVICE_CHOICE);
  if (buttons.length > 0) {
    // Segundo botón = "No recordar"
    const target = buttons[1] ?? buttons[0];
    await target.evaluate(el => (el as HTMLElement).click());

    // Esperar a salir de la página de login (llega al box)
    await page
      .waitForFunction(() => !location.href.includes('login.aspx'), {
        timeout: 30000,
      })
      .catch(async () => {
        console.log('⚠️ Sigue en login tras elegir dispositivo.');
        const html = await page.evaluate(
          () => document.querySelector('#body_body_CtlUp')?.outerHTML ?? ''
        );
        const text = await page.evaluate(() => document.body.innerText);
        console.log('HTML dispositivo:', html.slice(0, 1500));
        console.log(
          'Texto en pantalla:',
          text.slice(0, 800).replace(/\n+/g, ' | ')
        );
      });
    await page.waitForNetworkIdle({ timeout: 5000 }).catch(() => {});
  }

  console.log('URL tras login:', page.url());
}
