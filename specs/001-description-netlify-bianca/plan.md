# Implementation Plan: 加密货币在线交易平台

**Feature Branch**: `001-description-netlify-bianca`  
**Plan Version**: 1.0.0  
**Created**: 2025-10-11  
**Plan Type**: Feature  
**Priority**: High  
**Estimated Effort**: 6-8周（160-200小时）

---

## 目标概述 (Objective Overview)

开发一个基于Jamstack架构的加密货币在线交易平台（演示/教育版本），类似Binance的功能，支持用户注册、钱包管理、实时行情查看、现货交易（市价单和限价单）、订单管理和安全设置。系统部署到Netlify，使用Supabase作为后端服务，提供完整的交易体验但不处理真实资金。

---

## Constitution Check (项目原则检查)

### 符合的原则 ✅

- [x] **原则 1 - TDD**: 已准备完整的测试策略，将先编写测试后实现功能
  - 单元测试覆盖率目标：≥80%
  - 每个功能包含：预期用例、边界情况、失败场景测试
  - 测试文件组织在 `/tests` 目录，镜像主应用结构

- [x] **原则 2 - 文档**: 所有代码将包含详细的JSDoc注释
  - 所有公共API函数包含完整的参数和返回值说明
  - 复杂逻辑使用 `// Reason:` 注释说明原因
  - 已生成：research.md, data-model.md, api-specification.yaml, quickstart.md

- [x] **原则 3 - Jamstack**: 完全符合Jamstack架构
  - 前端：Astro静态站点生成
  - API：Netlify Functions（无服务器）
  - 数据库：Supabase PostgreSQL（远程）
  - 部署：Netlify Platform

- [x] **原则 4 - 输入记录**: 所有用户交互和决策已记录
  - 用户需求记录在 spec.md
  - 技术决策记录在 research.md
  - API设计记录在 contracts/
  - 数据模型记录在 data-model.md

- [x] **原则 5 - 数据安全**: 实施完整的安全策略
  - Supabase RLS（行级安全）保护所有表
  - 密码使用bcrypt加密存储
  - JWT令牌认证
  - 敏感操作要求2FA或交易密码
  - 所有输入验证和清理

- [x] **原则 6 - 移动优先**: UI采用响应式设计
  - 使用Tailwind CSS移动优先断点
  - 所有核心功能支持移动设备
  - 触摸友好的交互设计

- [x] **原则 7 - 实时同步**: 使用轮询实现准实时更新
  - 市场价格每5秒更新（短轮询）
  - 订单状态通过定时任务检查
  - 未来可扩展为Supabase Realtime

- [x] **原则 8 - 可追溯**: 完整的审计日志
  - wallet_transactions表记录所有资金变动
  - security_logs表记录所有安全操作
  - orders和transactions表记录所有交易
  - 每条记录包含时间戳和用户ID

### 不适用的原则及说明

无。所有原则均适用于本项目。

---

## 业务需求 (Business Requirements)

### 背景 (Background)

加密货币交易是当前金融科技的热点领域。本项目旨在创建一个教育/演示级别的加密货币交易平台，让用户在不涉及真实资金的情况下，完整体验加密货币交易的流程，包括：
- 账户注册和安全管理
- 多币种钱包管理
- 实时市场行情查看
- 模拟交易（市价单和限价单）
- 订单和交易历史管理

### 用户故事 (User Stories)

**主要用户故事（按优先级）**:

1. **P1 - 用户注册与登录**: 作为新用户，我想要注册账户并安全登录，以便开始使用交易平台
2. **P1 - 查看市场行情**: 作为交易者，我想要查看加密货币的实时价格和K线图，以便做出交易决策
3. **P1 - 执行交易**: 作为交易者，我想要下市价单和限价单，以便买卖加密货币
4. **P2 - 管理钱包**: 作为用户，我想要查看余额并模拟充值提现，以便管理我的资产
5. **P2 - 查看订单历史**: 作为交易者，我想要查看我的交易记录，以便追踪我的交易活动
6. **P2 - 安全设置**: 作为用户，我想要启用2FA和交易密码，以便保护我的账户安全
7. **P3 - 资产概览**: 作为用户，我想要在仪表板看到总资产和盈亏，以便了解整体情况

### 成功标准 (Acceptance Criteria)

