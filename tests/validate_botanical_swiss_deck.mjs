import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(import.meta.dirname, '..');
const target = path.join(root, 'index.html');

assert.ok(fs.existsSync(target), `missing ${path.basename(target)}`);

const html = fs.readFileSync(target, 'utf8');
const slides = [...html.matchAll(/<section\s+class="slide[^"]*"[^>]*data-layout="(S\d{2})"/g)];
const slideClassFor = (label) => {
  const labelIndex = html.indexOf(label);
  assert.notEqual(labelIndex, -1, `missing slide label: ${label}`);
  const sectionIndex = html.lastIndexOf('<section', labelIndex);
  assert.notEqual(sectionIndex, -1, `missing section for label: ${label}`);
  const sectionStart = html.slice(sectionIndex, html.indexOf('>', sectionIndex) + 1);
  const classMatch = sectionStart.match(/class="([^"]+)"/);
  assert.ok(classMatch, `missing class for section: ${label}`);
  return classMatch[1].split(/\s+/);
};

assert.equal(slides.length, 28, 'deck must contain exactly twenty-eight registered slides');
assert.deepEqual(
  slides.map((match) => match[1]),
  [
    'S01', 'S22', 'S17', 'S13', 'S22', 'S08', 'S09', 'S05',
    'S11', 'S17', 'S16', 'S17', 'S14', 'S17', 'S17', 'S13', 'S10', 'S15',
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
assert.match(html, /appendix-entry-slide[^"]*"[^>]*data-appendix="qa"[^>]*data-qa-entry="true"/, 'appendix entry slide must be part of the Q&A deck');
assert.match(html, /__qaStartIndex/, 'Q&A appendix entry point must be wired');
assert.match(html, /__mainSlideCount = mainSlideIndices\.length/, 'main deck must have its own slide count');
assert.match(html, /__appendixEntryIndex/, 'Q&A menu slide must have a dedicated index');
assert.match(html, /__qaQuestionIndices/, 'Q&A question slides must be tracked separately from the menu');
assert.match(html, /__qaSlideCount = qaQuestionIndices\.length/, 'Q&A question deck must have its own slide count');
assert.match(html, /formatPage\(idx\)/, 'page indicator must use deck-aware page formatting');
assert.match(html, /overview-mode-btn/, 'ESC overview must switch between main deck and Q&A deck');
assert.match(html, /appendix-question-card/, 'appendix entry slide must provide clickable question cards');
assert.match(html, /goAppendix\(9\)/, 'appendix entry must support direct jump to the tenth Q&A slide');
assert.match(html, /Q&A MENU \/ 10/, 'appendix entry must use Q&A menu page labeling');
assert.match(html, /overview-qa-list/, 'Q&A ESC overview must use a text menu list');
assert.match(html, /overview-qa-card/, 'Q&A ESC overview must render question text cards');
assert.match(html, /overviewMode==='appendix'\s*\?\s*'overview-qa-list'\s*:\s*'overview-thumb-grid'/, 'Q&A ESC overview must not use the thumbnail grid');
assert.match(html, /s\.querySelector\(['"]\.qa-question h2['"]\)/, 'Q&A ESC overview must source each menu item from the question text');
assert.match(html, /Method 01 Logic/, 'method 01 logic diagram slide must be present');
assert.match(html, /method-overview-node phase-what/, 'method overview WHAT card must use grey phase styling');
assert.match(html, /method-overview-node phase-how/, 'method overview HOW card must use lemon-green phase styling');
assert.match(html, /method-overview-node phase-which/, 'method overview WHICH card must use black phase styling');
assert.match(html, /Operational matrix/, 'method 01 must use an operational matrix instead of pseudo-formulas');
assert.match(html, /MODEL INPUT/, 'method 01 must name the selected variables as model input');
assert.doesNotMatch(html, /y = n1\(x\)|Σ y = N\(x\)/, 'method slides must not imply unsupported mathematical formulas');
assert.match(html, /block-arrow-card/, 'method logic pages must use block arrows instead of line arrows');
assert.match(html, /Method 02 Logic/, 'method 02 translation diagram slide must be present');
assert.match(html, /Design principle(?:<br\/>|\s)+hypothesis 1/i, 'method 02 hypothesis output must use numbered hypothesis blocks');
assert.match(html, /Method 03 Logic/, 'method 03 validation diagram slide must be present');
assert.match(html, /block-funnel-horizontal/, 'method 03 validation funnel must be horizontal');
assert.match(html, /Design principle 2/, 'method 03 output must reduce hypotheses into fewer principles');
assert.match(html, /Module A: causal model/, 'method module A label must be standardized');
assert.match(html, /Module B: design-principle hypotheses/, 'method module B label must be standardized');
assert.match(html, /Module C: validated principles/, 'method module C label must be standardized');
assert.ok(slideClassFor('Method 01 Logic').includes('light'), 'method 01 logic slide must remain light');
assert.ok(slideClassFor('Method 01 Detail').includes('light'), 'method 01 detail slide must remain light');
assert.ok(slideClassFor('Method 02 Logic').includes('accent'), 'method 02 logic slide must use lemon-green background');
assert.ok(slideClassFor('Method 02 Detail').includes('accent'), 'method 02 detail slide must use lemon-green background');
assert.ok(slideClassFor('Method 03 Logic').includes('dark'), 'method 03 logic slide must use dark background');
assert.ok(slideClassFor('Method 03 Detail').includes('dark'), 'method 03 detail slide must use dark background');
assert.match(html, /Q&A 10 \/ 10/, 'Q&A appendix must use separate ten-slide page count');
assert.doesNotMatch(html, />18-27</, 'main deck must not expose the old physical Q&A range');
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

console.log('PASS botanical Swiss deck structure (17 main + Q&A menu + 10 appendix questions)');
