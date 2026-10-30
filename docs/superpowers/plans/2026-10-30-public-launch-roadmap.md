# LLM Wallpapers: comfort, trust, and public launch

Date: 2026-10-30. Status: proposed product roadmap, not an approved implementation specification.

## Product decision

Prioritize **daily AI users who want comfort and personalization**, as selected by the owner. The proposed promise is: **“Make your AI workspace feel like yours, while keeping conversations easy to read.”** Comfort is a user preference to validate, not a medical or productivity claim.

Keep the existing TypeScript/Vite extension, local-only settings, shared wallpaper source, and provider-adapter architecture. A backend, accounts, cloud sync, marketplace, and more providers are unnecessary for the first public release. No growth forecast is justified yet; the task is to establish retention and a repeatable way for satisfied users to recommend it.

Three possible strategies:

| Strategy | Benefit | Tradeoff | Recommendation |
| --- | --- | --- | --- |
| Wallpaper spectacle first | Strong short demo and expressive setups | Can sacrifice reading comfort and add animation/performance work | Use for marketing only after the core works |
| Comfortable personal workspace | Matches the chosen audience and beta feedback | Requires careful real-provider testing rather than just attractive screenshots | **Recommended** |
| Broad theme toolbox across many sites | Larger apparent feature list | More selectors, maintenance, permissions, and broken surfaces | Defer until existing integrations are dependable |

## Evidence and current state

Reviewed the clean local checkout at `94328f3` (`feat: implement product improvements`), current source and built assets, October 12 specifications/plans/progress, `CONTEXT.md`, ADR 0001, release workflows, README, browser matrix, and both GitHub issues. No product code was changed for this review.

