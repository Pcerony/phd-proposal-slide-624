import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(import.meta.dirname, '..');
const htmlPath = path.join(root, 'index.html');
const svgPath = path.join(root, 'images', 'research_design_bg.svg');
const mode = process.argv.includes('--check') ? 'check' : 'write';

const html = fs.readFileSync(htmlPath, 'utf8');
let svg = fs.readFileSync(svgPath, 'utf8');

if (!svg.includes('preserveAspectRatio="none"')) {
  if (mode === 'write') {
    if (svg.includes('preserveAspectRatio')) {
      svg = svg.replace(/preserveAspectRatio="[^"]*"/g, 'preserveAspectRatio="none"');
    } else {
      svg = svg.replace(/<svg\b([^>]*)>/, '<svg$1 preserveAspectRatio="none">');
    }
    fs.writeFileSync(svgPath, svg);
    console.log('Patched images/research_design_bg.svg to include preserveAspectRatio="none"');
  } else {
    console.error('Error: images/research_design_bg.svg is missing preserveAspectRatio="none".');
    console.error('Run: node scripts/sync_research_design_layout.mjs to automatically patch the SVG and sync layout.');
    process.exit(1);
  }
}


const parseAttrs = (source) => {
  const attrs = {};
  for (const match of source.matchAll(/([\w:-]+)="([^"]*)"/g)) {
    attrs[match[1]] = match[2];
  }
  return attrs;
};

const numberAttr = (attrs, name, fallback = 0) => {
  const value = attrs[name];
  return value == null || value === '' ? fallback : Number(value);
};

const svgSize = () => {
  const viewBox = svg.match(/viewBox="([^"]+)"/)?.[1]?.trim().split(/\s+/).map(Number);
  if (viewBox?.length === 4) return { width: viewBox[2], height: viewBox[3] };
  const rootAttrs = parseAttrs(svg.match(/<svg\b([^>]*)>/)?.[1] ?? '');
  return { width: Number(rootAttrs.width), height: Number(rootAttrs.height) };
};

const { width: svgWidth, height: svgHeight } = svgSize();
assert.ok(svgWidth > 0 && svgHeight > 0, 'research_design_bg.svg must expose a valid viewBox or width/height');

const rects = [...svg.matchAll(/<rect\b([^>]*)\/?>/g)].map((match) => {
  const attrs = parseAttrs(match[1]);
  return {
    x: numberAttr(attrs, 'x'),
    y: numberAttr(attrs, 'y'),
    width: numberAttr(attrs, 'width'),
    height: numberAttr(attrs, 'height'),
    fill: (attrs.fill ?? '').toUpperCase(),
  };
}).filter((rect) => rect.width > 0 && rect.height > 0);

assert.ok(rects.length >= 10, 'research_design_bg.svg must include the topic rectangle plus three rows of stage rectangles');

const pct = (value, basis) => `${Number(((value / basis) * 100).toFixed(1))}%`;
const close = (a, b, tolerance = 2) => Math.abs(a - b) <= tolerance;

const minX = Math.min(...rects.map((rect) => rect.x));
const topicRect = rects
  .filter((rect) => close(rect.x, minX))
  .sort((a, b) => b.height - a.height)[0];
assert.ok(topicRect, 'could not identify the left research-topic rectangle');

const stageRects = rects.filter((rect) => rect !== topicRect);
const rows = [];
for (const rect of [...stageRects].sort((a, b) => a.y - b.y || a.x - b.x)) {
  const row = rows.find((candidate) => close(candidate.y, rect.y));
  if (row) {
    row.rects.push(rect);
  } else {
    rows.push({ y: rect.y, rects: [rect] });
  }
}

assert.equal(rows.length, 3, 'research design SVG must contain exactly three stage rows');
for (const row of rows) {
  row.rects.sort((a, b) => a.x - b.x);
  assert.equal(row.rects.length, 3, `stage row at y=${row.y} must contain label, method, and outcome rectangles`);
}

const [whatRow, howRow, whichRow] = rows.sort((a, b) => a.y - b.y);
const rectToVars = (rect) => ({
  '--x': pct(rect.x, svgWidth),
  '--y': pct(rect.y, svgHeight),
  '--w': pct(rect.width, svgWidth),
  '--h': pct(rect.height, svgHeight),
});
const rectToAxisVars = (rect) => ({
  '--x': pct(rect.x, svgWidth),
  '--w': pct(rect.width, svgWidth),
});

