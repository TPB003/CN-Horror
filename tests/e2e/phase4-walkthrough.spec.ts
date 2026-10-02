import { expect, test} from '@playwright/test';

// Phase 4: full immersion acceptance walkthrough.
// Covers: 12-station narrative walk, exploration open/close per station,
// S11 naming puzzle, both endings, codex panel, save/load persistence,
// mobile viewport, and a basic perf probe. Zero pageerror/console.error expected.

async function collectErrors(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  return errors;
}

async function startJourney(page) {
  await page.goto('/');
  await page.getByRole('button', { name: '举灯入巷'}).click();
  await expect(page.locator('.chapter-screen')).toBeVisible();
}

async function goToStation(page, n) {
  // n: 1..12
  await page.getByRole('button', { name: '打开街区模型与路线'}).click();
  await page.locator('.map-locations').waitFor();
  await page.waitForTimeout(800); // let 3D VillageCanvas + fade settle; avoids click-coordinate race
  await page.locator('.map-locations').getByRole('button', { name: new RegExp(`第 ${String(n).padStart(2, '0')} 站`)}).click();
  // S11 naming gate: confirm skip if it appears.
  const skipBtn = page.getByRole('button', { name: '仍要跳过'});
  if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await skipBtn.click();
  }
  await expect(page.locator('.chapter-number')).toHaveText(String(n).padStart(2, '0'));
}

async function openExploration(page) {
  await page.getByRole('button', { name: /进入.*的三维现场进行探索/}).click();
  await expect(page.getByRole('dialog', { name: /现场探索/})).toBeVisible();
  await expect(page.locator('.explore-hotspot-button').first()).toBeVisible({ timeout: 15000});
}

async function closeExploration(page) {
  await page.getByRole('button', { name: '离开现场，返回叙事'}).click();
  await expect(page.getByRole('dialog', { name: /现场探索/})).toBeHidden();
}

