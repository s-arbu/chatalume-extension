# Chatalume

Chatalume personalizes supported AI chat interfaces with a user-selected wallpaper while keeping conversation content readable through adjustable opacity and blur. The current release is an experimental Chromium extension supporting Gemini, ChatGPT, and Claude.

## Product Language

**Wallpaper**:
A user-selected image displayed behind a supported AI chat interface.
_Avoid_: Background, theme image

**Supported provider**:
An AI chat service for which the extension has an implemented integration that can safely apply the wallpaper experience.
_Avoid_: Compatible site, platform

**Provider adapter**:
The provider-specific integration that handles host matching, page transparency rules, DOM details, and service-specific quirks.
_Avoid_: Provider implementation, site hack

**Provider alpha**:
The current release posture: Gemini, ChatGPT, and Claude are supported providers, while shared capabilities remain deliberately small and additional providers can be added later.
_Avoid_: Full multi-provider support, production release

**Wallpaper settings**:
The local configuration for the selected wallpaper, opacity, blur, and source filename.
_Avoid_: User profile, account settings

**Local-only**:
A data boundary in which wallpaper images and settings stay in the browser's local extension storage and are not sent to a project server.
_Avoid_: Private cloud, synced settings

## Product Boundaries

- The first audience is individual users who want a more personal and visually comfortable AI chat experience.
- Shared capabilities include wallpaper selection, image compression, local storage, opacity, blur, reset, and settings UI.
- Cloud sync, accounts, and a shared wallpaper library are outside the initial product boundary.
- The alpha release may change APIs and settings and should direct users to GitHub Issues for reports and requests.


## 0.2 interaction defaults

The toolbar and on-page menu provide quick wallpaper/reading-comfort controls and a link to the full editor. The editor is the only place for sliders, framing and reset. Provider-scoped links select that provider and reuse an open editor. Wallpaper visibility defaults to 1 (100%); explicit persisted values and provider overrides are retained. Conversation blur still starts with messages. Native controls receive no additional readability surfaces; welcome screens and composers remain outside conversation comfort. Preset IDs and paths remain stable; the original generated landscape images are embedded locally in their SVG containers.
