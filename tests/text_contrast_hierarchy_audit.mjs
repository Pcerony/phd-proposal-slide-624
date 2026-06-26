import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.resolve(import.meta.dirname, '..');
const deckPath = path.resolve(process.argv[2] || path.join(root, 'index.html'));
const playwrightModule =
  process.env.PLAYWRIGHT_MODULE ||
  '/Users/heisei/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

const html = fs.readFileSync(deckPath, 'utf8');
const tokenAlpha = (name) => {
  const match = html.match(new RegExp(`${name}:rgba\\([^,]+,[^,]+,[^,]+,\\s*([0-9.]+)\\)`));
  return match ? Number.parseFloat(match[1]) : null;
};

const tokenExpectations = [
  ['--text-secondary', 0.48, 0.62],
  ['--text-helper', 0.42, 0.56],
  ['--text-inverse-secondary', 0.52, 0.66],
  ['--text-inverse-helper', 0.42, 0.56],
];

for (const [token, min, max] of tokenExpectations) {
  const alpha = tokenAlpha(token);
  if (!(alpha >= min && alpha <= max)) {
    throw new Error(`${token} alpha must be ${min}-${max} for secondary hierarchy, found ${alpha}`);
  }
}

const { chromium } = await import(playwrightModule);
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });

await page.goto(pathToFileURL(deckPath).href, { waitUntil: 'load' });
await page.addStyleTag({
  content: `
    *,*::before,*::after{animation:none!important;transition:none!important}
    body.motion-ready [data-anim],body.low-power [data-anim],[data-anim],
    .cover-row,.row-fill,.tl-node,.stack-block,.bar-tower,.sub-card,.col,.vrule,.kpi-cell,
    .card-fill,.card-accent,.card-ink,.qa-point,.value-output,.value-domain{opacity:1!important;transform:none!important}
    canvas.bg,canvas.ascii-bg{display:none!important}
  `,
});

const slideCount = await page.locator('section.slide').count();
const issues = [];

for (let i = 0; i < slideCount; i += 1) {
  await page.evaluate((index) => {
    const deck = document.querySelector('#deck');
    const slides = [...document.querySelectorAll('section.slide')];
    const slide = slides[index];
    document.body.classList.add('low-power');
    deck.style.transition = 'none';
    deck.style.transform = `translateX(${-index * 100}vw)`;
    document.body.classList.toggle('dark-bg', slide.classList.contains('dark') && !slide.classList.contains('split'));
    document.body.classList.toggle('appendix-mode', slide.dataset.appendix === 'qa');
    document.getAnimations?.().forEach((animation) => animation.cancel());
  }, i);
  await page.waitForTimeout(80);

  const slideResult = await page.evaluate((index) => {
    const parseRgb = (value) => {
      const match = value.match(/rgba?\(([^)]+)\)/);
      if (!match) return null;
      const parts = match[1].split(',').map((part) => Number.parseFloat(part.trim()));
      return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
    };
    const isPureBlackOrWhite = (color) =>
      color &&
      color.a >= 0.99 &&
      ((color.r <= 16 && color.g <= 16 && color.b <= 16) ||
        (color.r >= 245 && color.g >= 245 && color.b >= 245));
    const visible = (el) => {
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return (
        el.textContent.trim().length > 1 &&
        rect.width > 1 &&
        rect.height > 1 &&
        rect.right > 0 &&
        rect.left < innerWidth &&
        rect.bottom > 0 &&
        rect.top < innerHeight &&
        style.display !== 'none' &&
        style.visibility !== 'hidden'
      );
    };

    const slide = document.querySelectorAll('section.slide')[index];
    const textSelector = [
      'h1',
      'h2',
      'h3',
      'h4',
      'p',
      'li',
      'figcaption',
      'button',
      '.jp',
      '.bi',
      '.t-meta',
      '.t-cat',
      '.t-helper',
      '.chrome-min .l',
      '.chrome-min .r',
      '.rq-chip',
      '.qa-tag',
      '.num',
      '.mega',
      '.kpi-hero',
      '.block-logic-word',
      '.col-ttl',
      '.force-title',
      '.ledger-num',
      '.value-output .num',
      '.bg-stat .num',
      '.qa-nb',
      '.design-axis-label',
      '.sankey-label',
      '.design-card',
      '.method-label',
      '.phase-flow-node',
      '.block-arrow-card',
      '.output-chip',
    ].join(',');
    const coreSelector = [
      'h1',
      'h2',
      '.block-logic-word',
      '.mega',
      '.kpi-hero',
      '.ledger-num',
      '.value-output .num',
      '.bg-stat .num',
      '.num-mega',
      '.name-mega',
      '.col-ttl',
      '.force-title',
    ].join(',');

    const elements = [...slide.querySelectorAll(textSelector)]
      .filter((el, pos, arr) => arr.indexOf(el) === pos)
      .filter(visible);
    const details = elements.map((el) => {
      const color = parseRgb(getComputedStyle(el).color);
      const pure = isPureBlackOrWhite(color);
      const core = el.matches(coreSelector);
      return {
        core,
        pure,
        text: el.textContent.replace(/\s+/g, ' ').trim().slice(0, 80),
        color,
      };
    });
    const total = details.length;
    const pureCount = details.filter((item) => item.pure).length;
    const nonCorePure = details.filter((item) => !item.core && item.pure);
    return {
      slide: index + 1,
      total,
      pureRatio: total ? pureCount / total : 0,
      nonCorePure: nonCorePure.slice(0, 5),
    };
  }, i);

  if (slideResult.total >= 8) {
    if (slideResult.pureRatio > 0.45) {
      issues.push({
        slide: slideResult.slide,
        kind: 'pure-ratio',
        detail: `expected roughly 4:6 hierarchy with no more than 45% pure text, found ${Math.round(slideResult.pureRatio * 100)}%`,
      });
    }
  }
  if (slideResult.nonCorePure.length) {
    issues.push({
      slide: slideResult.slide,
      kind: 'non-core-pure',
      detail: slideResult.nonCorePure.map((item) => `${item.text} (${item.color.r},${item.color.g},${item.color.b},${item.color.a})`).join(' | '),
    });
  }
}

await browser.close();

if (issues.length) {
  console.error(`TEXT HIERARCHY FAIL: ${issues.length} issues`);
  for (const issue of issues.slice(0, 40)) {
    console.error(`slide ${issue.slide} ${issue.kind}: ${issue.detail}`);
  }
  process.exit(1);
}

console.log(`PASS text contrast hierarchy audit (${slideCount} slides)`);
