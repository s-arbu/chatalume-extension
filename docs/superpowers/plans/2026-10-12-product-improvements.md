# Product Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Native execution is recommended here because the features share storage, rendering, and controls.

**Goal:** Implement all eight proposed improvements as small, independently testable slices with explicit release gates.

**Architecture:** Keep provider-specific transparency in the existing adapters/stylesheets. Reuse shared storage and rendering; extract UI bindings only when the toolbar creates a second real consumer. Keep source resolution separate from effects once presets exist.

**Tech Stack:** TypeScript, browser-native APIs, Chrome Manifest V3, Vite, Bun unit tests, Playwright Chromium. No new runtime dependencies.

**Spec:** [Product improvements design brief](../specs/2026-10-12-product-improvements.md).

## Global constraints

- No new runtime dependencies, accounts, backend, cloud sync, remote wallpaper catalog, or additional provider permissions.
- Preserve the existing 10 MiB upload limit, GIF behavior, opacity range 0.05–1, blur range 0–20 px, keyboard access, and displayed-image privacy note.
- Keep the `llm_wallpaper_settings` key; never reset a valid saved upload during schema migration.
- `getSettings(): Promise<WallpaperSettings>`, `normalizeSettings(stored?: Partial<WallpaperSettings>): WallpaperSettings`, and `saveSettings(patch: Partial<WallpaperSettings>, signal?: AbortSignal): Promise<void>` remain the shared entry points.
- Persistent fields are introduced only by the feature that uses them. Schema versions below assume the specified execution order; release/package versions are separate.
- Run the existing regressions as well as each new feature test. Commit only the files belonging to that completed slice; no automatic push, merge, or publication.

## Review focus

- An upload finishing after disable/remove/reset must not undo the newer user action: F2/F6 browser tests.
- A popup closing or storage rejecting a write must not report false success or destroy the selected source: F1/F3 tests and manual popup check.
- A missing preset or failed upgrade must retain the custom upload and provide a usable empty/fallback state: F5 tests and stage 4 recovery gate.
- A bright image in dark mode, or a dark image in light mode, must leave the composer and dialogs operable: F4 local rendering checks and stage 2 authenticated checks.
- Concurrent edits to two provider overrides must preserve both entries and respect global disable: F7 storage/browser tests.

## Stage map and execution order

| Stage | Work | Exit condition |
| --- | --- | --- |
| 1. Stabilize the core | Baseline checks below; existing fixes 1–7 remain intact. | Unit, type, build, and local browser checks pass. |
| 2. Verify provider behavior | Local light/dark regressions plus authenticated checks/manual inspection. Repeat after renderer changes. | Actual coverage and skipped checks are documented honestly. |
| 3. Improve everyday use | F2 → F6 → F3 → F1 → F4. | Pause, remove, reset, preview, and live controls work without losing state. |
| 4. Prepare distribution | Version, migration/recovery, packaging, privacy, and browser evidence. | Reviewed installable artifact; publication remains a separate user action. |
| 5. Add immediate value | F5 → F8 → F7, with F8/F7 optional later releases. | Offline presets work; each optional slice passes stages 2 and 4 again. |

Suggested release boundaries: core everyday controls after F1; readability after F4; gallery after F5; placement and overrides separately. Do not make every later feature a blocker for the first release.

## Baseline and file ownership

- [ ] Run `bun run test:unit`, `bunx tsc --noEmit`, `bun run build`, and `bun run test:browser`. All must pass before product edits.
- [ ] Record authenticated coverage separately with `bun run test:monitor`; missing credentials mean unverified coverage, not a passing authenticated gate.
- Existing `src/utils/storage.ts` owns normalization and serialized persistence; `src/content/content.ts` owns overlay lifetime and effects.
- Existing `popup.html` / `src/popup/popup.ts` remain the full settings page and upload owner.
- F1 adds `toolbar.html`, `src/popup/toolbar.ts`, `src/popup/controls.ts`, and `src/popup/popup.css` for the second UI and shared controls/styles.
- F5 adds `src/wallpapers/presets.ts`, `src/utils/wallpaperSource.ts`, and three assets under `public/wallpapers/`.
- Keep provider CSS tests, `tests/providers.test.ts`, `tests/wallpaper.spec.ts`, `tests/dom-check.spec.ts`, and `tests/extension-fixture.ts` aligned with each new field/behavior.

## F2 — Enable/disable switch

**Dependencies:** baseline. **Schema:** version 2 adds `enabled: boolean = true`.

**Files:** modify `src/utils/storage.ts`, `src/content/content.ts`, `popup.html`, `src/popup/popup.ts`, `src/background/background.ts`; test both existing unit/local browser files.

