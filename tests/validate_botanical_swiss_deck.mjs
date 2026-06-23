import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(import.meta.dirname, '..');
const target = path.join(root, 'index.html');

assert.ok(fs.existsSync(target), `missing ${path.basename(target)}`);

const html = fs.readFileSync(target, 'utf8');
const slides = [...html.matchAll(/<section\s+class="slide[^"]*"[^>]*data-layout="(S\d{2})"/g)];

assert.equal(slides.length, 24, 'deck must contain exactly twenty-four registered slides');
assert.deepEqual(
  slides.map((match) => match[1]),
  [
    'S01', 'S22', 'S17', 'S13', 'S22', 'S08', 'S09', 'S05',
    'S11', 'S16', 'S14', 'S17', 'S13', 'S10',
    'S08', 'S08', 'S08', 'S08', 'S08', 'S08', 'S08', 'S08', 'S08', 'S08',
  ],
  'registered layouts must match the approved narrative map',
);
assert.match(html, /--accent:\s*#C5E803/i, 'Lemon Green theme must be active');
assert.match(html, /--accent-on:\s*#0a0a0a/i, 'accent text must be black');
assert.match(html, /--accent-text:\s*#3f4a00/i, 'Readable accent text token must be active');
assert.match(
  html,
  /Cognitive Mechanisms of Interpretive Signage Systems(<br>|\s)+in Botanical Gardens from a Co-creation Perspective/,
  'full proposal title must be present',
);
assert.match(html, /classList\.toggle\(['"]low-power['"]/, 'B low-power mode must remain available');
assert.match(html, /overview/i, 'ESC overview must remain available');
assert.match(html, /data-appendix="qa"/, 'Q&A appendix slides must be marked');
assert.match(html, /__qaStartIndex/, 'Q&A appendix entry point must be wired');
assert.match(html, /overview-qa-btn/, 'ESC overview must expose Q&A appendix entry');
assert.doesNotMatch(html, /TAKEAWAYS/, 'closing slide must not include takeaways');
assert.doesNotMatch(html, /\[必填\]|TODO/, 'required placeholders must be removed');
assert.match(html, /認知メカニズム/, 'Japanese title translation must be present');
assert.match(html, /解説サインシステム/, 'Japanese signage-system term must be present');
assert.match(html, /記憶指向デザイン/, 'Japanese memory-oriented design term must be present');
assert.match(html, /理論的ギャップ/, 'Japanese theory-gap label must be present');
assert.match(html, /閉ループ検証/, 'Japanese validation label must be present');
assert.match(html, /期待される貢献/, 'Japanese contributions label must be present');
assert.ok(
  ((html.match(/class="[^"]*\bjp\b[^"]*"/g) || []).length +
    (html.match(/class="[^"]*\bbi\b[^"]*"/g) || []).length) >= 50,
  'at least 50 Japanese text blocks must be present across jp and bi classes',
);
assert.doesNotMatch(
  html,
  /理论缺口|研究延伸|研究问题|研究设计|实证验证|预期贡献|欢迎提问|结语/,
  'simplified-Chinese slide labels must be removed',
);

console.log('PASS botanical Swiss deck structure (24 slides)');
