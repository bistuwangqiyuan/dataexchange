# Tasks: 加密货币在线交易平台

**Feature**: 加密货币在线交易平台  
**Branch**: `001-description-netlify-bianca`  
**Created**: 2025-10-11  
**Last Updated**: 2025-10-11  
**Total Tasks**: 89  
**Estimated Effort**: 6-8周（160-200小时）

---

## 任务组织策略 (Task Organization Strategy)

本任务清单按**用户故事(User Story)**组织，确保每个故事可以独立实现和测试。

### 优先级说明
- **P1**: MVP核心功能（用户注册、市场行情、交易）
- **P2**: 重要功能（钱包、订单历史、安全）
- **P3**: 增强功能（仪表板）

### 任务标记
- `[P]`: 可并行执行的任务
- `[Story]`: 关联的用户故事编号（US1-US7）
- `[TDD]`: 测试驱动开发任务（测试先于实现）
- `[Checkpoint]`: 阶段检查点

---

## Phase 1: 项目初始化 (Setup)

**目标**: 建立项目基础设施，为所有用户故事提供基础环境

### 基础设施搭建

- **T001 [P]**: 初始化Astro项目
  - 文件: `package.json`, `astro.config.mjs`
  - 运行: `pnpm create astro@latest`
  - 配置TypeScript、React集成
  - 预计时间: 30分钟

- **T002 [P]**: 配置Tailwind CSS
  - 文件: `tailwind.config.mjs`, `src/styles/global.css`
  - 安装Tailwind CSS及相关插件
  - 配置移动优先断点
  - 预计时间: 30分钟

- **T003 [P]**: 配置ESLint和Prettier
  - 文件: `.eslintrc.json`, `.prettierrc`
  - 配置TypeScript规则
  - 配置代码格式化
  - 预计时间: 20分钟

- **T004 [P]**: 配置测试框架（Vitest）
  - 文件: `vitest.config.ts`, `tests/setup.ts`
  - 安装Vitest和相关工具
  - 配置测试环境
  - 预计时间: 40分钟

- **T005 [P]**: 配置Playwright（E2E测试）
  - 文件: `playwright.config.ts`
  - 安装Playwright
  - 配置浏览器测试
  - 预计时间: 30分钟

- **T006**: 创建项目目录结构
  - 创建: `src/components/`, `src/pages/`, `src/lib/`, `src/types/`
  - 创建: `netlify/functions/`, `tests/`
  - 预计时间: 10分钟

- **T007**: 配置环境变量模板
  - 文件: `.env.example`
  - 定义所有需要的环境变量
  - 添加说明注释
  - 预计时间: 15分钟

**交付物**: 
- ✅ 项目可本地运行
- ✅ 测试框架配置完成
- ✅ 代码质量工具就绪

**Checkpoint 1**: 运行 `pnpm dev` 确认项目启动，运行 `pnpm test` 确认测试框架工作

---

## Phase 2: 基础设施层 (Foundational)

**目标**: 建立所有用户故事依赖的核心基础设施（必须在任何用户故事之前完成）

### Supabase配置

- **T008**: 创建Supabase项目
  - 在Supabase Dashboard创建项目
  - 记录Project ID、URL和API Keys
  - 预计时间: 10分钟

- **T009**: 运行数据库迁移
  - 文件: `supabase/migrations/001_initial_schema.sql`
  - 执行data-model.md中的所有SQL
  - 创建7个核心表
  - 预计时间: 30分钟

- **T010**: 配置Row Level Security (RLS)
  - 为所有表启用RLS
  - 创建访问策略
  - 测试策略有效性
  - 预计时间: 45分钟

- **T011**: 配置Supabase Auth
  - 启用Email provider
  - 配置邮件模板
  - 设置JWT过期时间
  - 预计时间: 20分钟

### 核心库和工具

- **T012 [P]**: 创建Supabase客户端封装
  - 文件: `src/lib/supabase.ts`
  - 服务端和客户端版本
  - 类型定义
  - 预计时间: 30分钟

- **T013 [P]**: 创建高精度计算工具
  - 文件: `src/lib/decimal.ts`
  - 集成Decimal.js
  - 封装常用计算函数
  - 预计时间: 40分钟

- **T014 [P]**: 定义TypeScript类型
  - 文件: `src/types/user.ts`, `wallet.ts`, `order.ts`, `market.ts`
  - 所有实体的类型定义
  - API响应类型
  - 预计时间: 1小时

- **T015 [P]**: 创建API客户端封装
  - 文件: `src/lib/api.ts`
  - Fetch封装、错误处理
  - Token管理
  - 预计时间: 45分钟

- **T016 [P]**: 创建认证上下文
  - 文件: `src/lib/auth-context.tsx`
  - React Context管理用户状态
  - 登录/登出方法
  - 预计时间: 1小时

### 通用组件

