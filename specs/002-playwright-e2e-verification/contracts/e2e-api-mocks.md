# 契约：E2E 测试 API Mock 定义

**功能**: 002-playwright-e2e-verification
**日期**: 2026-05-03

## 概述

定义 E2E 测试中需要 Mock 的 API 端点及其响应格式。这些端点涉及外部服务调用（Claude Code、Spec Kit），在测试环境中不可用，需要通过 Playwright `page.route()` 拦截并返回固定响应。

## Mock 端点

### SDD 流程端点

#### POST /api/projects/:id/sdd/specify

Mock 场景：功能描述提交成功

```json
{
  "success": true,
  "data": {
    "specPath": "specs/test-feature/spec.md",
    "description": "测试功能规格说明"
  }
}
```

#### POST /api/projects/:id/sdd/clarify

Mock 场景：澄清提交成功

```json
{
  "success": true,
  "data": {
    "clarified": true,
    "questions": []
  }
}
```

#### POST /api/projects/:id/sdd/plan

Mock 场景：计划生成成功

```json
{
  "success": true,
  "data": {
    "planPath": "specs/test-feature/plan.md",
    "summary": "实施计划已生成"
  }
}
```

#### POST /api/projects/:id/sdd/tasks

Mock 场景：任务生成成功

```json
{
  "success": true,
  "data": {
    "tasksPath": "specs/test-feature/tasks.md",
    "taskCount": 3
  }
}
```

### AI 工作区端点

#### POST /api/projects/:id/ai/generate-tests

Mock 场景：测试生成触发成功

```json
{
  "success": true,
  "data": {
    "sessionId": "mock-session-001",
    "status": "completed",
    "output": "测试用例已生成: 3 个测试文件"
  }
}
```

#### POST /api/projects/:id/ai/implement

Mock 场景：代码实现触发成功

```json
{
  "success": true,
  "data": {
    "sessionId": "mock-session-002",
    "status": "completed",
    "output": "实现代码已生成"
  }
}
```

#### POST /api/projects/:id/ai/run-tests

Mock 场景：测试运行触发成功

```json
{
  "success": true,
  "data": {
    "sessionId": "mock-session-003",
    "status": "completed",
    "output": "全部测试通过 (3/3)"
  }
}
```

## 不 Mock 的端点

以下端点使用真实后端，不拦截：

| 端点 | 原因 |
|------|------|
| GET/POST/PUT/DELETE /api/projects* | 项目管理是核心基础功能，需要真实数据 |
| GET/PATCH /api/projects/:id/tasks* | 任务管理依赖数据库真实状态 |
| GET/PUT /api/projects/:id/security/* | 安全策略依赖数据库真实状态 |

## Mock 实现模式

```typescript
// Playwright route 拦截模式
await page.route('**/api/projects/*/sdd/**', async (route) => {
  const url = route.request().url();
  if (url.includes('/specify')) {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockSpecifyResponse) });
  }
  // ... 其他端点
});
```
