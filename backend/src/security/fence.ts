import Database from 'better-sqlite3';
import { v4 as uuid } from 'uuid';
import path from 'path';

export interface OperationContext {
  projectId: string;
  projectPath: string;
  toolName: string;
  operation: string;
  target: string;
  sessionId: string;
}

export interface RiskAssessment {
  level: 'read_only' | 'low' | 'high' | 'blocked';
  isInScope: boolean;
  reason: string;
  operationDescription: string;
}

export interface OperationDecision {
  action: 'allow' | 'deny' | 'ask';
  reason: string;
  auditId?: string;
}

const READ_ONLY_TOOLS = ['Read', 'Grep', 'Glob'];
const HIGH_RISK_PATTERNS = ['rm ', 'sudo ', 'curl.*|.*bash', 'chmod', 'mkfs', 'dd if='];

export class SecurityFence {
  private pendingAudits = new Map<string, { resolve: (decision: OperationDecision) => void }>();

  constructor(private db: Database.Database) {}

  evaluateOperation(ctx: OperationContext): RiskAssessment {
    const isInScope = this.isInProjectScope(ctx.target, ctx.projectPath);

    // 只读工具始终为 read_only
    if (READ_ONLY_TOOLS.includes(ctx.toolName)) {
      return {
        level: 'read_only',
        isInScope,
        reason: `只读工具 ${ctx.toolName} 自动放行`,
        operationDescription: `${ctx.operation}: ${ctx.target}`,
      };
    }

    // Bash 工具始终为 high（命令在项目工作目录中执行，视为范围内）
    if (ctx.toolName === 'Bash') {
      return {
        level: 'high',
        isInScope: true,
        reason: `Bash 命令需要用户审批`,
        operationDescription: `执行命令: ${ctx.target}`,
      };
    }

    // 项目范围外的写操作
    if (!isInScope) {
      return {
        level: 'blocked',
        isInScope: false,
        reason: `操作目标 ${ctx.target} 不在项目范围 ${ctx.projectPath} 内`,
        operationDescription: `尝试在项目外执行 ${ctx.operation}: ${ctx.target}`,
      };
    }

    // Write/Edit 在项目范围内为 low
    if (['Write', 'Edit'].includes(ctx.toolName)) {
      return {
        level: 'low',
        isInScope: true,
        reason: `项目范围内的文件操作`,
        operationDescription: `${ctx.operation}: ${ctx.target}`,
      };
    }

    // 其他工具默认为 low
    return {
      level: 'low',
      isInScope,
      reason: '未知工具，默认低风险',
      operationDescription: `${ctx.operation}: ${ctx.target}`,
    };
  }

  async handleOperation(ctx: OperationContext): Promise<OperationDecision> {
    const assessment = this.evaluateOperation(ctx);
    const auditId = uuid();

    // 记录审计日志
    let auditResult: string;
    let action: 'allow' | 'deny' | 'ask';

    switch (assessment.level) {
      case 'read_only':
        auditResult = 'auto_allowed';
        action = 'allow';
        break;
      case 'low':
        auditResult = 'auto_allowed';
        action = 'allow';
        break;
      case 'high':
        auditResult = 'auto_allowed';
        action = 'ask';
        break;
      case 'blocked':
        auditResult = 'blocked';
        action = 'deny';
        break;
    }

    this.db.prepare(`
      INSERT INTO audit_logs (id, project_id, session_id, tool_name, operation, target, risk_level, is_in_project_scope, audit_result, operation_description, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      auditId,
      ctx.projectId,
      ctx.sessionId,
      ctx.toolName,
      ctx.operation,
      ctx.target,
      assessment.level,
      assessment.isInScope ? 1 : 0,
      auditResult,
      assessment.operationDescription,
    );

    if (action === 'ask') {
      return {
        action: 'ask',
        reason: assessment.reason,
        auditId,
      };
    }

    return { action, reason: assessment.reason };
  }

  submitAuditResult(auditId: string, approved: boolean, feedback?: string) {
    const result = approved ? 'user_approved' : 'user_rejected';
    this.db.prepare(`
      UPDATE audit_logs SET audit_result = ?, user_feedback = ? WHERE id = ?
    `).run(result, feedback || null, auditId);

    const pending = this.pendingAudits.get(auditId);
    if (pending) {
      pending.resolve({
        action: approved ? 'allow' : 'deny',
        reason: feedback || (approved ? '用户已批准' : '用户已拒绝'),
      });
      this.pendingAudits.delete(auditId);
    }
  }

  private isInProjectScope(target: string, projectPath: string): boolean {
    const normalizedTarget = path.resolve(target);
    const normalizedProject = path.resolve(projectPath);
    return normalizedTarget.startsWith(normalizedProject);
  }
}
