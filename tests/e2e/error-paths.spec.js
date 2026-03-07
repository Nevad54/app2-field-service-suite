const { test, expect } = require('@playwright/test');

async function apiLogin(request, username, password) {
  const response = await request.post('http://localhost:3002/api/auth/login', {
    data: { username, password },
  });
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  expect(payload.token).toBeTruthy();
  return payload.token;
}

async function loginStaff(page, username, password = '1111') {
  await page.goto('/login');
  await page.getByLabel('Username').fill(username);
  await page.getByRole('textbox', { name: /^Password$/ }).fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/dashboard/);
}

test.describe.serial('Error and guardrail UI paths', () => {
  test('dispatcher cannot delete quote (admin-only API path shows UI error)', async ({ page, request }) => {
    const adminToken = await apiLogin(request, 'admin', '1111');
    const customersRes = await request.get('http://localhost:3002/api/customers', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(customersRes.ok()).toBeTruthy();
    const customers = await customersRes.json();
    expect(customers.length).toBeGreaterThan(0);

    const quoteTitle = `E2E Protected Delete ${Date.now()}`;
    const quoteRes = await request.post('http://localhost:3002/api/quotes', {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        customerId: customers[0].id,
        title: quoteTitle,
        description: 'Role guardrail validation',
        items: [{ description: 'Line', quantity: 1, unit_price: 25 }],
      },
    });
    expect(quoteRes.status()).toBe(201);

    await loginStaff(page, 'dispatcher', '1111');
    await page.goto('/quotes');

    const quoteCard = page.locator('.invoice-card', { hasText: quoteTitle }).first();
    await expect(quoteCard).toBeVisible();

    page.once('dialog', (dialog) => dialog.accept());
    await quoteCard.getByRole('button', { name: /Delete/ }).click();

    const errorBox = page.locator('.form-error-box');
    await expect(errorBox).toBeVisible();
    await expect(errorBox).toContainText(/forbidden|request failed/i);
    await expect(quoteCard).toBeVisible();
  });

  test('jobs create modal closes on Escape', async ({ page }) => {
    await loginStaff(page, 'admin', '1111');
    await page.goto('/jobs');

    await page.getByRole('button', { name: '+ Create Job' }).click();
    await expect(page.getByRole('heading', { name: /Create New Job/ })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('heading', { name: /Create New Job/ })).toHaveCount(0);
  });

  test('recurring delete can be cancelled from confirm dialog', async ({ page, request }) => {
    const adminToken = await apiLogin(request, 'admin', '1111');
    const customersRes = await request.get('http://localhost:3002/api/customers', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(customersRes.ok()).toBeTruthy();
    const customers = await customersRes.json();
    expect(customers.length).toBeGreaterThan(0);

    const recurringTitle = `E2E Cancel Delete ${Date.now()}`;
    const createRecurring = await request.post('http://localhost:3002/api/recurring', {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        customerId: customers[0].id,
        title: recurringTitle,
        frequency: 'monthly',
        interval_value: 1,
        interval_unit: 'months',
      },
    });
    expect(createRecurring.status()).toBe(201);

    await loginStaff(page, 'admin', '1111');
    await page.goto('/recurring');

    const recurringCard = page.locator('.item-card', { hasText: recurringTitle }).first();
    await expect(recurringCard).toBeVisible();

    page.once('dialog', (dialog) => dialog.dismiss());
    await recurringCard.getByRole('button', { name: 'Delete' }).click();

    await expect(recurringCard).toBeVisible();
    await expect(page.locator('.form-success-box').filter({ hasText: 'Recurring maintenance deleted.' })).toHaveCount(0);
  });

  test('team page surfaces API outage error when technicians endpoint is unreachable', async ({ page }) => {
    await loginStaff(page, 'admin', '1111');

    await page.route('**/api/technicians', async (route) => {
      await route.abort('failed');
    });

    await page.goto('/team');

    const errorBox = page.locator('.form-error-box');
    await expect(errorBox).toBeVisible();
    await expect(errorBox).toContainText(/failed|request/i);
    await expect(page.locator('.loading')).toHaveCount(0);
  });

  test('team page keeps loading state visible during high latency then resolves', async ({ page }) => {
    await loginStaff(page, 'admin', '1111');

    await page.route('**/api/technicians', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      await route.continue();
    });

    await page.goto('/team');
    await expect(page.getByText('Loading technicians...')).toBeVisible();
    await expect(page.getByText('Loading technicians...')).toHaveCount(0, { timeout: 15000 });
    await expect(page.locator('.team-grid, .empty-state').first()).toBeVisible();
  });

  test('technician deep-link attempts to restricted routes show capability guidance', async ({ page }) => {
    await loginStaff(page, 'technician', '1111');

    const restrictedRoutes = [
      { path: '/users', permission: 'accounts.manage' },
      { path: '/export', permission: 'exports.view' },
      { path: '/quotes', permission: 'quotes.manage' },
      { path: '/inventory', permission: 'inventory.manage' },
    ];

    for (const entry of restrictedRoutes) {
      await page.goto(entry.path);
      await expect(page).toHaveURL(new RegExp(entry.path));
      await expect(page.getByRole('heading', { name: 'Access Restricted' })).toBeVisible();
      await expect(
        page.locator('main .card .hint').filter({ hasText: `Requires capability: ${entry.permission}` }).first()
      ).toBeVisible();
      await page.getByRole('link', { name: 'Go to Dashboard' }).click();
      await expect(page).toHaveURL(/\/dashboard/);
    }
  });
});
