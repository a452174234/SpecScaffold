# 任务列表：Playwright E2E 全功能浏览器自动化验证

**输入**: 设计文档来自 `/specs/002-playwright-e2e-verification/`
**前置条件**: plan.md（必需）, spec.md（必需）, data-model.md, contracts/

**测试**: 本功能的全部任务即为 E2E 测试本身。US8 安全策略页面遵循 TDD（先写测试再实现页面）。

**组织方式**: 任务按阶段和用户故事分组，每个用户故事可独立实现和测试。

## 格式：`[ID] [P?] [Story] 描述`

- **[P]**: 可并行执行（不同文件，无依赖）
- **[Story]**: 关联的用户故事（US1, US2, US3 等）
- 描述包含具体文件路径

## 路径约定

Web 应用结构：`backend/src/`, `frontend/src/`, `frontend/e2e/`

---

## 阶段 1：项目初始化

**目标**: 安装 Playwright 依赖，创建配置文件和目录结构

- [x] T001 安装 @playwright/test 依赖到根目录 `package.json`，运行 `npx playwright install chromium`
- [x] T002 [P] 创建 Playwright 配置文件 `playwright.config.ts`，配置 webServer（concurrently 启动前后端）、baseURL（localhost:5173）、Chromium headless 模式、测试超时 60s、retries 2
- [x] T003 [P] 创建 E2E 测试目录结构 `frontend/e2e/` 和 `frontend/e2e/fixtures/`

---

## 阶段 2：基础设施（阻塞性前置条件）

**目标**: 所有用户故事依赖的测试基础设施，MUST 在任何故事开始前完成

**⚠️ 关键**: 此阶段完成前，任何用户故事工作都不能开始

- [x] T004 实现测试数据工厂 `frontend/e2e/fixtures/test-data.ts`，封装：通过后端 API 创建项目（`POST /api/projects`）、通过数据库直接插入任务和审计日志、获取测试数据库实例、每个测试结束自动清理
- [x] T005 [P] 实现 API Mock 定义 `frontend/e2e/fixtures/api-mocks.ts`，定义 SDD 四步操作（specify/clarify/plan/tasks）和 AI 三步操作（generate-tests/implement/run-tests）的固定 mock 响应，以及 Playwright `page.route()` 拦截器工厂函数
- [x] T006 创建 Playwright 全局 setup 文件，配置独立 E2E 测试数据库（环境变量 `TEST_DB_PATH`），在全局 setup 中初始化数据库表结构，在全局 teardown 中清理

**检查点**: 基础设施就绪——Playwright 可启动浏览器，测试数据工厂可用，API mock 可拦截

---

## 阶段 3：用户故事 1 — 首页项目列表与导航（优先级：P1）

**目标**: 验证首页加载、项目列表渲染、导航跳转功能
**独立测试**: 启动应用访问首页，验证页面元素可见性和按钮跳转

- [x] T007 [P] [US1] 编写首页 E2E 测试 `frontend/e2e/home.spec.ts`，覆盖：页面标题可见、空项目列表状态显示新建/导入入口、点击新建按钮跳转到 `/projects/new`、点击导入按钮跳转到 `/projects/import`、已有项目时显示项目卡片列表

**检查点**: US1 可独立验证——首页加载和导航功能通过浏览器自动化触达

---

## 阶段 4：用户故事 2 — 创建脚手架项目（优先级：P1）

**目标**: 验证项目创建的完整表单流程和成功跳转
**独立测试**: 填写表单创建项目，验证跳转到详情页

- [x] T008 [P] [US2] 编写项目创建 E2E 测试 `frontend/e2e/project-create.spec.ts`，覆盖：表单页加载、填写名称和路径后提交成功跳转到详情页、详情页显示项目基本信息和四个导航卡片（SDD/AI/任务/审计）、空字段提交显示校验错误、从首页导航到创建页面

**检查点**: US2 可独立验证——项目创建流程完整可操作

---

## 阶段 5：用户故事 3 — 导入现有项目（优先级：P1）

**目标**: 验证项目导入流程和扫描识别结果展示
**独立测试**: 输入路径导入项目，验证识别结果展示

