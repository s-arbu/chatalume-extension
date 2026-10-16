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
3. [x] Run the checks across supported Chromium versions and document known provider-specific failures.
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

- Toolbar controls with a persistent full settings tab for image processing.
- Global pause, separate remove/reset actions, thumbnail and save/error feedback.
- Explicit readability blending, cover/contain, and image position.
- Offline Mist, Dusk, and Paper presets alongside the retained custom upload.
- Optional per-provider visual effects with global pause taking precedence.
- Schema-6 migrations preserve existing uploads; future-version writes are refused.

## Release Recovery

Before an upgrade, retain a copy of the complete `llm_wallpaper_settings` object in a safe local place. It contains the selected image and filename and should be treated as personal data. Do not attach it to public bug reports.

A recovery release should carry the earlier working behavior while keeping the latest settings reader, and use a higher extension version for store distribution. Never clear local storage or downgrade its schema to recover a renderer bug. Verify the recovered artifact with an existing upload and provider overrides before publishing.

The GitHub ZIP is generated locally by `bun run build:release`; publishing and Chrome Web Store distribution remain separate actions. Authenticated layouts and manual browser coverage still require recorded evidence.
