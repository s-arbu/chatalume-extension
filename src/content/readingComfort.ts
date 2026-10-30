import type { WallpaperProviderAdapter } from '../providers/types';
import type { ReadingComfortMode } from '../utils/storage';

type Region = { left: number; top: number; right: number; bottom: number };

export function createReadingComfort(provider: WallpaperProviderAdapter, onVisibilityChange?: (visible: boolean) => void) {
  let mode: ReadingComfortMode = 'off';
  let visible = false;
  function setVisible(value: boolean) {
    if (visible === value) return;
    visible = value;
    onVisibilityChange?.(value);
  }
  let frame = 0;
  let layer: HTMLElement | undefined;
  const observed = new Set<Element>();
  const resize = new ResizeObserver(refresh);

  function refresh() {
    if (mode !== 'off' && !frame) frame = requestAnimationFrame(draw);
  }

  function draw() {
    frame = 0;
    if (mode === 'off') return;
    const regions: Region[] = [];
    const nextObserved = new Set<Element>();
    for (const anchor of document.querySelectorAll<HTMLElement>(provider.readingSelectors)) {
      if (anchor.parentElement?.closest(provider.readingSelectors)) continue;
      const box = anchor.getBoundingClientRect();
      if (!box.width || !box.height || box.bottom <= 0 || box.top >= innerHeight || box.right <= 0 || box.left >= innerWidth) continue;
      const clip = { left: 0, top: 0, right: innerWidth, bottom: innerHeight };
      for (let node: Element | null = anchor; node; node = node.parentElement) {
        nextObserved.add(node);
        const style = getComputedStyle(node);
        const rect = node.getBoundingClientRect();
        if (/^(auto|scroll|hidden|clip)$/.test(style.overflowX)) { clip.left = Math.max(clip.left, rect.left + node.clientLeft); clip.right = Math.min(clip.right, rect.left + node.clientLeft + node.clientWidth); }
        if (/^(auto|scroll|hidden|clip)$/.test(style.overflowY)) { clip.top = Math.max(clip.top, rect.top + node.clientTop); clip.bottom = Math.min(clip.bottom, rect.top + node.clientTop + node.clientHeight); }
      }
      // Message wrappers can span the whole page. Measure glyphs, never their wrapper.
      const walker = document.createTreeWalker(anchor, NodeFilter.SHOW_TEXT);
      const range = document.createRange();
      let bounds: Region | undefined;
      while (walker.nextNode()) {
        const node = walker.currentNode;
        const parent = node.parentElement;
        if (!node.textContent?.trim() || !parent || parent.closest('button, svg, script, style, textarea, input, [contenteditable="true"], [aria-hidden="true"], [hidden], .sr-only, .cdk-visually-hidden') || getComputedStyle(parent).visibility !== 'visible') continue;
        range.selectNodeContents(node);
        for (const rect of range.getClientRects()) {
          if (rect.width <= 2 || rect.height <= 2 || rect.bottom <= clip.top || rect.top >= clip.bottom || rect.right <= clip.left || rect.left >= clip.right) continue;
          bounds = bounds ? { left: Math.min(bounds.left, rect.left), top: Math.min(bounds.top, rect.top), right: Math.max(bounds.right, rect.right), bottom: Math.max(bounds.bottom, rect.bottom) }
            : { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
        }
      }
      if (bounds) regions.push({ left: Math.max(clip.left, bounds.left - 24), top: Math.max(clip.top, bounds.top - 24), right: Math.min(clip.right, bounds.right + 24), bottom: Math.min(clip.bottom, bounds.bottom + 24) });
    }
    for (const node of observed) if (!nextObserved.has(node)) { resize.unobserve(node); observed.delete(node); }
    for (const node of nextObserved) if (!observed.has(node)) { observed.add(node); resize.observe(node); }
    setVisible(regions.length > 0);
    if (!regions.length) { layer?.remove(); return; }
    if (!layer) {
      layer = document.createElement('div');
      layer.id = 'llm-reading-comfort';
      layer.setAttribute('aria-hidden', 'true');
    }
    if (!layer.isConnected) document.documentElement.appendChild(layer);
    regions.forEach((region, index) => {
      let surface = layer!.children.item(index) as HTMLElement | null;
      if (!surface) {
        surface = document.createElement('div');
        surface.className = 'llm-comfort-region';
        layer!.appendChild(surface);
      }
      const bounds = { left: region.left, top: region.top, width: region.right - region.left, height: region.bottom - region.top };
      for (const [property, number] of Object.entries(bounds)) {
        const value = `${number}px`;
        if (surface.style.getPropertyValue(property) !== value) surface.style.setProperty(property, value);
      }
    });
    while (layer.children.length > regions.length) layer.lastElementChild!.remove();
  }

  function update(value: ReadingComfortMode) {
    mode = value;
    if (mode === 'off') {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      layer?.remove();
      setVisible(false);
      resize.disconnect();
      observed.clear();
    } else refresh();
  }
  window.addEventListener('resize', refresh, { passive: true });
  document.addEventListener('scroll', refresh, { passive: true, capture: true });
  document.addEventListener('transitionend', refresh, true);
  return { update, refresh };
}
