# Use a provider adapter boundary

Status: accepted

Chatalume will keep wallpaper capabilities provider-neutral and isolate host matching, page transparency rules, DOM details, and provider-specific quirks behind provider adapters. The alpha currently supports Gemini, ChatGPT, and Claude and should advertise only implemented provider behavior; this preserves a path to additional providers without duplicating the settings, storage, and image-processing layers.

## Considered Options

- Duplicate the full content script for every provider: rejected because shared behavior would drift across integrations.
- Treat every provider as identical: rejected because host pages and DOM behavior require provider-specific handling.

## Consequences

The extension can add providers incrementally, but each new provider must supply and maintain its own adapter. Shared settings and image-processing code remain independent of provider-specific page behavior.
