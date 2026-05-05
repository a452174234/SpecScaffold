# Tasks: SDD 流程接入 Spec Kit 技能

**Feature**: specs/003-real-sdd-2048-test
**Generated**: 2026-05-04

## Phase 1: Setup

- [X] T001 安装前端 Markdown 编辑器依赖 `@uiw/react-md-editor`，在 `frontend/package.json` 中添加
- [X] T002 扩展 `backend/src/adapters/speckit/types.ts`，为 SpecifyResult / ClarifyResult / PlanResult / TasksResult / ImplementResult 增加 content、sessionId、tokenUsage、exitReason 字段
- [X] T003 [P] 扩展 `frontend/src/services/api.ts`，新增 `apiPostSSE(path, body, onMessage)` 函数，使用 fetch + ReadableStream 接收 SSE 流式事件

## Phase 2: Foundational

- [X] T004 数据库迁移：在 `backend/src/db/index.ts` 中为 specs 表增加 content/session_id/token_usage 列，plans 表增加 content/session_id/token_usage 列，tasks 表增加 order_index/content 列
- [X] T005 同步更新 `frontend/e2e/global-setup.ts`——在 E2E 测试数据库建表 SQL 中同步增加新字段（content, session_id, token_usage, order_index）
- [X] T006 更新 `frontend/e2e/fixtures/api-mocks.ts`——所有 SDD mock 响应增加 content/sessionId/tokenUsage 字段，新增 SSE 流式 mock 辅助函数 `mockSddSSE(page)`
- [X] T007 重写 `backend/src/adapters/speckit/adapter.ts`——SpeckitAdapter 内部注入 ClaudeCodeAdapter，每个方法构造 `/speckit-xxx` 调用命令并通过 SDK execute() 执行，执行后从磁盘读取产出文件返回内容
- [X] T008 为 SpeckitAdapter 添加流式方法：`specifyStream`、`clarifyStream`、`planStream`、`tasksStream`、`implementStream`，内部使用 `ClaudeCodeAdapter.executeStream()` 并通过回调推送 SSE 事件
- [X] T009 在 `backend/src/services/project-service.ts` 的 `create()` 和 `import()` 方法中增加步骤：检测项目目录下是否存在 `.claude/skills/`，不存在则创建 junction（Windows: `mklink /J`）指向 SpecScaffold 平台的 `.claude/skills/`

## Phase 3: User Story 1 — SDD 步骤自动推进 (P1)

**目标**: 后端 SpeckitAdapter 通过 SDK 调用 Spec Kit 技能，前端 SddFlow 步骤间自动推进
**独立测试**: 在 SDD 页面输入描述，观察 4 步自动走完，每步产生真实内容

### TDD Red — 编写 US1 测试用例

- [X] T010 [US1] 创建 `frontend/e2e/sdd-auto-flow.spec.ts`——测试：输入描述后点击"开始生成"，specify 完成后前端自动进入 clarify 步骤（mock SSE specify → 验证 clarify 区域出现）
- [X] T011 [US1] 在 `sdd-auto-flow.spec.ts` 中添加测试：clarify 完成后自动进入 plan 步骤（mock SSE clarify → 验证 plan 区域出现）
- [X] T012 [US1] 在 `sdd-auto-flow.spec.ts` 中添加测试：plan 完成后自动进入 tasks 步骤（mock SSE plan → 验证 tasks 区域出现）
- [X] T013 [US1] 在 `sdd-auto-flow.spec.ts` 中添加测试：4 步流程中前端实时显示 Claude 执行日志（mock SSE 推送 assistant/tool_use 事件 → 验证日志区域包含对应文本）
- [X] T014 [US1] 在 `sdd-auto-flow.spec.ts` 中添加测试：SSE 连接断开后重连获取结果（模拟 SSE 中断 → 调用 `/sdd/status` → 验证显示已完成的内容）
- [X] T015 [US1] 在 `sdd-auto-flow.spec.ts` 中添加测试：API 端点返回 content 字段（直接 request.post 调用 specify/clarify/plan/tasks → 验证 response.data.content 为非空字符串）

### TDD Green — 实现 US1 功能使测试通过

