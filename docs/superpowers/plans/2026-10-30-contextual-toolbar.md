# Contextual toolbar implementation plan

> Use superpowers:executing-plans inline, with failing browser regressions before implementation and independent review before completion.

Goal: roadmap step 3, everyday controls. On opening the toolbar, identify the active supported HTTPS provider using existing host permissions and `tabs.query({active:true,currentWindow:true})`; retain only its provider ID in memory. Do not store URL/title/history or add permissions. Chrome Tabs API documentation confirms matching host permissions expose tab URL without broad `tabs` access: https://developer.chrome.com/docs/extensions/reference/api/tabs.

Provider context and effective state lead. Put site pause/resume, global pause/resume, and site reset before the source preview; collapse advanced effect controls in native details. Advanced controls and reset use the current provider scope through the existing shared storage/controller; full settings retain global editing. Unsupported/unknown context has an explicit supported-provider explanation, global pause and settings, with no implied current-site changes. Empty state routes to wallpaper selection. Global pause takes precedence; explain it and disable ineffective site pause controls until resumed. Preserve source, inheritance, comfort, serialized writes and popup-close saves.

Reuse the shared controls renderer with an optional render callback for contextual buttons/state. Read active-tab context before binding/rendering. Never alter source on a site reset. Native accessible controls, visible focus and no new motion or dependencies. Existing staged sidebar changes remain untouched.

- [x] Regression tests: actual action popups for all three providers, unsupported and empty state, provider isolation, effective state, global precedence, reset preserves source, advanced scope and inheritance, reopen/cross-tab updates, held/rejected saves. Confirm red.
- [x] Implement toolbar hierarchy/context; minimally extend shared controls for renderer updates. Keep full settings behavior unchanged.
- [x] Verify primary controls fit ordinary popup dimensions, keyboard access and advanced section; review, full tests/types/build, ZIP and docs. No publish or GitHub mutations.

Outcome: independent review found no critical/important implementation issue and requested stronger save/reset verification; held/rejected/close tests now use visible site/global buttons, and reset asserts source, enabled and comfort preservation. Real action-popup checks cover all three providers and unsupported no-host-access pages. Manage wallpaper reactivates an existing settings tab. Live Brave/Gemini inspection confirmed the provider hierarchy and essential controls fit; Tab entered the site pause button and Escape dismissed the popup without changing preferences.

Final verification: 24 unit tests passed, TypeScript and release build passed; full Playwright run 62 passed / 6 authenticated checks skipped. Existing gutter regression now compares decoded pixels rather than PNG file bytes; decoded wallpaper pixels remain identical. ZIP integrity and diff whitespace checks passed. Artifact `out/llm-wallpapers-v0.2.0.zip`. No manifest permissions added, no settings schema change, no URL/title persistence, no commit or publication.

Human discovery testing and the roadmap's screen-reader/zoom/forced-colors gates remain open; this step does not claim full accessibility acceptance. Next planned work is first-use setup and accessibility, followed by distribution readiness and final visual polish.
