/**
 * Validation Utilities
 * 
 * 使用 Zod 进行数据验证
 */

import { z } from 'zod';

/**
 * Email 验证
 */
export const emailSchema = z
  .string()
  .email('Invalid email format')
  .min(1, 'Email is required');

/**
 * Password 验证
 * 最少 8 位，包含大小写字母和数字
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Password must contain lowercase letter')
  .regex(/[A-Z]/, 'Password must contain uppercase letter')
  .regex(/[0-9]/, 'Password must contain number');

/**
 * Decimal 字符串验证（金额、价格等）
 */
export const decimalSchema = z
  .string()
  .regex(/^\d+(\.\d+)?$/, 'Must be a valid decimal number')
  .refine((val) => parseFloat(val) > 0, 'Must be greater than 0');

/**
 * Trading Pair 验证（如 BTC/USDT）
 */
export const tradingPairSchema = z
  .string()
  .regex(/^[A-Z]{2,10}\/[A-Z]{2,10}$/, 'Invalid trading pair format (e.g., BTC/USDT)');

/**
 * Currency 验证（如 BTC, ETH, USDT）
 */
export const currencySchema = z
  .string()
  .regex(/^[A-Z]{2,10}$/, 'Invalid currency code')
  .min(2, 'Currency code too short')
  .max(10, 'Currency code too long');

/**
 * 注册请求验证
 */
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

/**
 * 登录请求验证
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

/**
 * 创建订单请求验证
 */
export const createOrderSchema = z
  .object({
    trading_pair: tradingPairSchema,
    order_type: z.enum(['market', 'limit']),
    side: z.enum(['buy', 'sell']),
    price: decimalSchema.optional(),
    quantity: decimalSchema,
  })
  .refine(
    (data) => {
      // Limit 订单必须提供价格
      if (data.order_type === 'limit') {
        return data.price !== undefined;
      }
      return true;
    },
    {
      message: 'Price is required for limit orders',
      path: ['price'],
    }
  );

/**
 * 充值请求验证
 */
export const depositSchema = z.object({
  currency: currencySchema,
  amount: decimalSchema,
});

/**
 * 提现请求验证
 */
export const withdrawSchema = z.object({
  currency: currencySchema,
  amount: decimalSchema,
  address: z.string().optional(),
});

/**
 * 修改密码请求验证
 */
export const changePasswordSchema = z.object({
  old_password: z.string().min(1, 'Old password is required'),
  new_password: passwordSchema,
});

/**
 * UUID 验证
 */
export const uuidSchema = z
  .string()
  .uuid('Invalid UUID format');

/**
 * 分页参数验证
 */
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  page_size: z.number().int().positive().max(100).default(20),
});

/**
 * 日期范围验证
 */
export const dateRangeSchema = z
  .object({
    start_date: z.string().datetime().optional(),
    end_date: z.string().datetime().optional(),
  })
  .refine(
    (data) => {
      if (data.start_date && data.end_date) {
        return new Date(data.start_date) <= new Date(data.end_date);
      }
      return true;
    },
    {
      message: 'End date must be after start date',
      path: ['end_date'],
    }
  );

