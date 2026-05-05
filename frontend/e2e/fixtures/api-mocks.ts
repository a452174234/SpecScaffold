import type { Page } from '@playwright/test';

const mockSpecifyResponse = {
  success: true,
  data: {
    specId: 'mock-spec-id',
    specFilePath: 'specs/test-feature/spec.md',
    featureDirectory: 'specs/test-feature',
    checklistPath: 'specs/test-feature/checklists',
    content: '# Feature Specification: 测试功能规格\n\n## 概述\n这是一个测试规格文档。',
    sessionId: 'mock-session-specify-001',
    tokenUsage: { input: 1000, output: 2000 },
    exitReason: 'completed',
  },
};

const mockClarifyResponse = {
  success: true,
  data: {
    specFilePath: 'specs/test-feature/spec.md',
    questionsAnswered: 3,
    content: '# Feature Specification: 测试功能规格\n\n## 概述\n这是经过澄清的测试规格文档。',
    sessionId: 'mock-session-clarify-001',
    tokenUsage: { input: 500, output: 1000 },
  },
};

const mockPlanResponse = {
  success: true,
  data: {
    planFilePath: 'specs/test-feature/plan.md',
    researchFilePath: 'specs/test-feature/research.md',
    dataModelFilePath: 'specs/test-feature/data-model.md',
    contractsDirectory: 'specs/test-feature/contracts',
    quickstartFilePath: 'specs/test-feature/quickstart.md',
    content: '# Implementation Plan: 测试功能\n\n## 技术栈\nTypeScript, React',
    sessionId: 'mock-session-plan-001',
    tokenUsage: { input: 2000, output: 3000 },
  },
};

const mockTasksResponse = {
  success: true,
  data: {
    tasksFilePath: 'specs/test-feature/tasks.md',
    taskCount: 3,
    content:
      '## Phase 1: Setup\n\n- [ ] T001 安装依赖\n- [ ] T002 扩展类型定义\n- [ ] T003 添加 SSE 函数',
    sessionId: 'mock-session-tasks-001',
    tokenUsage: { input: 1500, output: 2500 },
  },
};

const mockImplementResponse = {
  success: true,
  data: {
    completedTasks: 3,
    failedTasks: 0,
    changedFiles: ['src/index.ts'],
    tokenUsage: { input: 5000, output: 8000 },
    sessionId: 'mock-session-implement-001',
  },
};

const mockStatusResponse = {
  success: true,
  data: {
    spec: null,
    plan: null,
    taskCount: 0,
    activeJob: null,
  },
};

const mockContentSaveResponse = {
  success: true,
  data: { filePath: 'specs/test-feature/spec.md' },
};

function buildSSEStream(events: Array<{ type: string; content: unknown }>): string {
  const lines = events.map((e) => `data: ${JSON.stringify({ ...e, timestamp: Date.now() })}`);
  lines.push('data: [DONE]');
  return lines.join('\n\n') + '\n\n';
}

export async function mockSddApi(page: Page) {
  await page.route('**/api/projects/*/sdd/specify', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockSpecifyResponse),
    });
  });

  await page.route('**/api/projects/*/sdd/clarify', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockClarifyResponse),
    });
  });

  await page.route('**/api/projects/*/sdd/plan', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockPlanResponse),
    });
  });

  await page.route('**/api/projects/*/sdd/tasks', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockTasksResponse),
    });
  });
}

export async function mockSddSSE(
  page: Page,
  step: string,
  resultContent: Record<string, unknown>,
) {
  const streamBody = buildSSEStream([
    { type: 'init', content: { session_id: `mock-sse-${step}-001` } },
    { type: 'assistant', content: `正在执行 ${step}...` },
    {
      type: 'tool_use',
      content: { tool: 'Write', input: { file_path: `specs/test-feature/${step}.md` } },
    },
    {
      type: 'tool_result',
      content: { tool: 'Write', output: '文件已写入', success: true },
    },
    { type: 'result', content: resultContent },
  ]);

  await page.route(`**/api/projects/*/sdd/${step}/stream`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: streamBody,
    });
  });
}

export async function mockSddExtraEndpoints(page: Page) {
  await page.route('**/api/projects/*/sdd/status', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockStatusResponse),
    });
  });

  await page.route('**/api/projects/*/sdd/content/save', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockContentSaveResponse),
    });
  });

  await page.route('**/api/projects/*/sdd/implement', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockImplementResponse),
    });
  });
}

export async function mockAiApi(page: Page) {
  await page.route('**/api/projects/*/ai/generate-tests', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: { sessionId: 'mock-session-001', tokenUsage: { input: 100, output: 200 } },
      }),
    });
  });

  await page.route('**/api/projects/*/ai/implement', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: { sessionId: 'mock-session-002', tokenUsage: { input: 150, output: 300 } },
      }),
    });
  });

  await page.route('**/api/projects/*/ai/run-tests', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: { sessionId: 'mock-session-003', tokenUsage: { input: 50, output: 100 } },
      }),
    });
  });
}
