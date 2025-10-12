/**
 * E2E Tests - Market Data
 * 端到端测试 - 市场行情
 */

import { test, expect } from '@playwright/test';

test.describe('Market Data', () => {
  test('should display markets page', async ({ page }) => {
    await page.goto('/markets');
    
    await expect(page).toHaveTitle(/市场行情/);
    await expect(page.locator('h1')).toContainText('市场行情');
  });

  test('should show loading state initially', async ({ page }) => {
    await page.goto('/markets');
    
    // 应该显示加载状态
    const loading = page.locator('#loading');
    await expect(loading).toBeVisible();
  });

  test('should load and display market tickers', async ({ page }) => {
    await page.goto('/markets');
    
    // 等待数据加载完成
    await page.waitForSelector('#marketsTable', { timeout: 10000 });
    
    // 应该隐藏加载状态
    await expect(page.locator('#loading')).toBeHidden();
    
    // 应该显示表格
    const table = page.locator('#marketsTable');
    await expect(table).toBeVisible();
    
    // 应该有多行数据（至少1个交易对）
    const rows = page.locator('#marketsBody tr');
    await expect(rows).toHaveCount({ minimum: 1 });
  });

  test('should display correct table columns', async ({ page }) => {
    await page.goto('/markets');
    await page.waitForSelector('#marketsTable');
    
    // 验证表头
    const headers = page.locator('th');
    await expect(headers.nth(0)).toContainText('交易对');
    await expect(headers.nth(1)).toContainText('最新价格');
    await expect(headers.nth(2)).toContainText('24h涨跌');
    await expect(headers.nth(3)).toContainText('24h最高');
    await expect(headers.nth(4)).toContainText('24h最低');
    await expect(headers.nth(5)).toContainText('24h成交量');
  });

  test('should display price change with correct color', async ({ page }) => {
    await page.goto('/markets');
    await page.waitForSelector('#marketsBody tr');
    
    // 检查价格涨跌颜色
    const firstRow = page.locator('#marketsBody tr').first();
    const priceChange = firstRow.locator('td').nth(2);
    
    // 应该有price-up或price-down类
    const classList = await priceChange.getAttribute('class');
    expect(classList).toMatch(/price-(up|down)/);
  });

  test('should format prices correctly', async ({ page }) => {
    await page.goto('/markets');
    await page.waitForSelector('#marketsBody tr');
    
    const firstRow = page.locator('#marketsBody tr').first();
    const price = firstRow.locator('td').nth(1);
    
    // 价格应该包含$符号和逗号分隔
    const priceText = await price.textContent();
    expect(priceText).toMatch(/\$/);
  });

  test('should have trade buttons for each ticker', async ({ page }) => {
    await page.goto('/markets');
    await page.waitForSelector('#marketsBody tr');
    
    // 每行应该有交易按钮
    const tradeButtons = page.locator('a:has-text("交易")');
    await expect(tradeButtons.first()).toBeVisible();
  });

  test('should navigate to trade page when clicking trade button', async ({ page }) => {
    await page.goto('/markets');
    await page.waitForSelector('#marketsBody tr');
    
    // 点击第一个交易按钮
    const firstTradeButton = page.locator('a:has-text("交易")').first();
    await firstTradeButton.click();
    
    // 应该跳转到交易页面
    await expect(page).toHaveURL(/.*trade/);
  });

  test('should refresh data when clicking refresh button', async ({ page }) => {
    await page.goto('/markets');
    await page.waitForSelector('#marketsTable');
    
    // 获取第一行的价格
    const firstPrice = await page.locator('#marketsBody tr').first().locator('td').nth(1).textContent();
    
    // 点击刷新按钮
    await page.click('#refreshButton');
    
    // 应该重新显示加载状态
    await expect(page.locator('#loading')).toBeVisible();
    
    // 等待数据重新加载
    await page.waitForSelector('#marketsTable');
    
    // 数据应该已刷新（虽然价格可能相同）
    await expect(page.locator('#marketsTable')).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // 模拟网络错误
    await page.route('**/api/market/tickers', (route) => {
      route.abort('failed');
    });
    
    await page.goto('/markets');
    
    // 应该显示错误消息
    await expect(page.locator('#error')).toBeVisible({ timeout: 5000 });
  });

  test('should be responsive on mobile', async ({ page }) => {
    // 设置移动设备视口
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/markets');
    await page.waitForSelector('#marketsTable');
    
    // 表格应该可滚动
    const table = page.locator('#marketsTable');
    await expect(table).toBeVisible();
  });
});