- [X] T016 [US1] 修改 `backend/src/services/sdd-service.ts`——所有方法使用新的 SpeckitAdapter，将 content/sessionId/tokenUsage 写入数据库
- [X] T017 [US1] 修改 `backend/src/api/routes/sdd.ts`——现有 4 个端点返回值增加 content/sessionId/tokenUsage 字段
- [X] T018 [US1] 新增 SSE 流式端点：`POST /api/projects/:id/sdd/:step/stream`，在 `backend/src/api/routes/sdd.ts` 中使用 Hono `c.stream()` 返回 SSE
- [X] T019 [US1] 新增内容保存端点：`POST /api/projects/:id/sdd/content/save`，在 `backend/src/api/routes/sdd.ts` 中接收 step + content，写入磁盘并更新数据库
- [X] T020 [US1] 新增状态查询端点：`GET /api/projects/:id/sdd/status`，在 `backend/src/api/routes/sdd.ts` 中返回 SDD 各步骤状态
- [X] T021 [US1] 新增任务执行端点：`POST /api/projects/:id/sdd/implement`，在 `backend/src/api/routes/sdd.ts` 中调用 SpeckitAdapter.implement()
- [X] T022 [US1] 重写 `frontend/src/pages/SddFlow.tsx`——4 步向导改为自动推进模式：用户输入描述后点击"开始生成"，调用 SSE 端点，完成后展示内容并自动触发下一步
- [X] T023 [US1] 在 `frontend/src/pages/SddFlow.tsx` 中添加 SSE 连接管理和重连逻辑——连接断开后调用 `/sdd/status` 获取已完成结果

### TDD Verify — 确认 US1 测试通过

- [X] T024 [US1] 运行 `npx playwright test sdd-auto-flow` 确认全部通过

## Phase 4: User Story 2 — 每步产出可审阅可编辑 (P1)

**目标**: 每步产出以 Markdown 编辑器展示，用户可修改并保存，修改后内容作为下一步输入
**独立测试**: specify 完成后在编辑器中修改 spec，确认后观察 clarify 是否使用修改后的内容

### TDD Red — 编写 US2 测试用例

- [X] T025 [US2] 创建 `frontend/e2e/sdd-editable-output.spec.ts`——测试：specify 完成后页面出现 Markdown 编辑器，编辑器中包含 spec 内容（mock SSE specify → 验证 .w-md-editor 元素存在且含文本）
- [X] T026 [US2] 在 `sdd-editable-output.spec.ts` 中添加测试：修改编辑器内容后点击"确认"，验证前端调用 POST /sdd/content/save（mock save 端点 → 拦截请求验证 body.content 已变更）
- [X] T027 [US2] 在 `sdd-editable-output.spec.ts` 中添加测试：修改前序步骤后提示"建议重新执行后续步骤"（在 clarify 阶段返回 step 1 → 修改内容 → 验证警告提示出现）

### TDD Green — 实现 US2 功能使测试通过

- [X] T028 [US2] 在 `frontend/src/pages/SddFlow.tsx` 中引入 `@uiw/react-md-editor`，每步完成后用 MDEditor 组件展示产出内容，支持编辑模式
- [X] T029 [US2] 在 `frontend/src/pages/SddFlow.tsx` 中添加"确认，进入下一步"按钮——点击时先调用 `POST /sdd/content/save` 保存编辑后的内容，再自动触发下一步的 SSE 调用
- [X] T030 [US2] 在 `frontend/src/pages/SddFlow.tsx` 中添加上游修改检测——当用户返回修改前序步骤时，提示"已修改上游内容，建议重新执行后续步骤"

### TDD Verify — 确认 US2 测试通过

- [X] T031 [US2] 运行 `npx playwright test sdd-editable-output` 确认全部通过

## Phase 5: User Story 3 — 可调整的任务列表与一键执行 (P2)

**目标**: 任务列表可编辑（修改描述、删除），确认后点击"执行"调用 /speckit-implement
**独立测试**: 生成任务后修改描述、删除任务，点击"执行"观察实际执行

### TDD Red — 编写 US3 测试用例

- [X] T032 [US3] 创建 `frontend/e2e/sdd-task-execution.spec.ts`——测试：tasks 完成后显示任务卡片列表（mock SSE tasks 返回含 3 个任务的 content → 验证页面渲染 3 张任务卡片）
- [X] T033 [US3] 在 `sdd-task-execution.spec.ts` 中添加测试：编辑任务描述后列表更新（点击某张卡片编辑区域 → 修改文本 → 验证卡片内容已变更）
- [X] T034 [US3] 在 `sdd-task-execution.spec.ts` 中添加测试：删除任务后列表减少（点击删除按钮 → 验证卡片数从 3 变为 2）
- [X] T035 [US3] 在 `sdd-task-execution.spec.ts` 中添加测试：点击"开始执行"调用 implement 端点（mock implement SSE → 点击执行 → 验证 POST /sdd/implement 被调用）
- [X] T036 [US3] 在 `sdd-task-execution.spec.ts` 中添加测试：执行过程中显示实时进度（mock implement SSE 推送 tool_use 事件 → 验证进度区域显示"正在执行"）

