const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('svgMasterVisited', 'true');
  });
  await page.goto('/');
  await expect(page.locator('#mainSvg')).toBeVisible();
});

async function drawRect(page) {
  await page.click('#toolShape');
  await page.click('#shapeSubMenu [data-shape="rect"]');

  const box = await page.locator('#mainSvg').boundingBox();
  const x1 = box.x + 120;
  const y1 = box.y + 120;
  const x2 = box.x + 260;
  const y2 = box.y + 220;

  await page.mouse.move(x1, y1);
  await page.mouse.down();
  await page.mouse.move(x2, y2);
  await page.mouse.up();
}

async function countDrawable(page) {
  return page.evaluate(() => {
    const svg = document.getElementById('mainSvg');
    return Array.from(svg.children).filter((el) => {
      if (el.id === 'gridRect' || el.id === 'marqueeRect' || el.id === 'uiLayer') return false;
      if (el.tagName === 'defs') return false;
      if (el.classList.contains('preview-line')) return false;
      return true;
    }).length;
  });
}

test('draw rectangle smoke test', async ({ page }) => {
  const before = await countDrawable(page);
  await drawRect(page);
  const after = await countDrawable(page);
  expect(after).toBeGreaterThan(before);
});

test('undo and redo restores canvas state', async ({ page }) => {
  const before = await countDrawable(page);
  await drawRect(page);
  const afterDraw = await countDrawable(page);
  expect(afterDraw).toBeGreaterThan(before);

  await page.keyboard.press('Control+z');
  const afterUndo = await countDrawable(page);
  expect(afterUndo).toBe(before);

  await page.keyboard.press('Control+y');
  const afterRedo = await countDrawable(page);
  expect(afterRedo).toBe(afterDraw);
});

test('language switching updates UI labels', async ({ page }) => {
  await page.click('#btnLang');
  await page.click('#langSubMenu [data-lang="ko"]');

  await expect(page.locator('.sidebar h3')).toHaveText('속성');
  await expect(page.locator('#currentLangLabel')).toHaveText('KO');
  await expect(page.locator('#btnSnap')).toContainText('🧲');
});

test('pasted SVG is sanitized before insertion', async ({ page }) => {
  const payload = `
<svg xmlns="http://www.w3.org/2000/svg">
  <rect id="xss-rect" x="10" y="10" width="80" height="60" fill="red" onclick="alert('x')"></rect>
  <script>alert('bad')</script>
</svg>`;

  await page.evaluate((text) => {
    const textarea = document.getElementById('codeText');
    textarea.style.display = 'block';
    textarea.value = text;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }, payload);

  const attrs = await page.evaluate(() => {
    const rect = document.getElementById('xss-rect');
    return {
      exists: !!rect,
      hasOnClick: rect ? rect.hasAttribute('onclick') : false,
      hasScript: !!document.querySelector('#mainSvg script'),
    };
  });

  expect(attrs.exists).toBeTruthy();
  expect(attrs.hasOnClick).toBeFalsy();
  expect(attrs.hasScript).toBeFalsy();
});
