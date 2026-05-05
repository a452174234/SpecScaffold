# Feature Specification: SDD 流程接入 Spec Kit 技能

**Feature Branch**: `003-real-sdd-2048-test`
**Created**: 2026-05-04
**Status**: Draft
**Input**: User description: "使用真实的 claude code 和 spec kit重新从界面上测试该工程的能力（编写一个2048小游戏） 且现在在D:\claude\test\problem 这个文件夹中给你列出了 当前的问题 希望在这个迭代中解决它"

---

## 核心问题分析

### 当前架构的致命缺口

```
前端 SddFlow.tsx
    ↓ POST /api/projects/:id/sdd/specify
后端 SddService.specify()
    ↓
SpeckitAdapter.specify()   ← 只是读磁盘上的文件，不生成任何内容
    ↓                       ← 如果 spec.md 不存在，返回空路径
返回给前端 "成功" 但无实际内容
```

**SpeckitAdapter 是一个存根（stub）**：它只做文件系统查找（`findFeatureDirectory` + 检查文件是否存在），从不调用 Claude 生成内容。真实的 Spec Kit 能力（specify/clarify/plan/tasks/implement）全部实现为 Claude Code 的 CLI 技能（`.claude/skills/speckit-*`），只在命令行环境中可用，Web 后端完全无法触达。

**ClaudeCodeAdapter 是可用的**：它通过 `@anthropic-ai/claude-code` SDK 真正调用 Claude，支持同步执行和流式输出，目前只被 `AiService` 用于 TDD 流程。

### 解决方案核心思路

**直接通过 Claude Code SDK 调用 Spec Kit 技能**，而非重写 prompt。SDK 的 `query()` 函数设置 `cwd` 后会自动加载 `.claude/skills/` 下的技能，`allowedTools` 包含 `"Skill"` 后 Claude 可自主调用技能。同时在 prompt 中以 `/speckit-specify` 形式发送，等价于命令行中的 `claude -p "/speckit-specify 2048小游戏"`。

```
前端 → 后端 API → SddService → ClaudeCodeAdapter.execute('/speckit-specify 2048小游戏', { cwd, allowedTools: ['Skill', ...] })
                                                     ↓
                                              SDK query() 加载 .claude/skills/ 下的 speckit-specify 技能
                                                     ↓
                                              Claude 按技能定义执行（创建目录、写 spec.md、生成 checklist...）
                                                     ↓
                                              产出文件落盘 + 返回结果给前端
```

---

## 后端技术方案

### 方案：重写 SpeckitAdapter，通过 SDK 直接调用 Spec Kit 技能

将 `SpeckitAdapter` 从"文件系统读取器"改造为"SDK 技能调用器"。每个方法通过 `ClaudeCodeAdapter` 调用对应的 Spec Kit 技能（`/speckit-specify`、`/speckit-clarify`、`/speckit-plan`、`/speckit-tasks`、`/speckit-implement`），技能内部的全部逻辑（模板加载、文件创建、质量检查、checklist 生成等）由 Claude Code 执行，无需在后端重新实现。

#### 1. SDK 技能调用机制（官方文档确认）

根据 Claude Agent SDK 官方文档：

> Skills are loaded from filesystem locations governed by `settingSources`. When `cwd` is set to the project directory, skills from `.claude/skills/*/SKILL.md` are automatically discovered.
> Include `"Skill"` in `allowedTools` to enable Skills. Once configured, Claude automatically discovers Skills and invokes them when relevant.

> Slash commands can be sent through the SDK by including them in your prompt string, just like regular text.

因此后端只需：
```typescript
const result = await this.claude.execute('/speckit-specify 2048小游戏', {
  cwd: projectPath,  // SDK 自动加载 .claude/skills/
  maxTurns: 30,
  allowedTools: ['Skill', 'SlashCommand', 'Write', 'Read', 'Glob', 'Grep', 'Bash', 'Edit'],
});
```

#### 2. 新的 SpeckitAdapter 架构