- [x] T009 [P] [US3] 编写项目导入 E2E 测试 `frontend/e2e/project-import.spec.ts`，覆盖：导入页面加载、输入有效 TypeScript 项目路径后展示语言/框架标签、导入成功跳转详情页、输入不存在路径显示错误提示（使用测试前创建的临时目录作为模拟项目）

**检查点**: US3 可独立验证——项目导入和扫描识别功能可达

---

## 阶段 6：用户故事 4 — SDD 规格驱动开发流程（优先级：P1）

**目标**: 验证 SDD 四步引导界面的 UI 渲染和步骤切换
**独立测试**: 进入 SDD 页面，验证四步骤 UI 和步骤流转

- [x] T010 [US4] 编写 SDD 流程 E2E 测试 `frontend/e2e/sdd-flow.spec.ts`，使用 API mock 拦截 SDD 后端请求，覆盖：从详情页点击 SDD 卡片跳转、第一步功能描述输入和提交后进入第二步、第二步澄清输入和提交后进入第三步、第三步生成计划后进入第四步、第四步生成任务后显示完成提示、验证四步骤引导 UI 正确渲染

**检查点**: US4 可独立验证——SDD 四步引导流程通过浏览器可操作触达

---

## 阶段 7：用户故事 5 — AI 集成工作区操作（优先级：P1）

**目标**: 验证 AI 工作区的操作按钮触发和输出区域状态变化
**独立测试**: 进入 AI 工作区，输入任务 ID，触发操作验证 UI 反馈

- [x] T011 [US5] 编写 AI 工作区 E2E 测试 `frontend/e2e/ai-workspace.spec.ts`，使用 API mock 拦截 AI 后端请求，覆盖：从详情页点击 AI 工作区卡片跳转、页面显示任务 ID 输入框和三个操作按钮、输入任务 ID 点击"生成测试"后输出区域显示状态、点击"实现代码"后输出区域显示状态、点击"运行测试"后输出区域显示状态、未输入任务 ID 时点击按钮显示验证提示

**检查点**: US5 可独立验证——AI 工作区三个操作通过浏览器可触发

---

## 阶段 8：用户故事 6 — 任务面板状态流转（优先级：P2）

**目标**: 验证任务列表渲染、状态标签和流转操作
**独立测试**: 创建含任务的项目，打开任务面板，执行状态变更

- [x] T012 [US6] 编写任务面板 E2E 测试 `frontend/e2e/task-board.spec.ts`，前置数据通过数据库直接插入任务记录，覆盖：任务面板表格渲染（标题、状态标签、优先级）、pending 状态任务执行合法状态变更后标签颜色更新、非法状态跳转（pending → completed）被拒绝显示错误提示、空任务列表显示空状态

**检查点**: US6 可独立验证——任务面板和 TDD 状态流转通过浏览器可操作

---

## 阶段 9：用户故事 7 — 安全审计日志查看（优先级：P2）

**目标**: 验证审计日志表格渲染、风险级别标签颜色和分页
**独立测试**: 预置审计日志数据，打开页面验证展示

- [x] T013 [US7] 编写审计日志 E2E 测试 `frontend/e2e/audit-log.spec.ts`，前置数据通过数据库直接插入审计日志记录，覆盖：从详情页点击审计日志卡片跳转、日志表格正确渲染每条记录的工具名/操作/风险级别/审批结果、风险级别标签颜色区分（high=red/low=orange/read_only=green）、空日志列表显示空状态

**检查点**: US7 可独立验证——审计日志页面通过浏览器可查看

---

## 阶段 10：用户故事 8 — 安全策略查看与更新（优先级：P2）

**目标**: 补充安全策略前端页面并通过 E2E 测试验证
**独立测试**: 打开安全策略页面，查看配置、修改并保存

**说明**: 当前前端缺少安全策略管理页面。遵循 TDD 原则，先编写 E2E 测试（Red），再实现页面（Green）。

### 测试（Red 阶段）

- [x] T014 [US8] 编写安全策略 E2E 测试 `frontend/e2e/security-policy.spec.ts`，覆盖：从详情页点击安全策略卡片跳转到 `/projects/:id/security`、页面加载显示当前策略配置（高风险工具/只读工具/危险命令）、修改高风险工具列表并保存后显示成功提示、刷新后显示更新后的配置

