import { appendFileSync } from 'fs';
import { Page, ElementHandle } from 'puppeteer';
import {
  ButtonText,
  ReservationPreferences,
  ReservationResult,
  WeekDay,
} from '../types';
import { availableDays } from '../config';

export function parsePreferenceValue(value: string | null): {
  time: string | null;
  className: string | null;
} {
  if (!value) return { time: null, className: null };
  const [time, className] = value.split('|');
  return { time: time.trim() || null, className: className?.trim() || null };
}

export async function goToReservations(page: Page): Promise<void> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const todayInSeconds = Math.floor(today.getTime() / 1000);

  const currentUrl = page.url();
  const currentDomain = new URL(currentUrl).origin;

  await page.goto(`${currentDomain}/athlete/reservas.aspx?t=${todayInSeconds}`);
}

export async function getReservationState(
  reservationButton: ElementHandle<Element>
): Promise<ButtonText | null> {
  const buttonText = await reservationButton.evaluate(el => el.textContent);
  return buttonText as ButtonText | null;
}

export function getReservationKey(time: string): string {
  return `h${time.replace(':', '')}00`;
}

export async function goToNextDay(page: Page): Promise<void> {
  await page.waitForSelector('a.next');
  await page.click('a.next');
  await page.waitForNetworkIdle({ timeout: 5000 }).catch(() => {});
}

export async function getWeekDayFromUrl(page: Page): Promise<string> {
  const url = await page.url();
  const weekDayInSeconds = url.split('=')[1];
  const weekDay = new Date(Number(weekDayInSeconds) * 1000);
  return weekDay
    .toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' })
    .toLocaleLowerCase();
}

export async function getDateFromUrl(page: Page): Promise<string> {
  const url = await page.url();
  const weekDayInSeconds = url.split('=')[1];
  return Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(Number(weekDayInSeconds) * 1000));
}

export function getISODateFromUrl(page: Page): string {
  const seconds = page.url().split('=')[1];
  return new Date(Number(seconds) * 1000).toISOString().split('T')[0];
}

async function findReservationButton(
  page: Page,
  reservationKey: string,
  className: string | null
): Promise<ElementHandle<Element> | null> {
  await page
    .waitForSelector('div[data-magellan-destination]', { timeout: 15000 })
    .catch(() => {});

  const buttons = await page.$$(
    `div[data-magellan-destination="${reservationKey}"] button`
  );

  if (buttons.length === 0) {
    const keys = await page.$$eval('div[data-magellan-destination]', els =>
      els.map(e => e.getAttribute('data-magellan-destination'))
    );
    console.log('Buscaba:', reservationKey);
    console.log('URL:', page.url());
    console.log('Slots en pantalla:', keys.join(', ') || '(ninguno)');
    const text = await page.evaluate(() => document.body.innerText);
    console.log('Texto:', text.slice(0, 800).replace(/\n+/g, ' | '));
    return null;
  }
  if (!className || buttons.length === 1) return buttons[0];

  for (const button of buttons) {
    const sectionText = await button.evaluate(el => {
      const section = el.closest('[data-magellan-destination]');
      return section?.textContent ?? '';
    });
    if (sectionText.toLowerCase().includ
