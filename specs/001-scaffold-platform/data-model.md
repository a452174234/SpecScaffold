# 数据模型：SpecScaffold Web 脚手架平台

**日期**: 2026-04-30
**分支**: `001-scaffold-platform`

## 实体关系概览

```text
Project 1──* Spec 1──* Plan 1──* Task
   │
   └──* AuditLog

SecurityPolicy 1──1 Project
ToolAdapter (注册表模式，非持久化)
```

## 实体定义

### Project（项目）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string (UUID) | 唯一标识 |
| name | string | 项目名称 |
| path | string | 本地目录绝对路径 |
| type | enum | 项目类型：`created`（新建）/ `imported`（导入） |
| language | string | 识别的编程语言（导入时自动检测） |
| framework | string | 识别的框架（导入时自动检测） |
| status | enum | `active` / `archived` |
| createdAt | datetime | 创建时间 |
| updatedAt | datetime | 最后更新时间 |

### Spec（规格说明）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string (UUID) | 唯一标识 |
| projectId | string (FK) | 所属项目 |
| branch | string | Git 分支名 |
| description | string | 用户原始功能描述 |
| specFilePath | string | spec.md 文件路径 |
| status | enum | `draft` / `clarified` / `planned` / `tasked` |
| createdAt | datetime | 创建时间 |

### Plan（实施计划）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string (UUID) | 唯一标识 |
| specId | string (FK) | 关联的规格说明 |
| planFilePath | string | plan.md 文件路径 |
| techStack | JSON | 技术栈信息 |
| status | enum | `draft` / `approved` / `implementing` / `completed` |
| createdAt | datetime | 创建时间 |

### Task（任务）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string (UUID) | 唯一标识 |
| planId | string (FK) | 所属计划 |
| taskId | string | 任务编号（如 T001） |
| title | string | 任务标题 |
| description | string | 任务描述（含文件路径） |
| priority | enum | `P1` / `P2` / `P3` |
| storyLabel | string | 关联的用户故事标签（如 US1） |
| parallelizable | boolean | 是否可并行执行 |
| status | enum | `pending` / `testing` / `test_approved` / `developing` / `testing_pass` / `completed` |
| testFilePath | string | 测试用例文件路径 |
| implFilePath | string | 实现代码文件路径 |
| dependencies | string[] | 依赖的任务 ID 列表 |
| createdAt | datetime | 创建时间 |

**状态流转**:

```text
pending → testing → test_approved → developing → testing_pass → completed
              ↑           ↓                          ↓
              └─── (测试失败，重新编写)              └── (自动 Git 提交)
```

### SecurityPolicy（安全策略）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string (UUID) | 唯一标识 |
| projectId | string (FK) | 所属项目（一对一） |
| projectPath | string | 项目目录路径（用于判断操作范围） |
| highRiskTools | string[] | 高危工具列表（如 `Bash`, `Write`） |
| highRiskPatterns | string[] | 高危操作模式（如 `Bash(rm *)`, `Write(/etc/*)`） |
| readOnlyExternalTools | string[] | 项目外仅允许只读的工具列表 |
| createdAt | datetime | 创建时间 |

### AuditLog（审计日志）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string (UUID) | 唯一标识 |
| projectId | string (FK) | 所属项目 |
| sessionId | string | Claude Code 会话 ID |
| toolName | string | 工具名称（如 `Bash`, `Write`, `Read`） |
| operation | string | 操作描述 |
| target | string | 操作目标（文件路径/命令内容） |
| riskLevel | enum | `read_only` / `low` / `high` |
| isInProjectScope | boolean | 是否在项目范围内 |
| auditResult | enum | `auto_allowed` / `user_approved` / `user_rejected` / `blocked` |
| operationDescription | string | 操作说明（展示给用户：做什么、为什么、影响范围） |
| userFeedback | string | 用户审批时附加的反馈 |
| timestamp | datetime | 操作时间 |

### ToolAdapter（工具适配器，运行时对象）

| 字段 | 类型 | 说明 |
|------|------|------|
| name | string | 适配器名称（如 `claude-code`, `speckit`） |
| type | enum | `ai_model` / `sdd_engine` |
| status | enum | `available` / `unavailable` / `initializing` |
| config | JSON | 工具特定配置 |
| capabilityDocPath | string | 能力边界文档路径 |

**说明**: ToolAdapter 不持久化到数据库，而是通过注册表模式在运行时管理。

## 数据库设计

使用 SQLite，通过 better-sqlite3 访问。数据库文件存储在平台数据目录（如 `~/.spec-scaffold/data.db`）。

### 索引策略

- `Project.path` — 唯一索引，防止重复导入
- `AuditLog.projectId + timestamp` — 复合索引，按项目查询审计日志
- `Task.planId + status` — 复合索引，按计划查询任务状态
- `Spec.projectId + status` — 复合索引，按项目查询活跃 Spec