- **T017 [P]**: 创建Layout组件
  - 文件: `src/components/layout/Header.astro`, `Footer.astro`
  - 全局Header和Footer
  - 响应式导航
  - 预计时间: 1.5小时

- **T018 [P]**: 创建通用UI组件
  - 文件: `src/components/ui/Button.tsx`, `Input.tsx`, `Modal.tsx`
  - 按钮、输入框、模态框
  - Tailwind样式
  - 预计时间: 2小时

### Netlify配置

- **T019**: 配置netlify.toml
  - 文件: `netlify.toml`
  - 构建命令和发布目录
  - 函数目录和重定向规则
  - 安全头部配置
  - 预计时间: 30分钟

- **T020**: 创建健康检查端点
  - 文件: `netlify/functions/health.ts`
  - 返回系统状态
  - 预计时间: 15分钟

**交付物**:
- ✅ 数据库表创建完成
- ✅ Supabase连接正常
- ✅ 核心库和工具就绪
- ✅ 基础组件可用

**Checkpoint 2**: 验证Supabase连接、测试RLS策略、确认类型定义无错误

---

## Phase 3: US1 - 用户注册与身份验证 (Priority: P1)

**User Story**: 新用户访问平台，需要创建账户以开始交易加密货币。

**Independent Test Criteria**: 
- ✅ 用户可以成功注册账户
- ✅ 用户可以接收验证邮件
- ✅ 用户可以成功登录
- ✅ 用户可以重置密码

### 测试 (TDD) [Story: US1]

- **T021 [TDD]**: 编写用户注册API测试
  - 文件: `tests/auth/register.test.ts`
  - 测试成功注册、邮箱重复、密码弱
  - 预计时间: 1小时

- **T022 [TDD]**: 编写用户登录API测试
  - 文件: `tests/auth/login.test.ts`
  - 测试成功登录、密码错误、账号未验证
  - 预计时间: 1小时

- **T023 [TDD]**: 编写密码重置API测试
  - 文件: `tests/auth/reset-password.test.ts`
  - 测试重置流程
  - 预计时间: 45分钟

### API实现 [Story: US1]

- **T024**: 实现用户注册API
  - 文件: `netlify/functions/auth/register.ts`
  - 验证输入、创建用户、发送验证邮件
  - 符合T021测试要求
  - 预计时间: 2小时

- **T025**: 实现用户登录API
  - 文件: `netlify/functions/auth/login.ts`
  - 验证凭证、返回JWT token
  - 符合T022测试要求
  - 预计时间: 1.5小时

- **T026**: 实现登出API
  - 文件: `netlify/functions/auth/logout.ts`
  - 清除会话
  - 预计时间: 30分钟

- **T027**: 实现密码重置API
  - 文件: `netlify/functions/auth/reset-password.ts`
  - 发送重置邮件、更新密码
  - 符合T023测试要求
  - 预计时间: 1.5小时

- **T028**: 实现Token刷新API
  - 文件: `netlify/functions/auth/refresh.ts`
  - 刷新过期token
  - 预计时间: 1小时

### UI组件 [Story: US1]

- **T029 [P]**: 创建注册表单组件
  - 文件: `src/components/auth/RegisterForm.tsx`
  - 表单验证、错误处理
  - 预计时间: 2小时

- **T030 [P]**: 创建登录表单组件
  - 文件: `src/components/auth/LoginForm.tsx`
  - 表单验证、错误处理
  - 预计时间: 1.5小时

- **T031 [P]**: 创建密码重置表单组件
  - 文件: `src/components/auth/ResetPasswordForm.tsx`
  - 两步流程UI
  - 预计时间: 1.5小时

### 页面 [Story: US1]

- **T032 [P]**: 创建注册页面
  - 文件: `src/pages/auth/register.astro`
  - 集成RegisterForm组件
  - 预计时间: 30分钟

- **T033 [P]**: 创建登录页面
  - 文件: `src/pages/auth/login.astro`
  - 集成LoginForm组件
  - 预计时间: 30分钟

- **T034 [P]**: 创建密码重置页面
  - 文件: `src/pages/auth/reset-password.astro`
  - 集成ResetPasswordForm组件
  - 预计时间: 30分钟

### 集成测试 [Story: US1]

- **T035**: E2E测试 - 完整注册登录流程
  - 文件: `tests/e2e/auth-flow.spec.ts`
  - 注册 → 验证 → 登录 → 登出
  - 预计时间: 1小时

**US1交付物**:
- ✅ 用户可以注册账户
- ✅ 用户可以登录和登出
- ✅ 密码重置功能正常
- ✅ 所有测试通过（100%）

**Checkpoint 3**: 手动测试注册登录流程，确认邮件发送，验证所有测试通过

---

## Phase 4: US2 - 实时市场行情查看 (Priority: P1)

**User Story**: 用户可以查看主要加密货币的实时价格和K线图。

