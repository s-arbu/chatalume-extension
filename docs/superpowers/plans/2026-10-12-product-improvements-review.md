# Product improvements technical review

Reviewed after drafting [the implementation plan](2026-10-12-product-improvements.md), using the requested [receiving-code-review skill](/home/star/.codex/plugins/cache/openai-curated-remote/superpowers/6.4.2/skills/receiving-code-review/SKILL.md).

Scope: evaluate the original eight recommendations against the actual code, clarify semantics, and correct the plan before implementation. This is a technical self-review of proposed changes, not an independent review of product code that has not been written.

## Findings and dispositions

| Feature | Verified codebase fact | Review decision |
| --- | --- | --- |
| F1 Toolbar | `public/manifest.json` has no popup/options entry; `src/background/background.ts` currently opens a tab on action clicks. Chrome action clicks no longer reach that handler once a popup is configured. | Add a real toolbar entry and options declaration; remove the old click handler. Keep the worker for F2 migration and preserve the browser fixture's worker-based extension-ID discovery. |
| F1 Lifecycle | Uploads currently decode and encode inside the settings document; no background image-processing API exists. | Keep file selection/compression in the full settings tab. Test actual popup close/reopen and close-during-save; do not treat opening its HTML in a normal tab as equivalent. Add durable worker write ownership only if the lifecycle evidence requires it. |
| F2 Pause | `restoreProviderUi()` currently decides activity from an image URL, and the observer checks the same condition. | Add enabled checks at every lifecycle branch; hiding just the overlay would leave transparency active. Pause preserves source and does not cancel a valid selection; that selection must remain paused. |
| F3 Feedback | Upload failures are caught; slider/reset save failures are not. No thumbnail or shared UI storage-change refresh exists. | Cover every mutation, report Saved only after storage resolves, refresh other views, and keep an active edit from being overwritten by an older queued event. Thumbnail indicates a source, not proof of provider application. |
| F4 Readability | Renderer sets opacity/filter on a single background element. All provider overlay rules force size and position with `!important`. | Blend a constant tone into the image, leaving conversation text untouched. Define dark/light explicitly; no unverified provider-theme detection. Adjust conflicting overlay rules and keep the future gradient/image sizes separate. |
| F5 Presets | Stored source validation currently permits data URLs; all active/recovery checks use `startsWith('data:image')`. There is no catalog or bundled wallpaper directory. | Do not weaken storage into accepting arbitrary URLs. Validate preset IDs, resolve only bundled URLs, replace all source-specific guards, and retain the custom upload when choosing a preset. Exposure is limited to exact supported hosts. |
| F6 Reset | The current Remove action deletes image/name and leaves opacity/blur unchanged. | Preserve that behavior; introduce a separate effects reset. Specify pause/removal/reset state transitions and extend the reset only as each new effect is implemented. |
| F7 Overrides | `saveSettings()` takes the origin-wide lock but merges top-level fields only. Adapter IDs are currently typed as strings. | A stale whole override map would lose another edit. Merge a single provider entry against fresh storage under the same lock; type known IDs, whitelist fields, and keep global disable authoritative. Invalid override values inherit globals. |
| F8 Placement | Overlay size is fixed to cover and position to center. Layered readability backgrounds will require different sizes for tone and image. | Define cover/contain plus bounded coordinates, retain bytes, and test portrait/landscape cropping. Do not apply image fit to the readability gradient. |

## Corrections made after review

- Explicitly carried `renderSettings()` into the shared UI module so the second UI has the same renderer and the original upload handler retains a defined caller interface.
- Added an actual popup close-during-save gate rather than assuming a window-scoped lock survives document teardown.
- Defined invalid provider overrides as inheritance; using the global normalizer blindly would insert initial defaults and accidentally stop inheritance.
- Kept global disable as an emergency stop even when a provider has an enabled override.
- Required new preset handling to replace source guards in rendering and observer recovery, not only the upload UI.
- Preserved a real service-worker purpose and accounted for the existing extension-ID test fixture; no empty worker exists solely to satisfy tests.

## Verification limits and release blockers

- Only plans/design/review documents changed in this turn. Future feature tests have been specified, not executed or claimed to pass.
- Actual toolbar lifecycle must be tested in a supported browser during F1. A worker write path is an evidence-triggered fallback, not an unconditional new subsystem.
- Authenticated provider layout, sidebar/menu/dialog appearance, and theme behavior need maintainer session state and manual evidence during stage 2. Existing synthetic fixtures are insufficient for those claims.
- Preset assets and ownership/license records must exist and be checked during F5; no remote gallery or license assumption is accepted.
- A schema upgrade must preserve source bytes. Recovery retains the latest storage reader rather than silently downgrading or clearing settings.
- Reset under provider overrides has scope-specific behavior; the UI must distinguish Reset provider effects from Use global settings.

## Result

The recommendations fit this codebase with the corrections above. Implement the everyday controls first, then readability and offline presets. Keep placement and provider overrides independently shippable later slices. Re-run the receiving-code-review workflow against actual implementation feedback before applying requested code changes; this plan review does not pre-approve unseen code.

Primary platform references: [Chrome popup lifecycle](https://developer.chrome.com/docs/extensions/develop/ui/add-popup), [action popup and click events](https://developer.chrome.com/docs/extensions/reference/api/action), [options pages](https://developer.chrome.com/docs/extensions/develop/ui/options-page).