**Interfaces:** existing save API accepts `{ enabled }`; `WallpaperSettings` gains `enabled`. The background worker gains an installation/update migration listener using the existing serialized save path; retain the action-click handler until F1 replaces it.

- [ ] Write tests named `legacy settings remain enabled without losing the image` and `disable removes layers and re-enable restores the same wallpaper`. Assert bytes, filename, opacity, blur, and stored enabled state; reload both enabled and disabled pages.
- [ ] Add `upload while disabled stays disabled` and `disable during pending upload stays disabled` browser cases.
- [ ] Run the new tests against the existing implementation and confirm the missing behavior causes failure.
- [ ] Add boolean normalization, a labeled checkbox, and enabled guards to initial rendering, storage changes, and observer recovery. Uploads change the source only. Persist migration through `saveSettings({})` on install/update, with errors reported and no clearing/retry reset.
- [ ] Run unit/type/build/local browser gates. Commit `feat: allow pausing wallpapers`.

## F6 — Remove wallpaper and Reset effects

**Dependencies:** F2. **Schema:** no additional fields.

**Files:** `popup.html`, `src/popup/popup.ts`; later F4/F8 extend this action when their fields exist. Tests in `tests/wallpaper.spec.ts`.

**Interfaces:** Remove saves `{ imageDataUrl: null, fileName: null }`; Reset effects saves `{ opacity: 0.15, blur: 0 }`. Both retain `enabled`. F5 later extends Remove with `{ presetId: null }`.

- [ ] Write `reset effects preserves image and disabled state` and `remove preserves effects and cancels pending upload`. Assert data and page styles independently; verify keyboard activation and distinct accessible button names.
- [ ] Confirm the new reset behavior fails before adding it.
- [ ] Label the existing removal action Remove wallpaper; add Reset effects. Reuse the current upload abort and save path; refresh values from normalized saved settings.
- [ ] Verify the standard gates and commit `feat: separate wallpaper removal from effect reset`.

## F3 — Thumbnail and save/error feedback

**Dependencies:** F2/F6. **Schema:** unchanged.

**Files:** `popup.html`, `src/popup/popup.ts`; tests in `tests/wallpaper.spec.ts`.

**Interfaces:** `renderSettings(settings: WallpaperSettings): void` in the settings UI refreshes source thumbnail, label, effects, and enabled state. Keep upload errors in the existing alert region; use a separate live status for persistence.

- [ ] Write `thumbnail follows successful upload and removal`, `rejected effect save reports an error and retains the source`, and `other settings tabs refresh after a committed change`.
- [ ] Include a drag/edit case: an incoming storage event must not replace the value of a locally edited control with an older queued value; settle to persisted state when the edit finishes.
- [ ] Confirm new thumbnail/status behaviors fail on the existing UI.
- [ ] Add a small image preview with source-label alternative text and an empty state. Set Saving before writes and Saved only after resolution; catch slider, toggle, reset, and removal failures, not only upload failures. Subscribe to normalized local storage changes. Preserve a locally edited control until its own save settles.
- [ ] Verify keyboard access, failed writes, two open settings tabs, and unchanged prior upload-race checks. Commit `feat: preview wallpapers and report save status`.

## F1 — Toolbar popup with live controls

**Dependencies:** F2/F3/F6. **Schema:** unchanged.

**Files:** create `toolbar.html`, `src/popup/toolbar.ts`, `src/popup/controls.ts`, `src/popup/popup.css`; modify `popup.html`, `src/popup/popup.ts`, `public/manifest.json`, `vite.config.ts`, `src/background/background.ts`, and browser fixtures/tests.

**Interfaces:** `bindWallpaperControls(): Promise<void>` in `controls.ts` binds the shared enabled/effects/reset/preview/status controls on either document. Move F3's `renderSettings(settings: WallpaperSettings): void` into that module and export it for the full settings upload handler. Upload/remove source handling stays in `popup.ts`. `toolbar.ts` binds Manage wallpaper to `chrome.runtime.openOptionsPage()`.