**Independent Test Criteria**:
- ✅ 显示主要加密货币价格列表
- ✅ K线图正常渲染
- ✅ 价格自动刷新
- ✅ 切换时间周期功能正常

### 测试 (TDD) [Story: US2]

- **T036 [TDD]**: 编写市场价格API测试
  - 文件: `tests/market/prices.test.ts`
  - 测试价格列表获取、单个价格查询
  - 预计时间: 1小时

- **T037 [TDD]**: 编写K线数据API测试
  - 文件: `tests/market/kline.test.ts`
  - 测试不同时间周期
  - 预计时间: 1小时

### API实现 [Story: US2]

- **T038**: 实现CoinGecko API集成
  - 文件: `netlify/functions/market/prices.ts`
  - 获取主流币种价格
  - 5秒缓存
  - 符合T036测试要求
  - 预计时间: 2小时

- **T039**: 实现Binance K线API集成
  - 文件: `netlify/functions/market/kline.ts`
  - 获取历史K线数据
  - 按周期缓存
  - 符合T037测试要求
  - 预计时间: 2.5小时

- **T040**: 实现单个交易对价格API
  - 文件: `netlify/functions/market/price.ts`
  - 获取特定交易对价格
  - 预计时间: 1小时

- **T041**: 实现订单簿深度API
  - 文件: `netlify/functions/market/depth.ts`
  - 获取买卖盘数据
  - 预计时间: 1.5小时

### UI组件 [Story: US2]

- **T042**: 集成TradingView Lightweight Charts
  - 安装图表库
  - 创建封装组件
  - 预计时间: 1小时

- **T043**: 创建价格表组件
  - 文件: `src/components/market/PriceTable.tsx`
  - 显示所有交易对价格
  - 涨跌幅颜色标识
  - 预计时间: 2小时

- **T044**: 创建K线图组件
  - 文件: `src/components/market/TradingChart.tsx`
  - 集成TradingView
  - 时间周期切换
  - 预计时间: 3小时

- **T045**: 创建价格自动刷新Hook
  - 文件: `src/hooks/usePriceUpdate.ts`
  - 每5秒轮询价格
  - 预计时间: 1小时

- **T046**: 创建深度图组件
  - 文件: `src/components/market/DepthChart.tsx`
  - 买卖盘可视化
  - 预计时间: 2小时

### 页面 [Story: US2]

- **T047**: 创建市场行情页面
  - 文件: `src/pages/market.astro`
  - 集成价格表和图表
  - 预计时间: 1小时

- **T048**: 创建交易对详情页面
  - 文件: `src/pages/trade/[pair].astro`
  - 详细K线图和深度图
  - 预计时间: 1.5小时

### 集成测试 [Story: US2]

- **T049**: E2E测试 - 市场行情功能
  - 文件: `tests/e2e/market.spec.ts`
  - 查看价格 → 切换周期 → 查看详情
  - 预计时间: 1小时

**US2交付物**:
- ✅ 实时价格显示
- ✅ K线图功能完整
- ✅ 价格自动更新
- ✅ 所有测试通过

**Checkpoint 4**: 验证API数据准确性，确认价格刷新，测试所有时间周期

---

## Phase 5: US4 - 现货交易功能 (Priority: P1)

**User Story**: 用户可以进行加密货币现货交易，包括市价单和限价单。

**Independent Test Criteria**:
- ✅ 市价单立即成交
- ✅ 限价单进入挂单队列
- ✅ 限价单价格到达时自动成交
- ✅ 订单可以取消
- ✅ 余额变动准确

### 测试 (TDD) [Story: US4]

- **T050 [TDD]**: 编写订单创建API测试
  - 文件: `tests/trading/create-order.test.ts`
  - 测试市价单、限价单、余额不足、数量无效
  - 预计时间: 2小时

- **T051 [TDD]**: 编写订单取消API测试
  - 文件: `tests/trading/cancel-order.test.ts`
  - 测试取消成功、订单不存在、已成交
  - 预计时间: 1小时

- **T052 [TDD]**: 编写撮合逻辑测试
  - 文件: `tests/trading/matching.test.ts`
  - 测试市价单成交、限价单撮合
  - 预计时间: 2小时

- **T053 [TDD]**: 编写余额更新测试
  - 文件: `tests/trading/balance-update.test.ts`
  - 测试余额冻结/解冻、并发安全
  - 预计时间: 1.5小时

### API实现 [Story: US4]

- **T054**: 实现订单创建API
  - 文件: `netlify/functions/orders/create.ts`
  - 验证余额、创建订单、市价单立即成交
  - 符合T050测试要求
  - 预计时间: 3小时

- **T055**: 实现订单取消API
  - 文件: `netlify/functions/orders/cancel.ts`
  - 验证权限、取消订单、解冻余额
  - 符合T051测试要求
  - 预计时间: 2小时

