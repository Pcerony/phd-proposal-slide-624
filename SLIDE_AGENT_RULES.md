# Slide Agent Rules

This repository maintains the 5-minute PhD proposal web slide deck.

## Canonical Files

- `index.html` is the canonical editable deck and the GitHub Pages entrypoint.
- `博士研究计划_5分钟演讲用_瑞士风_柠檬绿.html` is a legacy local compatibility mirror.
- `博士研究计划_5分钟演讲用_瑞士风_柠檬黄.html` is also a legacy compatibility mirror, but its actual theme is lemon green.
- When changing the deck, edit and validate `index.html` only. Do not sync mirror HTML files unless the user explicitly asks for mirror updates.

Optional mirror sync command, only after explicit user request:

```bash
cp index.html '博士研究计划_5分钟演讲用_瑞士风_柠檬绿.html'
cp index.html '博士研究计划_5分钟演讲用_瑞士风_柠檬黄.html'
```

## Visual Direction

- Style: Swiss international style.
- Accent color: lemon green `#C5E803`.
- Use only one accent color across the deck.
- Use straight rectangular blocks, hairline dividers, clear grid alignment, and high contrast.
- Use Lucide icons where possible.
- Do not add emoji, rounded cards, shadows, decorative gradients, or unrelated ornaments.
- For any future slide layout, composition, spacing, or visual redesign work, call and follow `guizang-ppt-skill` before editing.

## Text Color And Readability Rules

- Light backgrounds (`--paper`, grey cards, lemon-green accent blocks) must use black or dark-grey text.
- Never place white text on lemon green or other light backgrounds.
- Do not use raw lemon green as body text on light backgrounds. Use `--accent-text` for readable highlighted text, and keep raw `--accent` for fills, rules, icons, bars, and geometry.
- Primary text uses `--text-primary`; body/supporting text uses `--text-secondary`; auxiliary labels use `--text-helper`.
- Dark backgrounds use light text, but accent cards inside dark slides must switch back to dark text.
- If an agent changes colors, it must verify both computed contrast and actual screenshots in a browser.

## Language Rules

- All reader-facing slide content must be English + Japanese.
- English should be the primary presentation line.
- Japanese should appear directly near the corresponding English content, not collected only in speaker notes.
- If an agent adds or rewrites any English body text, it must add or update the Japanese equivalent in the same edit.

## Layout Rules

- Keep every slide in the registered Swiss layout family with `data-layout="Sxx"`.
- Mobile-phone layout support is permanently out of scope. The deck is designed for desktop browsers, presentation displays, and landscape tablet-like viewports only.
- Do not spend implementation or review time fixing phone-specific layout issues, stacking behavior, touch ergonomics, or portrait-phone screenshots unless the user explicitly reverses this rule in writing.
- Responsive work should focus on mainstream presentation sizes: 13-inch laptop, 16:9 projector, 16:10 laptop, wide desktop, and reasonable landscape tablet widths.
- SVG is for geometry only. Do not put visible text inside SVG `<text>` elements.
- Labels for diagrams must be normal HTML text positioned in cards, captions, or grid cells.
- Keep the bottom navigation safe area clear. Content should not extend into the bottom 7 percent of the viewport.
- Avoid large empty lower halves. If a page has too much white space, add a diagram, process band, comparison row, or reduce the top media height.

## Deck Structure Rules

- The main deck has 18 pages: slides 01-17 plus the Appendix Entry slide.
- Q&A slides are a separate appendix deck with `data-appendix="qa"` and their own `Q&A 01 / 10` page count.
- Do not include Q&A appendix pages in the main page total, main navigation dots, or main slide overview.
- The Appendix Entry page must keep clickable question cards that call `goAppendix(n)` for direct jumps.
- ESC overview must keep both modes: Main Deck and Q&A Deck.

## Method Section Rules

The method section must stay explanatory, not just stacked text cards.

- Method 01 should explain variable selection with concrete sources, candidates, criteria, and decisions. Do not use pseudo-equations unless the model is genuinely mathematical.
- Method 02 should show how co-creation translates Module A into Module B: design-principle hypotheses.
- Method 03 should show how Module B is validated and filtered into Module C: validated principles.
- Each method slide must contain a visible process diagram, matrix, route, or structural graphic.

## File Ownership For Multi-Agent Work

Use this split when running multiple agents:

- Agent A: language consistency and English/Japanese wording.
- Agent B: slide layout, spacing, and visual hierarchy.
- Agent C: method diagrams and research-logic accuracy.
- Agent D: validation, screenshots, local Git hygiene, and deployment only when explicitly requested.

Only one agent should edit `index.html` at a time. If parallel work is needed, each agent should write a patch note or proposed section in `docs/agent_notes/`, then one integrator applies the final HTML changes.

## Git Workflow

- Keep the repository clean and commit meaningful local checkpoints.
- Do not push to GitHub after every edit.
- Do not update GitHub Pages unless the user explicitly asks to publish, push, deploy, or sync to GitHub.
- Prefer small commits with focused messages, for example `Refine method diagram layout` or `Update bilingual wording`.
- Before starting a new edit session, run `git status -sb` and understand whether there are uncommitted user changes.
- If multiple agents are working, each agent should record proposed changes in `docs/agent_notes/`; the integrator is responsible for applying changes to `index.html`, validating, and committing. Mirror files stay untouched unless explicitly requested.

## Required Validation

Run these checks before committing:

```bash
node /Users/heisei/.codex/skills/guizang-ppt-skill/scripts/validate-swiss-deck.mjs index.html
node tests/validate_botanical_swiss_deck.mjs
node tests/readability_audit.mjs
node tests/color_hierarchy_audit.mjs
```

`tests/readability_audit.mjs` opens the deck in real Chromium at 1280x720, forces a static final state, captures all slides to `output/readability-qa/`, and fails on low-contrast text.

Then manually inspect the generated screenshots, especially:

- all 28 physical slides render: 18 main slides and 10 Q&A appendix slides;
- no text overflows or enters the bottom navigation area;
- desktop, projector, wide desktop, and landscape tablet views remain readable;
- phone portrait layouts are not an acceptance criterion and should not block completion;
- all English body text has nearby Japanese;
- method slides include real diagrams;
- images under `images/` load correctly.
- no white text appears on light backgrounds;
- less important text is grey, but still readable.

## Deployment

GitHub Pages publishes from the repository root on the default branch. Deployment is manual and should happen only after an explicit user request.

Publish command:

```bash
git push
```

The public page should load from:

```text
https://pcerony.github.io/phd-proposal-slide-624/
```

Repository:

```text
https://github.com/Pcerony/phd-proposal-slide-624
```