const layout = [
  { classParts: ['design-topic-card'], vars: rectToVars(topicRect) },
  { classParts: ['sankey-label', 'what'], vars: rectToVars(whatRow.rects[0]) },
  { classParts: ['sankey-label', 'how'], vars: rectToVars(howRow.rects[0]) },
  { classParts: ['sankey-label', 'which'], vars: rectToVars(whichRow.rects[0]) },
  { classParts: ['design-card', 'm-what'], vars: rectToVars(whatRow.rects[1]) },
  { classParts: ['design-card', 'o-what'], vars: rectToVars(whatRow.rects[2]) },
  { classParts: ['design-card', 'm-how'], vars: rectToVars(howRow.rects[1]) },
  { classParts: ['design-card', 'o-how'], vars: rectToVars(howRow.rects[2]) },
  { classParts: ['design-card', 'm-which'], vars: rectToVars(whichRow.rects[1]) },
  { classParts: ['design-card', 'o-which'], vars: rectToVars(whichRow.rects[2]) },
  {
    classParts: ['design-axis-label'],
    contains: 'Research Topic',
    vars: {
      ...rectToAxisVars(topicRect),
      top: pct(Math.max(0, topicRect.y - svgHeight * 0.064), svgHeight),
    },
  },
  { classParts: ['design-axis-label'], contains: 'Research question', vars: rectToAxisVars(whichRow.rects[0]) },
  { classParts: ['design-axis-label'], contains: 'Method', vars: rectToAxisVars(whichRow.rects[1]) },
  { classParts: ['design-axis-label'], contains: 'Outcome', vars: rectToAxisVars(whichRow.rects[2]) },
];

const parseStyle = (style) => {
  const entries = [];
  for (const chunk of style.split(';')) {
    const part = chunk.trim();
    if (!part) continue;
    const colon = part.indexOf(':');
    if (colon === -1) continue;
    entries.push([part.slice(0, colon).trim(), part.slice(colon + 1).trim()]);
  }
  return entries;
};

const formatStyle = (style, updates) => {
  const next = new Map(parseStyle(style));
  for (const [key, value] of Object.entries(updates)) next.set(key, value);

  const priority = ['--x', '--y', '--w', '--h', 'top'];
  const ordered = [];
  for (const key of priority) {
    if (next.has(key)) {
      ordered.push([key, next.get(key)]);
      next.delete(key);
    }
  }
  for (const entry of next.entries()) ordered.push(entry);
  return ordered.map(([key, value]) => `${key}: ${value}`).join('; ');
};

const updateOpeningTagStyle = (source, target) => {
  const re = /<div\s+class="([^"]+)"\s+style="([^"]*)"/g;
  let match;
  while ((match = re.exec(source))) {
    const classes = match[1].split(/\s+/);
    if (!target.classParts.every((className) => classes.includes(className))) continue;
    const closeIndex = source.indexOf('</div>', match.index);
    const elementSource = closeIndex === -1 ? source.slice(match.index, match.index + 260) : source.slice(match.index, closeIndex);
    if (target.contains && !elementSource.includes(target.contains)) continue;

    const before = source.slice(0, match.index);
    const after = source.slice(match.index + match[0].length);
    const updatedTag = match[0].replace(`style="${match[2]}"`, `style="${formatStyle(match[2], target.vars)}"`);
    return before + updatedTag + after;
  }
  throw new Error(`could not find target element: ${target.classParts.join('.')} ${target.contains ?? ''}`.trim());
};

let nextHtml = html;
for (const target of layout) {
  nextHtml = updateOpeningTagStyle(nextHtml, target);
}

if (mode === 'check') {
  if (nextHtml !== html) {
    console.error('Research design layout is out of sync with images/research_design_bg.svg.');
    console.error('Run: node scripts/sync_research_design_layout.mjs');
    process.exit(1);
  }
  console.log('PASS research design layout is synced with SVG');
} else {
  fs.writeFileSync(htmlPath, nextHtml);
  console.log('Synced research design layout from images/research_design_bg.svg');
}
