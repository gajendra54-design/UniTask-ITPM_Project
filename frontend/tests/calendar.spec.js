import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';
const TEST_EMAIL = 'aga.lochana@gmail.com';
const TEST_PASSWORD = 'AN0032tnm%^';

// Helper: login and navigate to calendar
async function loginAndGoToCalendar(page) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.fill('input[type="password"]', TEST_PASSWORD);
  await page.getByRole('button', { name: /log in/i }).click();
  await page.waitForURL('**/dashboard', { timeout: 30000 });
  // Wait for dashboard to truly load by checking for the user profile element
  await expect(page.getByRole('button', { name: /u/i }).first()).toBeVisible();
  await page.waitForLoadState('networkidle');
  await page.goto(`${BASE_URL}/calendar`);
  await page.waitForLoadState('networkidle');
  await expect(page.getByPlaceholder('Search assignments...')).toBeVisible({ timeout: 10000 });
}

test('Calendar page loads with month view', async ({ page }) => {
  await loginAndGoToCalendar(page);
  await expect(page.getByPlaceholder('Search assignments...')).toBeVisible();
  await expect(page.getByRole('button', { name: 'TODAY', exact: true })).toBeVisible();
});

test('Calendar shows month, week, day and analytics tabs', async ({ page }) => {
  await loginAndGoToCalendar(page);
  await expect(page.getByRole('button', { name: 'month', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'week', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'day', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'analytics', exact: true })).toBeVisible();
});

test('Calendar can switch to week view', async ({ page }) => {
  await loginAndGoToCalendar(page);
  await page.getByRole('button', { name: 'week', exact: true }).click();
  await page.waitForTimeout(800);
  await expect(page.getByRole('button', { name: 'week', exact: true })).toBeVisible();
});

test('Calendar can switch to day view', async ({ page }) => {
  await loginAndGoToCalendar(page);
  await page.getByRole('button', { name: 'day', exact: true }).click();
  await page.waitForTimeout(800);
  await expect(page.getByRole('button', { name: 'day', exact: true })).toBeVisible();
});

test('Calendar analytics view loads', async ({ page }) => {
  await loginAndGoToCalendar(page);
  await page.getByRole('button', { name: 'analytics', exact: true }).click();
  await page.waitForTimeout(1000);
  await expect(page.getByText(/Calendar Analytics/i)).toBeVisible();
});

test('Calendar search bar accepts input', async ({ page }) => {
  await loginAndGoToCalendar(page);
  const searchInput = page.getByPlaceholder('Search assignments...');
  await searchInput.fill('Test Task');
  await expect(searchInput).toHaveValue('Test Task');
});

test('Calendar TODAY button is clickable', async ({ page }) => {
  await loginAndGoToCalendar(page);
  await page.getByRole('button', { name: 'TODAY', exact: true }).click();
  await page.waitForTimeout(500);
  await expect(page.getByRole('button', { name: 'TODAY', exact: true })).toBeVisible();
});

test('Calendar right panel shows daily overview', async ({ page }) => {
  await loginAndGoToCalendar(page);
  await expect(page.getByText(/DAILY OVERVIEW/i)).toBeVisible();
});

test('Calendar right panel shows workload tracker', async ({ page }) => {
  await loginAndGoToCalendar(page);
  await expect(page.getByText(/WORKLOAD/i)).toBeVisible();
});

test('Calendar right panel shows task limit tracker', async ({ page }) => {
  await loginAndGoToCalendar(page);
  await expect(page.getByText(/TASK LIMIT/i)).toBeVisible();
});