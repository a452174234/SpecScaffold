import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter } from 'events';
import { AiService } from '../../../src/services/ai-service';
import { getTestDb, cleanTestDb } from '../../setup';

class MockWritable extends EventEmitter {
  write = vi.fn();
  end = vi.fn();
}

class MockChildProcess extends EventEmitter {
  stdout = new EventEmitter();
  stderr = new EventEmitter();
  stdin = new MockWritable();
}

const mockSpawn = vi.fn();

vi.mock('child_process', () => ({
  spawn: (...args: unknown[]) => mockSpawn(...args),
  execFile: vi.fn(),
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

    const proc = new MockChildProcess();
    mockSpawn.mockReturnValue(proc);

    setTimeout(() => {
      const json = JSON.stringify({
        type: 'result',
        session_id: 'test-session',
        is_error: false,
        terminal_reason: 'completed',
        usage: { input_tokens: 50, output_tokens: 100 },
      });
      proc.stdout.emit('data', Buffer.from(json));
      proc.emit('close', 0);
    }, 10);
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
