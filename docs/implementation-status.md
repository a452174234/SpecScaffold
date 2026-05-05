# SpecScaffold Web 脚手架平台 — 实现状态报告

> 分支: `001-scaffold-platform` | 更新日期: 2026-05-04

---

## 一、项目概述

SpecScaffold 是一个基于 Harness Engineering 方法论的 Web 端图形化脚手架平台。它将 **SDD（规格驱动开发）** 和 **TDD（测试驱动开发）** 流程通过 Web 界面呈现，集成 Claude Code CLI 作为 AI 执行引擎，Spec Kit Slash Skills 作为 SDD 能力提供方，强制在工程执行前完成基于 TDD 的测试用例。

### 技术栈

| 层级 | 技术 |
|------|------|
| 后端框架 | Hono 4 (轻量级 Web 框架) |
| 前端框架 | React 19 + TypeScript 5 |
| UI 组件库 | Ant Design 6 (中文本地化) |
| 构建工具 | Vite 8 |
| 数据库 | SQLite (better-sqlite3) |
| 状态管理 | Zustand |
| 路由 | React Router 7 |
| 类型验证 | Zod |
| AI 集成 | Claude Code CLI (spawn 调用) |
| 实时通信 | SSE (Server-Sent Events) |
| Markdown 编辑 | @uiw/react-md-editor |
| 测试框架 | Vitest (单元) + Playwright (E2E) |

---

## 二、已实现功能清单

### 2.1 项目管理 (US1 + US2)

#### 创建项目
- **后端**: `ProjectService.create()` — 接收项目名称和路径，创建项目记录到 SQLite，在文件系统生成项目目录结构，同时自动创建默认安全策略
- **API**: `POST /api/projects` — 创建项目端点
- **前端**: `ProjectCreate.tsx` — 表单引导页面，包含项目名称和路径输入，创建成功后自动跳转详情页
- **输入验证**: Zod schema 校验（拒绝空名称/空路径/重复路径）

#### 导入项目
- **后端**: `ProjectService.import()` + `ProjectScanner.scan()` — 输入本地目录路径，自动扫描识别项目技术栈
- **API**: `POST /api/projects/import` — 导入端点
- **前端**: `ProjectImport.tsx` — 输入路径后扫描，展示识别结果（语言、框架标签），确认后导入
- **支持识别**: TypeScript, JavaScript, Python, Java, Rust, Go, C#
- **支持框架**: Next.js, React, Vue, Angular, Express 等

#### 项目列表与详情
- **API**: `GET /api/projects` (列表) / `GET /api/projects/:id` (详情) / `DELETE /api/projects/:id` (归档)
- **前端**: `Home.tsx` — 首页卡片式展示项目列表，支持创建和导入入口；`ProjectDetail.tsx` — 项目详情页，展示基本信息和 5 个功能导航卡片

### 2.2 SDD 规格驱动开发流程 (US3)

#### 五步引导流程
- **后端**: `SddService` 集成 `SpeckitAdapter`，通过 Claude Code CLI 调用 Spec Kit Slash Skills
- **前端**: `SddFlow.tsx` — 步骤引导界面，支持 SSE 实时流式输出，分为五步：

| 步骤 | 操作 | Spec Kit Skill | 说明 |
|------|------|----------------|------|
| 1. 功能描述 | specify | `/speckit-specify` | 用户输入自然语言功能描述，AI 生成功能规格文档 |
| 2. 澄清歧义 | clarify | `/speckit-clarify` | AI 自动审查并补充规格文档，消除歧义 |
| 3. 生成计划 | plan | `/speckit-plan` | 基于规格生成技术实施计划、数据模型、接口契约 |
| 4. 任务列表 | tasks | `/speckit-tasks` | 基于计划生成具体任务清单 |
| 5. 执行实现 | implement | `/speckit-implement` | AI 按任务列表逐步执行实现 |

#### SSE 流式输出
- 每一步都支持 SSE (Server-Sent Events) 实时流式推送：
  - `assistant` 事件：AI 思考过程文本
  - `tool_use` 事件：工具调用名称
  - `tool_result` 事件：工具执行结果
  - `result` 事件：步骤完成，返回结构化结果
