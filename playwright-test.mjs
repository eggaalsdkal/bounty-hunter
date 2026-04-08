import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
const page = await context.newPage();

console.log('Starting Playwright QA...');

// 1. Open auth page
await page.goto('http://127.0.0.1:5000/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await page.screenshot({ path: '/home/user/workspace/screenshot-01-auth-page.png', type: 'png' });
console.log('1. Auth page screenshot taken');

// 2. Register new user
await page.click('[data-testid="button-mode-register"]');
await page.waitForTimeout(500);
await page.fill('[data-testid="input-display-name"]', '暗夜獵手');
await page.fill('[data-testid="input-email"]', 'hunter2@bounty.io');
await page.fill('[data-testid="input-password"]', 'password123');
await page.waitForTimeout(500);
await page.screenshot({ path: '/home/user/workspace/screenshot-02-register-form.png', type: 'png' });
console.log('2. Register form screenshot taken');

// Submit registration
await page.click('[data-testid="button-submit"]');
await page.waitForTimeout(4000);
await page.screenshot({ path: '/home/user/workspace/screenshot-03-dashboard.png', type: 'png' });
console.log('3. Dashboard screenshot taken');

// 4. Go to card collection
await page.click('[data-testid="nav-cards"]');
await page.waitForTimeout(2000);
await page.screenshot({ path: '/home/user/workspace/screenshot-04-card-collection-before-draw.png', type: 'png' });
console.log('4a. Card collection (before draw) screenshot taken');

// Click draw button
const drawBtn = await page.$('[data-testid="button-daily-draw"]');
if (drawBtn) {
  await drawBtn.click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/home/user/workspace/screenshot-04-card-draw-result.png', type: 'png' });
  console.log('4b. Card draw result screenshot taken');

  // Close the dialog by pressing Escape
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);
}

// 5. Go to quest board
await page.click('[data-testid="nav-bounty-board"]');
await page.waitForTimeout(2000);
await page.screenshot({ path: '/home/user/workspace/screenshot-05-quest-board.png', type: 'png' });
console.log('5. Quest board screenshot taken');

// Click on first quest to open dialog
const questCard = await page.$('[data-testid^="quest-card-"]');
if (questCard) {
  await questCard.click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/home/user/workspace/screenshot-06-quest-detail.png', type: 'png' });
  console.log('6. Quest detail dialog screenshot taken');

  // Accept the quest
  const acceptBtn = await page.$('[data-testid="button-accept-quest"]');
  if (acceptBtn) {
    await acceptBtn.click();
    await page.waitForTimeout(2000);
  }
}

// Go to quest board again to see accepted status
await page.click('[data-testid="nav-bounty-board"]');
await page.waitForTimeout(2000);
await page.screenshot({ path: '/home/user/workspace/screenshot-07-quest-accepted.png', type: 'png' });
console.log('7. Quest board (with accepted quest) screenshot taken');

// 8. Go to profile
await page.click('[data-testid="nav-profile"]');
await page.waitForTimeout(2000);
await page.screenshot({ path: '/home/user/workspace/screenshot-08-profile.png', type: 'png' });
console.log('8. Profile screenshot taken');

await browser.close();
console.log('\nAll screenshots saved to /home/user/workspace/');
