# 数据模型：Playwright E2E 测试

**功能**: 002-playwright-e2e-verification
**日期**: 2026-05-03

## 概述

本功能不引入新的生产数据模型。E2E 测试通过已有后端 API 创建和操作数据。以下定义测试所需的数据实体及其关系。

## 测试数据实体

### 测试项目 (Test Project)

每个测试场景需要至少一个项目记录作为操作上下文。

| 字段 | 类型 | 来源 | 说明 |
|------|------|------|------|
| id | string | API 返回 | 项目唯一标识 |
| name | string | API 创建 | 项目名称 |
| path | string | API 创建 | 项目路径 |
| type | string | API 创建 | "created" 或 "imported" |
| language | string | null | 导入时扫描识别 |
| framework | string | null | 导入时扫描识别 |

**创建方式**: `POST /api/projects` 或 `POST /api/projects/import`

### 测试任务 (Test Task)

任务面板和 AI 工作区测试需要已存在的任务数据。任务创建依赖项目、规格和计划的完整链路。

| 字段 | 类型 | 来源 | 说明 |
|------|------|------|------|
| id | string | API 返回 | 任务唯一标识 |
| task_id | string | API 创建 | 任务编号（如 T001） |
| title | string | API 创建 | 任务标题 |
| status | string | 状态机管理 | pending/testing/test_approved/developing/testing_pass/completed |
| priority | string | API 创建 | P1/P2/P3 |

**创建方式**: 通过数据库直接插入（因 SDD 流程的外部依赖在 E2E 中被 mock，完整链路无法通过 UI 完成）

### 测试审计日志 (Test Audit Log)

审计日志页面测试需要预置的日志数据。

| 字段 | 类型 | 来源 | 说明 |
|------|------|------|------|
| id | string | DB 插入 | 日志唯一标识 |
| project_id | string | DB 插入 | 关联项目 |
| tool_name | string | DB 插入 | 工具名（如 Bash、Write） |
| operation | string | DB 插入 | 操作描述 |
| risk_level | string | DB 插入 | read_only/low/high/blocked |
| audit_result | string | DB 插入 | allow/deny/ask |

**创建方式**: 数据库直接插入（审计日志无对应的前端创建入口）

### 安全策略 (Test Security Policy)

安全策略页面测试需要每个项目关联的策略配置。项目创建时自动生成默认策略。

| 字段 | 类型 | 来源 | 说明 |
|------|------|------|------|
| id | string | DB 自动 | 策略唯一标识 |
| project_id | string | 关联 | 项目 ID |
| policy_json | string | JSON 字符串 | 高风险工具、只读工具、危险命令模式 |

**创建方式**: 项目创建时自动生成，通过 `GET/PUT /api/projects/:id/security/policy` 读写

## 实体关系

```
项目 (Project) 1──* 任务 (Task)
项目 (Project) 1──* 审计日志 (AuditLog)
项目 (Project) 1──1 安全策略 (SecurityPolicy)
```

## 数据准备策略

| 数据类型 | 准备方式 | 清理方式 |
|----------|----------|----------|
| 项目 | API: POST /api/projects | 测试结束自动清理数据库 |
| 任务 | 数据库直接插入 | 同上 |
| 审计日志 | 数据库直接插入 | 同上 |
| 安全策略 | 随项目自动创建 | 随项目清理 |