- **T056**: 实现限价单撮合定时任务
  - 文件: `netlify/functions/scheduled/match-orders.ts`
  - 每30秒检查待成交订单
  - 对比市场价格并成交
  - 符合T052测试要求
  - 预计时间: 3小时

- **T057**: 实现当前委托查询API
  - 文件: `netlify/functions/orders/active.ts`
  - 查询用户的待成交订单
  - 预计时间: 1小时

- **T058**: 实现订单详情查询API
  - 文件: `netlify/functions/orders/detail.ts`
  - 查询单个订单详情和成交记录
  - 预计时间: 1小时

### 数据库函数 [Story: US4]

- **T059**: 实现余额更新原子函数
  - 文件: 在Supabase SQL Editor中执行
  - 创建update_wallet_balance函数
  - 使用数据库事务保证原子性
  - 预计时间: 1.5小时

- **T060**: 实现余额冻结/解冻函数
  - 文件: 在Supabase SQL Editor中执行
  - 创建freeze_balance和unfreeze_balance函数
  - 预计时间: 1.5小时

### UI组件 [Story: US4]

- **T061**: 创建交易表单组件
  - 文件: `src/components/trading/OrderForm.tsx`
  - 市价单/限价单切换
  - 买入/卖出切换
  - 实时余额显示
  - 预计时间: 3小时

- **T062**: 创建订单列表组件
  - 文件: `src/components/trading/OrderList.tsx`
  - 显示当前委托订单
  - 取消订单按钮
  - 预计时间: 2小时

- **T063**: 创建订单确认模态框
  - 文件: `src/components/trading/OrderConfirmModal.tsx`
  - 显示预估成交价格和手续费
  - 预计时间: 1.5小时

### 页面集成 [Story: US4]

- **T064**: 在交易页面集成交易表单
  - 文件: `src/pages/trade/[pair].astro`
  - 添加交易表单到页面
  - 预计时间: 1小时

### 集成测试 [Story: US4]

- **T065**: E2E测试 - 完整交易流程
  - 文件: `tests/e2e/trading.spec.ts`
  - 市价单成交 → 限价单创建 → 限价单成交 → 取消订单
  - 预计时间: 2小时

**US4交付物**:
- ✅ 市价单和限价单功能完整
- ✅ 订单撮合逻辑正确
- ✅ 余额变动准确
- ✅ 所有测试通过

**Checkpoint 5**: 手动下单测试，验证余额变化，确认撮合逻辑正确

---

## Phase 6: US3 - 数字钱包管理 (Priority: P2)

**User Story**: 用户可以查看余额、模拟充值和提现。

**Independent Test Criteria**:
- ✅ 显示所有币种余额
- ✅ 模拟充值功能正常
- ✅ 提现申请流程完整
- ✅ 钱包历史记录准确

### 测试 (TDD) [Story: US3]

- **T066 [TDD]**: 编写钱包余额API测试
  - 文件: `tests/wallet/balances.test.ts`
  - 测试查询所有余额、单个币种余额
  - 预计时间: 1小时

- **T067 [TDD]**: 编写充值API测试
  - 文件: `tests/wallet/deposit.test.ts`
  - 测试模拟充值成功、金额无效
  - 预计时间: 1小时

- **T068 [TDD]**: 编写提现API测试
  - 文件: `tests/wallet/withdraw.test.ts`
  - 测试提现成功、余额不足、地址无效
  - 预计时间: 1.5小时

### API实现 [Story: US3]

- **T069**: 实现钱包余额查询API
  - 文件: `netlify/functions/wallet/balances.ts`
  - 查询用户所有钱包
  - 计算总资产价值
  - 符合T066测试要求
  - 预计时间: 1.5小时

- **T070**: 实现单个币种余额API
  - 文件: `netlify/functions/wallet/balance.ts`
  - 查询指定币种余额
  - 预计时间: 45分钟

- **T071**: 实现模拟充值API
  - 文件: `netlify/functions/wallet/deposit.ts`
  - 验证金额、更新余额、记录历史
  - 符合T067测试要求
  - 预计时间: 2小时

- **T072**: 实现提现申请API
  - 文件: `netlify/functions/wallet/withdraw.ts`
  - 验证地址、余额、创建提现记录
  - 要求交易密码或2FA
  - 符合T068测试要求
  - 预计时间: 2.5小时

- **T073**: 实现钱包历史查询API
  - 文件: `netlify/functions/wallet/transactions.ts`
  - 查询所有资金变动记录
  - 支持筛选和分页
  - 预计时间: 1.5小时

### UI组件 [Story: US3]

- **T074 [P]**: 创建钱包余额卡片组件
  - 文件: `src/components/wallet/BalanceCard.tsx`
  - 显示单个币种余额
  - 可用/冻结余额显示
  - 预计时间: 1.5小时

