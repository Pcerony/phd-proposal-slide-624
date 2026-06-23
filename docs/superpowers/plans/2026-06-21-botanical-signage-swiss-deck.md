# Botanical Signage Swiss Web Deck Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and verify a 10-slide, lemon-green Swiss-style HTML deck for the five-minute botanical-signage doctoral research speech.

**Architecture:** Start from the official `template-swiss.html`, replace only its theme variables, title, and slide placeholder, and embed the supplied Figure 1 as a data URI so the deliverable is one HTML file. A Node structural test and the skill's Swiss validator enforce content, layout registration, forbidden-style, and placeholder requirements before browser QA.

**Tech Stack:** HTML5, CSS, JavaScript, guizang Swiss template, Motion One fallback, Lucide icons, Node.js validation, in-app browser QA.

---

### Task 1: Establish structural acceptance tests

**Files:**
- Create: `tests/validate_botanical_swiss_deck.mjs`
- Test target: `植物园解说牌博士研究计划_瑞士风.html`

- [ ] **Step 1: Write the failing test**

Create a Node test that requires the final HTML to exist; contain the Lemon Green theme; contain exactly ten slide sections; use S01, S09, S04, S08, S05, S22, S03, S19, S13, and S10 in order; embed `image001.png` as a data URI; include the full proposal title; include navigation/overview/low-power hooks; and contain no `[必填]`, `TODO`, gradients, box shadows, or non-zero border radii in slide markup.

```js
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(import.meta.dirname, '..');
const target = path.join(root, '植物园解说牌博士研究计划_瑞士风.html');
assert.ok(fs.existsSync(target), `missing ${path.basename(target)}`);
const html = fs.readFileSync(target, 'utf8');
const slides = [...html.matchAll(/<section\s+class="slide[^"]*"[^>]*data-layout="(S\d{2})"/g)];
assert.equal(slides.length, 10);
assert.deepEqual(slides.map((m) => m[1]), ['S01','S09','S04','S08','S05','S22','S03','S19','S13','S10']);
assert.match(html, /--accent:\s*#C5E803/i);
assert.match(html, /data:image\/png;base64,/);
assert.match(html, /Cognitive Mechanisms of Interpretive Signage Systems in Botanical Gardens from a Co-creation Perspective/);
assert.match(html, /low-power/);
assert.match(html, /overview/);
assert.doesNotMatch(html, /\[必填\]|TODO/);
console.log('PASS botanical Swiss deck structure (10 slides)');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/validate_botanical_swiss_deck.mjs`

Expected: exit 1 because `植物园解说牌博士研究计划_瑞士风.html` does not exist.

### Task 2: Build the single-file Swiss deck

**Files:**
- Create: `植物园解说牌博士研究计划_瑞士风.html`
- Read: `PPT结构内容编排.md`
- Read: `双语演讲稿_5分钟.md`
- Read: `博士材料_611.md`
- Embed: `image001.png`

- [ ] **Step 1: Copy the official template**

Run: `cp /Users/heisei/.codex/skills/guizang-ppt-skill/assets/template-swiss.html 植物园解说牌博士研究计划_瑞士风.html`

- [ ] **Step 2: Apply Lemon Green theme and metadata**

Replace the theme variables with the exact Lemon Green preset: paper `#fafaf8`, ink `#0a0a0a`, greys `#f0f0ee/#d4d4d2/#737373`, accent `#C5E803`, accent-on `#0a0a0a`; set the browser title to the full research title.

- [ ] **Step 3: Insert the ten approved slides**

Insert registered slide markup in this exact order: S01 title; S09 practice problem; S04 theoretical gap; S08 master's-to-PhD; S05 research questions; S22 research-design overview; S03 Phase 1/2 split; S19 Phase 3; S13 contributions; S10 closing. Use English as the main presentation language and Chinese only for compact orientation labels.

- [ ] **Step 4: Embed the supplied figure**

Convert `image001.png` to a `data:image/png;base64,...` URI and place it in the S22 image slot with `object-fit:contain` and a meaningful alt description.

- [ ] **Step 5: Run structural test to verify it passes**

Run: `node tests/validate_botanical_swiss_deck.mjs`

Expected: `PASS botanical Swiss deck structure (10 slides)` and exit 0.

### Task 3: Validate Swiss locked-mode compliance

**Files:**
- Verify: `植物园解说牌博士研究计划_瑞士风.html`

- [ ] **Step 1: Run the official validator**

Run: `node /Users/heisei/.codex/skills/guizang-ppt-skill/scripts/validate-swiss-deck.mjs 植物园解说牌博士研究计划_瑞士风.html`

Expected: zero errors for missing `data-layout`, unregistered layouts, SVG text, image slots, or title alignment.

- [ ] **Step 2: Run static content checks**

Run: `rg -n '\[必填\]|TODO|P23|P24|linear-gradient|box-shadow|border-radius:[^0]' 植物园解说牌博士研究计划_瑞士风.html`

Expected: no matches in authored slide markup; template infrastructure exceptions, if any, must be reviewed and not introduced by the deck.

### Task 4: Browser visual and interaction QA

**Files:**
- Verify: `植物园解说牌博士研究计划_瑞士风.html`

- [ ] **Step 1: Open the local HTML and inspect all slides**

Check each slide after its entrance animation settles for title wrapping, readable body text, Figure 1 legibility, grid alignment, nav-safe bottom spacing, and consistent Lemon Green usage.

- [ ] **Step 2: Test navigation and modes**

Verify ArrowRight/ArrowLeft, wheel navigation, ESC overview, overview exit, and `B` low-power mode.

- [ ] **Step 3: Capture and inspect a contact sheet or representative screenshots**

Review the cover, dense theory page, Figure 1 page, Phase 3 page, and closing page at full resolution. Fix any clipping or unintended overlap, then rerun Tasks 2–3 verification commands.
