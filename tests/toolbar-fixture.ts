import type { BrowserContext } from '@playwright/test';
import { expect } from './extension-fixture';

// Chrome creates action popups as targets that Playwright does not auto-attach.
export async function openToolbar(context: BrowserContext) {
  const session = await context.browser()!.newBrowserCDPSession();
  await context.serviceWorkers()[0].evaluate(() => chrome.action.openPopup());
  let targetId = '';
  await expect.poll(async () => {
    const { targetInfos } = await session.send('Target.getTargets');
    targetId = targetInfos.find((target) => target.url.endsWith('/toolbar.html'))?.targetId || '';
    return !!targetId;
  }).toBe(true);
  const { sessionId } = await session.send('Target.attachToTarget', { targetId, flatten: false });
  let nextId = 0;
  const requests = new Map<number, { resolve: (value: any) => void; reject: (error: Error) => void }>();
  session.on('Target.receivedMessageFromTarget', ({ message }) => {
    const response = JSON.parse(message);
    const request = requests.get(response.id);
    if (!request) return;
    requests.delete(response.id);
    if (response.error || response.result?.exceptionDetails) request.reject(new Error(JSON.stringify(response.error || response.result.exceptionDetails)));
    else request.resolve(response.result);
  });
  async function evaluate(expression: string) {
    const id = ++nextId;
    const result = new Promise<any>((resolve, reject) => requests.set(id, { resolve, reject }));
    await session.send('Target.sendMessageToTarget', { sessionId, message: JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression, awaitPromise: true, returnByValue: true } }) });
    return (await result).result.value;
  }
  await expect.poll(() => evaluate("document.body.dataset.ready")).toBe('true');
  return { evaluate, close: async () => { await session.send('Target.closeTarget', { targetId }); await session.detach(); } };
}