```typescript
// backend/src/adapters/speckit/adapter.ts

import { ClaudeCodeAdapter } from '../claude-code/adapter';
import type { SpecifyResult, ClarifyResult, PlanResult, TasksResult, ImplementResult } from './types';
import fs from 'fs';
import path from 'path';

// Spec Kit 技能名称映射
const SKILLS = {
  specify:   '/speckit-specify',
  clarify:   '/speckit-clarify',
  plan:      '/speckit-plan',
  tasks:     '/speckit-tasks',
  implement: '/speckit-implement',
} as const;

// SDK 调用所需的最小工具集
const SDD_TOOLS = ['Skill', 'SlashCommand', 'Write', 'Read', 'Glob', 'Grep', 'Bash', 'Edit'];

export class SpeckitAdapter implements ISpeckitAdapter {
  private claude: ClaudeCodeAdapter;

  constructor() {
    this.claude = new ClaudeCodeAdapter();
  }

  async specify(projectPath: string, description: string): Promise<SpecifyResult> {
    const result = await this.claude.execute(
      `${SKILLS.specify} ${description}`,
      { cwd: projectPath, maxTurns: 30, allowedTools: SDD_TOOLS },
    );

    const featureDir = this.findLatestFeatureDir(projectPath);
    const specFilePath = featureDir ? path.join(featureDir, 'spec.md') : '';

    return {
      specFilePath,
      featureDirectory: featureDir || '',
      checklistPath: featureDir ? path.join(featureDir, 'checklists') : '',
      content: specFilePath && fs.existsSync(specFilePath) ? fs.readFileSync(specFilePath, 'utf-8') : '',
      tokenUsage: result.tokenUsage,
      sessionId: result.sessionId,
      exitReason: result.exitReason,
    };
  }

  async clarify(projectPath: string, clarification: string): Promise<ClarifyResult> {
    // 非交互模式：自动补充，不提问
    const result = await this.claude.execute(
      `${SKILLS.clarify} 请自动审查并补充规格文档中不完整或模糊的部分，直接修改文件，不需要提问交互`,
      { cwd: projectPath, maxTurns: 20, allowedTools: SDD_TOOLS },
    );

    const featureDir = this.findLatestFeatureDir(projectPath);
    const specFilePath = featureDir ? path.join(featureDir, 'spec.md') : '';

    return {
      specFilePath,
      content: specFilePath && fs.existsSync(specFilePath) ? fs.readFileSync(specFilePath, 'utf-8') : '',
      tokenUsage: result.tokenUsage,
      sessionId: result.sessionId,
    };
  }

  async plan(projectPath: string, guidance?: string): Promise<PlanResult> {
    const prompt = guidance ? `${SKILLS.plan} ${guidance}` : SKILLS.plan;
    const result = await this.claude.execute(prompt, {
      cwd: projectPath, maxTurns: 30, allowedTools: SDD_TOOLS,
    });

    const featureDir = this.findLatestFeatureDir(projectPath);
    const planFilePath = featureDir ? path.join(featureDir, 'plan.md') : '';

    return {
      planFilePath,
      researchFilePath: featureDir ? path.join(featureDir, 'research.md') : '',
      dataModelFilePath: featureDir ? path.join(featureDir, 'data-model.md') : '',
      contractsDirectory: featureDir ? path.join(featureDir, 'contracts') : '',
      quickstartFilePath: featureDir ? path.join(featureDir, 'quickstart.md') : '',
      content: planFilePath && fs.existsSync(planFilePath) ? fs.readFileSync(planFilePath, 'utf-8') : '',
      tokenUsage: result.tokenUsage,
      sessionId: result.sessionId,
    };
  }

  async tasks(projectPath: string, constraints?: string): Promise<TasksResult> {
    const prompt = constraints ? `${SKILLS.tasks} ${constraints}` : SKILLS.tasks;
    const result = await this.claude.execute(prompt, {
      cwd: projectPath, maxTurns: 30, allowedTools: SDD_TOOLS,
    });

    const featureDir = this.findLatestFeatureDir(projectPath);
    const tasksFilePath = featureDir ? path.join(featureDir, 'tasks.md') : '';

    let taskCount = 0;
    let content = '';
    if (tasksFilePath && fs.existsSync(tasksFilePath)) {
      content = fs.readFileSync(tasksFilePath, 'utf-8');
      const matches = content.match(/^- \[[ x]\]/gm);
      taskCount = matches ? matches.length : 0;
    }

    return {
      tasksFilePath, taskCount, content,
      tokenUsage: result.tokenUsage,
      sessionId: result.sessionId,
    };
  }

  async implement(projectPath: string, guidance?: string): Promise<ImplementResult> {
    const prompt = guidance ? `${SKILLS.implement} ${guidance}` : SKILLS.implement;
    const result = await this.claude.execute(prompt, {
      cwd: projectPath, maxTurns: 50, allowedTools: [...SDD_TOOLS, 'Agent'],
    });

    return {
      completedTasks: 0,
      failedTasks: 0,
      changedFiles: [],
      tokenUsage: result.tokenUsage,
      sessionId: result.sessionId,
    };
  }

  // 流式版本 — 用于 SSE 端点
  async specifyStream(
    projectPath: string, description: string,
    onMessage: (msg: any) => void,
  ): Promise<SpecifyResult> {
    const result = await this.claude.executeStream(
      `${SKILLS.specify} ${description}`,
      { cwd: projectPath, maxTurns: 30, allowedTools: SDD_TOOLS },
      (msg) => onMessage(msg),
    );

    const featureDir = this.findLatestFeatureDir(projectPath);
    const specFilePath = featureDir ? path.join(featureDir, 'spec.md') : '';

    return {
      specFilePath,
      featureDirectory: featureDir || '',
      checklistPath: featureDir ? path.join(featureDir, 'checklists') : '',
      content: specFilePath && fs.existsSync(specFilePath) ? fs.readFileSync(specFilePath, 'utf-8') : '',
      tokenUsage: result.tokenUsage,
      sessionId: result.sessionId,
      exitReason: result.exitReason,
    };
  }

  // 同理：clarifyStream, planStream, tasksStream, implementStream ...

  private findLatestFeatureDir(projectPath: string): string | null {
    const specsDir = path.join(projectPath, 'specs');
    if (!fs.existsSync(specsDir)) return null;

    const entries = fs.readdirSync(specsDir, { withFileTypes: true })
      .filter(e => e.isDirectory() && fs.existsSync(path.join(specsDir, e.name, 'spec.md')))
      .sort((a, b) => b.name.localeCompare(a.name));

    return entries.length > 0 ? path.join(specsDir, entries[0].name) : null;
  }
}
```

