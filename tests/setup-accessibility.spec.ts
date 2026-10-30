import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { test, expect, openSettings } from './extension-fixture';
import { openToolbar } from './toolbar-fixture';
import type { WallpaperSettings } from '../src/utils/storage';

// Two 1px frames (red/blue), looping every 100ms. Original bytes must survive freezing.
const motionGif = Buffer.from('47494638396101000100800000ff00000000ff21ff0b4e45545343415045322e30030100000021f904000a0000002c000000000100010000020244010021f904000a0000002c00000000010001000002024c01003b', 'hex');

test('First setup reaches a preset by keyboard and stays complete after reopening', async ({ extensionContext }, testInfo) => {
  const settings = await openSettings(extensionContext);
  await expect(settings.getByRole('heading', { name: 'Make your AI workspace yours', exact: true })).toBeVisible();
  await settings.screenshot({ path: testInfo.outputPath('setup-first-use.png') });
  const audit = await new AxeBuilder({ page: settings }).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
  expect(audit.violations.filter(v => ['serious','critical'].includes(v.impact || '')).map(v => v.id)).toEqual([]);
  await settings.getByRole('button', { name: 'Choose a preset', exact: true }).focus();
  await settings.keyboard.press('Enter');
  const mist = settings.getByRole('radio', { name: 'Mist', exact: true }); await expect(mist).toBeFocused();
  await settings.keyboard.press('Space'); await expect(mist).toBeChecked();
  await expect(settings.locator('#setupIntro')).toBeHidden();
  await expect(settings.getByRole('region', { name: 'Wallpaper preview', exact: true })).toContainText('Example conversation');
  await settings.reload(); await expect(settings.locator('#setupIntro')).toBeHidden();
  await expect(settings.getByRole('status', { name: 'Wallpaper source' })).toHaveText('Mist');
});

test('Skip applies no wallpaper and updates preserve an existing setup', async ({ extensionContext }) => {
  const settings = await openSettings(extensionContext);
  await settings.getByRole('button', { name: 'Skip for now', exact: true }).click();
  await expect(settings.locator('#setupIntro')).toBeHidden();
  expect(await settings.evaluate(async () => (await chrome.storage.local.get<{ llm_wallpaper_settings: WallpaperSettings }>('llm_wallpaper_settings')).llm_wallpaper_settings.imageDataUrl)).toBe(null);
  await settings.reload(); await expect(settings.locator('#setupIntro')).toBeHidden();
  await settings.evaluate(async () => chrome.storage.local.set({ llm_wallpaper_settings: { version: 10, presetId: 'dusk', enabled: false, opacity: .65, showChatControls: false } }));
  await settings.reload(); await expect(settings.locator('#setupIntro')).toBeHidden();
  await expect(settings.getByRole('radio', { name: 'Dusk', exact: true })).toBeChecked();
  await expect(settings.getByLabel('Enable wallpaper', { exact: true })).not.toBeChecked();
  await expect(settings.getByLabel('Opacity', { exact: true })).toHaveValue('0.65');
});

