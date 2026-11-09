<p align="center">
  <img src="public/logo.svg" width="72" alt="Chatalume logo" />
</p>

<h1 align="center">Chatalume</h1>

<div align="center">
  <a href="#readme"><strong>README</strong></a>
  <span> · </span>
  <a href="#install">Install</a>
  <span> · </span>
  <a href="#privacy">Privacy</a>
  <span> · </span>
  <a href="#license">MIT license</a>
</div>

---

A refined Chrome extension for making AI chat windows feel more like your workspace and less like a blank browser tab.

Use it to put your own image behind [ChatGPT](https://chatgpt.com/), [Claude](https://claude.ai/), and [Gemini](https://gemini.google.com/), then soften it with blur and opacity so the conversation stays readable.

[Report an issue](https://github.com/s-arbu/chatalume-extension/issues/new) | [View roadmap and issues](https://github.com/s-arbu/chatalume-extension/issues)

## Works with

- ChatGPT
- Claude
- Gemini
- Additional providers are deferred until the current integrations are dependable.

## Customize your wallpaper

Supported chat pages show a quick control centered on the right edge. The wallpaper switch pauses or resumes only that provider. The adjacent three-dot menu offers **Reading comfort** and **Edit wallpaper**. Detailed adjustments and reset live in the editor, rather than being duplicated in the quick controls. Escape closes the panel and returns keyboard focus. If wallpaper is paused everywhere, resume it from the toolbar popup or editor.

On first use, full settings offers **Choose a preset**, **Use an image**, or **Skip for now**, with a labelled example-conversation preview and links to the supported providers. Choosing a source or skipping completes setup. Updates preserve existing uploads and effects and do not reopen setup. Support includes a short reminder of how to find or pin the toolbar controls.

**Motion and access:** GIF wallpapers and previews use a locally decoded still frame when your system requests reduced motion. In General settings, **Allow animated wallpapers with reduced motion** explicitly permits playback; the original GIF stays saved unchanged. Pausing also freezes animated previews. Settings and toolbar controls support keyboard focus, unit-bearing slider announcements, 320 CSS px layouts, 200% browser zoom, and system colors in forced-color mode. Automated checks cover representative states; VoiceOver/NVDA acceptance remains outstanding.

The compact vertical switch has no visible text: its sliding wallpaper icon shows the state, with accessible labels and a tooltip. It follows the chat's light/dark theme, with instant updates for keyboard use and reduced motion. In the full settings tab, **General settings → Show controls in chats** hides both the switch and its three-dot button on all supported providers without changing the wallpaper. Restore them from the browser toolbar's **Edit wallpaper** action.

The fixed wallpaper fits the visible chat pane beside the sidebar and resizes when navigation expands, collapses, or disappears. Mobile drawers that overlay a full-width chat pane keep that pane's crop. If the provider layout cannot be identified, the wallpaper uses the full window. Cover fills the available area and may crop for aspect ratio; Contain shows the whole image. Image position remains relative to that visible area.

**Reading comfort** is an Off / Enabled choice in additional quick settings, the toolbar popup, and full provider settings. It places feathered blur and a translucent theme tint behind rendered conversation text, keeping surrounding wallpaper clear. It starts only when message text appears: the welcome screen receives no conversation blur. Native suggestions, composers and action controls receive no additional comfort styling. Full-width wrappers are not used as reading surfaces; regions follow text, sidebar changes, streaming, and conversation scrolling. The wallpaper button separately pauses the entire wallpaper. New installations default to Enabled; existing on/Soft/Solid choices migrate to the local blur, and Off stays Off. Provider overrides and reset-preserved preferences remain supported. Blur does not guarantee contrast over every wallpaper.

Open the toolbar popup on a supported chat for its wallpaper state, **Pause on this site**, **Pause everywhere**, and **Reading comfort**. **Edit wallpaper** opens or reuses the full editor with that provider selected. On unsupported pages it opens global defaults. Opacity, blur, blend, framing and reset are available only in the editor under **Fine-tune appearance**. **Use global settings** clears the selected provider's overrides. Active-tab context is transient; URLs are not stored and no new permission was added.

Choosing a preset keeps your custom upload so you can switch back with **My image**. **Remove wallpaper** deletes the saved upload and preset selection. **Reset effects** restores the visual defaults while preserving the image and enabled state.

The full settings tab also offers **Apply settings to**. All chats · defaults edits global defaults; ChatGPT, Claude, and Gemini can override visual effects individually. **Use global settings** removes that provider's override. The wallpaper source is shared, and global disable pauses every provider even if it has an enabled override. Resetting global effects keeps explicit provider overrides; **Reset provider effects** resets only the selected provider's effects.

## Why this exists

Most AI chat UIs are clean, but they can also feel cold and generic. Chatalume lets you keep the clean layout while adding a background that feels more like your own setup.

It is useful when you want:

- a personal wallpaper behind your chats
- more contrast control without making the interface feel heavy
- a simple browser-local setup with no account or backend
- a background that stays in place while the conversation remains the focus

## Screenshots

![Screenshot: extension popup](assets/screenshots/popup-screenshot.png)

![Screenshot: wallpaper applied in ChatGPT](assets/screenshots/chatgpt-screenshot.png)

![Screenshot: wallpaper applied in Claude](assets/screenshots/claude-screenshot.png)

![Screenshot: wallpaper applied in Gemini](assets/screenshots/gemini-screenshot.png)

## Install

### From a release

1. Open the latest beta release on GitHub.
2. Download the zip file for the extension.
3. Extract it.
4. Open `chrome://extensions` in Chrome.
5. Turn on Developer mode.
6. Select Load unpacked and choose the extracted folder.
7. Open [Gemini](https://gemini.google.com/), [ChatGPT](https://chatgpt.com/), or [Claude](https://claude.ai/), then open Chatalume from the toolbar.

### From source

1. Clone or download this repo.
2. Install dependencies with Bun.
3. Build the extension.
4. Load the `dist/` folder in Chrome as an unpacked extension.
5. Open your AI chat page and use the extension.

```bash
bun install
bun run build
```

### Requirements

- A Chromium-based browser
- Developer mode enabled
- [Bun](https://bun.sh/) 1.4 or newer

## Privacy

Your selected image and settings are stored in this browser's local extension storage. The extension has no account, application server, cloud sync, or image-upload endpoint.

To display a wallpaper, the extension writes the image into the supported website's page. Scripts on that website can read the displayed image through the shared page DOM. Local storage does not isolate a displayed wallpaper from the website; avoid using sensitive images. See [Chrome's content-script documentation](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts).

Access is limited to `chatgpt.com`, `claude.ai`, and `gemini.google.com`. ChatGPT authentication subdomains are excluded.

### Upload limits

New images must be 10 MiB or smaller, including animated GIFs. Static images are resized to fit within 2560 × 1440 and encoded as WebP; GIFs retain their original animation and dimensions. Failed uploads leave the previous wallpaper unchanged, and the most recent selection takes priority over earlier processing.

The file-size limit bounds input bytes, not decoded memory. The browser still needs to decode static images before resizing them.

---
---

## Quick notes for maintainers

This section is mainly for devs working on the project.

### Current settings shape

The extension stores wallpaper settings in browser local storage under one object: `llm_wallpaper_settings`.

- `imageDataUrl`: selected image as a data URL, or `null`
- `fileName`: selected image filename, or `null`
- `opacity`: number between `0.05` and `1`
- `blur`: blur amount in pixels
- `version`: schema version, currently `11`
- `enabled`: global pause switch; default `true`
- `setupComplete`: first-use completion; fresh installs start `false`, legacy records migrate to `true`
- `allowAnimations`: global override of system reduced motion; default `false`
- `showChatControls`: global visibility of the on-page switch and quick settings; default `true`
- `readingComfort`: `off` or `soft` (Enabled); new installs default `soft`, existing records without the field migrate to `off`
- `dimming`, `dimTone`: blend strength 0–1 and dark/light tone
- `fit`, `positionX`, `positionY`: cover/contain and coordinates 0–100
- `presetId`: active bundled preset ID or `null`; the custom upload stays saved
- `providerOverrides`: optional per-provider effects; source data remains global

The current settings schema is version `11`. Older records retain the upload, filename, opacity, blur, and effects; GIF playback now follows system reduced motion unless explicitly allowed; missing reading-comfort preferences migrate to off. Writes to a newer schema are refused so an older extension cannot silently overwrite newer settings. Image processing stays in the full tab; the service worker serializes accepted UI writes so closing a toolbar popup does not discard its last accepted change.

Bundled SVGs are original project artwork under the MIT license. See [preset provenance](docs/wallpaper-presets.md).

### Verification

Run the local release checks without provider accounts:

```bash
bun run test:unit
bunx tsc --noEmit
bun run build
bunx playwright install chromium
bun run test:browser
```

Build the reviewed ZIP with `bun run build:release` (Python 3 is required for ZIP packaging; the extension itself has no Python dependency). Packaging checks source/built versions and referenced UI/assets. Tagged releases must match both package and manifest versions; select the matching version tag for a manual release workflow run.

The browser suite loads the built extension against local page fixtures. It checks uploads, overlapping saves, errors, effect validation, navigation, reload, removal, keyboard controls, and light/dark modes. These checks run on pushes, pull requests, and before release packaging.

`bun run test:monitor` separately checks live provider pages. Scheduled monitoring can use authenticated state as described in [ROADMAP.md](ROADMAP.md); without it, authenticated checks are skipped. Fixture tests do not prove the current authenticated provider layout is readable. `bun run test:dom` runs both suites.

### Release checklist

Before shipping:

- [package.json](package.json): version matches the release tag
- [public/manifest.json](public/manifest.json): extension version matches the bundle you ship
- [README.md](README.md): install steps point to the GitHub release asset
- [.github/workflows/release-beta.yml](.github/workflows/release-beta.yml): release workflow uploads the zip asset
- [.github/ISSUE_TEMPLATE/provider-bug.md](.github/ISSUE_TEMPLATE/provider-bug.md): bug reports include provider, version, route, and screenshot
- [docs/beta-browser-matrix.md](docs/beta-browser-matrix.md): browser coverage and provider caveats are listed

## Roadmap

- [x] Gemini support
- [x] ChatGPT support
- [x] Claude support
- [x] local image compression and saved settings
- [x] provider adapter boundary
- [x] automated provider matching and DOM checks
- [x] beta readiness: provider smoke checks and release checklist
- [x] bundled wallpaper presets
- [x] user-uploaded wallpapers alongside presets
- [ ] pre-release: Chrome Web Store packaging, privacy review, and rollback plan

See [ROADMAP.md](ROADMAP.md) for the broader plan and the authenticated test-state notes.

## Help and feedback

Found a bug or want to suggest a change? [Open an issue](https://github.com/s-arbu/chatalume-extension/issues/new) with the provider, browser version, and steps to reproduce. If a screenshot helps, include it.

You can also [browse existing issues](https://github.com/s-arbu/chatalume-extension/issues) before opening a new one.

## Contributing

Contributions are welcome. This is still a small early-stage project, so please open an issue first for larger changes before you start.

<details>
<summary>Contribution guidelines</summary>

1. Fork the repo and create a new branch from the default branch.
2. Use a short, descriptive branch name such as `fix/gemini-overlay` or `feature/chatgpt-adapter`.
3. Keep each change focused on one thing.
4. Run `bun run build` before opening a pull request.
5. Explain what changed, how it was tested, and link the related issue.
6. Open the pull request against the default branch and respond to review feedback in the same branch.

</details>

## License

This project is licensed under the [MIT License](LICENSE).

## Prerelease preparation

`bun run build:prerelease` builds the extension and prepares a local handoff under `out/chatalume-prerelease-v0.2.0/`, plus a ZIP of that handoff. It includes the exact extension ZIP, a launch website with a working synthetic demo and matching download, a privacy draft, store-listing copy, install/support guidance, and a post-design release checklist. `candidate.json` records the version and SHA-256 and explicitly leaves design, testing and store submission pending.

The command packages builds; it does not run the deferred test suite. The website source is in `site/`, and its ready-to-host output is the handoff's `website/` directory. Nothing is deployed by building it. Choose the final domain and refine design before hosting it publicly.

The release workflow now creates a draft prerelease rather than automatically publishing. Manual dispatch requires an existing version tag. Final design and the owner's full test/sign-off pass must precede publishing a draft or submitting to the Chrome Web Store. See [the prerelease handoff](docs/prerelease/README.md) and [post-design sign-off](docs/prerelease/release-checklist.md).


### 0.2 tester candidate

Default wallpaper visibility is now 100%. Existing saved opacity and provider overrides are preserved; uploading another image does not reset intentional adjustments. Reset effects returns visibility to 100%, leaving wallpaper selection, pause and reading-comfort choices intact. Mist, Dusk and Paper now contain original generated landscape artwork bundled offline at 2560×1440.

Use `bun run build:release` for the GitHub-only extension ZIP and its `.zip.sha256` sidecar. See [tester instructions](docs/releases/v0.2.0-testers.md). The website remains unpublished; legacy `build:prerelease` also packages the unused website draft and is not the tester handoff. Public store/website sign-off remains separate.
