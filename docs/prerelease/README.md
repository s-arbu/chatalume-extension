# Prerelease handoff

Status: local, unpublished candidate. Design refinement and the owner's final test pass are still pending. This pack is preparation, not release approval.

## What is prepared

- A versioned extension ZIP built from the current source.
- Store listing copy and permission rationales in `store-listing.md`.
- Installation, update, recovery and reporting guidance in `install-and-support.md`.
- A final post-design sign-off in `release-checklist.md`.
- A standalone local launch page and privacy page, portable to the owner’s eventual website. The canonical privacy draft is in `../website/privacy.html` inside the generated handoff.
- A candidate manifest with the exact ZIP name, version and SHA-256 digest; no claim of testing or store approval.

Run `bun run build:prerelease` to prepare the local handoff after source/design changes. It packages builds; it does not run the deferred test suite. Rebuild after design is finalized so the digest identifies what will actually be tested and submitted.

The GitHub release workflow prepares a draft prerelease. It must not publish automatically. Do not publish the draft or submit to the Chrome Web Store until the post-design sign-off is complete.

## Owner decisions before publication

- Choose the final website/domain and host the privacy page at a public URL.
- Finalize the visual identity, listing images and final product name.
- Confirm developer-dashboard contact, distribution regions and the current privacy declarations.
- Complete the agreed hands-on provider/browser/upgrade test pass after design.

Keep the beta ZIP labelled as a Developer Mode / Load unpacked install. A website download is not a one-click Chrome Web Store installation. Consumer Chrome installation on Windows/macOS normally goes through the store; self-hosted installations use enterprise policies. [Chrome distribution guidance](https://developer.chrome.com/docs/extensions/how-to/distribute).
