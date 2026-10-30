import type { WallpaperProviderAdapter } from '../providers/types';

/** Size the fixed wallpaper to the layout pane, not the window behind navigation. */
export function createWallpaperViewport(provider: WallpaperProviderAdapter) {
  let overlay: HTMLElement | null = null;
  let frame = 0;
  const observed = new Set<Element>();
  const resize = new ResizeObserver(refresh);

  function refresh() {
    if (overlay && !frame) frame = requestAnimationFrame(draw);
  }

  function draw() {
    frame = 0;
    if (!overlay) return;
    let left = 0;
    let right = innerWidth;
    const nextObserved = new Set<Element>();
    // Selector order expresses provider preference; ignore small prose-only mains.
    for (const selector of provider.wallpaperViewportSelectors) {
      const pane = [...document.querySelectorAll<HTMLElement>(selector)].find(node => {
        const box = node.getBoundingClientRect();
        return box.width > 0 && box.height >= innerHeight / 2 && box.right > 0 && box.left < innerWidth && getComputedStyle(node).visibility === 'visible';
      });
      if (!pane) continue;
      const box = pane.getBoundingClientRect();
      left = Math.max(0, box.left);
      right = Math.min(innerWidth, box.right);
      for (let node: Element | null = pane; node; node = node.parentElement) nextObserved.add(node);
      break;
    }
    for (const node of observed) if (!nextObserved.has(node)) { resize.unobserve(node); observed.delete(node); }
    for (const node of nextObserved) if (!observed.has(node)) { resize.observe(node); observed.add(node); }
    for (const [key, value] of Object.entries({ left: `${left}px`, right: 'auto', width: `${right - left}px` })) {
      if (overlay.style.getPropertyValue(key) !== value) overlay.style.setProperty(key, value, 'important');
    }
    // Keep user-selected blur inside the same boundary as the image crop.
    overlay.style.clipPath = 'inset(0)';
    // Position-only transitions do not resize the pane. Follow them until they finish.
    if ([...observed].some(node => node.getAnimations().some(animation => animation instanceof CSSTransition && animation.playState === 'running'))) refresh();
  }

  function update(node: HTMLElement | null) {
    overlay = node;
    if (overlay) refresh();
    else {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      resize.disconnect();
      observed.clear();
    }
  }
  window.addEventListener('resize', refresh, { passive: true });
  document.addEventListener('transitionrun', refresh, true);
  document.addEventListener('transitionend', refresh, true);
  document.addEventListener('transitioncancel', refresh, true);
  return { update, refresh };
}
