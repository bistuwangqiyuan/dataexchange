/**
 * Order Service
 * 
 * 处理订单和交易相关业务逻辑
 */

import { createServerClient } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';
import {
  decimal,
  calculateTotal,
  calculateFee,
  toDbString,
  hasSufficientBalance,
} from '@/lib/utils/decimal';
import { freezeFunds, unfreezeFunds, getWalletByCurrency, ensureWalletExists } from './wallet.service';
import { getMarketTicker } from './market.service';
import type { Order, Transaction } from '@/types/database.types';
import type { CreateOrderRequest, OrderResponse } from '@/types/api.types';

const TRADING_FEE_RATE = '0.001'; // 0.1% 交易手续费

/**
 * 创建订单
 */
export async function createOrder(
  userId: string,
  request: CreateOrderRequest
): Promise<OrderResponse> {
  const supabase = createServerClient();
  const { trading_pair, order_type, side, price, quantity } = request;

  logger.info('Creating order', { userId, ...request });

  // 解析交易对
  const [baseCurrency, quoteCurrency] = trading_pair.split('/');

  // 市价单：获取当前市场价格
  let orderPrice = price;
  if (order_type === 'market') {
    const ticker = await getMarketTicker(trading_pair);
    orderPrice = ticker.price;
    logger.debug('Using market price', { trading_pair, price: orderPrice });
  }

  if (!orderPrice) {
    throw new Error('Price is required for limit orders');
  }

  // 计算所需金额
  const total = calculateTotal(orderPrice, quantity);
  const fee = calculateFee(total, TRADING_FEE_RATE);

  // 买单：需要报价货币（USDT）
  // 卖单：需要基础货币（BTC）
  const requiredCurrency = side === 'buy' ? quoteCurrency : baseCurrency;
  const requiredAmount = side === 'buy' ? total.plus(fee) : decimal(quantity);

  // 确保钱包存在
  await ensureWalletExists(userId, requiredCurrency);

  // 检查余额并冻结资金
  const wallet = await getWalletByCurrency(userId, requiredCurrency);
  if (!wallet) {
    throw new Error('Wallet not found');
  }

  const available = decimal(wallet.balance).minus(wallet.frozen);
  if (!hasSufficientBalance(available, requiredAmount)) {
    throw new Error('Insufficient balance');
  }

  await freezeFunds(userId, requiredCurrency, toDbString(requiredAmount));

  try {
    // 创建订单
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        trading_pair,
        order_type,
        side,
        price: orderPrice,
        quantity,
        filled_quantity: '0',
        status: 'pending',
      })
      .select()
      .single();

    if (orderError) {
      logger.error('Failed to create order', orderError);
      // 解冻资金
      await unfreezeFunds(userId, requiredCurrency, toDbString(requiredAmount));
      throw new Error('Failed to create order');
    }

    // 市价单：立即执行
    if (order_type === 'market') {
      await executeOrder(order.id, userId);
    }

    logger.info('Order created', { orderId: order.id });

    return order;
  } catch (error) {
    // 错误时解冻资金
    await unfreezeFunds(userId, requiredCurrency, toDbString(requiredAmount));
    throw error;
  }
}

/**
 * 执行订单（模拟撮合）
 */
async function executeOrder(orderId: string, userId: string): Promise<void> {
  const supabase = createServerClient();

  logger.info('Executing order', { orderId });

  // 获取订单信息
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    throw new Error('Order not found');
  }

  if (order.status !== 'pending') {
    throw new Error('Order is not pending');
  }

  const [baseCurrency, quoteCurrency] = order.trading_pair.split('/');
  const executionPrice = order.price || '0';
  const total = calculateTotal(executionPrice, order.quantity);
  const fee = calculateFee(total, TRADING_FEE_RATE);

  // 创建成交记录
  const { error: txError } = await supabase.from('transactions').insert({
    order_id: orderId,
    user_id: userId,
    trading_pair: order.trading_pair,
    type: order.side,
    price: executionPrice,
    quantity: order.quantity,
    fee: toDbString(fee),
    total: toDbString(total),
  });

  if (txError) {
    logger.error('Failed to create transaction', txError);
    throw new Error('Failed to create transaction');
  }

  // 更新订单状态
  const { error: updateError } = await supabase
    .from('orders')
    .update({
      status: 'filled',
      filled_quantity: order.quantity,
    })
    .eq('id', orderId);

  if (updateError) {
    logger.error('Failed to update order status', updateError);
    throw new Error('Failed to update order');
  }

  // 更新钱包余额
  if (order.side === 'buy') {
    // 买入：扣除 USDT，增加 BTC
    await settleBuyOrder(userId, baseCurrency, quoteCurrency, order.quantity, total, fee);
  } else {
    // 卖出：扣除 BTC，增加 USDT
    await settleSellOrder(userId, baseCurrency, quoteCurrency, order.quantity, total, fee);
  }

  logger.info('Order executed', { orderId });
}

