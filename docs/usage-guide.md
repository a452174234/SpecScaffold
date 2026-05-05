# SpecScaffold 使用文档

## 1. 项目简介

SpecScaffold 是一个基于 Harness Engineering 的 Web 端图形化脚手架平台，提供规格驱动开发（SDD）、AI 辅助编码、TDD 任务管理、安全审计等全链路功能。

**核心技术**：

| 层级 | 技术 |
|------|------|
| 前端 | React 19 + Ant Design 6 + React Router 7 + Vite 8 |
| 后端 | Hono 4 + better-sqlite3 + TypeScript 5 |
| AI 执行 | Claude Code CLI（spawn 调用，stdin 传 prompt） |
| 实时通信 | SSE（Server-Sent Events）流式输出 |
| Markdown 编辑 | @uiw/react-md-editor |
| 测试 | Vitest（单元，55 用例）+ Playwright（E2E，16 文件） |

## 2. 环境要求

| 项目 | 最低版本 | 说明 |
|------|---------|------|
| Node.js | 18+ | 推荐 v22.x |
| npm | 9+ | 随 Node.js 安装 |
| Claude Code CLI | 最新版 | SDD 和 AI 功能需要 |
| 操作系统 | Windows 10+ / macOS 12+ / Linux | better-sqlite3 需要 C++ 编译环境 |

**Windows 用户**：需安装 [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)，勾选 "C++ 桌面开发" 工作负载。

**macOS 用户**：运行 `xcode-select --install` 安装命令行工具。

**Claude Code**：SDD 流程和 AI 工作区需要 Claude Code CLI 已安装并可用。访问 https://claude.ai/code 安装。

## 3. 安装步骤

### 3.1 获取代码

```bash
git clone <仓库地址>
cd SpecScaffold
```

### 3.2 安装依赖

项目采用 monorepo 结构，需要在三个目录分别安装：

```bash
# 根目录（concurrently、tsx、Playwright 等开发工具）
npm install

# 后端依赖（Hono、better-sqlite3 等）
cd backend && npm install && cd ..

# 前端依赖（React、Ant Design 等）
cd frontend && npm install && cd ..
```

### 3.3 初始化数据库

```bash
npm run db:init
```

数据库文件位于 `~/.spec-scaffold/data.db`，首次运行会自动创建目录和表结构。

## 4. 启动应用

### 4.1 一键启动（推荐）

```bash
npm run dev
```

该命令使用 `concurrently` 同时启动前后端：
- 后端：`http://localhost:3000`（Hono + tsx watch 热重载）
- 前端：`http://localhost:5173`（Vite dev server 热重载）

打开浏览器访问 `http://localhost:5173` 即可使用。

### 4.2 分别启动

```bash
# 终端 1：启动后端
npm run dev:backend

# 终端 2：启动前端
npm run dev:frontend
```

### 4.3 自定义端口

后端端口通过环境变量 `PORT` 控制：

```bash
PORT=8080 npm run dev:backend
```

## 5. 功能使用指南

### 5.1 首页 — 项目列表

访问 `http://localhost:5173/` 进入首页。

**功能**：
- 查看所有已创建/导入的项目，以卡片形式展示
- 每张卡片显示项目名称、路径、类型标签（新建/导入）、技术栈标签
- 点击卡片进入项目详情页

**操作入口**：
- **新建项目** — 点击右上角「新建项目」按钮
- **导入项目** — 点击右上角「导入项目」按钮

### 5.2 创建项目

路径：`/projects/new`

**操作流程**：
1. 填写「项目名称」（必填，如 `my-awesome-project`）
2. 填写「项目路径」（必填，如 `D:\projects\my-awesome-project`）
3. 点击「创建项目」按钮
4. 创建成功后自动跳转到项目详情页
5. 系统会在指定路径创建项目目录及 `specs/` 子目录

**注意**：路径不能重复，同一路径只能创建一个项目。

### 5.3 导入项目

路径：`/projects/import`

**操作流程**：
1. 填写「项目名称」
2. 填写「项目路径」（必须是本地已有的项目目录绝对路径）
3. 点击「导入项目」按钮
4. 系统自动扫描项目目录，识别语言和框架
5. 识别结果以标签形式展示（如 TypeScript、React）
6. 点击「进入项目」跳转到详情页

**支持识别的语言**：TypeScript、JavaScript、Python、Java、Rust、Go、C#

