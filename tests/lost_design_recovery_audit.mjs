import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(import.meta.dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

const cssRuleFor = (selector) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = html.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
  assert.ok(match, `missing CSS rule for ${selector}`);
  return match[1];
};

const cssRulesContaining = (selector) => [...html.matchAll(/([^{}]+)\{([^}]*)\}/g)]
  .filter((match) => match[1].split(',').map((part) => part.trim()).includes(selector))
  .map((match) => match[2]);

const assertNoBorderTop = (selector) => {
  for (const body of cssRulesContaining(selector)) {
    assert.doesNotMatch(body, /\bborder-top(?:-[a-z]+)?\s*:/, `${selector} must not use a top decorative border`);
  }
};

assertNoBorderTop('.frame-img.swiss-lined');
assertNoBorderTop('.principle-output');
assertNoBorderTop('.method03-hypothesis');
assertNoBorderTop('.method03-output');
assertNoBorderTop('.method03-output-note');
assertNoBorderTop('.slide.dark .phase-mini');
assertNoBorderTop('.route-map-panel,.fatigue-panel');
assertNoBorderTop('.route-map-panel');
assertNoBorderTop('.fatigue-step');
assertNoBorderTop('.rq-stat-panel');
assertNoBorderTop('.rq-question-panel');

const sectionFor = (needle) => {
  const at = html.indexOf(needle);
  assert.notEqual(at, -1, `missing section marker: ${needle}`);
  const start = html.lastIndexOf('<section', at);
  const end = html.indexOf('<section class="slide', at);
  return html.slice(start, end === -1 ? html.length : end);
};

const signageObjectSlide = sectionFor('Research Object · 研究対象');
assert.match(cssRuleFor('.photo-screen-filter'), /mix-blend-mode:\s*screen/, 'screen overlay class must restore the lemon-green filter');
assert.match(signageObjectSlide, /photo-screen-filter/, 'signage object photos must restore the lemon-green screen overlay');
assert.match(signageObjectSlide, /data-lucide="signpost"/, 'signage object photos must restore the signpost HUD icon');
assert.match(signageObjectSlide, /PLANT LABEL/, 'main signage photo must use a right-side vertical label');
assert.match(signageObjectSlide, /IN-SITU LABEL/, 'detail signage photo must use a right-side vertical label');
assert.match(signageObjectSlide, /GARDEN INFORMATION BOARD/, 'garden board photo must use a right-side vertical label');
assert.doesNotMatch(signageObjectSlide, /<figcaption[^>]*class="t-meta"/, 'signage object photos must not fall back to bottom captions');

const signageEnvironmentSlide = sectionFor('Signage Environment · 解説環境');
assert.match(signageEnvironmentSlide, /photo-screen-filter/, 'signage environment photo must restore the lemon-green screen overlay');
assert.match(signageEnvironmentSlide, /data-lucide="signpost"/, 'signage environment photo must restore the signpost HUD icon');
assert.match(signageEnvironmentSlide, /TSUKUBA BOTANICAL GARDEN/, 'signage environment photo must use a vertical source label');
assert.doesNotMatch(signageEnvironmentSlide, /<figcaption[^>]*class="source-caption"/, 'signage environment photo must not fall back to bottom source captions');

console.log('PASS lost design recovery audit');
