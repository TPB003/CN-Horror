import { expect, test } from '@playwright/test';

test('phase3 screenshots: desktop explore + mobile explore', async ({ page }) => {
  // Desktop
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.getByRole('button', { name: '举灯入巷' }).click();
  await page.getByRole('button', { name: '打开街区模型与路线' }).click();
  await page.locator('.map-locations').getByRole('button', { name: /第 05 站/ }).click();
  await page.getByRole('button', { name: /进入.*的三维现场进行探索/ }).click();
  await expect(page.locator('.explore-hotspot-button').first()).toBeVisible({ timeout: 15000 });
  await page.waitForTimeout(2500); // let the 3D scene settle
  await page.screenshot({ path: '/tmp/phase3-desktop-explore.png' });
  // Open a puzzle for the second shot
  await page.getByRole('button', { name: /解谜：三枚铜钱/ }).click();
  await page.getByRole('button', { name: /掷铜钱/ }).click();
  await page.getByRole('button', { name: /掷铜钱/ }).click();
  await page.screenshot({ path: '/tmp/phase3-desktop-divination.png' });
  await page.getByRole('button', { name: '离开现场，返回叙事' }).click();

  // Mobile
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/');
  await page.getByRole('button', { name: '举灯入巷' }).click();
  await page.getByRole('button', { name: '打开街区模型与路线' }).click();
  await page.locator('.map-locations').getByRole('button', { name: /第 04 站/ }).click();
  await page.getByRole('button', { name: /进入.*的三维现场进行探索/ }).click();
  await expect(page.locator('.explore-hotspot-button').first()).toBeVisible({ timeout: 15000 });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: '/tmp/phase3-mobile-explore.png' });
});
