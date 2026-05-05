# Feature Specification: SDD 历史追踪与产物查看

**Feature Branch**: `004-sdd-history-tracking`
**Created**: 2026-05-05
**Status**: Draft
**Input**: User description: "包含完整的历史需求追踪能力 包含SDD 规格驱动开发流程中每个步骤的历史执行日志文件 和生成产物能在portal上实时查看 当前Portal上的MD编辑器的 源代码区展示有问题 不是人能理解的格式你自己截图排查下一并修复"

## User Scenarios & Testing *(mandatory)*

### User Story 1 — 查看 SDD 步骤执行历史 (Priority: P1)

用户在项目详情页或 SDD 流程页面，可以查看该项目下所有已执行的 SDD 步骤的历史记录。每条记录包含执行时间、步骤类型（Specify/Clarify/Plan/Tasks/Implement）、执行状态（成功/失败/超时）、Token 消耗和耗时。用户点击任意历史记录，可以查看该次执行的详细日志（SSE 事件流归档）和生成产物（Spec/Plan/Tasks 文件内容）。

**Why this priority**: 历史追踪是需求可追溯性的核心，用户需要知道"每次执行了什么、产生了什么结果"。没有历史记录，用户无法回顾或审计 SDD 流程。

**Independent Test**: 创建一个项目，执行完整的 SDD 流程（至少 Specify + Plan），然后进入历史记录页面，验证能看到所有步骤的执行记录，点击任意记录能看到日志和产物。

**Acceptance Scenarios**:

1. **Given** 一个已执行过 SDD 流程的项目, **When** 用户打开该项目的 SDD 历史页面, **Then** 显示按时间排列的所有步骤执行记录，每条包含步骤名称、执行时间、状态、Token 用量
2. **Given** 历史记录列表中有一条 Specify 步骤记录, **When** 用户点击该记录, **Then** 显示该次执行的完整日志文本和生成的 Spec 文件内容
3. **Given** 一个从未执行过 SDD 的项目, **When** 用户打开 SDD 历史页面, **Then** 显示空状态提示"暂无执行记录"
4. **Given** 多次执行了同一类型的步骤（如多次 Specify）, **When** 用户查看历史列表, **Then** 所有执行记录按时间倒序排列，最新记录在最前，用户可区分每次执行

---

### User Story 2 — 查看步骤生成产物 (Priority: P2)

用户在查看某次 SDD 步骤的历史记录时，可以查看该步骤产生的所有文件产物（如 spec.md、plan.md、tasks.md）。产物以渲染后的 Markdown 格式展示，用户能清晰阅读规格文档、实施计划和任务列表的内容。用户可以在渲染视图和源代码视图之间切换。

**Why this priority**: 产物查看是历史追踪的价值落地——用户不仅需要知道执行了什么，还需要看到具体产生了什么内容。可读的渲染格式是基本可用性的前提。

**Independent Test**: 执行一次 Specify 步骤后，在历史记录中点击该步骤，验证能以渲染后的 Markdown 格式查看生成的 spec.md 内容。

**Acceptance Scenarios**:

1. **Given** 一条 Specify 步骤历史记录（已生成 spec.md）, **When** 用户点击查看产物, **Then** 以渲染后的 Markdown 格式展示 spec.md 的内容，标题、列表、表格等格式正确显示
2. **Given** 一条 Plan 步骤历史记录（生成了 plan.md + research.md + data-model.md）, **When** 用户查看产物, **Then** 列出所有生成的文件，用户可选择查看任一文件
3. **Given** 用户正在查看某个产物的渲染视图, **When** 用户切换到源代码视图, **Then** 显示原始 Markdown 文本，格式清晰可读
4. **Given** 一条执行失败的步骤记录, **When** 用户查看产物, **Then** 产物区域显示"该步骤未生成产物"提示

---

### User Story 3 — 实时查看执行日志 (Priority: P3)

用户在 SDD 流程页面执行某个步骤时，下方的日志区域实时显示 SSE 事件流内容。日志内容格式化显示：AI 思考文本、工具调用名称和参数、工具执行结果。用户可以在执行过程中滚动查看已输出的日志，执行完成后日志保留在页面上可随时回看。

**Why this priority**: 实时日志是开发过程中的辅助功能，让用户了解 AI 正在做什么。优先级低于历史记录和产物查看，但能显著提升用户体验。

**Independent Test**: 在 SDD 流程页面点击执行 Specify 步骤，验证日志区域实时显示 AI 输出，格式清晰可读。

**Acceptance Scenarios**:

1. **Given** 用户点击了 SDD 流程中的「开始生成」按钮, **When** AI 开始执行, **Then** 日志区域实时显示 AI 的思考文本和工具调用
2. **Given** 日志区域已有大量输出, **When** 用户向上滚动, **Then** 滚动位置保持不变，新内容到来时自动滚到底部（用户可手动取消自动滚动）
3. **Given** 步骤执行完成, **When** 用户切换到其他页面再返回, **Then** 日志区域仍然显示该步骤的完整日志

---

### Edge Cases

- 同一项目多次执行 SDD 流程时，历史记录如何区分不同"轮次"？
- 执行超时或中断时，日志和产物应保留已产生的部分
- 产物文件非常大（>100KB）时，是否需要分页或懒加载？
- 数据库中存储大量历史日志时的性能影响
- 导入项目的 specs/ 目录为空或文件格式不符合预期时，如何提示用户
- 已有产物但文件内容损坏或格式异常时，如何优雅降级

