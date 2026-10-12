import { test, expect, enableWallpaper, TARGET_SITES, hasAuthState } from './extension-fixture';

for (const site of TARGET_SITES) {
  test(`Check DOM structural stability for ${site.name}`, async ({ page }) => {
    await page.goto(site.url, { waitUntil: 'domcontentloaded' });
    const targetElement = page.locator(site.selector).first();
    
    // Assert that key containers exist
    await expect(targetElement).toBeVisible({ timeout: 10000 });
  });

  test(`Loads wallpaper UI for ${site.name}`, async ({ extensionContext }) => {
    await enableWallpaper(extensionContext);
    const page = await extensionContext.newPage();
    await page.goto(site.url, { waitUntil: 'domcontentloaded' });

    await expect(page.locator('#llm-wallpaper-overlay')).toBeAttached({ timeout: 10000 });
    await expect(
      page.locator(`link[data-llm-wallpaper-provider="${site.name.toLowerCase()}"]`)
    ).toBeAttached({ timeout: 10000 });

    const overlay = page.locator('#llm-wallpaper-overlay');
    await expect(overlay).toHaveCSS('opacity', '0.15');
    await expect(overlay).toHaveCSS('filter', 'blur(0px)');
  });

  for (const colorScheme of ['light', 'dark'] as const) {
    test(`Checks authenticated route for ${site.name} in ${colorScheme} mode`, async ({ extensionContext }) => {
      test.skip(!hasAuthState, 'Provide playwright/.auth/storageState.json to run authenticated checks');

      await enableWallpaper(extensionContext);

      const page = await extensionContext.newPage();
      await page.emulateMedia({ colorScheme });
      await page.goto(site.authenticatedUrl, { waitUntil: 'domcontentloaded' });

      await expect(page).not.toHaveURL(/\/login|\/signin|\/auth\//, { timeout: 10000 });
      await expect(page.locator(site.selector).first()).toBeVisible({ timeout: 10000 });
      await expect(page.locator('#llm-wallpaper-overlay')).toBeAttached({ timeout: 10000 });
      await expect(page.locator('#llm-wallpaper-overlay')).toHaveCSS('background-image', /data:image\/gif/);
      expect(new URL(page.url()).hostname).toBe(new URL(site.url).hostname);
      const composer = page.locator('textarea:visible, [contenteditable="true"]:visible').first();
      await expect(composer).toBeVisible();
      await expect(composer).toBeEditable();
      expect(await composer.evaluate((element) => getComputedStyle(element).color)).not.toBe('rgba(0, 0, 0, 0)');
      await page.reload();
      await expect(page.locator('#llm-wallpaper-overlay')).toHaveCSS('background-image', /data:image\/gif/);
      await expect(composer).toBeVisible();
    });
  }
}
