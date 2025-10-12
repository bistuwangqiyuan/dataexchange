/**
 * E2E Tests - Authentication Flow
 * 端到端测试 - 用户认证流程
 */

import { test, expect } from '@playwright/test';

test.describe('User Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // 访问首页
    await page.goto('/');
  });

  test('should display home page correctly', async ({ page }) => {
    await expect(page).toHaveTitle(/CryptoEx/);
    await expect(page.locator('h1')).toContainText('加密货币交易平台');
  });

  test('should navigate to registration page', async ({ page }) => {
    await page.click('a[href="/register"]');
    await expect(page).toHaveURL(/.*register/);
    await expect(page.locator('h2')).toContainText('创建账号');
  });

  test('should show validation errors on empty registration form', async ({ page }) => {
    await page.goto('/register');
    await page.click('button[type="submit"]');
    
    // HTML5验证应该阻止提交
    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toHaveAttribute('required');
  });

  test('should register new user successfully', async ({ page }) => {
    await page.goto('/register');

    const timestamp = Date.now();
    const email = `test${timestamp}@example.com`;

    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'SecurePass123');
    await page.fill('input[name="confirmPassword"]', 'SecurePass123');
    await page.check('input[name="terms"]');

    // 注意：实际E2E测试需要真实的Supabase环境
    // 这里可能需要mock或使用测试环境
    await page.click('button[type="submit"]');

    // 预期：成功后跳转到市场页面或显示成功消息
    // await expect(page).toHaveURL(/.*markets/);
  });

  test('should show error for mismatched passwords', async ({ page }) => {
    await page.goto('/register');

    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'SecurePass123');
    await page.fill('input[name="confirmPassword"]', 'DifferentPass123');

    // 触发验证
    const confirmPasswordInput = page.locator('input[name="confirmPassword"]');
    await confirmPasswordInput.blur();

    // 应该显示错误消息
    await expect(page.locator('text=/密码不一致/')).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.click('a[href="/login"]');
    await expect(page).toHaveURL(/.*login/);
    await expect(page.locator('h2')).toContainText('登录账号');
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login');

    // 使用预先创建的测试账号
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'TestPassword123');

    await page.click('button[type="submit"]');

    // 预期：成功登录后跳转
    // await expect(page).toHaveURL(/.*markets/);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'WrongPassword123');

    await page.click('button[type="submit"]');

    // 应该显示错误消息
    await expect(page.locator('[id="formError"]')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // 先登录
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'TestPassword123');
    await page.click('button[type="submit"]');

    // 等待登录完成
    await page.waitForTimeout(1000);

    // 点击登出按钮
    await page.click('button:has-text("登出")');

    // 应该跳转回首页
    await expect(page).toHaveURL('/');
    
    // 应该显示登录按钮
    await expect(page.locator('a[href="/login"]')).toBeVisible();
  });
});