test('Reduced motion freezes GIFs locally, allows explicit animation and responds to preference changes', async ({ extensionContext }) => {
  await extensionContext.route('https://gemini.google.com/**', route => route.fulfill({ contentType: 'text/html', body: '<main>Example conversation</main>' }));
  const settings = await openSettings(extensionContext); await settings.emulateMedia({ reducedMotion: 'reduce' });
  const chooser = settings.waitForEvent('filechooser');
  await settings.getByRole('button', { name: 'Use an image', exact: true }).click();
  await (await chooser).setFiles({ name: 'motion.gif', mimeType: 'image/gif', buffer: motionGif });
  await expect(settings.locator('#setupIntro')).toBeHidden();
  await expect(settings.locator('#wallpaperPreview')).toHaveAttribute('src', /^data:image\/png/);
  expect(await settings.locator('#wallpaperPreview').evaluate(async (image: HTMLImageElement) => {
    await image.decode(); const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d')!; context.drawImage(image, 0, 0);
    return Array.from(context.getImageData(0, 0, 1, 1).data);
  })).toEqual([255, 0, 0, 255]);
  const page = await extensionContext.newPage(); await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto('https://gemini.google.com');
  const overlay = page.locator('#llm-wallpaper-overlay');
  await expect(overlay).toHaveCSS('background-image', /data:image\/png/);
  await expect(overlay).toHaveCSS('transition-duration', '0s');
  const original = await settings.evaluate(async () => (await chrome.storage.local.get<{ llm_wallpaper_settings: WallpaperSettings }>('llm_wallpaper_settings')).llm_wallpaper_settings.imageDataUrl);
  expect(original).toBe(`data:image/gif;base64,${motionGif.toString('base64')}`);
  await settings.getByLabel('Allow animated wallpapers with reduced motion', { exact: true }).check();
  await expect(overlay).toHaveCSS('background-image', /data:image\/gif/);
  await settings.getByLabel('Allow animated wallpapers with reduced motion', { exact: true }).uncheck();
  await expect(overlay).toHaveCSS('background-image', /data:image\/png/);
  await page.emulateMedia({ reducedMotion: 'no-preference' }); await expect(overlay).toHaveCSS('background-image', /data:image\/gif/);
  await page.emulateMedia({ reducedMotion: 'reduce' }); await expect(overlay).toHaveCSS('background-image', /data:image\/png/);
  await settings.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(settings.locator('#wallpaperPreview')).toHaveAttribute('src', /^data:image\/gif/);
  await settings.getByLabel('Enable wallpaper', { exact: true }).uncheck(); await expect(overlay).toHaveCount(0);
  await expect(settings.locator('#wallpaperPreview')).toHaveAttribute('src', /^data:image\/png/);
});

