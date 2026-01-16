import { expect, test } from '@playwright/test';

test('checkout flow renders and navigates', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Orbit Pro Headphones/i })).toBeVisible();
  await page.getByRole('link', { name: /Buy Now/i }).click();
  await expect(page).toHaveURL(/checkout/);
  await expect(page.getByRole('heading', { name: /Secure Checkout/i })).toBeVisible();
});
