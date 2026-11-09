import { test, expect, openSettings, TARGET_SITES } from './extension-fixture';

test('A pending comfort save keeps the chosen mode and prevents duplicate changes', async ({ extensionContext }) => {
  await extensionContext.route('https://gemini.google.com/**', (route) => route.fulfill({ contentType: 'text/html', body: '<main><model-response><p>Conversation</p></model-response><div class="font-claude-response"><p>Conversation</p></div><div data-message-author-role="assistant"><p>Conversation</p></div></main>' }));
  const settings = await openSettings(extensionContext);
  await settings.getByRole('radio', { name: 'Mist', exact: true }).check();
  const page = await extensionContext.newPage(); await page.goto('https://gemini.google.com');
  await page.getByRole('button', { name: 'Wallpaper quick controls' }).click();
  const checkbox = page.getByRole('combobox', { name: 'Reading comfort', exact: true });
  await expect(checkbox).toHaveValue('soft');
  const worker = extensionContext.serviceWorkers()[0]!;
  await worker.evaluate(() => {
    const set = chrome.storage.local.set.bind(chrome.storage.local);
    chrome.storage.local.set = (async (...args: any[]) => {
      await new Promise<void>((resolve) => { (globalThis as any).releaseSave = resolve; });
      chrome.storage.local.set = set;
      return set(...args as [any]);
    }) as any;
  });
  await checkbox.focus(); await checkbox.press('o'); await checkbox.press('Tab');
  await expect.poll(() => worker.evaluate(() => typeof (globalThis as any).releaseSave)).toBe('function');
  await expect(checkbox).toHaveValue('off');
  await checkbox.focus(); await expect(checkbox).toBeFocused();
  // Deliberately attempt another native change while aria-disabled signals a pending save.
  await checkbox.press('e'); await checkbox.press('Tab');
  await expect(checkbox).toHaveValue('off');
  await worker.evaluate(() => (globalThis as any).releaseSave());
  await expect(page.locator('html')).not.toHaveAttribute('data-llm-wallpaper-comfort');
  await expect(checkbox).toHaveValue('off');
  await worker.evaluate(() => {
    const set = chrome.storage.local.set.bind(chrome.storage.local);
    chrome.storage.local.set = (async (...args: any[]) => {
      chrome.storage.local.set = set;
      throw new Error('Could not save comfort preference.');
    }) as any;
  });
  await checkbox.focus(); await checkbox.press('e'); await checkbox.press('Tab');
  await expect(page.getByRole('status')).toHaveText('Could not save comfort preference.');
  await expect(checkbox).toHaveValue('off');
  await checkbox.focus(); await checkbox.press('e'); await checkbox.press('Tab');
  await expect(page.locator('html')).toHaveAttribute('data-llm-wallpaper-comfort', /light|dark/);
  await expect(checkbox).toHaveValue('soft');
});

test('Reading comfort is an additional select with provider isolation, reset preservation, and native cleanup', async ({ extensionContext }) => {
  for (const site of TARGET_SITES) await extensionContext.route(`${site.url}/**`, (route) => route.fulfill({ contentType: 'text/html', body: '<main><model-response><p>Conversation</p></model-response><div class="font-claude-response"><p>Conversation</p></div><div data-message-author-role="assistant"><p>Conversation</p></div></main>' }));
  const settings = await openSettings(extensionContext);
  const input = settings.getByRole('combobox', { name: 'Reading comfort', exact: true });
  await expect(input).toHaveValue('soft');
  await settings.getByRole('radio', { name: 'Mist', exact: true }).check();
  const page = await extensionContext.newPage(); await page.goto('https://gemini.google.com');
  const other = await extensionContext.newPage(); await other.goto('https://claude.ai');
  await expect(page.locator('html')).toHaveAttribute('data-llm-wallpaper-comfort', /light|dark/);
  await page.getByRole('button', { name: 'Wallpaper quick controls' }).click();
  const quick = page.getByRole('combobox', { name: 'Reading comfort', exact: true });
  await quick.focus(); await quick.press('o'); await quick.press('Tab');
  await expect(page.locator('html')).not.toHaveAttribute('data-llm-wallpaper-comfort');
  await expect(other.locator('html')).toHaveAttribute('data-llm-wallpaper-comfort', /light|dark/);
  await expect(page.locator('#llm-wallpaper-overlay')).toBeAttached();
  await settings.getByLabel('Apply settings to').selectOption('gemini');
  await expect(input).toHaveValue('off');
  await settings.getByRole('button', { name: 'Reset provider effects', exact: true }).click();
  await expect(quick).toHaveValue('off');
  await quick.focus(); await quick.press('e'); await quick.press('Tab');
  await expect(input).toHaveValue('soft');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-llm-wallpaper-comfort', /light|dark/);
  await settings.getByLabel('Show controls in chats', { exact: true }).uncheck();
  await expect(page.locator('#llm-wallpaper-controls')).toBeHidden();
  await expect(page.locator('html')).toHaveAttribute('data-llm-wallpaper-comfort', /light|dark/);
  await settings.getByLabel('Enable wallpaper', { exact: true }).uncheck();
  await expect(page.locator('html')).not.toHaveAttribute('data-llm-wallpaper-comfort');
  await expect(page.locator('link[data-llm-wallpaper-comfort]')).toHaveCount(0);
  await settings.getByLabel('Enable wallpaper', { exact: true }).check();
  await expect(page.locator('html')).toHaveAttribute('data-llm-wallpaper-comfort', /light|dark/);
  await settings.getByRole('button', { name: 'Remove wallpaper', exact: true }).click();
  await expect(page.locator('html')).not.toHaveAttribute('data-llm-wallpaper-comfort');
  await expect(page.locator('link[data-llm-wallpaper-comfort]')).toHaveCount(0);
});
