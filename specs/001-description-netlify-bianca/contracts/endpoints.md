# API Endpoints Summary

**Feature**: 加密货币交易平台  
**总端点数**: 28  
**最后更新**: 2025-10-11

---

## 端点概览

### 认证接口 (5个)

| 端点 | 方法 | 认证 | 用途 |
|------|------|------|------|
| `/api/auth/register` | POST | 否 | 用户注册 |
| `/api/auth/login` | POST | 否 | 用户登录 |
| `/api/auth/logout` | POST | 是 | 用户登出 |
| `/api/auth/refresh` | POST | 否 | 刷新令牌 |
| `/api/auth/reset-password` | POST | 否 | 密码重置 |

### 用户管理接口 (3个)

| 端点 | 方法 | 认证 | 用途 |
|------|------|------|------|
| `/api/user/profile` | GET | 是 | 获取用户资料 |
| `/api/user/profile` | PATCH | 是 | 更新用户资料 |
| `/api/user/change-password` | POST | 是 | 修改密码 |

### 钱包接口 (5个)

| 端点 | 方法 | 认证 | 用途 |
|------|------|------|------|
| `/api/wallet/balances` | GET | 是 | 获取所有余额 |
| `/api/wallet/{currency}/balance` | GET | 是 | 获取指定币种余额 |
| `/api/wallet/{currency}/deposit` | POST | 是 | 模拟充值 |
| `/api/wallet/{currency}/withdraw` | POST | 是 | 申请提现 |
| `/api/wallet/transactions` | GET | 是 | 钱包交易历史 |

### 市场行情接口 (4个)

| 端点 | 方法 | 认证 | 用途 |
|------|------|------|------|
| `/api/market/prices` | GET | 否 | 所有交易对价格 |
| `/api/market/{trading_pair}/price` | GET | 否 | 指定交易对价格 |
| `/api/market/{trading_pair}/kline` | GET | 否 | K线数据 |
| `/api/market/{trading_pair}/depth` | GET | 否 | 订单簿深度 |

### 交易接口 (6个)

| 端点 | 方法 | 认证 | 用途 |
|------|------|------|------|
| `/api/orders/create` | POST | 是 | 创建订单 |
| `/api/orders/{order_id}/cancel` | POST | 是 | 取消订单 |
| `/api/orders/active` | GET | 是 | 当前委托订单 |
| `/api/orders/history` | GET | 是 | 历史订单 |
| `/api/orders/{order_id}` | GET | 是 | 订单详情 |
| `/api/transactions` | GET | 是 | 成交记录 |

### 安全接口 (5个)

| 端点 | 方法 | 认证 | 用途 |
|------|------|------|------|
| `/api/security/2fa/enable` | POST | 是 | 启用2FA |
| `/api/security/2fa/verify` | POST | 是 | 验证2FA |
| `/api/security/2fa/disable` | POST | 是 | 禁用2FA |
| `/api/security/trading-password` | POST | 是 | 设置交易密码 |
| `/api/security/login-history` | GET | 是 | 登录历史 |

---

## 实现方式

所有 API 端点通过 **Netlify Functions** 实现：

```
netlify/functions/
├── auth/
│   ├── register.ts
│   ├── login.ts
│   ├── logout.ts
│   ├── refresh.ts
│   └── reset-password.ts
├── user/
│   ├── profile.ts
│   └── change-password.ts
├── wallet/
│   ├── balances.ts
│   ├── balance.ts
│   ├── deposit.ts
│   ├── withdraw.ts
│   └── transactions.ts
├── market/
│   ├── prices.ts
│   ├── price.ts
│   ├── kline.ts
│   └── depth.ts
├── orders/
│   ├── create.ts
│   ├── cancel.ts
│   ├── active.ts
│   ├── history.ts
│   ├── detail.ts
│   └── transactions.ts
└── security/
    ├── 2fa-enable.ts
    ├── 2fa-verify.ts
    ├── 2fa-disable.ts
    ├── trading-password.ts
    └── login-history.ts
```

---

## 外部依赖

### 1. Supabase Services
- **Auth**: 用户认证和会话管理
- **Database**: PostgreSQL 数据存储
- **RLS**: 行级安全策略

### 2. External APIs
- **CoinGecko API**: 基础市场价格
- **Binance API**: K线和深度数据

---

## 错误码规范

| 错误码 | HTTP状态码 | 说明 |
|--------|-----------|------|
| `UNAUTHORIZED` | 401 | 未认证或令牌无效 |
| `FORBIDDEN` | 403 | 无权限访问 |
| `NOT_FOUND` | 404 | 资源不存在 |
| `VALIDATION_ERROR` | 400 | 请求参数验证失败 |
| `INSUFFICIENT_BALANCE` | 400 | 余额不足 |
| `ORDER_NOT_FOUND` | 404 | 订单不存在 |
| `ORDER_CANNOT_CANCEL` | 400 | 订单无法取消 |
| `INVALID_TRADING_PASSWORD` | 401 | 交易密码错误 |
| `RATE_LIMIT_EXCEEDED` | 429 | 请求频率超限 |
| `INTERNAL_SERVER_ERROR` | 500 | 服务器内部错误 |

---

## 响应格式

### 成功响应
```json
{
  "data": { /* 响应数据 */ },
  "message": "操作成功"
}
```

### 错误响应
```json
{
  "code": "INSUFFICIENT_BALANCE",
  "message": "余额不足",
  "details": {
    "required": "1.5",
    "available": "0.8",
    "currency": "BTC"
  }
}
```

### 分页响应
```json
{
  "data": [ /* 数据数组 */ ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

---

## 认证流程

```
1. 用户注册 → POST /api/auth/register
2. 邮箱验证 → 点击邮件链接
3. 用户登录 → POST /api/auth/login
   ← 返回 access_token 和 refresh_token
4. 访问受保护资源 → 在 Header 中携带 token
   Authorization: Bearer <access_token>
5. Token过期 → POST /api/auth/refresh
6. 用户登出 → POST /api/auth/logout
```

---

## 安全措施

1. **HTTPS**: 所有请求必须使用HTTPS
2. **JWT认证**: 使用Supabase提供的JWT令牌
3. **请求频率限制**: 
   - 登录: 5次/分钟
   - 其他API: 100次/分钟
4. **输入验证**: 所有输入必须验证
5. **SQL注入防护**: 使用参数化查询
6. **XSS防护**: 前端转义所有用户输入

---

## 测试端点

### Health Check
```
GET /api/health
返回: { "status": "ok", "timestamp": "2025-10-11T10:00:00Z" }
```

### API Version
```
GET /api/version
返回: { "version": "1.0.0", "build": "20251011" }
```

---

## 下一步

- ✅ API规范设计完成
- ⬜ 实现Netlify Functions
- ⬜ 编写API集成测试
- ⬜ 生成API文档站点（Swagger UI）

