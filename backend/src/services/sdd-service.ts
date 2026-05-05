import Database from 'better-sqlite3';
import { v4 as uuid } from 'uuid';
import { SpeckitAdapter } from '../adapters/speckit/adapter';
import { ClaudeCodeAdapter } from '../adapters/claude-code/adapter';
import type { StreamMessage } from '../adapters/claude-code/types';

interface SddJob {
  projectId: string;
  step: string;
  status: 'running' | 'completed' | 'failed';
  sessionId: string;
  startedAt: number;
  result: any;
}

const jobs = new Map<string, SddJob>();

export class SddService {
  private adapter: SpeckitAdapter;

  constructor(private db: Database.Database) {
    const claude = new ClaudeCodeAdapter();
    this.adapter = new SpeckitAdapter(claude);
  }

  async specify(projectId: string, description: string) {
    const project = this.getProject(projectId);
    const result = await this.adapter.specify(project.path, description);

    const specId = uuid();
    this.db.prepare(`
      INSERT INTO specs (id, project_id, description, spec_file_path, content, session_id, token_usage, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', datetime('now'))
    `).run(specId, projectId, description, result.specFilePath, result.content, result.sessionId, JSON.stringify(result.tokenUsage));

    return { specId, ...result };
  }

  async clarify(projectId: string, clarification: string) {
    const project = this.getProject(projectId);
    const result = await this.adapter.clarify(project.path, clarification);

    this.db.prepare(`
      UPDATE specs SET status = 'clarified', content = ?, session_id = ?, token_usage = ? WHERE project_id = ? AND status = 'draft'
    `).run(result.content, result.sessionId, JSON.stringify(result.tokenUsage), projectId);

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
        INSERT INTO plans (id, spec_id, plan_file_path, content, session_id, token_usage, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 'draft', datetime('now'))
      `).run(planId, spec.id, result.planFilePath, result.content, result.sessionId, JSON.stringify(result.tokenUsage));

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

  async streamStep(
    projectId: string,
    step: string,
    body: Record<string, string>,
    onMessage: (msg: StreamMessage) => void,
  ) {
    const project = this.getProject(projectId);
    const jobKey = `${projectId}:${step}`;

    jobs.set(jobKey, {
      projectId,
      step,
      status: 'running',
      sessionId: '',
      startedAt: Date.now(),
      result: null,
    });

    let result: any;
    try {
      switch (step) {
        case 'specify':
          result = await this.adapter.specifyStream(project.path, body.description || '', onMessage);
          break;
        case 'clarify':
          result = await this.adapter.clarifyStream(project.path, body.clarification || '', onMessage);
          break;
        case 'plan':
          result = await this.adapter.planStream(project.path, body.guidance, onMessage);
          break;
        case 'tasks':
          result = await this.adapter.tasksStream(project.path, body.constraints, onMessage);
          break;
        case 'implement':
          result = await this.adapter.implementStream(project.path, onMessage);
          break;
        default:
          throw new Error(`未知的 SDD 步骤: ${step}`);
      }

      this.persistStepResult(projectId, step, result);

      jobs.set(jobKey, {
        projectId,
        step,
        status: 'completed',
        sessionId: result.sessionId,
        startedAt: jobs.get(jobKey)!.startedAt,
        result,
      });
    } catch (err: any) {
      jobs.set(jobKey, {
        projectId,
        step,
        status: 'failed',
        sessionId: '',
        startedAt: jobs.get(jobKey)!.startedAt,
        result: { error: err.message },
      });
      throw err;
    }

    return result;
  }

  async saveContent(projectId: string, step: string, content: string) {
    const project = this.getProject(projectId);

    if (step === 'specify' || step === 'clarify') {
      const spec = this.db
        .prepare('SELECT id, spec_file_path FROM specs WHERE project_id = ? ORDER BY created_at DESC LIMIT 1')
        .get(projectId) as any;
      if (spec?.spec_file_path) {
        const fs = await import('fs');
        const specDir = require('path').dirname(spec.spec_file_path);
        if (!fs.existsSync(specDir)) fs.mkdirSync(specDir, { recursive: true });
        fs.writeFileSync(spec.spec_file_path, content, 'utf-8');
      }
      if (spec) {
        this.db.prepare('UPDATE specs SET content = ? WHERE id = ?').run(content, spec.id);
      }
      return spec?.spec_file_path || '';
    }

    if (step === 'plan') {
      const plan = this.db
        .prepare('SELECT id, plan_file_path FROM plans WHERE spec_id IN (SELECT id FROM specs WHERE project_id = ?) ORDER BY created_at DESC LIMIT 1')
        .get(projectId) as any;
      if (plan?.plan_file_path) {
        const fs = await import('fs');
        const planDir = require('path').dirname(plan.plan_file_path);
        if (!fs.existsSync(planDir)) fs.mkdirSync(planDir, { recursive: true });
        fs.writeFileSync(plan.plan_file_path, content, 'utf-8');
      }
      if (plan) {
        this.db.prepare('UPDATE plans SET content = ? WHERE id = ?').run(content, plan.id);
      }
      return plan?.plan_file_path || '';
    }

    return '';
  }

  getStatus(projectId: string) {
    const spec = this.db
      .prepare('SELECT status, content FROM specs WHERE project_id = ? ORDER BY created_at DESC LIMIT 1')
      .get(projectId) as any;

    const plan = this.db
      .prepare('SELECT status, content FROM plans WHERE spec_id IN (SELECT id FROM specs WHERE project_id = ?) ORDER BY created_at DESC LIMIT 1')
      .get(projectId) as any;

    const taskCount = this.db
      .prepare('SELECT COUNT(*) as count FROM tasks WHERE plan_id IN (SELECT id FROM plans WHERE spec_id IN (SELECT id FROM specs WHERE project_id = ?))')
      .get(projectId) as any;

    const activeJob = Array.from(jobs.values()).find(
      (j) => j.projectId === projectId && j.status === 'running',
    );

    return {
      spec: spec ? { status: spec.status, content: spec.content } : null,
      plan: plan ? { status: plan.status, content: plan.content } : null,
      taskCount: taskCount?.count || 0,
      activeJob: activeJob ? { step: activeJob.step, status: activeJob.status } : null,
    };
  }

  /**
   * Scan project directory for existing Spec Kit files and load their contents.
   * Used for imported projects that already have specs/ directories.
   */
  scanExistingSpecs(projectId: string) {
    const project = this.getProject(projectId);
    const fs = require('fs');
    const path = require('path');

    const specsDir = path.join(project.path, 'specs');
    if (!fs.existsSync(specsDir)) {
      return { hasExistingSpecs: false, steps: {} };
    }

    const steps: Record<string, { content: string; filePath: string }> = {};

    // Find feature directory with spec.md
    const entries = fs.readdirSync(specsDir, { withFileTypes: true });
    const featureDir = entries.find(
      (e: any) => e.isDirectory() && fs.existsSync(path.join(specsDir, e.name, 'spec.md')),
    );

    if (featureDir) {
      const featurePath = path.join(specsDir, featureDir.name);

      // Read spec.md (specify + clarify result)
      const specPath = path.join(featurePath, 'spec.md');
      if (fs.existsSync(specPath)) {
        steps.specify = { content: fs.readFileSync(specPath, 'utf-8'), filePath: specPath };
        steps.clarify = { content: fs.readFileSync(specPath, 'utf-8'), filePath: specPath };
      }

      // Read plan.md (plan result)
      const planPath = path.join(featurePath, 'plan.md');
      if (fs.existsSync(planPath)) {
        steps.plan = { content: fs.readFileSync(planPath, 'utf-8'), filePath: planPath };
      }

      // Read tasks.md (tasks result)
      const tasksPath = path.join(featurePath, 'tasks.md');
      if (fs.existsSync(tasksPath)) {
        steps.tasks = { content: fs.readFileSync(tasksPath, 'utf-8'), filePath: tasksPath };
      }
    }

    const hasExistingSpecs = Object.keys(steps).length > 0;

    // Auto-detect progress level
    let detectedStep = 0;
    if (steps.tasks) detectedStep = 3;
    else if (steps.plan) detectedStep = 2;
    else if (steps.specify) detectedStep = 1;

    return { hasExistingSpecs, steps, detectedStep };
  }

  async implement(projectId: string) {
    const project = this.getProject(projectId);
    return this.adapter.implement(project.path);
  }

  private persistStepResult(projectId: string, step: string, result: any) {
    if (step === 'specify') {
      const specId = uuid();
      this.db.prepare(`
        INSERT INTO specs (id, project_id, description, spec_file_path, content, session_id, token_usage, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', datetime('now'))
      `).run(specId, projectId, '', result.specFilePath, result.content, result.sessionId, JSON.stringify(result.tokenUsage));
    } else if (step === 'clarify') {
      this.db.prepare(`
        UPDATE specs SET status = 'clarified', content = ?, session_id = ?, token_usage = ? WHERE project_id = ? AND status = 'draft'
      `).run(result.content, result.sessionId, JSON.stringify(result.tokenUsage), projectId);
    } else if (step === 'plan') {
      const spec = this.db
        .prepare('SELECT id FROM specs WHERE project_id = ? ORDER BY created_at DESC LIMIT 1')
        .get(projectId) as any;
      if (spec) {
        const planId = uuid();
        this.db.prepare(`
          INSERT INTO plans (id, spec_id, plan_file_path, content, session_id, token_usage, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, 'draft', datetime('now'))
        `).run(planId, spec.id, result.planFilePath, result.content, result.sessionId, JSON.stringify(result.tokenUsage));
        this.db.prepare('UPDATE specs SET status = \'planned\' WHERE id = ?').run(spec.id);
      }
    } else if (step === 'tasks') {
      const plan = this.db
        .prepare('SELECT id FROM plans WHERE spec_id IN (SELECT id FROM specs WHERE project_id = ?) ORDER BY created_at DESC LIMIT 1')
        .get(projectId) as any;
      if (plan) {
        this.db.prepare('UPDATE plans SET status = \'implementing\' WHERE id = ?').run(plan.id);
        this.db.prepare('UPDATE specs SET status = \'tasked\' WHERE id = (SELECT spec_id FROM plans WHERE id = ?)').run(plan.id);
      }
    }
  }

  private getProject(projectId: string) {
    const project = this.db
      .prepare('SELECT * FROM projects WHERE id = ?')
      .get(projectId) as any;
    if (!project) throw new Error('项目不存在');
    return project;
  }
}
