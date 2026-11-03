# Post-design release sign-off

All items below are pending for the final design/build. Earlier regression results are historical evidence, not sign-off for a later artifact. Do not check these automatically when building a candidate.

## Finish the product

- [ ] Finalize settings, toolbar, on-page controls and landing-page visual design.
- [ ] Confirm every visible action has working empty, configured, paused, loading and error behavior.
- [ ] Replace old README/store screenshots with synthetic conversations from the final build.
- [ ] Finish listing identity/icons and promotional assets; document rights to every wallpaper/image used publicly.

## Freeze and test the exact candidate

- [ ] Build the final candidate; record ZIP version and SHA-256 from `candidate.json`.
- [ ] Run unit, type, browser and accessibility checks on that exact source/build.
- [ ] Fresh install: preset, upload, skip, optional pinning and first-use preview.
- [ ] Upgrade: preserve old image, filename, effects, pauses, provider overrides and skipped setup; verify future-version write refusal.
- [ ] Three providers × light/dark: new chat, long conversation, streaming, scrolling, code, links, tables, sidebar states, composer, menus and dialogs.
- [ ] Tall/wide/transparent images, cover/contain and crop; reduced-motion GIF, explicit playback and pause.
- [ ] Current stable Chrome and Brave: on-page switch, toolbar site/global actions, reset, hide controls and unsupported-page explanation.
- [ ] Keyboard, 200% zoom, 320px reflow, forced colors, VoiceOver/NVDA acceptance and meaningful value announcements.
- [ ] Save failure, close-popup pending write, concurrent settings, source removal and recovery to native appearance.
- [ ] Revisit Gemini account visibility issue #1 with a synthetic reproduction; record outcome without claiming resolution from fixtures alone.

## Prepare distribution

- [ ] Host the final landing page and privacy page at the owner's chosen public URLs.
- [ ] Confirm the website's version, download and digest match the approved artifact.
- [ ] Reconcile manifest description, listing, permission/data-use explanations and privacy page against final code.
- [ ] Confirm developer-dashboard contact/regions and current store requirements.
- [ ] Supply current synthetic screenshots, 128px icon and 440×280 tile.
- [ ] Review the ZIP contents for secrets, session state, private images and development-only assets.
- [ ] Prepare a higher-version repair/rollback process; do not recover by deleting user data or downgrading schema.

## Publish only after owner sign-off

- [ ] Owner approves the exact candidate and completed evidence.
- [ ] Publish the prepared GitHub draft prerelease if desired.
- [ ] Submit the reviewed extension to the Chrome Web Store; store review is an external step.
- [ ] Add a real store install link/badge only after approval. Until then, label the ZIP Developer Mode beta.
- [ ] Keep the same build/digest and support details linked from website, release notes and listing.
