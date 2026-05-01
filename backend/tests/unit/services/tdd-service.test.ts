import { describe, it, expect, beforeEach } from 'vitest';
import { TddService } from '../../../src/services/tdd-service';
import { getTestDb, cleanTestDb } from '../../setup';

describe('TddService', () => {
  let service: TddService;
  const projectId = `tdd-test-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const planId = `plan-${Date.now()}`;

  beforeEach(() => {
    const db = getTestDb();
    cleanTestDb(db);
    const specId = `spec-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    db.prepare(
      "INSERT INTO projects (id, name, path, type, status, created_at, updated_at) VALUES (?, ?, ?, 'created', 'active', datetime('now'), datetime('now'))",
    ).run(projectId, 'TDD测试项目', '/tmp/tdd-test');
    db.prepare(
      "INSERT INTO specs (id, project_id, status, created_at) VALUES (?, ?, 'draft', datetime('now'))",
    ).run(specId, projectId);
    db.prepare(
      "INSERT INTO plans (id, spec_id, status, created_at) VALUES (?, ?, 'draft', datetime('now'))",
    ).run(planId, specId);
    service = new TddService(db);
  });

  it('应在 pending 状态创建任务', () => {
    const task = service.createTask({
      planId,
      taskId: 'T100',
      title: '测试任务',
      description: '测试描述',
      priority: 'P1',
    });

    expect(task).toBeDefined();
    expect(task.status).toBe('pending');
    expect(task.task_id).toBe('T100');
  });

  it('应允许 pending → testing 转换', () => {
    const task = service.createTask({ planId, taskId: 'T101', title: 'T101', description: '', priority: 'P1' });
    const updated = service.transitionStatus(task.id, 'testing');
    expect(updated).toBe(true);
  });

  it('应拒绝 pending → developing 直接跳转（跳过测试）', () => {
    const task = service.createTask({ planId, taskId: 'T102', title: 'T102', description: '', priority: 'P1' });
    expect(() => service.transitionStatus(task.id, 'developing')).toThrow();
  });

  it('应允许 testing → test_approved 转换', () => {
    const task = service.createTask({ planId, taskId: 'T103', title: 'T103', description: '', priority: 'P1' });
    service.transitionStatus(task.id, 'testing');
    const updated = service.transitionStatus(task.id, 'test_approved');
    expect(updated).toBe(true);
  });

  it('应允许 test_approved → developing 转换', () => {
    const task = service.createTask({ planId, taskId: 'T104', title: 'T104', description: '', priority: 'P1' });
    service.transitionStatus(task.id, 'testing');
    service.transitionStatus(task.id, 'test_approved');
    const updated = service.transitionStatus(task.id, 'developing');
    expect(updated).toBe(true);
  });

  it('应允许 developing → testing_pass 转换', () => {
    const task = service.createTask({ planId, taskId: 'T105', title: 'T105', description: '', priority: 'P1' });
    service.transitionStatus(task.id, 'testing');
    service.transitionStatus(task.id, 'test_approved');
    service.transitionStatus(task.id, 'developing');
    const updated = service.transitionStatus(task.id, 'testing_pass');
    expect(updated).toBe(true);
  });

  it('应允许 testing_pass → completed 转换', () => {
    const task = service.createTask({ planId, taskId: 'T106', title: 'T106', description: '', priority: 'P1' });
    service.transitionStatus(task.id, 'testing');
    service.transitionStatus(task.id, 'test_approved');
    service.transitionStatus(task.id, 'developing');
    service.transitionStatus(task.id, 'testing_pass');
    const updated = service.transitionStatus(task.id, 'completed');
    expect(updated).toBe(true);
  });
});