**支持识别的框架**：Next.js、React、Vue、Angular、Svelte、Express、Hono、NestJS

### 5.4 项目详情页

路径：`/projects/:id`

项目详情页是项目的导航中心，顶部显示项目基本信息（名称、路径、类型、技术栈），下方有 5 个功能入口卡片：

| 卡片 | 说明 | 跳转路径 |
|------|------|---------|
| SDD 规格驱动开发 | 输入功能描述，自动生成 Spec → Plan → Tasks → 实现 | `/projects/:id/sdd` |
| AI 工作区 | 选择任务，AI 生成测试用例和业务代码 | `/projects/:id/ai` |
| 任务面板 | 查看任务列表，管理 TDD 状态流转 | `/projects/:id/tasks` |
| 审计日志 | 查看 AI 操作历史和安全围栏审批记录 | `/projects/:id/audit` |
| 安全策略 | 配置项目安全策略和工具权限 | `/projects/:id/security` |

### 5.5 SDD 规格驱动开发流程

路径：`/projects/:id/sdd`

这是 SpecScaffold 的核心功能，通过五步引导式工作流，将自然语言需求转化为可执行的代码实现。每一步都通过 Claude Code CLI 调用 Spec Kit Slash Skills（`/speckit-specify`、`/speckit-clarify`、`/speckit-plan`、`/speckit-tasks`、`/speckit-implement`）。

**整体流程**：

```
功能描述 → 澄清歧义 → 生成计划 → 任务列表 → 执行实现
 Specify    Clarify      Plan      Tasks     Implement
```

#### 步骤 1 — 功能描述 (Specify)

1. 在文本框中输入自然语言功能描述
   - 示例：`2048小游戏：4x4网格，方向键控制数字合并，得分计算，单个HTML文件输出`
2. 点击「开始生成」
3. 页面下方「执行日志」区域实时显示 SSE 流式输出：
   - `[思考中...]` — AI 正在推理
   - `[工具] tool_name` — AI 正在调用工具
   - `[结果] ok` — 工具执行完成
4. 完成后自动显示 Markdown 编辑器，展示生成的功能规格文档
5. 可在编辑器中直接修改内容
6. 点击「确认，进入下一步」进入澄清阶段

**注意**：如果已有规格文档，点击「开始生成」会弹出确认对话框，选择「更新已有 spec」或「创建新 spec」。

#### 步骤 2 — 澄清歧义 (Clarify)

1. 系统自动审查规格文档，补充遗漏和消除歧义
2. 完成后显示更新后的规格文档（Markdown 可编辑）
3. 点击「确认，进入下一步」进入计划阶段

#### 步骤 3 — 生成计划 (Plan)

1. 基于规格文档生成技术实施计划
2. 产出包括：实施计划、技术调研、数据模型、接口契约、快速上手文档
3. 完成后显示计划内容（Markdown 可编辑）
4. 点击「确认，进入下一步」进入任务生成

**注意**：此步骤可能耗时较长（1-5 分钟），因为需要生成多个文档。

#### 步骤 4 — 任务列表 (Tasks)

1. 基于实施计划生成具体任务清单
2. 任务以可编辑卡片形式展示，每个卡片显示任务 ID（如 T001）和描述
3. 支持操作：
   - **编辑描述**：直接在输入框中修改任务文本
   - **删除任务**：点击卡片右侧的删除按钮
4. 点击「开始执行」进入实现阶段

#### 步骤 5 — 执行实现 (Implement)

1. AI 按任务列表逐个执行实现
2. 执行日志实时显示进度
3. 完成后显示「执行完成」成功提示
4. 生成的代码文件保存在项目目录中

**注意**：实现步骤耗时最长，取决于任务数量和复杂度，可能需要 5-30 分钟。

#### 步骤导航

- 顶部 Steps 组件显示当前进度，可点击已完成的步骤回看
- 修改上游步骤内容后，系统会显示黄色警告：「已修改上游内容，建议重新执行后续步骤」
- 执行过程中出现错误，页面底部显示红色错误提示和「重试」按钮

### 5.6 AI 工作区

路径：`/projects/:id/ai`

提供 TDD 循环的三个操作：

1. **生成测试（Red）** — AI 根据任务需求生成测试用例
2. **实现代码（Green）** — AI 根据测试用例实现业务代码
3. **运行测试** — AI 运行测试验证实现

