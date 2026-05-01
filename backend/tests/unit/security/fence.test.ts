import { describe, it, expect, beforeEach } from 'vitest';
import { SecurityFence } from '../../../src/security/fence';
import { getTestDb, cleanTestDb } from '../../setup';

describe('SecurityFence', () => {
  let fence: SecurityFence;
  const projectPath = `/tmp/test-project-${Date.now()}`;
  const projectId = `fence-test-${Date.now()}`;

  beforeEach(() => {
    const db = getTestDb();
    cleanTestDb(db);
    // 创建测试项目和安全策略
    db.prepare(
      "INSERT INTO projects (id, name, path, type, status, created_at, updated_at) VALUES (?, ?, ?, 'created', 'active', datetime('now'), datetime('now'))",
    ).run(projectId, '测试项目', projectPath);
    db.prepare(
      "INSERT INTO security_policies (id, project_id, project_path, high_risk_tools, high_risk_patterns, read_only_external_tools, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))",
    ).run(
      'policy-1',
      projectId,
      projectPath,
      JSON.stringify(['Bash', 'Write', 'Edit']),
      JSON.stringify([]),
      JSON.stringify(['Read', 'Glob', 'Grep']),
    );
    fence = new SecurityFence(db);
  });

  describe('evaluateOperation', () => {
    it('应将 Read 工具标记为 read_only', () => {
      const result = fence.evaluateOperation({
        projectId,
        projectPath,
        toolName: 'Read',
        operation: '读取文件',
        target: `${projectPath}/src/index.ts`,
        sessionId: 'session-1',
      });

      expect(result.level).toBe('read_only');
      expect(result.isInScope).toBe(true);
    });

    it('应将项目范围外的写操作标记为 blocked', () => {
      const result = fence.evaluateOperation({
        projectId,
        projectPath,
        toolName: 'Write',
        operation: '写入文件',
        target: '/etc/passwd',
        sessionId: 'session-1',
      });

      expect(result.level).toBe('blocked');
      expect(result.isInScope).toBe(false);
    });

    it('应将项目范围内的 Write 标记为 low', () => {
      const result = fence.evaluateOperation({
        projectId,
        projectPath,
        toolName: 'Write',
        operation: '写入文件',
        target: `${projectPath}/src/new-file.ts`,
        sessionId: 'session-1',
      });

      expect(result.level).toBe('low');
      expect(result.isInScope).toBe(true);
    });

    it('应将 Bash 工具标记为 high', () => {
      const result = fence.evaluateOperation({
        projectId,
        projectPath,
        toolName: 'Bash',
        operation: '执行命令',
        target: 'npm install',
        sessionId: 'session-1',
      });

      expect(result.level).toBe('high');
    });

    it('应将含 rm 的 Bash 命令标记为 high', () => {
      const result = fence.evaluateOperation({
        projectId,
        projectPath,
        toolName: 'Bash',
        operation: '执行命令',
        target: 'rm -rf node_modules',
        sessionId: 'session-1',
      });

      expect(result.level).toBe('high');
    });

    it('应将项目范围外的只读工具标记为 read_only', () => {
      const result = fence.evaluateOperation({
        projectId,
        projectPath,
        toolName: 'Glob',
        operation: '搜索文件',
        target: '/usr/local/lib',
        sessionId: 'session-1',
      });

      expect(result.level).toBe('read_only');
      expect(result.isInScope).toBe(false);
    });
  });

  describe('handleOperation', () => {
    it('read_only 操作应自动放行', async () => {
      const decision = await fence.handleOperation({
        projectId,
        projectPath,
        toolName: 'Read',
        operation: '读取文件',
        target: `${projectPath}/src/index.ts`,
        sessionId: 'session-1',
      });

      expect(decision.action).toBe('allow');
    });

    it('low 风险操作应自动放行', async () => {
      const decision = await fence.handleOperation({
        projectId,
        projectPath,
        toolName: 'Write',
        operation: '写入文件',
        target: `${projectPath}/src/new-file.ts`,
        sessionId: 'session-1',
      });

      expect(decision.action).toBe('allow');
    });

    it('blocked 操作应拒绝', async () => {
      const decision = await fence.handleOperation({
        projectId,
        projectPath,
        toolName: 'Write',
        operation: '写入文件',
        target: '/etc/config',
        sessionId: 'session-1',
      });

      expect(decision.action).toBe('deny');
    });

    it('high 风险操作应暂停等待审批', async () => {
      const decision = await fence.handleOperation({
        projectId,
        projectPath,
        toolName: 'Bash',
        operation: '执行命令',
        target: 'npm install',
        sessionId: 'session-1',
      });

      expect(decision.action).toBe('ask');
      expect(decision.auditId).toBeDefined();
    });
  });
});
