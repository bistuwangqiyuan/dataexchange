/**
 * Order Matching Service
 * 
 * 订单撮合服务 - 处理市价单和限价单的成交逻辑
 */

import { createAdminClient } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';
import { decimal } from '@/lib/utils/decimal';
import { getMarketTicker } from './market.service';
import type { Order, Transaction } from '@/types/database.types';

const TRADING_FEE_RATE = 0.001; // 0.1% 手续费

/**
 * 执行市价单（立即成交）
 */
export async function executeMarketOrder(order: Order): Promise<Transaction> {
  const supabase = createAdminClient();

  try {
    logger.info('Executing market order', { orderId: order.id, tradingPair: order.trading_pair });

    // 1. 获取当前市场价格
    const ticker = await getMarketTicker(order.trading_pair);
    const marketPrice = decimal(ticker.price);

    // 2. 计算成交金额和手续费
    const quantity = decimal(order.quantity);
    const total = marketPrice.times(quantity);
    const fee = total.times(TRADING_FEE_RATE);

    // 3. 解析交易对
    const [baseCurrency, quoteCurrency] = order.trading_pair.split('/');

    // 4. 使用数据库事务更新余额和订单
    const { data, error } = await supabase.rpc('execute_market_order', {
      p_order_id: order.id,
      p_user_id: order.user_id,
      p_trading_pair: order.trading_pair,
      p_side: order.side,
      p_price: marketPrice.toString(),
      p_quantity: quantity.toString(),
      p_fee: fee.toString(),
      p_total: total.toString(),
      p_base_currency: baseCurrency,
      p_quote_currency: quoteCurrency,
    });

    if (error) {
      logger.error('Market order execution failed', error);
      throw new Error(`Failed to execute market order: ${error.message}`);
    }

    logger.info('Market order executed successfully', {
      orderId: order.id,
      price: marketPrice.toString(),
      quantity: quantity.toString(),
      total: total.toString(),
    });

    return data as Transaction;
  } catch (error) {
    logger.error('Market order execution error', error);
    throw error;
  }
}

/**
 * 检查并执行待成交的限价单
 * 此函数应该由定时任务调用（如 Netlify Scheduled Function）
 */
export async function matchLimitOrders(): Promise<{ matched: number; failed: number }> {
  const supabase = createAdminClient();

  try {
    logger.info('Starting limit order matching process');

    // 1. 获取所有待成交的限价单
    const { data: pendingOrders, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'pending')
      .eq('order_type', 'limit')
      .order('created_at', { ascending: true });

    if (fetchError) {
      logger.error('Failed to fetch pending limit orders', fetchError);
      return { matched: 0, failed: 0 };
    }

    if (!pendingOrders || pendingOrders.length === 0) {
      logger.info('No pending limit orders to match');
      return { matched: 0, failed: 0 };
    }

    logger.info(`Found ${pendingOrders.length} pending limit orders`);

    // 2. 获取所有交易对的当前价格
    const tradingPairs = [...new Set(pendingOrders.map((o) => o.trading_pair))];
    const prices: Record<string, string> = {};

    for (const pair of tradingPairs) {
      try {
        const ticker = await getMarketTicker(pair);
        prices[pair] = ticker.price;
      } catch (error) {
        logger.error(`Failed to fetch price for ${pair}`, error);
      }
    }

    // 3. 检查每个订单是否满足成交条件
    let matched = 0;
    let failed = 0;

    for (const order of pendingOrders) {
      try {
        const currentPrice = decimal(prices[order.trading_pair]);
        const limitPrice = decimal(order.price!);

        // 判断是否满足成交条件
        let shouldExecute = false;

        if (order.side === 'buy') {
          // 买单：市场价 <= 限价
          shouldExecute = currentPrice.lte(limitPrice);
        } else {
          // 卖单：市场价 >= 限价
          shouldExecute = currentPrice.gte(limitPrice);
        }

        if (shouldExecute) {
          logger.info('Limit order triggered', {
            orderId: order.id,
            side: order.side,
            limitPrice: limitPrice.toString(),
            currentPrice: currentPrice.toString(),
          });

          // 执行限价单
          await executeLimitOrder(order, currentPrice.toString());
          matched++;
        }
      } catch (error) {
        logger.error(`Failed to process limit order ${order.id}`, error);
        failed++;
      }
    }

    logger.info('Limit order matching completed', { matched, failed });
    return { matched, failed };
  } catch (error) {
    logger.error('Limit order matching process error', error);
    return { matched: 0, failed: 0 };
  }
}

