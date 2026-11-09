# Chatalume 0.2 tester finish implementation plan

Approved in chat on 2026-11-08. Execute inline using executing-plans. No publishing, spending, outreach, or website work.

Goal: finish a small tester release without adding product scope. Follow DESIGN.md and docs/designs/chatalume-first-users.md; preserve existing work.

- [x] Simplify toolbar.html and toolbar.ts to thumbnail/status, provider/global pause, reading comfort, and one editor link. Keep detailed controls only in popup.html. Remove reset from on-page quick menu; retain background compatibility for existing requests.
- [x] Add a background-owned editor opener that validates provider scope, reuses an existing options tab, and puts the selected provider in the URL hash. Validate the hash and apply it on initial options load and hash changes. No new permissions or persisted URLs.
- [x] Keep conversation comfort's message-only activation. Add a separate active-UI theme marker for native-control readability, so welcome suggestions get local surfaces without a full-screen comfort layer. Preserve provider typography/layout, dialogs and navigation. Use bounded provider selectors and verify synthetic controls in both themes; live signed-in acceptance remains manual.
- [x] Change DEFAULT_EFFECTS.opacity to 1 and provider fallback/copy to match. Preserve explicit saved values, uploads and overrides. Reset effects changes opacity to 1 while preserving pause/comfort preferences. Add storage regression coverage.
- [x] Presets: owner approved original premium landscapes in chat. Mist/Dusk/Paper replaced using built-in generation; IDs and self-contained paths retained. Reference post was not inspected.
- [x] Verify build/type/unit checks and targeted browser checks for scoped editor navigation, popup save failure, defaults preservation, control cleanup and welcome-state activation. Review screenshots. Update tests for renamed labels/collapsed advanced controls. Record synthetic versus signed-in coverage precisely.
- [x] Package extension ZIP and GitHub-only tester notes/checksum. Mark signed-in Chrome/Brave acceptance and unresolved preset direction pending. Do not build legacy site handoff or publish anything.

Review focus: existing low-opacity choices, scope isolation, no native controls/dialogs hidden, empty and paused states, stale async preview/save results, URL-hash validation and editor reuse, reduced motion, reset versus deletion.

Outcome: local candidate prepared; see docs/releases/v0.2.0-verification.md for exact evidence and remaining signed-in acceptance. No publication.

2026-11-09 owner correction: native-control readability surfaces and their separate UI marker were removed entirely. This supersedes the native-control task above. Existing message-only comfort remains.
