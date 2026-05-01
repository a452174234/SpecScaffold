import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { setDb } from '../src/db';

const TEST_DATA_DIR = path.join(os.homedir(), '.spec-scaffold-test');
const TEST_DB_PATH = path.join(TEST_DATA_DIR, 'test.db');

let db: Database.Database;

export function getTestDb(): Database.Database {
  if (!db) {
    if (!fs.existsSync(TEST_DATA_DIR)) {
      fs.mkdirSync(TEST_DATA_DIR, { recursive: true });
    }
    db = new Database(TEST_DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initTables(db);
    setDb(db);
  }
  return db;
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
    CREATE TABLE IF NOT EXISTS specs (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id),
      branch TEXT,
      description TEXT,
      spec_file_path TEXT,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'clarified', 'planned', 'tasked')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS plans (
      id TEXT PRIMARY KEY,
      spec_id TEXT NOT NULL REFERENCES specs(id),
      plan_file_path TEXT,
      tech_stack TEXT,
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
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

export function cleanTestDb(database: Database.Database) {
  database.exec(`
    DELETE FROM tasks;
    DELETE FROM plans;
    DELETE FROM specs;
    DELETE FROM audit_logs;
    DELETE FROM security_policies;
    DELETE FROM projects;
  `);
}

afterAll(() => {
  if (db) {
    cleanTestDb(db);
  }
});
