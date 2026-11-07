# Chatalume: product audit, improvement plan, and first-user marketing

Date: 2026-11-07. Prepared with gstack Office Hours. Mode: Builder.
Status: APPROVED by the owner on 2026-11-07. Approach A, the premises, and the detailed strategy/backlog below are adopted. Publication, spending, and outreach require separate authorization. Owner: project maintainer.

## Decision and evidence

Build a free, portfolio-first product with real users; reconsider income later. The owner chose an assisted beta followed by promotion and ongoing GitHub feedback. Zero spending is the starting constraint. Store-first and portfolio-only launches were considered; neither fits the chosen next step as well.

One person gave useful feedback on X without installing; the owner implemented it. There is no demonstrated external installation, retention, willingness to pay, or established community yet. Those are unknowns, not evidence of failure. Marketing starts immediately after the month of testing/fixes; immediate user growth cannot be promised.

The appealing moment is seeing an ordinary AI chat become a personal workspace while conversations remain usable. A future creative direction could be themed study or writing setups shared through synthetic demo cards. Test whether people want to recreate a look before building sharing machinery.

## Audit verdict

| Area | Finding | Consequence |
| --- | --- | --- |
| Value | Personalization is a valid preference, but repeat use is unproven. | Measure voluntary continued use before expanding scope. |
| Positioning | Wallpaper customization already exists; Backdrop advertises ChatGPT wallpapers and readability controls. | Lead with Chatalume's three-provider experience, local storage, and simple controls; do not claim uniqueness. |
| Product | Presets, uploads, reading comfort, per-site controls, reset, and onboarding already exist in source. | Verify and simplify the current experience rather than rebuild old roadmap items. |
| Reliability | The browser matrix leaves signed-in provider, assistive-technology, and stable-browser acceptance work open. | Fixture tests and historical passes do not establish final-candidate readiness. |
| Distribution | Developer Mode adds effort and trust barriers, plus manual updates. | Use it for the technical beta; expect it to limit wider conversion. |
| Portfolio | The repository has adapters, storage/migration handling, tests, and release workflows. | Explain engineering choices and measured outcomes in a case study. More features alone add little evidence. |
| Community | No active user group exists yet. | Start with responsive issues and updates, without a Discord or community platform. |

Evidence reviewed: README, CONTEXT, DESIGN, manifest, provider adapter ADR, October 30 roadmap, browser matrix, prerelease checklist/listing, issue template, release workflows, and sibling website configuration/README. No fresh runtime testing, authenticated inspection, live issue-status audit, or release verification was performed for this strategy. Uncommitted UI changes were preserved. This plan updates priorities; it does not invalidate earlier engineering constraints or certify old tasks complete.

## Audience and promise

Initial audience hypothesis: daily desktop AI users who already personalize their digital workspace and want that feeling in their chats. Start with people reachable through the owner's existing X activity. Recruit technically comfortable users for the unpacked beta; include non-developers once a practical installation path exists. Seek coverage of all three providers rather than assuming ChatGPT observations generalize.

Primary message: **Make your AI chats feel like your workspace.** Supporting copy: **Personalize ChatGPT, Claude, and Gemini with your own wallpaper or a bundled look, with reading comfort and per-site controls. Free beta; images and settings are stored locally.**

Do not promise improved productivity, medical comfort, universal contrast, provider affiliation, or perfect privacy. The displayed wallpaper is accessible to scripts on the supported page. Reading comfort is a preference, not a contrast guarantee. Label synthetic demos as examples.

## One-month improvement plan

Start Day 1 only when the rebranded tester candidate and installation instructions are ready. The deadline applies to the beta cycle, not unfinished release preparation. Four weeks means 28 days here. Two weeks of testing plus seven-day follow-ups plus two weeks of fixes would take 35 days if sequential; overlap follow-ups with fixes to meet the owner's one-month limit.

