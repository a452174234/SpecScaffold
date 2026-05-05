import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:3000/api';
const PROJECT_PATH = `D:/claude/test/2048-ui-test-${Date.now()}`;
let projectId: string;

test.describe.serial('真实 UI 驱动 SDD 流程 — 2048 游戏', () => {

  test('完整 SDD 流程：Specify → Clarify → Plan → Tasks → Implement', async ({ page }) => {
    test.setTimeout(1800000); // 30 minutes total

    // === Step 0: Create project ===
    const createRes = await page.request.post(`${API_BASE}/projects`, {
      data: { name: '2048小游戏', path: PROJECT_PATH, type: 'created' },
    });
    const createBody = await createRes.json();
    expect(createBody.success).toBeTruthy();
    projectId = createBody.data.id;
    console.log(`Project created: ${projectId}`);

    // Navigate to SDD page
    await page.goto(`http://localhost:5173/projects/${projectId}/sdd`);
    await page.waitForSelector('text=SDD 规格驱动开发流程');

    // === Step 1: Specify ===
    console.log('=== Step 1: Specify ===');
    await page.waitForSelector('text=描述你的功能需求');

    const textarea = page.locator('textarea').first();
    await textarea.fill('2048小游戏：4x4网格，方向键控制数字合并，得分计算，单个HTML文件输出');

    await page.click('text=开始生成');
    console.log('Clicked 开始生成, waiting for specify to complete...');

    // Wait for loading to end (the spin disappears) or MD editor to appear
    // Specify might auto-advance to clarify, so we wait for ANY non-loading state
    await page.waitForFunction(() => {
      // Check if we're past loading - either editor is visible or a card with content
      const editor = document.querySelector('.w-md-editor');
      const confirmBtn = document.querySelector('button');
      return editor || confirmBtn?.textContent?.includes('确认');
    }, { timeout: 300000 });
    console.log('Specify complete');

    // === Step 2: Clarify ===
    console.log('=== Step 2: Clarify ===');
    // Click "确认，进入下一步" if visible
    const confirmBtn1 = page.getByRole('button', { name: '确认，进入下一步' });
    if (await confirmBtn1.isVisible().catch(() => false)) {
      await confirmBtn1.click();
      console.log('Clicked confirm for clarify');
    }

    // Wait for clarify to complete
    await page.waitForFunction(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.some(b => b.textContent?.includes('确认，进入下一步') && !b.closest('.ant-spin'));
    }, { timeout: 300000 });
    console.log('Clarify complete');

    // === Step 3: Plan ===
    console.log('=== Step 3: Plan ===');
    const confirmBtn2 = page.getByRole('button', { name: '确认，进入下一步' });
    if (await confirmBtn2.isVisible().catch(() => false)) {
      await confirmBtn2.click();
      console.log('Clicked confirm for plan');
    }

    // Wait for plan to complete — look for next confirm or task list
    await page.waitForFunction(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.some(b => b.textContent?.includes('确认') || b.textContent?.includes('生成任务') || b.textContent?.includes('开始执行'));
    }, { timeout: 580000 });
    console.log('Plan complete');

    // Click any remaining confirm buttons to advance to tasks
    const confirmBtn3 = page.getByRole('button', { name: '确认，进入下一步' });
    if (await confirmBtn3.isVisible().catch(() => false)) {
      await confirmBtn3.click();
      console.log('Clicked confirm for tasks');
    }

    // Wait for tasks to complete
    await page.waitForFunction(() => {
      return !!document.querySelector('[data-testid="task-card"]');
    }, { timeout: 300000 });

    const taskCards = page.locator('[data-testid="task-card"]');
    const taskCount = await taskCards.count();
    console.log(`Tasks complete - ${taskCount} task cards found`);

    // === Step 5: Implement ===
    console.log('=== Step 5: Implement ===');
    await page.click('text=开始执行');
    console.log('Clicked 开始执行, waiting for implement...');

    // Wait for implement to complete — success alert
    await page.waitForSelector('.ant-alert-success', { timeout: 1700000 });
    console.log('Implement complete!');
  });

  test('Verify generated files on disk', async () => {
    const fs = require('fs');
    const path = require('path');

    const files: string[] = fs.readdirSync(PROJECT_PATH, { recursive: true });
    const allFiles = files.filter((f: string) => !String(f).startsWith('.claude'));
    console.log('Generated files:', allFiles);

    const htmlFiles = files.filter((f: string) => String(f).endsWith('.html'));
    console.log(`HTML files: ${htmlFiles.length}`);

    if (htmlFiles.length > 0) {
      const htmlPath = path.join(PROJECT_PATH, String(htmlFiles[0]));
      const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
      console.log(`HTML size: ${htmlContent.length} chars`);
      expect(htmlContent.length).toBeGreaterThan(500);
    }

    const specsDir = path.join(PROJECT_PATH, 'specs');
    expect(fs.existsSync(specsDir)).toBeTruthy();
    const specFiles = fs.readdirSync(specsDir, { recursive: true });
    console.log('Spec files:', specFiles);
    expect(specFiles.length).toBeGreaterThan(0);
  });
});
