/**
 * Order Service
 * 
 * 处理订单创建、取消、查询等业务逻辑
 */

import { createAdminClient, createServerClient } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';
import Decimal from 'decimal.js';
import type { CreateOrderRequest, OrderResponse } from '@/types/api.types';
import type { Order, OrderStatus, OrderType, OrderSide } from '@/types/database.types';

/**
 * 创建订单
 */
export async function createOrder(
  userId: string,
  orderData: CreateOrderRequest
): Promise<OrderResponse> {
  const supabase = createAdminClient();

  logger.info('Creating order', { userId, orderData });

  // 验证交易对格式
  if (!orderData.trading_pair.match(/^[A-Z]{2,10}\/[A-Z]{2,10}$/)) {
    throw new Error('Invalid trading pair format');
  }

  // 验证数量
  const quantity = new Decimal(orderData.quantity);
  if (quantity.lte(0)) {
    throw new Error('Quantity must be greater than zero');
  }

  // 限价单必须提供价格
  if (orderData.order_type === 'limit' && !orderData.price) {
    throw new Error('Price is required for limit orders');
  }

  // 验证价格（如果提供）
  let price: Decimal | null = null;
  if (orderData.price) {
    price = new Decimal(orderData.price);
    if (price.lte(0)) {
      throw new Error('Price must be greater than zero');
    }
  }

  // 解析交易对
  const [baseCurrency, quoteCurrency] = orderData.trading_pair.split('/');

  // 获取市场价格（用于市价单或验证）
  let marketPrice: Decimal;
  try {
    const { data: priceData } = await supabase
      .from('market_prices')
      .select('price')
      .eq('trading_pair', orderData.trading_pair)
      .single();

    if (!priceData) {
      throw new Error(`Market price not found for ${orderData.trading_pair}`);
    }

    marketPrice = new Decimal(priceData.price);
  } catch (error) {
    logger.error('Failed to get market price', error);
    throw new Error('Unable to fetch market price');
  }

  // 对于市价单，使用市场价格
  const effectivePrice = orderData.order_type === 'market' ? marketPrice : price!;

  // 计算需要的余额
  let requiredCurrency: string;
  let requiredAmount: Decimal;

  if (orderData.side === 'buy') {
    // 买单：需要报价币种（如USDT）
    requiredCurrency = quoteCurrency;
    requiredAmount = effectivePrice.mul(quantity);
  } else {
    // 卖单：需要基础币种（如BTC）
    requiredCurrency = baseCurrency;
    requiredAmount = quantity;
  }

  // 检查并冻结余额
  const { data: wallet, error: walletError } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .eq('currency', requiredCurrency)
    .single();

  if (walletError || !wallet) {
    throw new Error(`Wallet not found for ${requiredCurrency}`);
  }

  const availableBalance = new Decimal(wallet.balance).minus(wallet.frozen);
  if (availableBalance.lt(requiredAmount)) {
    throw new Error('Insufficient balance');
  }

  // 开始数据库事务：冻结余额并创建订单
  try {
    // 1. 冻结余额
    const newFrozen = new Decimal(wallet.frozen).plus(requiredAmount).toString();
    const { error: freezeError } = await supabase
      .from('wallets')
      .update({ frozen: newFrozen })
      .eq('user_id', userId)
      .eq('currency', requiredCurrency);

    if (freezeError) {
      throw freezeError;
    }

    // 2. 创建订单
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        trading_pair: orderData.trading_pair,
        order_type: orderData.order_type,
        side: orderData.side,
        price: effectivePrice.toString(),
        quantity: quantity.toString(),
        filled_quantity: '0',
        status: orderData.order_type === 'market' ? 'filled' : 'pending',
      })
      .select()
      .single();

    if (orderError || !order) {
      // 回滚：解冻余额
      await supabase
        .from('wallets')
        .update({ frozen: wallet.frozen })
        .eq('user_id', userId)
        .eq('currency', requiredCurrency);
      
      throw orderError || new Error('Failed to create order');
    }

    // 3. 如果是市价单，立即执行成交
    if (orderData.order_type === 'market') {
      await executeMarketOrder(order, effectivePrice, quantity);
    }

    logger.info('Order created successfully', { orderId: order.id });

    return mapOrderToResponse(order);
  } catch (error) {
    logger.error('Order creation failed', error);
    throw new Error('Failed to create order');
  }
}

/**
 * 执行市价单成交
 */
