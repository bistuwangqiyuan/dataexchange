/**
 * POST /api/auth/reset-password
 * 密码重置（发送重置邮件）
 */

import type { APIRoute } from 'astro';
import { createServerClient } from '@/lib/supabase/client';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';
import { ErrorCode } from '@/types/api.types';
import { emailSchema } from '@/lib/utils/validation';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    
    // 验证邮箱格式
    const validation = emailSchema.safeParse(body.email);
    if (!validation.success) {
      return new Response(
        JSON.stringify(
          errorResponse(ErrorCode.INVALID_INPUT, validation.error.errors[0].message)
        ),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { email } = body;
    const supabase = createServerClient();

    // 发送密码重置邮件
    // Reason: Supabase 会自动发送包含重置链接的邮件
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${request.headers.get('origin')}/auth/reset-password/confirm`,
    });

    // Reason: 为了安全，即使邮箱不存在也返回成功，防止邮箱枚举攻击
    if (error) {
      logger.warn('Password reset email send attempt', { email, error: error.message });
    } else {
      logger.info('Password reset email sent', { email });
    }

    return new Response(
      JSON.stringify(
        successResponse({
          message: 'If the email exists, a password reset link has been sent to it.',
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
    logger.error('Reset password endpoint error', error);

    const message = error instanceof Error ? error.message : 'Password reset failed';

    return new Response(
      JSON.stringify(errorResponse(ErrorCode.INTERNAL_ERROR, message)),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

