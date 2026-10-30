# Beta browser matrix

This project is in a beta stabilization phase, so the browser check is intentionally small and explicit: validate the extension against the Chromium channels that matter most, then record provider-specific caveats instead of making broad support claims.

## Supported browser channel for beta

| Channel | Purpose | Status |
| --- | --- | --- |
| Playwright-managed Chromium | Regression check for provider matching, DOM stability, and extension injection | Required |

The intent is not to claim every Chromium build is supported. The beta goal is to prove the extension works in the Playwright-managed Chromium channel, and to capture breakage in a way that is easy to triage.

## Why this scope is the right beta size

- Public landing pages are not enough to prove authenticated provider behavior.
- Provider DOMs change frequently upstream, so broad-version coverage is less useful than a focused matrix that is cheap to rerun.
- The extension is still intentionally local-only and small in scope; a narrow browser matrix keeps the release gate honest without pretending we support an entire ecosystem.

## Recommended CI behavior

The local release gate uses `bun run test:browser` with the built extension and local light/dark fixtures. Live provider monitoring uses `bun run test:monitor` separately, on a schedule or manual dispatch, so an upstream outage does not block the local regression gate. Authenticated checks require maintainer-provided state and cover wallpaper persistence and composer visibility in both color schemes; they must be run before claiming authenticated coverage.

1. Run the provider smoke suite against Playwright-managed Chromium.
2. Record the browser version in the workflow summary.
3. Keep failures tied to provider, browser channel, URL, and screenshot.
4. Do not claim all Chromium variants are supported unless a version is explicitly tested and documented.

## Known provider-specific caveats

### Reading comfort verification, October 30

Local fixtures cover full-width ChatGPT, Claude, and Gemini message wrappers in light/dark themes, with narrower text columns. They assert no welcome/draft treatment, text-localized regions, sidebar alignment, streaming text without wrapper resizing, clipping above/below conversation scrollports, native code styles, and clearing effects after returning to a new chat. Screenshot crops verify that wallpaper in the gutter is pixel-identical with comfort enabled and disabled. Additional tests cover provider isolation, pause/removal, reset preservation, trusted-event rejection, keyboard operation, and held/rejected saves.

Solid mode and its former contrast matrix were removed. Local blur does not guarantee 4.5:1 contrast across arbitrary images or native text colors. Native Brave/Gemini light-mode inspection of the rebuilt extension confirms localized message-column blur, sharp surrounding mountain wallpaper, and no effect on the new-chat screen. No prompt was submitted. Signed-in ChatGPT/Claude layouts, dark-mode live acceptance, and assistive-technology acceptance remain open; fixture results do not substitute for those checks.

### Sidebar-aware wallpaper framing

Provider-shaped fixtures verify expanded, compact and hidden navigation, responsive/mobile overlay drawers, window resize, contain mode, replaced/hidden/missing panes, pause/resume, and position-only transitions. Live Gemini/Brave light-mode screenshots confirmed that the wallpaper's crop starts at the expanded sidebar edge and moves to the compact rail edge after collapse; expanded navigation was restored. Current authenticated ChatGPT/Claude layouts remain unverified. No image/settings migration is involved.

### Contextual browser toolbar

Actual action-popup tests cover active-provider detection for all three providers, site-only vs global pause, global precedence, provider-scoped adjustments, reset preserving source/comfort/enabled choices, inheritance, reopening, rejected writes, duplicate clicks while a write is held, popup close durability, and unsupported/empty setup. Essential actions are checked against popup bounds. Existing full-settings regressions remain in the suite. Live Brave/Gemini inspection showed the new hierarchy fitting without advanced controls; Tab focused the site pause button and Escape dismissed the popup. No live wallpaper preference was changed. Five-user discovery testing, screen-reader acceptance and full zoom/forced-colors checks remain separate roadmap gates.

### First-use setup and accessibility

Isolated Chromium tests cover first-use keyboard selection, upload/file chooser, skip, reopening, legacy upgrades, and synthetic preview. GIF tests verify first-frame pixels, retained original bytes, normal/reduced OS preference changes, explicit animation, paused thumbnails, mislabelled GIF input, deferred stale-frame rejection and decode-error recovery. Static decoding follows the HTML Standard default/first-frame behavior: https://html.spec.whatwg.org/multipage/imagebitmap-and-animations.html.

Settings and toolbar reflow are checked at 320 CSS px and real Chrome 200% zoom via the Tabs API. Automated axe checks use WCAG 2 A/AA, 2.1 AA and 2.2 AA tags across first-use, configured, forced-color, decode-error and actual-toolbar active/global-pause states. No serious/critical findings remained in focused checks. These are sampled extension-owned screens, not blanket conformance or provider contrast guarantees. Reference reflow guidance: https://www.w3.org/WAI/WCAG21/Understanding/reflow.

Live Brave upgrade inspection preserved the selected upload, showed the synthetic preview and General motion option, and omitted the first-use intro. The temporary settings tab was closed and the existing Gemini tab restored. No wallpaper preference or system accessibility setting was changed. VoiceOver/NVDA, stable Chrome manual acceptance, and observed human setup/discovery metrics remain open.
