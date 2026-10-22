## Current Phase
Published and live-verified. Contract: [contract-and-section-map.md](contract-and-section-map.md). Official task list: active Codex goal `01a1615f-8b77-7ce2-b4a7-f33f38d4858e`.

## Completed Since Last Checkpoint
- Read official Scroll Craft and mandatory experience acceptance instructions.
- Read the designated Outcome Based Thinking lessons 27, 28 and 30; applied outcome-first, intent and post-action verification.
- Recorded the nine-step detailed checklist in the official Codex goal/task list.
- Generated the silent landscape and portrait hero video with Higgsfield and encoded a poster fallback.
- Built the chapter-story proposal with custom network and database diagrams, four distinct scroll devices, permanent right rail, and PDF link.
- Fixed mobile 360px overflow, the obscured highlighted R499 offer, and mobile/desktop PDF-button overlap.
- Replaced “no agreed price” wording with the original shared-Western-Cape-database assumption and explicit no-separate-storage-charge explanation.
- Added stylesheet cache-busting to the published page so the corrected in-flow PDF action is used after browser caching.
- Re-captured final desktop, mobile and reduced-motion scroll evidence after the stylesheet URL change; all suites completed without dead scroll.
- Published the cache-busted stylesheet link and verified the real GitHub Pages response loads `proposal.css?v=20261022-2`, computes the PDF action as in-flow (`position: relative`), and includes the original shared-data/no-separate-storage-charge explanation.
- Confirmed the live hero scrubs while scrolling, quotation navigation works, PDF and both video assets return HTTP 200, viewport width stays 1440px without overflow, and there are no console or failed-request errors.

## Files Created/Modified
- Page: `index.html`, `proposal.css`, `scrollcraft.js`, `scrollcraft.css`
- Media: `assets/hero.mp4`, `assets/hero-mobile.mp4`, `assets/hero-poster.webp`
- Portable Scroll Craft build, contract, brief, latest progress, screenshots, test scripts/results and source-review report: `scrollcraft/builds/naptosa-network/`
- Acceptance instructions and checker: `docs/standards/experience-acceptance.md`, `scripts/check-experience-acceptance.py`

## Architecture Decisions
- Distinct chapter scrollytelling grammar; silent Higgsfield hero is scrubbed by scroll and has separate mobile media.
- Reduced-motion visitors receive a static poster.
- Shared Western Cape data assumption appears visually before monthly costs; dedicated option clearly shows 9 new encrypted environments and the yellow R499 offer.
- The Western Cape website/workshop build and new monthly charges remain excluded; no supplier comparisons are in the proposal.

## Browser Testing Results
- Latest browser workflow at 1440×900 and 360×640 passed: render/no overflow, moving hero, quotation navigation, official PDF download, mobile rail/video and reduced-motion fallback. Zero browser console errors and failed requests. Details and route/state screenshots: `evidence/workflow-results.json`, `evidence/outcomes/`.
- Keyboard Enter navigation reaches `#network`, retains visible focus, announces the active location and shows the expected section heading: `evidence/keyboard-results.json`.
- Final source Scroll Craft captures passed at desktop 1440×900 (26 frames, no dead scroll, scrub video moves), mobile 390×844 (no dead scroll) and reduced motion (poster at every sampled state, no dead scroll). Contact sheets and reports: `evidence/final6-desktop/`, `final6-mobile-390/`, `final6-reduced-motion/`.
- Final live check at 1440×900 passed; live quotation screenshot confirms original prices remain visible and discounted offers are yellow. Evidence: `evidence/live-results.json`, `evidence/outcomes/live-quotation.png`.

## Errors / Fixes
- First mobile screenshots showed the nav rail hiding the R499 rate; grid min-content sizing from a no-wrap rate caused it. Fixed grid min-width and allowed the highlighted rate to wrap, then recaptured.
- Fixed PDF link initially covered page content. Moved it into document flow on desktop and mobile.
- First Scroll Craft desktop recapture timed out while three screenshot suites ran concurrently. Re-ran the final desktop suite serially; it passed all 26 positions.

## Current Risks
- TypeSafe Jev source review escalated with low confidence and no specific defect text; raw tool output is in `reviews/jev-source-review-2026-10-22.json`. It is source-only, not visual judgment.
- Independent visual acceptance remains BLOCKED. Two fresh Jev browser attempts did not produce a visual verdict: the live-site journey stopped at its 24-step cap with no criterion findings, and the screenshot-only attempt declared itself done before acting or inspecting the image. Procedural details are in `reviews/jev-visual-review-attempts-2026-10-22.json`; neither attempt is represented as a review.
- Headless Chrome cannot verify actual phone video decoder or touch behavior.

## Open Issues
- Obtain a fresh independent visual reviewer who can inspect the frozen final desktop/mobile/reduced-motion captures and author a verdict. The current tools did not provide that capability. Then repair any actionable findings, rerun affected browser journeys and capture new evidence; only the judge-authored report may be checked.

## Exact Next Steps
1. Obtain an independent reviewer with access to the frozen screenshots and live page, or resume in a platform that supports independent visual review.
2. Keep the current acceptance result BLOCKED; do not create a verdict on the judge's behalf. If a judge-authored report arrives, run `python scripts/check-experience-acceptance.py <judge-verdict.json>` against the current source hashes and continue the repair loop.

