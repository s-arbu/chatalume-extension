# Chat quick controls implementation plan

> **For agentic workers:** Use superpowers:executing-plans task by task, with test-first regression proof.

**Goal:** Investigate Gemini account visibility and add a direct current-site wallpaper toggle with a small quick-controls panel at the right center of all three supported providers.

**Architecture:** A shared content-script component owns a Shadow DOM control independent of provider wallpaper CSS, so pausing never removes the means to resume. A narrow service-worker message accepts only validated supported-provider content scripts and fixed actions; existing extension-page settings messages retain their current validation. Reuse provider overrides, serialized saves, and global pause precedence. No schema or permission expansion.

**Tech stack:** Existing TypeScript, Chrome MV3, Vite, Bun, Playwright.

**Spec:** Owner's October 30 request and stage 1 of `2026-10-30-public-launch-roadmap.md`.

## Constraints and decisions

- Implement in the shared current checkout, preserving the existing untracked roadmap; no publication, merge, or user-profile installation.
- Right-center placement, 44px primary button, clear on/off state; adjacent disclosure opens ordinary labelled buttons, not an ARIA menu requiring custom arrow navigation.
- Panel contains current-provider reset and full settings; global pause is respected and explained. A missing source offers setup instead of choosing an unsolicited wallpaper.
- Escape closes the panel and returns focus; click outside closes it without stealing focus. No entrance animation; visible focus and forced-color styling.
- Controls remain inside the viewport on narrow windows and at zoom. This does not establish collision-free placement for every third-party side panel; verify real layouts before public release.
- Settings reset preserves selected source and pause state. No deletion action in the page control.
- Content scripts cannot send arbitrary global patches, source data, or another provider's ID through the new message.

## Review focus

- Paused/global-paused/missing-image states must never show an effective on state.
- Settings updates from another tab must refresh the control without remounting an open panel or stealing focus.
- Hostile provider CSS must not style the extension's controls; native composer and account elements must remain usable.
- Save failure must show an error and restore usable controls; duplicate clicks cannot queue contradictory writes.
- Navigation and provider DOM replacement must not create duplicate controls; authentication subdomains remain untouched.

## Task 1: Gemini investigation

- [x] Inspect signed-in Gemini in the available Brave profile using a new blank chat; compare active wallpaper with global pause and restore the prior state.
- [x] Read the original provider CSS and issue evidence. Account avatar/name are visible in the current signed-in layout. No causal reproduction of #1; do not change CSS speculatively or close the issue.
- [x] Record evidence and remaining limits in the progress section below.

## Task 2: Shared on-page control

Files: create `src/content/quickControls.ts`; modify `src/content/content.ts`, `src/background/background.ts`; extend `tests/wallpaper.spec.ts`.

Interface: `createQuickControls(provider: WallpaperProviderAdapter): { host: HTMLElement; render(settings: WallpaperSettings): void }`. Content owns mounting/recovery and feeds normalized settings. Worker message `wallpaper-quick-action` accepts `set-enabled` with boolean `enabled`, `reset-effects`, or `open-settings`; provider comes from validated sender URL, never from message input.

- [x] Add failing browser tests for per-provider pause/resume on all three providers, persistence/reload, independent settings, global pause, no source, reset, settings opening, keyboard dismissal, failure recovery, mounting recovery, and rejected content-script global writes.
- [x] Build and run focused tests; confirm missing-control assertions fail before production changes.
- [x] Implement scoped message handling and isolated UI with effective state/status text and accessible labelled buttons.
- [x] Run focused tests, then unit/type/build and the full browser regression suite. Inspect light/dark and narrow captures once; fix concrete defects and confirm once.
- [x] Update README and roadmap progress; rebuild ZIP and review the diff. Leave authenticated support limits explicit.

## Progress and evidence

- Baseline from the preceding review: 21 unit and 30 local browser tests passed; type and release build passed.
- Gemini: current signed-in `/app` in Brave shows avatar/name with the installed wallpaper active, and the account link remains in the accessibility tree while paused. The prior global enabled state was restored and saved. No prompts sent, cookies exported, or account settings changed. The installed extension was not replaced with development code. This does not verify the originally reported browser version, dark mode, every route, or the new build on the live provider.
- Ruling: retain existing Gemini CSS until the reported regression is reproducible; a broad guessed change could break the working layout.
- Owner's “proceed with the first step” authorizes implementation here without another plan-approval round. The on-page interaction above resolves routine UI details within that scope.
- Implementation: shared Shadow DOM controls are mounted independently of the wallpaper and recovered if removed. Fixed content-script actions are handled in the worker without granting general settings-write access or expanding manifest permissions. Reset preserves source and enabled state; global pause wins.
- Regression proof: six initial UI cases failed for absent controls before implementation; seven focused cases then passed. A missing compact state label and Escape with focus outside the panel each failed before their fixes. Eight new cases now cover the feature, including hostile CSS, actual content-world message validation, rejected-save retry, and a held real storage write.
- Final review: an independent reviewer confirmed the narrow worker boundary and provider-state handling. Its keyboard concern was verified with a slow-write test: the pending toggle could not be reached again with Shift+Tab. The test failed before replacing transient native disable with `aria-disabled` and the existing busy guard, then passed. Unavailable actions remain natively disabled.
- Final: Ruling: retain the current color-scheme declaration; the reviewer's proposed dark-palette issue was not reproduced. Computed panel background is `rgb(32, 32, 36)` under dark preference, and the dark screenshot agrees. No speculative styling change; browser coverage remains limited to the tested Chromium build.
- Final verification: `bun run test:unit` 21 passed; `bunx tsc --noEmit` passed; `bun run build:release` passed; full Playwright suite 44 passed and 6 authenticated skips. Public live-provider checks passed. `git diff --check` passed. Updated artifact: `out/llm-wallpapers-v0.2.0.zip`.
- Remaining acceptance: issue #1's original environment and dark/saved-conversation routes; new controls on authenticated live provider layouts, including open right-side panels; real screen-reader and extreme-zoom checks. These remain open release gates, not claimed passes. No speculative Gemini CSS change, GitHub edits, publication, commit, or installed-extension replacement. Temporary native-browser tab was closed and prior wallpaper enabled state restored.
