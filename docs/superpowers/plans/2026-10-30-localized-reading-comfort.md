# Localized reading comfort

Supersedes the three-mode/full-container design in `2026-10-30-comfort-modes-fix.md`. Owner rejected Solid as effectively hiding the wallpaper, rejected page-wide Soft blur, and requires zero comfort treatment on new-chat screens.

Root cause: provider conversation wrappers span the available main area. Measuring their boxes and merging overlapping regions erased the distinction between text and surrounding wallpaper. Even the composer-only welcome treatment was unwanted.

Implemented:
- Remove Solid from all controls and runtime modes. Keep a native Off / Enabled select in additional settings. Schema 10 migrates legacy true/Soft/Solid to local blur and false/Off to Off, including provider overrides. Preserve image/effects/reset behavior.
- Provider adapters select individual messages. Measure rendered text-node Range rectangles, excluding controls, editors, hidden labels and invisible text. A message gets one translucent, feathered 20px blur surface bounded by its text; no merging into a larger page region. Empty messages and welcome composers create no surface or comfort theme attributes.
- Intersect regions with overflow clipping ancestors and viewport, including the feather padding. Observe characterData for streaming updates that leave wrapper dimensions unchanged; keep scheduled scroll/resize/DOM refresh and observer cleanup.
- No focus-mode rename: the effect is localized to conversation text. The wallpaper pause button remains distinct.

Verification design: full-width message wrappers around narrower text columns for all three providers in light/dark mode. Check welcome/drafts untreated, start/new-chat transitions, sidebar changes, native styles, trusted-event rejection, glyph-only streaming, bounded scrolling, and pixel-identical wallpaper gutters with comfort on/off. Retain provider isolation, reset/pause cleanup and pending/rejected-save tests. Remove the obsolete Solid contrast tests and their associated guarantee.

Independent review identified missing characterData observation and ancestor scroll clipping; both were corrected and covered by regressions. Live Brave/Gemini light-mode conversation showed sharp mountain wallpaper surrounding localized blur; new-chat screenshot showed no blur around welcome/composer. Original conversation restored, no prompt submitted. Signed-in ChatGPT/Claude and live dark-mode acceptance remain open. Blur cannot promise universal text contrast for arbitrary images.

Final gates: 24 unit tests passed, TypeScript passed, release build passed, full Playwright run 54 passed / 6 authenticated checks skipped. ZIP integrity and diff whitespace checks passed. Artifact: `out/llm-wallpapers-v0.2.0.zip`; no commit or publication.