| Window | Work | Evidence to retain |
| --- | --- | --- |
| Before Day 1 | Finish the scoped rebrand; freeze a versioned candidate; run required checks; prepare install/update/remove guidance, known limitations, issue link, and synthetic demo. Invite candidates before the clock starts. | Candidate version/digest, check results, matched download, five booked testers. |
| Days 1–7 | Observe the first three testers installing and using it. Offer installation help, then stop guiding product tasks. Fix urgent blockers as they appear. | Assisted vs unassisted install, task outcomes, failure point, browser/provider/version. |
| Days 8–14 | Reach at least five installed testers, ideally five to eight. Cover each provider; maintainer fills missing compatibility checks. Follow up with early testers seven days after activation. | Actual setups, early follow-ups, prioritized issues. |
| Days 15–21 | Implement the highest-impact feedback; complete remaining seven-day follow-ups, including Day 14 activations by Day 21. Ask affected testers to retry fixes. | Reproductions, focused regression evidence, version used at follow-up, reasons for pauses/removals. |
| Days 22–28 | Finish fixes, freeze and verify the launch candidate, update release notes/screenshots/support, prepare the first promotion batch. | Exact-candidate checks and a short launch decision. |
| Day 29 onward | Begin public beta promotion and ongoing feedback. | Weekly acquisition/usage notes and a manageable issue queue. |

Priority order for feedback:

1. **P0: protect core use.** Fix extension-caused broken composer/account controls, lost settings, unusable conversation text under supported defaults, crashes, or inability to restore native appearance. Do not defer these because the calendar ended.
2. **P1: remove setup and control friction.** Test preset/upload/skip, provider scope, pause, reset, persistence, and recovery. Improve only the steps observed to confuse people. Preserve existing design rules and accessibility requirements.
3. **P2: improve the immediate result.** Tune existing preset/effect defaults or explanatory copy when observation supports it. Add a preset only for a demonstrated gap; do not turn this into a wallpaper-library project.
4. **P3: enable safe feedback and communication.** Verify existing support links, the issue template, known issues, update instructions, and version visibility. Reuse existing infrastructure.

Use the prerelease checklist for exact-candidate types, unit/browser/accessibility checks, upgrade preservation, signed-in providers in light/dark themes, actual Chrome/Brave checks where claimed, keyboard/zoom/forced-colors/assistive-technology acceptance, and recovery. Record any remaining gaps; narrow public compatibility claims to tested coverage. The broader launch proceeds with documented minor issues, but holds for P0 failures or unmet required release checks. A hold targets the specific blocker; it does not restart a new month of polishing.

Defer accounts, cloud sync, subscriptions, AI image generation, public image hosting, marketplace, more providers, automatic sharing, and speculative UI redesigns. No new interface or wireframe is proposed by this strategy.

## Tester protocol and learning criteria

Use a 15–20 minute session. Ask the person to install, choose a look, open a supported chat with synthetic content, pause only that provider, reset effects, and return later. Time installation separately from first setup. Record where help was required. Do not request private chats or personal image exports.

Seven days after activation, ask: “Have you used it since setup? Is it still enabled? When did you last notice it? What made you pause/remove it? What would you miss?” Participation in follow-ups is voluntary.

Directional working criteria, not industry benchmarks or statistically reliable estimates:

- At least five people install and activate; report the count and provider mix honestly.
- At least four of the first five apply a bundled look within 60 seconds after installation, without product guidance; four can pause one provider and reset effects within ten seconds per task.
- Seek at least three of the first five reporting voluntary use after seven days. Report responses as X/5 activated and X/Y respondents, with nonrespondents unknown. Still-enabled alone is not continued use.
- Setup failures trigger onboarding fixes; readability/provider failures trigger compatibility work. Weak repeat use triggers a different message/audience test during the public beta, rather than automatic feature expansion.
- Do not indefinitely postpone promotion to reach an arbitrary retention percentage. Report weak results honestly and frame the launch as a learning beta, provided safety and release checks pass.

## Distribution and launch boundary

Initial route: the existing versioned GitHub release ZIP, clearly labeled **Developer Mode beta**. Explain download, unzip, Load unpacked, refresh supported tabs, and manual updating while preserving settings. Test those instructions with the exact artifact. Do not market a ZIP as one-click consumer installation.

