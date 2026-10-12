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

### ChatGPT

- Route changes are common and auth flows may interrupt a direct page load.
- Session-backed routes should be checked separately from public landing-page scripts.
- Failures should include the exact URL and whether the page redirected to sign-in or a conversation shell.

### Claude

- The provider relies on layered surface/background containers that are sensitive to upstream UI changes.
- The extension must continue to clear page backgrounds and avoid reintroducing non-transparent surfaces.
- Failures should be captured with a screenshot of the page and the detected shell class structure.

### Gemini

- Conversation pages may restructure their app shell, gradients, or container wrappers.
- Route-based page changes can affect the active conversation surface more than the landing page.
- Beta checks should cover the actual app route rather than only the root entry page.

## Issue template guidance

When a browser-channel failure is found, open or update the issue with:

- Provider
- Browser channel and version
- Route or URL
- Steps to reproduce
- Screenshot or short video
- Whether the failure is authenticated or unauthenticated
- Whether the provider stylesheet or overlay is missing

This makes the matrix actionable without overclaiming compatibility beyond the tested beta set.
