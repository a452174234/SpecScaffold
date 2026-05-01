# 任务列表：SpecScaffold Web 脚手架平台

**输入**: 设计文档来自 `/specs/001-scaffold-platform/`
**前置条件**: plan.md（必需）, spec.md（必需）, data-model.md, contracts/

**测试**: 宪法原则 I（TDD 优先）要求所有功能先编写测试用例。

**组织方式**: 任务按用户故事分组，每个故事可独立实现和测试。

## 格式：`[ID] [P?] [Story] 描述`

- **[P]**: 可并行执行（不同文件，无依赖）
- **[Story]**: 关联的用户故事（US1, US2, US3 等）
- 描述包含具体文件路径

## 路径约定

Web 应用结构：`backend/src/`, `frontend/src/`

---

## 阶段 1：项目初始化

**目标**: 搭建项目基础结构、安装依赖、配置工具链

- [x] T001 初始化 Bun 项目，创建 `package.json` 和 `bunfig.toml`，配置 TypeScript（`tsconfig.json`）
- [x] T002 [P] 初始化前端 React + Vite 项目在 `frontend/`，安装 React 18、Zustand、Ant Design
- [x] T003 [P] 初始化后端项目在 `backend/`，安装 Hono、better-sqlite3、Zod
- [x] T004 [P] 安装测试依赖：Vitest、Playwright、`@anthropic-ai/claude-code` SDK
- [x] T005 [P] 配置 ESLint + Prettier，编写 `backend/.eslintrc.json` 和 `frontend/.eslintrc.json`
- [x] T006 创建项目目录结构（`backend/src/`、`frontend/src/` 及子目录），按 plan.md 中的源码结构

---

## 阶段 2：基础设施（阻塞性前置条件）

**目标**: 所有用户故事依赖的核心基础设施，MUST 在任何故事开始前完成

**⚠️ 关键**: 此阶段完成前，任何用户故事工作都不能开始

- [x] T007 创建 SQLite 数据库初始化脚本 `backend/src/db/init.ts`，创建 projects、specs、plans、tasks、security_policies、audit_logs 表，按 data-model.md 定义
- [x] T008 [P] 实现数据模型层：`backend/src/models/project.ts`、`backend/src/models/spec.ts`、`backend/src/models/task.ts`、`backend/src/models/audit-log.ts`，使用 Zod 定义 schema
- [x] T009 [P] 实现适配器注册表 `backend/src/adapters/registry.ts`，定义 IToolAdapter 接口和注册/查询机制
- [x] T010 [P] 实现适配器接口定义 `backend/src/adapters/claude-code/types.ts` 和 `backend/src/adapters/speckit/types.ts`，按 contracts/ 契约
- [x] T011 创建 Hono 后端入口 `backend/src/main.ts`，配置 CORS、JSON 中间件、WebSocket 升级
- [x] T012 [P] 实现 API 通用响应格式 `backend/src/api/middleware/response.ts`，统一 `{ success, data, error }` 结构
- [x] T013 [P] 实现前端 API 调用层 `frontend/src/services/api.ts`，封装 fetch 请求和 WebSocket 连接
- [x] T014 [P] 实现前端路由配置 `frontend/src/App.tsx`，使用 React Router 配置页面路由
- [x] T015 [P] 创建前端通用布局组件 `frontend/src/components/common/Layout.tsx` 和 `frontend/src/components/common/Loading.tsx`

**检查点**: 基础设施就绪——数据库、适配器接口、API 框架、前端框架均可使用

---

## 阶段 3：用户故事 1 - 创建脚手架项目（优先级：P1）🎯 MVP

**目标**: 用户可通过 Web 界面创建新工程项目，系统生成项目目录结构
**独立测试**: 创建一个完整项目并验证目录结构正确生成

### 测试（Red 阶段）

- [x] T016 [P] [US1] 编写项目创建服务单元测试 `backend/tests/unit/services/project-create.test.ts`，覆盖正常创建和参数校验失败场景
- [x] T017 [P] [US1] 编写项目创建 API 集成测试 `backend/tests/integration/api/project-create.test.ts`，覆盖 POST /api/projects 端点

### 实现（Green 阶段）

