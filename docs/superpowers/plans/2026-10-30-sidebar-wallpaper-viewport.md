# Sidebar-aware wallpaper viewport implementation plan

> **For agentic workers:** Use superpowers:executing-plans to implement this task inline.

**Goal:** Fit the fixed wallpaper to the visible chat pane beside expanded/collapsed navigation, avoiding image content hidden behind the sidebar.

**Architecture:** Provider adapters identify the layout-level chat pane (live Gemini inspection: `bard-sidenav-content`; ChatGPT/Claude: semantic main). A small content controller measures horizontal pane bounds and sizes the existing overlay. Observe pane/ancestors, viewport resize and provider DOM changes; coalesce geometry updates into animation frames and disconnect when wallpaper is inactive. Retain full viewport when no visible layout-level pane is known. Mobile overlay navigation does not alter a full-width main pane. Preserve cover/contain, crop position, dimming, opacity, blur, global/provider pause and localized comfort.

**Tech stack:** Existing TypeScript, ResizeObserver, Vite, Playwright. No dependencies, permissions or stored-settings changes.

Approaches considered: subtract measured sidebar width (couples behavior to multiple sidebar variants and mobile drawers); move overlay inside native main (risks native stacking/clipping); measure actual chat pane while keeping the fixed overlay (chosen by implementer under user's authorization to implement). Only horizontal bounds change: wallpaper stays fixed and full-height.

- [x] Regression: provider-shaped layout fixtures with expanded/collapsed/hidden navigation, animated width changes, resizes, mobile overlay, DOM replacement, unknown layout, pause/resume, contain/cover placement. Verify failure before production edits.
- [x] Add adapter viewport selectors and a narrow geometry controller; integrate with overlay creation, observer refresh and pause cleanup. Override existing viewport-width CSS with measured inline geometry.
- [x] Run focused tests, inspect live Gemini after reloading the installed extension, independent review, full checks, package ZIP and update docs. Do not publish or change unrelated settings.

Limits: cover still crops mismatched aspect ratios; contain remains available to show the whole image. Actual authenticated ChatGPT/Claude acceptance remains separate from fixtures.

Outcome: live Gemini expanded/compact navigation screenshots confirmed the crop follows the chat pane, and expanded navigation was restored. Independent review found one minor issue with position-only transitions; a red regression measured 100px drift, and frame refresh while pane/ancestor CSS transitions run fixed it. No idle animation polling. Tests cover responsive overlay drawers, DOM replacement, hidden/missing panes, pause/resume and contain mode. Final gates: 24 unit tests, TypeScript and release build passed; complete Playwright run 57 passed / 6 authenticated checks skipped. ZIP integrity and diff whitespace checks passed. Release artifact `out/llm-wallpapers-v0.2.0.zip`; no publication or commit.
