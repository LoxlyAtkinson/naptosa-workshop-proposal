# Independent visual review: network video scene

## Scope and blinding

I reviewed only `network-film-early.png`, `network-film-late.png`, and `network-film-reverse.png` against the user's request for Oryzo-like scroll-activated storytelling and the adaptation criteria in `bar.md`. I did not inspect implementation or earlier review reports. Because the filesystem is shared, this is procedural blinding; I cannot establish that I had no prior contextual exposure to the broader project.

## Verdict: FAIL, with a strong story premise and one visible composition defect

### Story progression — PASS

- `network-film-early.png` begins close on the work surface, laptop and hands. The concrete preparation detail provides a clear opening beat for a provincial working scene.
- `network-film-late.png` pulls back to show educators working together around the table. The wider view communicates the transition from individual preparation to a connected community, which is a relevant visual metaphor for the network chapter.
- The warm, documentary-looking school setting and the deep-blue copy treatment feel distinct from Oryzo's product world while still matching the proposal's own identity. The three frames read as one continuous scene rather than unrelated footage.

### Copy framing and scroll-state completeness — FAIL

- In `network-film-late.png`, the copy panel extends below the screenshot: the explanatory paragraph is cut at the bottom edge. The reverse capture, `network-film-reverse.png`, also shows text meeting or disappearing below the viewport edge. A reader can encounter a scroll position where the main description is not fully visible.
- `network-film-early.png` shows only the incoming video surface and no visible scene heading. That can work as an intentional entrance, but it makes the panel's clipped later state more consequential because the explanatory copy is not present throughout the sequence.

**Severity:** Major composition issue.

**Reader impact:** The story is understandable, but at the later captured state a reader may see an incomplete sentence and have to scroll without knowing the panel will resolve.

**Achievable fix:** Raise the panel and reserve a safe bottom margin within the visible stage. Reduce its vertical padding/type size at shorter viewports if needed. Recapture a mid/late state at 1440×900 and 390×844 and verify the whole heading and paragraph fit above the stage edge.

### Reverse-scroll evidence — INSUFFICIENT / FAIL

- `network-film-reverse.png` remains a wide view of the teacher group, and the screenshots alone do not clearly establish that the clip visibly rewound from the late state toward the earlier detail. The scene continuity is sound, but the reverse transition is not legible in this evidence set.

**Severity:** Moderate evidence gap.

**Reader impact:** The motion may work when scrolling back, but a reader or reviewer cannot confirm the requested reversible scroll storytelling from these images.

**Achievable fix:** Capture a reverse state that visibly returns to the close work-surface composition, with the clip settled at that state. A small side-by-side strip should demonstrate close → wide → close while retaining readable copy.

## Summary

The clip's visual metaphor and continuous scene are appropriate for the network chapter. The present captures show a clipped copy panel and do not clearly prove reverse progression, so this scene is not ready for a pass. This is an image-only judgment and does not assert whether the video playhead or browser code behaved correctly.