async function executeMarketOrder(
  order: Order,
  price: Decimal,
  quantity: Decimal
): Promise<void> {
  const supabase = createAdminClient();
  const [baseCurrency, quoteCurrency] = order.trading_pair.split('/');

  try {
    // 1. 更新订单状态为已完成
    await supabase
      .from('orders')
      .update({
        filled_quantity: quantity.toString(),
        status: 'filled' as OrderStatus,
      })
      .eq('id', order.id);

    // 2. 创建交易记录
    await supabase
      .from('transactions')
      .insert({
        order_id: order.id,
        trading_pair: order.trading_pair,
        price: price.toString(),
        quantity: quantity.toString(),
        buyer_id: order.side === 'buy' ? order.user_id : null,
        seller_id: order.side === 'sell' ? order.user_id : null,
        buyer_fee: '0',
        seller_fee: '0',
      });

    // 3. 更新钱包余额
    if (order.side === 'buy') {
      // 买入：扣除USDT，增加BTC
      const cost = price.mul(quantity);
      
      // 解冻并扣除报价币
      await updateWalletBalance(order.user_id, quoteCurrency, cost.neg(), cost.neg());
      
      // 增加基础币
      await updateWalletBalance(order.user_id, baseCurrency, quantity, new Decimal(0));
    } else {
      // 卖出：扣除BTC，增加USDT
      const revenue = price.mul(quantity);
      
      // 解冻并扣除基础币
      await updateWalletBalance(order.user_id, baseCurrency, quantity.neg(), quantity.neg());
      
      // 增加报价币
      await updateWalletBalance(order.user_id, quoteCurrency, revenue, new Decimal(0));
    }

    // 4. 记录钱包交易历史
    const walletTxType = order.side === 'buy' ? 'buy_order' : 'sell_order';
    await supabase
      .from('wallet_transactions')
      .insert({
        user_id: order.user_id,
        currency: order.side === 'buy' ? baseCurrency : quoteCurrency,
        amount: order.side === 'buy' ? quantity.toString() : price.mul(quantity).toString(),
        type: walletTxType,
        related_id: order.id,
        status: 'completed',
      });

    logger.info('Market order executed', { orderId: order.id });
  } catch (error) {
    logger.error('Failed to execute market order', error);
    throw error;
  }
}

/**
 * 更新钱包余额
 */
async function updateWalletBalance(
  userId: string,
  currency: string,
  balanceChange: Decimal,
  frozenChange: Decimal
): Promise<void> {
  const supabase = createAdminClient();

  // 获取当前钱包
  const { data: wallet } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .eq('currency', currency)
    .single();

  if (!wallet) {
    // 如果钱包不存在，创建新钱包
    await supabase
      .from('wallets')
      .insert({
        user_id: userId,
        currency,
        balance: balanceChange.toString(),
        frozen: frozenChange.toString(),
      });
  } else {
    // 更新现有钱包
    const newBalance = new Decimal(wallet.balance).plus(balanceChange);
    const newFrozen = new Decimal(wallet.frozen).plus(frozenChange);

    await supabase
      .from('wallets')
      .update({
        balance: newBalance.toString(),
        frozen: newFrozen.toString(),
      })
      .eq('user_id', userId)
      .eq('currency', currency);
  }
}

/**
 * 取消订单
 */
export async function cancelOrder(
  userId: string,
  orderId: string
): Promise<void> {
  const supabase = createAdminClient();

  logger.info('Cancelling order', { userId, orderId });

  // 1. 获取订单
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .eq('user_id', userId)
    .single();

  if (orderError || !order) {
    throw new Error('Order not found');
  }

  // 2. 检查订单状态
  if (order.status !== 'pending') {
    throw new Error('Only pending orders can be cancelled');
  }

  // 3. 计算需要解冻的金额
  const [baseCurrency, quoteCurrency] = order.trading_pair.split('/');
  const quantity = new Decimal(order.quantity);
  const price = new Decimal(order.price || '0');
  
  let frozenCurrency: string;
  let frozenAmount: Decimal;

  if (order.side === 'buy') {
    frozenCurrency = quoteCurrency;
    frozenAmount = price.mul(quantity);
  } else {
    frozenCurrency = baseCurrency;
    frozenAmount = quantity;
  }

  // 4. 解冻余额
  const { data: wallet } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .eq('currency', frozenCurrency)
    .single();

  if (wallet) {
    const newFrozen = new Decimal(wallet.frozen).minus(frozenAmount);
    await supabase
      .from('wallets')
      .update({ frozen: newFrozen.toString() })
      .eq('user_id', userId)
      .eq('currency', frozenCurrency);
  }

  // 5. 更新订单状态
  await supabase
    .from('orders')
    .update({ status: 'cancelled' as OrderStatus })
    .eq('id', orderId);

  logger.info('Order cancelled successfully', { orderId });
}

/**
 * 查询活跃订单
 */
export async function getActiveOrders(userId: string): Promise<OrderResponse[]> {
  const supabase = createServerClient();

  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Failed to fetch active orders', error);
    throw new Error('Failed to fetch active orders');
  }

  return orders.map(mapOrderToResponse);
}

/**
 * 查询订单历史
 */
export async function getOrderHistory(
  userId: string,
  filters?: {
    trading_pair?: string;
    status?: OrderStatus;
    page?: number;
    page_size?: number;
  }
): Promise<{ orders: OrderResponse[]; total: number }> {
  const supabase = createServerClient();

  let query = supabase
    .from('orders')
    .select('*', { count: 'exact' })
    .eq('user_id', userId);

  if (filters?.trading_pair) {
    query = query.eq('trading_pair', filters.trading_pair);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const page = filters?.page || 1;
  const pageSize = filters?.page_size || 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  query = query
    .range(from, to)
    .order('created_at', { ascending: false });

  const { data: orders, error, count } = await query;

  if (error) {
    logger.error('Failed to fetch order history', error);
    throw new Error('Failed to fetch order history');
  }

  return {
    orders: (orders || []).map(mapOrderToResponse),
    total: count || 0,
  };
}

/**
 * 映射数据库Order到API响应
 */
function mapOrderToResponse(order: Order): OrderResponse {
  return {
    id: order.id,
    user_id: order.user_id,
    trading_pair: order.trading_pair,
    order_type: order.order_type,
    side: order.side,
    price: order.price,
    quantity: order.quantity,
    filled_quantity: order.filled_quantity,
    status: order.status,
    created_at: order.created_at,
    updated_at: order.updated_at,
  };
}