- **T075 [P]**: 创建充值模态框组件
  - 文件: `src/components/wallet/DepositModal.tsx`
  - 显示充值地址和二维码
  - 模拟充值按钮
  - 预计时间: 2小时

- **T076 [P]**: 创建提现表单组件
  - 文件: `src/components/wallet/WithdrawForm.tsx`
  - 地址输入和验证
  - 金额输入和余额显示
  - 预计时间: 2小时

- **T077 [P]**: 创建钱包历史列表组件
  - 文件: `src/components/wallet/TransactionHistory.tsx`
  - 显示所有资金变动
  - 筛选和分页
  - 预计时间: 2小时

### 页面 [Story: US3]

- **T078**: 创建钱包页面
  - 文件: `src/pages/wallet.astro`
  - 集成所有钱包组件
  - 预计时间: 1小时

### 集成测试 [Story: US3]

- **T079**: E2E测试 - 钱包功能
  - 文件: `tests/e2e/wallet.spec.ts`
  - 查看余额 → 充值 → 提现申请 → 查看历史
  - 预计时间: 1.5小时

**US3交付物**:
- ✅ 钱包余额显示完整
- ✅ 充值提现流程正常
- ✅ 历史记录准确
- ✅ 所有测试通过

**Checkpoint 6**: 验证余额准确性，测试充值提现流程

---

## Phase 7: US5 - 订单与交易历史管理 (Priority: P2)

**User Story**: 用户可以查看所有交易订单的历史记录。

**Independent Test Criteria**:
- ✅ 当前委托订单显示正确
- ✅ 历史订单查询正常
- ✅ 订单筛选功能有效
- ✅ 订单详情完整

### 测试 (TDD) [Story: US5]

- **T080 [TDD]**: 编写订单历史API测试
  - 文件: `tests/orders/history.test.ts`
  - 测试查询历史订单、筛选、分页
  - 预计时间: 1.5小时

- **T081 [TDD]**: 编写成交记录API测试
  - 文件: `tests/orders/transactions.test.ts`
  - 测试查询成交记录
  - 预计时间: 1小时

### API实现 [Story: US5]

- **T082**: 实现历史订单查询API
  - 文件: `netlify/functions/orders/history.ts`
  - 查询已完成订单
  - 支持按交易对、状态、时间筛选
  - 分页支持
  - 符合T080测试要求
  - 预计时间: 2小时

- **T083**: 实现成交记录查询API
  - 文件: `netlify/functions/orders/transactions.ts`
  - 查询用户的所有成交记录
  - 支持筛选和分页
  - 符合T081测试要求
  - 预计时间: 1.5小时

### UI组件 [Story: US5]

- **T084**: 创建订单历史列表组件
  - 文件: `src/components/orders/OrderHistoryList.tsx`
  - 显示历史订单
  - 状态标识和颜色
  - 预计时间: 2小时

- **T085**: 创建订单筛选器组件
  - 文件: `src/components/orders/OrderFilter.tsx`
  - 交易对、状态、时间范围筛选
  - 预计时间: 1.5小时

- **T086**: 创建订单详情模态框
  - 文件: `src/components/orders/OrderDetailModal.tsx`
  - 显示完整订单信息
  - 成交明细列表
  - 预计时间: 2小时

### 页面 [Story: US5]

- **T087**: 创建订单管理页面
  - 文件: `src/pages/orders.astro`
  - 当前委托和历史订单Tab
  - 集成筛选器
  - 预计时间: 1.5小时

### 集成测试 [Story: US5]

- **T088**: E2E测试 - 订单历史功能
  - 文件: `tests/e2e/order-history.spec.ts`
  - 创建多个订单 → 查看历史 → 筛选 → 查看详情
  - 预计时间: 1.5小时

**US5交付物**:
- ✅ 订单历史显示完整
- ✅ 筛选功能正常
- ✅ 订单详情准确
- ✅ 所有测试通过

**Checkpoint 7**: 验证订单记录完整性，测试筛选功能

---

## Phase 8: US6 - 账户安全与设置 (Priority: P2)

**User Story**: 用户可以配置安全设置，包括2FA和交易密码。

**Independent Test Criteria**:
- ✅ 2FA启用和验证正常
- ✅ 交易密码设置成功
- ✅ 登录历史显示正确
- ✅ 敏感操作需要验证

### 测试 (TDD) [Story: US6]

- **T089 [TDD]**: 编写2FA API测试
  - 文件: `tests/security/2fa.test.ts`
  - 测试启用、验证、禁用2FA
  - 预计时间: 1.5小时

- **T090 [TDD]**: 编写交易密码API测试
  - 文件: `tests/security/trading-password.test.ts`
  - 测试设置、验证交易密码
  - 预计时间: 1小时

### API实现 [Story: US6]

- **T091**: 实现2FA启用API
  - 文件: `netlify/functions/security/2fa-enable.ts`
  - 生成TOTP密钥和二维码
  - 符合T089测试要求
  - 预计时间: 2小时

