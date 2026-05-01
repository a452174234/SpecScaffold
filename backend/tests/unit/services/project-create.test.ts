import { describe, it, expect, beforeEach } from 'vitest';
import { ProjectService } from '../../../src/services/project-service';
import { getTestDb, cleanTestDb } from '../../setup';

describe('ProjectService.create', () => {
  let service: ProjectService;

  beforeEach(() => {
    const db = getTestDb();
    cleanTestDb(db);
    service = new ProjectService(db);
  });

  it('应成功创建新项目并返回项目记录', async () => {
    const project = await service.create({
      name: '测试项目',
      path: '/tmp/test-project',
      type: 'created',
    });

    expect(project).toBeDefined();
    expect(project.name).toBe('测试项目');
    expect(project.path).toBe('/tmp/test-project');
    expect(project.type).toBe('created');
    expect(project.status).toBe('active');
    expect(project.id).toBeDefined();
  });

  it('创建项目时应生成对应目录结构', async () => {
    const tmpDir = `/tmp/spec-scaffold-test-${Date.now()}`;
    const project = await service.create({
      name: '目录测试',
      path: tmpDir,
      type: 'created',
    });

    expect(project.path).toBe(tmpDir);
  });

  it('应拒绝空项目名称', async () => {
    await expect(
      service.create({ name: '', path: '/tmp/test', type: 'created' }),
    ).rejects.toThrow();
  });

  it('应拒绝空项目路径', async () => {
    await expect(
      service.create({ name: '测试', path: '', type: 'created' }),
    ).rejects.toThrow();
  });

  it('应拒绝重复的项目路径', async () => {
    await service.create({
      name: '项目A',
      path: '/tmp/duplicate-path',
      type: 'created',
    });

    await expect(
      service.create({
        name: '项目B',
        path: '/tmp/duplicate-path',
        type: 'created',
      }),
    ).rejects.toThrow();
  });

  it('应同时创建默认安全策略', async () => {
    const project = await service.create({
      name: '安全测试',
      path: '/tmp/security-test',
      type: 'created',
    });

    const db = getTestDb();
    const policy = db
      .prepare('SELECT * FROM security_policies WHERE project_id = ?')
      .get(project.id) as any;

    expect(policy).toBeDefined();
    expect(policy.project_path).toBe('/tmp/security-test');
  });
});
