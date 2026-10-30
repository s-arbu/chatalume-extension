# Reading comfort implementation plan

Owner-confirmed design: protect the conversation/composer with a theme-matched surface, preserve typography/layout/code/controls, keep wallpaper around the reading area, default on only for first installs, and expose an ordinary checkbox in additional/full provider settings. No new floating switch or strength slider.

Approach: reuse the provider CSS boundary. A shared comfort stylesheet supplies an opaque, centered reading lane (up to 56rem) on existing conversation/composer containers; provider selectors choose those containers with semantic-main fallbacks. Narrow containers fill their available width. This changes paint only, never text, DOM layout, padding, typography, or native code colors. Root/body remain transparent to show wallpaper around the lane. Gemini's blanket transparent surface-token overrides are disabled in comfort mode so nested native surfaces can recover.

Alternatives considered: text shadows/dimming alone cannot establish a background contrast floor; per-message wrappers would change layout and rely on more fragile DOM assumptions. The conservative lane is the first bounded implementation. A real-provider readability matrix remains required before asserting release-wide accessibility.

Architecture and files:
- `storage.ts`: schema 8, `readingComfort` default true for absent storage; false for existing records missing a valid Boolean. Preserve explicit values and images/effects. Add Boolean provider overrides without adding comfort to `DEFAULT_EFFECTS`, so reset preserves this preference.
- `background.ts`: permit scoped comfort patches and a fixed Boolean `set-reading-comfort` content action; retain all sender/origin/key checks.
- `controls.ts`, `popup.html`, `toolbar.html`, `quickControls.ts`: native labelled checkbox, current scope, committed save/error state, no new primary dock control.
- `chatTheme.ts`, `content.ts`: share the existing theme watcher callback; mount/remove the comfort stylesheet and root theme attribute only while a source is active and wallpaper/comfort are enabled. Pause/removal restores native UI.
- `public/providers/reading-comfort.css`: provider-specific existing selectors with fallback main; opaque theme surface and no typography/layout changes. Existing provider transparency wins again when comfort is off.

Tasks:
1. Test migration, provider isolation, reset preservation, and future-schema refusal; watch missing-feature assertions fail, implement, run unit/type proof.
2. Test checkbox saves and worker boundary, plus renderer on/off/theme/pause/removal; implement minimal controls and stylesheet lifecycle.
3. Test three providers × light/dark × bright/dark/detailed images with long prose, code, tables, links, native dialog/composer, scroll/navigation/resize and crop. Verify actual painted lane via screenshots, sampled composited pixels, contrast calculations, and unchanged geometry/typography. These fixtures are deliberately synthetic; do not claim live selector coverage from them.
4. Run unit/type/build/full browser gates; inspect batched previews; independent review and focused fixes; rebuild ZIP. Record remaining live/assistive-tech checks, no publication.

Review focus: raw missing-key migration before normalization; override Boolean validation; reset must not opt legacy users into comfort; no source/global pause/native UI cleanup; live theme changes while hidden; save failures/keyboard focus; no broad native code/control surface erasure in comfort mode.

Current selector evidence: existing provider CSS already targets ChatGPT `#thread`/composer wrappers, Claude `[data-testid="chat-container"]`, Gemini `.conversation-container`/`.chat-input-container`. These are repository evidence, not current authenticated DOM validation. A native-browser investigation was interrupted by user control before structural details were collected; no conversation was submitted or credentials exported.

## Implementation and verification record

- Implemented all planned interfaces. Schema 8 distinguishes missing storage from existing records before merging defaults, preserves source/effects, and retains future-schema write refusal. Comfort remains outside `DEFAULT_EFFECTS`, so reset preserves the chosen mode. Full settings and toolbar expose an ordinary checkbox, as does the existing quick-settings panel; the vertical dock itself is unchanged.
- Migration and missing-checkbox/root-state tests failed before implementation. Initial six provider/theme fixtures passed, then stronger native-surface and held-save tests found two defects: Claude's generic `.bg-surface-1` transparency erased a code surface, and the comfort checkbox reverted while awaiting a save. Both tests were observed failing, then passed after the provider rule became conditional and pending checkbox state/duplicate activation were handled.
- Claude's generic surface override and Gemini's global surface-token overrides are now limited to expressive mode. Comfort mode preserves the tested native code surfaces. Other provider behavior remains unchanged.
- Pixel sampling covers 18 provider/theme/image combinations with full-opacity bright, dark, and detailed wallpapers. It verifies opaque center/background pixels and exposed wallpaper, calculates 4.5:1 or better for fixture prose/link/table colors, and compares native code font/surface/width before/after. Composer pixels are checked after scrolling; lane pixels are checked again after theme change and narrow resize. Before/after light/dark previews use original Mist artwork and synthetic conversation text.
- Independent read-only review found no confirmed Critical/Important defect. Its schema-documentation finding was resolved in the pending README update. The reviewer did not independently validate real provider layouts, contrast outside the sampled content, screen readers, or runtime results. No unresolved minor implementation finding remains.
- Final verification: 23 unit tests passed, TypeScript passed, release build/packaging passed, and the complete browser suite with the strengthened composer/theme/resize pixel checks finished with 54 passed and 6 authenticated skips. Public monitor passes are not authenticated readability evidence. Final ZIP integrity and included comfort stylesheet were checked.
- Hook triage: `toolbar.html`'s hidden, dynamically sourced preview triggered the same false-positive broken-image check as the full settings page. Added a file-scoped exception with evidence; no real image issue or contrast failure was suppressed.
- Ruling: the fixed-width centered lane is a bounded initial implementation using repository selector evidence. It does not justify a claim of universal authenticated readability. Open gates: signed-in selector alignment; nested/off-center/wide layouts and canvas/sidebars; subjective portrait/landscape crop quality; native color-token breadth; actual screen-reader behavior. Retain the existing issue's contrast acceptance item until those checks have evidence.
- No publication, GitHub changes, account/session export, or installed-extension replacement. The artifact remains the unpublished v0.2.0 ZIP.
