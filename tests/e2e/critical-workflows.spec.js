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

async function createJob(request, token, body) {
  const response = await request.post('http://localhost:3002/api/jobs', {
    headers: { Authorization: `Bearer ${token}` },
    data: body,
  });
  expect(response.status()).toBe(201);
  return response.json();
}

async function loginStaff(page, username = 'admin', password = '1111') {
  await page.goto('/login');
  await page.getByLabel('Username').fill(username);
  await page.getByRole('textbox', { name: /^Password$/ }).fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/dashboard/);
}

test.describe.serial('Critical frontend-integrated workflows', () => {
  test('jobs lifecycle with checkout completion proof via UI', async ({ page, request }) => {
    const adminToken = await apiLogin(request, 'admin', '1111');
    const customersRes = await request.get('http://localhost:3002/api/customers', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(customersRes.ok()).toBeTruthy();
    const customers = await customersRes.json();
    expect(customers.length).toBeGreaterThan(0);

    const unique = Date.now();
    const title = `E2E Job ${unique}`;
    const created = await createJob(request, adminToken, {
      title,
      assignedTo: 'technician',
      status: 'assigned',
      priority: 'medium',
      location: 'E2E Site',
      category: 'maintenance',
      customerId: customers[0].id,
    });

    await loginStaff(page, 'technician', '1111');
    await page.goto('/jobs');

    const jobCard = page.locator('.tech-quick-item', { hasText: created.id }).first();
    await expect(jobCard).toBeVisible();
    await jobCard.getByRole('button', { name: 'Check In' }).click();
    await expect(page.getByText(`Checked in to ${created.id}.`)).toBeVisible();

    await jobCard.getByRole('button', { name: 'Complete' }).click();
    await expect(page.getByRole('heading', { name: `Complete Job ${created.id}` })).toBeVisible();
    const completionDialog = page.getByRole('dialog', { name: `Complete Job ${created.id}` });

    await completionDialog.getByLabel('Completion Notes').fill('Completed through Playwright E2E workflow.');
    await completionDialog.getByLabel('Customer Signature Name').fill('E2E Customer');
    await completionDialog.getByLabel('Evidence Summary').fill('Signature and completion proof captured.');
    await completionDialog.getByLabel('Customer confirmed completion').check();
    await completionDialog.getByRole('button', { name: /^Complete Job$/ }).click();

    await expect(page.getByText(`Completed ${created.id}.`)).toBeVisible();
  });

  test('quote create -> accept -> convert to job via UI', async ({ page }) => {
    const unique = Date.now();
    const quoteTitle = `E2E Quote ${unique}`;
    await loginStaff(page, 'admin', '1111');
    await page.goto('/quotes');

    await page.getByRole('button', { name: '+ Create Quote' }).click();
    await expect(page.getByRole('heading', { name: 'Create Quote' })).toBeVisible();
    const quoteDialog = page.locator('.modal-content.modal-lg').first();

    const customerSelect = quoteDialog.locator('select').first();
    await customerSelect.selectOption({ index: 1 });
    await quoteDialog.getByPlaceholder('Quote title').fill(quoteTitle);
    await quoteDialog.getByPlaceholder('Quote description').fill('Quote conversion UI workflow.');
    await quoteDialog.locator('.line-item-row input[placeholder="Service description"]').first().fill('E2E service line');
    await quoteDialog.getByRole('button', { name: /^Create Quote$/ }).click();

    const quoteCard = page.locator('.invoice-card', { hasText: quoteTitle }).first();
    await expect(quoteCard).toBeVisible();
    await quoteCard.getByRole('button', { name: /Accept/ }).click();
    await expect(page.getByText('Quote accepted successfully!')).toBeVisible();

    await quoteCard.getByRole('button', { name: 'Create Job' }).click();
    await expect(page.getByRole('heading', { name: 'Create Job from Quote' })).toBeVisible();
    const convertDialog = page.locator('.modal-content').filter({ hasText: 'Create Job from Quote' }).first();
    await convertDialog.getByRole('button', { name: /^Create Job$/ }).click();
    await expect(page.getByText('Quote converted to job successfully!')).toBeVisible();
  });

  test('recurring maintenance CRUD and schedule optimization apply via UI', async ({ page, request }) => {
    const adminToken = await apiLogin(request, 'admin', '1111');
    const customersRes = await request.get('http://localhost:3002/api/customers', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(customersRes.ok()).toBeTruthy();
    const customers = await customersRes.json();
    expect(customers.length).toBeGreaterThan(0);

    const unique = Date.now();
    const recurringTitle = `E2E Recurring ${unique}`;
    await loginStaff(page, 'admin', '1111');
    await page.goto('/recurring');

    await page.getByRole('button', { name: '+ Add Plan' }).click();
    const recurringDialog = page.locator('.modal-content').filter({ hasText: 'Add Recurring Plan' }).first();
    await recurringDialog.locator('select').first().selectOption(customers[0].id);
    await recurringDialog.locator('input').first().fill(recurringTitle);
    await recurringDialog.getByRole('button', { name: 'Create Plan' }).click();
    await expect(page.getByText('Recurring maintenance created.')).toBeVisible();

    const recurringCard = page.locator('.item-card', { hasText: recurringTitle }).first();
    await expect(recurringCard).toBeVisible();
    await recurringCard.getByRole('button', { name: 'Pause' }).click();
    await expect(page.getByText('Recurring maintenance marked paused.')).toBeVisible();
    await recurringCard.getByRole('button', { name: 'Activate' }).click();
    await expect(page.getByText('Recurring maintenance marked active.')).toBeVisible();

    page.once('dialog', (dialog) => dialog.accept());
    await recurringCard.getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByText('Recurring maintenance deleted.')).toBeVisible();

    await request.put('http://localhost:3002/api/settings/dispatch', {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { maxJobsPerTechnicianPerDay: 1, slaDueSoonDays: 1 },
    });
    for (let i = 0; i < 3; i += 1) {
      await createJob(request, adminToken, {
        title: `E2E Optimize ${unique}-${i}`,
        assignedTo: 'optimizer-tech-ui',
        status: 'assigned',
        priority: i === 0 ? 'low' : 'medium',
        location: 'E2E Optimize Site',
        category: 'general',
        customerId: customers[0].id,
        scheduledDate: '2099-06-18',
      });
    }
    await createJob(request, adminToken, {
      title: `E2E Optimize Unassigned ${unique}`,
      assignedTo: '',
      status: 'new',
      priority: 'medium',
      location: 'E2E Optimize Site',
      category: 'general',
      customerId: customers[0].id,
      scheduledDate: '2099-06-18',
    });

    await page.goto('/schedule');
    await expect(page).toHaveURL(/\/schedule/);
    const optimizationPanel = page.locator('.optimization-panel');
    await expect(optimizationPanel.getByRole('heading', { name: 'Dispatch Optimization' })).toBeVisible({ timeout: 20000 });
    const refreshButton = optimizationPanel.getByRole('button', { name: /Refresh dispatch optimization suggestions|Analyzing.../ }).first();
    await expect(refreshButton).toBeVisible({ timeout: 20000 });
    if (await refreshButton.isEnabled()) {
      await refreshButton.click();
    } else {
      await expect(optimizationPanel.getByRole('button', { name: 'Refresh dispatch optimization suggestions' })).toBeVisible({ timeout: 20000 });
      await optimizationPanel.getByRole('button', { name: 'Refresh dispatch optimization suggestions' }).click();
    }
    const applyButton = optimizationPanel.getByRole('button', { name: 'Apply' }).first();
    if (await applyButton.count()) {
      await expect(applyButton).toBeVisible();
      await applyButton.click();
      await expect(page.getByText(/Applied optimization for/)).toBeVisible();
    } else {
      await expect(optimizationPanel.getByText(/No optimization suggestions right now/)).toBeVisible();
    }
  });
});