#### 3. 为什么直接调用技能优于重写 prompt

| 维度 | 重写 prompt（旧方案） | 直接调用技能（新方案） |
|------|----------------------|----------------------|
| 逻辑完整性 | 需要手动复制每个技能的所有逻辑分支 | 技能内部的完整逻辑自动执行 |
| 维护成本 | 技能更新时需同步修改 prompt | 技能更新后自动生效，零维护 |
| 质量保证 | 无 checklist 生成、无质量校验 | 技能自动生成 checklist、执行质量校验 |
| 文件产出 | 需要手动指定输出路径 | 技能按自身规范创建目录和文件 |
| 扩展性 | 新增技能需写新 prompt | 只需一行 `execute('/speckit-xxx')` |
| 前序依赖 | 不处理 `.specify/` 目录、hooks 等 | 技能自动检查 prerequisites、运行 hooks |

#### 4. 流式输出支持

前端需要实时看到 Claude 的执行过程。后端新增 SSE 端点，使用 `executeStream` 替代 `execute`：

```typescript
// backend/src/api/routes/sdd.ts — 新增流式端点

sddRoutes.post('/specify/stream', async (c) => {
  const projectId = c.req.param('id')!;
  const { description } = await c.req.json();
  const project = getProject(projectId);

  return c.stream(async (stream) => {
    const adapter = new SpeckitAdapter();

    await adapter.specifyStream(
      project.path, description,
      (message) => {
        stream.write(`data: ${JSON.stringify({
          type: message.type,
          content: message.content,
          timestamp: message.timestamp,
        })}\n\n`);
      },
    );
    stream.write('data: [DONE]\n\n');
  });
});

// 同理：/clarify/stream, /plan/stream, /tasks/stream, /implement/stream
```

#### 5. 非交互式 clarify 适配

