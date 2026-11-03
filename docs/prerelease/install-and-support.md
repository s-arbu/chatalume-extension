# Install, update and recover

This candidate is an unpublished technical beta. Design and final hands-on testing are still pending.

## Install the beta ZIP

1. Download the versioned extension ZIP and extract it to a folder you will keep.
2. Open `chrome://extensions` (or `brave://extensions` in Brave).
3. Enable Developer mode, choose Load unpacked, and select the extracted folder containing `manifest.json`.
4. Open the browser's Extensions menu and choose Chatalume. Pinning is optional.
5. Choose a preset or image in full settings, or skip. Open ChatGPT, Claude or Gemini and refresh an already-open chat if needed.

The ZIP is not a CRX installer and does not install with one click from a normal download link. Chrome Web Store availability must only be advertised after there is a real approved listing.

## Update an existing unpacked installation

Keep the same extension entry and loaded folder. Close settings, replace that folder's built files with the new extracted build, then use Reload on its extension card. Refresh supported chat tabs when ready. A different loaded folder or store identity may create a separate installation and separate storage; do not remove the original until your image and settings are accounted for.

## Pause or recover native appearance

- On-page switch: pause only that provider.
- Toolbar Pause everywhere: pause all supported providers.
- Reset this site's effects: keep the image, comfort preference and pause choice while restoring visual defaults.
- Use global settings: clear the selected provider's overrides.
- Remove wallpaper: clear the saved custom source and preset selection. This is different from pausing.
- Browser extension manager: disable the extension if a provider's layout is obstructed, then refresh the page.

Do not clear storage as a routine repair. Settings/image bytes belong to the user. A recovery build must retain the current schema reader, preserve sources/overrides, and use a higher extension version for store delivery. After design, exercise the upgrade/recovery path with a non-sensitive image before publishing.

## Report a problem

Use https://github.com/s-arbu/chatalume-extension/issues/new and include extension version, provider, browser/version, light or dark theme, and whether it occurs in a new chat or existing conversation. Provide steps with synthetic text. A redacted screenshot is optional.

Do not attach passwords, cookies, session files, full private conversation URLs, real prompts, private wallpapers, or the complete settings object. If a screenshot is needed, use a synthetic conversation and hide account details.