**核心成功标准**:
1. ✅ 用户能在3分钟内完成注册流程
2. ✅ 市场价格每5秒更新一次，页面加载时间<2秒
3. ✅ 市价单能在1秒内成交
4. ✅ 限价单能在价格到达后5秒内自动成交
5. ✅ 系统支持100个并发用户无延迟
6. ✅ 所有核心功能在移动端流畅运行
7. ✅ 95%的操作首次尝试成功
8. ✅ 测试覆盖率达到80%以上
9. ✅ 所有linter检查通过
10. ✅ 生产环境正常运行时间≥99.5%

---

## 技术设计 (Technical Design)

### 技术栈确认 (Tech Stack Confirmation)

- **前端框架**: Astro 4.x + React 18
- **UI样式**: Tailwind CSS 3.x
- **图表库**: TradingView Lightweight Charts
- **状态管理**: React Context + Hooks
- **表单验证**: Zod
- **HTTP客户端**: Fetch API
- **数学库**: Decimal.js (高精度计算)
- **数据库**: Supabase PostgreSQL
- **认证**: Supabase Auth (JWT)
- **API层**: Netlify Functions
- **部署**: Netlify Platform
- **测试框架**: Vitest + Playwright
- **代码质量**: ESLint + Prettier + TypeScript
- **其他依赖**: 
  - @supabase/supabase-js (Supabase客户端)
  - @netlify/functions (函数类型)
  - bcryptjs (密码加密)
  - otplib (2FA TOTP)

### 架构决策 (Architecture Decisions)

**关键决策（来自research.md）**:

1. **行情数据源**: CoinGecko API (基础价格) + Binance API (K线和深度)
   - 通过Netlify Functions实现缓存层
   - 降低API调用频率
   - 提供真实市场数据

2. **充值/提现**: 模拟功能（演示模式）
   - 新用户自动分配初始余额
   - 提供模拟充值和提现流程
   - 所有操作仅记录在数据库

3. **订单撮合**: 模拟撮合机制
   - 市价单立即按当前市场价成交
   - 限价单通过定时任务检查并成交
   - 无需维护复杂的订单簿

#### 数据模型 (Data Model)

详见 `data-model.md`，核心表：

```
- users: 用户账户
- wallets: 多币种钱包
- orders: 交易订单
- transactions: 成交记录
- wallet_transactions: 钱包历史
- market_prices: 市场价格缓存
- security_logs: 安全日志
```

#### API 端点 (API Endpoints)

详见 `contracts/api-specification.yaml`，共28个端点：

- 认证: 5个 (注册、登录、登出、刷新、重置密码)
- 用户: 3个 (资料、修改密码)
- 钱包: 5个 (余额、充值、提现、历史)
- 市场: 4个 (价格、K线、深度)
- 交易: 6个 (下单、取消、查询)
- 安全: 5个 (2FA、交易密码、日志)

#### 组件结构 (Component Structure)

```
src/
├── components/
│   ├── layout/
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   └── Sidebar.astro
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── ResetPasswordForm.tsx
│   ├── market/
│   │   ├── PriceTable.tsx
│   │   ├── TradingChart.tsx
│   │   └── DepthChart.tsx
│   ├── trading/
│   │   ├── OrderForm.tsx
│   │   ├── OrderBook.tsx
│   │   └── OrderHistory.tsx
│   ├── wallet/
│   │   ├── BalanceCard.tsx
│   │   ├── DepositModal.tsx
│   │   └── WithdrawModal.tsx
│   └── security/
│       ├── TwoFactorSetup.tsx
│       └── LoginHistory.tsx
├── pages/
│   ├── index.astro (首页/仪表板)
│   ├── market.astro (市场行情)
│   ├── trade/[pair].astro (交易页面)
│   ├── wallet.astro (钱包)
│   ├── orders.astro (订单管理)
│   ├── security.astro (安全设置)
│   ├── auth/
│   │   ├── login.astro
│   │   ├── register.astro
│   │   └── reset-password.astro
│   └── api/ (API路由)
├── lib/
│   ├── supabase.ts (Supabase客户端)
│   ├── api.ts (API封装)
│   ├── auth.ts (认证工具)
│   ├── decimal.ts (精度计算)
│   └── constants.ts (常量定义)
└── types/
    ├── user.ts
    ├── wallet.ts
    ├── order.ts
    └── market.ts
```

