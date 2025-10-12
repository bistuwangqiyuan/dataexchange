/**
 * POST /api/user/change-password
 * 修改登录密码
 */

import type { APIRoute } from 'astro';
import { getCurrentUser } from '@/lib/services/auth.service';
import { createServerClient } from '@/lib/supabase/client';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';
import { ErrorCode } from '@/types/api.types';
import { changePasswordSchema } from '@/lib/utils/validation';

export const prerender = false;

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

    // 验证输入
    const validation = changePasswordSchema.safeParse(body);
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

    const { old_password, new_password } = validation.data;
    const supabase = createServerClient();

    // Reason: 先验证旧密码是否正确
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: old_password,
    });

    if (signInError) {
      logger.warn('Old password verification failed', { userId: user.id });
      return new Response(
        JSON.stringify(errorResponse(ErrorCode.UNAUTHORIZED, 'Incorrect old password')),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 更新密码
    const { error: updateError } = await supabase.auth.updateUser({
      password: new_password,
    });

    if (updateError) {
      logger.error('Password update failed', updateError);
      return new Response(
        JSON.stringify(errorResponse(ErrorCode.INTERNAL_ERROR, 'Failed to update password')),
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
      metadata: { timestamp: new Date().toISOString() },
    });

    logger.info('Password changed successfully', { userId: user.id });

    return new Response(
      JSON.stringify(
        successResponse({
          message: 'Password changed successfully',
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
    logger.error('Change password endpoint error', error);

    const message = error instanceof Error ? error.message : 'Failed to change password';

    return new Response(
      JSON.stringify(errorResponse(ErrorCode.INTERNAL_ERROR, message)),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

