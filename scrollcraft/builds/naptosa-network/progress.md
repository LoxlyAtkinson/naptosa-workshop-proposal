## Current Phase
Publish the verified build, then check the live GitHub Pages route. Contract: [contract-and-section-map.md](contract-and-section-map.md). Official task list: active Codex goal `01a1615f-8b77-7ce2-b4a7-f33f38d4858e`.

## Completed Since Last Checkpoint
- Read official Scroll Craft and the mandatory experience-acceptance method.
- Read the user-designated Outcome Based Thinking lessons 27, 28, and 30. Applied outcome-first planning, intent-matching, and post-action checks.
- Created the requested detailed nine-item checklist in the official Codex goal/task feature.
- Generated a silent hero video through Higgsfield, plus portrait version and poster.
- Built the chapter-based visual proposal, custom network/data diagrams, four scroll-device families, persistent chapter rail, PDF link, and reduced-motion path.
- Repaired the initial 360px overflow and mobile overlay defects. Phone evidence now shows the complete yellow R499 offer and text without the fixed PDF button covering it.

## Files Created/Modified
- Public page: `index.html`, `proposal.css`, `scrollcraft.js`, `scrollcraft.css`
- Final media: `assets/hero.mp4`, `assets/hero-mobile.mp4`, `assets/hero-poster.webp`
- Portable build package: `scrollcraft/builds/naptosa-network/` (brief, contract, sources, media, progress, screenshots, browser scripts/results, source review report)
- Acceptance method and checker: `docs/standards/experience-acceptance.md`, `scripts/check-experience-acceptance.py`
- Registry and ignores: `scrollcraft/FINGERPRINTS.md`, `.gitignore`

## Architecture Decisions
- Editorial proposal told through distinct chapters, not one unbroken camera flight.
- Silent Higgsfield clip is scrubbed by scroll; portrait video is selected on mobile; reduced-motion visitors see a static poster.
- Shared Western Cape data assumption is diagrammed beside the new separated-environment model before monthly charges.
- Western Cape existing website/workshop build and monthly services remain outside new totals; preserve current domain and route the new subdomain to that site.
- No third-party quote comparisons appear in the proposal.

## Browser Testing Results
- Final source Scroll Craft 1440×900: 26 frames, no dead scroll; video advanced as the hero entered view.
- Final source Scroll Craft 390×844: no dead scroll; complete mobile screenshots inspected, including the dedicated data offer.
- Final source reduced-motion: 26 frames use the poster; no dead scroll.
- Latest Playwright workflow (`evidence/workflow-results.json`): desktop width 1440/1440 PASS; video scrub 0.00s→2.52s PASS; chapter rail to quotation PASS with `aria-current=location`; PDF filename/download PASS; 360px viewport/doc width both 360, rail/video visible PASS; reduced motion uses poster/no video source PASS; zero console errors and failed requests.
- Keyboard: visible focus then Enter reaches `#network`, retains focus, marks active location, and exposes the expected heading. Script/result under `evidence/keyboard-check.cjs` and `keyboard-results.json`.
- Final contact sheets are in `evidence/final3-desktop`, `final3-mobile-390`, and `final3-reduced-motion`; individual hero/data/acceptance frames are retained locally.

## Errors / Fixes
- Desktop harness was initially clean while mobile content was hidden under the nav and download controls. Reviewed actual mobile pixels, constrained grid items, allowed the highlighted rate to wrap, preserved reserved rail space, and placed the PDF link back into content flow on mobile. Re-ran the complete desktop/mobile/reduced-motion capture and the Playwright workflow afterward.
- Initial browser test sampled `aria-current` too early during smooth scroll; the settled repeat and keyboard path confirm the active state.

## Current Risks
- TypeSafe Jev 1.13 source review returned `escalate` due low confidence; it supplied no concrete issue. Raw result is retained in `reviews/jev-source-review-2026-10-22.json`. It cannot inspect rendered images.
- Required fresh independent visual judgment has not been obtained. Per acceptance method, this gate is BLOCKED; do not mark experience acceptance complete or run the checker with a self-authored verdict.
- Headless Chrome does not verify physical iOS/Android video decoding/touch behavior.

## Open Issues
- Push the authorized build and verify the live URL and public PDF.
- Visual independent reviewer remains outstanding; a source review is not a substitute.

## Exact Next Steps
1. Confirm all test sessions ended and inspect git status; stage only page, final media, portable brief/contract/progress, checker, and final evidence; never stage `.claude/` or raw generated source frames.
2. Commit and push the site to the existing GitHub Pages branch.
3. Verify live HTML, encoded media, and PDF with a browser and HTTP responses; record timestamps/route.
4. Update progress with commit and live evidence. Leave acceptance in BLOCKED until a fresh independent visual reviewer assesses final evidence and writes their own report.

## Safe Recovery Instructions
Read `AGENTS.md`, `docs/standards/experience-acceptance.md`, `contract-and-section-map.md`, this file, and `evidence/workflow-results.json`; inspect `git status` first. Do not regenerate Higgsfield assets or repeat successful capture runs unless page sources change. The task remains active until live publication is verified; independent visual acceptance is a separate blocked gate.
