/**
 * 环境变量检查函数（Neon + JWT）
 */

export const handler = async () => {
  const envCheck = {
    hasDatabaseUrl: !!(process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL),
    hasJwtSecret: !!process.env.JWT_SECRET,
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  };

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(envCheck, null, 2),
  };
};
