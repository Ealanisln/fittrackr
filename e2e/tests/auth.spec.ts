import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should show login page for unauthenticated users', async ({ page }) => {
    await page.goto('/');

    // Should redirect to login or show login page
    await expect(page).toHaveURL(/login/);
    await expect(page.getByRole('heading', { name: /iniciar sesión|login|sign in/i })).toBeVisible();
  });

  test('should display login form with email and password fields', async ({ page }) => {
    await page.goto('/login');

    // Check for email input
    await expect(page.locator('input[type="email"]')).toBeVisible();

    // Check for password input
    await expect(page.locator('input[type="password"]')).toBeVisible();

    // Check for submit button
    await expect(page.getByRole('button', { name: /iniciar|login|sign in|entrar/i })).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.getByText(/error|invalid|incorrecto|inválido/i)).toBeVisible({ timeout: 10000 });
  });

  test('should have link to registration page', async ({ page }) => {
    await page.goto('/login');

    // Look for registration link
    const registerLink = page.getByRole('link', { name: /registrar|register|crear cuenta|sign up/i });
    await expect(registerLink).toBeVisible();
  });

  test('should navigate to registration page', async ({ page }) => {
    await page.goto('/login');

    // Click registration link
    await page.getByRole('link', { name: /registrar|register|crear cuenta|sign up/i }).click();

    // Should be on registration page
    await expect(page).toHaveURL(/register/);
  });

  test('registration page should have required fields', async ({ page }) => {
    await page.goto('/register');

    // Check for name input (if required)
    const nameInput = page.locator('input[name="name"], input[placeholder*="nombre" i], input[placeholder*="name" i]');

    // Check for email input
    await expect(page.locator('input[type="email"]')).toBeVisible();

    // Check for password input
    await expect(page.locator('input[type="password"]').first()).toBeVisible();

    // Check for submit button
    await expect(page.getByRole('button', { name: /registrar|register|crear|sign up/i })).toBeVisible();
  });
});

test.describe('Protected Routes', () => {
  test('should redirect to login when accessing dashboard without auth', async ({ page }) => {
    await page.goto('/');

    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });

  test('should redirect to login when accessing files page without auth', async ({ page }) => {
    await page.goto('/files');

    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });

  test('should redirect to login when accessing integrations page without auth', async ({ page }) => {
    await page.goto('/integrations');

    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });
});
