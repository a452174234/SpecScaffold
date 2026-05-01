import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClaudeCodeAdapter } from '../../../src/adapters/claude-code/adapter';

vi.mock('@anthropic-ai/claude-code', () => ({
  query: vi.fn().mockResolvedValue({
    sessionId: 'test-session-1',
    messages: [{ role: 'assistant', content: '完成' }],
    tokenUsage: { input: 100, output: 50 },
    exitReason: 'completed',
  }),
}));

describe('ClaudeCodeAdapter', () => {
  let adapter: ClaudeCodeAdapter;

  beforeEach(() => {
    adapter = new ClaudeCodeAdapter();
  });

  it('应成功执行命令并返回结果', async () => {
    const result = await adapter.execute('测试命令', {
      cwd: '/tmp/test',
    });

    expect(result).toBeDefined();
    expect(result.sessionId).toBe('test-session-1');
    expect(result.exitReason).toBe('completed');
  });

  it('应支持流式执行', async () => {
    const messages: any[] = [];
    const result = await adapter.executeStream(
      '测试命令',
      { cwd: '/tmp/test' },
      (msg) => messages.push(msg),
    );

    expect(result).toBeDefined();
    expect(result.sessionId).toBe('test-session-1');
  });
});
