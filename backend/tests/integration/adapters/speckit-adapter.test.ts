import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SpeckitAdapter } from '../../../src/adapters/speckit/adapter';
import { getTestDb, cleanTestDb } from '../../setup';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Mock Claude Code SDK
vi.mock('@anthropic-ai/claude-code', () => ({
  query: vi.fn().mockResolvedValue({
    sessionId: 'mock-session',
    messages: [],
    tokenUsage: { input: 100, output: 200 },
    exitReason: 'completed',
  }),
}));

describe('SpeckitAdapter', () => {
  let adapter: SpeckitAdapter;
  let testDir: string;

  beforeEach(() => {
    const db = getTestDb();
    cleanTestDb(db);
    testDir = path.join(os.tmpdir(), `speckit-test-${Date.now()}`);
    fs.mkdirSync(testDir, { recursive: true });
    adapter = new SpeckitAdapter();
  });

  it('应构造正确的 specify 调用', async () => {
    const result = await adapter.specify(testDir, '用户登录功能');

    expect(result).toBeDefined();
    expect(result).toHaveProperty('specFilePath');
    expect(result).toHaveProperty('featureDirectory');
  });

  it('应构造正确的 plan 调用', async () => {
    const result = await adapter.plan(testDir);

    expect(result).toBeDefined();
    expect(result.planFilePath).toBeDefined();
  });

  it('应构造正确的 tasks 调用', async () => {
    const result = await adapter.tasks(testDir);

    expect(result).toBeDefined();
    expect(result.taskCount).toBe(0);
  });
});
