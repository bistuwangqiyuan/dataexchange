/**
 * POST /api/auth/logout
 * 用户登出
 */

import type { APIRoute } from 'astro';
import { logoutUser } from '@/lib/services/auth.service';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';
import { ErrorCode } from '@/types/api.types';

export const prerender = false;

export const POST: APIRoute = async () => {
  try {
    await logoutUser();

    return new Response(JSON.stringify(successResponse({ message: 'Logged out successfully' })), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    logger.error('Logout endpoint error', error);
    
    const message = error instanceof Error ? error.message : 'Logout failed';
    
    return new Response(
      JSON.stringify(errorResponse(ErrorCode.INTERNAL_ERROR, message)),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

