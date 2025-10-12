/**
 * Wallet Service
 * 
 * 处理钱包相关业务逻辑
 */

import { createServerClient } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';
import { decimal, hasSufficientBalance, toDbString } from '@/lib/utils/decimal';
import type { Wallet, WalletTransaction } from '@/types/database.types';
import type { WalletBalance } from '@/types/api.types';

/**
 * 获取用户所有钱包余额
 */
export async function getUserWallets(userId: string): Promise<WalletBalance[]> {
  const supabase = createServerClient();

  logger.dbQuery('SELECT', 'wallets', { userId });

  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    logger.error('Failed to get user wallets', error);
    throw new Error('Failed to retrieve wallet balances');
  }

  return data.map(wallet => ({
    currency: wallet.currency,
    balance: wallet.balance,
    frozen: wallet.frozen,
    available: decimal(wallet.balance).minus(wallet.frozen).toFixed(),
  }));
}

/**
 * 获取指定币种的钱包
 */
export async function getWalletByCurrency(
  userId: string,
  currency: string
): Promise<Wallet | null> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .eq('currency', currency)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // 钱包不存在
    }
    logger.error('Failed to get wallet', error);
    throw new Error('Failed to retrieve wallet');
  }

  return data;
}

/**
 * 创建钱包（如果不存在）
 */
export async function ensureWalletExists(
  userId: string,
  currency: string
): Promise<Wallet> {
  const existing = await getWalletByCurrency(userId, currency);

  if (existing) {
    return existing;
  }

  const supabase = createServerClient();

  logger.dbQuery('INSERT', 'wallets', { userId, currency });

  const { data, error } = await supabase
    .from('wallets')
    .insert({
      user_id: userId,
      currency,
      balance: '0',
      frozen: '0',
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to create wallet', error);
    throw new Error('Failed to create wallet');
  }

  return data;
}

/**
 * 充值（模拟）
 */
export async function depositFunds(
  userId: string,
  currency: string,
  amount: string
): Promise<WalletTransaction> {
  const supabase = createServerClient();

  // 确保钱包存在
  const wallet = await ensureWalletExists(userId, currency);

  logger.info('Simulated deposit', { userId, currency, amount });

  // 创建充值记录
  const { data: transaction, error: txError } = await supabase
    .from('wallet_transactions')
    .insert({
      wallet_id: wallet.id,
      user_id: userId,
      type: 'deposit',
      currency,
      amount,
      status: 'completed', // 模拟模式直接完成
    })
    .select()
    .single();

  if (txError) {
    logger.error('Failed to create deposit transaction', txError);
    throw new Error('Failed to process deposit');
  }

  // 更新钱包余额
  const newBalance = decimal(wallet.balance).plus(amount);
  const { error: updateError } = await supabase
    .from('wallets')
    .update({ balance: toDbString(newBalance) })
    .eq('id', wallet.id);

  if (updateError) {
    logger.error('Failed to update wallet balance', updateError);
    throw new Error('Failed to update balance');
  }

  logger.info('Deposit completed', { userId, currency, amount });

  return transaction;
}

/**
 * 提现（模拟）
 */
export async function withdrawFunds(
  userId: string,
  currency: string,
  amount: string
): Promise<WalletTransaction> {
  const supabase = createServerClient();

  // 获取钱包
  const wallet = await getWalletByCurrency(userId, currency);

  if (!wallet) {
    throw new Error(`Wallet not found for currency: ${currency}`);
  }

  // 检查余额
  const available = decimal(wallet.balance).minus(wallet.frozen);
  if (!hasSufficientBalance(available, amount)) {
    throw new Error('Insufficient balance');
  }

  logger.info('Simulated withdrawal', { userId, currency, amount });

  // 创建提现记录
  const { data: transaction, error: txError } = await supabase
    .from('wallet_transactions')
    .insert({
      wallet_id: wallet.id,
      user_id: userId,
      type: 'withdrawal',
      currency,
      amount,
      status: 'completed', // 模拟模式直接完成
    })
    .select()
    .single();

  if (txError) {
    logger.error('Failed to create withdrawal transaction', txError);
    throw new Error('Failed to process withdrawal');
  }

  // 更新钱包余额
  const newBalance = decimal(wallet.balance).minus(amount);
  const { error: updateError } = await supabase
    .from('wallets')
    .update({ balance: toDbString(newBalance) })
    .eq('id', wallet.id);

  if (updateError) {
    logger.error('Failed to update wallet balance', updateError);
    throw new Error('Failed to update balance');
  }

  logger.info('Withdrawal completed', { userId, currency, amount });

  return transaction;
}

/**
 * 冻结资金（下单时）
 */
export async function freezeFunds(
  userId: string,
  currency: string,
  amount: string
): Promise<void> {
  const supabase = createServerClient();

  const wallet = await getWalletByCurrency(userId, currency);

  if (!wallet) {
    throw new Error(`Wallet not found for currency: ${currency}`);
  }

  const available = decimal(wallet.balance).minus(wallet.frozen);
  if (!hasSufficientBalance(available, amount)) {
    throw new Error('Insufficient balance to freeze');
  }

  const newFrozen = decimal(wallet.frozen).plus(amount);

  const { error } = await supabase
    .from('wallets')
    .update({ frozen: toDbString(newFrozen) })
    .eq('id', wallet.id);

  if (error) {
    logger.error('Failed to freeze funds', error);
    throw new Error('Failed to freeze funds');
  }

  logger.debug('Funds frozen', { userId, currency, amount });
}

/**
 * 解冻资金（取消订单时）
 */
export async function unfreezeFunds(
  userId: string,
  currency: string,
  amount: string
): Promise<void> {
  const supabase = createServerClient();

  const wallet = await getWalletByCurrency(userId, currency);

  if (!wallet) {
    throw new Error(`Wallet not found for currency: ${currency}`);
  }

  const newFrozen = decimal(wallet.frozen).minus(amount);

  if (newFrozen.lt(0)) {
    throw new Error('Cannot unfreeze more than frozen amount');
  }

  const { error } = await supabase
    .from('wallets')
    .update({ frozen: toDbString(newFrozen) })
    .eq('id', wallet.id);

  if (error) {
    logger.error('Failed to unfreeze funds', error);
    throw new Error('Failed to unfreeze funds');
  }

  logger.debug('Funds unfrozen', { userId, currency, amount });
}

/**
 * 获取钱包交易历史
 */
export async function getWalletTransactionHistory(
  userId: string,
  limit = 50
): Promise<WalletTransaction[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    logger.error('Failed to get transaction history', error);
    throw new Error('Failed to retrieve transaction history');
  }

  return data;
}

