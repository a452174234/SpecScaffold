import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SpeckitAdapter } from '../../../src/adapters/speckit/adapter';
import type { IClaudeCodeAdapter, ClaudeCodeResult } from '../../../src/adapters/claude-code/types';
import { getTestDb, cleanTestDb } from '../../setup';
import fs from 'fs';
import path from 'path';
import os from 'os';

function createMockClaudeAdapter(): IClaudeCodeAdapter {
  const defaultResult: ClaudeCodeResult = {
    sessionId: 'mock-session',
    messages: [],
    tokenUsage: { input: 100, output: 200 },
    exitReason: 'completed',
  };

  return {
    execute: vi.fn().mockResolvedValue(defaultResult),
    executeStream: vi.fn().mockImplementation((_prompt, _options, onMessage) => {
      return Promise.resolve(defaultResult);
    }),
    continueSession: vi.fn().mockResolvedValue(defaultResult),
  };
}

describe('SpeckitAdapter', () => {
  let adapter: SpeckitAdapter;
  let mockClaude: IClaudeCodeAdapter;
  let testDir: string;

  beforeEach(() => {
    const db = getTestDb();
    cleanTestDb(db);
    testDir = path.join(os.tmpdir(), `speckit-test-${Date.now()}`);
    fs.mkdirSync(testDir, { recursive: true });
    mockClaude = createMockClaudeAdapter();
    adapter = new SpeckitAdapter(mockClaude);
  });

  it('应构造正确的 specify 调用', async () => {
    const result = await adapter.specify(testDir, '用户登录功能');

    expect(result).toBeDefined();
    expect(result).toHaveProperty('specFilePath');
    expect(result).toHaveProperty('featureDirectory');
    expect(result).toHaveProperty('content');
    expect(result).toHaveProperty('sessionId', 'mock-session');
    expect(result).toHaveProperty('tokenUsage');
    expect(mockClaude.execute).toHaveBeenCalledWith(
      expect.stringContaining('/speckit-specify'),
      expect.objectContaining({ cwd: testDir }),
    );
  });

  it('应构造正确的 plan 调用', async () => {
    const result = await adapter.plan(testDir);

    expect(result).toBeDefined();
    expect(result.planFilePath).toBeDefined();
    expect(result).toHaveProperty('content');
    expect(mockClaude.execute).toHaveBeenCalledWith(
      '/speckit-plan',
      expect.objectContaining({ cwd: testDir }),
    );
  });

  it('应构造正确的 tasks 调用', async () => {
    const result = await adapter.tasks(testDir);

    expect(result).toBeDefined();
    expect(result.taskCount).toBe(0);
    expect(result).toHaveProperty('content');
    expect(mockClaude.execute).toHaveBeenCalledWith(
      '/speckit-tasks',
      expect.objectContaining({ cwd: testDir }),
    );
  });
});
