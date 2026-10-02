import { expect, test} from '@playwright/test';

// Phase 3 verification: exploration hotspots, inventory, and the three puzzles.
test('phase3: explore hotspots, pickup, inventory combine, and S5 divination flow', async ({ page}) => {
const errors: string[] = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`);});

await page.setViewportSize({ width: 1440, height: 900});
await page.goto('/');
await page.getByRole('button', { name: '举灯入巷'}).click();
await expect(page.locator('.chapter-screen')).toBeVisible();

// Jump to station 05 via map.
await page.getByRole('button', { name: '打开街区模型与路线'}).click();
await page.locator('.map-locations').getByRole('button', { name: /第 05 站/}).click();
await expect(page.locator('.chapter-number')).toHaveText('05');

// Open exploration.
await page.getByRole('button', { name: /进入.*的三维现场进行探索/}).click();
await expect(page.getByRole('dialog', { name: /现场探索/})).toBeVisible();
// Hotspot buttons are projected; at least the 5 S5 hotspots should exist.
await expect(page.locator('.explore-hotspot-button').first()).toBeVisible({ timeout: 15000});
const hotspotCount = await page.locator('.explore-hotspot-button').count();
expect(hotspotCount).toBeGreaterThanOrEqual(5);

// Investigate the altar (investigate hotspot).
await page.getByRole('button', { name: /调查：祭案/}).click();
await expect(page.locator('.hotspot-card')).toContainText('酒盏');
await page.getByRole('button', { name: '收起'}).click();

// Pickup wine jar via its hotspot button.
await page.getByRole('button', { name: /拾取：酒壶/}).click();
await expect(page.getByRole('status')).toContainText('拾取了');

// Open inventory, examine the wine jar.
await page.getByRole('button', { name: /打开行囊/}).click();
await expect(page.getByRole('dialog', { name: '行囊'})).toBeVisible();
await page.getByRole('button', { name: '查看：酒壶'}).click();
await expect(page.locator('.item-detail')).toBeVisible();

// Pickup the empty cup too, then combine.
await page.getByRole('button', { name: /打开行囊/}).click(); // close inventory
await page.getByRole('button', { name: /拾取：空酒盏/}).click();
await expect(page.getByRole('status')).toContainText('拾取了');
await page.getByRole('button', { name: /打开行囊/}).click();
await page.getByRole('button', { name: '组合物品'}).click();
await page.getByRole('button', { name: '选择组合：酒壶'}).click();
await page.getByRole('button', { name: '选择组合：空酒盏'}).click();
await page.getByRole('button', { name: '合成', exact: true}).click();
await expect(page.getByRole('status')).toContainText('酒入盏');
await expect(page.getByRole('button', { name: '查看：盛满酒的酒盏'})).toBeVisible();

// S5 divination puzzle: 6 coin tosses -> 困卦 -> 利用祭祀.
await page.getByRole('button', { name: /打开行囊/}).click(); // close
await page.getByRole('button', { name: /解谜：三枚铜钱/}).click();
const tossButton = page.getByRole('button', { name: /掷铜钱/});
for (let i = 0; i < 6; i += 1) await tossButton.click();
await expect(page.locator('.divination-result')).toContainText('困卦');
await expect(page.locator('.divination-result')).toContainText('利用祭祀');
await expect(page.locator('.fiction-boundary')).toContainText('不断吉凶');
await page.getByRole('button', { name: '去祭案看看'}).click();

// Use the filled wine cup on the altar -> puzzle solved.
await page.getByRole('button', { name: /调查：祭案/}).click();
await page.getByRole('button', { name: /使用【盛满酒的酒盏】/ }).click();
await expect(page.getByRole('status')).toContainText('利用祭祀');

expect(errors).toEqual([]);
});

test('phase3: S4 dial puzzle solves with 狗→鼠→龙', async ({ page}) => {
const errors: string[] = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
await page.setViewportSize({ width: 1440, height: 900});
await page.goto('/');
await page.getByRole('button', { name: '举灯入巷'}).click();
await page.getByRole('button', { name: '打开街区模型与路线'}).click();
await page.locator('.map-locations').getByRole('button', { name: /第 04 站/}).click();
await expect(page.locator('.chapter-number')).toHaveText('04');
await page.getByRole('button', { name: /进入.*的三维现场进行探索/}).click();
await expect(page.locator('.explore-hotspot-button').first()).toBeVisible({ timeout: 15000});

// Read the manuscript first.
await page.getByRole('button', { name: /调查：命书残页/}).click();
await expect(page.locator('.hotspot-card')).toContainText('时上起，遁得之');
await expect(page.locator('.hotspot-card')).toContainText('涂黑');
await page.getByRole('button', { name: '收起'}).click();

// Open the dial lock. Dials start at 鼠(0). Target: 狗(10), 鼠(0), 龙(4).
await page.getByRole('button', { name: /解谜：.*转盘锁/}).click();
// Dial 1: 鼠 -> 狗 needs -2 (or +10). Click down twice.
const downs = page.getByRole('button', { name: /向下拨一位/});
await downs.nth(0).click();
await downs.nth(0).click();
// Dial 3: 鼠 -> 龙 needs +4.
const ups = page.getByRole('button', { name: /向上拨一位/});
for (let i = 0; i < 4; i += 1) await ups.nth(2).click();
await expect(page.locator('.dial-value').nth(0)).toHaveText('狗');
await expect(page.locator('.dial-value').nth(1)).toHaveText('鼠');
await expect(page.locator('.dial-value').nth(2)).toHaveText('龙');
await expect(page.locator('.fiction-boundary')).toContainText('不认可任何命理断言');
await page.getByRole('button', { name: '试开此锁'}).click();
await expect(page.getByRole('status')).toContainText('锁开了');
expect(errors).toEqual([]);
});

test('phase3: S12 seven lamps light in order', async ({ page}) => {
const errors: string[] = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
await page.setViewportSize({ width: 1440, height: 900});
await page.goto('/');
await page.getByRole('button', { name: '举灯入巷'}).click();
await page.getByRole('button', { name: '打开街区模型与路线'}).click();
await page.locator('.map-locations').getByRole('button', { name: /第 12 站/}).click();
await expect(page.locator('.chapter-number')).toHaveText('12');
await page.getByRole('button', { name: /进入.*的三维现场进行探索/}).click();
await expect(page.locator('.explore-hotspot-button').first()).toBeVisible({ timeout: 15000});

await page.getByRole('button', { name: /解谜：七盏灯/}).click();
const order = ['尸狗', '伏矢', '雀阴', '吞贼', '非毒', '除秽', '臭肺'];
// Wrong first click -> all extinguish.
await page.getByRole('button', { name: '点亮伏矢之灯'}).click();
await expect(page.locator('.puzzle-miss')).toBeVisible();
// Correct order.
for (const name of order) {
await page.getByRole('button', { name: `点亮${name}之灯`}).click();
}
await expect(page.getByRole('status')).toContainText('七盏灯次第亮起');
expect(errors).toEqual([]);
});

test('phase3: keyboard traversal of hotspots works', async ({ page}) => {
await page.setViewportSize({ width: 1440, height: 900});
await page.goto('/');
await page.getByRole('button', { name: '举灯入巷'}).click();
await page.getByRole('button', { name: '打开街区模型与路线'}).click();
await page.locator('.map-locations').getByRole('button', { name: /第 01 站/}).click();
await page.getByRole('button', { name: /进入.*的三维现场进行探索/}).click();
const first = page.locator('.explore-hotspot-button').first();
await expect(first).toBeVisible({ timeout: 15000});
await first.focus();
await expect(first).toBeFocused();
await page.keyboard.press('ArrowRight');
const second = page.locator('.explore-hotspot-button').nth(1);
await expect(second).toBeFocused();
await page.keyboard.press('Enter');
await expect(page.locator('.hotspot-card')).toBeVisible();
await page.keyboard.press('Escape');
});
