const API_BASE = 'http://localhost:3000/api';

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: { message: `请求失败 (${res.status})` } }));
    throw new Error(body.error?.message || `请求失败 (${res.status})`);
  }
  return res.json();
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: { message: `请求失败 (${res.status})` } }));
    throw new Error(data.error?.message || `请求失败 (${res.status})`);
  }
  return res.json();
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: { message: `请求失败 (${res.status})` } }));
    throw new Error(data.error?.message || `请求失败 (${res.status})`);
  }
  return res.json();
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: { message: `请求失败 (${res.status})` } }));
    throw new Error(data.error?.message || `请求失败 (${res.status})`);
  }
  return res.json();
}

export interface SSEEvent {
  type: 'init' | 'assistant' | 'tool_use' | 'tool_result' | 'result';
  content: unknown;
  timestamp: number;
}

export async function apiPostSSE(
  path: string,
  body: unknown,
  onMessage: (event: SSEEvent) => void,
  onError?: (error: Error) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: { message: `请求失败 (${res.status})` } }));
    const err = new Error(data.error?.message || `请求失败 (${res.status})`);
    onError?.(err);
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    onError?.(new Error('无法读取响应流'));
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === 'data: [DONE]') continue;
      if (trimmed.startsWith('data: ')) {
        try {
          const event = JSON.parse(trimmed.slice(6)) as SSEEvent;
          onMessage(event);
        } catch {
          // skip malformed JSON
        }
      }
    }
  }
}

export type WebSocketEvent = {
  type: string;
  data: unknown;
};

export function createWebSocket(onMessage: (event: WebSocketEvent) => void) {
  const ws = new WebSocket('ws://localhost:3000/ws');

  ws.onmessage = (event) => {
    try {
      const parsed = JSON.parse(event.data);
      onMessage(parsed);
    } catch {
      console.error('无效的 WebSocket 消息');
    }
  };

  ws.onclose = () => {
    setTimeout(() => createWebSocket(onMessage), 3000);
  };

  return ws;
}
