# 契约：安全策略前端页面

**功能**: 002-playwright-e2e-verification
**日期**: 2026-05-03

## 概述

定义新增的安全策略管理前端页面与后端 API 的交互契约。

## 页面路由

| 路由 | 组件 | 说明 |
|------|------|------|
| `/projects/:id/security` | SecurityPolicy.tsx | 安全策略管理页面 |

## 页面数据交互

### 加载策略

**请求**: `GET /api/projects/:id/security/policy`

**成功响应**:
```json
{
  "success": true,
  "data": {
    "id": "policy-id",
    "project_id": "project-id",
    "policy_json": "{\"highRiskTools\":[\"Bash\",\"Write\",\"Edit\"],\"readOnlyTools\":[\"Read\",\"Glob\",\"Grep\"],\"dangerousPatterns\":[\"rm\"]}"
  }
}
```

### 更新策略

**请求**: `PUT /api/projects/:id/security/policy`

**请求体**:
```json
{
  "highRiskTools": ["Bash", "Write", "Edit"],
  "readOnlyTools": ["Read", "Glob", "Grep"],
  "dangerousPatterns": ["rm", "rmdir"]
}
```

**成功响应**:
```json
{
  "success": true,
  "data": {
    "id": "policy-id",
    "project_id": "project-id",
    "policy_json": "{...updated...}"
  }
}
```

## 页面 UI 元素

| 元素 | 选择器建议 | 说明 |
|------|-----------|------|
| 策略标题 | `h2` 或 `heading` | "安全策略配置" |
| 高风险工具列表 | `[data-testid="high-risk-tools"]` | Tag 列表 + 添加/删除 |
| 只读工具列表 | `[data-testid="read-only-tools"]` | Tag 列表 + 添加/删除 |
| 危险命令模式 | `[data-testid="dangerous-patterns"]` | Tag 列表 + 添加/删除 |
| 保存按钮 | `button:has-text("保存")` | 提交更新 |

## 项目详情页导航

在 ProjectDetail.tsx 的导航卡片中新增第五个入口：

```typescript
{
  title: '安全策略',
  description: '配置项目安全策略和工具权限',
  path: `/projects/${id}/security`,
  icon: SafetyCertificateOutlined,
  color: '#fff1f0'
}
```