/**
 * 执行限价单成交
 */
async function executeLimitOrder(order: Order, executionPrice: string): Promise<void> {
  const supabase = createAdminClient();

  try {
    // 计算成交金额和手续费
    const quantity = decimal(order.quantity);
    const price = decimal(executionPrice);
    const total = price.times(quantity);
    const fee = total.times(TRADING_FEE_RATE);

    // 解析交易对
    const [baseCurrency, quoteCurrency] = order.trading_pair.split('/');

    // 使用数据库事务执行
    const { error } = await supabase.rpc('execute_limit_order', {
      p_order_id: order.id,
      p_user_id: order.user_id,
      p_trading_pair: order.trading_pair,
      p_side: order.side,
      p_price: executionPrice,
      p_quantity: quantity.toString(),
      p_fee: fee.toString(),
      p_total: total.toString(),
      p_base_currency: baseCurrency,
      p_quote_currency: quoteCurrency,
    });

    if (error) {
      throw new Error(`Failed to execute limit order: ${error.message}`);
    }

    logger.info('Limit order executed', {
      orderId: order.id,
      price: executionPrice,
      quantity: quantity.toString(),
    });
  } catch (error) {
    logger.error('Limit order execution error', error);
    throw error;
  }
}

/**
 * 取消订单并解冻余额
 */
export async function cancelOrder(orderId: string, userId: string): Promise<void> {
  const supabase = createAdminClient();

  try {
    logger.info('Cancelling order', { orderId, userId });

    // 获取订单信息
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !order) {
      throw new Error('Order not found');
    }

    // 检查订单状态
    if (order.status !== 'pending' && order.status !== 'partial') {
      throw new Error(`Cannot cancel order with status: ${order.status}`);
    }

    // 使用数据库事务取消订单并解冻余额
    const { error } = await supabase.rpc('cancel_order', {
      p_order_id: orderId,
      p_user_id: userId,
    });

    if (error) {
      throw new Error(`Failed to cancel order: ${error.message}`);
    }

    // 记录安全日志
    await supabase.from('security_logs').insert({
      user_id: userId,
      event_type: 'order_cancelled',
      metadata: { order_id: orderId, timestamp: new Date().toISOString() },
    });

    logger.info('Order cancelled successfully', { orderId });
  } catch (error) {
    logger.error('Cancel order error', error);
    throw error;
  }
}

/**
 * 冻结余额（下限价单时）
 */
export async function freezeBalance(
  userId: string,
  currency: string,
  amount: string
): Promise<void> {
  const supabase = createAdminClient();

  try {
    const { error } = await supabase.rpc('freeze_wallet_balance', {
      p_user_id: userId,
      p_currency: currency,
      p_amount: amount,
    });

    if (error) {
      throw new Error(`Failed to freeze balance: ${error.message}`);
    }

    logger.info('Balance frozen', { userId, currency, amount });
  } catch (error) {
    logger.error('Freeze balance error', error);
    throw error;
  }
}

/**
 * 解冻余额（取消订单时）
 */
export async function unfreezeBalance(
  userId: string,
  currency: string,
  amount: string
): Promise<void> {
  const supabase = createAdminClient();

  try {
    const { error } = await supabase.rpc('unfreeze_wallet_balance', {
      p_user_id: userId,
      p_currency: currency,
      p_amount: amount,
    });

    if (error) {
      throw new Error(`Failed to unfreeze balance: ${error.message}`);
    }

    logger.info('Balance unfrozen', { userId, currency, amount });
  } catch (error) {
    logger.error('Unfreeze balance error', error);
    throw error;
  }
}