**操作流程**：
1. 在「任务ID」输入框中填入任务编号（如 `T001`）
2. 点击对应操作按钮
3. 页面下方「AI 输出」区域实时显示操作结果

**注意**：AI 功能依赖 Claude Code CLI 环境，需要 Claude Code 已安装且可用。

### 5.7 任务面板

路径：`/projects/:id/tasks`

以表格形式展示项目任务列表，包含任务 ID、标题、优先级、状态和操作按钮。

**TDD 状态流转**：

```
pending → testing → test_approved → developing → testing_pass → completed
```

| 当前状态 | 操作按钮 | 转换到 |
|---------|---------|-------|
| 待处理 (pending) | 「开始测试」 | 测试中 (testing) |
| 测试中 (testing) | 「审批通过」 | 测试已审批 (test_approved) |
| 测试已审批 (test_approved) | 「开始开发」 | 开发中 (developing) |
| 开发中 (developing) | 「测试通过」 | 测试通过 (testing_pass) |
| 测试通过 (testing_pass) | 「完成」 | 已完成 (completed) |

非法的状态转换会被后端拒绝。

### 5.8 审计日志

路径：`/projects/:id/audit`

展示项目中所有 AI 操作的安全审计记录。

**表格列**：时间、工具名称、风险级别、操作描述、目标路径、审批结果、说明

**风险级别颜色**：
- 红 — high（高风险）
- 橙 — low（低风险）
- 绿 — read_only（只读）
- 灰 — blocked（已阻止）

**审批结果颜色**：
- 绿 — auto_allowed（自动放行）
- 蓝 — user_approved（人工批准）
- 红 — user_rejected（人工拒绝）
- 灰 — blocked（已阻止）

### 5.9 安全策略管理

路径：`/projects/:id/security`

管理项目的安全策略，包含三个配置组：

| 配置组 | 说明 | 默认值 |
|--------|------|--------|
| 高风险工具 | 需要审批才能执行的工具 | Bash、Write、Edit |
| 只读工具 | 只读操作，自动放行 | Read、Glob、Grep |
| 危险命令模式 | 匹配则阻止执行的命令正则 | （空） |

**操作**：
- 点击输入框输入新工具名，按 Enter 添加
- 点击标签上的 × 删除已有工具
- 点击「保存」按钮提交修改

## 6. API 参考

所有 API 位于 `http://localhost:3000/api`，返回 JSON 格式。

### 6.1 项目管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/projects` | 获取所有项目列表 |
| POST | `/api/projects` | 创建项目 `{ name, path, type }` |
| GET | `/api/projects/:id` | 获取项目详情 |
| POST | `/api/projects/import` | 导入项目 `{ name, path }` |
| DELETE | `/api/projects/:id` | 归档项目 |

### 6.2 SDD 流程

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/projects/:id/specify` | 生成功能规格 `{ description }` |
| POST | `/api/projects/:id/clarify` | 澄清规格 `{ clarification }` |
| POST | `/api/projects/:id/plan` | 生成实施计划 `{ guidance }` |
| POST | `/api/projects/:id/tasks` | 生成任务列表 `{ constraints }` |
| POST | `/api/projects/:id/implement` | 执行实现 `{}` |
| POST | `/api/projects/:id/:step/stream` | 流式执行步骤（SSE），step = specify / clarify / plan / tasks / implement |
| POST | `/api/projects/:id/content/save` | 保存步骤编辑内容 `{ step, content }` |
| GET | `/api/projects/:id/status` | 获取 SDD 流程状态 |

**SSE 流式端点说明**：

`POST /api/projects/:id/:step/stream` 返回 `text/event-stream`，事件格式：

```
event: message
data: {"type": "assistant", "content": {...}}

event: message
data: {"type": "tool_use", "content": {...}}

event: message
data: {"type": "result", "content": {"content": "...", "sessionId": "...", "tokenUsage": {...}}}
```

### 6.3 AI 工作区

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/projects/:id/ai/generate-tests` | 生成测试 `{ taskId }` |
| POST | `/api/projects/:id/ai/implement` | 实现代码 `{ taskId }` |
| POST | `/api/projects/:id/ai/run-tests` | 运行测试 `{ taskId }` |

### 6.4 任务管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/projects/:id/tasks` | 获取任务列表 |
| PATCH | `/api/projects/:id/tasks/:taskId` | 更新任务状态 `{ status }` |