- **T092**: 实现2FA验证API
  - 文件: `netlify/functions/security/2fa-verify.ts`
  - 验证TOTP码并完成启用
  - 预计时间: 1.5小时

- **T093**: 实现2FA禁用API
  - 文件: `netlify/functions/security/2fa-disable.ts`
  - 验证密码和2FA码后禁用
  - 预计时间: 1.5小时

- **T094**: 实现交易密码设置API
  - 文件: `netlify/functions/security/trading-password.ts`
  - 验证登录密码、设置交易密码
  - 符合T090测试要求
  - 预计时间: 1.5小时

- **T095**: 实现登录历史查询API
  - 文件: `netlify/functions/security/login-history.ts`
  - 查询security_logs表
  - 预计时间: 1小时

- **T096**: 实现用户资料更新API
  - 文件: `netlify/functions/user/profile.ts`
  - 更新用户名、语言、主题等
  - 预计时间: 1小时

- **T097**: 实现修改登录密码API
  - 文件: `netlify/functions/user/change-password.ts`
  - 验证旧密码、设置新密码
  - 预计时间: 1.5小时

### UI组件 [Story: US6]

- **T098 [P]**: 创建2FA设置组件
  - 文件: `src/components/security/TwoFactorSetup.tsx`
  - 显示二维码和密钥
  - 验证码输入
  - 预计时间: 2.5小时

- **T099 [P]**: 创建交易密码设置表单
  - 文件: `src/components/security/TradingPasswordForm.tsx`
  - 6位数字输入
  - 验证逻辑
  - 预计时间: 1.5小时

- **T100 [P]**: 创建登录历史列表组件
  - 文件: `src/components/security/LoginHistory.tsx`
  - 显示登录记录
  - IP和设备信息
  - 预计时间: 1.5小时

- **T101 [P]**: 创建用户资料编辑组件
  - 文件: `src/components/user/ProfileEditor.tsx`
  - 用户名、语言、主题设置
  - 预计时间: 2小时

### 页面 [Story: US6]

- **T102**: 创建安全设置页面
  - 文件: `src/pages/security.astro`
  - 集成2FA和交易密码组件
  - 预计时间: 1小时

- **T103**: 创建账户设置页面
  - 文件: `src/pages/settings.astro`
  - 用户资料、偏好设置
  - 预计时间: 1小时

### 集成测试 [Story: US6]

- **T104**: E2E测试 - 安全功能
  - 文件: `tests/e2e/security.spec.ts`
  - 启用2FA → 测试验证 → 设置交易密码
  - 预计时间: 1.5小时

**US6交付物**:
- ✅ 2FA功能完整
- ✅ 交易密码保护有效
- ✅ 登录历史记录准确
- ✅ 所有测试通过

**Checkpoint 8**: 测试2FA流程，验证交易密码保护

---

## Phase 9: US7 - 资产概览仪表板 (Priority: P3)

**User Story**: 用户登录后看到资产概览仪表板。

**Independent Test Criteria**:
- ✅ 总资产价值计算准确
- ✅ 资产分布图显示正确
- ✅ 盈亏统计准确
- ✅ 市场热点数据更新

### API实现 [Story: US7]

- **T105**: 实现资产概览API
  - 文件: `netlify/functions/dashboard/overview.ts`
  - 计算总资产、盈亏、分布
  - 预计时间: 2小时

- **T106**: 实现市场热点API
  - 文件: `netlify/functions/dashboard/hot-markets.ts`
  - 查询24小时涨幅最高的币种
  - 预计时间: 1小时

### UI组件 [Story: US7]

- **T107 [P]**: 创建总资产卡片组件
  - 文件: `src/components/dashboard/AssetSummary.tsx`
  - 显示总资产和盈亏
  - 预计时间: 1.5小时

- **T108 [P]**: 创建资产分布图组件
  - 文件: `src/components/dashboard/AssetDistribution.tsx`
  - 饼图或柱状图
  - 预计时间: 2小时

- **T109 [P]**: 创建待处理订单卡片
  - 文件: `src/components/dashboard/PendingOrders.tsx`
  - 显示未成交订单数量
  - 快捷链接
  - 预计时间: 1小时

- **T110 [P]**: 创建市场热点卡片
  - 文件: `src/components/dashboard/HotMarkets.tsx`
  - 显示涨幅榜
  - 预计时间: 1.5小时

### 页面 [Story: US7]

- **T111**: 创建仪表板首页
  - 文件: `src/pages/index.astro`
  - 集成所有仪表板组件
  - 预计时间: 1.5小时

### 集成测试 [Story: US7]

- **T112**: E2E测试 - 仪表板功能
  - 文件: `tests/e2e/dashboard.spec.ts`
  - 登录 → 查看仪表板 → 验证数据
  - 预计时间: 1小时

