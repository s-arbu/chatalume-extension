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
