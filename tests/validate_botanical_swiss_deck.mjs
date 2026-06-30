import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const target = path.join(root, 'index.html');

assert.ok(fs.existsSync(target), `missing ${path.basename(target)}`);

const html = fs.readFileSync(target, 'utf8');
const assertGitTracked = (relativePath) => {
  assert.doesNotThrow(
    () => execFileSync('git', ['ls-files', '--error-unmatch', relativePath], {
      cwd: root,
      stdio: 'ignore',
    }),
    `${relativePath} must be tracked so slide assets are not lost on publish`,
  );
};
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
const slideSectionFor = (label) => {
  const labelIndex = html.indexOf(label);
  assert.notEqual(labelIndex, -1, `missing slide label: ${label}`);
  const sectionIndex = html.lastIndexOf('<section', labelIndex);
  const nextSectionIndex = html.indexOf('<section class="slide', labelIndex);
  assert.notEqual(sectionIndex, -1, `missing section for label: ${label}`);
  return html.slice(sectionIndex, nextSectionIndex === -1 ? html.length : nextSectionIndex);
};

assert.equal(slides.length, 29, 'deck must contain exactly twenty-nine registered slides');
assert.deepEqual(
  slides.map((match) => match[1]),
  [
    'S01', 'S22', 'S17', 'S13', 'S08', 'S22', 'S22', 'S09', 'S09',
    'S17', 'S16', 'S17', 'S14', 'S17', 'S17', 'S17', 'S13', 'S10', 'S15',
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
assert.match(html, /overview-resource-link/, 'ESC overview must include the master research slide site link');
assert.match(html, /co-creation-signage-slides\/ppt\//, 'master research slide site link must be embedded');
assert.match(html, /overviewMode==='appendix'\s*\?\s*'overview-qa-list'\s*:\s*'overview-thumb-grid'/, 'Q&A ESC overview must not use the thumbnail grid');
assert.match(html, /s\.querySelector\(['"]\.qa-question h2['"]\)/, 'Q&A ESC overview must source each menu item from the question text');
assert.match(html, /prior-gap-interactive/, 'prior research slide must mark the GAP module as interactive');
assert.match(html, /gap-module/, 'prior research slide must expose a dedicated GAP module');
assert.match(html, /gap-expanded/, 'prior research slide must include the expanded GAP state');
assert.match(html, /window\.__pipeAdvance = function\(\)\{\s*if\(gapStep===0\)/, 'space key must trigger the GAP expansion step');
assert.match(html, /Method 01 Logic/, 'method 01 logic diagram slide must be present');
assert.match(html, /design-card m-what/, 'method overview WHAT card must use grey phase styling');
assert.match(html, /design-card m-how/, 'method overview HOW card must use lemon-green phase styling');
assert.match(html, /design-card m-which/, 'method overview WHICH card must use black phase styling');
const researchDesignSlide = slideSectionFor('Research Design · 研究設計');
assert.match(researchDesignSlide, /design-sankey-stage/, 'research design slide must use the rebuilt stepped Sankey stage');
  assert.match(researchDesignSlide, /design-sankey-bg[\s\S]*?src="images\/research_design_bg\.svg"/, 'research design slide must render the background SVG image');
  assert.ok(fs.existsSync(path.join(root, 'images/research_design_bg.svg')), 'research design SVG asset must exist locally');
  assertGitTracked('images/research_design_bg.svg');
  assert.match(researchDesignSlide, /sankey-label what/, 'WHAT label must be positioned independently');
  assert.match(researchDesignSlide, /sankey-label how/, 'HOW label must be positioned independently');
  assert.match(researchDesignSlide, /sankey-label which/, 'WHICH label must be positioned independently');
  assert.match(researchDesignSlide, /sankey-label what[^"]*"[^>]*--x:\s*27\.7%/, 'WHAT label must align with SVG background');
  assert.match(researchDesignSlide, /sankey-label how[^"]*"[^>]*--x:\s*27\.7%/, 'HOW label must align with SVG background');
  assert.match(researchDesignSlide, /sankey-label which[^"]*"[^>]*--x:\s*27\.7%/, 'WHICH label must align with SVG background');
  assert.match(researchDesignSlide, /design-card m-what[^"]*"[^>]*--x:\s*47\.6%;\s*--y:\s*5\.4%;\s*--w:\s*18\.6%;\s*--h:\s*25\.7%/, 'top method card must align with SVG background');
  assert.match(researchDesignSlide, /design-card o-what[^"]*"[^>]*--x:\s*67(?:\.0)?%;\s*--y:\s*5\.4%;\s*--w:\s*18\.6%;\s*--h:\s*25\.7%/, 'top outcome card must align with SVG background');
  assert.match(researchDesignSlide, /design-card m-how[^"]*"[^>]*--x:\s*54\.8%;\s*--y:\s*35\.4%;\s*--w:\s*18\.6%;\s*--h:\s*25\.7%/, 'middle method card must align with SVG background');
  assert.match(researchDesignSlide, /design-card m-which[^"]*"[^>]*--x:\s*62(?:\.0)?%;\s*--y:\s*65\.2%;\s*--w:\s*18\.6%;\s*--h:\s*25\.7%/, 'bottom method card must align with SVG background');
  assert.match(researchDesignSlide, /design-axis-label" style="--x:\s*27\.7%;\s*--w:\s*33\.5%;?">Research question/, 'research-question label must reserve the wide blank column');
  assert.doesNotMatch(researchDesignSlide, /sankey-band|design-flow-col|viewBox="0 0 200 300"/, 'research design slide must not use the old symmetric or rounded-rectangle connector bands');
assert.match(html, /variable-field-strip/, 'method 01 input chart must include the lower row of observable variables');
assert.match(html, /causal-arrow-card/, 'method 01 must use a large card with an embedded arrow');
assert.match(html, /y = n1\(x\)/, 'method 01 must include the first causal formula');
assert.match(html, /Σy = N\(x\)/, 'method 01 must integrate formulas into the model equation');
assert.match(html, /Causal Mechanism<br\/>Model/, 'method 01 must foreground the causal mechanism model output');
assert.match(html, /block-arrow-card/, 'method logic pages must use block arrows instead of line arrows');
assert.match(html, /<h2 class="block-logic-word">WHAT<\/h2>\s*<p class="block-logic-note">Identify &amp; explore key design variables\./, 'method 01 logic body must reuse the detail-page question title');
assert.match(html, /<div class="t-cat accent">WHAT · PHASE 1<\/div>\s*<h2[^>]*>WHAT<\/h2>/, 'method 01 detail heading must be WHAT');
assert.match(html, /Method 02 Logic/, 'method 02 translation diagram slide must be present');
assert.match(html, /<h2 class="block-logic-word">HOW<\/h2>\s*<p class="block-logic-note">Formulate design principles through co-design\./, 'method 02 logic body must reuse the detail-page question title');
assert.match(html, /<div><div class="t-cat accent">HOW · PHASE 2<\/div><h2>HOW<\/h2>/, 'method 02 detail heading must be HOW');
assert.match(html, /Design principle(?:<br\/>|\s)+hypothesis 1/i, 'method 02 hypothesis output must use numbered hypothesis blocks');
assert.match(html, /Method 03 Logic/, 'method 03 validation diagram slide must be present');
assert.match(html, /<h2 class="block-logic-word">WHICH<\/h2>\s*<p class="block-logic-note">Validate design effects through field experiments\./, 'method 03 logic body must reuse the detail-page question title');
assert.match(html, /<div><div class="t-cat accent">WHICH · PHASE 3<\/div><h2>WHICH<\/h2>/, 'method 03 detail heading must be WHICH');
assert.match(html, /block-funnel-horizontal/, 'method 03 validation funnel must be horizontal');
assert.match(html, /memory-oriented signage system design principle 2/i, 'method 03 output must reduce hypotheses into fewer principles');
const method03Logic = slideSectionFor('Method 03 Logic');
assert.match(method03Logic, /hypothesis-block-list hypothesis-only/, 'method 03 input hypotheses must be compact labels without example descriptions');
assert.doesNotMatch(method03Logic, /Use theme colors to distinguish|Adjust content layout based on path|Place visual anchors at path stop points/, 'method 03 input module must not include example hypothesis text');
assert.match(method03Logic, /block-arrow-stack method03-filter/, 'method 03 middle diagram must use the converging funnel shape');
assert.match(method03Logic, /class="method03-funnel-svg"/, 'method 03 funnel must be SVG geometry');
assert.doesNotMatch(method03Logic, /block-funnel-stage|FIELD<br\/>TEST|MEASURE<br\/>EFFECTS|KEEP<br\/>REVISE/, 'method 03 funnel must not use the old segmented text-arrow blocks');
assert.match(html, /Module A: causal model/, 'method module A label must be standardized');
assert.match(html, /Design[\s-]principle(?:<br\/>|\s)+hypotheses/i, 'method module B output must remain explicit');
assert.match(html, /Memory-oriented(?:<br\/>|\s)+signage principles/i, 'method module C output must remain explicit');
assert.ok(slideClassFor('Method 01 Logic').includes('light'), 'method 01 logic slide must remain light');
assert.ok(slideClassFor('Method 01 Detail').includes('light'), 'method 01 detail slide must remain light');
assert.ok(slideClassFor('Method 02 Logic').includes('accent'), 'method 02 logic slide must use lemon-green background');
assert.ok(slideClassFor('Method 02 Detail').includes('accent'), 'method 02 detail slide must use lemon-green background');
assert.ok(slideClassFor('Method 03 Logic').includes('dark'), 'method 03 logic slide must use dark background');
assert.ok(slideClassFor('Method 03 Detail').includes('dark'), 'method 03 detail slide must use dark background');
assert.match(html, /17-master-research-plan\.png/, 'closing slide must include the doctoral research process flow image');
const closingSlide = slideSectionFor('Closing · まとめ');
assert.match(closingSlide, /data-image-slot="s10-doctoral-process-flow"/, 'closing slide image must use a registered image slot');
assert.match(closingSlide, /closing-flow-figure/, 'closing slide must embed the process flow inside the lemon-green closing layout');
assert.doesNotMatch(closingSlide, /half b-paper|closing-reference-half/, 'closing slide must not create a separate right column for the image');
assert.match(html, /Q&A 10 \/ 10/, 'Q&A appendix must use separate ten-slide page count');
assert.doesNotMatch(html, />(18-27|19-28)</, 'main deck must not expose a physical Q&A range');
assert.doesNotMatch(html, /TAKEAWAYS/, 'closing slide must not include takeaways');
assert.doesNotMatch(html, /\[必填\]|TODO/, 'required placeholders must be removed');
assert.match(html, /認知メカニズム/, 'Japanese title translation must be present');
assert.match(html, /解説サインシステム/, 'Japanese signage-system term must be present');
assert.match(html, /記憶指向デザイン/, 'Japanese memory-oriented design term must be present');
assert.match(html, /理論的ギャップ/, 'Japanese theory-gap label must be present');
assert.match(html, /期待される貢献/, 'Japanese contributions label must be present');
assert.match(html, /研究方法 03 取得データ/, 'Japanese method-data phase label must be present');
assert.match(html, /想定質問/, 'Japanese Q&A appendix label must be present');
assert.match(html, /認知負荷を下げ、記憶保持を高める解説サインシステムの設計。/, 'research design slide must retain Japanese topic support');
assert.match(html, /注意・負荷・記憶の先行モデル/, 'method 01 detail cards must retain concise Japanese support');
assert.match(html, /因果モデルを共有し理解する/, 'method 02 detail cards must retain concise Japanese support');
assert.match(html, /即時・遅延想起を比較/, 'method 03 detail cards must retain concise Japanese support');
assert.match(html, /記憶指向型デザインの判断基盤を提示する。/, 'contribution cards must retain concise Japanese support');
assert.ok(
  (html.match(/<span class="bi">/g) || []).length === 0,
  'ordinary bilingual helper spans must be removed after Japanese simplification',
);
assert.doesNotMatch(html, /学習の手がかりとしてサインに注意を向ける。/, 'low-priority Japanese learning-flow copy must be removed');
assert.doesNotMatch(html, /連続閲覧。|処理資源が低下。|記憶保持が弱まる。/, 'low-priority Japanese fatigue-step copy must be removed');
assert.doesNotMatch(html, /すべての式が一つの因果メカニズムモデルを構成する。/, 'method explanatory body copy should be English-only');
assert.doesNotMatch(
  html,
  /理论缺口|研究延伸|研究问题|研究设计|实证验证|预期贡献|欢迎提问|结语/,
  'simplified-Chinese slide labels must be removed',
);

console.log('PASS botanical Swiss deck structure (18 main + Q&A menu + 10 appendix questions)');
