import { LoginResponseDto } from '@immich/sdk';
import { expect, test } from '@playwright/test';
import { lookup } from 'node:dns/promises';
import { playwrightHost } from 'playwright.config';
import { utils } from 'src/utils';

test.describe('Websocket', () => {
  let admin: LoginResponseDto;

  test.beforeAll(async () => {
    utils.initSdk();
    await utils.resetDatabase();
    admin = await utils.adminSetup();
  });

  test('connects using ipv4', async ({ page, context }) => {
    const { address: ipv4 } = await lookup(playwrightHost, 4);
    await utils.setAuthCookies(context, admin.accessToken, ipv4);
    await page.goto(`http://${ipv4}:2285/`);
    await expect(page.locator('#sidebar')).toContainText('Server Online');
  });

  test('connects using ipv6', async ({ page, context }) => {
    let ipv6: string;
    if (playwrightHost === '127.0.0.1') {
      ipv6 = '::1';
    } else {
      try {
        const { address } = await lookup(playwrightHost, 6);
        ipv6 = address;
      } catch {
        test.skip(true, 'No IPv6 address available');
        return;
      }
    }
    const ipv6Url = `http://[${ipv6}]:2285/`;
    await utils.setAuthCookies(context, admin.accessToken, undefined, ipv6Url);
    await page.goto(ipv6Url);
    await expect(page.locator('#sidebar')).toContainText('Server Online');
  });
});
