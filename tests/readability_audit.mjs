import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.resolve(import.meta.dirname, '..');
const deckPath = path.resolve(process.argv[2] || path.join(root, 'index.html'));
const outDir = path.join(root, 'output', 'readability-qa');
const playwrightModule =
  process.env.PLAYWRIGHT_MODULE ||
  '/Users/heisei/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';

if (!fs.existsSync(deckPath)) {
  throw new Error(`missing deck: ${deckPath}`);
}

fs.mkdirSync(outDir, { recursive: true });

const { chromium } = await import(playwrightModule);
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });

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
const allIssues = [];

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
  await page.waitForTimeout(700);
  await page.evaluate(() => {
    document.getAnimations().forEach((animation) => {
      try {
        animation.finish();
      } catch {
        animation.cancel();
      }
    });
  });

  const screenshotPath = path.join(outDir, `slide-${String(i + 1).padStart(2, '0')}.png`);
  const screenshot = await page.screenshot({ path: screenshotPath, type: 'png' });
  const issues = await page.evaluate(async ({ index, base64 }) => {
    const image = new Image();
    image.src = `data:image/png;base64,${base64}`;
    await image.decode();

    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(image, 0, 0);

    const parseRgb = (value) => {
      const normalized = value.trim();
      if (/^#[0-9a-f]{6}$/i.test(normalized)) {
        return {
          r: Number.parseInt(normalized.slice(1, 3), 16),
          g: Number.parseInt(normalized.slice(3, 5), 16),
          b: Number.parseInt(normalized.slice(5, 7), 16),
          a: 1,
        };
      }
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
    const contrast = (fg, bg) => {
      const l1 = luminance(fg);
      const l2 = luminance(bg);
      return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    };
    const fixedBackground = (el) => {
      if (el.id !== 'page-indicator') return null;
      const activeSlide = document.querySelectorAll('section.slide')[index];
      const rootStyle = getComputedStyle(document.documentElement);
      if (activeSlide.classList.contains('accent')) return parseRgb(rootStyle.getPropertyValue('--accent').trim());
      if (activeSlide.classList.contains('dark') && !activeSlide.classList.contains('split')) {
        return parseRgb(rootStyle.getPropertyValue('--ink').trim());
      }
      return parseRgb(rootStyle.getPropertyValue('--paper').trim());
    };
    const solidBackground = (el) => {
      const fixed = fixedBackground(el);
      if (fixed) return fixed;
      for (let node = el; node; node = node.parentElement) {
        const style = getComputedStyle(node);
        const bg = parseRgb(style.backgroundColor);
        if (bg && bg.a > 0.92) return bg;
        if (style.backgroundImage && style.backgroundImage !== 'none') return null;
      }
      return parseRgb(getComputedStyle(document.body).backgroundColor);
    };
    const pixel = (x, y) => {
      const safeX = Math.max(0, Math.min(canvas.width - 1, Math.round(x)));
      const safeY = Math.max(0, Math.min(canvas.height - 1, Math.round(y)));
      const [r, g, b, a] = ctx.getImageData(safeX, safeY, 1, 1).data;
      return { r, g, b, a: a / 255 };
    };
    const samplesFor = (rect) => {
      const left = Math.max(rect.left + 2, 0);
      const right = Math.min(rect.right - 2, canvas.width - 1);
      const top = Math.max(rect.top + 2, 0);
      const bottom = Math.min(rect.bottom - 2, canvas.height - 1);
      const midX = rect.left + rect.width / 2;
      const midY = rect.top + rect.height / 2;
      return [
        pixel(left, top),
        pixel(right, top),
        pixel(left, bottom),
        pixel(right, bottom),
        pixel(midX, top),
        pixel(midX, bottom),
        pixel(left, midY),
        pixel(right, midY),
      ];
    };
    const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
    const hasDirectText = (el) =>
      [...el.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 1);

    const selectors = [
      'h1',
      'h2',
      'h3',
      'p',
      'li',
      '.jp',
      '.bi',
      '.t-meta',
      '.t-cat',
      '.t-helper',
      '.t-body',
      '.t-body-sm',
      '.t-body-emp',
      '.chrome-min .l',
      '.chrome-min .r',
      '.layer-tag',
      '.layer-nb',
      '.route-step .nb',
      '#page-indicator',
    ];
    const activeSlide = document.querySelectorAll('section.slide')[index];
    const candidates = [...activeSlide.querySelectorAll(selectors.join(',')), document.querySelector('#page-indicator')]
      .filter(Boolean)
      .filter((el, pos, arr) => arr.indexOf(el) === pos)
      .filter((el) => {
        const style = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        const text = el.textContent.replace(/\s+/g, ' ').trim();
        return (
          text.length > 1 &&
          rect.width > 2 &&
          rect.height > 2 &&
          rect.right > 0 &&
          rect.left < innerWidth &&
          rect.bottom > 0 &&
          rect.top < innerHeight &&
          style.visibility !== 'hidden' &&
          style.display !== 'none' &&
          Number.parseFloat(style.opacity || '1') > 0.2 &&
          (hasDirectText(el) || el.matches('.jp,.bi,.t-meta,.t-cat,.t-helper,.layer-tag,.layer-nb,.route-step .nb,#page-indicator'))
        );
      });

    return candidates
      .map((el) => {
        const style = getComputedStyle(el);
        const fg = parseRgb(style.color);
        const rect = el.getBoundingClientRect();
        const solidBg = solidBackground(el);
        const samples = solidBg ? [solidBg] : samplesFor(rect);
        const ratios = samples.map((bg) => contrast(fg, bg));
        const fontSize = Number.parseFloat(style.fontSize);
        const fontWeight = Number.parseInt(style.fontWeight, 10) || 400;
        const isLarge = fontSize >= 24 || (fontSize >= 18 && fontWeight >= 600);
        const isAuxiliary = el.matches('.t-meta,.t-cat,.t-helper,.chrome-min .l,.chrome-min .r,.layer-tag,.layer-nb,.route-step .nb,#page-indicator');
        const threshold = isLarge ? 3 : isAuxiliary ? 3 : 4.5;
        const medianRatio = median(ratios);
        const minRatio = Math.min(...ratios);
        return {
          slide: index + 1,
          selector: el.id ? `#${el.id}` : el.className ? `.${String(el.className).trim().replace(/\s+/g, '.')}` : el.tagName.toLowerCase(),
          text: el.textContent.replace(/\s+/g, ' ').trim().slice(0, 90),
          color: style.color,
          fontSize,
          fontWeight,
          threshold,
          contrast: Number(medianRatio.toFixed(2)),
          minContrast: Number(minRatio.toFixed(2)),
        };
      })
      .filter((item) => item.contrast < item.threshold)
      .sort((a, b) => a.contrast - b.contrast);
  }, { index: i, base64: screenshot.toString('base64') });

  allIssues.push(...issues);
}

await browser.close();

const reportPath = path.join(outDir, 'readability-report.json');
fs.writeFileSync(reportPath, `${JSON.stringify({ deck: deckPath, slides: slideCount, issues: allIssues }, null, 2)}\n`);

if (allIssues.length) {
  console.error(`READABILITY FAIL: ${allIssues.length} contrast issues. Report: ${reportPath}`);
  for (const issue of allIssues.slice(0, 30)) {
    console.error(
      `slide ${issue.slide} ${issue.selector} contrast ${issue.contrast}/${issue.threshold}: ${issue.text}`,
    );
  }
  process.exit(1);
}

console.log(`READABILITY PASS: ${slideCount} slides checked. Screenshots: ${outDir}`);
