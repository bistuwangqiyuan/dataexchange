/**
 * Wallet Service
 * 
 * 处理钱包余额查询、充值、提现等业务逻辑
 */

import { createAdminClient, createServerClient } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';
import Decimal from 'decimal.js';
import type { WalletBalance, DepositRequest, WithdrawRequest } from '@/types/api.types';

/**
 * 获取用户所有钱包余额
 */
export async function getAllWalletBalances(userId: string): Promise<WalletBalance[]> {
  const supabase = createServerClient();

  logger.info('Fetching wallet balances', { userId });

  const { data: wallets, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .order('currency', { ascending: true });

  if (error) {
    logger.error('Failed to fetch wallet balances', error);
    throw new Error('Failed to fetch wallet balances');
  }

  // 如果没有钱包，返回空数组
  if (!wallets || wallets.length === 0) {
    return [];
  }

  return wallets.map(wallet => ({
    currency: wallet.currency,
    balance: wallet.balance,
    frozen: wallet.frozen,
    available: new Decimal(wallet.balance).minus(wallet.frozen).toString(),
  }));
}

/**
 * 获取指定币种余额
 */
export async function getWalletBalance(
  userId: string,
  currency: string
): Promise<WalletBalance | null> {
  const supabase = createServerClient();

  const { data: wallet, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .eq('currency', currency)
    .single();

  if (error || !wallet) {
    return null;
  }

  return {
    currency: wallet.currency,
    balance: wallet.balance,
    frozen: wallet.frozen,
    available: new Decimal(wallet.balance).minus(wallet.frozen).toString(),
  };
}

/**
 * 模拟充值
 */
export async function depositFunds(
  userId: string,
  depositData: DepositRequest
): Promise<void> {
  const supabase = createAdminClient();

  logger.info('Processing deposit', { userId, depositData });

  // 验证金额
  const amount = new Decimal(depositData.amount);
  if (amount.lte(0)) {
    throw new Error('Deposit amount must be greater than zero');
  }

  // 验证币种
  const validCurrencies = ['BTC', 'ETH', 'USDT', 'BNB', 'SOL'];
  if (!validCurrencies.includes(depositData.currency)) {
    throw new Error('Invalid currency');
  }

  try {
    // 1. 获取或创建钱包
    const { data: wallet } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .eq('currency', depositData.currency)
      .single();

    if (wallet) {
      // 更新现有钱包余额
      const newBalance = new Decimal(wallet.balance).plus(amount);
      await supabase
        .from('wallets')
        .update({ balance: newBalance.toString() })
        .eq('user_id', userId)
        .eq('currency', depositData.currency);
    } else {
      // 创建新钱包
      await supabase
        .from('wallets')
        .insert({
          user_id: userId,
          currency: depositData.currency,
          balance: amount.toString(),
          frozen: '0',
        });
    }

    // 2. 记录充值历史
    await supabase
      .from('wallet_transactions')
      .insert({
        user_id: userId,
        currency: depositData.currency,
        amount: amount.toString(),
        type: 'deposit',
        status: 'completed',
        description: '模拟充值',
      });

    logger.info('Deposit completed', { userId, amount: amount.toString(), currency: depositData.currency });
  } catch (error) {
    logger.error('Deposit failed', error);
    throw new Error('Failed to process deposit');
  }
}

/**
 * 申请提现
 */
export async function withdrawFunds(
  userId: string,
  withdrawData: WithdrawRequest
): Promise<void> {
  const supabase = createAdminClient();

  logger.info('Processing withdrawal', { userId, withdrawData });

  // 验证金额
  const amount = new Decimal(withdrawData.amount);
  if (amount.lte(0)) {
    throw new Error('Withdrawal amount must be greater than zero');
  }

  // 验证币种
  const validCurrencies = ['BTC', 'ETH', 'USDT', 'BNB', 'SOL'];
  if (!validCurrencies.includes(withdrawData.currency)) {
    throw new Error('Invalid currency');
  }

  try {
    // 1. 检查余额
    const { data: wallet } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .eq('currency', withdrawData.currency)
      .single();

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const availableBalance = new Decimal(wallet.balance).minus(wallet.frozen);
    if (availableBalance.lt(amount)) {
      throw new Error('Insufficient balance');
    }

    // 2. 扣除余额
    const newBalance = new Decimal(wallet.balance).minus(amount);
    await supabase
      .from('wallets')
      .update({ balance: newBalance.toString() })
      .eq('user_id', userId)
      .eq('currency', withdrawData.currency);

    // 3. 记录提现历史
    await supabase
      .from('wallet_transactions')
      .insert({
        user_id: userId,
        currency: withdrawData.currency,
        amount: amount.neg().toString(), // 负数表示提现
        type: 'withdrawal',
        status: 'completed',
        description: `模拟提现${withdrawData.address ? ` 到地址 ${withdrawData.address}` : ''}`,
      });

    logger.info('Withdrawal completed', { userId, amount: amount.toString(), currency: withdrawData.currency });
  } catch (error) {
    logger.error('Withdrawal failed', error);
    throw error;
  }
}

/**
 * 查询钱包交易历史
 */
export async function getWalletTransactions(
  userId: string,
  options?: {
    currency?: string;
    type?: 'deposit' | 'withdrawal' | 'buy_order' | 'sell_order';
    page?: number;
    page_size?: number;
  }
): Promise<{ transactions: any[]; total: number }> {
  const supabase = createServerClient();

  let query = supabase
    .from('wallet_transactions')
    .select('*', { count: 'exact' })
    .eq('user_id', userId);

  if (options?.currency) {
    query = query.eq('currency', options.currency);
  }

  if (options?.type) {
    query = query.eq('type', options.type);
  }

  const page = options?.page || 1;
  const pageSize = options?.page_size || 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  query = query
    .range(from, to)
    .order('created_at', { ascending: false });

  const { data: transactions, error, count } = await query;

  if (error) {
    logger.error('Failed to fetch wallet transactions', error);
    throw new Error('Failed to fetch wallet transactions');
  }

  return {
    transactions: transactions || [],
    total: count || 0,
  };
}

/**
 * 计算总资产价值（以USDT计）
 */
export async function getTotalAssetValue(userId: string): Promise<string> {
  const supabase = createServerClient();

  // 获取所有钱包
  const { data: wallets } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId);

  if (!wallets || wallets.length === 0) {
    return '0';
  }

  // 获取市场价格
  const { data: prices } = await supabase
    .from('market_prices')
    .select('*');

  if (!prices) {
    return '0';
  }

  // 计算总价值
  let totalValue = new Decimal(0);

  for (const wallet of wallets) {
    const balance = new Decimal(wallet.balance);

    if (wallet.currency === 'USDT') {
      totalValue = totalValue.plus(balance);
    } else {
      // 找到对应的交易对价格
      const tradingPair = `${wallet.currency}/USDT`;
      const price = prices.find(p => p.trading_pair === tradingPair);

      if (price) {
        const value = balance.mul(price.price);
        totalValue = totalValue.plus(value);
      }
    }
  }

  return totalValue.toFixed(2);
}
