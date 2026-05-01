import Database from 'better-sqlite3';
import { v4 as uuid } from 'uuid';
import { WorkflowStateMachine } from '../core/workflow';

export class TddService {
  constructor(private db: Database.Database) {}

  createTask(input: {
    planId: string;
    taskId: string;
    title: string;
    description: string;
    priority: string;
  }) {
    const id = uuid();
    this.db.prepare(`
      INSERT INTO tasks (id, plan_id, task_id, title, description, priority, status, parallelizable, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', 0, datetime('now'))
    `).run(id, input.planId, input.taskId, input.title, input.description, input.priority);

    return this.getTask(id);
  }

  transitionStatus(taskId: string, newStatus: string): boolean {
    const task = this.getTask(taskId);
    if (!task) throw new Error('任务不存在');

    WorkflowStateMachine.validateTransition(task.status as any, newStatus as any);

    const result = this.db
      .prepare('UPDATE tasks SET status = ? WHERE id = ?')
      .run(newStatus, taskId);
    return result.changes > 0;
  }

  getTask(id: string) {
    return this.db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as any;
  }

  getTasksByProject(projectId: string) {
    return this.db.prepare(`
      SELECT t.* FROM tasks t
      JOIN plans p ON t.plan_id = p.id
      JOIN specs s ON p.spec_id = s.id
      WHERE s.project_id = ?
      ORDER BY t.created_at ASC
    `).all(projectId);
  }
}