- [x] T018 [US1] 实现 ProjectService.create 方法 `backend/src/services/project-service.ts`，创建项目记录并生成目录结构
- [x] T019 [P] [US1] 实现项目创建 API 路由 `backend/src/api/routes/projects.ts`，POST /api/projects 端点
- [x] T020 [P] [US1] 实现首页组件 `frontend/src/pages/Home.tsx`，展示项目列表和"新建项目"入口
- [x] T021 [P] [US1] 实现项目创建页面 `frontend/src/pages/ProjectCreate.tsx`，表单引导（项目名称、目标平台选择）
- [x] T022 [US1] 运行 T016、T017 测试确认全部通过（Green），修复实现代码直到测试通过

**检查点**: 用户故事 1 可独立工作——用户能创建项目并看到项目列表

---

## 阶段 4：用户故事 2 - 导入现有项目（优先级：P1）

**目标**: 用户可输入本地目录路径导入已有项目，系统识别项目结构
**独立测试**: 导入一个已有项目并验证系统正确识别语言和框架

### 测试（Red 阶段）

- [x] T023 [P] [US2] 编写项目导入服务单元测试 `backend/tests/unit/services/project-import.test.ts`，覆盖有效路径导入、无效路径拒绝、项目结构识别
- [x] T024 [P] [US2] 编写项目扫描逻辑单元测试 `backend/tests/unit/services/project-scanner.test.ts`，覆盖 TypeScript/Python/Java 项目识别

### 实现（Green 阶段）

- [x] T025 [US2] 实现项目扫描器 `backend/src/services/project-scanner.ts`，扫描目录识别语言、框架、目录布局
- [x] T026 [US2] 实现 ProjectService.import 方法 `backend/src/services/project-service.ts`，验证路径、扫描结构、创建项目记录
- [x] T027 [P] [US2] 实现项目导入 API 路由，POST /api/projects/import 端点，在 `backend/src/api/routes/projects.ts` 中添加
- [x] T028 [P] [US2] 实现项目导入页面 `frontend/src/pages/ProjectImport.tsx`，输入目录路径、展示识别结果
- [x] T029 [US2] 运行 T023、T024 测试确认全部通过（Green）

**检查点**: 用户故事 1 和 2 均可独立工作

---

## 阶段 5：用户故事 6 - 安全围栏与操作审计（优先级：P1）

**目标**: AI 操作分级管控、高危操作审批、审计日志记录
**独立测试**: 模拟不同级别操作，验证拦截/放行/审计行为正确

### 测试（Red 阶段）

- [x] T030 [P] [US6] 编写安全围栏核心单元测试 `backend/tests/unit/security/fence.test.ts`，覆盖只读操作放行、高危操作拦截、项目外写操作拒绝
- [x] T031 [P] [US6] 编写审计日志服务单元测试 `backend/tests/unit/security/audit.test.ts`，覆盖日志记录和查询

### 实现（Green 阶段）

- [x] T032 [US6] 实现操作分级引擎 `backend/src/security/fence.ts`，实现 evaluateOperation 方法，按平台通用规则判定风险级别
- [x] T033 [US6] 实现安全策略管理 `backend/src/security/policy.ts`，CRUD 安全策略（项目范围、高危工具列表、只读外部工具）
- [x] T034 [US6] 实现审计日志服务 `backend/src/security/audit.ts`，记录操作日志和查询接口
- [x] T035 [US6] 实现安全围栏服务 `backend/src/services/security-service.ts`，整合分级引擎、策略管理、审计日志
- [x] T036 [P] [US6] 实现安全围栏 API 路由 `backend/src/api/routes/security.ts`，GET/PUT 安全策略、GET 审计日志、POST 审计响应
- [x] T037 [US6] 实现 Claude Code PreToolUse Hook 脚本 `backend/src/security/hook-handler.ts`，HTTP 调用安全围栏 API 返回 allow/deny/ask；用户审批后（FR-020）将结果通过 appendSystemPrompt 注入回 Claude Code 上下文，使 AI 智能体据此调整后续行为
- [x] T038 [P] [US6] 实现审计请求 WebSocket 推送，在 `backend/src/main.ts` 中添加 `audit:request` 事件推送
- [x] T039 [P] [US6] 实现前端审计审批组件 `frontend/src/components/security/AuditPanel.tsx`，展示操作说明和批准/拒绝按钮
- [x] T040 [P] [US6] 实现审计日志页面 `frontend/src/pages/AuditLog.tsx`，展示操作历史列表
- [x] T041 [US6] 运行 T030、T031 测试确认全部通过（Green）

**检查点**: 安全围栏可独立工作——操作拦截、审批流程、审计日志均可用

---

## 阶段 6：用户故事 3 - SDD 规格驱动开发流程（优先级：P1）

