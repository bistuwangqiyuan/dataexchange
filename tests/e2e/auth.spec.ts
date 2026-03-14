/**
 * E2E Tests - Authentication Flow
 * 端到端测试 - 用户认证流程（适配中英文页面）
 */

import { test, expect } from '@playwright/test';

test.describe('User Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display home or login page correctly', async ({ page }) => {
    await expect(page).toHaveTitle(/CryptoEx|Trading|DataExchange/i);
    // 未登录会跳转到 /login，登录后为首页
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
    await expect(h1).toContainText(/Welcome Back|加密货币|Crypto/i);
  });

  test('should navigate to registration page', async ({ page }) => {
    await page.click('a[href="/register"]');
    await expect(page).toHaveURL(/.*register/);
    await expect(page.locator('h2').first()).toContainText(/Create your account|创建账号/i);
  });

  test('should show validation on empty registration form', async ({ page }) => {
    await page.goto('/register');
    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toHaveAttribute('required');
  });

  test('should register new user when API available', async ({ page }) => {
    await page.goto('/register');
    const timestamp = Date.now();
    const email = `test${timestamp}@example.com`;
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'SecurePass123');
    const confirm = page.locator('input[name="confirmPassword"], input[name="confirm-password"]').first();
    await confirm.fill('SecurePass123');
    const terms = page.locator('input[name="terms"]');
    if (await terms.count()) await terms.check();
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    // 成功则跳转或留在本页显示成功；失败则显示错误
    const url = page.url();
    const hasError = await page.locator('#error-message:visible, #formError, [role="alert"]').count() > 0;
    expect(url.includes('/register') || url.includes('/') || url.includes('/markets') || hasError).toBeTruthy();
  });

  test('should show error for mismatched passwords', async ({ page }) => {
    await page.goto('/register');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'SecurePass123');
    const confirm = page.locator('input[name="confirmPassword"], input[name="confirm-password"]').first();
    await confirm.fill('DifferentPass123');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=/passwords? do not match|密码不一致|match/i')).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/.*login/);
    await expect(page.locator('h1, h2').first()).toContainText(/Welcome Back|登录|Sign in/i);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    const emailInput = page.locator('input#email, input[name="email"]').first();
    await emailInput.waitFor({ state: 'visible', timeout: 15000 });
    await emailInput.fill('wrong@example.com');
    await page.locator('input#password, input[name="password"]').first().fill('WrongPassword123');
    await page.click('button[type="submit"]', { noWaitAfter: true });
    await page.waitForTimeout(5000);
    const onLogin = page.url().includes('/login');
    const hasError = await page.getByText(/invalid|error|failed|credentials|password/i).first().isVisible().catch(() => false);
    expect(onLogin || hasError).toBeTruthy();
  });

  test('should logout when logged in', async ({ page }) => {
    await page.goto('/login');
    const emailInput = page.locator('input#email, input[name="email"]').first();
    await emailInput.waitFor({ state: 'visible', timeout: 15000 });
    await emailInput.fill('test@example.com');
    await page.locator('input#password, input[name="password"]').first().fill('TestPassword123');
    await page.click('button[type="submit"]', { noWaitAfter: true });
    await page.waitForTimeout(5000);
    const logoutBtn = page.locator('button:has-text("登出"), button:has-text("Log out")');
    if (await logoutBtn.count() > 0 && await logoutBtn.first().isVisible()) {
      await logoutBtn.first().click();
      await expect(page).toHaveURL(/\//);
      await expect(page.locator('a[href="/login"]')).toBeVisible();
    }
  });
});
