<!--
  Sync Impact Report
  ==================
  Version change: 1.0.0 → 1.1.0
  Modified principles: None
  Added sections:
    - Principle VI: 功能提交纪律（TDD 验证通过后必须 Git 提交）
    - Principle VII: 中文文档规范（所有文档使用中文编写）
  Removed sections: None
  Templates requiring updates:
    - .specify/templates/plan-template.md: ✅ No changes needed
    - .specify/templates/spec-template.md: ✅ No changes needed
    - .specify/templates/tasks-template.md: ✅ No changes needed
  Follow-up TODOs: None
-->

# SpecScaffold Constitution

## Core Principles

### I. TDD 优先

任何业务代码 MUST 在对应的测试用例编写完成并通过审批之后才能开始开发。

测试用例 MUST 先于实现代码提交。遵循严格的 Red-Green-Refactor 循环：
测试编写 → 用户确认 → 测试失败（Red）→ 编写实现（Green）→ 重构优化（Refactor）。

跳过测试直接编写业务代码是被禁止的，除非该变更仅为文档或配置修改。

### II. 工具接口化

所有外部组件（Spec Kit、Open Spec、Claude Code、Codex 等）MUST 通过抽象接口调用，
禁止在业务代码中直接耦合第三方工具的具体实现。

每个外部工具 MUST 定义一个 Adapter 层，包含：
- 统一的能力描述（输入/输出契约）
- 工具特定的能力边界文档
- 可替换的工厂注册机制

替换一个工具组件 MUST 只需实现新的 Adapter，不涉及业务逻辑层的改动。

### III. 规格驱动

所有功能 MUST 从规格说明（Spec）开始，按以下链路推进：

用户描述 → Spec 文档 → Plan（实施计划）→ Tasks（任务拆分）→ 测试用例 → 业务实现

没有对应 Spec 的功能 MUST NOT 进入开发阶段。Spec MUST 包含：
- 用户场景与验收标准
- 功能需求（FR）编号
- 成功度量指标

### IV. Web 图形化优先

用户与系统的所有交互 MUST 通过 Web 界面完成。CLI 仅为开发者调试辅助手段，
不得作为面向最终用户的主要交互方式。

Web 界面 MUST 提供：
- 项目创建与配置的可视化流程
- SDD 流程的图形化引导（Spec → Plan → Tasks → Test → Code）
- AI 工具调用的状态可视化与结果展示
- 测试用例通过/失败的实时反馈

### V. 接入前充分认知

在接入任何外部组件之前，MUST 完成以下步骤：

1. 分析该组件的源码或获取足够详细的使用文档
2. 生成能力边界文档（记录组件能做什么、不能做什么、已知限制）
3. 评估与当前系统的集成风险和兼容性
4. 文档经过审批后方可开始集成开发

禁止在未充分了解工具能力边界的情况下进行集成。

### VI. 功能提交纪律

任何功能通过 TDD 验证（测试全部通过）之后，MUST 立即提交 Git 变更，
保存该功能的完整变动记录。

每个功能 MUST 产生独立的 Git Commit，Commit 信息 MUST 包含：
- 功能编号或任务编号
- 简要描述本次变更内容
- 关联的 Spec 或 Task 文档引用

禁止在未提交当前功能的情况下开始下一个功能的开发。

### VII. 中文文档规范

项目内所有文档 MUST 使用中文编写，包括但不限于：
- 规格说明（Spec）、实施计划（Plan）、任务列表（Tasks）
- 能力边界文档、架构设计文档
- Commit message 中的描述部分
- 用户界面文案与帮助文档

技术术语可保留英文原文（如 TDD、Adapter、Spec），但解释性内容 MUST 使用中文。

## 技术约束

- **技术栈**: 待定（需在第一个功能的 Plan 阶段确定）
- **外部依赖**: 每个外部依赖 MUST 有对应的 Adapter 抽象层
- **文档标准**: 所有外部组件的接入 MUST 附带能力边界文档，存放于项目文档目录
- **接口协议**: 工具间通信 MUST 使用定义良好的接口协议（REST/gRPC/CLI），不依赖内部实现细节

## 开发工作流

1. **需求阶段**: 编写 Feature Spec（规格说明）
2. **计划阶段**: 基于 Spec 生成 Plan（实施计划），通过 Constitution Check
3. **任务阶段**: 从 Plan 拆分为 Tasks，每个 Task 关联明确的验收标准
4. **测试阶段**: 为每个 Task 编写测试用例，确认测试可运行且失败（Red）
5. **开发阶段**: 编写实现代码使测试通过（Green），重构优化（Refactor）
6. **集成阶段**: 集成测试验证，确保不破坏已有功能
7. **交付阶段**: 代码审查、文档更新、发布

每个阶段 MUST 在前一阶段完成后才能开始。

## Governance

本宪法是 SpecScaffold 项目的最高开发准则，所有开发决策 MUST 遵守上述原则。

**修订流程**:
- 任何原则的修改 MUST 附带变更说明和影响分析
- 原则的新增或移除 MUST 经过项目负责人审批
- 每次修订 MUST 更新版本号（遵循语义化版本规则）
- 修订记录 MUST 保留在 Sync Impact Report 中

**合规检查**:
- 每个 Feature 的 Plan 阶段 MUST 包含 Constitution Check
- 违反宪法原则的实现代码 MUST NOT 合入主分支
- 复杂度超标的情况 MUST 在 Complexity Tracking 中记录并说明理由

**运行时指导**: 使用 CLAUDE.md 作为 AI 开发助手的运行时指导文件。

**Version**: 1.1.0 | **Ratified**: 2026-04-30 | **Last Amended**: 2026-04-30