**US7交付物**:
- ✅ 仪表板显示完整
- ✅ 数据准确
- ✅ 所有测试通过

**Checkpoint 9**: 验证仪表板数据准确性

---

## Phase 10: 优化与集成 (Polish & Integration)

**目标**: 跨功能优化、性能提升、最终集成测试

### 性能优化

- **T113 [P]**: 优化数据库查询
  - 添加索引、优化慢查询
  - 预计时间: 2小时

- **T114 [P]**: 实施前端代码分割
  - 按路由拆分bundle
  - 懒加载组件
  - 预计时间: 1.5小时

- **T115 [P]**: 优化图片和静态资源
  - 压缩图片、使用CDN
  - 预计时间: 1小时

### 错误处理和用户体验

- **T116 [P]**: 实现全局错误边界
  - 文件: `src/components/ErrorBoundary.tsx`
  - 友好的错误提示
  - 预计时间: 1.5小时

- **T117 [P]**: 实现加载状态组件
  - 文件: `src/components/ui/LoadingSpinner.tsx`
  - 骨架屏
  - 预计时间: 1小时

- **T118 [P]**: 实现Toast通知系统
  - 文件: `src/components/ui/Toast.tsx`
  - 成功、错误、警告通知
  - 预计时间: 1.5小时

### 文档和部署

- **T119**: 更新README.md
  - 添加完整的项目说明
  - 安装和运行指南
  - 预计时间: 1小时

- **T120**: 创建API文档站点
  - 使用Swagger UI
  - 基于api-specification.yaml
  - 预计时间: 1.5小时

- **T121**: 配置生产环境变量
  - 在Netlify设置所有环境变量
  - 预计时间: 30分钟

### 最终测试

- **T122**: 完整回归测试
  - 运行所有单元测试
  - 运行所有集成测试
  - 运行所有E2E测试
  - 预计时间: 2小时

- **T123**: 性能测试
  - 100并发用户测试
  - 页面加载时间测试
  - 预计时间: 2小时

- **T124**: 安全扫描
  - 运行安全扫描工具
  - 修复发现的问题
  - 预计时间: 2小时

- **T125**: 浏览器兼容性测试
  - Chrome、Firefox、Safari
  - 移动端测试
  - 预计时间: 2小时

### 部署到生产

- **T126**: 构建生产版本
  - 运行: `pnpm run build`
  - 验证构建产物
  - 预计时间: 30分钟

- **T127**: 部署到Netlify生产环境
  - 运行: `netlify deploy --prod`
  - 验证部署成功
  - 预计时间: 30分钟

- **T128**: 生产环境验证测试
  - 手动测试所有核心功能
  - 预计时间: 2小时

- **T129**: 配置监控和告警
  - 设置错误监控
  - 设置性能监控
  - 预计时间: 1小时

**最终交付物**:
- ✅ 所有功能完整
- ✅ 测试覆盖率≥80%
- ✅ 性能达标
- ✅ 生产环境运行正常

**Final Checkpoint**: 生产环境全功能验证

---

## 任务依赖图 (Task Dependencies)

```
Phase 1 (Setup) → Phase 2 (Foundational)
                      ↓
        ┌─────────────┼─────────────┬─────────────┐
        ↓             ↓             ↓             ↓
    Phase 3       Phase 4       Phase 5       Phase 6
     (US1)         (US2)         (US4)         (US3)
     ↓             ↓             ↓             ↓
     └─────────────┼─────────────┴─────────────┘
                   ↓
          ┌────────┴────────┐
          ↓                 ↓
      Phase 7           Phase 8
       (US5)             (US6)
          ↓                 ↓
          └────────┬────────┘
                   ↓
               Phase 9
                (US7)
                   ↓
              Phase 10
            (Polish)
```

### 用户故事依赖关系

- **US1 (P1)**: 独立，无依赖
- **US2 (P1)**: 独立，无依赖（可与US1并行）
- **US4 (P1)**: 依赖 US1（需要认证）、US2（需要价格数据）
- **US3 (P2)**: 依赖 US1（需要认证）
- **US5 (P2)**: 依赖 US4（需要订单数据）
- **US6 (P2)**: 依赖 US1（需要认证）
- **US7 (P3)**: 依赖 US1, US3, US4（需要所有数据）

### 建议的MVP范围

**MVP = US1 + US2**
- 用户可以注册登录
- 用户可以查看市场行情
- 最小可行产品，可独立部署和演示

**MVP+ = US1 + US2 + US4**
- 增加交易功能
- 完整的交易平台核心体验

---

## 并行执行机会 (Parallel Execution Opportunities)

### Phase 1-2 并行机会

```
[P] T001, T002, T003, T004, T005 可并行
[P] T012, T013, T014, T015, T016, T017, T018 可并行（Foundation完成后）
```

### Phase 3 (US1) 并行机会

