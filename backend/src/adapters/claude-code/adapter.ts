import type {
  IClaudeCodeAdapter,
  ClaudeCodeOptions,
  ClaudeCodeResult,
  StreamMessage,
} from './types';

export class ClaudeCodeAdapter implements IClaudeCodeAdapter {
  async execute(prompt: string, options: ClaudeCodeOptions): Promise<ClaudeCodeResult> {
    try {
      const { query } = await import('@anthropic-ai/claude-code');
      const result = await query({
        prompt,
        options: {
          cwd: options.cwd,
          maxTurns: options.maxTurns,
          allowedTools: options.allowedTools,
          disallowedTools: options.disallowedTools,
          systemPrompt: options.systemPrompt,
          appendSystemPrompt: options.appendSystemPrompt,
        },
      });

      return {
        sessionId: result.sessionId || '',
        messages: result.messages || [],
        tokenUsage: {
          input: result.tokenUsage?.input ?? 0,
          output: result.tokenUsage?.output ?? 0,
        },
        exitReason: result.exitReason || 'completed',
      };
    } catch (err: any) {
      return {
        sessionId: '',
        messages: [],
        tokenUsage: { input: 0, output: 0 },
        exitReason: 'error',
      };
    }
  }

  async executeStream(
    prompt: string,
    options: ClaudeCodeOptions,
    onMessage: (message: StreamMessage) => void,
  ): Promise<ClaudeCodeResult> {
    const result = await this.execute(prompt, options);

    onMessage({
      type: 'result',
      content: result.messages,
      timestamp: Date.now(),
    });

    return result;
  }

  async continueSession(
    sessionId: string,
    prompt: string,
    options: ClaudeCodeOptions,
  ): Promise<ClaudeCodeResult> {
    return this.execute(prompt, { ...options, systemPrompt: `继续会话 ${sessionId}` });
  }
}
