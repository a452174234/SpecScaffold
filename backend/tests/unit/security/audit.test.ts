import { describe, it, expect, beforeEach } from 'vitest';
import { AuditService } from '../../../src/security/audit';
import { getTestDb, cleanTestDb } from '../../setup';

describe('AuditService', () => {
  let auditService: AuditService;
  const projectId = `audit-test-${Date.now()}`;

  beforeEach(() => {
    const db = getTestDb();
    cleanTestDb(db);
    db.prepare(
      "INSERT INTO projects (id, name, path, type, status, created_at, updated_at) VALUES (?, ?, ?, 'created', 'active', datetime('now'), datetime('now'))",
    ).run(projectId, '测试项目', '/tmp/test');
    auditService = new AuditService(db);
  });

  it('应记录审计日志', () => {
    const id = auditService.log({
      projectId,
      sessionId: 'session-1',
      toolName: 'Bash',
      operation: '执行命令',
      target: 'npm install',
      riskLevel: 'high',
      isInProjectScope: true,
      auditResult: 'auto_allowed',
      operationDescription: '安装项目依赖',
    });

    expect(id).toBeDefined();
  });

  it('应查询审计日志', () => {
    auditService.log({
      projectId,
      sessionId: 'session-1',
      toolName: 'Read',
      operation: '读取文件',
      target: '/tmp/test/src/index.ts',
      riskLevel: 'read_only',
      isInProjectScope: true,
      auditResult: 'auto_allowed',
      operationDescription: '读取项目文件',
    });

    auditService.log({
      projectId,
      sessionId: 'session-1',
      toolName: 'Bash',
      operation: '执行命令',
      target: 'npm test',
      riskLevel: 'high',
      isInProjectScope: true,
      auditResult: 'user_approved',
      operationDescription: '运行测试',
    });

    const logs = auditService.query({ projectId });
    expect(logs).toHaveLength(2);
  });

  it('应更新审计结果', () => {
    const id = auditService.log({
      projectId,
      sessionId: 'session-1',
      toolName: 'Bash',
      operation: '执行命令',
      target: 'rm -rf dist',
      riskLevel: 'high',
      isInProjectScope: true,
      auditResult: 'auto_allowed',
      operationDescription: '清理构建目录',
    });

    auditService.updateResult(id, 'user_approved', '用户确认清理');
    const logs = auditService.query({ projectId });
    expect(logs[0].audit_result).toBe('user_approved');
    expect(logs[0].user_feedback).toBe('用户确认清理');
  });
});
