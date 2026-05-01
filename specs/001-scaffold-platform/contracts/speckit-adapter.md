# 接口契约：Spec Kit 适配器

**日期**: 2026-04-30

## 概述

Spec Kit 适配器封装了 SDD（规格驱动开发）流程的各个阶段，通过 Claude Code CLI 间接调用 Spec Kit Skills。

## 接口定义

### ISpeckitAdapter

```typescript
interface ISpeckitAdapter {
  // 创建功能规格
  specify(projectPath: string, description: string): Promise<SpecifyResult>;

  // 澄清规格中的歧义
  clarify(projectPath: string, clarification: string): Promise<ClarifyResult>;

  // 生成实施计划
  plan(projectPath: string, guidance?: string): Promise<PlanResult>;

  // 生成任务列表
  tasks(projectPath: string, constraints?: string): Promise<TasksResult>;

  // 执行实现
  implement(projectPath: string, guidance?: string): Promise<ImplementResult>;

  // 能力查询
  getCapabilities(): AdapterCapabilities;
}
```

### 核心返回类型

```typescript
interface SpecifyResult {
  specFilePath: string;           // spec.md 文件路径
  featureDirectory: string;       // specs/###-feature-name/
  checklistPath: string;          // 检查清单路径
}

interface ClarifyResult {
  specFilePath: string;           // 更新后的 spec.md
  questionsAnswered: number;
}

interface PlanResult {
  planFilePath: string;           // plan.md
  researchFilePath: string;       // research.md
  dataModelFilePath: string;      // data-model.md
  contractsDirectory: string;     // contracts/
  quickstartFilePath: string;     // quickstart.md
}

interface TasksResult {
  tasksFilePath: string;          // tasks.md
  taskCount: number;
}

interface ImplementResult {
  completedTasks: number;
  failedTasks: number;
  changedFiles: string[];
}
```

## 调用链

```text
ISpeckitAdapter 方法
    ↓
构造 Claude Code 调用命令
（通过 appendSystemPrompt 注入 Skill 指令）
    ↓
Claude Code SDK execute()
    ↓
Claude Code CLI → Skills 自动发现 → 执行 Skill
    ↓
文件输出到 specs/ 目录
    ↓
读取生成文件 → 解析 → 返回结果
```

## 能力边界

| 能力 | 支持情况 |
|------|----------|
| 从自然语言生成 Spec | ✅ |
| 澄清规格歧义 | ✅ |
| 生成实施计划 | ✅ |
| 生成任务列表 | ✅ |
| 自动执行实现 | ✅ |
| 跨文档一致性分析 | ✅ |
| 直接 API 调用 | ❌ 必须通过 Claude Code |
| 部分执行（只执行某些任务） | ⚠️ 需通过 prompt 控制 |