### 6.5 安全与审计

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/projects/:id/security/policy` | 获取安全策略 |
| PUT | `/api/projects/:id/security/policy` | 更新安全策略 |
| GET | `/api/projects/:id/security/audit-logs` | 获取审计日志（支持 `?sessionId=` 过滤） |

### 6.6 系统

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |

## 7. 测试

### 7.1 后端单元测试

```bash
# 运行所有单元测试（55 个用例）
npm test

# 监听模式
npm run test:watch
```

单元测试使用 Vitest 框架，位于 `backend/tests/` 目录。测试覆盖：项目服务、AI 服务、TDD 服务、安全围栏、审计、工作流状态机、Claude Code 适配器、Spec Kit 适配器。

### 7.2 前端 E2E 测试

```bash
# 运行全部 E2E 测试
npm run test:e2e

# 运行指定测试文件
npx playwright test frontend/e2e/home.spec.ts

# 以有头模式运行（打开浏览器窗口）
npx playwright test --headed

# 查看 HTML 测试报告
npx playwright show-report
```

E2E 测试使用 Playwright（仅 Chromium），位于 `frontend/e2e/` 目录（16 个文件）。测试覆盖：首页、项目创建/导入、SDD 流程（含自动推进、编辑、任务执行）、AI 工作区、任务面板、审计日志、安全策略、错误处理。

**真实 AI 测试**：
- `real-2048-sdd.spec.ts` — 通过 API 驱动完整 SDD 流程，使用真实 Claude Code CLI 生成 2048 游戏
- `real-2048-sdd-ui.spec.ts` — 通过 UI 驱动完整 SDD 流程（需要 Claude Code CLI 和较长执行时间）

测试会自动启动独立数据库、前后端服务，运行完毕后清理。

## 8. 常用命令速查

```bash
npm run dev          # 启动前后端开发服务器
npm run dev:backend  # 仅启动后端（端口 3000）
npm run dev:frontend # 仅启动前端（端口 5173）
npm run db:init      # 初始化数据库
npm test             # 运行后端单元测试（55 用例）
npm run test:e2e     # 运行 Playwright E2E 测试（16 文件）
npm run build        # 构建前端
npm run lint         # 检查代码规范
```

## 9. 常见问题

### Q: npm install 报错 "gyp ERR!"

better-sqlite3 需要编译原生模块。Windows 需安装 Visual Studio Build Tools（C++ 桌面开发工作负载），macOS 需运行 `xcode-select --install`。

### Q: 端口 3000 已被占用

后端默认使用 3000 端口，通过环境变量修改：

```bash
PORT=8080 npm run dev:backend
```

同时需修改 `frontend/src/services/api.ts` 中的 `API_BASE` 为对应端口。

### Q: 端口 5173 已被占用

Vite 会自动选择下一个可用端口（5174、5175...），无需手动配置。

### Q: 数据库文件在哪里

默认路径：`~/.spec-scaffold/data.db`（`~` 即用户主目录）。

### Q: 如何重置数据库

删除数据库文件后重新初始化：

```bash
# Windows
del "%USERPROFILE%\.spec-scaffold\data.db"
npm run db:init

# macOS / Linux
rm ~/.spec-scaffold/data.db
npm run db:init
```

### Q: SDD 流程报错或超时

SDD 流程依赖 Claude Code CLI。请确保：
1. Claude Code 已安装：在终端运行 `claude --version` 验证
2. API 密钥已配置：Claude Code 需要有效的 Anthropic API 密钥
3. 项目目录有 Spec Kit Skills 文件：检查项目目录下 `.claude/skills/` 是否存在
4. 网络连接正常：Claude API 需要访问外网

### Q: Implement 步骤耗时过长

实现步骤的执行时间取决于任务数量和复杂度。对于大型项目（20+ 任务），可能需要 15-30 分钟。可以在执行日志中查看实时进度。如果超时，可以在 `backend/src/adapters/speckit/adapter.ts` 中调整 `maxTurns` 参数。

### Q: 如何在 E2E 测试中使用真实 AI

`real-2048-sdd.spec.ts` 和 `real-2048-sdd-ui.spec.ts` 会调用真实 Claude Code CLI。运行前确保：
1. Claude Code CLI 已安装并认证
2. 设置足够的超时（测试默认 30 分钟）
3. 这些测试会产生 API 费用