**目标**: 用户可从自然语言描述生成 Spec → Plan → Tasks 全链路
**独立测试**: 输入功能描述，验证生成完整的 spec.md、plan.md、tasks.md

### 测试（Red 阶段）

- [x] T042 [P] [US3] 编写 Spec Kit 适配器集成测试 `backend/tests/integration/adapters/speckit-adapter.test.ts`，覆盖 specify/plan/tasks 调用和文件生成验证

### 实现（Green 阶段）

- [x] T043 [US3] 实现 Spec Kit 适配器 `backend/src/adapters/speckit/adapter.ts`，封装 specify/clarify/plan/tasks 调用，通过 Claude Code SDK 间接调用
- [x] T044 [US3] 编写 Spec Kit 能力边界文档 `backend/src/adapters/speckit/capability.md`
- [x] T045 [US3] 实现 SDD 流程服务 `backend/src/services/sdd-service.ts`，编排 specify → clarify → plan → tasks 流程
- [x] T046 [P] [US3] 实现 SDD 流程 API 路由 `backend/src/api/routes/sdd.ts`，POST specify/clarify/plan/tasks 端点
- [x] T047 [US3] 实现前端 SDD 流程页面 `frontend/src/pages/SddFlow.tsx`，图形化引导用户完成 Spec → Plan → Tasks
- [x] T048 [P] [US3] 实现前端 SDD 流程组件 `frontend/src/components/sdd/SpecEditor.tsx`、`PlanViewer.tsx`、`TasksViewer.tsx`
- [x] T049 [US3] 运行 T042 测试确认全部通过（Green）

**检查点**: SDD 全链路可独立工作——从描述到任务列表完整生成

---

## 阶段 7：用户故事 4 - AI 大模型集成与代码生成（优先级：P2）

**目标**: 用户可选择任务，AI 生成测试用例和业务代码，实时展示执行过程
**独立测试**: 选择一个任务，验证 AI 生成测试用例和实现代码的完整过程

### 测试（Red 阶段）

- [x] T050 [P] [US4] 编写 Claude Code 适配器单元测试 `backend/tests/unit/adapters/claude-code-adapter.test.ts`，覆盖 execute 和 executeStream 调用
- [x] T051 [P] [US4] 编写 AI 服务单元测试 `backend/tests/unit/services/ai-service.test.ts`，覆盖生成测试用例和实现代码的调用逻辑

### 实现（Green 阶段）

- [x] T052 [US4] 实现 Claude Code 适配器 `backend/src/adapters/claude-code/adapter.ts`，封装 execute 和 executeStream 方法
- [x] T053 [US4] 编写 Claude Code 能力边界文档 `backend/src/adapters/claude-code/capability.md`
- [x] T054 [US4] 实现 AI 服务 `backend/src/services/ai-service.ts`，编排测试用例生成、代码实现、测试运行流程
- [x] T055 [P] [US4] 实现 AI 工作区 API 路由 `backend/src/api/routes/ai.ts`，POST generate-tests/implement/run-tests 端点
- [x] T056 [P] [US4] 实现 AI 输出 WebSocket 推送，`ai:message`、`ai:tool_use`、`test:result` 事件
- [x] T057 [P] [US4] 实现前端 AI 工作区页面 `frontend/src/pages/AiWorkspace.tsx`，实时展示 AI 输出流
- [x] T058 [P] [US4] 实现前端 AI 组件 `frontend/src/components/ai/CodeOutput.tsx`、`TestResult.tsx`、`ToolCallStatus.tsx`
- [x] T059 [US4] 运行 T050、T051 测试确认全部通过（Green）

**检查点**: AI 集成可独立工作——生成测试、生成代码、运行测试全流程

---

## 阶段 8：用户故事 5 - 强制 TDD 工作流管控（优先级：P2）

**目标**: 系统强制 Red-Green-Refactor 流程，测试通过后自动 Git 提交
**独立测试**: 尝试跳过测试直接编写代码，验证系统拒绝；完成 TDD 流程验证自动提交

### 测试（Red 阶段）

- [x] T060 [P] [US5] 编写 TDD 工作流服务单元测试 `backend/tests/unit/services/tdd-service.test.ts`，覆盖状态流转、跳过测试拒绝、自动提交触发
- [x] T061 [P] [US5] 编写工作流状态机单元测试 `backend/tests/unit/core/workflow.test.ts`，覆盖 pending → testing → test_approved → developing → completed 转换

### 实现（Green 阶段）