---

## 测试策略 (Testing Strategy)

### 单元测试 (Unit Tests)

**目标覆盖率**: 80%+

**关键测试用例**:

1. **认证模块** (`tests/auth/`)
   - ✅ 用户注册（成功、邮箱重复、密码弱）
   - ✅ 用户登录（成功、邮箱错误、密码错误、账号未验证）
   - ✅ 密码重置（成功、邮箱不存在）
   - ✅ Token刷新（成功、无效token）

2. **钱包模块** (`tests/wallet/`)
   - ✅ 查询余额（成功、未认证）
   - ✅ 模拟充值（成功、金额无效）
   - ✅ 申请提现（成功、余额不足、地址无效、未设置交易密码）
   - ✅ 余额更新原子性（并发安全）

3. **交易模块** (`tests/trading/`)
   - ✅ 创建市价单（成功、余额不足、数量无效）
   - ✅ 创建限价单（成功、价格无效）
   - ✅ 取消订单（成功、订单不存在、已成交）
   - ✅ 限价单撮合（价格达到、价格未达到）
   - ✅ 手续费计算准确性

4. **市场数据模块** (`tests/market/`)
   - ✅ 获取价格列表（成功、API失败处理）
   - ✅ 获取K线数据（不同周期）
   - ✅ 缓存机制有效性

5. **精度计算** (`tests/lib/decimal.test.ts`)
   - ✅ 高精度加减乘除
   - ✅ BTC 8位小数精度
   - ✅ ETH 18位小数精度
   - ✅ 手续费计算无精度损失

### 集成测试 (Integration Tests)

- [x] Supabase连接测试
- [x] RLS策略验证
- [x] API端点响应测试
- [x] 完整交易流程测试（注册→充值→下单→成交→查询）
- [x] 并发订单处理测试

### UI测试 (User Acceptance Testing)

使用Playwright进行E2E测试：

- [x] 移动设备（<768px）核心功能测试
- [x] 桌面设备（>1024px）完整功能测试
- [x] 跨浏览器测试（Chrome、Firefox、Safari）
- [x] 弱网环境数据加载测试
- [x] 用户完整旅程测试

---

## 实施步骤 (Implementation Steps)

### Phase 1: 基础设施搭建 (第1-2周)

- [x] 创建项目仓库和分支
- [ ] 初始化Astro项目
- [ ] 配置Tailwind CSS
- [ ] 配置TypeScript和ESLint
- [ ] 创建Supabase项目
- [ ] 运行数据库迁移（schema.sql）
- [ ] 配置Supabase RLS策略
- [ ] 配置Netlify项目
- [ ] 设置环境变量
- [ ] 创建基础Layout组件
- [ ] 配置测试框架（Vitest + Playwright）

**交付物**:
- ✅ 项目可本地运行
- ✅ 数据库表创建完成
- ✅ 基础页面框架

### Phase 2: 认证与用户管理 (第3周)

**测试驱动顺序**:
1. 编写认证API测试用例
2. 实现Netlify Functions (auth/)
3. 编写前端组件测试
4. 实现UI组件
5. 手动测试和修复

**开发任务**:
- [ ] 实现用户注册API
- [ ] 实现用户登录API
- [ ] 实现密码重置API
- [ ] 实现Token刷新机制
- [ ] 创建登录/注册表单组件
- [ ] 实现受保护路由
- [ ] 集成Supabase Auth
- [ ] 编写单元测试（覆盖率>80%）

**验收标准**:
- ✅ 用户可以注册账户
- ✅ 用户可以登录和登出
- ✅ 密码重置功能正常
- ✅ 所有测试通过

### Phase 3: 市场行情系统 (第4周)

**开发任务**:
- [ ] 实现CoinGecko API集成
- [ ] 实现Binance API集成
- [ ] 创建价格缓存机制（Netlify Functions）
- [ ] 实现K线数据获取
- [ ] 集成TradingView Charts
- [ ] 创建市场价格表组件
- [ ] 创建交易深度图组件
- [ ] 实现自动价格刷新（轮询）
- [ ] 编写市场数据测试

