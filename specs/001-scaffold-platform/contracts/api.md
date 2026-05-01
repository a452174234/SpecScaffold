# 接口契约：后端 API

**日期**: 2026-04-30

## 概述

后端 API 基于 Hono 框架，提供 RESTful 接口 + WebSocket 实时通信。

## API 路由

### 项目管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/projects` | 获取项目列表 |
| POST | `/api/projects` | 创建新项目 |
| POST | `/api/projects/import` | 导入已有项目 |
| GET | `/api/projects/:id` | 获取项目详情 |
| DELETE | `/api/projects/:id` | 归档项目 |

### SDD 流程

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/projects/:id/specify` | 启动规格生成 |
| POST | `/api/projects/:id/clarify` | 澄清规格歧义 |
| POST | `/api/projects/:id/plan` | 生成实施计划 |
| POST | `/api/projects/:id/tasks` | 生成任务列表 |

### 任务管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/projects/:id/tasks` | 获取任务列表 |
| PATCH | `/api/projects/:id/tasks/:taskId` | 更新任务状态 |

### AI 工作区

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/projects/:id/ai/generate-tests` | AI 生成测试用例 |
| POST | `/api/projects/:id/ai/implement` | AI 执行实现 |
| POST | `/api/projects/:id/ai/run-tests` | 运行测试 |

### 安全围栏

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/projects/:id/security/policy` | 获取安全策略 |
| PUT | `/api/projects/:id/security/policy` | 更新安全策略 |
| GET | `/api/projects/:id/audit-logs` | 查询审计日志 |
| POST | `/api/audit/:auditId/respond` | 提交审计审批结果 |

### 工具管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/tools` | 获取已注册工具列表 |
| GET | `/api/tools/:name/capability` | 获取工具能力边界文档 |

## WebSocket 事件

### 服务端推送

| 事件 | 数据 | 说明 |
|------|------|------|
| `ai:message` | StreamMessage | AI 流式输出消息 |
| `ai:tool_use` | { tool, target } | AI 正在调用工具 |
| `audit:request` | AuditRequest | 高危操作审计请求 |
| `task:status` | { taskId, status } | 任务状态变更 |
| `test:result` | { taskId, passed, output } | 测试运行结果 |

### 客户端发送

| 事件 | 数据 | 说明 |
|------|------|------|
| `audit:respond` | { auditId, approved, feedback } | 审计审批响应 |

## 通用响应格式

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
```
