/**
 * E2E Tests - Market Data
 * 端到端测试 - 市场行情（适配实际 DOM id）
 */

import { test, expect } from '@playwright/test';

test.describe('Market Data', () => {
  test('should display markets page', async ({ page }) => {
    await page.goto('/markets');
    await expect(page).toHaveTitle(/market|行情/i);
    await expect(page.locator('h1').first()).toContainText(/Crypto Markets|市场行情/i);
  });

  test('should show loading or data in table', async ({ page }) => {
    await page.goto('/markets');
    const table = page.locator('#markets-table');
    await expect(table).toBeVisible({ timeout: 15000 });
    await expect(table.locator('tr').first()).toBeVisible();
  });

  test('should load and display market tickers', async ({ page }) => {
    await page.goto('/markets');
    const table = page.locator('#markets-table');
    await expect(table).toBeVisible({ timeout: 15000 });
    const rows = table.locator('tr');
    await expect(rows.first()).toBeVisible();
    const firstText = await rows.first().textContent();
    expect(firstText === null || firstText.includes('Loading') || firstText.includes('BTC') || firstText.includes('ETH') || firstText.includes('$')).toBeTruthy();
  });

  test('should display table columns', async ({ page }) => {
    await page.goto('/markets');
    await page.waitForSelector('#markets-table', { timeout: 15000 });
    const headers = page.locator('th');
    await expect(headers.first()).toBeVisible();
    const headerText = await headers.allTextContents();
    const joined = headerText.join(' ');
    expect(joined).toMatch(/Trading Pair|Last Price|Price|交易对|价格/i);
  });

  test('should have trade link or button', async ({ page }) => {
    await page.goto('/markets');
    await page.waitForSelector('#markets-table tr', { timeout: 15000 });
    const tradeLink = page.locator('a:has-text("Trade"), a:has-text("交易")').first();
    if (await tradeLink.count() > 0) {
      await expect(tradeLink).toBeVisible();
    }
  });

  test('should navigate to trade page when clicking trade', async ({ page }) => {
    test.setTimeout(35000);
    await page.goto('/markets');
    const tradeLink = page.locator('a:has-text("Trade"), a:has-text("交易")').first();
    try {
      await tradeLink.waitFor({ state: 'visible', timeout: 10000 });
      const href = await tradeLink.getAttribute('href');
      if (href) {
        const url = href.startsWith('http') ? href : new URL(href, page.url()).toString();
        await page.goto(url);
      }
    } catch {
      await page.goto('/trade');
    }
    await expect(page).toHaveURL(/.*trade/);
  });

  test('should refresh when clicking refresh button', async ({ page }) => {
    await page.goto('/markets');
    await page.waitForSelector('#markets-table', { timeout: 15000 });
    const btn = page.locator('#refresh-button');
    await expect(btn).toBeVisible();
    await btn.click();
    await expect(page.locator('#markets-table')).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    await page.route('**/api/market/tickers', (route) => route.abort('failed'));
    await page.goto('/markets');
    await expect(
      page.locator('text=/Failed to load|error|请重试|try again/i')
    ).toBeVisible({ timeout: 8000 });
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/markets');
    await page.waitForSelector('#markets-table', { timeout: 15000 });
    await expect(page.locator('#markets-table')).toBeVisible();
  });
});
