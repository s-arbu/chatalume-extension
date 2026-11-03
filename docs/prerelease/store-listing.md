# Chrome Web Store listing draft

Unsubmitted. Refresh screenshots after final design; do not use real conversations, account details, private wallpapers or unlicensed artwork.

## Listing

Name: Chatalume — Wallpapers for AI Chats (beta)

Short description:
Personalize ChatGPT, Claude, and Gemini with local wallpapers, reading comfort, and per-site controls.

Detailed description:
Make your AI workspace feel like yours.

Choose an original bundled look or use your own image behind ChatGPT, Claude, and Gemini. Chatalume keeps your wallpaper and preferences in your browser, with no extension account or image-upload service.

- Start with Mist, Dusk or Paper, or choose your own image.
- Keep the wallpaper framed beside expanded or compact navigation.
- Use optional reading comfort to soften the wallpaper behind conversation text while leaving the surrounding image clear.
- Pause one provider from the on-page switch or browser toolbar, or pause everywhere.
- Adjust opacity, blur, blend, fit and position. Keep different effect settings for each supported provider.
- Reset visual effects without deleting your image.
- Respect system reduced motion with a GIF still frame, or explicitly allow animation.

The extension does not provide AI responses or require its own account. You use the AI services through your own accounts. It is an independent project and is not affiliated with OpenAI, Anthropic or Google.

Images and settings stay in local extension storage. To show a wallpaper, the extension places its image in the supported page; scripts on that page can read the displayed image. Avoid sensitive images. Reading comfort is a visual preference, not a guarantee of contrast for every wallpaper.

This is a beta. Provider layout updates can affect compatibility. Report a reproducible issue using the support link, without sharing private chats or settings exports.

## Single purpose

Personalize the three supported AI chat websites with a locally chosen wallpaper and the visual controls needed to display it comfortably.

## Permission justifications

- `storage`: save the user's selected image, source filename and visual preferences locally and update open supported pages when those preferences change.
- `unlimitedStorage`: preserve supported image uploads. A 10 MiB GIF expands to roughly 13.3 MiB in base64 before settings overhead, exceeding Chrome's ordinary 10 MiB local-storage quota. This permission is used for local wallpaper storage; it does not grant a network upload service. [Storage API quota](https://developer.chrome.com/docs/extensions/reference/api/storage).
- `https://chatgpt.com/*`, `https://claude.ai/*`, `https://gemini.google.com/*`: apply the wallpaper and provider-specific visual treatment, detect chat/sidebar bounds, and attach the user's on-page controls. The toolbar briefly uses a matching active tab's URL to identify its provider; it retains only the provider ID in memory. No broad `tabs`, `activeTab` or all-sites permission is requested.

Remote code: none. Scripts, styles and original presets are bundled. Website links and support links navigate only when selected by the user.

## Privacy disclosure facts to reconcile with the dashboard

- Stored locally: selected wallpaper bytes, source filename, global visual/preferences, provider overrides, setup completion.
- Processed transiently: supported-page DOM and text-node geometry for reading-comfort placement; a supported active tab's URL for provider identification; local image pixels for compression and a GIF still frame.
- Not retained or transmitted by the extension: conversation text, prompts, account identity, browsing history, tab titles, cookies, credentials, or analytics events.
- No extension backend, telemetry, ads, account, remote AI service or image hosting.
- Optional public GitHub reports are user-submitted and governed by GitHub's services. Never request a full settings export or real session state.

The DOM geometry reader does visit text nodes locally; do not claim that the extension never accesses page content. Match the final dashboard's data-use definitions to this implementation and the hosted privacy page. No dashboard declaration or compliance certification has been submitted on the owner's behalf.

## Listing assets after design

- Existing 128px icon can be replaced during the final identity pass; keep manifest icons and listing consistent.
- Prepare 1–5 current 1280×800 screenshots with synthetic chats: full conversation, current-site controls, reading comfort, setup and settings.
- Prepare the 440×280 promotional tile; a 1400×560 marquee image is optional.
- Optional short demo: show a real before/after interaction in the final build; no fake reviews, install counts, endorsements or store badges.

Sources: [listing fields](https://developer.chrome.com/docs/webstore/cws-dashboard-listing), [image guidance](https://developer.chrome.com/docs/webstore/images), [privacy fields](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy), [policies](https://developer.chrome.com/docs/webstore/program-policies/policies). Requirements checked October 30, 2026; confirm again at submission.