`/speckit-clarify` 技能默认是交互式的（逐个提问，等待用户回答）。Web 后端无法做交互式 Q&A，因此需要适配为非交互模式：

**方案**：在调用 clarify 时追加指令 `"请自动审查并补充规格文档中不完整或模糊的部分，直接修改文件，不需要提问交互"`，让 Claude 自动做出合理推断而非提问。

用户对 clarify 结果的审阅和修改在前端编辑器中完成——这实际上是把"交互式提问"替换成了"先自动补充、后人工审阅"的模式。

#### 6. 数据模型变更

当前数据库已有 `specs`、`plans`、`tasks` 表，需增加内容存储和 session 追踪：

```sql
-- specs 表增加
ALTER TABLE specs ADD COLUMN content TEXT;          -- spec.md 的完整内容
ALTER TABLE specs ADD COLUMN session_id TEXT;       -- Claude Code session ID（支持 continueSession）
ALTER TABLE specs ADD COLUMN token_usage TEXT;      -- JSON: {input, output}

-- plans 表增加
ALTER TABLE plans ADD COLUMN content TEXT;          -- plan.md 的完整内容
ALTER TABLE plans ADD COLUMN session_id TEXT;
ALTER TABLE plans ADD COLUMN token_usage TEXT;

-- tasks 表增加
ALTER TABLE tasks ADD COLUMN order_index INTEGER;   -- 执行顺序
ALTER TABLE tasks ADD COLUMN content TEXT;           -- 任务详细内容（从 tasks.md 解析）
```

#### 7. 文件组织变化

```
backend/src/
├── adapters/
│   ├── claude-code/
│   │   ├── adapter.ts        (不变 — 已有完整的 SDK 集成，支持 execute 和 executeStream)
│   │   └── types.ts          (不变)
│   └── speckit/
│       ├── adapter.ts        (重写 — 从文件读取器 → SDK 技能调用器)
│       └── types.ts          (扩展 — 增加流式输出、content、sessionId 字段)
├── services/
│   ├── sdd-service.ts        (修改 — 使用新的 adapter，支持流式输出、内容持久化)
│   └── ai-service.ts         (不变)
└── api/routes/
    ├── sdd.ts                (修改 — 新增流式 SSE 端点、内容保存端点)
    └── ai.ts                 (不变)
```

### 前端变更

```
frontend/src/
├── pages/
│   ├── SddFlow.tsx           (重写 — 步骤自动推进、内容编辑、流式显示)
│   └── AiWorkspace.tsx       (修改 — 复用任务执行能力)
└── services/
    └── api.ts                (扩展 — SSE 流式请求支持)
```

**SddFlow.tsx 新交互流程**：

```
步骤1: 用户输入描述 → 点击"开始生成"
  → 前端调用 POST /sdd/specify/stream (SSE)
  → 实时显示 Claude 执行过程（加载技能、创建目录、生成 spec...）
  → 完成后展示完整 spec.md 内容在编辑器中
  → 用户可编辑 → 点击"确认，进入下一步"
  → 前端将编辑后的内容保存（POST /sdd/content/save）
  → 自动触发 POST /sdd/clarify/stream，进入步骤2

步骤2: Claude 自动审查 spec 并补充（非交互式）
  → 实时显示审查过程
  → 完成后展示补充内容（高亮变更）
  → 用户确认 → 自动进入步骤3

步骤3: Claude 生成实施计划
  → 实时显示计划生成过程
  → 完成后展示计划列表（结构化，可编辑）
  → 用户确认 → 自动进入步骤4

步骤4: Claude 生成任务列表
  → 实时显示任务生成过程
  → 完成后展示可编辑的任务列表
  → 用户确认 → 可点击"开始执行"
  → 调用 /speckit-implement 技能执行任务，实时显示进度
```

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - SDD 步骤自动推进 (Priority: P1)

用户在 SDD 页面输入功能描述后，系统依次调用 Spec Kit 技能（specify → clarify → plan → tasks），每步完成后自动推进到下一步。用户只需在每步审阅结果，补充修正有问题的点，确认后系统自动触发下一步。

**Why this priority**: 当前 SDD 流程后端 `SpeckitAdapter` 是存根，不生成任何内容。这是整个平台的根本能力缺口。

