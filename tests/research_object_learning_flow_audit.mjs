import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(import.meta.dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

const sectionFor = (label) => {
  const at = html.indexOf(label);
  assert.notEqual(at, -1, `missing slide label: ${label}`);
  const start = html.lastIndexOf('<section', at);
  const end = html.indexOf('<section class="slide', at);
  return html.slice(start, end === -1 ? html.length : end);
};

const slide = sectionFor('Research Object · 研究対象');

assert.doesNotMatch(slide, /s17-function-stack/, 'research object slide must remove the old left-side explanation stack');
assert.match(slide, /signage-learning-flow/, 'research object slide must include a signage learning flow chart');
assert.match(slide, /Attention/, 'learning flow must include Attention');
assert.match(slide, /Reading/, 'learning flow must include Reading');
assert.match(slide, /Encoding/, 'learning flow must include Encoding');
assert.match(slide, /Recall/, 'learning flow must include Recall');
assert.doesNotMatch(slide, /<h3>Review<\/h3>/, 'learning flow must use Recall instead of Review');
assert.doesNotMatch(slide, /学習の手がかりとしてサインに注意を向ける。/, 'learning flow supporting copy should remain English-only');
assert.doesNotMatch(slide, /ラベル・画像・解説文を読解する。/, 'learning flow supporting copy should remain English-only');
assert.doesNotMatch(slide, /サイン情報を観察対象の植物と結びつけて符号化する。/, 'learning flow supporting copy should remain English-only');
assert.doesNotMatch(slide, /訪問後に学習内容を想起する。/, 'learning flow supporting copy should remain English-only');
assert.match(html, /\.s17-photo-grid\{[^}]*grid-template-columns:1\.35fr 1fr 1fr/, 'photo grid must compress the three images into a top strip');
assert.match(html, /\.signage-learning-flow\{[^}]*grid-column:1 \/ -1/, 'learning flow must reserve the full lower slide width');

console.log('PASS research object learning flow audit');
