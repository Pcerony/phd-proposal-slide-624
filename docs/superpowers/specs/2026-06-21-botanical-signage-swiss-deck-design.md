# Botanical Signage Research Plan — Swiss Web Deck Design

## Goal

Create a single-file 16:9 HTML presentation for the five-minute bilingual research-plan speech. The deck follows `PPT结构内容编排.md`, uses `双语演讲稿_5分钟.md` for spoken emphasis, and treats `博士材料_611.md` as the factual authority.

## Deliverable

- Output: `植物园解说牌博士研究计划_瑞士风.html`
- Format: self-contained horizontal web deck based on `guizang-ppt-skill/assets/template-swiss.html`
- Navigation: keyboard arrows, mouse wheel, touch gestures, ESC overview, and `B` low-power mode
- Slide count: 10

## Visual System

- Style: Swiss International Style, locked mode
- Accent: Lemon Green (`#C5E803`) with black text on accent blocks
- Base: warm paper white, near-black ink, fixed neutral greys from the preset
- Typography: Inter / Helvetica / Noto Sans SC; English is the main display language, Chinese is limited to compact section labels
- Geometry: 12/16-column grid, hairline dividers, square corners, no gradients, shadows, or decorative rounded cards
- Visual assets: reuse `image001.png` on the research-design overview; use geometric paths, numbers, Lucide icons, and HTML labels elsewhere

## Narrative and Layout Map

| Slide | Content | Layout | Theme | Visual purpose |
| --- | --- | --- | --- | --- |
| 1 | Title | S01 Index Cover | hero dark + accent | Minimal opening and research identity |
| 2 | Problem in practice | S09 Dot Matrix Statement | light | Make “one sign vs. a whole path” the central visual argument |
| 3 | Theoretical gap | S04 Six Cells | dark | Three theories, two gaps, and the missing system level |
| 4 | Master's to PhD | S08 Duo Compare | light | Compare research unit, outcome, and method across stages |
| 5 | Research questions | S05 Three Layers | hero light | Present Q1–Q3 as mechanism → translation → validation |
| 6 | Research design overview | S22 Image Hero | dark | Feature the supplied three-phase diagram with Y1S1 / Y1S2 / Y2–3 anchors |
| 7 | Phase 1 and Phase 2 | S03 Split Statement | light | Two equal methodological tracks with methods and outputs |
| 8 | Phase 3 validation | S19 Four Cards | dark | Show toolkit, 60 participants, 2×2 design, and analysis |
| 9 | Expected contributions | S13 Three Forces | light | Theory, practice, and method as three coordinated outcomes |
| 10 | Closing / Q&A | S10 Split Closing | hero dark | Restate system + memory shift and close cleanly |

This uses ten registered layouts, exceeds the diversity requirement, and alternates light/dark themes without three consecutive slides of one theme.

## Content Rules

- English screen text remains short and easy to read at presentation distance.
- Chinese labels support orientation but are not duplicated paragraph translations.
- Use the full proposal title from `博士材料_611.md`, including the co-creation perspective.
- Preserve factual values: `+6.7 percentage points`, `35.1% AOI fixation` only where useful, `2 workshops`, `8–10 participants each`, `60 participants`, `2×2 within-subjects`, Latin square, NASA-TLX, and LMM.
- Do not invent statistics or claims to satisfy data-oriented layouts.
- The supplied Figure 1 is displayed with `object-fit: contain` so its text is not cropped.

## Animation

- One semantic animation recipe per slide: statement reveal, cell sequence, comparison split, layer build, image reveal, split entry, card sequence, force sequence, and closing split.
- All slides remain readable if Motion One or network fonts fail.
- The low-power toggle stops continuous and entrance animation.

## Verification

- Run `validate-swiss-deck.mjs` against the final HTML.
- Check every slide in a browser after animation settles.
- Verify text wrapping, minimum font sizes, image legibility, nav-safe bottom spacing, ESC overview visibility, and no forbidden gradients/shadows/radii.
- Test arrows, wheel, touch navigation, ESC overview, and `B` low-power mode.

