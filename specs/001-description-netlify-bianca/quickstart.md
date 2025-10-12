# 快速开始指南 (Quick Start Guide)

**Feature**: 加密货币交易平台  
**Last Updated**: 2025-10-11

---

## 目标 (Goal)

本指南帮助开发者在30分钟内完成开发环境配置，并运行第一个功能。

---

## 前置要求 (Prerequisites)

### 必需工具
- ✅ **Node.js**: >= 18.0.0 ([下载](https://nodejs.org/))
- ✅ **pnpm**: >= 8.0.0 (`npm install -g pnpm`)
- ✅ **Git**: 最新版本
- ✅ **VS Code** (推荐) 或其他代码编辑器

### 必需账号
- ✅ **Supabase**: [创建免费账号](https://supabase.com)
- ✅ **Netlify**: [创建免费账号](https://netlify.com)
- ✅ **GitHub**: 代码仓库托管

### 可选但推荐
- 🔧 **Netlify CLI**: `npm install -g netlify-cli`
- 🔧 **Supabase CLI**: `npm install -g supabase`

---

## 步骤 1: 克隆仓库

```bash
# 克隆项目
git clone https://github.com/your-org/crypto-exchange.git
cd crypto-exchange

# 切换到功能分支
git checkout 001-description-netlify-bianca

# 安装依赖
pnpm install
```

---

## 步骤 2: Supabase 配置

### 2.1 创建 Supabase 项目

1. 访问 [Supabase Dashboard](https://app.supabase.com)
2. 点击 "New Project"
3. 填写项目信息:
   - **Name**: crypto-exchange-dev
   - **Database Password**: 设置强密码（保存好！）
   - **Region**: 选择最近的区域
4. 等待项目创建（约2分钟）

### 2.2 运行数据库迁移

```bash
# 方法一: 使用 Supabase CLI (推荐)
supabase login
supabase link --project-ref your-project-ref
supabase db push

# 方法二: 手动在 Supabase SQL Editor 执行
# 复制 docs/database/schema.sql 内容到 SQL Editor 执行
```

### 2.3 配置环境变量

复制 `.env.example` 到 `.env.local`:

```bash
cp .env.example .env.local
```

编辑 `.env.local`:

```bash
# Supabase Configuration
PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Supabase Service Role (仅后端使用)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# CoinGecko API (免费，无需密钥)
COINGECKO_API_URL=https://api.coingecko.com/api/v3

# Binance API (公开数据，无需密钥)
BINANCE_API_URL=https://api.binance.com

# Environment
NODE_ENV=development
```

**获取 Supabase Keys**:
1. Supabase Dashboard → Settings → API
2. 复制 `Project URL` 和 `anon/public` key
3. 复制 `service_role` key (⚠️ 保密！仅后端使用)

### 2.4 启用 Row Level Security (RLS)

在 Supabase SQL Editor 执行:

```sql
-- 已在 schema.sql 中包含
-- 确认所有表都启用了 RLS
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public';

-- 检查 RLS 策略
SELECT * FROM pg_policies;
```

---

## 步骤 3: 本地开发

### 3.1 启动开发服务器

```bash
# 启动 Astro 开发服务器 (http://localhost:4321)
pnpm dev

# 或使用 Netlify Dev (http://localhost:8888)
netlify dev
```

**推荐使用 `netlify dev`**，因为它会:
- 模拟 Netlify Functions 环境
- 模拟环境变量注入
- 模拟重定向和头部规则

### 3.2 访问应用

打开浏览器访问: `http://localhost:8888`

你应该看到:
- ✅ 首页加载
- ✅ 市场价格显示（来自 CoinGecko API）
- ✅ 注册/登录表单

### 3.3 创建测试账户

1. 点击 "注册"
2. 填写信息:
   - Email: test@example.com
   - Password: Test1234
3. 提交注册
4. 查看 Supabase Dashboard → Authentication → Users
   - 手动验证邮箱（Development模式）
5. 使用账号登录

---

## 步骤 4: 测试核心功能

### 4.1 测试用户注册和登录

```bash
# 运行认证测试
pnpm test tests/auth.test.ts

# 手动测试
# 1. 注册新账户
# 2. 检查 Supabase Auth Users
# 3. 登录
# 4. 检查钱包是否自动创建
```

### 4.2 测试市场行情

```bash
# 测试市场数据API
curl http://localhost:8888/api/market/prices

# 应返回:
{
  "prices": [
    {
      "trading_pair": "BTC/USDT",
      "current_price": "45000.50",
      "change_24h": "1.25",
      ...
    }
  ]
}
```

### 4.3 测试交易下单

```bash
# 获取认证令牌（登录后）
TOKEN="your-jwt-token"

# 创建市价单
curl -X POST http://localhost:8888/api/orders/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "trading_pair": "BTC/USDT",
    "order_type": "market",
    "side": "buy",
    "quantity": "0.001"
  }'

# 查看订单
curl http://localhost:8888/api/orders/active \
  -H "Authorization: Bearer $TOKEN"
```

---

## 步骤 5: 开发第一个功能

让我们实现 "获取用户余额" 功能作为示例。

### 5.1 创建 Netlify Function

创建文件 `netlify/functions/wallet/balances.ts`:

```typescript
import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

/**
 * 获取用户所有钱包余额
 * @route GET /api/wallet/balances
 * @auth Required
 */
export const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  // Reason: 只接受 GET 请求
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ 
        code: 'METHOD_NOT_ALLOWED',
        message: 'Method not allowed' 
      })
    };
  }

  try {
    // 1. 从 Header 获取 JWT token
    const authHeader = event.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        body: JSON.stringify({ 
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid authorization header' 
        })
      };
    }

    const token = authHeader.substring(7);

    // 2. 创建 Supabase 客户端
    const supabase = createClient(
      process.env.PUBLIC_SUPABASE_URL!,
      process.env.PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: { Authorization: `Bearer ${token}` }
        }
      }
    );

    // 3. 验证用户身份
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return {
        statusCode: 401,
        body: JSON.stringify({ 
          code: 'UNAUTHORIZED',
          message: 'Invalid token' 
        })
      };
    }

    // 4. 查询用户钱包（RLS自动过滤）
    const { data: wallets, error: dbError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', user.id);

    if (dbError) {
      console.error('Database error:', dbError);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch wallets' 
        })
      };
    }

    // 5. 计算总资产价值（这里简化处理，实际需要获取实时价格）
    const totalValueUSDT = wallets.reduce((sum, wallet) => {
      // 简化：假设所有币种价格
      const prices: Record<string, number> = {
        BTC: 45000,
        ETH: 3000,
        USDT: 1,
        BNB: 450,
        ADA: 0.65,
        XRP: 0.85
      };
      const value = parseFloat(wallet.total_balance) * (prices[wallet.currency] || 0);
      return sum + value;
    }, 0);

    // 6. 返回响应
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({
        wallets: wallets,
        total_value_usdt: totalValueUSDT.toFixed(2)
      })
    };

  } catch (error) {
    console.error('Unexpected error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error' 
      })
    };
  }
};
```

### 5.2 配置路由

编辑 `netlify.toml`:

```toml
[[redirects]]
  from = "/api/wallet/balances"
  to = "/.netlify/functions/wallet/balances"
  status = 200
```

### 5.3 编写测试

创建 `tests/wallet/balances.test.ts`:

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

describe('GET /api/wallet/balances', () => {
  let authToken: string;

  beforeAll(async () => {
    // 登录获取 token
    const supabase = createClient(
      process.env.PUBLIC_SUPABASE_URL!,
      process.env.PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'Test1234'
    });

    authToken = data.session!.access_token;
  });

  it('should return wallets for authenticated user', async () => {
    const response = await fetch('http://localhost:8888/api/wallet/balances', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('wallets');
    expect(data).toHaveProperty('total_value_usdt');
    expect(Array.isArray(data.wallets)).toBe(true);
    expect(data.wallets.length).toBeGreaterThan(0);
  });

  it('should return 401 without auth token', async () => {
    const response = await fetch('http://localhost:8888/api/wallet/balances');
    expect(response.status).toBe(401);
  });

  it('should return 401 with invalid token', async () => {
    const response = await fetch('http://localhost:8888/api/wallet/balances', {
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    });
    expect(response.status).toBe(401);
  });
});
```

### 5.4 运行测试

```bash
# 启动开发服务器（另一个终端）
netlify dev

# 运行测试
pnpm test tests/wallet/balances.test.ts
```

---

## 步骤 6: 部署到 Netlify

### 6.1 连接 Git 仓库

```bash
# 1. 推送代码到 GitHub
git add .
git commit -m "feat: add wallet balances API"
git push origin 001-description-netlify-bianca

# 2. 在 Netlify Dashboard 连接仓库
# - Site settings → Build & deploy → Link repository
# - 选择 GitHub 仓库
# - 选择分支: 001-description-netlify-bianca
```

### 6.2 配置构建设置

Netlify Dashboard → Build settings:

```
Build command: pnpm run build
Publish directory: dist
Functions directory: netlify/functions
```

### 6.3 设置环境变量

Netlify Dashboard → Site settings → Environment variables:

添加所有 `.env.local` 中的变量（除了 `PUBLIC_` 前缀的，它们会自动注入）

### 6.4 触发部署

```bash
# 方法一: 推送代码触发自动部署
git push origin 001-description-netlify-bianca

# 方法二: 使用 Netlify CLI 手动部署
pnpm run build
netlify deploy --prod
```

### 6.5 验证部署

访问你的 Netlify 站点URL: `https://your-site.netlify.app`

测试功能:
- ✅ 注册新账户
- ✅ 查看市场行情
- ✅ 查看钱包余额

---

## 常见问题 (FAQ)

### Q1: "Supabase connection refused" 错误？

**A**: 检查 `.env.local` 中的 `PUBLIC_SUPABASE_URL` 和 key 是否正确。

```bash
# 验证配置
echo $PUBLIC_SUPABASE_URL
# 应输出: https://xxxxx.supabase.co
```

### Q2: 市场价格不显示？

**A**: 检查 CoinGecko API 是否可访问:

```bash
curl https://api.coingecko.com/api/v3/ping
# 应返回: {"gecko_says":"(V3) To the Moon!"}
```

如果访问失败，可能需要配置代理或使用备用API。

### Q3: Netlify Functions 本地不工作？

**A**: 确保使用 `netlify dev` 而不是 `pnpm dev`:

```bash
# ✅ 正确
netlify dev

# ❌ Functions 不会运行
pnpm dev
```

### Q4: 数据库迁移失败？

**A**: 手动在 Supabase SQL Editor 执行迁移脚本:

1. 打开 Supabase Dashboard → SQL Editor
2. 复制 `docs/database/schema.sql` 内容
3. 点击 "Run" 执行
4. 检查是否有错误消息

### Q5: 测试失败 "User not found"？

**A**: 确保测试用户已创建并验证邮箱:

```bash
# 在 Supabase Dashboard 手动创建测试用户
# Authentication → Add user
# Email: test@example.com
# Password: Test1234
# Email Verified: ✅ (勾选)
```

---

## 下一步 (Next Steps)

恭喜！你已经完成基础配置。接下来可以：

1. **阅读架构文档**: `specs/001-*/research.md`
2. **查看数据模型**: `specs/001-*/data-model.md`
3. **浏览API规范**: `specs/001-*/contracts/api-specification.yaml`
4. **开始开发功能**: 参考 `README.md` 中的 TASK 列表

---

## 有用的资源

- 📖 [Astro 文档](https://docs.astro.build)
- 📖 [Supabase 文档](https://supabase.com/docs)
- 📖 [Netlify 文档](https://docs.netlify.com)
- 📖 [TradingView Charts](https://tradingview.github.io/lightweight-charts/)
- 📖 [CoinGecko API](https://www.coingecko.com/en/api/documentation)
- 📖 [Binance API](https://binance-docs.github.io/apidocs/)

---

## 获取帮助

- 💬 GitHub Issues: [项目Issues页面]
- 📧 Email: dev@crypto-exchange.com
- 📚 Wiki: [项目Wiki]

---

**Happy Coding! 🚀**