test('phase4: 12-station narrative walk (no exploration stress)', async ({ page}) => {
  const errors = await collectErrors(page);
  await page.setViewportSize({ width: 1440, height: 900});
  await startJourney(page);

  for (let n = 1; n <= 12; n += 1) {
    if (n > 1) await goToStation(page, n);
    await expect(page.locator('.chapter-screen')).toBeVisible();
    await expect(page.locator('.chapter-copy')).toContainText(/./);
    // Narrative interaction available (investigate or puzzle input or ending).
    await expect(page.locator('.interaction-card')).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test('phase4: exploration spot-checks at S1/S6/S10', async ({ page}) => {
  const errors = await collectErrors(page);
  await page.setViewportSize({ width: 1440, height: 900});
  await startJourney(page);
  for (const n of [1, 6, 10]) {
    if (n > 1) await goToStation(page, n);
    await openExploration(page);
    const count = await page.locator('.explore-hotspot-button').count();
    expect(count, `station ${n} hotspots`).toBeGreaterThanOrEqual(1);
    await closeExploration(page);
    await page.waitForTimeout(1000); // let WebGL context release
  }
  expect(errors).toEqual([]);
});

test('phase4: S11 naming puzzle gates progress, solves with 顾秋禾、陆守成', async ({ page}) => {
  const errors = await collectErrors(page);
  await page.setViewportSize({ width: 1440, height: 900});
  await startJourney(page);
  await goToStation(page, 11);

  // Try to skip forward without solving -> confirm dialog appears.
  await page.getByRole('button', { name: '下一站'}).click();
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await page.getByRole('button', { name: '返回解谜'}).click();

  // Solve naming puzzle.
  await page.getByLabel(/填写核名答案|分别写出/).fill('顾秋禾、陆守成');
  await page.getByRole('button', { name: '核对姓名'}).click();
  // After solving, forward nav works.
  await page.getByRole('button', { name: '下一站'}).click();
  await expect(page.locator('.chapter-number')).toHaveText('12');
  expect(errors).toEqual([]);
});

test('phase4: S12 seven lamps then ending_release', async ({ page}) => {
  const errors = await collectErrors(page);
  await page.setViewportSize({ width: 1440, height: 900});
  await startJourney(page);
  await goToStation(page, 12);
  await openExploration(page);

  const order = ['尸狗', '伏矢', '雀阴', '吞贼', '非毒', '除秽', '臭肺'];
  await page.getByRole('button', { name: /解谜：七盏灯/}).click();
  for (const name of order) {
    await page.getByRole('button', { name: new RegExp(`点亮${name}之灯`)}).click();
  }
  await expect(page.getByRole('status')).toContainText('七盏灯次第亮起');
  await closeExploration(page);

  // Choose the release ending.
  await page.locator('.ending-choices').getByRole('button', { name: '归灯'}).click();
  await expect(page.locator('.ending-screen')).toBeVisible({ timeout: 15000});
  await expect(page.locator('.ending-screen')).toContainText(/天亮/);
  expect(errors).toEqual([]);
});

test('phase4: ending_called via restart', async ({ page}) => {
  const errors = await collectErrors(page);
  await page.setViewportSize({ width: 1440, height: 900});
  await startJourney(page);
  await goToStation(page, 12);
  await page.locator('.ending-choices').getByRole('button', { name: '留灯守巷'}).click();
  await expect(page.locator('.ending-screen')).toBeVisible({ timeout: 15000});
  // Restart from ending -> back to intro, then start again.
  await page.getByRole('button', { name: /重新走一遍/}).click();
  await page.getByRole('button', { name: '举灯入巷'}).click();
  await expect(page.locator('.chapter-screen')).toBeVisible();
  await expect(page.locator('.chapter-number')).toHaveText('01');
  expect(errors).toEqual([]);
});

test('phase4: codex panel filter and search', async ({ page}) => {
  const errors = await collectErrors(page);
  await page.setViewportSize({ width: 1440, height: 900});
  await startJourney(page);
  await page.getByRole('button', { name: /史料与创作边界/}).click();
  const dialog = page.getByRole('dialog', { name: '史料来源与民俗志'});
  await expect(dialog).toBeVisible();
  // Switch to codex tab.
  await dialog.getByRole('tab', { name: '民俗志'}).click();
  await expect(dialog.locator('.codex-item').first()).toBeVisible();
  const allCount = await dialog.locator('.codex-item').count();
  expect(allCount).toBeGreaterThanOrEqual(30);
  // Filter to 文献.
  await dialog.getByRole('button', { name: '文献'}).click();
  await expect(dialog.locator('.codex-count')).toContainText('共 20 条');
  // auto-animate keeps removed items in DOM briefly; wait for settle.
  await page.waitForTimeout(1200);
  const docCount = await dialog.locator('.codex-item:visible').count();
  expect(docCount).toBe(20);
  expect(docCount).toBeGreaterThanOrEqual(15);
  expect(docCount).toBeLessThan(allCount);
  // Search.
  await dialog.getByRole('button', { name: '全部'}).click();
  await expect(dialog.locator('.codex-count')).toContainText('共 36 条');
  await dialog.getByLabel('搜索民俗志').fill('南齐书');
  await expect(dialog.locator('.codex-count')).toContainText('共 1 条');
  await page.waitForTimeout(1200);
  const searchCount = await dialog.locator('.codex-item:visible').count();
  expect(searchCount).toBeGreaterThanOrEqual(1);
  // Fiction boundary label visible on entries.
  await expect(dialog.locator('.codex-item').first()).toContainText(/文献|口头|游戏虚构/);
  await dialog.getByRole('button', { name: '关闭'}).click();
  expect(errors).toEqual([]);
});

test('phase4: save/load persists inventory and puzzle progress', async ({ page}) => {
  const errors = await collectErrors(page);
  await page.setViewportSize({ width: 1440, height: 900});
  await startJourney(page);
  await goToStation(page, 5);
  await openExploration(page);
  await page.getByRole('button', { name: /拾取：酒壶/}).click();
  await expect(page.getByRole('status')).toContainText('拾取了');
  await closeExploration(page);

  await page.reload();
  await expect(page.locator('.chapter-screen')).toBeVisible();
  // Station persists.
  await expect(page.locator('.chapter-number')).toHaveText('05');
  // Inventory persists.
  await goToStation(page, 5);
  await openExploration(page);
  await page.getByRole('button', { name: /打开行囊/}).click();
  await expect(page.getByRole('button', { name: '查看：酒壶'})).toBeVisible();
  expect(errors).toEqual([]);
});

test('phase4: mobile 390x844 — explore, inventory, dial puzzle', async ({ page}) => {
  const errors = await collectErrors(page);
  await page.setViewportSize({ width: 390, height: 844});
  await startJourney(page);
  await goToStation(page, 4);
  await openExploration(page);
  const count = await page.locator('.explore-hotspot-button').count();
  expect(count).toBeGreaterThanOrEqual(3);
  // Dial puzzle usable on small screen.
  await page.getByRole('button', { name: /解谜：.*转盘锁/}).click();
  const downs = page.getByRole('button', { name: /向下拨一位/});
  await downs.nth(0).click();
  await downs.nth(0).click();
  const ups = page.getByRole('button', { name: /向上拨一位/});
  for (let i = 0; i < 4; i += 1) await ups.nth(2).click();
  await page.getByRole('button', { name: '试开此锁'}).click();
  await expect(page.getByRole('status')).toContainText('锁开了');
  await page.screenshot({ path: '/tmp/phase4-mobile-dial.png'});
  expect(errors).toEqual([]);
});

test('phase4: perf probe — exploration with all effects', async ({ page}) => {
  const errors = await collectErrors(page);
  await page.setViewportSize({ width: 1440, height: 900});
  await startJourney(page);
  await goToStation(page, 5);
  await openExploration(page);
  // Headless uses software GL; rAF fps is not representative of real hardware.
  // We only assert the scene renders and stays error-free under load.
  await page.waitForTimeout(3000);
  await expect(page.locator('.explore-scene canvas')).toBeVisible();
  const fps = await page.evaluate(() => new Promise((resolve) => {
    let frames = 0;
    const start = performance.now();
    const tick = () => {
      frames += 1;
      if (performance.now() - start < 2000) requestAnimationFrame(tick);
      else resolve(Math.round(frames / 2));
    };
    requestAnimationFrame(tick);
  }));
  console.log(`headless fps (informational only): ${fps}`);
  expect(errors).toEqual([]);
});
