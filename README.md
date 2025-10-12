# 加密货币在线交易平台 (Crypto Exchange Platform)

<div align="center">

![Status](https://img.shields.io/badge/Status-Ready%20for%20Deployment-green)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![Test Coverage](https://img.shields.io/badge/Coverage-85%25-yellow)
![License](https://img.shields.io/badge/License-MIT-orange)

**演示模式 · 教育用途 · Jamstack架构**

[功能特性](#-功能特性) • [技术栈](#-技术栈) • [快速开始](#-快速开始) • [部署指南](#-部署指南) • [API文档](#-api-文档)

</div>

---

## 📖 项目简介

这是一个基于Jamstack架构的加密货币交易平台演示项目，提供完整的交易功能体验但不涉及真实资金交易。适合学习和演示现代Web应用开发。

### ✨ 功能特性

#### 核心功能
- ✅ **用户认证系统**
  - 邮箱注册/登录
  - JWT令牌认证
  - 密码重置
  - 2FA双因素认证（TOTP）
  - 交易密码保护

- ✅ **实时市场行情**
  - 实时价格更新（10秒刷新）
  - 主流加密货币支持（BTC, ETH, BNB, XRP, ADA等）
  - 24小时价格变动
  - 交易量统计
  - K线图数据API

- ✅ **现货交易**
  - 市价单（即时成交）
  - 限价单（自动撮合）
  - 订单管理（查看、取消）
  - 成交历史
  - 实时订单簿

- ✅ **数字钱包**
  - 多币种余额管理
  - 模拟充值（演示模式）
  - 模拟提现（演示模式）
  - 交易历史记录
  - 余额冻结/解冻机制

- ✅ **安全功能**
  - Row Level Security (RLS)
  - 密码加密存储
  - 安全日志记录
  - 登录历史追踪
  - API速率限制

- ✅ **资产概览仪表板**
  - 总资产统计
  - 资产分布图
  - 24小时盈亏
  - 热门市场
  - 最近交易

---

## 🛠 技术栈

### 前端
- **框架**: Astro 4.x + React 18
- **样式**: Tailwind CSS 3.x
- **状态管理**: React Context + Hooks
- **图表**: TradingView Lightweight Charts (计划中)
- **表单验证**: Zod
- **HTTP客户端**: Fetch API

### 后端
- **API层**: Netlify Functions (Serverless)
- **数据库**: Supabase PostgreSQL
- **认证**: Supabase Auth (JWT)
- **实时数据**: CoinGecko API + Binance API

### 开发工具
- **语言**: TypeScript 5.x
- **包管理**: pnpm
- **测试**: Vitest + Playwright
- **代码质量**: ESLint + Prettier
- **CI/CD**: Netlify (自动部署)

---

## 🚀 快速开始

### 前置要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Supabase账号（免费）
- Netlify账号（免费）

### 1. 克隆项目

```bash
git clone https://github.com/your-org/crypto-exchange.git
cd crypto-exchange
git checkout 001-description-netlify-bianca
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置Supabase

#### 3.1 创建Supabase项目

1. 访问 [Supabase Dashboard](https://app.supabase.com)
2. 点击 "New Project"
3. 填写项目信息并等待创建完成

#### 3.2 执行数据库迁移

```bash
# 方法一：使用Supabase CLI（推荐）
supabase login
supabase link --project-ref your-project-ref
supabase db push

# 方法二：手动执行SQL
# 1. 打开Supabase Dashboard → SQL Editor
# 2. 复制并执行 database/migrations/001_initial_schema.sql
# 3. 复制并执行 database/migrations/002_stored_procedures.sql
```

#### 3.3 配置环境变量

```bash
cp .env.example .env.local
```

编辑 `.env.local`，填入Supabase配置：

```env
PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. 启动开发服务器

```bash
# 使用Netlify Dev（推荐，包含Functions）
netlify dev

# 或使用Astro Dev（仅前端）
pnpm dev
```

访问 http://localhost:8888

---

## 📦 部署指南

### 部署到Netlify

#### 1. 连接GitHub仓库

1. 登录 [Netlify Dashboard](https://app.netlify.com)
2. 点击 "Add new site" → "Import an existing project"
3. 选择GitHub仓库
4. 选择分支：`001-description-netlify-bianca`

#### 2. 配置构建设置

- **Build command**: `pnpm run build`
- **Publish directory**: `dist`
- **Functions directory**: `netlify/functions`

#### 3. 设置环境变量

在Netlify Dashboard → Site settings → Environment variables中添加：

```
PUBLIC_SUPABASE_URL=your_supabase_url
PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

#### 4. 触发部署

```bash
git push origin 001-description-netlify-bianca
```

或使用Netlify CLI：

```bash
pnpm run build
netlify deploy --prod
```

### 生产环境验证

部署完成后，验证以下功能：

- ✅ 用户注册和登录
- ✅ 市场行情显示
- ✅ 钱包余额查询
- ✅ 订单创建和查询
- ✅ API响应正常

---

## 📚 API 文档

### 认证接口

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/login` | 用户登录 |
| POST | `/api/auth/logout` | 用户登出 |
| POST | `/api/auth/refresh` | 刷新令牌 |
| POST | `/api/auth/reset-password` | 密码重置 |

### 市场接口

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/market/tickers` | 所有交易对价格 |
| GET | `/api/market/[pair]` | 单个交易对价格 |
| GET | `/api/market/kline/[pair]` | K线数据 |
| GET | `/api/market/orderbook/[pair]` | 订单簿深度 |

### 交易接口

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/api/orders/create` | 创建订单 |
| POST | `/api/orders/cancel/[id]` | 取消订单 |
| GET | `/api/orders/active` | 活跃订单 |
| GET | `/api/orders/history` | 历史订单 |
| GET | `/api/orders/[id]` | 订单详情 |
| GET | `/api/transactions` | 成交记录 |

### 钱包接口

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/wallet/balances` | 所有余额 |
| POST | `/api/wallet/[currency]/deposit` | 模拟充值 |
| POST | `/api/wallet/[currency]/withdraw` | 模拟提现 |
| GET | `/api/wallet/transactions` | 交易历史 |

📖 **完整API文档**: [API Specification](specs/001-description-netlify-bianca/contracts/api-specification.yaml)

---

## 🧪 测试

### 运行单元测试

```bash
# 运行所有测试
pnpm test

# 监听模式
pnpm test:watch

# 生成覆盖率报告
pnpm test:ci
```

### 运行E2E测试

```bash
# 启动开发服务器（另一个终端）
netlify dev

# 运行E2E测试
pnpm test:e2e
```

### 测试覆盖率

当前测试覆盖率：**85%** （目标：90%）

---

## 📂 项目结构

```
crypto-exchange/
├── src/
│   ├── components/        # React组件
│   │   ├── trading/      # 交易相关组件
│   │   ├── ui/           # 通用UI组件
│   │   ├── Header.tsx
│   │   └── Footer.astro
│   ├── layouts/          # 页面布局
│   ├── lib/              # 核心库
│   │   ├── services/     # 业务服务
│   │   ├── supabase/     # Supabase客户端
│   │   └── utils/        # 工具函数
│   ├── pages/            # 页面路由
│   │   ├── api/          # API路由
│   │   ├── index.astro   # 首页/仪表板
│   │   ├── markets.astro # 市场行情
│   │   ├── trade.astro   # 交易页面
│   │   ├── wallet.astro  # 钱包管理
│   │   └── orders.astro  # 订单管理
│   ├── styles/           # 全局样式
│   └── types/            # TypeScript类型
├── netlify/
│   └── functions/        # Serverless函数
├── database/
│   └── migrations/       # 数据库迁移
├── tests/                # 测试文件
├── specs/                # 规范文档
└── docs/                 # 项目文档
```

---

## 🔒 安全性

### 已实施的安全措施

- ✅ **Row Level Security (RLS)**: 所有数据表启用RLS
- ✅ **JWT认证**: 使用Supabase Auth进行身份验证
- ✅ **密码加密**: bcrypt哈希存储
- ✅ **输入验证**: Zod schema验证所有输入
- ✅ **SQL注入防护**: 参数化查询
- ✅ **XSS防护**: 输出转义
- ✅ **HTTPS强制**: Netlify自动启用
- ✅ **安全头部**: CSP, X-Frame-Options等
- ✅ **审计日志**: 记录所有敏感操作

### 安全最佳实践

- 🔐 不要将 `.env.local` 提交到Git
- 🔐 使用强密码和2FA保护账户
- 🔐 定期更新依赖包
- 🔐 监控安全漏洞扫描结果
- 🔐 遵循最小权限原则

---

## 🤝 贡献指南

欢迎贡献！请遵循以下步骤：

1. Fork本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

### 代码规范

- 遵循项目宪法 (`.specify/memory/constitution.md`)
- 测试覆盖率不低于90%
- 通过ESLint和Prettier检查
- 编写清晰的commit消息

---

## 📝 开发文档

- [技术研究文档](specs/001-description-netlify-bianca/research.md)
- [数据模型文档](specs/001-description-netlify-bianca/data-model.md)
- [实施计划](specs/001-description-netlify-bianca/plan.md)
- [任务清单](specs/001-description-netlify-bianca/tasks.md)
- [快速开始指南](specs/001-description-netlify-bianca/quickstart.md)
- [实施完成报告](IMPLEMENTATION_COMPLETE.md)

---

## ⚠️ 免责声明

**本项目仅供教育和演示用途。**

- ❌ 不处理真实资金
- ❌ 不提供真实的加密货币交易
- ❌ 不应用于生产环境的金融交易
- ✅ 适合学习Web开发技术
- ✅ 适合演示Jamstack架构
- ✅ 适合了解交易平台业务逻辑

---

## 📄 许可证

本项目采用 [MIT License](LICENSE) 许可证。

---

## 🙏 致谢

- [Astro](https://astro.build) - 现代Web框架
- [Supabase](https://supabase.com) - 开源Firebase替代品
- [Netlify](https://netlify.com) - Jamstack部署平台
- [CoinGecko](https://coingecko.com) - 加密货币价格API
- [Binance](https://binance.com) - K线数据API
- [Tailwind CSS](https://tailwindcss.com) - CSS框架

---

## 📞 联系方式

- **项目主页**: https://github.com/your-org/crypto-exchange
- **问题反馈**: [GitHub Issues](https://github.com/your-org/crypto-exchange/issues)
- **邮箱**: dev@example.com

---

<div align="center">

**⭐ 如果这个项目对您有帮助，请给一个Star！**

Made with ❤️ by DataExchange Team

</div>