- [ ] Write `toolbar changes reach an existing provider tab` and `manage wallpaper opens the full settings page`. Assert saved values survive popup close/reopen and disabled pages remain native.
- [ ] Confirm the built manifest has no toolbar popup before implementing it.
- [ ] Set `action.default_popup` to `toolbar.html`; add `options_ui: { page: 'popup.html', open_in_tab: true }`; add the toolbar Vite entry. Extract the actual shared bindings/styles, with no generic component framework. Use a 360 px popup with thumbnail, enabled/effects/reset, status, and Manage wallpaper; keep native file selection and compression in the full tab.
- [ ] Remove the obsolete `action.onClicked` tab-creation handler. Retain the now-useful migration service worker from F2; preserve fixture extension-ID discovery through that worker.
- [ ] Run the standard gates. Manually open the real toolbar, adjust a slider while viewing a supported page, click away, reopen, and verify persisted values. Record browser version. An ordinary tab displaying `toolbar.html` is not sufficient evidence for popup lifecycle.
- [ ] Test the actual close-during-save boundary: a rejected or interrupted write must not display Saved. If supported browser testing shows pending final changes are lost when the popup closes, move the serialized write ownership into the existing service worker before shipping; verify sender/patch validation and rejection propagation. Do not add this message layer until the lifecycle test demonstrates it is needed.
- [ ] Commit `feat: add toolbar wallpaper controls`.

## F4 — Readability control

**Dependencies:** F1; repeat stage 2 before release. **Schema:** version 3 adds `dimming = 0` and `dimTone = 'dark'`.

**Files:** storage, content renderer, shared controls, both HTML documents, and all three `public/providers/*.css` overlay rules; tests in unit/local/authenticated files.

**Interfaces:** `WallpaperSettings` gains `dimming: number` and `dimTone: 'dark' | 'light'`; shared saves use these fields. Reset effects now resets both values.

- [ ] Write `readability defaults preserve the existing wallpaper`, `dimming changes the wallpaper without changing text color`, and `reset restores readability defaults`.
- [ ] Test bright and dark image fixtures in both schemes; exercise composer, sidebar/menu surfaces, dialog interaction, remove, and disable. Confirm the new behavior fails before implementing it.
- [ ] Normalize finite dimming to 0–1, tone to the two literals. Use a constant-color CSS gradient above the image in the existing overlay, with explicit dark/light controls. Overall opacity still applies to the wallpaper layer. Set the gradient background size to full overlay coverage; keep image placement separate.
- [ ] Adjust only conflicting overlay CSS declarations: current `background-size` and `background-position` use `!important` and would defeat new inline layered values. Keep pointer behavior, provider boundaries, and conversation surfaces intact.
- [ ] Verify screenshots visually; do not claim automatic contrast compliance. Run standard gates and authenticated/manual provider checks when credentials are available. Commit `feat: add wallpaper readability controls`.

## Stage 4 — Distribution checkpoint

**Files:** `.github/workflows/release-beta.yml`, `package.json`, `public/manifest.json`, README, roadmap, browser matrix; source only if a gate exposes a defect.

- [ ] Assert the release tag, package version, and manifest version agree before packaging; test a deliberately mismatched tag locally without publishing.
- [ ] Build an artifact containing every referenced HTML/script/style/resource; verify fresh install and upgrade from version-1 settings with a real upload. Verify pause/remove/reset and multiple provider tabs on the recorded browser version.
- [ ] Add a recovery note: preserve the full settings object before schema changes; never implement rollback by clearing storage. A store rollback requires a forward release carrying the earlier working behavior plus readers for the latest schema, not a blind data downgrade.
- [ ] Keep local regression gates required and live monitoring separate. Document skipped authenticated routes and manual popup checks.
- [ ] Check privacy wording against actual source rendering and resource permissions. No remote assets or broader hosts. Produce a reviewable ZIP; do not publish as part of this plan-writing task.

## F5 — Small bundled preset gallery

**Dependencies:** F3/F4 and the initial stage-4 checkpoint. **Schema:** version 4 adds `presetId: string | null = null`.

**Files:** create `src/wallpapers/presets.ts`, `src/utils/wallpaperSource.ts`, `public/wallpapers/mist.svg`, `dusk.svg`, `paper.svg`; modify storage, content, shared preview, full settings UI, manifest resources, and README license notes. Keep catalog selection outside the toolbar.

**Interfaces:** catalog entries are `{ id: 'mist' | 'dusk' | 'paper', title: string, path: string }`. `resolveWallpaper(settings: WallpaperSettings): { url: string; label: string } | null` returns a validated catalog URL via `chrome.runtime.getURL`, then the retained upload if no valid preset is selected. Storage normalization imports catalog IDs, not runtime URLs.

