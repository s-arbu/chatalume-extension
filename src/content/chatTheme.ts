// Watch only theme signals on the app roots, never conversation content.
export function watchChatTheme(host: HTMLElement, onChange?: (theme: 'light' | 'dark') => void) {
  const preference = matchMedia('(prefers-color-scheme: dark)');
  const attributes = ['class', 'style', 'data-theme', 'data-mode', 'data-color-mode'];
  function update() {
    const roots = [document.documentElement, document.body].filter((node): node is HTMLElement => !!node);
    let theme: 'light' | 'dark' | undefined;
    for (const node of roots) {
      const declared = ['data-theme', 'data-mode', 'data-color-mode'].map((name) => node.getAttribute(name));
      if (declared.includes('dark') || node.matches('.dark, .dark-theme')) { theme = 'dark'; break; }
      if (declared.includes('light') || node.matches('.light, .light-theme')) { theme = 'light'; break; }
    }
    if (!theme) for (const node of roots.slice().reverse()) {
      const scheme = getComputedStyle(node).colorScheme;
      if (scheme === 'dark' || scheme === 'light') { theme = scheme; break; }
    }
    const resolved = theme ?? (preference.matches ? 'dark' : 'light');
    host.dataset.theme = resolved;
    onChange?.(resolved);
  }
  const observer = new MutationObserver(update);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: attributes });
  if (document.body) observer.observe(document.body, { attributes: true, attributeFilter: attributes });
  else {
    const bodyObserver = new MutationObserver(() => {
      if (!document.body) return;
      observer.observe(document.body, { attributes: true, attributeFilter: attributes });
      bodyObserver.disconnect();
      update();
    });
    bodyObserver.observe(document.documentElement, { childList: true });
  }
  preference.addEventListener('change', update);
  update();
}
