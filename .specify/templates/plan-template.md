# 项目计划模板 (Project Plan Template)
# 奶牛实验数据管理系统

**计划版本 (Plan Version):** [VERSION]  
**创建日期 (Created):** [DATE]  
**计划类型 (Plan Type):** [Feature/Bug Fix/Refactor/Research]  
**优先级 (Priority):** [Critical/High/Medium/Low]  
**预估工作量 (Estimated Effort):** [Hours/Days]

---

## 目标概述 (Objective Overview)

简要描述本计划的目标和预期成果（1-3 句话）：

[OBJECTIVE_DESCRIPTION]

---

## Constitution Check (项目原则检查)

在开始实施前，必须确认符合以下项目原则：

- [ ] **原则 1 - TDD:** 已准备测试用例，将先写测试
- [ ] **原则 2 - 文档:** 计划包含详细的文档注释要求
- [ ] **原则 3 - Jamstack:** 技术方案符合 Jamstack 架构（静态优先、API 解耦）
- [ ] **原则 4 - 输入记录:** 涉及用户输入时，已规划数据存储方案
- [ ] **原则 5 - 数据安全:** 敏感数据处理符合安全要求（RLS、加密）
- [ ] **原则 6 - 移动优先:** UI 设计从移动端开始
- [ ] **原则 7 - 实时同步:** 需要实时数据时，已规划 Supabase Realtime
- [ ] **原则 8 - 可追溯:** 数据变更包含审计日志设计

**不适用的原则及说明：**
[LIST_ANY_PRINCIPLES_NOT_APPLICABLE_AND_WHY]

---

## 业务需求 (Business Requirements)

### 背景 (Background)
[WHY_IS_THIS_NEEDED]

### 用户故事 (User Story)
作为 [USER_ROLE]，我想要 [FEATURE]，以便 [BENEFIT]。

### 成功标准 (Acceptance Criteria)
1. [CRITERION_1]
2. [CRITERION_2]
3. [CRITERION_3]

---

## 技术设计 (Technical Design)

### 技术栈确认 (Tech Stack Confirmation)
- **前端框架:** Astro / Next.js
- **数据库:** Supabase
- **样式:** Tailwind CSS
- **部署:** Netlify
- **其他依赖:** [LIST_DEPENDENCIES]

### 架构决策 (Architecture Decisions)

#### 数据模型 (Data Model)
```sql
-- Supabase 表结构
[TABLE_SCHEMA]
```

#### API 端点 (API Endpoints)
| 端点 | 方法 | 用途 | 认证 |
|------|------|------|------|
| [ENDPOINT] | [METHOD] | [PURPOSE] | [AUTH_REQUIRED] |

#### 组件结构 (Component Structure)
```
src/
  components/
    [COMPONENT_NAME]/
      [COMPONENT_NAME].astro
      [COMPONENT_NAME].test.ts
```

---

## 测试策略 (Testing Strategy)

### 单元测试 (Unit Tests)
- [ ] 测试文件路径: `tests/[MODULE_PATH].test.ts`
- [ ] 预期覆盖率: [TARGET_COVERAGE]%
- [ ] 关键测试用例:
  1. [TEST_CASE_1_DESCRIPTION]
  2. [TEST_CASE_2_DESCRIPTION]
  3. [TEST_CASE_3_DESCRIPTION]

### 集成测试 (Integration Tests)
- [ ] Supabase 连接测试
- [ ] API 端点响应测试
- [ ] 数据流端到端测试

### 用户验收测试 (User Acceptance Testing)
- [ ] 在移动设备（< 768px）测试核心功能
- [ ] 在弱网环境下测试数据加载
- [ ] 验证实时同步功能

---

## 实施步骤 (Implementation Steps)

1. **准备阶段 (Setup)**
   - [ ] 创建 Supabase 表和 RLS 策略
   - [ ] 编写测试用例（TDD 第一步）
   - [ ] 搭建组件基础结构

2. **开发阶段 (Development)**
   - [ ] 实现数据模型和 API
   - [ ] 开发 UI 组件（移动优先）
   - [ ] 添加实时订阅（如需要）
   - [ ] 实现审计日志

3. **测试阶段 (Testing)**
   - [ ] 运行单元测试（覆盖率 > 80%）
   - [ ] 运行集成测试
   - [ ] 手动测试移动端和桌面端

4. **文档阶段 (Documentation)**
   - [ ] 添加代码注释（JSDoc/TSDoc）
   - [ ] 更新 README.md
   - [ ] 编写用户使用指南

5. **部署阶段 (Deployment)**
   - [ ] 本地构建验证
   - [ ] 提交 PR 并通过 CI
   - [ ] 部署到 Netlify 预览环境
   - [ ] 部署到生产环境

---

## 风险与依赖 (Risks & Dependencies)

### 风险识别 (Risks)
| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| [RISK_1] | [Low/Medium/High] | [Low/Medium/High] | [MITIGATION] |

### 外部依赖 (Dependencies)
- [ ] [DEPENDENCY_1]
- [ ] [DEPENDENCY_2]

---

## 交付物清单 (Deliverables Checklist)

- [ ] 功能代码（包含详细注释）
- [ ] 测试代码（覆盖率 > 80%）
- [ ] 数据库迁移脚本（如适用）
- [ ] 组件文档和使用示例
- [ ] README.md 更新
- [ ] 部署验证报告

---

## 审批记录 (Approval Record)

| 角色 | 姓名 | 日期 | 签名 |
|------|------|------|------|
| 项目负责人 | [NAME] | [DATE] | [SIGNATURE] |
| 技术负责人 | [NAME] | [DATE] | [SIGNATURE] |

---

**下一步行动 (Next Actions):**
[LIST_IMMEDIATE_NEXT_STEPS]