- Local package and manifest are **v0.2.0**, settings schema 6. The latest published GitHub release retrieved on October 30 is **v0.1.0**. The public release asset shows five downloads; this is neither an active-user count nor proof of demand. Local improvements must reach testers before their feedback can validate them.
- ChatGPT, Claude, and Gemini are implemented. Custom uploads, three offline presets, compression, retained upload when switching presets, global pause, separate reset/remove, provider effect overrides, positioning, saved/error states, migration protection, and serialized writes already exist.
- The toolbar has global controls but no provider scope. Provider enable/disable exists in the full settings tab. Thus the feedback's per-site request is partly solved technically but remains inconvenient in the everyday entry point.
- Reset effects exists, but follows all the positioning controls in a scrollable toolbar capped at 580px. The quick action should be easier to find.
- Issue [#1](https://github.com/s-arbu/llm-wallpapers-extension/issues/1) remains open: Gemini's authenticated avatar/name reportedly disappear in Brave. No issue comments are present in the retrieved issue collection. The cause is not established. Gemini's universal surface-variable overrides and broad gradient/input selectors are investigation candidates, not a confirmed diagnosis.
- Issue [#2](https://github.com/s-arbu/llm-wallpapers-extension/issues/2) remains open: contrast, per-site toggle, reset visibility, and explicit support documentation. README support documentation is done; provider state and reset behavior exist; discoverability and measured readability remain unfinished. Its unchecked boxes do not accurately describe the implementation progress.
- The supplied screenshot is feedback evidence. Its request to test long-chat contrast is well founded. Its suggested solutions and the issue's text-shadow proposal are hypotheses, not instructions to implement them automatically.
- The [original inspiration](https://x.com/0xluffy/status/2098084585007427981) was visible through the browser. Its media preview shows a prominent illustrated wallpaper with darker treatment around the working area. Video playback was unavailable, so no claim is made about the complete interaction. The useful principle is expressive surroundings with a protected reading area; do not reuse third-party artwork without rights.

### Verification performed for this roadmap

| Check | Result | Limit |
| --- | --- | --- |
| `bun run test:unit` | 21 passed | Existing unit coverage |
| `bunx tsc --noEmit` | Passed | Static types |
| `bun run build:release` | Passed; `out/llm-wallpapers-v0.2.0.zip` generated | Packaging script checks versions, references, and ZIP integrity |
| Built extension browser regressions | 30 passed | Local provider fixtures, including real toolbar popup tests |
| Authenticated real-provider readability | Not performed | Local fixture passes do not establish current signed-in UI or actual contrast |
| Live provider monitoring | Not run in this review | Existing scheduled monitoring is not fresh evidence here |

The test browser was initially absent. Chromium was downloaded into `/private/tmp/llm-wallpapers-playwright`; tests passed after running outside the sandbox, which prevented Chromium launch. The successful command was `PLAYWRIGHT_BROWSERS_PATH=/private/tmp/llm-wallpapers-playwright bunx playwright test wallpaper.spec.ts --reporter=line`. Impeccable's context launcher was unavailable; UX recommendations use existing project context and source inspection, not a completed automated design/accessibility audit.

## Highest-value use cases

These are ranked product hypotheses, to test with daily users rather than treat as proven demand.

| Rank | User situation | Outcome | Smallest useful improvement |
| --- | --- | --- | --- |
| 1 | Reading/studying in long AI conversations | Personal atmosphere with consistently readable prose, links, lists, and tables | Protected reading surface and a comfortable default |
| 2 | Writing or coding with AI every day | Their own image without fighting the composer, code blocks, menus, or crop | Retain native functional surfaces; accessible image/effect controls |
| 3 | Using several supported AI services | A familiar workspace while being able to pause one provider | Current-provider toolbar state and independent site pause |
| 4 | Wanting an attractive setup without configuring sliders | A good result immediately | Small curated preset collection with recommended effects |
| 5 | Showing a friend their setup | An easy way to recreate a look | Optional theme card and bundled-preset recipe, after launch fundamentals |

Do not make animated wallpapers the primary comfort story. Users who prefer them can retain an explicit choice once static/reduced-motion behavior is reliable.

## Ordered delivery plan

Work in the following order. Each stage has a release gate; cosmetic completion cannot substitute for it. Effort estimates and calendar dates should follow the first signed-in investigation, because provider DOM work is the largest unknown.

### 1. Establish trust and repair provider regressions — P0

**Work**

- Implement the owner's on-page quick control in this first batch: vertically centered at the right edge of supported chats, a direct current-provider on/off button, and an adjacent compact menu for reset and settings. Keep it available while paused; clearly explain global pause and missing wallpaper. Use a small, recognizable branded control without pulsing or perpetual animation. Provide keyboard access, visible focus, Escape dismissal, and a compact layout for narrow windows. Right-side space is not guaranteed when provider side panels are open; placement must be checked rather than assumed safe.
- Reproduce #1 on the reported Gemini/Brave flow and current stable Chrome, comparing extension enabled/paused/removed, light/dark themes, and account menu open/closed. Record browser, route, version, and screenshots using disposable test content.
- Determine whether extension CSS causes the regression. If so, narrow rules in `public/providers/gemini.css` at the responsible layer. Preserve avatars, name, account menu, composer, attachments, dropdowns, dialogs, and focus states. Avoid speculative global patches.
- Add a focused regression fixture for the proven cause and a real signed-in manual check; a fixture alone cannot reproduce all Google account behavior.
- Prepare v0.2.0 beta release notes and a clear path to the exact version download; publish only after the release gate and explicit publication authorization.
- Reconcile #2's checklist against existing code when authorized to update GitHub. Keep the contrast task open until evidence exists. Correct stale alpha/beta language and the roadmap's overly broad checked browser-coverage claims.

**Gate:** reproduce and resolve the extension-caused Gemini issue, or document convincing evidence of an unrelated cause; signed-in account controls remain usable on all three supported providers. Publish support claims only for browsers actually checked. All existing regression/type/build checks pass.

### 2. Make readability a dependable capability — P0

**Work**

- Establish a manual matrix: three providers × light/dark × bright/dark/high-detail images; test long prose, code, links, tables, selected text, composer, sidebar, menus, and dialogs. Include the bundled presets and a worst-case high-contrast image. Capture actual composited backgrounds beneath text, not just CSS text colors.
- Prototype one conservative “Reading comfort” treatment: a provider-native or appropriately toned surface behind the conversation/composer, with wallpaper visible around it. Preserve native text colors and code styling. Start with a simple controlled surface; introduce regional gradients only if the simpler treatment fails the intended experience.
- Let users keep the expressive full-wallpaper treatment, but make the comfortable option obvious. Respect the provider's theme; respond when it changes. Keep the wallpaper source and existing effect values through any migration.
- Do not label opacity/blur or a dark blend slider “accessible” by themselves. Current code applies blend and image inside the same opacity-controlled overlay; it does not enforce a reading contrast floor. A text shadow also does not establish adequate contrast.
- Confirm placement and crop with tall portraits, wide landscapes, transparent images, and resized windows. Test streaming/scrolling for obstruction and visual instability.

**Gate:** extension-owned text targets at least 4.5:1 for normal text and 3:1 for large text; the tested protected reading mode preserves those targets for the sampled provider text on the tested matrix. Do not claim blanket WCAG conformance for third-party pages or arbitrary user settings. Show no loss of native controls or keyboard focus.

References: [W3C text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum), [non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).

### 3. Make everyday controls obvious — P0/P1

**Work**

- Identify the active supported provider when opening the toolbar, without persisting URLs or conversation data. First confirm the smallest required Chrome API/permission approach; do not add broad browsing access by default.
- Put provider name, effective state, **Pause on this site**, **Pause everywhere**, and **Reset this site's effects** at the top. Make the effect of global pause explicit when a provider is locally enabled.
- Keep current-site and global edits clearly separate. Preserve existing provider inheritance and global pause precedence. Reset must preserve the wallpaper; remove must clearly describe deleting the saved source shared by all providers.
- For an unsupported tab, say where the extension works and offer settings; do not imply the current page was modified.
- Move crop/position/advanced effects into a secondary section or the full tab. Keep essential controls visible without scrolling at ordinary toolbar dimensions.

**Gate:** at least four of five new testers can pause only the current provider and reset its effects, without assistance, within ten seconds each. Confirm independent provider state, inheritance, popup-close saves, and cross-tab updates in regression tests.

Likely code touchpoints: `toolbar.html`, `src/popup/toolbar.ts`, shared `controls.ts`, provider host matching; manifest only if the chosen API requires a permission. Reuse existing storage rather than duplicate it.

### 4. Accessibility and first successful setup — P1, before public launch

**Work**

- Offer three paths on first use: choose a bundled look, use an image, or skip. Explain the supported providers and preview the result with synthetic conversation content. Avoid a forced tour or automatically overwriting an existing setup on update.
- Keep onboarding short enough to reach a visible wallpaper within one minute after installation. Help users pin the toolbar action without making pinning mandatory. Provide a route back to settings and support.
- Audit real computed contrast, focus indicators, control boundaries, labels, and slider value announcements. Current native controls and status regions are a useful base; their presence alone is not a full accessibility result.
- Test keyboard-only end to end; VoiceOver and NVDA smoke checks; 200% zoom, narrow windows, forced colors/high contrast, and long filenames. Associate displayed slider units with accessible value text where necessary. Avoid announcing a save on every tiny slider movement.
- Support reduced motion: remove decorative transitions and default animated sources to a static representation when requested, with a clear explicit choice to animate. The existing global hide/pause is useful; CSS reduced-motion alone cannot freeze an animated GIF.
- Add targeted automated accessibility checks for extension-owned screens, with manual composited-image checks and assistive-technology checks retained. Test representative states, not just the empty settings screen.

**Gate:** all primary flows work with keyboard and screen reader; no clipped actions at 200% zoom; no serious/critical automated accessibility findings in tested extension screens; contrast and focus pass manual checks. Use 24×24 CSS px minimum targets or permitted spacing, with larger practical primary buttons. Reading comfort and animation preferences persist.

References: [W3C target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), [moving content controls](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html).

### 5. Finish distribution and operational readiness — P1

**Work**

- Build the owner's landing page around a working before/after demo using synthetic chats, supported providers, a short install explanation, privacy, FAQ, changelog, and support. Show the exact release version and label Developer Mode installation as a beta path.
- Prepare Chrome Web Store submission earlier than a large growth campaign. The owner's page becomes the marketing destination with a store installation link; keep the ZIP for technical beta testers.
- Review the narrow single purpose, three provider host permissions, `storage`, and the reason for `unlimitedStorage`; remove a permission only after proving the supported image-storage behavior still works. Keep remote executable code out of the extension.
- Align the manifest description, store metadata, actual functionality, website privacy notice, and dashboard disclosures. Preserve the existing honest distinction: images/settings are local, but displayed wallpapers are accessible to scripts on the supported website. Do not promise that DOM access is impossible or that the extension is affiliated with providers.
- Exercise fresh install, update from v0.1.0, pause, reset, removal, provider overrides, and recovery using a higher-version repair release. Verify old uploads survive. Keep account state and real conversations out of public artifacts.
- Record current stable Chrome coverage and Brave coverage for the reported bug. Add other Chromium browsers only after verification. Record authenticated checks separately from fixture/public-page monitoring.
- Add a support checklist that requests extension version, provider, browser, theme, and a reproducible synthetic example. Do not request a full settings export containing personal images. Provide a plain pause/recovery action while investigating breakage.

**Gate:** an unfamiliar user can install from the chosen channel, reach their first wallpaper, recover native appearance, and report a problem. Store assets/disclosures and the actual ZIP agree; migrations and repair path pass. Store review approval is an external dependency, not a promised date.

Distribution constraint: Chrome documents that directly installable consumer extensions come from the Chrome Web Store; self-hosted installation on Windows/macOS is enterprise-policy controlled. An unpacked ZIP is a development/beta workflow, not equivalent to one-click public installation. See [Chrome distribution documentation](https://developer.chrome.com/docs/extensions/how-to/distribute). Follow current [Chrome Web Store policies](https://developer.chrome.com/docs/webstore/program-policies/policies) when preparing submission.

### 6. Final visual design and launch assets — P1

**Work**

- Refine the established identity after interaction hierarchy is settled: strong wallpaper preview, clear provider context, consistent type/spacing, theme-aware extension surfaces, and deliberate focus/hover/disabled/error states.
- Keep the toolbar task-focused. Use the full settings tab for exploration and precise adjustments. Aesthetic expression should come chiefly from wallpapers; the controls should stay calm and predictable.
- Expand the three existing original presets only as needed to cover visibly distinct calm looks: neutral paper, mist/nature, muted night. Bundle recommended effects with a look only after checking the reading matrix. Keep asset rights/provenance and offline behavior explicit.
- Produce matched screenshots on all three providers, a 10–15 second before/after clip, and a concise landing page demo. Show readable chat content rather than only attractive empty chats. Refresh the README screenshots to match the shipped UI.

**Gate:** one coherent visual pass across empty/configured/paused/error/unsupported states; no regression in prior accessibility and usability gates. Five testers can identify how to start, what provider is affected, and how to undo their choice.

## Growth experiments after the foundation

The best plausible growth loop is **see a setup → install easily → get a pleasing result → keep using it → share a reproducible look**. This is a hypothesis; virality is not guaranteed by extra features or design quality.

1. **Small beta cohort first.** Recruit 10–20 daily users across the three providers, including keyboard/screen-reader users. Observe first setup, follow up after seven days, and ask why they kept, paused, or removed it. Test the current v0.2.0 rather than an old ZIP. Ask permission before contacting anyone; no outreach was performed for this roadmap.
2. **Demonstrate one concrete benefit.** Publish before/after examples centered on a personal yet readable daily workspace. Try a study/writing story and a personal-setup story in separate small launches. Judge actual installs and subsequent use, not likes alone.
3. **Make sharing safe and reproducible.** Initially share official preset links from the website. If users request in-product sharing, export a theme card rendered against synthetic chat and a validated bundled-preset/effects recipe. Do not capture actual conversations, auto-upload private wallpapers, or create a public image-hosting service. Arbitrary image sharing needs separate rights/privacy design.
4. **Distribution partnerships once retention exists.** Offer a few original/licensed looks with small creators whose audiences already customize workspaces. Each pack should link to a usable setup and record provenance. Keep acquisition experiments small until the install-to-retention path works.
5. **Improve the listing with evidence.** Use honest screenshots, actual compatibility, and feedback from satisfied users. No gated features for ratings, incentivized reviews, unsolicited messages, or inflated install claims. Localize after evidence shows demand from a specific language group.

## Measurement and decision gates

Suggested starting thresholds below are working decisions, not industry benchmarks or forecasts. Small cohorts are directional; repeat after fixes before drawing broad conclusions.

| Signal | Initial decision rule | Collection boundary |
| --- | --- | --- |
| First-session setup | At least 80% of observed testers apply a look unassisted within 60 seconds after install | Moderated session, participant consent |
| Control discovery | At least 4/5 can pause one site and reset effects within ten seconds each | Task observation |
| Readability and native UI | No unresolved extension-caused blocker in the agreed test matrix | Documented manual checks plus regression tests |
| Seven-day retention | At least half of the first 20 activated testers voluntarily report still using it | Explicit follow-up; not inferred from download counts |
| Install friction | Record where interested users stop; compare beta ZIP and store cohorts when available | Website aggregate counts and voluntary user reports |
| Growth | Repeat a channel only when it brings activated users who return | Compare cohorts; do not optimize impressions alone |

Use aggregate website/store reporting and opt-in interviews first. The extension currently has no telemetry; this roadmap does not authorize adding it. If quantitative in-extension activation/retention measurement becomes necessary, specify consent, data minimization, retention, and disclosures as a separate proposal. Never collect prompts, conversation text, image data, filenames, full URLs, or account identity for growth measurement.

## What to defer

Cloud sync/accounts, AI image generation, public wallpaper hosting, theme marketplace, schedules/rotation, custom CSS injection, many more providers, native apps, and subscription billing. These introduce maintenance or trust costs before the core promise has been validated. A provider-specific wallpaper source is also deferred: the current shared source already serves the chosen audience, while source-per-provider would enlarge storage/migration scope.

## First implementation batch to specify next

Begin with Gemini #1 investigation and the newly requested right-side on-page quick toggle/menu, followed by the signed-in readability matrix and toolbar hierarchy. The owner authorized proceeding with this first batch on October 30. Implementation and verification are recorded in `2026-10-30-chat-quick-controls.md`; later roadmap stages remain proposals. Publishing releases or changing GitHub issues remains separate.
