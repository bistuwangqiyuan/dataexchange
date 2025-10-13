/**
 * 环境变量检查函数
 * 用于验证Netlify环境变量是否正确配置
 */

export const handler = async () => {
  const envCheck = {
    hasSupabaseUrl: !!process.env.PUBLIC_SUPABASE_URL,
    hasAnonKey: !!process.env.PUBLIC_SUPABASE_ANON_KEY,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    nodeEnv: process.env.NODE_ENV,
    supabaseUrlLength: process.env.PUBLIC_SUPABASE_URL?.length || 0,
    anonKeyLength: process.env.PUBLIC_SUPABASE_ANON_KEY?.length || 0,
    serviceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
    // 显示URL的前20个字符（用于调试）
    supabaseUrlPrefix: process.env.PUBLIC_SUPABASE_URL?.substring(0, 30) || 'NOT SET',
    timestamp: new Date().toISOString(),
  };

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(envCheck, null, 2),
  };
};

