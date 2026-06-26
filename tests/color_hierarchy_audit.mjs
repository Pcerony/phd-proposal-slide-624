import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.resolve(import.meta.dirname, '..');
const deckPath = path.resolve(process.argv[2] || path.join(root, 'index.html'));
const playwrightModule =
  process.env.PLAYWRIGHT_MODULE ||
  '/Users/heisei/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

if (!fs.existsSync(deckPath)) {
  throw new Error(`missing deck: ${deckPath}`);
}

const { chromium } = await import(playwrightModule);
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });

await page.goto(pathToFileURL(deckPath).href, { waitUntil: 'load' });
await page.addStyleTag({
  content: `
    *,*::before,*::after{animation:none!important;transition:none!important}
    body.motion-ready [data-anim],body.low-power [data-anim],[data-anim]{opacity:1!important;transform:none!important}
    canvas.bg,canvas.ascii-bg{display:none!important}
  `,
});

const slideCount = await page.locator('section.slide').count();
const issues = [];

for (let i = 0; i < slideCount; i += 1) {
  await page.evaluate((index) => {
    document.body.classList.add('low-power');
    if (typeof window.go === 'function') {
      window.go(index);
    } else {
      document.querySelector('#deck').style.transform = `translateX(${-index * 100}vw)`;
    }
    document.getAnimations().forEach((animation) => {
      try {
        animation.finish();
      } catch {
        animation.cancel();
      }
    });
  }, i);
  await page.waitForTimeout(350);

  const slideIssues = await page.evaluate((index) => {
    const parseRgb = (value) => {
      const m = value.match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const parts = m[1].split(',').map((part) => Number.parseFloat(part.trim()));
      return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
    };
    const luminance = ({ r, g, b }) => {
      const f = (c) => {
        const v = c / 255;
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const nearestSolidBg = (el) => {
      for (let node = el; node; node = node.parentElement) {
        const bg = parseRgb(getComputedStyle(node).backgroundColor);
        if (bg && bg.a >= 0.94) return bg;
      }
      return parseRgb(getComputedStyle(document.body).backgroundColor);
    };
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
    const isPureBlack = (c) => c && c.a === 1 && c.r <= 16 && c.g <= 16 && c.b <= 16;
    const isPureWhite = (c) => c && c.a === 1 && c.r >= 245 && c.g >= 245 && c.b >= 245;
    const isAuxiliaryTone = (c, bg) => {
      if (!c) return false;
      if (c.a < 1) return true;
      if (luminance(bg) < 0.25) return c.r < 245 || c.g < 245 || c.b < 245;
      return c.r > 16 || c.g > 16 || c.b > 16;
    };
    const summarize = (el, kind, color, expected) => ({
      slide: index + 1,
      kind,
      text: el.textContent.replace(/\s+/g, ' ').trim().slice(0, 90),
      color: `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`,
      expected,
    });

    const activeSlide = document.querySelectorAll('section.slide')[index];
    const localIssues = [];
    const importantSelectors = [
      'h1',
      'h2',
      '.force-title',
      '.layer-ttl',
      '.col-ttl',
      '.name-mega',
      '.num-mega',
      '.mega',
      '.kpi-hero',
      '.block-logic-word',
      '.ledger-num',
      '.bg-stat .num',
    ];
    const auxiliarySelectors = [
      '.jp',
      '.bi',
      '.t-meta',
      '.t-helper',
      '.layer-nb',
      '.layer-tag',
      '.route-step .nb',
      'p',
      '#page-indicator',
    ];

    for (const el of activeSlide.querySelectorAll(importantSelectors.join(','))) {
      if (!visible(el)) continue;
      const color = parseRgb(getComputedStyle(el).color);
      const bg = nearestSolidBg(el);
      const expectedWhite = luminance(bg) < 0.25;
      if (expectedWhite ? !isPureWhite(color) : !isPureBlack(color)) {
        localIssues.push(summarize(el, 'important', color, expectedWhite ? 'pure white' : 'pure black'));
      }
    }

    const auxElements = [...activeSlide.querySelectorAll(auxiliarySelectors.join(',')), document.querySelector('#page-indicator')]
      .filter(Boolean)
      .filter((el, pos, arr) => arr.indexOf(el) === pos);
    for (const el of auxElements) {
      if (!visible(el)) continue;
      const style = getComputedStyle(el);
      const weight = Number.parseInt(style.fontWeight, 10) || 400;
      if (weight >= 600 && !el.matches('.t-meta,.t-helper,.layer-nb,.layer-tag,.route-step .nb,#page-indicator')) {
        continue;
      }
      const color = parseRgb(style.color);
      const bg = nearestSolidBg(el);
      if (!isAuxiliaryTone(color, bg)) {
        localIssues.push(summarize(el, 'auxiliary', color, 'transparent or grey text role'));
      }
    }

    return localIssues;
  }, i);

  issues.push(...slideIssues);
}

await browser.close();

if (issues.length) {
  console.error(`COLOR HIERARCHY FAIL: ${issues.length} issues`);
  for (const issue of issues.slice(0, 40)) {
    console.error(`slide ${issue.slide} ${issue.kind} ${issue.expected}: ${issue.color} :: ${issue.text}`);
  }
  process.exit(1);
}

console.log(`PASS color hierarchy audit (${slideCount} slides)`);
