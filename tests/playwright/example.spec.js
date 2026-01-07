import { test, expect } from '@playwright/test';

/**
 * Example Playwright E2E Test
 * This demonstrates the structure for real browser-based tests
 */

test.describe('Example Feature', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to the page before each test
    await page.goto('/');
  });

  test('should load the homepage', async ({ page }) => {
    // Verify page title
    await expect(page).toHaveTitle(/Home/i);

    // Verify main heading is visible
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should handle form submission', async ({ page }) => {
    // Fill out a form
    await page.fill('[data-testid="input-field"]', 'Test Value');
    await page.click('[data-testid="submit-button"]');

    // Wait for API response
    await page.waitForResponse(response =>
      response.url().includes('/api/submit') && response.status() === 200
    );

    // Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toHaveText('Success!');
  });

  test('should show validation error for empty input', async ({ page }) => {
    // Try to submit empty form
    await page.click('[data-testid="submit-button"]');

    // Verify error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('required');
  });

  test('should navigate correctly', async ({ page }) => {
    // Click navigation link
    await page.click('[data-testid="nav-link"]');

    // Verify URL changed
    await expect(page).toHaveURL(/\/other-page/);

    // Verify new page content
    await expect(page.locator('[data-testid="page-title"]')).toHaveText('Other Page');
  });
});

test.describe('Error Handling', () => {

  test('should handle API error gracefully', async ({ page }) => {
    // Intercept API call and return error
    await page.route('**/api/submit', route =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      })
    );

    await page.goto('/');
    await page.fill('[data-testid="input-field"]', 'Test');
    await page.click('[data-testid="submit-button"]');

    // Verify error is displayed to user
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });
});

test.describe('Cross-Layer Validation Example', () => {

  test('should create record in database and reflect in UI', async ({ page, request }) => {
    // Given: User is on the form page
    await page.goto('/create');

    // When: User submits the form
    const testData = { name: 'Test Item', value: 123 };
    await page.fill('[data-testid="name-input"]', testData.name);
    await page.fill('[data-testid="value-input"]', testData.value.toString());
    await page.click('[data-testid="submit-button"]');

    // Then: Success message appears
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

    // And: API confirms record was created
    const apiResponse = await request.get('/api/items?name=' + testData.name);
    expect(apiResponse.status()).toBe(200);
    const items = await apiResponse.json();
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject(testData);

    // And: UI shows the new item in the list
    await page.goto('/items');
    await expect(page.locator(`[data-testid="item-${items[0].id}"]`)).toBeVisible();
    await expect(page.locator(`[data-testid="item-${items[0].id}"]`)).toContainText(testData.name);
  });
});
