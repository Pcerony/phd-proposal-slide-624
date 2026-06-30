import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.resolve(import.meta.dirname, '..');
const deckPath = path.resolve(process.argv[2] || path.join(root, 'index.html'));
const outDir = path.join(root, 'output', 'responsive-qa');
const playwrightModule =
  process.env.PLAYWRIGHT_MODULE ||
  '/Users/heisei/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

if (!fs.existsSync(deckPath)) {
  throw new Error(`missing deck: ${deckPath}`);
}

fs.mkdirSync(outDir, { recursive: true });

const viewports = [
  { name: 'desktop-1920x1080', width: 1920, height: 1080 },
  { name: 'ultrawide-3440x1440', width: 3440, height: 1440 },
  { name: 'classic-1024x768', width: 1024, height: 768 },
  { name: 'tablet-landscape-1112x834', width: 1112, height: 834 },
];

const { chromium } = await import(playwrightModule);
const browser = await chromium.launch({ headless: true });
const allIssues = [];

for (const viewport of viewports) {
  const page = await browser.newPage({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
  });
  const viewportDir = path.join(outDir, viewport.name);
  fs.mkdirSync(viewportDir, { recursive: true });

  await page.goto(pathToFileURL(deckPath).href, { waitUntil: 'load' });
  await page.addStyleTag({
    content: `
      *,*::before,*::after{animation:none!important;transition:none!important}
      body.motion-ready [data-anim],body.low-power [data-anim],[data-anim],
      .cover-row,.row-fill,.tl-node,.stack-block,.bar-tower,.sub-card,.col,.vrule,.kpi-cell,
      .card-fill,.card-accent,.card-ink{opacity:1!important;transform:none!important}
      canvas.bg,canvas.ascii-bg{display:none!important}
    `,
  });

  const slideCount = await page.locator('section.slide').count();
  for (let i = 0; i < slideCount; i += 1) {
    await page.evaluate((index) => {
      document.body.classList.add('low-power');
      const deck = document.querySelector('#deck');
      const slides = [...document.querySelectorAll('section.slide')];
      deck.style.transition = 'none';
      deck.style.transform = `translateX(${-index * 100}vw)`;
      const slide = slides[index];
      document.body.classList.toggle('dark-bg', slide.classList.contains('dark') && !slide.classList.contains('split'));
      document.body.classList.toggle('appendix-mode', slide.dataset.appendix === 'qa');
      document.getAnimations?.().forEach((animation) => {
        try {
          animation.finish();
        } catch {
          animation.cancel();
        }
      });
    }, i);
    await page.waitForTimeout(80);

    const issues = await page.evaluate(({ index, viewportName }) => {
      const slide = document.querySelectorAll('section.slide')[index];
      const vw = innerWidth;
      const vh = innerHeight;
      const navTop = vh - Math.max(42, vh * 0.055);
      const isMobile = vw <= 700 || vw / vh <= 0.82;
      const textSelector = [
        'h1',
        'h2',
        'h3',
        'h4',
        'p',
        'li',
        'figcaption',
        '.jp',
        '.bi',
        '.t-meta',
        '.t-cat',
        '.t-helper',
        '.t-body',
        '.t-body-sm',
        '.chrome-min .l',
        '.chrome-min .r',
        '.force-title',
        '.force-num',
        '.num',
        '.qa-tag',
      ].join(',');
      const overflowSelector = [
        'img',
        'figure',
        'svg',
        'button',
        '.card-fill',
        '.card-ink',
        '.card-accent',
        '.force-card',
        '.hero-ink-col',
        '.accent-stripe',
        '.duo-compare',
        '.block-flow',
        '.method-phase-shell',
        '.method-overview-node',
        '.appendix-question-card',
        '.qa-question',
        '.qa-answer',
        '.qa-point',
      ].join(',');
      const hidden = (el) => {
        const style = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return (
          rect.width <= 1 ||
          rect.height <= 1 ||
          style.display === 'none' ||
          style.visibility === 'hidden' ||
          Number.parseFloat(style.opacity || '1') <= 0.05
        );
      };
      const textRole = (el) => {
        if (el.matches('.t-meta,.t-cat,.chrome-min .l,.chrome-min .r,figcaption,.qa-tag')) return 'meta';
        if (el.matches('.jp,.bi,.t-helper,.t-body-sm,li,p,button')) return 'body';
        return 'heading';
      };
      const minFontFor = (role) => {
        if (role === 'meta') return isMobile ? 10 : 11;
        if (role === 'body') return isMobile ? 13 : 14;
        return isMobile ? 15 : 16;
      };
      const item = (kind, el, detail = {}) => {
        const rect = el.getBoundingClientRect();
        return {
          viewport: viewportName,
          slide: index + 1,
          kind,
          selector: el.id ? `#${el.id}` : el.className ? `.${String(el.className).trim().replace(/\s+/g, '.')}` : el.tagName.toLowerCase(),
          text: el.textContent?.replace(/\s+/g, ' ').trim().slice(0, 100) || '',
          rect: {
            left: Math.round(rect.left),
            top: Math.round(rect.top),
            right: Math.round(rect.right),
            bottom: Math.round(rect.bottom),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          },
          ...detail,
        };
      };

      const localIssues = [];
      const textElements = [...slide.querySelectorAll(textSelector)].filter((el) => {
        const rect = el.getBoundingClientRect();
        return (
          !hidden(el) &&
          el.textContent.replace(/\s+/g, '').length > 1 &&
          rect.right > 0 &&
          rect.left < vw &&
          rect.bottom > 0 &&
          rect.top < vh
        );
      });

      for (const el of textElements) {
        const rect = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        const role = textRole(el);
        const fontSize = Number.parseFloat(style.fontSize);
        const minFont = minFontFor(role);
        if (fontSize < minFont) {
          localIssues.push(item('font-too-small', el, { role, fontSize: Number(fontSize.toFixed(2)), minFont }));
        }
        const verticalOverflow = isMobile ? rect.top < -1 : rect.top < -1 || rect.bottom > vh + 1;
        if (rect.left < -1 || rect.right > vw + 1 || verticalOverflow) {
          localIssues.push(item('text-overflow', el));
        }
        if (!isMobile && !el.closest('.chrome-min') && !el.closest('#page-indicator') && rect.bottom > navTop) {
          localIssues.push(item('nav-safe-zone', el, { navTop: Math.round(navTop) }));
        }
      }

      const overflowElements = [...slide.querySelectorAll(overflowSelector)].filter((el) => {
        const rect = el.getBoundingClientRect();
        return !hidden(el) && rect.right > -vw * 0.25 && rect.left < vw * 1.25 && rect.bottom > -vh * 0.25 && rect.top < vh * 1.25;
      });
      for (const el of overflowElements) {
        const rect = el.getBoundingClientRect();
        const verticalOverflow = isMobile ? rect.top < -2 : rect.top < -2 || rect.bottom > vh + 2;
        if (rect.left < -2 || rect.right > vw + 2 || verticalOverflow) {
          localIssues.push(item('element-overflow', el));
        }
      }

      return localIssues;
    }, { index: i, viewportName: viewport.name });

    if (issues.length) {
      const screenshotPath = path.join(viewportDir, `slide-${String(i + 1).padStart(2, '0')}.png`);
      await page.screenshot({ path: screenshotPath, type: 'png' });
      allIssues.push(...issues.map((issue) => ({ ...issue, screenshot: path.relative(root, screenshotPath) })));
    }
  }

  await page.close();
}

await browser.close();

const reportPath = path.join(outDir, 'responsive-report.json');
fs.writeFileSync(reportPath, `${JSON.stringify({ deck: deckPath, viewports, issues: allIssues }, null, 2)}\n`);

if (allIssues.length) {
  console.error(`RESPONSIVE FAIL: ${allIssues.length} issues. Report: ${reportPath}`);
  for (const issue of allIssues.slice(0, 50)) {
    console.error(
      `${issue.viewport} slide ${issue.slide} ${issue.kind} ${issue.selector}: ${issue.text || JSON.stringify(issue.rect)}`,
    );
  }
  process.exit(1);
}

console.log(`RESPONSIVE PASS: ${viewports.length} viewports checked. Screenshots: ${outDir}`);
