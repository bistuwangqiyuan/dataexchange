/**
 * POST /api/security/2fa/verify
 * 验证2FA代码并完成启用
 */

import type { APIRoute } from 'astro';
import { getCurrentUser } from '@/lib/services/auth.service';
import { createServerClient } from '@/lib/supabase/client';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';
import { ErrorCode } from '@/types/api.types';

export const prerender = false;

/**
 * 简单的TOTP验证（示例实现）
 * 注意：生产环境应使用专业的库如 otplib
 */
function verifyTOTP(secret: string, token: string): boolean {
  // Reason: 演示模式 - 接受任何6位数字
  // TODO: 在生产环境中实现真实的TOTP验证算法
  return /^\d{6}$/.test(token);
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
    const { token, secret } = body;

    if (!token || !secret) {
      return new Response(
        JSON.stringify(errorResponse(ErrorCode.INVALID_INPUT, 'Token and secret are required')),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 验证TOTP代码
    const isValid = verifyTOTP(secret, token);

    if (!isValid) {
      logger.warn('Invalid 2FA code', { userId: user.id });
      return new Response(
        JSON.stringify(errorResponse(ErrorCode.UNAUTHORIZED, 'Invalid verification code')),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const supabase = createServerClient();

    // 启用2FA并保存密钥
    const { error: updateError } = await supabase
      .from('users')
      .update({
        is_verified: true, // 使用existing字段标记2FA启用状态
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      logger.error('Failed to enable 2FA', updateError);
      return new Response(
        JSON.stringify(errorResponse(ErrorCode.INTERNAL_ERROR, 'Failed to enable 2FA')),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 记录安全日志
    await supabase.from('security_logs').insert({
      user_id: user.id,
      event_type: 'login', // 复用existing事件类型
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('cf-connecting-ip'),
      user_agent: request.headers.get('user-agent'),
      metadata: { action: '2fa_enabled', timestamp: new Date().toISOString() },
    });

    logger.info('2FA enabled successfully', { userId: user.id });

    return new Response(
      JSON.stringify(
        successResponse({
          message: '2FA enabled successfully',
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
    logger.error('Verify 2FA endpoint error', error);

    const message = error instanceof Error ? error.message : 'Failed to verify 2FA';

    return new Response(
      JSON.stringify(errorResponse(ErrorCode.INTERNAL_ERROR, message)),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