test('Settings reflow, focus, slider units and accessibility survive narrow and forced-color states', async ({ extensionContext }, testInfo) => {
  const settings = await openSettings(extensionContext); await settings.setViewportSize({ width: 320, height: 700 });
  await expect.poll(() => settings.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await settings.getByRole('button', { name: 'Skip for now', exact: true }).click();
  await settings.getByRole('radio', { name: 'Paper', exact: true }).check();
  await settings.getByLabel('Opacity', { exact: true }).focus(); await settings.keyboard.press('ArrowRight');
  await expect(settings.getByLabel('Opacity', { exact: true })).toHaveAttribute('aria-valuetext', /percent/);
  await expect(settings.getByLabel('Opacity', { exact: true })).toHaveCSS('outline-style', 'solid');
  for (const forcedColors of ['none', 'active'] as const) {
    await settings.emulateMedia({ forcedColors });
    const report = await new AxeBuilder({ page: settings }).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
    expect(report.violations.filter(v => ['serious','critical'].includes(v.impact || '')).map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) }))).toEqual([]);
  }
  await settings.screenshot({ path: testInfo.outputPath('settings-narrow-forced-colors.png'), fullPage: true });
  await settings.emulateMedia({ forcedColors: 'none' });
  await settings.setViewportSize({ width: 640, height: 900 });
  expect(await settings.evaluate(async () => { const tab = await chrome.tabs.getCurrent(); await chrome.tabs.setZoom(tab!.id!, 2); return chrome.tabs.getZoom(tab!.id!); })).toBe(2);
  await expect.poll(() => settings.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await settings.getByRole('button', { name: 'Reset effects', exact: true }).scrollIntoViewIfNeeded();
  await expect(settings.getByRole('button', { name: 'Reset effects', exact: true })).toBeInViewport();
  await settings.evaluate(async () => { const tab = await chrome.tabs.getCurrent(); await chrome.tabs.setZoom(tab!.id!, 1); });
  const toolbar = await extensionContext.newPage();
  const worker = extensionContext.serviceWorkers()[0]!;
  await toolbar.setViewportSize({ width: 320, height: 700 });
  await toolbar.goto(`chrome-extension://${new URL(worker.url()).host}/toolbar.html`);
  await expect(toolbar.locator('body')).toHaveAttribute('data-ready', 'true');
  await expect.poll(() => toolbar.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await toolbar.setViewportSize({ width: 640, height: 900 });
  expect(await toolbar.evaluate(async () => { const tab = await chrome.tabs.getCurrent(); await chrome.tabs.setZoom(tab!.id!, 2); return chrome.tabs.getZoom(tab!.id!); })).toBe(2);
  await expect.poll(() => toolbar.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('Actual toolbar has no serious accessibility findings in current-site and globally paused states', async ({ extensionContext }) => {
  await extensionContext.route('https://gemini.google.com/**', route => route.fulfill({ contentType: 'text/html', body: '<main>Example chat</main>' }));
  const settings = await openSettings(extensionContext); await settings.getByRole('radio', { name: 'Mist', exact: true }).check();
  const page = await extensionContext.newPage(); await page.goto('https://gemini.google.com'); await page.bringToFront();
  const popup = await openToolbar(extensionContext);
  await popup.evaluate(readFileSync('node_modules/axe-core/axe.min.js', 'utf8'));
  for (let i = 0; i < 2; i++) {
    const issues = await popup.evaluate("axe.run(document, {runOnly: {type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}}).then(r => r.violations.filter(v => ['serious','critical'].includes(v.impact)).map(v => v.id))");
    expect(issues).toEqual([]);
    if (!i) await popup.evaluate("document.querySelector('#globalPauseBtn').click()");
  }
  await popup.close();
});


test('An unfinished still frame cannot replace a newer source, and decode failure has a recovery path', async ({ extensionContext }) => {
  const settings = await openSettings(extensionContext); await settings.emulateMedia({ reducedMotion: 'reduce' });
  await settings.evaluate(() => {
    const decode = createImageBitmap.bind(window);
    window.createImageBitmap = ((...args: Parameters<typeof createImageBitmap>) => new Promise(resolve => {
      (window as any).releaseFrame = async () => { window.createImageBitmap = decode; resolve(await decode(...args)); };
    })) as typeof createImageBitmap;
  });
  await settings.locator('#imageInput').setInputFiles({ name: 'deferred.gif', mimeType: 'image/gif', buffer: motionGif });
  await expect.poll(() => settings.evaluate(() => typeof (window as any).releaseFrame)).toBe('function');
  await expect(settings.locator('#wallpaperPreview')).toBeHidden();
  await settings.getByRole('radio', { name: 'Mist', exact: true }).check();
  await expect(settings.locator('#wallpaperPreview')).toHaveAttribute('src', /mist.svg$/);
  await settings.evaluate(() => (window as any).releaseFrame());
  await expect(settings.locator('#wallpaperPreview')).toHaveAttribute('src', /mist.svg$/);
  // The uploader preserves a .gif filename even when the file's MIME label is wrong.
  await settings.locator('#imageInput').setInputFiles({ name: 'renamed.gif', mimeType: 'image/png', buffer: motionGif });
  await expect(settings.getByRole('status', { name: 'Wallpaper source' })).toHaveText('renamed.gif');
  await expect(settings.locator('#wallpaperPreview')).not.toHaveAttribute('src', `data:image/png;base64,${motionGif.toString('base64')}`);
  await settings.getByRole('radio', { name: 'Mist', exact: true }).check();
  await settings.evaluate(() => { window.createImageBitmap = (async () => { throw new Error('Decode failed for test'); }) as any; });
  await settings.getByRole('radio', { name: 'Use my upload', exact: true }).check();
  await expect(settings.locator('#motionNotice')).toContainText('Could not make a still frame');
  const audit = await new AxeBuilder({ page: settings }).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
  expect(audit.violations.filter(v => ['serious','critical'].includes(v.impact || '')).map(v => v.id)).toEqual([]);
  await expect(settings.locator('#wallpaperPreview')).toBeHidden();
  await settings.getByLabel('Allow animated wallpapers with reduced motion', { exact: true }).check();
  await expect(settings.locator('#wallpaperPreview')).toHaveAttribute('src', `data:image/png;base64,${motionGif.toString('base64')}`);
  await expect(settings.getByRole('status', { name: 'Wallpaper source' })).toHaveText('renamed.gif');
});
