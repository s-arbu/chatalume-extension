# Sidebar-aware reading comfort

Owner request supersedes the opaque-lane design: keep wallpaper visible, fix sidebar alignment, offer Off / Soft (default) / Solid in additional settings. Keep the wallpaper switch: it pauses the entire wallpaper; comfort Off leaves the wallpaper visible. No additional floating controls or strength slider.

Diagnosis: `reading-comfort.css` centers a fixed 56rem gradient in broad containers, including Gemini's welcome main. This is neither the actual reading area nor invariant under sidebar changes. Live structural inspection confirmed Gemini's `.conversation-container` spans the conversation area and its `.text-input-field` is the composer wrapper; these have different measured bounds. Only tag/class/geometry metadata was deliberately inspected; no prompts submitted or session data exported.

Implementation:
1. Regression fixture reproduces expanded/collapsed sidebar, welcome vs conversation, mode selection, viewport changes, pause/off distinction. Watch the current build fail.
2. Schema 9 changes `readingComfort` to `off|soft|solid`: Boolean true migrates to Soft, false to Off; absent fresh settings default Soft; existing missing/invalid values stay Off. Preserve images, effects, provider overrides and reset behavior. Use labelled native selects in additional/full settings.
3. Replace container background stripes with a separate pointer-transparent background layer immediately above the wallpaper. Provider adapters own selectors. Measure only visible reading/composer regions; feather Soft with 20px backdrop blur and translucent theme tint; Solid uses an opaque surface. Do not mask or filter text/controls or change their geometry/stacking. Gemini welcome has composer protection only, never a generic main stripe.
4. ResizeObserver, captured scroll/resize/transition-end events, and provider DOM changes schedule one animation-frame refresh. Observe region ancestors so sidebar-driven layout changes are covered. Ignore extension-owned mutations to avoid loops. Merge intersecting regions to avoid double tint and clip to viewport.
5. Update regression/migration/pixel tests, run full gates, inspect previews, independent review, rebuild ZIP. Soft is visual comfort, not a guarantee of minimum contrast on arbitrary wallpapers; keep measured contrast checks for Solid and label limits honestly.

Constraints: no image uploads/backend/dependency/permission changes, no native typography changes, no publication. Unknown Gemini layouts fail without a broad viewport strip. Preserve the existing global hide control and global pause precedence.

Implementation notes:
- Soft uses 20px backdrop blur, a 28% light / 48% dark tint, and 48px feathering outside measured bounds. Decorative regions are reused during updates, avoiding element churn. Text and native controls are never blurred.
- Independent review found no critical/important issues and identified a missing trusted-event guard on the new selector; this was fixed and a synthetic-event rejection regression added. Native typeahead keyboard tests cover successful, held, duplicate, and rejected writes.
- Live Gemini geometry was inspected, but the rebuilt extension has not yet received signed-in visual acceptance across all three providers. Synthetic previews are illustrative, not real provider screenshots.

Final verification: 24 unit tests passed; TypeScript and release build passed; full Playwright run passed 55 tests with 6 authenticated checks skipped. ZIP integrity and diff whitespace checks passed. Artifact: `out/llm-wallpapers-v0.2.0.zip`. No commit or publication performed.
