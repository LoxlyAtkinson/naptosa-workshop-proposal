# Design Loop contract: NAPTOSA proposal experience

## Goal
Rework the public proposal page into a clear, cinematic, scroll-led story that helps NAPTOSA management understand the national/provincial website network, workshop module, data separation, pricing, savings, delivery and next step.

## Audience and user outcome
- Audience: NAPTOSA management; user says the audience prefers visual learning and scanning.
- Outcome: a reader can follow the proposal from the opening promise through the offer, understand the key figures and data model, navigate every chapter, and reach the PDF / acceptance action.

## Preserved features and facts
- Current NAPTOSA identity and proposal facts, pricing, savings, terms, PDF download and email draft link remain accurate.
- Preserve the existing scroll-driven hero price reveal and permanent right-side chapter navigation.
- Preserve accessible semantic text, mobile operation, reduced-motion behavior, and the user's instruction not to copy Oryzo's brand, color scheme, typography, copy or exact compositions.
- Western Cape exclusions and existing-domain/subdomain routing remain accurately represented as in the accepted project brief.

## Authorized change list
1. Improve page-level storytelling and chapter-to-chapter transitions using the actual Design Loop and Scroll Craft methods.
2. Improve visual composition, contrast, and visual explanation of important data/pricing.
3. Add or refine motion and interaction that clarify the offer, while retaining user control and accessible reduced-motion behavior.
4. Generate or adapt original NAPTOSA-appropriate visual assets; do not use Oryzo assets.
5. Verify desktop, mobile, keyboard, reduced-motion and published browser states; record evidence and independent findings.

## Frozen acceptance criteria for the Higgsfield video integration
C1 The Network chapter uses an original Higgsfield-generated, silent, high-quality documentary clip with no readable AI-generated text or logos.
C2 Scrolling advances the clip from preparation detail to educators collaborating; reversing the scroll returns to an earlier frame.
C3 Desktop uses the 16:9 master and mobile uses a 9:16 reframe of the same scene; the video and matching first-frame poster remain composed for the viewport.
C4 Network-scene copy remains readable with sufficient contrast and is fully visible at desktop and phone sizes, without colliding with the right-side navigation.
C5 Reduced-motion mode removes video playback/loading and displays the matching static poster with readable text.
C6 All ten chapter links remain visible on desktop and each reports the active destination; the proposal PDF remains reachable; browser console/page errors remain empty; no document-level horizontal overflow occurs at tested viewport sizes.

## Entry route and supported states
- Public route: https://loxlyatkinson.github.io/naptosa-workshop-proposal/
- Public unauthenticated proposal reader; no role-specific states.
- Viewports: desktop 1440×900, mobile 390×844, compact 360×640 and 320px reflow.
- States: initial page, all ten chapter positions, PDF download action, navigation open/closed on mobile, keyboard focus, reduced motion.

## Section map / narrative position
Use the ten existing chapters as required coverage: Overview (set the outcome); Network (national and provincial relationship); Scope (website build); Workshop (module build); Data (shared assumption vs isolated storage); Accreditation (AI discovery infrastructure); Monthly (hosting and data costs); Training (combined training offer); Delivery (timing/payment/terms); Accept (decision and next action). Map every current control and link during implementation; do not silently remove existing content.

## Implementation status
Design Loop phases 1–3 only. No proposal-page implementation has started in this run. Phase 4 begins after the user has seen the reference bar and the reference/rendering blind spots are resolved or explicitly recorded.