- API 端点：`POST /api/projects/:id/:step/stream` (step = specify | clarify | plan | tasks | implement)

#### 自动推进与交互
- 步骤自动推进：上一步完成后自动跳转到下一步
- Markdown 编辑器：每个步骤的产出可在 `@uiw/react-md-editor` 中查看和编辑
- 重新运行检测：已有规格时弹出确认对话框（更新/新建）
- 失败重试：错误状态显示原因，提供重试按钮
- 任务卡片：任务列表以可编辑卡片形式展示，支持删除和文本修改

#### Spec Kit 适配器 (`SpeckitAdapter`)
- 调用 `/speckit-specify`、`/speckit-clarify`、`/speckit-plan`、`/speckit-tasks`、`/speckit-implement` 五个 Slash Skills
- 通过 `ClaudeCodeAdapter` 将 Skill 命令写入 stdin 传给 Claude Code CLI
- 支持 specify, clarify, plan, tasks, implement 五个操作
- 每个操作返回结构化结果（文件路径、内容、Token 用量）
- 流式变体 `xxxStream()` 支持实时回调消息

### 2.3 TDD 测试驱动开发管控 (US5)

#### 工作流状态机 (`WorkflowStateMachine`)

```
pending → testing → test_approved → developing → testing_pass → completed
             ↑           |              |
             +-----------+              |
             +--------------------------+
```

- `pending` — 任务创建，等待编写测试
- `testing` — 测试用例编写中（Red 阶段），支持失败重试回到自身
- `test_approved` — 测试用例审批通过
- `developing` — 业务代码开发中（Green 阶段）
- `testing_pass` — 测试通过
- `completed` — 任务完成

**严格约束**: 不允许跳过测试阶段直接进入开发。

#### TDD 服务 (`TddService`)
- **API**:
  - `GET /api/projects/:id/tasks` — 获取项目任务列表
  - `PATCH /api/projects/:id/tasks/:taskId` — 更新任务状态（受状态机约束）
- **前端**: `TaskBoard.tsx` — 任务表格展示，带颜色状态标签，支持状态流转操作

### 2.4 AI 集成工作区 (US4)

#### AI 服务 (`AiService`)
通过 `ClaudeCodeAdapter` 调用 Claude Code CLI，支持三个核心操作：

| 操作 | API 端点 | TDD 阶段 | 说明 |
|------|----------|----------|------|
| 生成测试 | `POST /api/projects/:id/ai/generate-tests` | Red | 为指定任务生成测试用例 |
| 实现代码 | `POST /api/projects/:id/ai/implement` | Green | AI 自动编写业务代码 |
| 运行测试 | `POST /api/projects/:id/ai/run-tests` | 验证 | 执行测试套件验证实现 |

#### Claude Code 适配器 (`ClaudeCodeAdapter`)
- **实现方式**: 通过 Node.js `child_process.spawn` 调用 Claude Code CLI
- **调用模式**:
  - `execute()` — 使用 `--output-format json` 获取 JSON 格式结果
  - `executeStream()` — 使用 `--output-format stream-json --verbose` 流式读取事件
  - `continueSession()` — 使用 `--resume <sessionId>` 继续已有会话
- **Prompt 传递**: 通过 stdin 写入（避免 Windows cmd.exe 中文编码截断问题）
- **权限模式**: `--dangerously-skip-permissions` 绕过所有交互式权限确认
- **平台适配**: Windows 使用 `claude.cmd` + `shell: true`，Unix 使用 `claude`
- 返回：会话 ID、Token 用量、退出原因

#### 前端 AI 工作区
- `AiWorkspace.tsx` — 任务 ID 输入 + 三个操作按钮（生成测试/实现代码/运行测试），实时显示 AI 输出

### 2.5 安全围栏与审计 (US6)

