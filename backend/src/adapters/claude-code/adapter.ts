import type {
  IClaudeCodeAdapter,
  ClaudeCodeOptions,
  ClaudeCodeResult,
  StreamMessage,
} from './types';
import { spawn } from 'child_process';

function claudeBin(): string {
  return process.platform === 'win32' ? 'claude.cmd' : 'claude';
}

function spawnOpts(cwd: string): { cwd: string; stdio: ['pipe', 'pipe', 'pipe']; shell: boolean } {
  return { cwd, stdio: ['pipe', 'pipe', 'pipe'], shell: process.platform === 'win32' };
}

function buildArgs(flags: { outputFormat: string; maxTurns?: number; resume?: string }): string[] {
  const args = [
    '--dangerously-skip-permissions',
    '--output-format', flags.outputFormat,
  ];
  if (flags.maxTurns) {
    args.push('--max-turns', String(flags.maxTurns));
  }
  if (flags.resume) {
    args.push('--resume', flags.resume);
  }
  return args;
}

export class ClaudeCodeAdapter implements IClaudeCodeAdapter {
  async execute(prompt: string, options: ClaudeCodeOptions): Promise<ClaudeCodeResult> {
    const args = buildArgs({ outputFormat: 'json', maxTurns: options.maxTurns });

    return new Promise<ClaudeCodeResult>((resolve) => {
      const proc = spawn(claudeBin(), args, spawnOpts(options.cwd));

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
      proc.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });

      proc.stdin.write(prompt);
      proc.stdin.end();

      proc.on('error', () => {
        resolve({ sessionId: '', messages: [], tokenUsage: { input: 0, output: 0 }, exitReason: 'error' });
      });

      proc.on('close', (code) => {
        try {
          if (code !== 0 || !stdout.trim()) {
            return resolve({
              sessionId: '', messages: [], tokenUsage: { input: 0, output: 0 }, exitReason: 'error',
            });
          }

          const json = JSON.parse(stdout);
          resolve({
            sessionId: json.session_id || '',
            messages: [],
            tokenUsage: {
              input: json.usage?.input_tokens ?? 0,
              output: json.usage?.output_tokens ?? 0,
            },
            exitReason: json.is_error ? 'error' : (json.terminal_reason === 'max_turns' ? 'max_turns' : 'completed'),
          });
        } catch {
          resolve({ sessionId: '', messages: [], tokenUsage: { input: 0, output: 0 }, exitReason: 'error' });
        }
      });
    });
  }

  async executeStream(
    prompt: string,
    options: ClaudeCodeOptions,
    onMessage: (message: StreamMessage) => void,
  ): Promise<ClaudeCodeResult> {
    const args = buildArgs({ outputFormat: 'stream-json', maxTurns: options.maxTurns });
    args.push('--verbose');

    return new Promise<ClaudeCodeResult>((resolve) => {
      const proc = spawn(claudeBin(), args, spawnOpts(options.cwd));

      let buffer = '';
      let sessionId = '';
      let tokenUsage = { input: 0, output: 0 };
      let exitReason: ClaudeCodeResult['exitReason'] = 'completed';

      proc.stdin.write(prompt);
      proc.stdin.end();

      proc.stdout.on('data', (chunk: Buffer) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const evt = JSON.parse(trimmed);
            if (evt.session_id && !sessionId) sessionId = evt.session_id;

            if (evt.type === 'result') {
              tokenUsage = { input: evt.usage?.input_tokens ?? 0, output: evt.usage?.output_tokens ?? 0 };
              exitReason = evt.is_error ? 'error' : 'completed';
            } else {
              onMessage({ type: evt.type as StreamMessage['type'], content: evt, timestamp: Date.now() });
            }
          } catch {
            // skip unparseable lines
          }
        }
      });

      proc.on('error', () => {
        resolve({ sessionId, messages: [], tokenUsage, exitReason: 'error' });
      });

      proc.on('close', () => {
        resolve({ sessionId, messages: [], tokenUsage, exitReason });
      });
    });
  }

  async continueSession(
    sessionId: string,
    prompt: string,
    options: ClaudeCodeOptions,
  ): Promise<ClaudeCodeResult> {
    const args = buildArgs({ outputFormat: 'json', maxTurns: options.maxTurns, resume: sessionId });

    return new Promise<ClaudeCodeResult>((resolve) => {
      const proc = spawn(claudeBin(), args, spawnOpts(options.cwd));

      let stdout = '';

      proc.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
      proc.stdin.write(prompt);
      proc.stdin.end();

      proc.on('error', () => {
        resolve({ sessionId, messages: [], tokenUsage: { input: 0, output: 0 }, exitReason: 'error' });
      });

      proc.on('close', (code) => {
        try {
          if (code !== 0 || !stdout.trim()) {
            return resolve({ sessionId, messages: [], tokenUsage: { input: 0, output: 0 }, exitReason: 'error' });
          }

          const json = JSON.parse(stdout);
          resolve({
            sessionId: json.session_id || sessionId,
            messages: [],
            tokenUsage: { input: json.usage?.input_tokens ?? 0, output: json.usage?.output_tokens ?? 0 },
            exitReason: 'completed',
          });
        } catch {
          resolve({ sessionId, messages: [], tokenUsage: { input: 0, output: 0 }, exitReason: 'error' });
        }
      });
    });
  }
}
