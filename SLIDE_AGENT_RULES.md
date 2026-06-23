# Slide Agent Rules

This repository maintains the 5-minute PhD proposal web slide deck.

## Canonical Files

- `index.html` is the canonical editable deck and the GitHub Pages entrypoint.
- `博士研究计划_5分钟演讲用_瑞士风_柠檬绿.html` is a local compatibility mirror.
- `博士研究计划_5分钟演讲用_瑞士风_柠檬黄.html` is also kept as a compatibility mirror, but its actual theme is lemon green.
- When changing the deck, edit `index.html` first, then sync both mirror files from `index.html`.

Sync command:

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

## Language Rules

- All reader-facing slide content must be English + Japanese.
- English should be the primary presentation line.
- Japanese should appear directly near the corresponding English content, not collected only in speaker notes.
- If an agent adds or rewrites any English body text, it must add or update the Japanese equivalent in the same edit.

## Layout Rules

- Keep every slide in the registered Swiss layout family with `data-layout="Sxx"`.
- SVG is for geometry only. Do not put visible text inside SVG `<text>` elements.
- Labels for diagrams must be normal HTML text positioned in cards, captions, or grid cells.
- Keep the bottom navigation safe area clear. Content should not extend into the bottom 7 percent of the viewport.
- Avoid large empty lower halves. If a page has too much white space, add a diagram, process band, comparison row, or reduce the top media height.

## Method Section Rules

The method section must stay explanatory, not just stacked text cards.

- Method 01 should explain the input-to-model logic.
- Method 02 should show how co-creation translates the model into design variables.
- Method 03 should show the validation sequence from setup to analysis.
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
- If multiple agents are working, each agent should record proposed changes in `docs/agent_notes/`; the integrator is responsible for applying changes to `index.html`, syncing mirror files, validating, and committing.

## Required Validation

Run these checks before committing:

```bash
node /Users/heisei/.codex/skills/guizang-ppt-skill/scripts/validate-swiss-deck.mjs index.html
```

Then verify in a browser at 1280x720:

- all 10 slides render;
- no text overflows or enters the bottom navigation area;
- all English body text has nearby Japanese;
- method slides include real diagrams;
- images under `images/` load correctly.

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
