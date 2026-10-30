# Theme-aware rectangular switch refinement

Owner-authorized scope: refine the existing on-page toggle with slight corner rounding, state motion, provider-theme colors, retained three-dot settings, and a global preference hiding the entire control.

Direction: original rectangular sliding thumb inspired by the switch shapes at https://uiverse.io/elements?search=switch; no copied component code or new library. Keep the existing button/pressed semantics and saved-state behavior. Use restrained blue on-state colors, neutral off-state surfaces, 6px corners, 44px minimum hit targets, a 160ms transform transition for pointer activation, instant keyboard/reduced-motion updates, and the existing compact settings panel.

Implementation:

1. Add regression tests for provider light/dark overriding opposite system preference, runtime theme changes, and hiding/re-enabling the whole dock without pausing wallpaper. Verify default and malformed stored preferences, source retention, and rejection of provider-scoped visibility edits.
2. Add global `showChatControls` (default true), schema 7 normalization preserving existing sources/effects, and a full-settings General checkbox. This is global even when editing provider effects; toolbar remains available to restore it.
3. Refine the shared Shadow DOM markup/CSS; add a small theme watcher for root/body theme attributes/classes and explicit computed color scheme, with OS fallback. Observe only relevant root/body changes; support late body insertion and OS preference changes. Never read conversation content or infer theme from the wallpaper.
4. Verify focused tests, unit/type/build, full browser suite, light/dark/compact screenshots, and independent review. Rebuild the unpublished v0.2.0 ZIP. Do not publish or replace the installed extension.

Acceptance: theme updates without reload, including while paused/hidden; entire dock can be hidden globally and restored; image/effects/enable states stay intact; three-dot panel, save failures, keyboard focus, forced colors, and reduced motion continue to work. Existing pending-save guard remains authoritative.

## Outcome

- Implemented the original sliding rectangular thumb, 6px dock/panel corners, 4px track corners, theme-dependent blue/neutral colors, and retained three-dot disclosure. The 160ms transform transition applies to pointer use; keyboard and reduced-motion changes are instant.
- Added schema-7 `showChatControls`, its general-settings checkbox, normalized legacy/malformed values, and global persistence independent of provider effect scope. Hiding closes the panel and preserves wallpaper, effects, and enable states. Existing toolbar settings restore it.
- Theme watcher uses root/body attributes and classes, then explicit computed color scheme, then OS preference. Attribute and OS changes update live, including while hidden. No conversation data, extra permissions, or dependencies.
- Red proof: the new visibility, theme-mismatch, and normalization tests failed before their implementations. Final unit suite: 22 passed. Types and release packaging passed. Full Playwright suite: 46 passed, 6 authenticated checks skipped. Light/dark/compact previews inspected; actual signed-in provider layouts remain an external acceptance gate.
- Independent read-only review found no actionable Critical, Important, or Minor findings. Live provider DOM, rendering, and runtime outcomes were verified only to the limits above, not by that reviewer.
- Design-hook triage: primary white-on-blue text was 3.68:1 and destructive text/hover also fell below normal-text contrast. Updated button colors exceed 4.5:1 in those states. The missing-source image warning was a false positive for the intentionally hidden, dynamically populated preview; recorded a broken-image exception scoped to `popup.html` in `.impeccable/config.json`. No low-contrast findings were suppressed or left unresolved.
- Rebuilt the unpublished `out/llm-wallpapers-v0.2.0.zip`. No publication, installed-extension replacement, or GitHub mutation.

Owner refinement: removed visible Wallpaper/ON/OFF labels and made the compact horizontal row explicit. Retained the wallpaper glyph, sliding state, accessible name/pressed state, tooltip, and adjacent three-dot settings. Verified the old text failed the new expectation before changing the markup.


## Vertical refinement requested by owner

The final dock is vertical and icon-only: a 36×74px inset switch, a 28px sliding thumb with an original layered-image glyph, and the three-dot control below. Thumb up means on, down means off. The panel opens to the left and stays within narrow windows. Accessible labels, theme detection, reduced motion, and the global hide setting are retained. Consulted Lucide's wallpaper icon reference (https://lucide.dev/icons/wallpaper) for the visual vocabulary; no third-party SVG code was copied.

Regression: vertical geometry failed against the horizontal build before the change; the final suite has 22 unit and 40 local browser passes, with type/build/release packaging passing. Inspected final light/dark previews. No live authenticated layout claim or publication.