```
T021, T022, T023 测试编写可并行
T029, T030, T031 UI组件可并行
T032, T033, T034 页面创建可并行
```

### Phase 4 (US2) 并行机会

```
T036, T037 测试编写可并行
T043, T044, T045, T046 UI组件可并行
T047, T048 页面创建可并行
```

### Phase 5 (US4) 并行机会

```
T050, T051, T052, T053 测试编写可并行
T061, T062, T063 UI组件可并行
```

### Phase 6 (US3) 并行机会

```
T066, T067, T068 测试编写可并行
T074, T075, T076, T077 UI组件可并行
```

### Phase 7-9 并行机会

```
US5, US6 可以并行开发（共享依赖US1）
Phase 10的优化任务大部分可并行
```

---

## 实施策略 (Implementation Strategy)

### 迭代交付方式

1. **Sprint 1-2** (2周): Phase 1-2 + US1
   - 交付: 可运行的项目框架 + 用户认证系统
   
2. **Sprint 3** (1周): US2
   - 交付: 市场行情功能
   - **里程碑**: MVP可演示
   
3. **Sprint 4-5** (2周): US4
   - 交付: 交易功能
   - **里程碑**: MVP+可用于测试交易
   
4. **Sprint 6** (1周): US3
   - 交付: 钱包管理
   
5. **Sprint 7** (1周): US5 + US6
   - 交付: 订单历史 + 安全设置
   
6. **Sprint 8** (1周): US7 + Phase 10
   - 交付: 仪表板 + 最终优化
   - **里程碑**: 生产就绪

### 测试策略

- **TDD原则**: 所有功能先写测试
- **测试覆盖率目标**: ≥80%
- **测试类型**:
  - 单元测试: 每个函数/组件
  - 集成测试: API端点
  - E2E测试: 用户流程
- **测试运行**: 
  - 开发时: `pnpm test:watch`
  - CI/CD: `pnpm test:ci`
  - E2E: `pnpm test:e2e`

### 质量保证

- **代码审查**: 每个PR必须审查
- **Linting**: 自动运行ESLint和Prettier
- **类型检查**: TypeScript严格模式
- **测试必须通过**: 100%通过率才能合并
- **覆盖率检查**: CI强制≥80%

---

## 总结 (Summary)

### 任务统计

- **总任务数**: 129
- **Phase 1 (Setup)**: 7任务
- **Phase 2 (Foundational)**: 13任务
- **Phase 3 (US1 - P1)**: 15任务
- **Phase 4 (US2 - P1)**: 14任务
- **Phase 5 (US4 - P1)**: 16任务
- **Phase 6 (US3 - P2)**: 14任务
- **Phase 7 (US5 - P2)**: 9任务
- **Phase 8 (US6 - P2)**: 16任务
- **Phase 9 (US7 - P3)**: 8任务
- **Phase 10 (Polish)**: 17任务

### 按用户故事的任务分布

| 用户故事 | 优先级 | 任务数 | 预计时间 |
|----------|--------|--------|----------|
| US1 - 用户认证 | P1 | 15 | 18h |
| US2 - 市场行情 | P1 | 14 | 21h |
| US4 - 现货交易 | P1 | 16 | 26h |
| US3 - 钱包管理 | P2 | 14 | 17h |
| US5 - 订单历史 | P2 | 9 | 12h |
| US6 - 安全设置 | P2 | 16 | 20h |
| US7 - 仪表板 | P3 | 8 | 10h |
| Setup & Foundational | - | 20 | 12h |
| Polish & Integration | - | 17 | 16h |

### 并行执行潜力

- **Setup阶段**: 5个任务可并行
- **Foundational阶段**: 7个任务可并行
- **US1阶段**: 9个任务可并行
- **US2阶段**: 8个任务可并行
- **总并行机会**: 约50%的任务可并行执行

### MVP建议

**最小MVP (2-3周)**:
- Phase 1-2: Setup + Foundational
- Phase 3: US1 - 用户认证
- Phase 4: US2 - 市场行情

**扩展MVP (4-5周)**:
- 以上 + Phase 5: US4 - 现货交易

**完整版本 (6-8周)**:
- 所有10个Phase

---

## 开始实施 (Getting Started)

### 第一步
```bash
# 克隆或初始化项目
git checkout 001-description-netlify-bianca

# 开始Task T001
pnpm create astro@latest
```

### 追踪进度

在实施过程中，建议使用任务管理工具（如GitHub Issues、Jira）追踪进度。每完成一个Checkpoint，在README.md中更新进度。

### 需要帮助？

参考文档：
- 技术研究: `specs/001-*/research.md`
- 数据模型: `specs/001-*/data-model.md`
- API规范: `specs/001-*/contracts/api-specification.yaml`
- 快速开始: `specs/001-*/quickstart.md`
- 实施计划: `specs/001-*/plan.md`

---

**准备开始开发！🚀**

