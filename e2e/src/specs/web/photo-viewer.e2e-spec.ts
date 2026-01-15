import { AssetMediaResponseDto, LoginResponseDto } from '@immich/sdk';
import { expect, test } from '@playwright/test';
import type { Socket } from 'socket.io-client';
import { utils } from 'src/utils';

test.describe('Photo Viewer', () => {
  let admin: LoginResponseDto;
  let asset: AssetMediaResponseDto;
  let rawAsset: AssetMediaResponseDto;
  let websocket: Socket;

  test.beforeAll(async () => {
    utils.initSdk();
    await utils.resetDatabase();
    admin = await utils.adminSetup();
    asset = await utils.createAsset(admin.accessToken);
    rawAsset = await utils.createAsset(admin.accessToken, { assetData: { filename: 'test.arw' } });
    websocket = await utils.connectWebsocket(admin.accessToken);
  });

  test.afterAll(() => {
    utils.disconnectWebsocket(websocket);
  });

  test.beforeEach(async ({ context, page }) => {
    // before each test, login as user
    await utils.setAuthCookies(context, admin.accessToken);
    await page.waitForLoadState('networkidle');
  });

  test('loads original photo when zoomed', async ({ page }) => {
    await page.goto(`/photos/${asset.id}`);

    const thumbnail = page.getByTestId('thumbnail').filter({ visible: true });
    await expect(thumbnail).toHaveAttribute('src', /thumbnail/);

    const originalResponse = page.waitForResponse((response) => response.url().includes('/original'));

    const { width, height } = page.viewportSize()!;
    await page.mouse.move(width / 2, height / 2);
    await page.mouse.wheel(0, -1);

    await originalResponse;

    const original = page.getByTestId('original').filter({ visible: true });
    await expect(original).toHaveAttribute('src', /original/);
  });

  test('loads fullsize image when zoomed and original is web-incompatible', async ({ page }) => {
    await page.goto(`/photos/${rawAsset.id}`);

    const thumbnail = page.getByTestId('thumbnail').filter({ visible: true });
    await expect(thumbnail).toHaveAttribute('src', /thumbnail/);

    const fullsizeResponse = page.waitForResponse((response) => response.url().includes('fullsize'));

    const { width, height } = page.viewportSize()!;
    await page.mouse.move(width / 2, height / 2);
    await page.mouse.wheel(0, -1);

    await fullsizeResponse;

    const original = page.getByTestId('original').filter({ visible: true });
    await expect(original).toHaveAttribute('src', /fullsize/);
  });

  test('reloads photo when checksum changes', async ({ page }) => {
    await page.goto(`/photos/${asset.id}`);

    const thumbnail = page.getByTestId('thumbnail').filter({ visible: true });
    await expect(thumbnail).toHaveAttribute('src', /thumbnail/);
    const initialSrc = await thumbnail.getAttribute('src');

    const websocketEvent = utils.waitForWebsocketEvent({ event: 'assetUpdate', id: asset.id });
    await utils.replaceAsset(admin.accessToken, asset.id);
    await websocketEvent;

    const preview = page.getByTestId('preview').filter({ visible: true });
    await expect(preview).not.toHaveAttribute('src', initialSrc!);
  });
});
