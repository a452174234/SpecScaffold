import { describe, it, expect, beforeEach } from 'vitest';
import { ProjectService } from '../../../src/services/project-service';
import { getTestDb, cleanTestDb } from '../../setup';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('ProjectService.import', () => {
  let service: ProjectService;
  let testDir: string;

  beforeEach(() => {
    const db = getTestDb();
    cleanTestDb(db);
    service = new ProjectService(db);
    testDir = path.join(os.tmpdir(), `spec-scaffold-import-test-${Date.now()}`);
  });

  it('应成功导入已有 TypeScript 项目', async () => {
    fs.mkdirSync(testDir, { recursive: true });
    fs.writeFileSync(path.join(testDir, 'package.json'), '{"name":"test","dependencies":{"typescript":"*"}}');
    fs.writeFileSync(path.join(testDir, 'tsconfig.json'), '{}');

    const project = await service.import({
      name: '导入的TS项目',
      path: testDir,
    });

    expect(project).toBeDefined();
    expect(project.name).toBe('导入的TS项目');
    expect(project.type).toBe('imported');
    expect(project.language).toBe('TypeScript');
    expect(project.id).toBeDefined();

    fs.rmSync(testDir, { recursive: true, force: true });
  });

  it('应拒绝不存在的路径', async () => {
    await expect(
      service.import({ name: '不存在', path: '/tmp/non-existent-path-xyz' }),
    ).rejects.toThrow();
  });

  it('应拒绝重复导入同一路径', async () => {
    fs.mkdirSync(testDir, { recursive: true });

    await service.import({ name: '项目A', path: testDir });

    await expect(
      service.import({ name: '项目B', path: testDir }),
    ).rejects.toThrow();

    fs.rmSync(testDir, { recursive: true, force: true });
  });

  it('导入时应识别 Python 项目', async () => {
    fs.mkdirSync(testDir, { recursive: true });
    fs.writeFileSync(path.join(testDir, 'requirements.txt'), 'flask==2.0\nrequests==2.28');
    fs.writeFileSync(path.join(testDir, 'main.py'), 'print("hello")');

    const project = await service.import({ name: 'Python项目', path: testDir });

    expect(project.language).toBe('Python');

    fs.rmSync(testDir, { recursive: true, force: true });
  });
});