### TDD Green — 实现 US3 功能使测试通过

- [X] T037 [US3] 在 `frontend/src/pages/SddFlow.tsx` 的 tasks 步骤中，解析 tasks.md 内容为任务卡片列表，每张卡片显示复选框、描述、文件路径，支持编辑和删除
- [X] T038 [US3] 在 tasks 步骤添加"开始执行"按钮——点击后将编辑后的 tasks 内容保存，调用 `POST /sdd/implement` 端点
- [X] T039 [US3] 在执行过程中显示实时进度——当前任务、已完成数/总数，通过 SSE 事件流展示

### TDD Verify — 确认 US3 测试通过

- [X] T040 [US3] 运行 `npx playwright test sdd-task-execution` 确认全部通过

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T041 [P] 在 `frontend/src/pages/SddFlow.tsx` 中处理 SDD 重跑场景——检测项目已有 spec 时弹窗提示选择"创建新 spec"或"更新已有 spec"（FR-013）
- [X] T042 [P] 在 `frontend/src/pages/SddFlow.tsx` 中添加错误处理——任何步骤失败时显示 Claude 返回的具体错误信息 + "重试"按钮（FR-012）
- [X] T043 [P] 后端 SddJob 内存追踪——在 `backend/src/services/sdd-service.ts` 中用 Map 存储进行中的 job 状态，支持 SSE 重连后通过 `/sdd/status` 查询（FR-014）
- [X] T044 运行全量 E2E 测试确认无回归：`npx playwright test`（含原有 37 个测试 + 新增 3 个 spec 文件）
- [X] T045 运行后端单元测试确认无回归：`cd backend && npx vitest run`

## Dependencies

```text
Phase 1 (Setup)
  ↓
Phase 2 (Foundational) — T004→T005→T006 (DB→E2E schema→mocks 顺序), T007→T008 (adapter→stream), T009 并行
  ↓
Phase 3 (US1)
  TDD Red:   T010→T011→T012→T013→T014→T015 (测试先行)
  TDD Green: T016→T017→T018→T019→T020→T021 (后端) → T022→T023 (前端)
  TDD Verify: T024
  ↓
Phase 4 (US2) — 依赖 Phase 3 的 SSE 和端点
  TDD Red:   T025→T026→T027
  TDD Green: T028→T029→T030
  TDD Verify: T031
  ↓
Phase 5 (US3) — 依赖 Phase 3 的 implement 端点
  TDD Red:   T032→T033→T034→T035→T036
  TDD Green: T037→T038→T039
  TDD Verify: T040
  ↓
Phase 6 (Polish) — T041, T042, T043 可与 Phase 4/5 并行
                   T044, T045 必须最后执行
```

## Parallel Execution Examples

```text
Phase 1: T001 || T002 || T003 (不同文件，无依赖)
Phase 2: T005 || T009 (E2E schema 与 project-service 无关)
Phase 6: T041 || T042 || T043 (不同关注点，可并行)
         T044 || T045 (不同测试套件，可并行)
```

## Implementation Strategy

**TDD 红绿循环**: 每个 User Story 严格遵循 Red（写测试）→ Green（实现）→ Verify（确认通过）三阶段。

**MVP 范围**: Phase 1 + Phase 2 + Phase 3 (US1) — 即后端 SpeckitAdapter 重写 + 前端 SddFlow 自动推进。完成后即可在 Web 界面上走完 SDD 流程。

**Playwright 测试文件**:

| 文件 | 对应 Story | 测试数 |
|------|-----------|--------|
| `frontend/e2e/sdd-auto-flow.spec.ts` | US1 步骤自动推进 | 6 |
| `frontend/e2e/sdd-editable-output.spec.ts` | US2 产出可编辑 | 3 |
| `frontend/e2e/sdd-task-execution.spec.ts` | US3 任务可执行 | 5 |
| `frontend/e2e/fixtures/api-mocks.ts` | 更新 mock 响应格式 | — |
| `frontend/e2e/global-setup.ts` | 更新 DB schema | — |

**Mock 策略**: E2E 测试中使用 `page.route()` mock SSE 端点，返回预设的流式事件序列（init → assistant → tool_use → result → [DONE]），验证前端对每个事件的正确处理。不 mock 非 SSE 端点（如 `/sdd/status`、`/sdd/content/save`），测试真实的前后端集成。
