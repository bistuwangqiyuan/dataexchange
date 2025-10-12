/**
 * POST /api/security/2fa/disable
 * 禁用双因素认证
 */

import type { APIRoute } from 'astro';
import { getCurrentUser } from '@/lib/services/auth.service';
import { createServerClient } from '@/lib/supabase/client';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';
import { ErrorCode } from '@/types/api.types';

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
    const { password } = body;

    if (!password) {
      return new Response(
        JSON.stringify(errorResponse(ErrorCode.INVALID_INPUT, 'Password is required to disable 2FA')),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const supabase = createServerClient();

    // Reason: 验证密码以确保是用户本人操作
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password,
    });

    if (signInError) {
      logger.warn('Password verification failed for 2FA disable', { userId: user.id });
      return new Response(
        JSON.stringify(errorResponse(ErrorCode.UNAUTHORIZED, 'Incorrect password')),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 禁用2FA
    const { error: updateError } = await supabase
      .from('users')
      .update({
        is_verified: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      logger.error('Failed to disable 2FA', updateError);
      return new Response(
        JSON.stringify(errorResponse(ErrorCode.INTERNAL_ERROR, 'Failed to disable 2FA')),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 记录安全日志
    await supabase.from('security_logs').insert({
      user_id: user.id,
      event_type: 'login',
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('cf-connecting-ip'),
      user_agent: request.headers.get('user-agent'),
      metadata: { action: '2fa_disabled', timestamp: new Date().toISOString() },
    });

    logger.info('2FA disabled', { userId: user.id });

    return new Response(
      JSON.stringify(
        successResponse({
          message: '2FA disabled successfully',
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
    logger.error('Disable 2FA endpoint error', error);

    const message = error instanceof Error ? error.message : 'Failed to disable 2FA';

    return new Response(
      JSON.stringify(errorResponse(ErrorCode.INTERNAL_ERROR, message)),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