/**
 * 结算买单
 */
async function settleBuyOrder(
  userId: string,
  baseCurrency: string,
  quoteCurrency: string,
  quantity: string,
  total: Decimal.Decimal,
  fee: Decimal.Decimal
): Promise<void> {
  const supabase = createServerClient();

  // 1. 扣除报价货币（USDT）- 解冻并扣除
  const quoteWallet = await getWalletByCurrency(userId, quoteCurrency);
  if (!quoteWallet) throw new Error('Quote wallet not found');

  const quoteFrozen = decimal(quoteWallet.frozen).minus(total.plus(fee));
  const quoteBalance = decimal(quoteWallet.balance).minus(total.plus(fee));

  await supabase
    .from('wallets')
    .update({
      balance: toDbString(quoteBalance),
      frozen: toDbString(quoteFrozen),
    })
    .eq('id', quoteWallet.id);

  // 2. 增加基础货币（BTC）
  await ensureWalletExists(userId, baseCurrency);
  const baseWallet = await getWalletByCurrency(userId, baseCurrency);
  if (!baseWallet) throw new Error('Base wallet not found');

  const baseBalance = decimal(baseWallet.balance).plus(quantity);

  await supabase
    .from('wallets')
    .update({ balance: toDbString(baseBalance) })
    .eq('id', baseWallet.id);

  logger.debug('Buy order settled', { userId, baseCurrency, quoteCurrency });
}

/**
 * 结算卖单
 */
async function settleSellOrder(
  userId: string,
  baseCurrency: string,
  quoteCurrency: string,
  quantity: string,
  total: Decimal.Decimal,
  fee: Decimal.Decimal
): Promise<void> {
  const supabase = createServerClient();

  // 1. 扣除基础货币（BTC）- 解冻并扣除
  const baseWallet = await getWalletByCurrency(userId, baseCurrency);
  if (!baseWallet) throw new Error('Base wallet not found');

  const baseFrozen = decimal(baseWallet.frozen).minus(quantity);
  const baseBalance = decimal(baseWallet.balance).minus(quantity);

  await supabase
    .from('wallets')
    .update({
      balance: toDbString(baseBalance),
      frozen: toDbString(baseFrozen),
    })
    .eq('id', baseWallet.id);

  // 2. 增加报价货币（USDT）- 扣除手续费
  await ensureWalletExists(userId, quoteCurrency);
  const quoteWallet = await getWalletByCurrency(userId, quoteCurrency);
  if (!quoteWallet) throw new Error('Quote wallet not found');

  const quoteBalance = decimal(quoteWallet.balance).plus(total.minus(fee));

  await supabase
    .from('wallets')
    .update({ balance: toDbString(quoteBalance) })
    .eq('id', quoteWallet.id);

  logger.debug('Sell order settled', { userId, baseCurrency, quoteCurrency });
}

/**
 * 取消订单
 */
export async function cancelOrder(userId: string, orderId: string): Promise<void> {
  const supabase = createServerClient();

  logger.info('Cancelling order', { userId, orderId });

  // 获取订单
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .eq('user_id', userId)
    .single();

  if (orderError || !order) {
    throw new Error('Order not found');
  }

  if (order.status !== 'pending') {
    throw new Error('Cannot cancel non-pending order');
  }

  // 更新订单状态
  const { error: updateError } = await supabase
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', orderId);

  if (updateError) {
    logger.error('Failed to cancel order', updateError);
    throw new Error('Failed to cancel order');
  }

  // 解冻资金
  const [baseCurrency, quoteCurrency] = order.trading_pair.split('/');
  const requiredCurrency = order.side === 'buy' ? quoteCurrency : baseCurrency;

  const orderPrice = order.price || '0';
  const total = calculateTotal(orderPrice, order.quantity);
  const fee = calculateFee(total, TRADING_FEE_RATE);
  const requiredAmount = order.side === 'buy' ? total.plus(fee) : decimal(order.quantity);

  await unfreezeFunds(userId, requiredCurrency, toDbString(requiredAmount));

  logger.info('Order cancelled', { orderId });
}

/**
 * 获取用户订单历史
 */
export async function getUserOrders(
  userId: string,
  tradingPair?: string,
  limit = 50
): Promise<Order[]> {
  const supabase = createServerClient();

  let query = supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (tradingPair) {
    query = query.eq('trading_pair', tradingPair);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Failed to get user orders', error);
    throw new Error('Failed to retrieve orders');
  }

  return data;
}

/**
 * 获取用户成交历史
 */
export async function getUserTransactions(
  userId: string,
  tradingPair?: string,
  limit = 50
): Promise<Transaction[]> {
  const supabase = createServerClient();

  let query = supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (tradingPair) {
    query = query.eq('trading_pair', tradingPair);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Failed to get user transactions', error);
    throw new Error('Failed to retrieve transactions');
  }

  return data;
}

