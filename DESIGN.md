# Chatalume extension design

Approved direction: neutral controls, a blue accent, and wallpapers carrying
the visual character. This is the target for future UI work, not a claim
that every current screen already follows it. Apply it within the requested
change; visual inconsistencies elsewhere do not authorize a redesign.

## Identity and references

Chatalume makes ChatGPT, Claude, and Gemini feel personal while keeping
conversation content readable. The interface should feel quiet, direct,
and dependable on any operating system.

- [CleanShot interface examples](https://cleanshot.com/features): compact
  quick actions, grouped settings, and previews beside adjustments.
- [Tabliss](https://web.tabliss.io/): wallpaper as the main visual element,
  with controls that remain secondary to it.
- [Screeen](https://screeen.co/): explain a visual feature by showing it.

Use these as principles, not layouts to copy. Keep the existing Chatalume
logo. Its gradients are artwork, not a reason to add gradients to controls.

## Shared brand tokens

The website shares these roles. Keep token values aligned deliberately
when changing the brand; each repository must work independently.

| Role | Light | Dark |
| --- | --- | --- |
| Page | `#fafafa` | `#09090b` |
| Surface | `#ffffff` | `#18181b` |
| Raised/selected surface | `#f4f4f5` | `#27272a` |
| Main text | `#18181b` | `#f4f4f5` |
| Secondary text | `#52525b` | `#a1a1aa` |
| Primary action fill | `#2563eb` | `#2563eb` |
| Text on primary action | `#ffffff` | `#ffffff` |
| Accent text | `#1d4ed8` | `#60a5fa` |
| Destructive text | `#b91c1c` | `#fca5a5` |

Use semantic CSS custom properties for implemented roles; reuse existing
property names where possible. These are base colors, not automatic
approval of every combination. Verify contrast in actual states.

Use system UI typography: `system-ui, -apple-system, BlinkMacSystemFont,
"Segoe UI", sans-serif`. Body and controls: 14–16px, line height 1.45–1.6.
Supporting text: at least 12px; section headings: 18–20px; page heading:
24–28px. Use weights 400, 500, and 600. Reserve monospace for literal URLs,
file names, or technical instructions.

## Layout and surfaces

- Space with a 4px base: 4, 8, 12, 16, 24, 32, and 48px. Use 16px padding
  in the toolbar popup and 24px in full settings where room permits.
- Use 4px radii for thumbnails and small fields, 8px for grouped settings
  and previews. Reserve fully rounded shapes for switches and icon buttons.
- Separate settings by spacing and surface tone. Field borders may identify
  controls; keep them visible in both themes. Shadows belong to floating
  menus and popovers, not every section.
- Full settings should pair a useful wallpaper preview with grouped
  controls on wide screens and stack them on narrow screens. Keep reading
  order meaningful when the preview moves.
- The popup prioritizes current-provider status, pause actions, and a link
  to full settings. Reveal detailed effects progressively.
- Keep provider scope visible near the controls it affects. Distinguish
  global defaults from provider overrides with explicit wording.
- On-page quick controls remain small and follow the provider's theme.
  They must not cover the composer or essential navigation.

## Controls and feedback

- One primary action per group. Prefer literal labels: Choose wallpaper,
  Pause everywhere, Use global settings, Reset effects.
- Keep Pause, Reset effects, and Remove wallpaper distinct. Pausing or
  resetting effects must not imply deleting a saved image.
- Pair sliders with labels, current values, and units. Use switches for
  binary preferences and choices for mutually exclusive settings.
- Show selected presets with more than color: a check, selected state, and
  accessible name. Preserve visible keyboard focus.
- Provide visible text for unfamiliar actions. Established compact icons
  need accessible names and tooltips; tooltips cannot contain the only
  essential instruction.
- Place errors near the relevant field and announce them. Show processing
  feedback during image work without replacing the previous saved image
  with an apparently successful result before saving completes.
- Explain empty, unsupported-page, paused, and processing states through
  short next-step guidance. Keep advanced controls out of first-use setup.

## Wallpaper and motion

Show actual bundled presets or a user's locally selected wallpaper.
Synthetic conversation previews must be labelled as examples. Keep labels
and controls on readable neutral surfaces; wallpaper color cannot provide
their only contrast. Reading comfort is an aid, not a contrast guarantee.

Use 120–180ms transitions for control feedback, normally opacity and small
transforms. Avoid decorative movement in settings. Under reduced motion,
remove travel and use instant state feedback. Preserve the existing GIF
still-frame behavior and explicit animation preference. Forced-color mode
uses system colors and retains visible selection, boundaries, and focus.

## Acceptance for visual changes

Check the changed surface in light/dark where supported, forced colors,
keyboard use, reduced motion, 320 CSS px width, and 200% browser zoom.
Default interactive targets should be at least 40px, preferably 44px;
compact controls must meet WCAG 2.2 target-size/spacing requirements.
Text contrast: 4.5:1 for normal text and 3:1 for large text; essential
control boundaries and state indicators need 3:1 contrast. Focus must be
visible and not obscured.

Inspect screenshots of the affected states. Verify long file names,
errors, slider units, selected presets, and scope labels do not overflow.
Report existing deviations separately rather than silently expanding scope.

Update this guide when the owner approves a new direction. Product behavior
and terminology remain governed by CONTEXT.md; a design reference never
authorizes adding functionality, collecting data, or changing pricing.