- [ ] Write `preset selection keeps the uploaded image`, `use my upload restores its source`, `unknown preset falls back without losing the upload`, and `remove clears both sources without changing effects`.
- [ ] Add a browser test proving presets work with network access blocked, survive reload/upgrade, and show the same label/thumbnail as the rendered source. Assert every catalog file exists and has no script or external references.
- [ ] Confirm missing preset behavior fails before implementation.
- [ ] Create three original, script-free SVG designs and license them under the repository MIT license; record ownership. Build a keyboard-accessible three-item radio gallery plus Use my upload. Selecting a preset changes only `presetId`; a successful upload clears it. Remove clears both source fields and the preset ID, while pause preserves them.
- [ ] Replace all data-URL-only overlay/observer guards with resolved-source checks. Extend preview/reset/removal for preset sources. Expose only `wallpapers/*.svg` to the existing exact provider hosts; never accept arbitrary stored URLs.
- [ ] Run all gates, review asset licensing, and repeat stage 4 for this artifact. Commit `feat: add offline wallpaper presets`.

## F8 — Image position and fit

**Dependencies:** F4/F5. **Schema:** version 5 adds `fit = 'cover'`, `positionX = 50`, `positionY = 50`.

**Files:** storage, content renderer, shared controls, both HTML documents, overlay CSS if needed, tests, and reset action.

**Interfaces:** `fit: 'cover' | 'contain'`; finite position numbers clamped to 0–100. Expose a labeled fit selector and horizontal/vertical range controls with step 1.

- [ ] Write `default placement preserves cover and center`, `contain keeps the complete image`, `placement affects only the image layer`, and `reset returns placement to cover and center`.
- [ ] Use an asymmetric portrait and landscape fixture to verify actual cropping/placement in both schemes. Confirm missing placement behavior fails before implementation.
- [ ] Apply size/position independently to each CSS background layer: the readability gradient stays at `100% 100%` centered; only the image gets cover/contain and selected coordinates. Preserve no-repeat and fixed overlay layout. Keep the original image bytes unchanged.
- [ ] Run all gates, inspect edge/crop screenshots, repeat stage 4, and commit `feat: control wallpaper fit and position`.

## F7 — Per-provider overrides

**Dependencies:** F2/F4/F8; deliberately last. **Schema:** version 6 adds `providerOverrides = {}`.

**Files:** storage, `src/providers/types.ts`, provider adapters/index, content renderer, shared controls, both UI documents, and unit/browser tests.

**Interfaces:** define `ProviderId = 'chatgpt' | 'claude' | 'gemini'`; adapter IDs use it. `ProviderOverrides` contains only enabled/effect/placement fields. `getEffectiveSettings(settings: WallpaperSettings, providerId: ProviderId): WallpaperSettings` overlays normalized provider values, with global disable taking precedence. `saveProviderSettings(providerId: ProviderId, patch: Partial<ProviderOverrides> | null): Promise<void>` merges or removes only that provider entry.

- [ ] Write `missing overrides inherit globals`, `global disable defeats every override`, `removing an override restores inheritance`, and `invalid override fields cannot change the wallpaper source`.
- [ ] Write concurrent-save tests for different providers and for two fields of the same provider. Assert fresh nested merges preserve all unrelated values; do not save a stale whole map through the existing shallow patch API.
- [ ] Confirm missing provider-specific behavior fails before implementing it.
- [ ] Add a full-settings scope selector: All providers / ChatGPT / Claude / Gemini and Use global settings for a provider. All providers edits defaults; provider scopes edit only overrides. Keep source selection global and label that fact. The toolbar remains on global controls with a link to provider settings; no extra tab-discovery permission is needed.
- [ ] Share the existing lock through an internal `updateStoredSettings(updater: (current: WallpaperSettings) => WallpaperSettings, signal?: AbortSignal): Promise<void>` used by both save APIs. Never reacquire the same lock from inside its callback. Clamp finite override numbers; omit incorrectly typed/non-finite values and invalid enum values so they inherit globals. Reject source/version fields, ignore unknown provider IDs on load, and remove empty entries. Test invalid values alongside a non-default global value to prove inheritance rather than accidental fallback to the initial default.
- [ ] Render the effective settings for the content script's matched provider. Reset effects in provider scope resets that provider's effects; Use global settings removes the entry. Global reset affects defaults only, retaining explicit overrides; communicate this scope in button labels.
- [ ] Run all gates with two different provider fixtures open simultaneously, repeat stages 2/4, and commit `feat: allow provider-specific wallpaper effects`.

## Review and handoff

After drafting, apply the requested receiving-code-review workflow to the original recommendations: restate the requirement, verify current callers/config/tests, check regression/privacy/migration risks, and correct unsupported assumptions. Record accepted decisions and remaining verification in the companion review file.

This document does not assert the features are implemented or passing. Implementation should proceed one slice at a time in the execution order above, with a review of each slice before expanding scope.
