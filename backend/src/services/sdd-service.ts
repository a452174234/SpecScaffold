import Database from 'better-sqlite3';
import { v4 as uuid } from 'uuid';
import { SpeckitAdapter } from '../adapters/speckit/adapter';

export class SddService {
  private adapter: SpeckitAdapter;

  constructor(private db: Database.Database) {
    this.adapter = new SpeckitAdapter();
  }

  async specify(projectId: string, description: string) {
    const project = this.getProject(projectId);
    const result = await this.adapter.specify(project.path, description);

    const specId = uuid();
    this.db.prepare(`
      INSERT INTO specs (id, project_id, description, status, created_at)
      VALUES (?, ?, ?, 'draft', datetime('now'))
    `).run(specId, projectId, description);

    return { specId, ...result };
  }

  async clarify(projectId: string, clarification: string) {
    const project = this.getProject(projectId);
    const result = await this.adapter.clarify(project.path, clarification);

    this.db.prepare(`
      UPDATE specs SET status = 'clarified' WHERE project_id = ? AND status = 'draft'
    `).run(projectId);

    return result;
  }

  async plan(projectId: string, guidance?: string) {
    const project = this.getProject(projectId);
    const result = await this.adapter.plan(project.path, guidance);

    const spec = this.db
      .prepare('SELECT id FROM specs WHERE project_id = ? ORDER BY created_at DESC LIMIT 1')
      .get(projectId) as any;

    if (spec) {
      const planId = uuid();
      this.db.prepare(`
        INSERT INTO plans (id, spec_id, status, created_at)
        VALUES (?, ?, 'draft', datetime('now'))
      `).run(planId, spec.id);

      this.db.prepare(`
        UPDATE specs SET status = 'planned' WHERE id = ?
      `).run(spec.id);

      return { planId, ...result };
    }

    return result;
  }

  async tasks(projectId: string, constraints?: string) {
    const project = this.getProject(projectId);
    const result = await this.adapter.tasks(project.path, constraints);

    const plan = this.db
      .prepare('SELECT id FROM plans WHERE spec_id IN (SELECT id FROM specs WHERE project_id = ?) ORDER BY created_at DESC LIMIT 1')
      .get(projectId) as any;

    if (plan) {
      this.db.prepare(`
        UPDATE plans SET status = 'implementing' WHERE id = ?
      `).run(plan.id);

      this.db.prepare(`
        UPDATE specs SET status = 'tasked' WHERE id = (SELECT spec_id FROM plans WHERE id = ?)
      `).run(plan.id);
    }

    return result;
  }

  private getProject(projectId: string) {
    const project = this.db
      .prepare('SELECT * FROM projects WHERE id = ?')
      .get(projectId) as any;
    if (!project) throw new Error('项目不存在');
    return project;
  }
}