### 实现（Green 阶段）

- [x] T015 [US8] 实现安全策略管理页面 `frontend/src/pages/SecurityPolicy.tsx`，使用 Ant Design 组件（Card、Form、Tag、Button、Input、message），加载策略 `GET /api/projects/:id/security/policy`，解析 policy_json 展示三组配置，支持编辑和保存 `PUT`
- [x] T016 [P] [US8] 在 `frontend/src/App.tsx` 新增路由 `/projects/:id/security` 指向 SecurityPolicy 组件，在 `frontend/src/pages/ProjectDetail.tsx` 导航卡片新增第五个入口（安全策略，图标 SafetyCertificateOutlined）
- [x] T017 [US8] 运行 T014 测试确认全部通过（Green），修复实现代码直到测试通过

**检查点**: US8 可独立验证——安全策略管理页面通过浏览器可操作，形成安全管理闭环

---

## 阶段 11：收尾与验证

**目标**: 全量回归测试，验证测试套件完整性

- [x] T018 更新根目录 `package.json` 的 `test:e2e` 脚本指向 `npx playwright test`，运行全部 E2E 测试确认 100% 通过
- [x] T019 运行 quickstart.md 中的命令验证文档准确性，确认全量测试在 5 分钟内完成

---

## 依赖与执行顺序

### 阶段依赖

- **阶段 1（初始化）**: 无依赖，可立即开始
- **阶段 2（基础设施）**: 依赖阶段 1 完成 — **阻塞所有用户故事**
- **阶段 3-9（US1-US7）**: 均依赖阶段 2，彼此之间无依赖，可并行执行
- **阶段 10（US8）**: 依赖阶段 2，T014（测试）在 T015/T016（实现）之前
- **阶段 11（收尾）**: 依赖所有用户故事完成

### 用户故事依赖

```
阶段 1 → 阶段 2 → ┬─ US1 (T007)
                    ├─ US2 (T008)  ┐
                    ├─ US3 (T009)  │ 可并行
                    ├─ US4 (T010)  │
                    ├─ US5 (T011)  │
                    ├─ US6 (T012)  │
                    ├─ US7 (T013)  ┘
                    └─ US8 (T014→T015→T016→T017)
                              → 阶段 11
```

### 并行执行示例

```bash
# 阶段 1 完成后，阶段 2 的 T004/T005/T006 可并行
# 阶段 2 完成后，US1-US7 的 7 个测试文件可并行编写
Task: "T007 [US1] home.spec.ts"
Task: "T008 [US2] project-create.spec.ts"
Task: "T009 [US3] project-import.spec.ts"
Task: "T010 [US4] sdd-flow.spec.ts"
Task: "T011 [US5] ai-workspace.spec.ts"
Task: "T012 [US6] task-board.spec.ts"
Task: "T013 [US7] audit-log.spec.ts"
```

---

## 实施策略

### MVP 优先（仅 US1-US2）

1. 完成阶段 1：初始化
2. 完成阶段 2：基础设施（阻塞项）
3. 完成阶段 3：US1 首页
4. 完成阶段 4：US2 项目创建
5. **停止并验证**: 首页和项目创建可独立运行

### 增量交付

1. 初始化 + 基础设施 → 就绪
2. US1 + US2 → 首页和项目管理可验证
3. US3 + US4 + US5 → 导入、SDD、AI 工作区可验证
4. US6 + US7 → 任务面板和审计日志可验证
5. US8 → 安全策略页面补充并验证
6. 全量回归 → 所有功能可操作触达

---

## 备注

- [P] 标记 = 不同文件，无依赖，可并行
- [Story] 标记 = 映射到 spec.md 中的用户故事
- 每个用户故事独立可完成和测试
- SDD（US4）和 AI（US5）的 E2E 测试通过 API mock 避免外部依赖
- US8 遵循 TDD：先写测试（Red）→ 再实现页面（Green）
- 每个任务完成后提交 Git 变更（宪法原则 VI）
