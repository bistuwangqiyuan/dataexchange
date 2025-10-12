# Technical Research: 加密货币交易平台架构决策

**Feature**: 加密货币在线交易平台  
**Branch**: 001-description-netlify-bianca  
**Research Date**: 2025-10-11  
**Status**: Completed

---

## 研究目的 (Research Purpose)

本文档针对规范中的3个关键架构决策进行技术研究，解决所有 [NEEDS CLARIFICATION] 标记，为实施阶段提供明确的技术方案。

---

## 决策 1: 实时行情数据源 (FR-012)

### 问题描述
系统需要显示加密货币的实时价格、K线图和交易深度数据。需要决定数据来源。

### 研究过程

**选项评估**:

| 选项 | 优势 | 劣势 | 适用场景 |
|------|------|------|----------|
| 真实交易所API（Binance/CoinGecko） | 真实数据、权威可靠 | API限流、需要处理稳定性 | 生产环境 |
| 模拟/随机数据 | 完全自主、无依赖 | 数据不真实 | 纯演示 |
| 混合方式 | 平衡真实性和复杂度 | 需要明确划分 | 教学场景 |

**技术调研**:

1. **CoinGecko API**:
   - 免费层：50 calls/minute
   - 提供价格、市值、交易量等基础数据
   - 无需API密钥（免费层）
   - REST API，易于集成
   - 限制：K线数据精度有限

2. **Binance API**:
   - 免费，无需API密钥（公开数据）
   - 限流：1200 requests/minute (IP)
   - 提供完整的K线数据、深度数据
   - WebSocket支持实时更新
   - 文档完善，社区活跃

3. **缓存策略**:
   - 使用Netlify Edge Functions或Supabase Functions作为代理
   - 缓存价格数据3-5秒
   - 缓存K线数据按周期（1m: 10s, 1h: 5m, 1d: 1h）
   - 使用Supabase存储历史K线数据

### 最终决策

**Decision**: 使用 **CoinGecko API + Binance API 混合方案**

**Rationale**:
- CoinGecko提供基础价格和市场概览（免费、稳定、易用）
- Binance提供详细K线和深度数据（数据质量高）
- 通过Netlify/Supabase Functions实现缓存层，降低API调用
- 符合规范假设：教育演示项目，使用真实数据但不涉及真实资金
- 用户可以看到真实市场数据，体验接近真实交易平台

**Implementation Plan**:
```
1. Netlify Function: /api/market/prices
   - 调用 CoinGecko API 获取主流币种价格
   - 缓存5秒
   - 返回标准化JSON格式

2. Netlify Function: /api/market/kline
   - 调用 Binance API 获取K线数据
   - 按时间周期缓存（1m: 10s, 1h: 5m, 1d: 1h）
   - 支持历史数据查询

3. Netlify Function: /api/market/depth
   - 调用 Binance API 获取订单簿深度
   - 缓存3秒
   - 返回买卖盘前20档数据

4. Frontend实现:
   - 使用TradingView Lightweight Charts绘制K线
   - 每5秒轮询价格更新（或使用SSE）
   - 错误处理：API失败时显示友好提示，不使用fallback数据
```

**Alternatives Considered**:
- ❌ 纯模拟数据：不符合"真实数据"要求，用户体验差
- ❌ 直接连接区块链节点：过于复杂，成本高，不适合Jamstack
- ❌ 使用WebSocket实时流：Netlify Functions不支持长连接

---

## 决策 2: 充值/提现功能实现 (FR-017)

### 问题描述
用户需要充值加密货币到平台，并能够提现到外部钱包。需要决定实现方式。

### 研究过程

**选项评估**:

| 选项 | 优势 | 劣势 | 合规要求 | 成本 |
|------|------|------|----------|------|
| 连接真实区块链 | 处理真实资金 | 技术复杂度极高 | 需要金融牌照 | 极高 |
| 模拟充值功能 | 实现简单 | 无真实资金流 | 无 | 极低 |
| UI展示流程 | 展示完整流程 | 不实际处理 | 无 | 低 |

**法律与合规调研**:
- 中国：经营加密货币交易需要合规牌照（目前政策限制）
- 处理真实资金需要：KYC/AML、资金托管、安全审计、保险
- 演示项目不应处理真实用户资金