#### 安全围栏 (`SecurityFence`)
- **四级风险评估**: `read_only` / `low` / `high` / `blocked`
- **工具风险分级**:
  - 只读工具: Read, Glob, Grep → 自动放行
  - 写入工具: Write, Edit → 项目内放行，项目外拦截
  - 执行工具: Bash → 高风险，需审批
  - 危险命令: 含 `rm` 等 → 直接拦截
- **决策类型**: `allow` (自动放行) / `deny` (直接拦截) / `ask` (需人工审批)

#### 策略管理 (`PolicyManager`)
- 每个项目独立的安全策略配置
- 可配置：高风险工具列表、只读工具列表、危险命令模式
- 持久化到 `security_policies` 表
- **API**: `GET /api/projects/:id/security/policy` / `PUT /api/projects/:id/security/policy`
- **前端**: `SecurityPolicy.tsx` — 可视化标签式配置，支持添加/删除工具和命令模式

#### 审计服务 (`AuditService`)
- 记录所有安全相关操作到 `audit_logs` 表
- 字段包括：工具名、操作、目标路径、风险级别、审批结果、操作描述
- **API**: `GET /api/projects/:id/security/audit-logs`（支持 sessionId 过滤和分页）
- **前端**: `AuditLog.tsx` — 表格式审计日志，风险级别和审批结果彩色标签

### 2.6 适配器注册表 (`AdapterRegistry`)

- 统一的适配器注册/查询机制
- `IToolAdapter` 接口定义适配器能力描述和限制
- 全局单例 `adapterRegistry`，当前注册了：
  - `claude-code` — ClaudeCodeAdapter
  - `speckit` — SpeckitAdapter

---

## 三、数据模型

### 数据库表结构 (SQLite)

| 表名 | 字段 | 说明 |
|------|------|------|
| `projects` | id, name, path, type, language, framework, status, created_at | 项目信息 |
| `specs` | id, project_id, branch, description, file_path, status, content, session_id, token_usage, created_at | 规格说明 |
| `plans` | id, project_id, spec_id, file_path, status, created_at | 实施计划 |
| `tasks` | id, plan_id, project_id, task_id, title, description, status, priority, parallelizable, test_file, implementation_file, created_at | 任务列表 |
| `security_policies` | id, project_id, policy_json, created_at, updated_at | 安全策略 |
| `audit_logs` | id, project_id, session_id, tool_name, operation, target, risk_level, audit_result, operation_description, reviewer_feedback, timestamp | 审计日志 |

---

## 四、API 接口汇总

### 项目管理

| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/api/projects` | 获取项目列表 |
| POST | `/api/projects` | 创建新项目 |
| GET | `/api/projects/:id` | 获取项目详情 |
| POST | `/api/projects/import` | 导入现有项目 |
| DELETE | `/api/projects/:id` | 归档项目 |

### SDD 流程

| 方法 | 路径 | 功能 |
|------|------|------|
| POST | `/api/projects/:id/specify` | 生成功能规格（同步） |
| POST | `/api/projects/:id/clarify` | 澄清规格（同步） |
| POST | `/api/projects/:id/plan` | 生成实施计划（同步） |
| POST | `/api/projects/:id/tasks` | 生成任务列表（同步） |
| POST | `/api/projects/:id/implement` | 执行实现（同步） |
| POST | `/api/projects/:id/:step/stream` | 流式执行任意步骤（SSE） |
| POST | `/api/projects/:id/content/save` | 保存步骤内容到文件 |
| GET | `/api/projects/:id/status` | 获取 SDD 流程状态 |

### AI 服务

| 方法 | 路径 | 功能 |
|------|------|------|
| POST | `/api/projects/:id/ai/generate-tests` | AI 生成测试用例 |
| POST | `/api/projects/:id/ai/implement` | AI 实现代码 |
| POST | `/api/projects/:id/ai/run-tests` | AI 运行测试 |

### 任务管理

| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/api/projects/:id/tasks` | 获取项目任务 |
| PATCH | `/api/projects/:id/tasks/:taskId` | 更新任务状态 |

### 安全管理

| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/api/projects/:id/security/policy` | 获取安全策略 |
| PUT | `/api/projects/:id/security/policy` | 更新安全策略 |
| GET | `/api/projects/:id/security/audit-logs` | 查询审计日志 |

---

## 五、前端页面

| 路由 | 页面组件 | 功能 |
|------|----------|------|
| `/` | Home.tsx | 项目列表首页，卡片展示 |
| `/projects/new` | ProjectCreate.tsx | 新建项目表单 |
| `/projects/import` | ProjectImport.tsx | 导入项目，自动扫描技术栈 |
| `/projects/:id` | ProjectDetail.tsx | 项目详情与 5 功能导航卡片 |
| `/projects/:id/sdd` | SddFlow.tsx | SDD 五步引导流程（SSE 流式 + Markdown 编辑） |
| `/projects/:id/ai` | AiWorkspace.tsx | AI 工作区（生成测试/实现/运行） |
| `/projects/:id/tasks` | TaskBoard.tsx | TDD 任务面板，状态流转 |
| `/projects/:id/audit` | AuditLog.tsx | 审计日志表格 |
| `/projects/:id/security` | SecurityPolicy.tsx | 安全策略标签式配置 |

---

## 六、测试覆盖

### 后端测试（Vitest）

| 指标 | 数值 |
|------|------|
| 测试文件总数 | 11 |
| 测试用例总数 | 55 |
| 通过率 | 100% |

| 模块 | 测试文件 | 用例数 |
|------|----------|--------|
| 项目创建服务 | project-create.test.ts (unit) | 6 |
| 项目导入服务 | project-import.test.ts (unit) | 4 |
| 项目扫描器 | project-scanner.test.ts (unit) | 5 |
| AI 服务 | ai-service.test.ts (unit) | 4 |
| TDD 服务 | tdd-service.test.ts (unit) | 7 |
| 安全围栏 | fence.test.ts (unit) | 10 |
| 审计服务 | audit.test.ts (unit) | 3 |
| 工作流状态机 | workflow.test.ts (unit) | 4 |
| Claude Code 适配器 | claude-code-adapter.test.ts (unit) | 4 |
| SpecKit 适配器 | speckit-adapter.test.ts (integration) | 3 |
| 项目创建 API | project-create.test.ts (integration) | 5 |

### 前端 E2E 测试（Playwright）

共 16 个测试文件，覆盖所有页面和核心交互：

| 类别 | 测试文件 |
|------|----------|
| 基础页面 | home.spec.ts, project-create.spec.ts, project-import.spec.ts |
| SDD 流程 | sdd-flow.spec.ts, sdd-auto-flow.spec.ts, sdd-editable-output.spec.ts, sdd-task-execution.spec.ts, sdd-integration.spec.ts |
| AI 工作区 | ai-workspace.spec.ts, ai-integration.spec.ts |
| 任务面板 | task-board.spec.ts |
| 安全审计 | audit-log.spec.ts, security-policy.spec.ts |
| 错误处理 | error-handling.spec.ts |
| 真实 AI 测试 | real-2048-sdd.spec.ts, real-2048-sdd-ui.spec.ts |

---

## 七、构建与运行验证

| 检查项 | 状态 |
|--------|------|
| TypeScript 编译 (后端) | 通过 |
| Vite 生产构建 (前端) | 通过 |
| Vitest 后端测试 | 55/55 通过 |
| Playwright E2E 测试 | 16 文件就绪 |

---

## 八、文件结构

```
SpecScaffold/
├── .claude/                          # Claude Code 配置
│   ├── settings.local.json           # 权限配置
│   └── skills/                       # Spec Kit Skills
├── .specify/                         # Spec Kit 配置
│   ├── integration.json              # 集成版本
│   ├── integrations/                 # Manifest 文件
│   ├── memory/constitution.md        # 项目宪法
│   └── templates/                    # Spec/Plan/Tasks 模板
├── backend/
│   ├── src/
│   │   ├── main.ts                   # Hono 应用入口
│   │   ├── adapters/
│   │   │   ├── registry.ts           # 适配器注册表
│   │   │   ├── claude-code/          # Claude Code CLI 适配器 (spawn)
│   │   │   └── speckit/              # Spec Kit 适配器 (/speckit-xxx)
│   │   ├── api/
│   │   │   ├── middleware/           # 响应格式化 + 错误处理
│   │   │   └── routes/              # 5 组 API 路由
│   │   ├── core/
│   │   │   └── workflow.ts           # TDD 状态机
│   │   ├── db/
│   │   │   ├── index.ts              # 数据库连接管理
│   │   │   └── init.ts               # 数据库初始化
│   │   ├── models/                   # Zod 数据模型
│   │   ├── security/
│   │   │   ├── audit.ts              # 审计服务
│   │   │   ├── fence.ts              # 安全围栏
│   │   │   └── policy.ts             # 策略管理
│   │   └── services/
│   │       ├── ai-service.ts         # AI 集成服务
│   │       ├── project-scanner.ts    # 项目技术栈扫描
│   │       ├── project-service.ts    # 项目 CRUD
│   │       ├── sdd-service.ts        # SDD 流程服务 (含 SSE)
│   │       ├── security-service.ts   # 安全服务门面
│   │       └── tdd-service.ts        # TDD 任务管理
│   └── tests/
│       ├── setup.ts                  # 测试数据库配置
│       ├── unit/                     # 单元测试 (9 文件)
│       └── integration/              # 集成测试 (2 文件)
├── frontend/
│   ├── e2e/                          # Playwright E2E 测试 (16 文件)
│   └── src/
│       ├── App.tsx                   # 路由配置
│       ├── pages/                    # 页面组件 (9 个)
│       │   ├── Home.tsx
│       │   ├── ProjectDetail.tsx
│       │   ├── SddFlow.tsx           # SDD 五步流程 + SSE + Markdown
│       │   ├── AiWorkspace.tsx
│       │   ├── TaskBoard.tsx
│       │   ├── AuditLog.tsx
│       │   └── SecurityPolicy.tsx
│       ├── services/api.ts           # HTTP + SSE + WebSocket 封装
│       └── stores/                   # Zustand Stores (3 个)
├── specs/                            # Spec Kit 产物
└── docs/                             # 文档
```

---

## 九、用户故事实现状态

| 用户故事 | 描述 | 后端 | 前端 | 测试 | 状态 |
|----------|------|------|------|------|------|
| US1 | 创建脚手架项目 | ProjectService.create | ProjectCreate.tsx | 6 unit + 5 int | 已实现 |
| US2 | 导入现有项目 | ProjectService.import + Scanner | ProjectImport.tsx | 4 unit + 5 unit(scanner) | 已实现 |
| US3 | SDD 规格驱动开发 | SddService + SpeckitAdapter | SddFlow.tsx | 4 unit(adapter) + 5 E2E | 已实现 |
| US4 | AI 集成辅助 | AiService + ClaudeCodeAdapter | AiWorkspace.tsx | 4 unit + 2 E2E | 已实现 |
| US5 | TDD 测试驱动管控 | TddService + WorkflowStateMachine | TaskBoard.tsx | 7 unit + 4 unit(workflow) + 1 E2E | 已实现 |
| US6 | 安全围栏与审计 | SecurityFence + AuditService + PolicyManager | AuditLog.tsx + SecurityPolicy.tsx | 10 unit + 2 E2E | 已实现 |

---

## 十、已知限制与待改进项

1. **前端无组件级测试**: E2E 测试覆盖页面交互，但缺少 React 组件单元测试
2. **SDD UI 测试**: `real-2048-sdd-ui.spec.ts` (UI 驱动) 在 Playwright 中检测 React 状态变化仍有不稳定情况
3. **数据库迁移**: 使用 SQLite，尚无版本化迁移机制
4. **认证授权**: 无用户系统，所有 API 无鉴权
5. **前端构建体积**: 建议引入 code splitting
6. **Spec Kit 依赖**: SDD 流程依赖 `.claude/skills/` 中的 Spec Kit Skills 文件