### User Story 4 — 导入项目复用已有 SDD 产物 (Priority: P1)

用户导入一个已有项目后，进入 SDD 流程页面，系统自动扫描项目目录下 `specs/` 目录中的 Spec Kit 产物文件。如果发现已有 spec.md、plan.md、tasks.md 等文件，系统自动加载内容并在界面上展示，同时自动定位到对应的流程进度。用户可以直接在已有产物基础上继续执行后续 SDD 步骤，无需从头开始。

**Why this priority**: 对于已有项目，用户最迫切的需求是看到并复用已有的规格开发成果。没有这个能力，每次导入项目都需要重新执行 SDD 流程，浪费已有工作。

**Independent Test**: 导入一个已有 specs/ 目录和 spec.md/plan.md 的项目，进入 SDD 页面，验证自动加载已有内容并正确定位流程进度。

**Acceptance Scenarios**:

1. **Given** 一个已导入的项目在 `specs/` 目录下有 `spec.md` 和 `plan.md`, **When** 用户进入 SDD 流程页面, **Then** 系统自动读取并展示这两个文件的内容，流程进度定位到"计划已完成"状态
2. **Given** 一个已导入的项目只有 `specs/spec.md`, **When** 用户进入 SDD 流程页面, **Then** 系统展示 spec.md 的内容，流程进度定位到"规格已完成"状态，用户可直接执行 Clarify 或 Plan 步骤
3. **Given** 一个已导入的项目没有 `specs/` 目录, **When** 用户进入 SDD 流程页面, **Then** 系统显示空白 SDD 流程，提示用户从 Specify 开始
4. **Given** 用户正在查看已加载的 spec.md 内容, **When** 用户点击编辑按钮, **Then** 进入编辑模式，用户可修改内容后保存并继续后续步骤

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系统必须记录 SDD 流程中每个步骤（Specify/Clarify/Plan/Tasks/Implement）的每次执行记录，包含步骤类型、开始时间、结束时间、执行状态（成功/失败/超时）、Token 消耗
- **FR-002**: 系统必须将每次执行过程中产生的 SSE 事件流持久化为日志文件，存储在项目目录的 `.sdd-logs/` 目录下
- **FR-003**: 用户必须能在 Portal 的 SDD 历史页面查看项目中所有步骤的执行记录列表，按时间倒序排列
- **FR-004**: 用户点击某条执行记录时，系统必须展示该次执行的完整日志内容
- **FR-005**: 系统必须在执行记录中关联该步骤产生的所有文件产物路径
- **FR-006**: 用户查看产物时，系统必须以渲染后的 Markdown 格式展示文件内容，而非原始 Markdown 源码
- **FR-007**: 用户必须能在产物的渲染视图和源代码视图之间切换
- **FR-008**: 系统必须在 SDD 流程执行页面实时显示 SSE 日志，包含 AI 文本、工具调用和执行结果
- **FR-009**: 日志内容必须格式化显示：工具调用显示工具名称，文本内容保持换行和缩进
- **FR-010**: 系统必须正确渲染 Markdown 编辑器中的内容，确保用户能阅读理解（修复当前源代码区显示问题）
- **FR-011**: 执行失败或中断的步骤必须同样保留已产生的日志和产物
- **FR-012**: 系统必须支持导入的工程项目，在进入 SDD 流程页面时自动扫描并读取项目中已有的 Spec Kit 文件（specs/ 目录下的 spec.md、plan.md、tasks.md 等），将已有内容加载到 Portal 界面
- **FR-013**: 导入的项目如果已有完整的 SDD 产物，系统必须自动识别当前进度（如已有 spec.md + plan.md 则定位到 Plan 已完成状态），用户可直接从当前进度继续后续步骤
- **FR-014**: 用户查看已有 SDD 产物时，必须以渲染后的 Markdown 格式展示，并提供编辑入口

### Key Entities

- **SDD 执行记录 (SddExecution)**: 代表一次 SDD 步骤的执行，属性包括步骤类型（specify/clarify/plan/tasks/implement）、开始时间、结束时间、状态、Token 用量、关联的项目 ID
- **执行日志 (ExecutionLog)**: 该次执行产生的完整 SSE 事件流归档，存储为文本文件
- **执行产物 (ExecutionArtifact)**: 该次执行产生的文件列表（如 spec.md、plan.md），包含文件路径和内容

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 用户可以在 3 次点击内查看任意一次 SDD 步骤的执行日志和产物
- **SC-002**: Markdown 产物内容渲染后格式正确，标题、列表、表格、代码块均可正常显示
- **SC-003**: 实时日志输出延迟不超过 2 秒（从 SSE 事件到达前端到显示在页面上）
- **SC-004**: 历史记录页面加载时间不超过 3 秒（即使项目有 50+ 条执行记录）
- **SC-005**: 用户能在源代码视图和渲染视图之间一键切换，切换响应时间不超过 1 秒

## Assumptions

- SDD 历史记录存储在现有的 SQLite 数据库中，新增 `sdd_executions` 表
- 执行日志文件存储在项目目录的 `.sdd-logs/` 子目录下，以 JSONL 格式保存
- 产物文件即 Spec Kit 已生成的 spec.md/plan.md/tasks.md 等，无需额外复制
- Markdown 渲染使用现有的 `@uiw/react-md-editor` 组件，但需修复其源代码区显示问题
- 历史记录不区分 SDD 流程"轮次"，仅按单次步骤执行记录展示
- 日志文件大小不超过 10MB（单次步骤），超过时截断旧事件