**技术可行性分析**:

1. **真实区块链集成**（不推荐）:
   - 需要：HD钱包服务、私钥管理、节点访问
   - 安全风险：私钥泄露、智能合约漏洞、51%攻击
   - 成本：节点费用、安全审计、保险
   - 开发周期：6-12个月

2. **模拟充值系统**（推荐）:
   - 用户注册时赠送初始余额（如1000 USDT）
   - 提供"模拟充值"按钮，管理员可分配余额
   - 所有操作记录在数据库，不涉及真实区块链
   - 用户可以完整体验交易流程
   - 开发周期：1-2周

### 最终决策

**Decision**: 使用 **模拟充值/提现功能（演示模式）**

**Rationale**:
- 符合规范假设第12条："假设这是教育或演示项目"
- 无需处理真实资金，避免法律合规风险
- 技术复杂度低，符合Jamstack架构
- 用户可以充分体验交易平台的完整流程
- 开发和维护成本低
- 专注于交易体验，而非资金托管

**Implementation Plan**:
```
1. 数据库设计:
   - wallets表：记录每个用户的各币种余额
   - wallet_transactions表：记录所有充值/提现/交易记录

2. 初始余额策略:
   - 新用户注册时自动分配：
     * 1000 USDT
     * 0.1 BTC
     * 1 ETH
   - 显示"演示账户"标识

3. 模拟充值:
   - UI展示充值地址（QR码）和说明
   - 提供"模拟充值"按钮（管理员或测试模式）
   - 充值记录保存到wallet_transactions表
   - 余额实时更新

4. 模拟提现:
   - 验证提现地址格式（BTC/ETH地址正则）
   - 要求输入交易密码或2FA
   - 创建提现记录（状态：处理中）
   - 5分钟后自动标记为"已完成"
   - 扣除余额，记录到wallet_transactions

5. UI提示:
   - 显著位置标注"演示模式 - 模拟资金"
   - 充值页面说明："本平台为教育演示平台，使用模拟资金"
   - 提现页面说明："提现操作仅为演示，不会实际转账"
```

**Alternatives Considered**:
- ❌ 连接真实区块链：法律风险、技术复杂度、成本均不可接受
- ❌ 使用测试网（Testnet）：增加复杂度，对用户无实际价值
- ❌ 集成第三方托管API：仍需合规要求，成本高

---

## 决策 3: 订单撮合机制 (FR-030)

### 问题描述
用户提交买卖订单后，系统需要执行订单撮合（matching）。需要决定撮合机制。

### 研究过程

**选项评估**:

| 选项 | 优势 | 劣势 | 复杂度 | 流动性 |
|------|------|------|--------|--------|
| 自建撮合引擎 | 完全自主控制 | 技术难度极高 | 极高 | 需自建 |
| 对接外部交易所 | 利用现有流动性 | 依赖外部服务 | 高 | 外部提供 |
| 模拟撮合 | 实现简单 | 无真实交易 | 低 | 不需要 |

**撮合引擎技术调研**:

1. **真实撮合引擎组件**:
   - 订单簿（Order Book）：维护买卖盘
   - 撮合算法：价格优先、时间优先
   - 成交引擎：高并发、低延迟（微秒级）
   - 内存数据库：Redis或自建
   - 事务保证：ACID，防止超卖
   - 技术栈：C++、Go、Rust（性能要求）

2. **开发成本估算**:
   - 核心撮合引擎：3-6个月
   - 性能优化和压测：2-3个月
   - 安全审计：1-2个月
   - 团队规模：3-5人（高级工程师）

3. **Jamstack限制**:
   - Netlify Functions：执行时间限制（10秒免费版，26秒Pro版）
   - 无法维护内存订单簿
   - 不适合高频交易场景

**模拟撮合方案设计**:

```
核心思路：不维护真实订单簿，使用当前市场价格直接成交

市价单：
  1. 获取当前市场价格（来自Binance/CoinGecko）
  2. 直接按市场价成交
  3. 扣除/增加用户余额
  4. 计算手续费（0.1%）
  5. 记录成交记录

限价单：
  1. 订单存入数据库（状态：待成交）
  2. 定时任务（每30秒）检查所有待成交限价单
  3. 对比当前市场价格：
     - 买单：市场价 <= 限价，触发成交
     - 卖单：市场价 >= 限价，触发成交
  4. 成交后更新订单状态和余额
  5. 发送通知

优点：
  - 实现简单，符合Jamstack架构
  - 用户可以完整体验限价单流程
  - 无需维护复杂的订单簿
  - 成交逻辑清晰透明

缺点：
  - 无法实现用户之间的订单撮合
  - 所有订单按市场价成交（不是用户订单互相匹配）
  - 不适合真实交易场景
```

### 最终决策

**Decision**: 使用 **模拟撮合机制（市场价格成交）**

**Rationale**:
- 符合项目定位：教育演示平台，不处理真实交易
- 技术复杂度适中，可在Jamstack架构下实现
- 用户可以体验完整的下单、成交、查看订单流程
- 开发周期短（2-3周），维护成本低
- 避免真实撮合引擎的高并发、内存管理等复杂问题
- 符合Constitution原则：简洁实现，充分测试

**Implementation Plan**:
```
1. 数据库表设计:
   - orders表：存储所有订单
     * order_id (UUID)
     * user_id
     * trading_pair (BTC/USDT, ETH/USDT)
     * order_type (market, limit)
     * side (buy, sell)
     * price (限价单价格)
     * quantity
     * filled_quantity (已成交数量)
     * status (pending, partial_filled, filled, cancelled)
     * created_at, updated_at
   
   - transactions表：存储成交记录
     * transaction_id
     * order_id
     * executed_price (实际成交价格)
     * executed_quantity
     * fee (手续费)
     * executed_at

2. API端点:
   POST /api/orders/create
     - 验证用户余额
     - 创建订单记录
     - 市价单立即执行
     - 限价单保存到数据库

   POST /api/orders/cancel
     - 验证订单所有权
     - 更新订单状态为cancelled
     - 解冻余额

   GET /api/orders/active
     - 查询用户的待成交订单

   GET /api/orders/history
     - 查询历史订单（分页）

3. 撮合逻辑:
   A. 市价单（即时成交）:
      ```javascript
      async function executeMarketOrder(order) {
        // 1. 获取当前市场价格
        const marketPrice = await getMarketPrice(order.trading_pair);
        
        // 2. 计算成交金额和手续费
        const amount = order.quantity * marketPrice;
        const fee = amount * 0.001; // 0.1%
        
        // 3. 验证余额（买单验证USDT，卖单验证BTC/ETH）
        if (!hasEnoughBalance(order.user_id, order.side, amount + fee)) {
          throw new Error('Insufficient balance');
        }
        
        // 4. 使用数据库事务更新余额
        await db.transaction(async (trx) => {
          // 扣除/增加余额
          await updateBalance(trx, order);
          
          // 记录订单
          await trx('orders').insert({
            ...order,
            status: 'filled',
            filled_quantity: order.quantity
          });
          
          // 记录成交
          await trx('transactions').insert({
            order_id: order.order_id,
            executed_price: marketPrice,
            executed_quantity: order.quantity,
            fee: fee,
            executed_at: new Date()
          });
        });
        
        // 5. 发送通知
        await sendNotification(order.user_id, 'Order executed');
      }
      ```
   
   B. 限价单（定时检查）:
      ```javascript
      // Netlify Scheduled Function: 每30秒执行
      async function checkLimitOrders() {
        // 1. 获取所有待成交的限价单
        const pendingOrders = await db('orders')
          .where('status', 'pending')
          .where('order_type', 'limit');
        
        // 2. 获取当前市场价格
        const prices = await getMarketPrices();
        
        // 3. 检查每个订单
        for (const order of pendingOrders) {
          const currentPrice = prices[order.trading_pair];
          
          // 买单：市场价 <= 限价
          const shouldExecuteBuy = order.side === 'buy' && 
                                   currentPrice <= order.price;
          
          // 卖单：市场价 >= 限价
          const shouldExecuteSell = order.side === 'sell' && 
                                    currentPrice >= order.price;
          
          if (shouldExecuteBuy || shouldExecuteSell) {
            await executeLimitOrder(order, currentPrice);
          }
        }
      }
      ```

4. 前端交互:
   - 下单表单：实时显示当前价格、可用余额
   - 订单确认：显示预估成交价格和手续费
   - 实时更新：每5秒刷新当前委托订单状态
   - 成交通知：使用toast提示订单成交

5. 错误处理:
   - 余额不足：明确提示需要的金额
   - 价格异常：拒绝明显异常的限价单
   - 并发控制：使用数据库行锁防止重复扣款
   - 网络中断：订单状态可查询，支持重试
```

