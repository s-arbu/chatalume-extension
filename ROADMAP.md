# Roadmap

The project is ready for a small GitHub-distributed beta. The Chrome Web Store release remains a later milestone with additional review and packaging work.

## Current: GitHub Beta

- Gemini, ChatGPT, and Claude adapters are implemented.
- Wallpaper images and settings remain local to browser extension storage.
- Provider matching has unit coverage and public-page DOM monitoring.
- Local light/dark browser regressions gate releases separately from live-site monitoring. Authenticated checks are implemented but require session state before their results can be verified.
- The extension can be built from source and downloaded as a GitHub release zip.
- Beta feedback is collected through GitHub Issues with provider, browser, route, and screenshot details.

## Beta Readiness

1. [x] Add authenticated Playwright checks for routes that are unavailable behind login walls.
2. [x] Add provider smoke checks that verify the overlay and stylesheet load, not only a landing-page selector.
3. [ ] Record manual coverage for current stable Chrome and Brave; fixture coverage currently uses Playwright-managed Chromium only.
4. [x] Define a small issue template for provider, browser version, route, and screenshot.
5. [x] Freeze the wallpaper settings shape for the beta and document migration expectations.
6. [x] Document GitHub beta installation and release workflow.
7. [ ] Commit and push the release-ready changes, then create a version tag to publish the beta.

### Authentication blocker

Public landing-page checks do not prove that authenticated conversations, history, or saved sessions work. Playwright can load an authenticated browser context through `storageState`, but the state contains reusable session credentials and must be treated as a secret.

Recommended CI flow:

1. A maintainer creates a short-lived test account and captures `storageState.json` locally with Playwright.
2. The JSON is base64-encoded and stored as the GitHub Actions secret `PLAYWRIGHT_AUTH_STATE_B64`.
3. CI decodes it into the ignored path `playwright/.auth/storageState.json` only for the test run.
4. `playwright.config.ts` loads that file when present; local and forked runs remain unauthenticated.
5. Authenticated runs do not upload Playwright reports or traces, because they may contain conversation content or session-derived data.

This does not bypass authentication. It tests with an account the project maintainer controls. Rotate the state whenever the test account signs out, and never commit the decoded file.

## Later: Chrome Web Store Pre-release

- Chrome Web Store packaging and permissions review.
- Privacy review covering local image storage, host permissions, and authenticated test data handling.
- Manual verification on fresh install, upgrade, reset, and provider navigation flows.
- Release notes, support expectations, and a rollback version.

## Implemented: Everyday Controls and Wallpaper Sources

- On-page right-center control for current-provider pause/resume, reset, and settings; keyboard dismissal and compact narrow-window layout.
- Theme-aware rectangular switch and a global General setting to hide the whole on-page control without changing wallpaper state.
- Localized reading comfort (Off / Enabled): text-based bounds, feathered blur, streaming/scroll clipping, theme changes, and provider preferences. No welcome/composer treatment or opaque Solid mode. Gemini light-mode conversation and new-chat behavior checked live; other provider acceptance remains open.
- Optional first-use preset/upload/skip setup with synthetic preview; system reduced-motion GIF still frames with an explicit playback override. Keyboard, 320px reflow, 200% browser zoom, forced colors and representative axe states have automated coverage. VoiceOver/NVDA and human first-use discovery acceptance remain open.
- Contextual toolbar with provider state, site/global pause, site reset, collapsed provider adjustments, unsupported/empty guidance, and persistent full settings for source/global edits. Actual-popup regressions and live Brave/Gemini inspection cover this hierarchy; the five-tester discovery gate remains open.
- Global pause, separate remove/reset actions, thumbnail and save/error feedback.
- Explicit readability blending, cover/contain, and image position.
- Offline Mist, Dusk, and Paper presets alongside the retained custom upload.
- Optional per-provider visual effects with global pause taking precedence.
- Schema-11 migrations preserve existing uploads/effects and skip setup for existing installations; future-version writes are refused.

## Release Recovery

Before an upgrade, retain a copy of the complete `llm_wallpaper_settings` object in a safe local place. It contains the selected image and filename and should be treated as personal data. Do not attach it to public bug reports.

A recovery release should carry the earlier working behavior while keeping the latest settings reader, and use a higher extension version for store distribution. Never clear local storage or downgrade its schema to recover a renderer bug. Verify the recovered artifact with an existing upload and provider overrides before publishing.

The GitHub ZIP is generated locally by `bun run build:release`; publishing and Chrome Web Store distribution remain separate actions. Authenticated layouts and manual browser coverage still require recorded evidence.

## Next: Public Launch

See [the October 30 public-launch roadmap](docs/superpowers/plans/2026-10-30-public-launch-roadmap.md) and [first-batch implementation evidence](docs/superpowers/plans/2026-10-30-chat-quick-controls.md). Gemini account avatar/name were visible in the current signed-in Brave layout during an enabled/paused comparison; issue #1 remains open because the original disappearance was not reproduced. This is not full authenticated provider coverage.

## Prerelease preparation — before final design

- Local standalone launch-page foundation with an interactive synthetic wallpaper demo, accurate beta install path, privacy and changelog pages.
- Build-only prerelease handoff with an exact versioned ZIP/checksum, store listing and permission rationales, support guidance, and a post-design sign-off checklist.
- GitHub release automation prepares a draft; publication is a separate owner action.
- Final visual design, public website/domain choice, store imagery and the owner's full post-design testing remain pending. Tests were intentionally deferred for this preparation pass.
