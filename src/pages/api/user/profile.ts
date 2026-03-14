/**
 * GET/PATCH /api/user/profile
 * 获取或更新用户资料
 */

import type { APIRoute } from 'astro';
import { getCurrentUser } from '@/lib/services/auth.service';
import { getDb } from '@/lib/db/neon';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';
import { ErrorCode } from '@/types/api.types';

export const prerender = false;

/**
 * 获取用户资料
 */
export const GET: APIRoute = async ({ request }) => {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return new Response(
        JSON.stringify(errorResponse(ErrorCode.UNAUTHORIZED, 'Please login first')),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const sql = getDb();
    const rows = await sql`SELECT id, email, is_verified, created_at, last_login_at, updated_at FROM users WHERE id = ${user.id}`;
    const userData = rows[0];

    if (!userData) {
      logger.error('Failed to fetch user profile', { userId: user.id });
      return new Response(
        JSON.stringify(errorResponse(ErrorCode.INTERNAL_ERROR, 'Failed to fetch profile')),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify(successResponse(userData)),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'private, max-age=60',
        },
      }
    );
  } catch (error) {
    logger.error('Get profile endpoint error', error);

    const message = error instanceof Error ? error.message : 'Failed to fetch profile';

    return new Response(
      JSON.stringify(errorResponse(ErrorCode.INTERNAL_ERROR, message)),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

/**
 * 更新用户资料
 */
export const PATCH: APIRoute = async ({ request }) => {
  try {
    const user = await getCurrentUser(request);
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
    const sql = getDb();

    const allowedFields = ['email', 'is_verified', 'last_login_at'];
    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) updates[field] = body[field];
    }
    if (Object.keys(updates).length === 0) {
      return new Response(
        JSON.stringify(errorResponse(ErrorCode.INVALID_INPUT, 'No valid fields to update')),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let rows: unknown[];
    if (updates.email !== undefined) {
      rows = await sql`
        UPDATE users SET email = ${String(updates.email)}, updated_at = NOW()
        WHERE id = ${user.id}
        RETURNING id, email, is_verified, created_at, last_login_at, updated_at
      `;
    } else if (updates.is_verified !== undefined) {
      rows = await sql`
        UPDATE users SET is_verified = ${Boolean(updates.is_verified)}, updated_at = NOW()
        WHERE id = ${user.id}
        RETURNING id, email, is_verified, created_at, last_login_at, updated_at
      `;
    } else {
      rows = await sql`
        UPDATE users SET last_login_at = ${updates.last_login_at as string}, updated_at = NOW()
        WHERE id = ${user.id}
        RETURNING id, email, is_verified, created_at, last_login_at, updated_at
      `;
    }
    const data = (rows as Record<string, unknown>[])[0];
    if (!data) {
      return new Response(
        JSON.stringify(errorResponse(ErrorCode.INTERNAL_ERROR, 'Failed to update profile')),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    logger.info('User profile updated', { userId: user.id, fields: Object.keys(updates) });
    return new Response(
      JSON.stringify(successResponse(data)),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    logger.error('Update profile endpoint error', error);

    const message = error instanceof Error ? error.message : 'Failed to update profile';

    return new Response(
      JSON.stringify(errorResponse(ErrorCode.INTERNAL_ERROR, message)),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