**Independent Test**: 在 SDD 页面输入任意功能描述，观察系统是否自动走完 4 个步骤，每步产生真实内容并在前端可编辑。

**Acceptance Scenarios**:

1. **Given** 用户输入描述并点击"开始生成", **When** Claude 完成指定步骤, **Then** 前端显示完整 spec.md 内容，提供编辑器供修改，底部有"确认，进入下一步"按钮
2. **Given** 用户确认指定结果, **When** 系统自动调用 clarify API, **Then** 前端实时显示 Claude 审查过程，完成后展示补充内容
3. **Given** 澄清完成, **When** 用户确认, **Then** 系统自动调用 plan API，实时显示计划生成过程
4. **Given** 计划确认, **When** 系统调用 tasks API, **Then** 前端展示可编辑的任务列表

---

### User Story 2 - 每步产出可审阅可编辑 (Priority: P1)

每个 SDD 步骤的产出（spec.md、plan.md、tasks.md）在前端以 Markdown 编辑器展示，用户可以直接修改内容，修改后的内容写回磁盘并作为下一步的输入。

**Why this priority**: 这是截图问题"下一步我只需要补充有问题的点"的直接响应。

**Independent Test**: 在 specify 步骤完成后，直接在编辑器中修改 spec 内容，确认后观察 clarify 步骤是否使用了修改后的内容。

**Acceptance Scenarios**:

1. **Given** 某步骤完成, **When** 前端展示产出内容, **Then** 以 Markdown 编辑器形式展示，支持直接编辑
2. **Given** 用户修改了内容, **When** 点击确认, **Then** 修改后的内容保存到后端并写入磁盘文件
3. **Given** 用户修改了前序步骤, **When** 后续步骤已执行, **Then** 系统提示"已修改上游内容，建议重新执行后续步骤"

---

### User Story 3 - 可调整的任务列表与一键执行 (Priority: P2)

任务生成后展示为可编辑的列表，用户可以调整任务顺序、修改描述、删除不需要的任务。确认后点击"执行"按钮，系统调用 `/speckit-implement` 技能执行任务。

**Why this priority**: 截图问题"任务应该是给出可调整的任务列表并在我确认后可以直接执行的任务"。

**Independent Test**: 生成任务后，修改某个任务的描述，删除一个任务，点击"开始执行"，观察系统是否按修改后的列表执行。

**Acceptance Scenarios**:

1. **Given** 任务列表已生成, **When** 用户查看, **Then** 每个任务显示为卡片，包含复选框、描述、文件路径
2. **Given** 用户想调整, **When** 编辑任务描述或删除任务, **Then** 列表实时更新
3. **Given** 用户确认, **When** 点击"开始执行", **Then** 系统通过 `/speckit-implement` 技能执行任务，实时显示进度

---

### Edge Cases

- Claude Code 适配器调用失败时，前端显示具体错误（如"Claude API 调用超时"），提供"重试"按钮
- Claude 生成的内容不完整时，前端检测并提示"生成内容可能不完整，建议补充"
- 流式连接中断时，后端继续在后台完成 Claude 调用，前端重连后可获取结果；如后台也失败则提供"重新生成"选项
- 并发操作同一项目的 SDD 流程时，后端检测并返回 409 Conflict
- 用户在已有 spec 的项目上重新启动 SDD 时，前端弹窗提示选择"创建新 spec"或"更新已有 spec"

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `SpeckitAdapter` 必须通过 `ClaudeCodeAdapter` 直接调用 Spec Kit 技能（`/speckit-specify` 等），而非仅读取磁盘文件
- **FR-002**: 项目导入 SpecScaffold 时必须将 `.claude/skills/` 同步到用户项目目录；SDK 调用时设置 `cwd` 为项目路径、`allowedTools` 包含 `"Skill"`，确保技能正确加载和执行
- **FR-003**: 生成的 spec.md / plan.md / tasks.md 必须保存到项目的 `specs/` 目录
- **FR-004**: 每个 SDD 步骤完成后必须将内容返回给前端展示，支持 SSE 流式输出
- **FR-005**: 前端每个步骤必须以 Markdown 编辑器展示产出，支持用户直接编辑
- **FR-006**: 用户编辑后的内容必须保存回磁盘文件，作为下一步骤的输入
- **FR-007**: 每个步骤确认后系统自动推进到下一步骤，无需用户手动点击"下一步"
- **FR-008**: 计划步骤必须生成结构化的内容（阶段划分、文件路径、技术选型），而非自由文本
- **FR-009**: 任务列表必须遵循 Spec Kit 格式（`- [ ] [T001] 描述（文件路径）`），支持编辑
- **FR-010**: 任务确认后点击"执行"，系统调用 `/speckit-implement` 技能执行任务
- **FR-011**: 任务执行过程中必须实时显示进度（当前任务、完成数/总数）
- **FR-012**: 任何步骤失败时显示具体错误信息 + 重试按钮
- **FR-013**: 用户在已有 spec 的项目上重新启动 SDD 时，前端必须提示选择"创建新 spec"或"更新已有 spec"
- **FR-014**: SSE 连接断开时后端继续完成 Claude 调用，前端可通过新的 SSE 连接重连获取已完成的结果

