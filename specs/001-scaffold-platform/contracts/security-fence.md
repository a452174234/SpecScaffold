# 接口契约：安全围栏

**日期**: 2026-04-30

## 概述

安全围栏是位于 AI 智能体和项目文件系统之间的中间层，负责操作分级、拦截、审批和审计。

## 接口定义

### ISecurityFence

```typescript
interface ISecurityFence {
  // 评估操作风险级别
  evaluateOperation(context: OperationContext): RiskAssessment;

  // 处理操作请求（由 Claude Code Hook 调用）
  handleOperation(context: OperationContext): Promise<OperationDecision>;

  // 提交用户审批结果
  submitAuditResult(auditId: string, result: AuditDecision): void;

  // 查询审计日志
  queryAuditLogs(filter: AuditLogFilter): Promise<AuditLog[]>;

  // 获取/更新安全策略
  getPolicy(projectId: string): SecurityPolicy;
  updatePolicy(projectId: string, policy: Partial<SecurityPolicy>): void;
}
```

### OperationContext

```typescript
interface OperationContext {
  projectId: string;              // 项目 ID
  projectPath: string;            // 项目目录路径
  toolName: string;               // 工具名称（如 Bash, Write, Read）
  operation: string;              // 操作描述
  target: string;                 // 操作目标路径/内容
  sessionId: string;              // Claude Code 会话 ID
}
```

### RiskAssessment

```typescript
interface RiskAssessment {
  level: 'read_only' | 'low' | 'high' | 'blocked';
  isInScope: boolean;             // 是否在项目范围内
  reason: string;                 // 风险评估理由
  operationDescription: string;   // 给用户的操作说明
}
```

### OperationDecision

```typescript
interface OperationDecision {
  action: 'allow' | 'deny' | 'ask';
  reason: string;
  auditId?: string;               // ask 模式下的审计 ID
}
```

### AuditDecision

```typescript
interface AuditDecision {
  approved: boolean;
  feedback?: string;              // 用户附加反馈
}
```

## 操作分级规则

### 平台通用安全边界

| 条件 | 级别 | 处理 |
|------|------|------|
| 工具为 `Read`, `Grep`, `Glob` | read_only | 自动放行 |
| 目标路径在项目目录外 | blocked | 直接拒绝（写）/ 放行（只读） |
| 工具为 `Bash` 且含高危命令（rm, sudo, curl pipe bash 等） | high | 暂停 → 用户审批 |
| 工具为 `Write` / `Edit` 且在项目范围内 | low | 自动放行 |
| 工具为 `Bash` 且在项目范围内 | high | 暂停 → 用户审批 |

### 项目级 Spec 边界

通过解析项目当前的 Spec 文档，识别允许的操作范围。超出 Spec 定义功能范围的操作提升风险级别。

## Hook 集成机制

安全围栏通过 Claude Code 的 `PreToolUse` Hook 集成：

1. 平台在启动 Claude Code 会话前，生成动态 Hook 配置
2. Hook 脚本调用安全围栏服务的 HTTP API
3. 安全围栏返回 `allow` / `deny` / `ask`
4. `ask` 模式下，通过 WebSocket 推送审计请求到前端
5. 用户响应后，安全围栏将结果回传给 Hook 脚本

```text
Claude Code 工具调用
    ↓
PreToolUse Hook 触发
    ↓
Hook 脚本 → HTTP POST → 安全围栏 API
    ↓
├── allow → Hook 返回 allow → 工具执行
├── deny  → Hook 返回 deny  → 工具被拒绝
└── ask   → WebSocket 推送到前端
                ↓
           用户审批（前端）
                ↓
           HTTP POST 回传结果
                ↓
           Hook 返回 allow/deny
```
