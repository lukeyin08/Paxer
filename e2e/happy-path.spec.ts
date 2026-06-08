import { test, expect } from '@playwright/test';

/**
 * Happy path (Section 12): sign in as the demo account → create a case with a
 * duplicate charge → run the audit → draft a dispute → approve → simulated send
 * → log a recovery → see the success fee. Self-contained: it creates its own
 * case, so it can run repeatedly without depending on seeded mutable state.
 */
test('full patient loop: case → findings → dispute → simulated send → recovery', async ({ page }) => {
  // 1. Sign in via the demo button.
  await page.goto('/login');
  await page.getByRole('button', { name: 'View the demo' }).click();
  await page.waitForURL('**/app');
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();

  // 2. Create a case manually with a duplicated line item.
  await page.goto('/app/cases/new');
  await page.getByRole('tab', { name: 'Manual entry' }).click();
  const title = `E2E test case ${Date.now()}`;
  await page.getByLabel('Case title').fill(title);
  await page.getByLabel('Provider').fill('Test Hospital');

  // First line item row.
  await page.getByPlaceholder('CT scan, head').first().fill('CT scan, head');
  await page.getByPlaceholder('70450').first().fill('70450');
  await page.getByPlaceholder('1240').first().fill('1240');
  // Add a second, identical row (the duplicate).
  await page.getByRole('button', { name: 'Add line item' }).click();
  await page.getByPlaceholder('CT scan, head').nth(1).fill('CT scan, head');
  await page.getByPlaceholder('70450').nth(1).fill('70450');
  await page.getByPlaceholder('1240').nth(1).fill('1240');

  await page.getByRole('button', { name: 'Create case' }).click();
  await page.waitForURL('**/app/cases/**');

  // 3. Run the audit and expect a duplicate finding.
  await page.getByRole('button', { name: 'Run audit' }).click();
  await expect(page.getByText(/Duplicate charge/i).first()).toBeVisible({ timeout: 30_000 });

  // 4. Start a dispute on the finding.
  await page.getByRole('link', { name: 'Start dispute' }).first().click();
  await page.waitForURL('**/dispute**');
  await page.getByRole('button', { name: 'Generate dispute draft' }).click();
  await page.waitForURL('**/app/disputes/**');

  // 5. Approve → mark as sent (patient sends it themselves) → log a "Won" response.
  await page.getByRole('button', { name: 'Approve draft' }).click();
  await page.getByRole('button', { name: /mark as sent/i }).click();
  await expect(page.getByText(/Marked as sent/i).first()).toBeVisible();
  await page.getByRole('button', { name: 'Won', exact: true }).click();

  // 6. Record a recovery and see the success fee.
  await page.getByRole('link', { name: 'Record recovery' }).click();
  await page.waitForURL('**/app/recoveries**');
  await page.getByLabel('Amount recovered').fill('1240');
  await expect(page.getByText(/Paxer success fee/i)).toBeVisible();
  await page.getByRole('button', { name: 'Record recovery' }).click();

  // Recoveries history should now show the recorded amount.
  await expect(page.getByText('Recovered', { exact: false }).first()).toBeVisible();
  await expect(page.getByText('$1,240').first()).toBeVisible();
});