**验收标准**:
- ✅ 显示实时价格
- ✅ K线图正常渲染
- ✅ 价格自动更新
- ✅ API错误友好提示

### Phase 4: 钱包管理系统 (第5周)

**开发任务**:
- [ ] 实现钱包余额查询API
- [ ] 实现模拟充值API
- [ ] 实现提现申请API
- [ ] 实现钱包历史查询API
- [ ] 创建钱包余额卡片组件
- [ ] 创建充值模态框
- [ ] 创建提现表单
- [ ] 实现余额实时更新
- [ ] 测试余额更新原子性
- [ ] 编写钱包模块测试

**验收标准**:
- ✅ 显示所有币种余额
- ✅ 模拟充值功能正常
- ✅ 提现流程完整
- ✅ 历史记录准确

### Phase 5: 交易系统 (第6-7周)

**开发任务**:
- [ ] 实现订单创建API（市价单）
- [ ] 实现订单创建API（限价单）
- [ ] 实现订单取消API
- [ ] 实现订单查询API
- [ ] 实现限价单定时检查（Netlify Scheduled Function）
- [ ] 实现撮合逻辑
- [ ] 创建交易表单组件
- [ ] 创建订单列表组件
- [ ] 实现余额冻结/解冻
- [ ] 实现手续费计算
- [ ] 编写交易核心逻辑测试
- [ ] 测试并发订单处理

**验收标准**:
- ✅ 市价单立即成交
- ✅ 限价单自动成交
- ✅ 订单可以取消
- ✅ 余额变动准确
- ✅ 并发安全

### Phase 6: 安全与设置 (第8周)

**开发任务**:
- [ ] 实现2FA启用/禁用API
- [ ] 实现交易密码设置API
- [ ] 实现登录历史查询API
- [ ] 创建2FA设置组件
- [ ] 创建交易密码设置表单
- [ ] 创建登录历史列表
- [ ] 实现敏感操作验证
- [ ] 编写安全模块测试

**验收标准**:
- ✅ 2FA功能正常
- ✅ 交易密码保护有效
- ✅ 登录历史准确记录

### Phase 7: 测试与优化 (第9周)

- [ ] 运行完整单元测试套件
- [ ] 运行集成测试
- [ ] 运行E2E测试（Playwright）
- [ ] 性能测试（100并发）
- [ ] 安全扫描
- [ ] 移动端适配测试
- [ ] 修复所有linter错误
- [ ] 代码审查
- [ ] 优化数据库索引
- [ ] 优化API响应时间

**目标**:
- ✅ 测试覆盖率≥80%
- ✅ 所有测试通过
- ✅ 无linter错误
- ✅ 页面加载<3秒
- ✅ API响应<1秒

### Phase 8: 文档与部署 (第10周)

- [ ] 更新README.md
- [ ] 编写用户使用指南
- [ ] 生成API文档站点（Swagger UI）
- [ ] 创建CHANGELOG.md
- [ ] 部署到Netlify生产环境
- [ ] 配置自定义域名
- [ ] 设置监控告警
- [ ] 进行生产环境验证测试

**交付物**:
- ✅ 完整的README和文档
- ✅ 生产环境可访问
- ✅ 所有功能验证通过

---

## 风险与依赖 (Risks & Dependencies)

### 风险识别 (Risks)

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| CoinGecko API限流 | 中 | 高 | 实施缓存、使用Binance备份、降级提示 |
| 浮点数精度问题 | 高 | 高 | 使用Decimal.js、字符串存储、充分测试 |
| 并发订单超卖 | 中 | 高 | 数据库事务、行锁、乐观锁 |
| Netlify Functions超时 | 低 | 中 | 优化代码、拆分长任务、监控 |
| Supabase RLS配置错误 | 中 | 高 | 代码审查、安全测试、最小权限原则 |
| 测试覆盖不足 | 中 | 中 | 强制80%覆盖率、PR检查 |
| 移动端性能问题 | 低 | 中 | 懒加载、代码分割、CDN |

### 外部依赖 (Dependencies)

**关键依赖**:
- [ ] Supabase项目创建（需要账号）
- [ ] Netlify项目创建（需要账号）
- [ ] CoinGecko API访问（无需密钥）
- [ ] Binance API访问（无需密钥）
- [ ] GitHub仓库（代码托管）

