import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(import.meta.dirname, '..');
const target = path.join(root, 'index.html');
const html = fs.readFileSync(target, 'utf8');

const sections = [...html.matchAll(/<section\s+class="([^"]*\bslide\b[^"]*)"([^>]*)>([\s\S]*?)(?=<section\s+class="[^"]*\bslide\b|<\/div>\s*<script>|\n<\/div>\s*\n<script>)/g)]
  .map((match, index) => ({
    index: index + 1,
    className: match[1],
    attrs: match[2],
    body: match[3],
  }));

assert.equal(sections.length, 27, 'animation audit must see all 27 registered physical slides');

const recipes = new Set(
  [...html.matchAll(/'([^']+)':\s*r[A-Z][A-Za-z0-9]+/g)].map((match) => match[1]),
);

for (const section of sections) {
  const label =
    section.body.match(/<div class="l">([^<]+)/)?.[1]?.trim() ||
    section.body.match(/<h2[^>]*>([^<]+)/)?.[1]?.trim() ||
    `slide ${section.index}`;
  const recipe = section.attrs.match(/data-animate="([^"]+)"/)?.[1];
  assert.ok(recipe, `${label} must declare a data-animate recipe`);
  assert.ok(recipes.has(recipe), `${label} uses unregistered animation recipe: ${recipe}`);

  const animCount = (section.body.match(/\sdata-anim="/g) || []).length;
  assert.ok(animCount >= 2, `${label} must expose at least two data-anim anchors, found ${animCount}`);
}

for (const requiredRecipe of ['duo-mirror', 'contribution-grid', 'qa-answer']) {
  assert.ok(recipes.has(requiredRecipe), `missing registered recipe: ${requiredRecipe}`);
}

assert.match(html, /\.qa-point:hover,\s*\.qa-point:focus-within/, 'Q&A point cards need a hover/focus interaction');
assert.match(html, /\.value-domain:hover,\s*\.value-domain:focus-within/, 'contribution domain cards need a hover/focus interaction');
assert.match(html, /\.rq-chip:hover,\s*\.rq-chip:focus-visible/, 'research-topic chips need a hover/focus interaction');

assert.doesNotMatch(html, /rotate:\[/, 'global slide recipes should avoid rotational flourish for a more linear motion language');

console.log('PASS animation contract audit');
