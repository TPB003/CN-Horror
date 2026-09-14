import { expect, test } from '@playwright/test';

test('the route model, chapter navigation, source notes and clue journal work', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('归灯');
  await expect(page.getByRole('button', { name: '打开街区模型与路线' })).toBeVisible();
  await expect(page.getByRole('button', { name: '开启环境声' })).toBeVisible();

  await page.getByRole('button', { name: '举灯入巷' }).click();
  await expect(page.locator('.chapter-screen')).toBeVisible();
  await expect(page.getByRole('button', { name: '关闭环境声' })).toBeVisible();
  await expect(page.locator('.chapter-number')).toHaveText('01');
  await page.getByRole('button', { name: '调查并记录线索' }).click();
  await expect(page.getByRole('status')).toContainText('线索已记入手记');
  await page.getByRole('button', { name: /史料与创作边界/ }).click();
  const sourceDialog = page.getByRole('dialog');
  await expect(sourceDialog).toContainText('史料内容');
  await expect(sourceDialog).toContainText('本作转译');
  const closeDialog = sourceDialog.getByRole('button', { name: '关闭', exact: true });
  const lastSourceLink = sourceDialog.getByRole('link').last();
  await expect(closeDialog).toBeFocused();
  await lastSourceLink.focus();
  await page.keyboard.press('Tab');
  await expect(closeDialog).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: /史料与创作边界/ })).toBeFocused();

  await page.getByRole('button', { name: '打开街区模型与路线' }).click();
  await expect(page.locator('.map-locations button')).toHaveCount(12);
  await page.locator('.map-locations').getByRole('button', { name: /第 05 站/ }).click();
  await expect(page.locator('.chapter-number')).toHaveText('05');
  await page.getByRole('button', { name: '打开线索手记，已有 1 条' }).click();
  await expect(page.getByRole('dialog')).toContainText('母亲的信与被挤在一起的字');

  await page.reload();
  await expect(page.locator('.chapter-number')).toHaveText('05');
  await page.getByRole('button', { name: '打开线索手记，已有 1 条' }).click();
  await expect(page.getByRole('dialog')).toContainText('母亲的信与被挤在一起的字');
});

test('all twelve single-screen stations lead to both endings and can restart', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.getByRole('button', { name: '举灯入巷' }).click();

  for (let index = 0; index < 12; index += 1) {
    await expect(page.locator('.chapter-number')).toHaveText(String(index + 1).padStart(2, '0'));
    if (index === 10 && await page.locator('.puzzle-input input').count()) {
      const answer = page.getByRole('textbox', { name: /分别写出红衣新娘与港口死者的姓名/ });
      await answer.fill('沈归');
      await page.getByRole('button', { name: '核对姓名' }).click();
      await expect(page.getByRole('status')).toContainText('检查祖宅嫁衣内衬和白衣领口');
      await answer.fill('顾秋禾、陆守成');
      await page.getByRole('button', { name: '核对姓名' }).click();
      await expect(page.getByRole('status')).toContainText('线索已记入手记');
    } else if (await page.locator('.choice-deck button').count()) {
      await page.locator('.choice-deck button').first().click();
    } else if (index < 11) {
      const inspect = page.getByRole('button', { name: '调查并记录线索' });
      if (await inspect.count()) await inspect.click();
    }

    if (index < 11) await page.getByRole('button', { name: '下一站' }).click();
  }

  await expect(page.locator('.ending-choices button')).toHaveCount(2);
  await page.locator('.ending-choices button').first().click();
  await expect(page.locator('.ending-screen')).toBeVisible();
  await expect(page.locator('.ending-screen h1')).toContainText('归灯');
  await page.getByRole('button', { name: '重新走一遍' }).click();
  await expect(page.getByRole('button', { name: '举灯入巷' })).toBeVisible();
  await expect(page.getByRole('button', { name: '开启环境声' })).toBeVisible();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('guideng-lianyungang-save-v1'))).toBeNull();

  // Play the other ending from its own valid Ink choice after the restart.
  await page.getByRole('button', { name: '举灯入巷' }).click();
  await page.getByRole('button', { name: '打开街区模型与路线' }).click();
  await page.locator('.map-locations').getByRole('button', { name: /第 12 站/ }).click();
  await expect(page.locator('.ending-choices button')).toHaveCount(2);
  await page.locator('.ending-choices button').last().click();
  await expect(page.locator('.ending-screen h1')).toContainText('留灯守巷');
  await page.getByRole('button', { name: '重新走一遍' }).click();
  await expect(page.getByRole('button', { name: '举灯入巷' })).toBeVisible();
});

test('an earlier choice leaves a visible branch trace after chapter navigation and reload', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.getByRole('button', { name: '举灯入巷' }).click();
  await page.getByRole('navigation', { name: '剧情章节' }).getByRole('button', { name: /第 03 站/ }).click();
  await expect(page.locator('.chapter-number')).toHaveText('03');
  await expect(page.locator('.choice-deck button')).toHaveCount(2);
  await page.locator('.choice-deck button').last().click();
  await page.getByRole('button', { name: '下一站' }).click();
  await expect(page.locator('.chapter-number')).toHaveText('04');
  await expect(page.locator('.branch-echo')).toContainText('你松开笔杆后');

  await page.reload();
  await expect(page.locator('.chapter-number')).toHaveText('04');
  await expect(page.locator('.branch-echo')).toContainText('你松开笔杆后');
});

test('the mobile screen keeps its primary interactions inside the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.getByRole('button', { name: '举灯入巷' }).click();
  await expect(page.getByRole('button', { name: '调查并记录线索' })).toBeVisible();
  await expect(page.getByRole('button', { name: '下一站' })).toBeVisible();
  await expect(page.getByRole('button', { name: '关闭环境声' })).toBeVisible();
  const bounds = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    height: document.documentElement.scrollHeight,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
  }));
  expect(bounds.width).toBeLessThanOrEqual(bounds.viewportWidth);
  expect(bounds.height).toBeLessThanOrEqual(bounds.viewportHeight);

  for (let index = 0; index < 12; index += 1) {
    const station = String(index + 1).padStart(2, '0');
    await expect(page.locator('.chapter-number')).toHaveText(station);
    const copy = await page.locator('.chapter-copy').boundingBox();
    expect(copy).not.toBeNull();
    expect(copy!.x).toBeGreaterThanOrEqual(0);
    expect(copy!.x + copy!.width).toBeLessThanOrEqual(390);
    if (index < 11) await page.getByRole('button', { name: '下一站' }).click();
  }

  await page.getByRole('button', { name: '打开街区模型与路线' }).click();
  await expect(page.locator('.map-locations button')).toHaveCount(12);
  const mapBounds = await page.locator('.overlay-panel').evaluate((panel) => ({
    clientHeight: panel.clientHeight,
    scrollHeight: panel.scrollHeight,
    width: panel.clientWidth,
  }));
  expect(mapBounds.width).toBeLessThanOrEqual(390);
  await page.keyboard.press('Escape');
  await expect(page.locator('.chapter-screen')).toBeVisible();
});
