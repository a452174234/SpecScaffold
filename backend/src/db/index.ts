import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';
import fs from 'fs';

const DATA_DIR = path.join(os.homedir(), '.spec-scaffold');
const DB_PATH = process.env.TEST_DB_PATH || path.join(DATA_DIR, 'data.db');

let db: Database.Database | null = null;

export function getDb(dbPath?: string): Database.Database {
  if (!db) {
    const resolvedPath = dbPath ?? DB_PATH;
    const dir = path.dirname(resolvedPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    db = new Database(resolvedPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initTables(db);
  }
  return db;
}

export function setDb(instance: Database.Database) {
  db = instance;
}

function initTables(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      path TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL CHECK(type IN ('created', 'imported')),
      language TEXT,
      framework TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'archived')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS specs (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id),
      branch TEXT,
      description TEXT,
      spec_file_path TEXT,
      content TEXT,
      session_id TEXT,
      token_usage TEXT,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'clarified', 'planned', 'tasked')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS plans (
      id TEXT PRIMARY KEY,
      spec_id TEXT NOT NULL REFERENCES specs(id),
      plan_file_path TEXT,
      tech_stack TEXT,
      content TEXT,
      session_id TEXT,
      token_usage TEXT,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'approved', 'implementing', 'completed')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      plan_id TEXT NOT NULL REFERENCES plans(id),
      task_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT CHECK(priority IN ('P1', 'P2', 'P3')),
      story_label TEXT,
      parallelizable INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'testing', 'test_approved', 'developing', 'testing_pass', 'completed')),
      test_file_path TEXT,
      impl_file_path TEXT,
      dependencies TEXT,
      order_index INTEGER,
      content TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS security_policies (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL UNIQUE REFERENCES projects(id),
      project_path TEXT NOT NULL,
      high_risk_tools TEXT NOT NULL DEFAULT '[]',
      high_risk_patterns TEXT NOT NULL DEFAULT '[]',
      read_only_external_tools TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id),
      session_id TEXT,
      tool_name TEXT NOT NULL,
      operation TEXT NOT NULL,
      target TEXT,
      risk_level TEXT NOT NULL CHECK(risk_level IN ('read_only', 'low', 'high', 'blocked')),
      is_in_project_scope INTEGER NOT NULL DEFAULT 1,
      audit_result TEXT NOT NULL CHECK(audit_result IN ('auto_allowed', 'user_approved', 'user_rejected', 'blocked')),
      operation_description TEXT,
      user_feedback TEXT,
      timestamp TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_projects_path ON projects(path);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_project ON audit_logs(project_id, timestamp);
    CREATE INDEX IF NOT EXISTS idx_tasks_plan ON tasks(plan_id, status);
    CREATE INDEX IF NOT EXISTS idx_specs_project ON specs(project_id, status);
  `);
}