**Alternatives Considered**:
- ❌ 自建完整撮合引擎：技术难度和成本不可接受，不适合Jamstack
- ❌ 对接外部交易所API：需要真实资金托管，涉及合规问题
- ❌ 用户订单互相匹配：需要维护订单簿，超出项目范围

---

## 其他技术研究

### 高精度数学运算

**问题**: 加密货币涉及高精度小数（BTC: 8位，ETH: 18位），JavaScript原生Number类型精度不足。

**解决方案**: 使用 `decimal.js` 库

```javascript
import Decimal from 'decimal.js';

// 配置精度
Decimal.set({ precision: 20 });

// 价格计算
const price = new Decimal('0.00000123');
const quantity = new Decimal('1000000');
const total = price.times(quantity); // 1.23

// 手续费计算
const fee = total.times('0.001'); // 0.001%

// 余额更新（使用字符串避免精度损失）
await db('wallets').update({
  balance: db.raw('balance + ?', [amount.toString()])
});
```

### 实时价格更新

**选项**:
1. 短轮询（Polling）：每5秒请求一次
2. 长轮询（Long Polling）：服务端hold请求
3. Server-Sent Events (SSE)：服务器推送
4. WebSocket：双向通信

**决策**: 使用 **短轮询（Polling）**

**Rationale**:
- Netlify Functions不支持长连接（SSE/WebSocket）
- 短轮询实现简单，客户端兼容性好
- 5秒更新频率足够（非高频交易）
- 可以配合Netlify Edge缓存减少API调用

### 数据库索引优化

**关键查询场景**:
```sql
-- 用户订单查询
CREATE INDEX idx_orders_user_status 
ON orders(user_id, status);

-- 待成交限价单查询
CREATE INDEX idx_orders_pending 
ON orders(status, order_type, created_at)
WHERE status = 'pending' AND order_type = 'limit';

-- 交易历史查询
CREATE INDEX idx_transactions_order 
ON transactions(order_id, executed_at DESC);

-- 钱包历史查询
CREATE INDEX idx_wallet_transactions_user 
ON wallet_transactions(user_id, created_at DESC);
```

---

## Constitution Compliance Check

本研究的所有决策均符合项目宪章：

✅ **Principle 1 (TDD)**: 所有API和撮合逻辑将先编写测试  
✅ **Principle 2 (文档)**: 代码将包含详细JSDoc注释  
✅ **Principle 3 (Jamstack)**: 使用Netlify Functions + Supabase，符合Jamstack架构  
✅ **Principle 4 (记录)**: 所有决策已记录在本文档  
✅ **Security & Performance**: 使用数据库事务、参数化查询、输入验证  
✅ **Real Data Only**: 使用真实市场价格API，不使用fallback机制  
✅ **No Hallucination**: 所有技术方案基于已验证的库和API

---

## 总结 (Summary)

**已解决的问题**:
1. ✅ FR-012: 使用 CoinGecko + Binance API混合方案提供真实行情
2. ✅ FR-017: 使用模拟充值/提现功能，适合教育演示
3. ✅ FR-030: 使用模拟撮合机制，按市场价成交

**技术栈确认**:
- 前端：Astro + React + TypeScript + Tailwind CSS
- 图表：TradingView Lightweight Charts
- 数据库：Supabase PostgreSQL
- API层：Netlify Functions
- 认证：Supabase Auth
- 精度计算：Decimal.js
- 部署：Netlify

**下一步**:
- ✅ 进入 Phase 1: 设计数据模型
- ✅ 生成 API 合约
- ✅ 创建开发快速开始指南

**风险提示**:
- API限流风险：已通过缓存策略缓解
- 数据一致性：使用数据库事务保证
- 用户误解：UI明确标注"演示模式"