### Key Entities

- **SDD 会话**: 一次完整的 SDD 流程实例，关联到项目，追踪 4 步状态和 Claude session
- **Spec 内容**: specify 步骤的产出，Markdown 格式的规格文档
- **Plan 内容**: plan 步骤的产出，结构化的技术实施计划
- **Task 列表**: tasks 步骤的产出，可编辑的任务清单（有序、可并行标记）
- **执行结果**: 每个任务执行后的产出（文件变更列表、成功/失败状态）

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 用户输入描述后，Claude 能在 2 分钟内生成完整 spec（含用户故事、功能需求、成功标准）
- **SC-002**: 每步产出在前端以可编辑形式展示，用户修改后可保存并作为下一步输入
- **SC-003**: 4 步 SDD 流程可自动走完（指定→澄清→计划→任务），每步无需手动触发
- **SC-004**: 任何步骤失败时，错误信息包含 Claude 返回的具体原因

## 验证方法：2048 游戏端到端测试

使用"2048 小游戏"作为测试用例，验证上述所有功能是否完整可用。这不是一个独立的用户故事，而是平台能力的集成测试：

1. 新建项目，在 SDD 页面输入"2048 小游戏"
2. 走完 4 步 SDD 流程，验证每步产出的 spec / plan / tasks 内容合理
3. 点击"执行"，验证 `/speckit-implement` 技能能实际生成代码
4. 验证产出的 2048 游戏可以在浏览器中正常运行（方向键控制、数字合并、得分计算）

## Clarifications

### Session 2026-05-04

- Q: Spec Kit 技能发现路径——当 SDK `cwd` 指向用户项目时如何发现安装在 SpecScaffold 平台中的技能？ → A: 技能安装在 SpecScaffold 工程中，项目导入到 SpecScaffold 时同步技能到对应项目目录，使 SDK `cwd` 指向用户项目时能发现技能
- Q: SDD 重跑行为——用户在已有 spec 的项目上重新运行 SDD 时如何处理？ → A: 先提示用户选择：创建新 spec 还是更新已有的
- Q: SSE 中断恢复——流式连接在 Claude 生成过程中断开时如何处理？ → A: 后端继续在后台完成 Claude 调用，前端可通过新 SSE 连接重连获取结果

## Assumptions

- Claude Code SDK（`@anthropic-ai/claude-code`）已安装且 API key 已配置
- SDK 的 `query()` 函数设置 `cwd` 后会自动加载 `.claude/skills/` 下的技能
- Spec Kit 技能维护在 SpecScaffold 平台的 `.claude/skills/` 目录中
- 项目导入/创建到 SpecScaffold 时，后端自动将 `.claude/skills/` 同步（symlink 或复制）到用户项目目录下
- `allowedTools` 包含 `"Skill"` 时 Claude 可自主调用技能
- `allowedTools` 包含 `"SlashCommand"` 时可在 prompt 中以 `/command` 形式调用
- `/speckit-clarify` 技能在 Web 后端中以非交互模式运行（自动补充，不提问）
- SSE 流式输出使用 Hono 内置的 stream helper
- 前端 Markdown 编辑器使用 `@uiw/react-md-editor` 或类似库
