/**
 * Decimal Utilities
 * 
 * 使用 decimal.js 处理高精度金融计算
 * 避免 JavaScript 浮点数精度问题
 */

import Decimal from 'decimal.js';

// 配置全局精度（18位小数）
Decimal.set({ precision: 28, rounding: Decimal.ROUND_DOWN });

/**
 * 创建 Decimal 实例
 * @param value - 数值、字符串或 Decimal
 */
export function decimal(value: Decimal.Value): Decimal {
  return new Decimal(value);
}

/**
 * 格式化为货币显示（保留指定小数位）
 * @param value - 数值
 * @param decimals - 小数位数（默认 2）
 */
export function formatCurrency(value: Decimal.Value, decimals = 2): string {
  return decimal(value).toFixed(decimals);
}

/**
 * 格式化为百分比显示
 * @param value - 数值（如 0.1523 表示 15.23%）
 * @param decimals - 小数位数（默认 2）
 */
export function formatPercentage(value: Decimal.Value, decimals = 2): string {
  return decimal(value).times(100).toFixed(decimals) + '%';
}

/**
 * 计算手续费
 * @param amount - 交易金额
 * @param feeRate - 费率（如 0.001 表示 0.1%）
 */
export function calculateFee(amount: Decimal.Value, feeRate: Decimal.Value): Decimal {
  return decimal(amount).times(feeRate);
}

/**
 * 计算订单总额
 * @param price - 单价
 * @param quantity - 数量
 */
export function calculateTotal(price: Decimal.Value, quantity: Decimal.Value): Decimal {
  return decimal(price).times(quantity);
}

/**
 * 检查余额是否充足
 * @param balance - 可用余额
 * @param required - 需要金额
 */
export function hasSufficientBalance(
  balance: Decimal.Value,
  required: Decimal.Value
): boolean {
  return decimal(balance).gte(required);
}

/**
 * 验证金额是否有效
 * @param amount - 金额
 */
export function isValidAmount(amount: Decimal.Value): boolean {
  try {
    const d = decimal(amount);
    return d.gt(0) && d.isFinite();
  } catch {
    return false;
  }
}

/**
 * 验证价格是否有效
 * @param price - 价格
 */
export function isValidPrice(price: Decimal.Value): boolean {
  try {
    const d = decimal(price);
    return d.gt(0) && d.isFinite();
  } catch {
    return false;
  }
}

/**
 * 计算涨跌幅
 * @param current - 当前价格
 * @param previous - 之前价格
 * @returns 涨跌幅（如 0.1523 表示上涨 15.23%）
 */
export function calculatePriceChange(
  current: Decimal.Value,
  previous: Decimal.Value
): Decimal {
  const curr = decimal(current);
  const prev = decimal(previous);

  if (prev.isZero()) {
    return decimal(0);
  }

  return curr.minus(prev).div(prev);
}

/**
 * 安全转换为字符串（数据库存储）
 * @param value - Decimal 值
 */
export function toDbString(value: Decimal): string {
  return value.toFixed();
}

/**
 * 从数据库字符串解析
 * @param value - 数据库字符串
 */
export function fromDbString(value: string): Decimal {
  return decimal(value);
}

