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

async function loginStaff(page, username = 'admin', password = '1111') {
  await page.goto('/login');
  await page.getByLabel('Username').fill(username);
  await page.getByRole('textbox', { name: /^Password$/ }).fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).toHaveURL(/dashboard/);
}

test.describe.serial('Notifications UI', () => {
  test('bell badge and panel reflect unread/read notification state', async ({ page, request }) => {
    const token = await apiLogin(request, 'admin', '1111');
    const unique = Date.now();
    const title = `E2E Notification ${unique}`;

    const createdResponse = await request.post('http://localhost:3002/api/notifications', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        title,
        message: 'Notification panel verification',
      },
    });
    expect(createdResponse.status()).toBe(201);
    const created = await createdResponse.json();
    expect(created.id).toBeTruthy();

    await loginStaff(page, 'admin', '1111');

    const bellButton = page.getByRole('button', { name: /toggle notifications panel/i });
    await expect(bellButton).toBeVisible();
    await expect(bellButton.locator('.notification-badge')).toBeVisible();
    await bellButton.click();

    const panel = page.locator('.notifications-panel');
    await expect(panel).toBeVisible();
    const createdItem = panel.locator('.notification-item', { hasText: title }).first();
    await expect(createdItem).toBeVisible();
    await expect(createdItem).toHaveClass(/unread/);

    const readResponse = await request.patch(`http://localhost:3002/api/notifications/${encodeURIComponent(created.id)}/read`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(readResponse.status()).toBe(200);

    await page.reload();
    await bellButton.click();
    const refreshedItem = page.locator('.notifications-panel .notification-item', { hasText: title }).first();
    await expect(refreshedItem).toBeVisible();
    await expect(refreshedItem).toHaveClass(/read/);
  });
});

