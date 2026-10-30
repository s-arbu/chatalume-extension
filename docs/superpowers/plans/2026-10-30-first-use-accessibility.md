# First-use setup and accessibility

> Execute inline with regression tests, independent review, and final verification.

Roadmap step 4. A daily AI user should reach a wallpaper quickly from the existing settings page without a forced tour: choose an original preset, use an image, or skip. Show a labelled synthetic conversation preview and provider links; explain how to return through the toolbar. No new automatic install tab, account, telemetry, permissions or live conversation capture. Existing settings retain their source/effects and do not see new onboarding on upgrade.

Schema 11 adds global setupComplete (false only for a truly absent record, true for legacy records) and allowAnimations (false by default, explicit override of OS reduced motion). First successful source choice or Skip completes setup in the same serialized write. Reset effects does not reset these preferences. Future-version writes remain refused; rollback is a higher-version repair preserving settings, never clearing storage or downgrading schema.

GIFs stay stored unchanged. When prefers-reduced-motion is reduce and animation is not explicitly allowed, decode a still frame locally with createImageBitmap and show that instead. Never briefly assign the animated URL while decoding. Cache only the current source in each page's memory, close bitmaps, discard stale async results after pause/source changes, refresh when OS preference changes. Apply the same rule to thumbnails and synthetic preview. Decode failure must keep animation hidden and offer a useful explanation. Reference: HTML Standard imagebitmap-and-animations requires animated sources to use their default/first frame. No blanket arbitrary-image contrast guarantee.

Improve settings/toolbar reflow at 320 CSS px and 200% zoom, long filenames, labelled native controls, slider aria-valuetext with units, focus boundaries, forced colors and reduced decorative motion. Debounce save status announcements during slider input, without delaying actual accepted writes. Keep full-settings and toolbar scope semantics.

- [x] Red regressions: setup paths/upgrade preservation, keyboard and narrow/zoom/forced-color states, reduced-motion GIF still frame and explicit animation, OS changes and stale image/pause race.
- [x] Implement narrow source/setup and motion helpers; add schema defaults and UI; preserve all existing behavior and pause precedence.
- [x] axe checks for representative extension-owned states plus manual screenshots/keyboard review. Run unit/types/full browser gates and release build; record limits, package ZIP. Real VoiceOver/NVDA acceptance remains open if unavailable; do not claim complete conformance.

Outcome: independent review identified toolbar reflow and a retained decoded cache after source removal. Both are fixed. Actual popup intrinsic sizing also needed a 320px minimum to avoid collapsing to 137px while Chrome measures the popup; the bounds regression waits for final native sizing and all essential actions fit. Forced-color axe findings on links/value labels/danger actions were corrected with system colors. GIF signature detection covers incorrect MIME labels on the uploader's preserved .gif path. Deferred-frame and decode-failure regressions prove stale images do not replace a newer source and the explicit animation choice recovers safely.

Verified: 25 unit tests, TypeScript and release build pass. Complete Playwright run: 68 passed / 6 authenticated checks skipped. Axe found no serious/critical findings in tested fresh/configured/forced-color/error/current-site/global-pause states. Browser tests use real Chrome 200% zoom, not only CSS scaling. ZIP integrity and diff whitespace checks pass. Artifact: `out/llm-wallpapers-v0.2.0.zip`. No commit, publication, permission expansion or telemetry.

Live Brave upgrade inspection preserved the existing upload, omitted onboarding, and showed the synthetic preview and motion setting. The temporary settings tab was closed and the original Gemini tab restored. No user wallpaper/system preference was changed. The existing chat was left as-is when an empty composer could not be confirmed; refresh chat tabs after extension reload when ready.

Limits: automated axe/keyboard/zoom fixtures are not VoiceOver/NVDA acceptance, human first-use timing, or blanket provider accessibility conformance. Those manual checks remain open before public launch. Native stable Chrome manual coverage also remains separate. Guidance follows W3C reflow and WHATWG default/first-frame bitmap semantics, linked above in browser matrix.
