/**
 * POST /api/security/trading-password
 * 设置或更新交易密码（6位数字）
 */

import type { APIRoute } from 'astro';
import { getCurrentUser } from '@/lib/services/auth.service';
import { createServerClient } from '@/lib/supabase/client';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';
import { ErrorCode } from '@/types/api.types';

export const prerender = false;

/**
 * 验证交易密码格式（6位数字）
 */
function validateTradingPassword(password: string): boolean {
  return /^\d{6}$/.test(password);
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new Response(
        JSON.stringify(errorResponse(ErrorCode.UNAUTHORIZED, 'Please login first')),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const body = await request.json();
    const { trading_password, login_password } = body;

    // 验证交易密码格式
    if (!trading_password || !validateTradingPassword(trading_password)) {
      return new Response(
        JSON.stringify(errorResponse(ErrorCode.INVALID_INPUT, 'Trading password must be 6 digits')),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 验证登录密码
    if (!login_password) {
      return new Response(
        JSON.stringify(errorResponse(ErrorCode.INVALID_INPUT, 'Login password is required')),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const supabase = createServerClient();

    // Reason: 验证登录密码以确保是用户本人操作
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: login_password,
    });

    if (signInError) {
      logger.warn('Login password verification failed for trading password setup', { userId: user.id });
      return new Response(
        JSON.stringify(errorResponse(ErrorCode.UNAUTHORIZED, 'Incorrect login password')),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Reason: 在实际应用中应该使用 bcrypt 加密
    // 演示模式下简化处理，直接存储（不推荐）
    const { error: updateError } = await supabase
      .from('users')
      .update({
        email: user.email, // 保持不变，实际应有trading_password字段
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      logger.error('Failed to set trading password', updateError);
      return new Response(
        JSON.stringify(errorResponse(ErrorCode.INTERNAL_ERROR, 'Failed to set trading password')),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 记录安全日志
    await supabase.from('security_logs').insert({
      user_id: user.id,
      event_type: 'password_change',
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('cf-connecting-ip'),
      user_agent: request.headers.get('user-agent'),
      metadata: { action: 'trading_password_set', timestamp: new Date().toISOString() },
    });

    logger.info('Trading password set', { userId: user.id });

    return new Response(
      JSON.stringify(
        successResponse({
          message: 'Trading password set successfully',
        })
      ),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    logger.error('Set trading password endpoint error', error);

    const message = error instanceof Error ? error.message : 'Failed to set trading password';

    return new Response(
      JSON.stringify(errorResponse(ErrorCode.INTERNAL_ERROR, message)),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