**内部依赖**:
- [ ] 数据模型设计完成 ✅
- [ ] API规范定义完成 ✅
- [ ] 技术决策完成 ✅
- [ ] 测试策略制定完成 ✅

---

## 交付物清单 (Deliverables Checklist)

### 代码交付物
- [ ] 完整的Astro前端应用
- [ ] 28个Netlify Functions
- [ ] 完整的数据库schema
- [ ] 7个核心组件库
- [ ] 类型定义文件

### 测试交付物
- [ ] 单元测试（覆盖率>80%）
- [ ] 集成测试套件
- [ ] E2E测试脚本
- [ ] 性能测试报告
- [ ] 安全测试报告

### 文档交付物
- [x] 技术研究文档（research.md） ✅
- [x] 数据模型文档（data-model.md） ✅
- [x] API规范（api-specification.yaml） ✅
- [x] 快速开始指南（quickstart.md） ✅
- [ ] 完整README.md
- [ ] 用户使用手册
- [ ] API文档站点
- [ ] CHANGELOG.md

### 部署交付物
- [ ] Netlify生产环境配置
- [ ] 环境变量模板
- [ ] netlify.toml配置
- [ ] 部署脚本
- [ ] 监控配置

---

## 进度跟踪 (Progress Tracking)

### 当前状态

**已完成**:
- ✅ Phase 0: 技术研究和架构决策
- ✅ Phase 1: 数据模型设计
- ✅ Phase 1: API合约定义
- ✅ Phase 1: 开发指南创建

**进行中**:
- 🔄 Phase 1: 基础设施搭建

**待开始**:
- ⬜ Phase 2-8

### 里程碑 (Milestones)

| 里程碑 | 目标日期 | 状态 |
|--------|----------|------|
| M1: 项目规划完成 | Week 1 | ✅ 已完成 |
| M2: 基础设施就绪 | Week 2 | 🔄 进行中 |
| M3: 认证系统完成 | Week 3 | ⬜ 待开始 |
| M4: 市场行情完成 | Week 4 | ⬜ 待开始 |
| M5: 钱包系统完成 | Week 5 | ⬜ 待开始 |
| M6: 交易系统完成 | Week 7 | ⬜ 待开始 |
| M7: 安全功能完成 | Week 8 | ⬜ 待开始 |
| M8: 测试优化完成 | Week 9 | ⬜ 待开始 |
| M9: 生产环境上线 | Week 10 | ⬜ 待开始 |

---

## 质量门控 (Quality Gates)

每个Phase完成前必须通过以下检查：

### 代码质量门控
- ✅ ESLint检查无错误
- ✅ TypeScript编译无错误
- ✅ Prettier格式化通过
- ✅ 无console.log（生产代码）
- ✅ 无硬编码的密钥或URL

### 测试质量门控
- ✅ 单元测试覆盖率≥80%
- ✅ 所有测试通过（100%通过率）
- ✅ 集成测试通过
- ✅ 关键路径E2E测试通过

### 安全质量门控
- ✅ 所有输入已验证
- ✅ SQL注入防护到位
- ✅ XSS防护到位
- ✅ 敏感数据加密存储
- ✅ RLS策略正确配置

### 性能质量门控
- ✅ 页面加载时间<3秒
- ✅ API响应时间<1秒
- ✅ 支持100并发用户
- ✅ Lighthouse性能评分>80

---

## 下一步行动 (Next Actions)

### 立即执行（本周）
1. 初始化Astro项目和依赖
2. 创建Supabase项目并运行迁移
3. 配置Netlify项目和环境变量
4. 创建基础Layout组件
5. 设置测试框架

### 短期计划（下周）
1. 开始Phase 2: 认证系统开发
2. 编写认证API测试用例
3. 实现用户注册和登录功能
4. 创建登录/注册UI组件

### 长期计划
- 按照实施步骤逐步完成Phase 2-8
- 定期审查进度和风险
- 持续更新文档

---

## 审批记录 (Approval Record)

| 角色 | 签名 | 日期 |
|------|------|------|
| 技术架构师 | [APPROVED] | 2025-10-11 |
| 项目负责人 | [PENDING] | - |

---

**计划状态**: ✅ **已批准，可以开始实施**

**下一个命令**: 开始开发 - 初始化项目结构
