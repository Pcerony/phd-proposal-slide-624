import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(import.meta.dirname, '..');
const target = path.join(root, 'index.html');
const html = fs.readFileSync(target, 'utf8');

assert.match(
  html,
  /\.slide:not\(:first-child\):not\(:last-child\)\s+\.canvas-card\{/,
  'dot matrix texture must be applied to the visible slide canvas on all pages except the first and last physical pages',
);
assert.match(
  html,
  /background-image:\s*radial-gradient\([^)]*transparent/,
  'dot matrix texture must be drawn with CSS radial-gradient dots',
);
assert.match(
  html,
  /background-size:\s*clamp\(34px,\s*3vw,\s*52px\)\s+clamp\(34px,\s*3vw,\s*52px\)/,
  'dot matrix spacing must stay intentionally sparse and lower density',
);
assert.match(
  html,
  /--dot-matrix-color:\s*rgba\(10,\s*10,\s*10,\s*\.09\)/,
  'dot matrix must use the tuned mid-transparency light-slide color',
);
assert.match(
  html,
  /--dot-matrix-color:\s*rgba\(255,\s*255,\s*255,\s*\.095\)/,
  'dot matrix must use the tuned mid-transparency dark-slide color',
);
assert.doesNotMatch(
  html,
  /\.canvas-card::before[\s\S]*?z-index:\s*2/,
  'dot matrix must not be an overlay above cards and images',
);
assert.doesNotMatch(
  html,
  /codex-clipboard-35ca01fc-b687-4e1d-9bd5-b295b84f47d5|url\([^)]*dot|url\([^)]*pattern/i,
  'dot matrix texture must not reference the clipboard image or a bitmap pattern file',
);

console.log('PASS CSS-drawn sparse dot matrix background');
