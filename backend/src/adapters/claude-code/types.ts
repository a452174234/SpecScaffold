export interface ClaudeCodeOptions {
  cwd: string;
  maxTurns?: number;
  allowedTools?: string[];
  disallowedTools?: string[];
  systemPrompt?: string;
  appendSystemPrompt?: string;
  model?: string;
}

export interface ClaudeCodeResult {
  sessionId: string;
  messages: unknown[];
  tokenUsage: { input: number; output: number };
  exitReason: 'completed' | 'max_turns' | 'error';
}

export interface StreamMessage {
  type: 'init' | 'user' | 'assistant' | 'tool_use' | 'tool_result' | 'result';
  content: unknown;
  timestamp: number;
}

export interface IClaudeCodeAdapter {
  execute(prompt: string, options: ClaudeCodeOptions): Promise<ClaudeCodeResult>;
  executeStream(
    prompt: string,
    options: ClaudeCodeOptions,
    onMessage: (message: StreamMessage) => void,
  ): Promise<ClaudeCodeResult>;
  continueSession(sessionId: string, prompt: string, options: ClaudeCodeOptions): Promise<ClaudeCodeResult>;
}