- [x] T062 [US5] 实现工作流状态机 `backend/src/core/workflow.ts`，定义 Task 状态流转规则和转换守卫
- [x] T063 [US5] 实现 TDD 服务 `backend/src/services/tdd-service.ts`，强制 Red-Green-Refactor 流程管控
- [x] T063a [US5] 实现 Git 自动提交服务 `backend/src/services/git-commit.ts`，TDD 测试通过后自动执行 git add + commit，commit 信息包含任务编号和变更描述（宪法原则 VI）
- [x] T064 [P] [US5] 实现任务管理 API 路由 `backend/src/api/routes/tasks.ts`，GET/PATCH 任务端点，含状态转换校验
- [x] T065 [P] [US5] 实现前端任务面板页面 `frontend/src/pages/TaskBoard.tsx`，展示任务列表和 TDD 状态
- [x] T066 [P] [US5] 实现前端 TDD 组件 `frontend/src/components/tdd/TaskStatusBadge.tsx`、`TestApprovalForm.tsx`、`AutoCommitNotice.tsx`
- [x] T067 [US5] 运行 T060、T061 测试确认全部通过（Green）

**检查点**: TDD 强制流程可独立工作——无法跳过测试，自动 Git 提交

---

## 阶段 9：收尾与跨功能优化

**目标**: 跨故事的改进和最终优化

- [x] T068 [P] 实现前端全局状态管理 `frontend/src/stores/`，统一项目、任务、审计状态
- [x] T069 [P] 实现错误处理中间件 `backend/src/api/middleware/error-handler.ts`，统一异常响应格式
- [x] T070 [P] 实现前端错误边界组件 `frontend/src/components/common/ErrorBoundary.tsx`
- [x] T071 [P] 添加 WebSocket 断线重连机制 `frontend/src/services/api.ts`
- [ ] T072 编写 E2E 测试 `frontend/tests/e2e/full-flow.spec.ts`，覆盖 创建项目 → SDD 流程 → AI 生成 → TDD 流程 全链路
- [x] T073 [P] 验证 quickstart.md 中的安装和启动步骤可正确执行

---

## 依赖关系与执行顺序

### 阶段依赖

- **初始化（阶段 1）**: 无依赖，立即开始
- **基础设施（阶段 2）**: 依赖初始化完成——阻塞所有用户故事
- **用户故事（阶段 3-8）**: 全部依赖基础设施完成
  - US1（阶段 3）、US2（阶段 4）、US6（阶段 5）可并行开发
  - US3（阶段 6）依赖 US1 完成（SDD 流程需要项目存在）
  - US4（阶段 7）依赖 US3 完成（AI 集成需要任务列表）
  - US5（阶段 8）依赖 US4 完成（TDD 管控需要 AI 能力）
- **收尾（阶段 9）**: 依赖所有用户故事完成

### 用户故事依赖

```text
US1（创建项目）─── 无依赖
US2（导入项目）─── 无依赖
US6（安全围栏）─── 无依赖
US3（SDD 流程）── 依赖 US1
US4（AI 集成）─── 依赖 US3 + US6
US5（TDD 管控）── 依赖 US4
```

### 并行机会

- 阶段 1 所有 [P] 任务可并行
- 阶段 2 所有 [P] 任务可并行
- 阶段 3（US1）、阶段 4（US2）、阶段 5（US6）可并行开发
- 每个用户故事内的 [P] 测试任务可并行
- 每个用户故事内的 [P] 前端/后端任务可并行

---

## 实施策略

### MVP（仅用户故事 1）

1. 完成阶段 1：初始化
2. 完成阶段 2：基础设施（关键阻塞项）
3. 完成阶段 3：用户故事 1
4. **停止并验证**: 独立测试 US1

### 增量交付

1. 初始化 + 基础设施 → 基础就绪
2. 并行完成 US1 + US2 + US6 → 核心 P1 功能就绪
3. 完成 US3 → SDD 流程可用
4. 完成 US4 + US5 → AI + TDD 完整闭环
5. 收尾优化 → 产品级质量

### 并行团队策略

```text
开发者 A: US1 → US3 → US4
开发者 B: US2（完成后协助 US4）
开发者 C: US6（完成后协助 US5）
```

---

## 备注

- [P] 任务 = 不同文件，无依赖，可并行
- [Story] 标签关联具体用户故事
- 每个用户故事独立可完成和测试
- 测试 MUST 先编写并确认失败（Red）再编写实现（Green）
- 每个功能通过测试后 MUST 提交 Git
- US7（工具组件管理）延后到 v2
- 停在任何检查点可独立验证对应故事
