# 加密货币在线交易平台

> 基于 Astro + Supabase + Tailwind CSS 构建的教育演示版加密货币交易平台

## ✨ 功能特性

- 🔐 **用户认证系统** - 注册、登录、邮箱验证
- 💰 **钱包管理** - 多币种资产管理、充值/提现（模拟）
- 📊 **实时行情** - CoinGecko + Binance API 提供真实市场数据
- 📈 **交易功能** - 市价单/限价单、订单管理
- 📖 **订单簿** - 实时买卖盘数据
- 📜 **交易历史** - 完整的订单和成交记录
- 🔒 **安全保护** - RLS 数据安全、安全日志记录
- 📱 **响应式设计** - 移动端友好的 UI

## 🚀 技术栈

- **前端**: Astro + React + TypeScript + Tailwind CSS
- **后端**: Supabase (PostgreSQL + Auth + RLS)
- **API**: CoinGecko API + Binance API（真实行情）
- **部署**: Netlify
- **测试**: Vitest + Playwright
- **代码质量**: ESLint + Prettier + TypeScript strict

## 📁 项目结构

```
dataexchange/
├── src/
│   ├── components/        # React 组件
│   ├── layouts/           # Astro 布局
│   ├── lib/
│   │   ├── services/      # 业务逻辑层
│   │   ├── supabase/      # Supabase 客户端
│   │   └── utils/         # 工具函数
│   ├── pages/             # Astro 页面和 API 路由
│   └── types/             # TypeScript 类型定义
├── netlify/
│   └── functions/         # Netlify Functions
├── tests/
│   ├── unit/              # 单元测试
│   └── e2e/               # E2E 测试
└── specs/                 # 项目规范文档
```

## 🛠️ 开发指南

### 前置要求

- Node.js >= 18
- pnpm >= 8
- Supabase 账号
- Netlify 账号（部署用）

### 环境配置

1. 复制环境变量模板：
```bash
cp .env.example .env
```

2. 在 Supabase 控制台创建项目，获取：
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

3. 运行数据库迁移：
```bash
# 在 Supabase SQL Editor 中执行
# 复制并运行 database/migrations/001_initial_schema.sql
# 详细说明见 database/README.md
```

### 本地开发

1. 安装依赖：
```bash
pnpm install
```

2. 启动开发服务器：
```bash
pnpm dev
```

3. 访问 http://localhost:4321

### 测试

```bash
# 单元测试
pnpm test

# 测试覆盖率
pnpm test:ci

# E2E 测试
pnpm test:e2e
```

### 代码质量

```bash
# Lint 检查
pnpm lint

# 自动修复
pnpm lint:fix

# 格式化代码
pnpm format
```

### 构建

```bash
# 生产构建
pnpm build

# 预览构建结果
pnpm preview
```

## 🚢 部署

### Netlify 部署

1. 连接 GitHub 仓库到 Netlify
2. 配置构建设置：
   - Build command: `pnpm run build`
   - Publish directory: `dist`
3. 添加环境变量（同 .env 文件）
4. 部署

## 📚 文档

详细文档位于 `specs/001-description-netlify-bianca/`:

- **spec.md** - 功能规范
- **plan.md** - 实施计划
- **data-model.md** - 数据库设计
- **contracts/** - API 接口规范
- **quickstart.md** - 快速开始指南

## ⚠️ 重要说明

**这是一个教育演示项目**，使用模拟充值/提现和模拟订单撮合机制。**请勿**用于实际交易！

主要限制：
- ❌ 未连接真实区块链网络
- ❌ 未实现真实订单撮合引擎
- ❌ 未实现 KYC/AML 合规流程
- ✅ 使用真实市场行情数据（CoinGecko + Binance）
- ✅ 完整的用户认证和授权
- ✅ 生产级代码质量和测试覆盖

## 📄 许可

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 联系

- 项目仓库: [GitHub](https://github.com/your-repo/dataexchange)
- 问题反馈: [Issues](https://github.com/your-repo/dataexchange/issues)

---

**⚡ 由 Astro 驱动 | 🗄️ Supabase 提供数据服务 | 🚀 部署于 Netlify**

