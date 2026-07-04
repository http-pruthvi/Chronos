import { test, expect } from '@playwright/test';

test.describe('Chronos HRMS E2E Workflows', () => {
  
  test('should login successfully as Admin and view dashboard stats', async ({ page }) => {
    // 1. Visit Login Page
    await page.goto('/login');
    await expect(page).toHaveTitle(/Chronos/);

    // 2. Perform Login
    await page.fill('input[type="email"]', 'admin@demo.com');
    await page.fill('input[type="password"]', 'DemoPassword123!');
    await page.click('button[type="submit"]');

    // 3. Verify Dashboard Redirect
    await expect(page).toHaveURL('http://localhost:5173/');
    await expect(page.locator('h1')).toContainText('Analytics Overview');

    // 4. Verify Dashboard Widgets
    await expect(page.locator('text=Headcount')).toBeVisible();
    await expect(page.locator('text=Attendance Rate')).toBeVisible();
  });

  test('should log employee attendance check-in and check-out', async ({ page }) => {
    // 1. Login as Employee
    await page.goto('/login');
    await page.fill('input[type="email"]', 'employee@demo.com');
    await page.fill('input[type="password"]', 'DemoPassword123!');
    await page.click('button[type="submit"]');

    // 2. Go to Attendance Page
    await page.click('text=Attendance');
    await expect(page).toHaveURL('http://localhost:5173/attendance');

    // 3. Click Clock In if not checked in
    const clockInBtn = page.locator('button:has-text("Clock In")');
    if (await clockInBtn.isVisible()) {
      await clockInBtn.click();
      await expect(page.locator('text=ACTIVE SHIFT')).toBeVisible();
    }

    // 4. Click Clock Out if in shift
    const clockOutBtn = page.locator('button:has-text("Clock Out")');
    if (await clockOutBtn.isVisible()) {
      await clockOutBtn.click();
      await expect(page.locator('text=Shift logged successfully today.')).toBeVisible();
    }
  });

  test('should submit leave request and approve it as Manager', async ({ page }) => {
    // 1. Login as Employee to apply
    await page.goto('/login');
    await page.fill('input[type="email"]', 'employee@demo.com');
    await page.fill('input[type="password"]', 'DemoPassword123!');
    await page.click('button[type="submit"]');

    // 2. Go to Leaves Page
    await page.click('text=Leave Requests');
    await page.selectOption('select', 'Casual Leave'); // select option by label or value
    
    // Fill date inputs
    await page.fill('input[type="date"] >> nth=0', '2026-09-01');
    await page.fill('input[type="date"] >> nth=1', '2026-09-03');
    await page.fill('textarea', 'E2E Test Leave Request');
    await page.click('button[type="submit"]');

    // 3. Verify success message and pending state
    await expect(page.locator('text=applied successfully')).toBeVisible();
    
    // 4. Logout employee
    await page.click('text=Sign Out');

    // 5. Login as Manager to approve
    await page.fill('input[type="email"]', 'manager@demo.com');
    await page.fill('input[type="password"]', 'DemoPassword123!');
    await page.click('button[type="submit"]');

    // 6. Go to Approvals Page
    await page.click('text=Approvals');
    await expect(page).toHaveURL('http://localhost:5173/approvals');

    // 7. Click Approve
    const approveBtn = page.locator('button:has-text("Approve")').first();
    if (await approveBtn.isVisible()) {
      await approveBtn.click();
      await expect(page.locator('text=approved successfully')).toBeVisible();
    }
  });
});