## Safe Recovery Instructions
Read `AGENTS.md`, `docs/standards/experience-acceptance.md`, `contract-and-section-map.md`, this file and `evidence/workflow-results.json`, then inspect `git status`. Do not regenerate Higgsfield media or repeat successful checks unless page sources change. The page implementation is ready; independent visual acceptance remains a separate required gate.

## Current Phase
Email and visual additions implemented and deployed. Independent visual acceptance remains BLOCKED under the required experience-acceptance method.

## Completed Since Last Checkpoint
- Generated and integrated three original NAPTOSA people-focused visuals into the network, workshop and training chapters; scroll parallax responds to scroll and image zoom is restrained, while reduced-motion removes transforms and transitions.
- Prepared a bullet-led email draft that guides NAPTOSA through all proposal chapters, identifies the first PDF button below the opening image, explains the changed monthly database assumptions, and itemizes website, workshop and combined-training savings.
- Verified image load, natural dimensions, descriptive alt text, no overflow at 1440px and 390px, scroll-linked parallax changes in normal motion, and static transforms in reduced-motion mode.
- Re-ran desktop, mobile, hero scrub, chapter navigation, PDF download, reduced-motion, and keyboard navigation workflows; all passed without console errors or failed requests.
- Inspected the final desktop, mobile and reduced-motion scroll-capture sheets after adding imagery.

## Files Created/Modified
- `index.html`, `proposal.css`, `.gitignore`
- `assets/teachers-together.webp`, `assets/teacher-workshop.webp`, `assets/teacher-community.webp`
- Portable build mirrors for HTML, CSS, all three WebPs, and `email-draft.md`
- Root `email-draft.md`
- `evidence/image-check.cjs`, updated browser workflow results and desktop/mobile outcome screenshots
- Final7 desktop/mobile/reduced-motion scroll-capture contact sheets and reports

## Architecture Decisions
- Use generated web-optimized images as chapter-specific editorial moments: network collaboration, workshop learning and educator community.
- Keep these visual moments interactive through subtle parallax and hover zoom, with transforms disabled for reduced-motion preferences.
- Send the reader to the interactive proposal first and explain the fixed right-side chapter rail and PDF button in ordinary language.
- Treat Western Cape as retained existing infrastructure; exclude it from the new monthly website and dedicated workshop database totals.

## Browser Testing Results
- `image-check.cjs`: PASS for all three loaded images, alt text, 1440px/390px widths, parallax transform change, and static reduced-motion transforms.
- `browser-workflow.cjs`: PASS for 1440px desktop, hero scrub, quotation chapter, PDF download, 360px mobile, reduced-motion poster; no console errors or failed requests.
- `keyboard-check.cjs`: PASS; Enter on Network reaches the Network chapter, retains focus and active location, and displays its heading.
- Scroll Craft final7 captures completed for desktop, 390px mobile and reduced motion. All sampled scroll positions settled; no dead scroll; reduced-motion uses poster. Contact sheets and raw reports are in `evidence/final7-*`.

## Errors / Fixes
- The first targeted image check read lazy-loaded images before scrolling them into view and therefore reported incomplete loads. The test was corrected to scroll each image into view and await `decode()`; all images then passed. No product defect was found.

## Current Risks
- Independent visual acceptance remains BLOCKED: previous review attempts produced no reviewer-authored verdict. The builder's contact-sheet inspection does not substitute for an independent judge.
- Live hosting still requires the external push step and subsequent public-route verification.

## Open Issues
- Obtain a fresh independent reviewer for current final evidence. Preserve the gate as BLOCKED until then.

## Exact Next Steps
1. Publish the reviewed page and verify the public route serves all three new image assets and updated page.
2. Hand off the email draft and deployed page link. Do not send the email.
3. Independent visual review remains the acceptance dependency.

## Safe Recovery Instructions
Read `AGENTS.md`, `docs/standards/experience-acceptance.md`, `contract-and-section-map.md`, this file, and the current git status. The proposal is implemented and browser-tested. Do not repeat successful checks without new source changes. Do not claim final acceptance while independent judgment remains blocked.

## Orchestrated review finding (before repair)
- Independent local inspection found workshop feature lists visually overlapping the next Workshop data chapter, and delivery/terms content overflowing its fixed-height chapter. Root cause: `data-sc-act="pan"` and `data-sc-span="1.4"` applied to whole long sections, whose act box remained about 1.4 viewport heights.
- Repair: keep both parent sections in natural flow and scope each `pan` act to its title + diagram only. Supporting lists and terms now extend the parent section normally. Scroll-specific CSS now targets the nested acts.
- Local browser proof: `experience-design/evidence/browser-acceptance.json` confirms no list items remain in view at data chapter entry, the workshop section ends where data begins, and delivery section height contains its terms through the acceptance chapter.
- Final8 Scroll Craft sweeps were rerun after the repair: 87 desktop, 87 mobile, and 87 reduced-motion samples; all settled, no dead scroll, reduced motion poster throughout.
