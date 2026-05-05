import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const API_BASE = 'http://localhost:3000/api';
const PROJECT_PATH = `D:/claude/test/2048-real-test`;
let projectId: string;

test.describe.serial('真实 Claude Code SDD 验证 — 2048 游戏', () => {

  test('Step 0: 创建项目', async ({ request }) => {
    const res = await request.post(`${API_BASE}/projects`, {
      data: { name: '2048小游戏', path: PROJECT_PATH, type: 'created' },
    });
    const body = await res.json();
    expect(body.success).toBeTruthy();
    projectId = body.data.id;
    console.log(`项目已创建: ${projectId}`);
  });

  test('Step 1: Specify — 生成功能规格', async ({ request }) => {
    test.setTimeout(600000);
    const res = await request.post(`${API_BASE}/projects/${projectId}/sdd/specify`, {
      data: { description: '2048 小游戏：4x4 网格，方向键控制数字合并，得分计算，单个 HTML 文件输出，包含完整的游戏逻辑和 CSS 样式' },
      timeout: 580000,
    });
    const body = await res.json();
    console.log('Specify:', body.success, 'chars:', body.data?.content?.length, 'tokens:', JSON.stringify(body.data?.tokenUsage));
    expect(body.success).toBeTruthy();
    expect(body.data.content).toBeTruthy();
  });

  test('Step 2: Clarify — 澄清规格', async ({ request }) => {
    test.setTimeout(300000);
    const res = await request.post(`${API_BASE}/projects/${projectId}/sdd/clarify`, {
      data: { clarification: '' },
      timeout: 280000,
    });
    const body = await res.json();
    console.log('Clarify:', body.success, 'chars:', body.data?.content?.length);
    expect(body.success).toBeTruthy();
    expect(body.data.content).toBeTruthy();
  });

  test('Step 3: Plan — 生成实施计划', async ({ request }) => {
    test.setTimeout(600000);
    const res = await request.post(`${API_BASE}/projects/${projectId}/sdd/plan`, {
      data: { guidance: '' },
      timeout: 580000,
    });
    const body = await res.json();
    console.log('Plan:', body.success, 'chars:', body.data?.content?.length);
    expect(body.success).toBeTruthy();
    expect(body.data.content).toBeTruthy();
  });

  test('Step 4: Tasks — 生成任务列表', async ({ request }) => {
    test.setTimeout(300000);
    const res = await request.post(`${API_BASE}/projects/${projectId}/sdd/tasks`, {
      data: { constraints: '' },
      timeout: 280000,
    });
    const body = await res.json();
    console.log('Tasks:', body.success, 'count:', body.data?.taskCount);
    expect(body.success).toBeTruthy();
    expect(body.data.taskCount).toBeGreaterThan(0);
  });

  test('Step 5: Implement — 执行实现', async ({ request }) => {
    test.setTimeout(1800000);
    const res = await request.post(`${API_BASE}/projects/${projectId}/sdd/implement`, {
      data: {},
      timeout: 1780000,
    });
    const body = await res.json();
    console.log('Implement:', body.success);
    expect(body.success).toBeTruthy();
  });

  test('Step 6: 验证 2048 游戏文件已生成', async () => {

    const files = fs.readdirSync(PROJECT_PATH, { recursive: true });
    const allFiles = files.filter((f: string) => !String(f).startsWith('.claude'));
    console.log('Generated files:', allFiles);

    const htmlFiles = files.filter((f: string) => String(f).endsWith('.html'));
    console.log(`HTML files found: ${htmlFiles.length}`);

    if (htmlFiles.length > 0) {
      const htmlPath = path.join(PROJECT_PATH, String(htmlFiles[0]));
      const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
      console.log(`HTML file size: ${htmlContent.length} chars`);
      expect(htmlContent.length).toBeGreaterThan(500);
    }

    // Verify specs directory exists with files
    const specsDir = path.join(PROJECT_PATH, 'specs');
    expect(fs.existsSync(specsDir)).toBeTruthy();
    const specFiles = fs.readdirSync(specsDir, { recursive: true });
    expect(specFiles.length).toBeGreaterThan(0);
  });
});
