import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter } from 'events';
import { ClaudeCodeAdapter } from '../../../src/adapters/claude-code/adapter';

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

describe('ClaudeCodeAdapter', () => {
  let adapter: ClaudeCodeAdapter;

  beforeEach(() => {
    adapter = new ClaudeCodeAdapter();
    mockSpawn.mockReset();
  });

  it('应成功执行命令并返回结果 (JSON output)', async () => {
    const proc = new MockChildProcess();
    mockSpawn.mockReturnValue(proc);

    const resultPromise = adapter.execute('/speckit-specify test', { cwd: '/tmp/test' });

    // Verify prompt was written to stdin
    expect(proc.stdin.write).toHaveBeenCalledWith('/speckit-specify test');
    expect(proc.stdin.end).toHaveBeenCalled();

    const jsonResponse = JSON.stringify({
      type: 'result',
      session_id: 'test-session-1',
      is_error: false,
      terminal_reason: 'completed',
      usage: { input_tokens: 100, output_tokens: 50 },
    });

    proc.stdout.emit('data', Buffer.from(jsonResponse));
    proc.emit('close', 0);

    const result = await resultPromise;

    expect(result.sessionId).toBe('test-session-1');
    expect(result.exitReason).toBe('completed');
    expect(result.tokenUsage.input).toBe(100);
    expect(result.tokenUsage.output).toBe(50);
  });

  it('应处理错误退出码', async () => {
    const proc = new MockChildProcess();
    mockSpawn.mockReturnValue(proc);

    const resultPromise = adapter.execute('/speckit-specify test', { cwd: '/tmp/test' });

    proc.stderr.emit('data', Buffer.from('error'));
    proc.emit('close', 1);

    const result = await resultPromise;

    expect(result.exitReason).toBe('error');
    expect(result.sessionId).toBe('');
  });

  it('应支持流式执行 (stream-json)', async () => {
    const proc = new MockChildProcess();
    mockSpawn.mockReturnValue(proc);

    const messages: unknown[] = [];
    const resultPromise = adapter.executeStream(
      '/speckit-specify test',
      { cwd: '/tmp/test' },
      (msg) => messages.push(msg),
    );

    expect(proc.stdin.write).toHaveBeenCalledWith('/speckit-specify test');

    const streamLines = [
      JSON.stringify({ type: 'assistant', session_id: 'test-session-1', message: { role: 'assistant', content: [{ type: 'text', text: 'thinking...' }] } }),
      JSON.stringify({ type: 'tool_use', message: { role: 'assistant', content: [{ type: 'tool_use', name: 'Read' }] } }),
      JSON.stringify({ type: 'result', session_id: 'test-session-1', is_error: false, usage: { input_tokens: 200, output_tokens: 100 } }),
    ];

    proc.stdout.emit('data', Buffer.from(streamLines.join('\n') + '\n'));
    proc.emit('close', 0);

    const result = await resultPromise;

    expect(result.sessionId).toBe('test-session-1');
    expect(result.tokenUsage.input).toBe(200);
    expect(messages.length).toBe(2);
    expect((messages[0] as any).type).toBe('assistant');
    expect((messages[1] as any).type).toBe('tool_use');
  });

  it('应支持 continueSession (--resume)', async () => {
    const proc = new MockChildProcess();
    mockSpawn.mockReturnValue(proc);

    const resultPromise = adapter.continueSession('old-session', '继续', { cwd: '/tmp/test' });

    expect(proc.stdin.write).toHaveBeenCalledWith('继续');

    const jsonResponse = JSON.stringify({
      type: 'result',
      session_id: 'new-session',
      is_error: false,
      usage: { input_tokens: 50, output_tokens: 25 },
    });

    proc.stdout.emit('data', Buffer.from(jsonResponse));
    proc.emit('close', 0);

    const result = await resultPromise;

    expect(result.sessionId).toBe('new-session');
    expect(result.tokenUsage.input).toBe(50);
  });
});
