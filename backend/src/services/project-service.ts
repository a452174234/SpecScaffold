import Database from 'better-sqlite3';
import { v4 as uuid } from 'uuid';
import fs from 'fs';
import path from 'path';
import { CreateProjectInput, type Project } from '../models/project';
import { ProjectScanner } from './project-scanner';
import z from 'zod';

export class ProjectService {
  constructor(private db: Database.Database) {}

  async create(input: { name: string; path: string; type: string }): Promise<Project> {
    const parsed = CreateProjectInput.safeParse(input);
    if (!parsed.success) {
      throw new Error(parsed.error.issues.map((i) => i.message).join('; '));
    }

    const { name, path: projectPath, type } = parsed.data;

    const existing = this.db
      .prepare('SELECT id FROM projects WHERE path = ?')
      .get(projectPath);
    if (existing) {
      throw new Error('该项目路径已存在');
    }

    const id = uuid();
    const now = new Date().toISOString();

    if (type === 'created') {
      this.ensureProjectDir(projectPath);
    }

    this.ensureClaudeSkillsJunction(projectPath);

    const insertProject = this.db.prepare(`
      INSERT INTO projects (id, name, path, type, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'active', ?, ?)
    `);

    const insertPolicy = this.db.prepare(`
      INSERT INTO security_policies (id, project_id, project_path, high_risk_tools, high_risk_patterns, read_only_external_tools, created_at)
      VALUES (?, ?, ?, '["Bash","Write","Edit"]', '[]', '["Read","Glob","Grep"]', ?)
    `);

    const transaction = this.db.transaction(() => {
      insertProject.run(id, name, projectPath, type, now, now);
      insertPolicy.run(uuid(), id, projectPath, now);
    });

    transaction();

    return this.getById(id) as Promise<Project>;
  }

  async list(): Promise<Project[]> {
    const rows = this.db
      .prepare('SELECT * FROM projects WHERE status = ? ORDER BY created_at DESC')
      .all('active');
    return rows.map(this.mapRow);
  }

  async getById(id: string): Promise<Project | null> {
    const row = this.db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    if (!row) return null;
    return this.mapRow(row as any);
  }

  async import(input: { name: string; path: string }): Promise<Project> {
    const { name, path: projectPath } = input;

    if (!name || !projectPath) {
      throw new Error('项目名称和路径不能为空');
    }

    if (!fs.existsSync(projectPath)) {
      throw new Error('指定的路径不存在');
    }

    const existing = this.db
      .prepare('SELECT id FROM projects WHERE path = ?')
      .get(projectPath);
    if (existing) {
      throw new Error('该项目路径已存在');
    }

    const scanner = new ProjectScanner();
    const { language, framework } = scanner.scan(projectPath);

    const id = uuid();
    const now = new Date().toISOString();

    const insertProject = this.db.prepare(`
      INSERT INTO projects (id, name, path, type, language, framework, status, created_at, updated_at)
      VALUES (?, ?, ?, 'imported', ?, ?, 'active', ?, ?)
    `);

    const insertPolicy = this.db.prepare(`
      INSERT INTO security_policies (id, project_id, project_path, high_risk_tools, high_risk_patterns, read_only_external_tools, created_at)
      VALUES (?, ?, ?, '["Bash","Write","Edit"]', '[]', '["Read","Glob","Grep"]', ?)
    `);

    const transaction = this.db.transaction(() => {
      insertProject.run(id, name, projectPath, language, framework, now, now);
      insertPolicy.run(uuid(), id, projectPath, now);
    });

    transaction();

    this.ensureClaudeSkillsJunction(projectPath);

    return (await this.getById(id))!;
  }

  async archive(id: string): Promise<boolean> {
    const result = this.db
      .prepare("UPDATE projects SET status = 'archived', updated_at = ? WHERE id = ?")
      .run(new Date().toISOString(), id);
    return result.changes > 0;
  }

  private ensureProjectDir(projectPath: string) {
    if (!fs.existsSync(projectPath)) {
      fs.mkdirSync(projectPath, { recursive: true });
      const specsDir = path.join(projectPath, 'specs');
      if (!fs.existsSync(specsDir)) {
        fs.mkdirSync(specsDir, { recursive: true });
      }
    }
  }

  private mapRow(row: any): Project {
    return {
      id: row.id,
      name: row.name,
      path: row.path,
      type: row.type,
      language: row.language,
      framework: row.framework,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private ensureClaudeSkillsJunction(projectPath: string) {
    const projectClaudeDir = path.join(projectPath, '.claude', 'skills');
    if (fs.existsSync(projectClaudeDir)) return;

    const platformSkillsDir = path.resolve(process.cwd(), '.claude', 'skills');
    if (!fs.existsSync(platformSkillsDir)) return;

    const parentDir = path.dirname(projectClaudeDir);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    // Try junction/symlink first, fallback to copy
    try {
      fs.symlinkSync(platformSkillsDir, projectClaudeDir, 'junction');
      return;
    } catch {
      // symlink/junction not supported (e.g. exFAT), fall through to copy
    }

    try {
      fs.cpSync(platformSkillsDir, projectClaudeDir, { recursive: true });
    } catch {
      // copy also failed, best-effort
    }
  }
}