Existing GitHub workflows check/build and prepare a draft prerelease; they do not authorize publication. The sibling Astro site resolves eligible published release assets at build time. Confirm the deployed download/version before each promotion; do not send users to a draft or stale ZIP. Publishing, deployment, store registration, and outreach remain future owner actions, not actions performed by this plan.

At Day 28, revisit store registration based on budget and tester experience, rather than waiting for 50 users. The store is the recommended eventual public installation path, but this plan does not require spending. If zero spending remains firm, launch the developer beta to technically comfortable audiences on Day 29 and state its limitations. A demo can reach nontechnical visitors, but watching it is not activation. Store review timing is external, so do not promise an approval date.

## Marketing plan: Day 29 through Week 8

Use organic distribution only. Budget roughly four hours a week initially: one hour creating two posts, one hour on launch/community conversations, one hour following up with consenting users, and one hour triaging/reporting. This is an adjustable maintenance budget, not a growth forecast. Reserve additional time for serious fixes. No ads, mass DMs, paid directories, or automated outreach.

| Channel | First experiment | Call to action and decision |
| --- | --- | --- |
| X, primary | Publish a 10–15 second before/after clip with a readable synthetic conversation. Follow with a concrete fix learned from testers. | “Try the free developer beta” while ZIP-only; record attributable activations through voluntary replies, not impressions. |
| GitHub, product/portfolio home | Put the demo, supported providers, honest install steps, limitations, release link, and issue link near the top. Pin the repository/profile project. | “Install the beta” and “Report a bug”; document real feedback-to-fix examples. |
| One relevant community at a time | Share the tested result in a community the owner participates in, such as a permitted side-project showcase. Verify its live posting rules first; the rules were not readable in this audit. | Disclose authorship and the installation hurdle. Answer questions; do not cross-post identical promotions. |
| Professional audience, secondary | Publish one short case study on the owner's existing professional profile or portfolio. | Link to the demo and engineering write-up; keep hiring visibility separate from end-user adoption. |
| Search, gradual | Refresh the existing three provider guides with accurate examples, supported versions, and the current installation path. | Useful installation answers first. Do not promise search rankings or immediate traffic. |

Execution cadence:

- **Week 5:** Publish the beta announcement and one tester-driven improvement post. Invite a second small cohort through voluntary replies. Keep GitHub issues available immediately.
- **Week 6:** Test a different story: a personal study/writing setup, compared with the first generic personalization demo. Hold the product/build steady where practical; record audience and install-path differences so results are not mistaken for a controlled A/B test.
- **Week 7:** Repeat the more promising story in one relevant community, after checking rules. Ask one willing user to share a synthetic setup or quote with explicit permission. Do not depend on a testimonial appearing.
- **Week 8:** Publish what changed, what people actually used, and what remains broken. Repeat the channel bringing continued users; stop adding channels if support is falling behind. Fifty users remains an aspiration, not a deadline or forecast.

Ready-to-adapt copy; replace the install-path sentence only when a real store link exists:

**Tester invitation:** “I’m rebuilding Chatalume, a free extension for personalizing ChatGPT, Claude, and Gemini. I’m looking for five people to try a wallpaper setup and tell me what gets in the way. It currently uses Developer Mode; I can help with installation. Interested in trying it?”

**Public beta post:** “Your AI chats can feel more like your workspace. Chatalume adds your own wallpaper or a bundled look to ChatGPT, Claude, and Gemini, with reading comfort and per-site controls. Free beta, local settings. Developer Mode installation for now. Demo + download: [verified release page]. Bugs and suggestions welcome on GitHub.”

**Learning post:** “A tester struggled with [observed problem]. I changed [specific behavior], then checked [actual result]. Here’s the before/after. Chatalume’s beta is open if you’d like to try it.” Never fill this with an invented result.

## Feedback loop and measurement

Maintain one private, lightweight cohort table: anonymous tester ID, channel (self-reported), provider/browser, candidate version, install assistance, activation day, task results, follow-up due/result, and linked sanitized issue. Keep contact details outside committed docs; collect only with consent, and delete contact notes after the beta follow-up or on request. No extension telemetry is proposed.

