# Product improvements design brief

Status: proposed; planning and technical review only. No product implementation is authorized by this document alone.

## Intent and boundaries

Help individual users choose a personal wallpaper, tune it while looking at an AI conversation, and restore the original interface whenever they want. Keep the existing TypeScript/Vite/Manifest V3 extension, three provider adapters, local storage, and upload compression.

The user requested a plan for all eight previously proposed product improvements, organized by the five practical implementation stages. The exact UI values and later-feature scope below are proposed implementation decisions, not previously supplied user requirements.

- No new runtime dependencies, accounts, backend, cloud sync, remote wallpaper catalog, or additional provider permissions.
- Keep uploads in the full settings tab; the toolbar popup contains quick adjustments and a link to that tab.
- Preserve the existing 10 MiB upload limit, GIF behavior, opacity range 0.05–1, blur range 0–20 px, keyboard access, and displayed-image privacy note.
- Keep one uploaded image. A bundled preset can be active while that upload remains saved for switching back.
- Add persistent fields only when implementing the feature that uses them. Keep the existing `llm_wallpaper_settings` key and serialized writes.
- Remove wallpaper deletes the saved upload and active preset selection, preserving effect values. Disable preserves both sources. Reset effects preserves source and enabled state.
- Ship each slice independently; later features are not prerequisites for a usable beta.

## Eight features

| ID | Feature | Proposed behavior | Priority |
| --- | --- | --- | --- |
| F1 | Toolbar popup with live controls | A 360 px wide popup shows effects, enabled state, thumbnail/status, and Manage wallpaper. Existing provider tabs update through storage events. Uploads and gallery selection stay in the full settings tab. | High |
| F2 | Enable/disable switch | Global `enabled: boolean`, default true. Disabled pages have no extension overlay or provider stylesheet; the image and effects remain saved. Uploading an image does not silently change enabled state. | High |
| F3 | Thumbnail and save/error feedback | Show the selected source and label, an empty state, Processing/Saving/Saved status, and actionable errors. Saved means storage accepted the write, not that every provider rendered it successfully. | High |
| F4 | Readability control | `dimming: number` 0–1, step 0.05, default 0; `dimTone: 'dark' \| 'light'`, default dark. Blend the wallpaper towards the selected tone before overall opacity; do not dim conversation text or automatically infer provider themes. | Medium |
| F5 | Small bundled preset gallery | Three original, script-free SVG presets: Mist, Dusk, Paper, with stable IDs `mist`, `dusk`, `paper`. All artwork is project-owned, MIT-licensed, and bundled. Preserve the upload while a preset is selected. | Medium |
| F6 | Remove wallpaper and Reset effects | Keep Remove wallpaper as a source deletion action. Reset effects restores opacity 0.15, blur 0, and any subsequently introduced readability/placement defaults. | Medium |
| F7 | Per-provider overrides | Global wallpaper source; optional overrides for enabled state and visual effects on ChatGPT, Claude, Gemini. Providers without overrides inherit global defaults. Removing an override restores inheritance. | Later |
| F8 | Image position and fit | `fit: 'cover' \| 'contain'`, default cover; `positionX` and `positionY` 0–100, step 1, default 50. Cover crops to fill; contain shows the complete image. No image editing or additional uploads. | Later |

## Practical implementation stages

1. Stabilize the core: retain the completed fixes and prove baseline storage, upload, validation, accessibility, and restoration behavior before extending settings.
2. Verify provider behavior: preserve local light/dark checks and separately run authenticated composer/sidebar/menu/dialog checks before claiming live provider readiness.
3. Improve everyday use: F2 → F6 → F3 → F1 → F4. Keep F4 independently shippable after the core controls.
4. Prepare distribution: verify versions, schema upgrade and recovery, packaged files, privacy wording, and browser coverage before each release. No publication during planning.
5. Add immediate value: F5 first. F8 and F7 remain optional follow-on slices, each returning through stages 2 and 4 before release.

## Source and override semantics

Once F5 exists, `presetId: string | null` chooses a preset when it matches the bundled catalog. Otherwise use `imageDataUrl`, or show no wallpaper if neither source is available. Choosing Use my upload clears `presetId` without deleting the upload. An unknown preset ID normalizes to null and exposes the retained upload or empty state, with an unavailable-preset message.

F7 overrides only `enabled`, `opacity`, `blur`, `dimming`, `dimTone`, `fit`, `positionX`, and `positionY`. Images, filenames, preset IDs, and settings versions remain global. A global disable is an emergency stop: effective enabled state is `global.enabled && (override.enabled ?? true)`.

## Acceptance and unresolved verification

Each feature needs tests for its persistent state, browser rendering, keyboard behavior, and interactions with earlier features. A toolbar opened as an ordinary tab does not prove actual popup lifecycle behavior. Synthetic provider pages do not prove current authenticated provider appearance. Preset licensing and actual toolbar behavior require verification during implementation; no such assets or popup exist yet.

Reference: [Chrome popup behavior](https://developer.chrome.com/docs/extensions/develop/ui/add-popup), [action popup and click events](https://developer.chrome.com/docs/extensions/reference/api/action), and [options pages](https://developer.chrome.com/docs/extensions/develop/ui/options-page).
