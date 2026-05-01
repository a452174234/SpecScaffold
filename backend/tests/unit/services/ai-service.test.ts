import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AiService } from '../../../src/services/ai-service';
import { getTestDb, cleanTestDb } from '../../setup';

vi.mock('@anthropic-ai/claude-code', () => ({
  query: vi.fn().mockResolvedValue({
    sessionId: 'test-session',
    messages: [],
    tokenUsage: { input: 50, output: 100 },
    exitReason: 'completed',
  }),
}));

describe('AiService', () => {
  let service: AiService;
  const projectId = `ai-test-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  beforeEach(() => {
    const db = getTestDb();
    cleanTestDb(db);
    db.prepare(
      "INSERT INTO projects (id, name, path, type, status, created_at, updated_at) VALUES (?, ?, ?, 'created', 'active', datetime('now'), datetime('now'))",
    ).run(projectId, 'AI测试项目', '/tmp/ai-test');
    service = new AiService(db);
  });

  it('应启动测试用例生成', async () => {
    const result = await service.generateTests(projectId, 'T001');
    expect(result).toBeDefined();
    expect(result).toHaveProperty('sessionId');
  });

  it('应启动代码实现', async () => {
    const result = await service.implement(projectId, 'T001');
    expect(result).toBeDefined();
    expect(result).toHaveProperty('sessionId');
  });

  it('应启动测试运行', async () => {
    const result = await service.runTests(projectId, 'T001');
    expect(result).toBeDefined();
    expect(result).toHaveProperty('sessionId');
  });

  it('应拒绝不存在的项目', async () => {
    await expect(service.generateTests('non-existent', 'T001')).rejects.toThrow();
  });
});