Downloads are not installs; installs are not activation; activation is not repeat use; GitHub stars and likes are not users. The website currently has no analytics. Channel attribution and usage reports will therefore be incomplete. Do not claim visitor conversion or total active users without an appropriate source. Use existing aggregate download/store reports where available plus opt-in responses; do not silently add tracking.

Check GitHub issues twice weekly and around announcements. Reuse `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`. Capture version, provider, browser, theme, expected/actual behavior, reproduction, and optional synthetic screenshot. Deduplicate; prioritize impact and reproducibility over votes. Ask one focused question when information is missing. After a fix, link the release and ask the reporter to retry. Treat a three-working-day initial-response goal as a personal target, not a support guarantee.

GitHub reporting takes effort and an account. Make it optional: accept feedback in replies to the owner's own launch posts and, with permission, convert it to a sanitized GitHub issue. Do not silently post private messages. Sparse issues do not establish satisfaction; continue voluntary follow-ups with a small sample of quiet users. Users can give feedback without being obliged to perform formal testing.

Weekly decisions: attention with no installations suggests message/trust/install friction; installation with no successful setup suggests onboarding friction; activation without repeat use suggests weak value or a distracting result. Distinguish these with user reports rather than guessing from download counts. If maintenance exceeds the available budget for two weeks, pause new promotion and focus on regressions and the existing cohort.

## Portfolio and monetization

Publish a concise case study: why the extension exists, provider adapter tradeoffs, local storage/privacy boundary, one difficult regression and its test, one observed usability change, honest cohort outcomes, and lessons. A synthetic demo and clear README make it inspectable; no recruiter outcome is guaranteed.

Keep the current core free. Add no billing now and make no promise about every future feature. Revisit optional support or paid extras only after repeat users request a specific benefit; seek explicit willingness to pay before implementing it. Donations are optional support, not forecast revenue. Never charge to repair bugs or restore readability.

## Open questions, assignment, and observations

Unresolved: exact Day 1, available weekly time, which browsers/providers testers use, live deployment/release status, and whether store registration becomes affordable. None requires inventing results or delaying preparation; the owner sets Day 1 when the candidate and five sessions are ready.

**Next build task:** finish only the scoped rebrand and tester handoff, then verify the candidate. **The assignment:** prepare the invitation and book the first five tester sessions, starting with the person who previously gave useful feedback if they volunteer. Ask their permission before quoting them publicly. This document authorizes no messages or publication.

What I noticed: “a portfolio project to gain experience” gives the work a useful outcome even before revenue. “Only one quick tester” is an honest evidence boundary; their feedback should not be described as adoption. The proposed one-month limit protects against endless polishing, provided seven-day follow-ups overlap the fix period.

## Sources and scope

External sources checked November 7, 2026:

- [Backdrop listing](https://chromewebstore.google.com/detail/backdrop-%E2%80%94-backgrounds-th/gpoelgjjpcplikjhldmhjedplbfmcgfj): competing feature claims, not independently tested quality or traction.
- [Tabliss](https://tabliss.io/): an example of free, open-source personalization; not a demand estimate for Chatalume.
- [Superpower pricing](https://spchatgpt.com/pricing/): a paid workflow-tool comparison, not proof of wallpaper willingness to pay.
- [Chrome distribution](https://developer.chrome.com/docs/extensions/how-to/distribute), [registration](https://developer.chrome.com/docs/webstore/register/), [publishing](https://developer.chrome.com/docs/webstore/publish): installation and review constraints. Registration requires a one-time fee; confirm the amount at registration before any spending.
- [GitHub issue templates](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/configuring-issue-templates-for-your-repository) and [profile customization](https://docs.github.com/en/account-and-profile/how-tos/profile-customization): existing presentation and reporting mechanisms.

This is a strategy and proposed backlog, not implementation, public outreach, a submitted listing, or a verified release. Independent cross-model opinion was not requested or run. The gstack cross-session store was not writable in this workspace; this repository document is the reviewable source.

<!-- gstack:office-hours:concerns:start -->
## Reviewer Concerns

Disposition: COMPLETED

Stop: PASS

No unresolved findings.
<!-- gstack:office-hours:concerns:end -->
