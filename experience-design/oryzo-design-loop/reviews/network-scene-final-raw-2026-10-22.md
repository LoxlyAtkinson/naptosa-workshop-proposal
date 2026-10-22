# Independent Network-scene review — raw verdict

**Overall verdict: UNVERIFIED (below PASS).** The captured scene has strong visual readability and demonstrates forward/reverse progression, but the supplied evidence cannot verify Higgsfield provenance/silent playback or the specified 16:9/9:16 source reframes. A 4px internal Network overflow is also measured at compact widths.

This is an independent, evidence-only review of the frozen C1–C6 criteria. I reviewed only the frozen contract, `browser-test.json`, and the seven final screenshots listed below. I did not inspect source contents or previous review reports. Hashes for the changed source files are recorded as identifiers only.

## Criteria verdict

| Criterion | Verdict | Evidence and reason |
|---|---|---|
| C1 — original, silent Higgsfield documentary video; no readable generated text/logos | **UNVERIFIED** | The screenshots show a plausible documentary scene and no readable text/logos. Pixels cannot establish Higgsfield origin or audio track silence; the browser measurements do not report audio state. |
| C2 — scroll advances preparation to collaboration and reverse returns earlier | **PASS** | Desktop media time increases from 0.839930s to 5.214646s, then decreases to 2.689118s. The early capture shows laptop and documents; late shows educators collaborating; reverse returns to the laptop-focused frame. Mobile time likewise advances 1.190289s → 6.248870s and reverses to 2.009426s; its reverse capture returns to laptop preparation. |
| C3 — desktop 16:9 master and mobile 9:16 reframe of same scene, composed for viewport | **UNVERIFIED** | Captures show a wide desktop composition and a portrait mobile crop of the same laptop-to-collaboration scene. The evidence records mobile film width (325px) but not the actual video element/source dimensions or source aspect ratios. Cannot verify 16:9 and 9:16 exactly. |
| C4 — copy legible, contrasting, fully visible, clear of navigation | **PASS** | All desktop and 390×844 mobile screenshots show the navy copy panel with white body/headline text and yellow kicker/edge. Text is fully inside its panel. The mobile menu control remains in a separate right gutter and does not overlap the lower-left copy. |
| C5 — reduced motion removes video loading/playback and shows matching static poster with readable copy | **PASS** | `browser-test.json` reports video `display:none`, empty `src`, and `posterVisible:"1"`; `network-film-reduced.png` shows the static laptop/document scene with all copy visible and menu clear. |
| C6 — ten chapter links visible/current; PDF reachable; no browser errors; no document-level horizontal overflow | **PASS** | `network-film-early.png` shows all ten chapter links, with Network highlighted. Browser evidence lists all ten destinations with `aria-current`/location state, PDF status 200, and `errors:[]`. Document scroll width equals client width at 1440, 390, 360, and 320px. |

## Actionable findings

- **P2 — Compact Network region reports 4px internal horizontal overflow.** `browser-test.json` reports 291px scroll width versus 287px client width at 360px, and 251px versus 247px at 320px. The document itself does not overflow; the evidence does not contain screenshots at those two widths, so visible clipping is unverified. Remove the extra 4px or add narrow-width captures proving all meaningful content remains visible.
- **P1 — Provenance and audio state are not evidenced.** Provide a trustworthy Higgsfield generation receipt/asset provenance and a browser/audio-track check showing the clip is silent. Do not infer these properties from the stills.
- **P1 — Exact source aspect ratios are not evidenced.** Record the rendered/source video dimensions for desktop and mobile (or a direct browser measurement proving 16:9 and 9:16), then inspect the subject-safe crop at both viewport classes.

## Frame-by-frame notes

- `network-film-early.png` (1440×900): laptop and documents establish preparation. Collaboration is not visible yet, which makes the later reveal legible as a progression. Copy is fully visible and separated from the right-side navigation.
- `network-film-late.png` (1440×900): smiling educator and colleague at a laptop give a clear human payoff to “One NAPTOSA community.” The full copy panel remains visible.
- `network-film-reverse.png` (1440×900): the composition returns to laptop/document preparation; media time is lower than the late capture, supporting genuine reverse scrubbing.
- `network-film-mobile-early.png` (390×844): portrait crop shows laptop and papers; educator is not yet clearly visible, matching the early preparation beat. Copy fits at the bottom with a visible margin; menu control is separated at right.
- `network-film-mobile-late.png` (390×844): educator and colleague are visible on the right side; mobile copy remains fully visible and readable.
- `network-film-mobile-reverse.png` (390×844): returns to laptop preparation and retains copy and menu separation.
- `network-film-reduced.png` (390×844): static poster reproduces the preparation scene. The copy remains readable and is not obscured by navigation.

## Evidence and bindings

- Contract: `contract-and-section-map.md`, SHA-256 `27A736F10323BB862AF1313FD8231DB9D6E256CAF11939383F985A29842E9C5B`.
- Browser measurement: `evidence/browser-test.json`, SHA-256 `58A6955B749B8F2D6001323FAFE7BB8BBE6E56A587042F6EC96D764A9C8ECA88`, file timestamp 2026-10-22 18:10:53.9697 +02:00.
- Changed source identifiers (hashes only; source contents not inspected):
  - `index.html` — `F8D63137759DF03661E0AC8CF260344B7CE4177F58CF3DF5702F7C3FEB474D8A`
  - `proposal.css` — `B29BC38C3F122F9199D3FBD4954469EE8F1AD680284869938E5B962218B1FD76`
- Media asset identifiers:
  - `assets/teacher-collaboration.mp4` — `F7BFDB0734481AEB21447EAD0B7722917F2995BAE6D45D53A9C8511A18D7597B`
  - `assets/teacher-collaboration-mobile.mp4` — `DD228F58F708977A1A736308B421BC4D1CBDBBE22E10873EC2C028EA5C4C4CB2`
  - `assets/teacher-collaboration-poster.webp` — `5555D500C1ABE916E2CE1070269BE71D12B1BE3EBAC71D5204545817DB320471`
  - `assets/teacher-collaboration-mobile-poster.webp` — `9F3C213E38FC7D8A3F71AC8C1F82ED1690B0E148E74B30DC03038EEBAFD07332`

| Screenshot | Capture state | Viewport | Media time | File timestamp (+02:00) |
|---|---|---:|---:|---|
| `network-film-early.png` | Network, desktop forward early | 1440×900 | 0.839930s / 8.041667s | 18:10:11.8092 |
| `network-film-late.png` | Network, desktop forward late | 1440×900 | 5.214646s / 8.041667s | 18:10:14.3004 |
| `network-film-reverse.png` | Network, desktop reverse | 1440×900 | 2.689118s / 8.041667s | 18:10:16.7040 |
| `network-film-mobile-early.png` | Network, mobile forward early | 390×844 | 1.190289s / 8.041667s | 18:10:27.2537 |
| `network-film-mobile-late.png` | Network, mobile forward late | 390×844 | 6.248870s / 8.041667s | 18:10:28.9812 |
| `network-film-mobile-reverse.png` | Network, mobile reverse | 390×844 | 2.009426s / 8.041667s | 18:10:30.6575 |
| `network-film-reduced.png` | Network, reduced-motion poster | 390×844 | static; video hidden | 18:10:52.3168 |

The contract route is `https://loxlyatkinson.github.io/naptosa-workshop-proposal/`. The browser measurements identify the active media source as a local `127.0.0.1:4173` blob URL; screenshot files do not embed a browser address bar, so the route mapping comes from the frozen test context rather than pixels.
