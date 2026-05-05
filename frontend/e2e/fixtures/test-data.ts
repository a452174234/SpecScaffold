import { test as base, expect, type Page, type BrowserContext } from '@playwright/test';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { v4 as uuid } from 'uuid';

const TEST_DB_PATH = process.env.TEST_DB_PATH || path.join(process.cwd(), '.e2e-test.db');

const API_BASE = 'http://localhost:3000/api';

export interface TestProject {
  id: string;
  name: string;
  path: string;
  type: 'created' | 'imported';
  language: string | null;
  framework: string | null;
}

export interface TestTask {
  id: string;
  task_id: string;
  title: string;
  status: string;
  priority: string;
}

export interface TestAuditLog {
  id: string;
  tool_name: string;
  operation: string;
  risk_level: string;
  audit_result: string;
}

function getTestDb(): Database.Database {
  return new Database(TEST_DB_PATH);
}

export async function createProjectViaAPI(
  request: any,
  name: string,
  projectPath?: string,
): Promise<TestProject> {
  const uniquePath = projectPath || path.join(process.env.TEMP || '/tmp', `e2e-project-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  const res = await request.post(`${API_BASE}/projects`, {
    data: { name, path: uniquePath, type: 'created' },
  });
  const body = await res.json();
  expect(body.success).toBeTruthy();
  return body.data;
}

export async function createImportProjectViaAPI(
  request: any,
  name: string,
  projectPath: string,
): Promise<TestProject> {
  const res = await request.post(`${API_BASE}/projects/import`, {
    data: { name, path: projectPath },
  });
  const body = await res.json();
  return body.data;
}

export function insertTaskDirect(
  projectId: string,
  taskId: string,
  title: string,
  priority: string = 'P2',
  status: string = 'pending',
): TestTask {
  const db = getTestDb();
  try {
    const specId = uuid();
    const planId = uuid();
    const taskIdUuid = uuid();

    db.prepare(
      `INSERT OR IGNORE INTO specs (id, project_id, status, created_at) VALUES (?, ?, 'draft', datetime('now'))`,
    ).run(specId, projectId);

    db.prepare(
      `INSERT OR IGNORE INTO plans (id, spec_id, status, created_at) VALUES (?, ?, 'draft', datetime('now'))`,
    ).run(planId, specId);

    db.prepare(
      `INSERT INTO tasks (id, plan_id, task_id, title, description, priority, status, parallelizable, created_at)
       VALUES (?, ?, ?, ?, '', ?, ?, 0, datetime('now'))`,
    ).run(taskIdUuid, planId, taskId, title, priority, status);

    return { id: taskIdUuid, task_id: taskId, title, status, priority };
  } finally {
    db.close();
  }
}

export function insertAuditLogDirect(
  projectId: string,
  toolName: string,
  operation: string,
  riskLevel: string,
  auditResult: string = 'auto_allowed',
): TestAuditLog {
  const db = getTestDb();
  try {
    const id = uuid();
    db.prepare(
      `INSERT INTO audit_logs (id, project_id, session_id, tool_name, operation, target, risk_level, is_in_project_scope, audit_result, operation_description, timestamp)
       VALUES (?, ?, 'test-session', ?, ?, '', ?, 1, ?, ?, datetime('now'))`,
    ).run(id, projectId, toolName, operation, riskLevel, auditResult, `${operation} description`);
    return { id, tool_name: toolName, operation, risk_level: riskLevel, audit_result: auditResult };
  } finally {
    db.close();
  }
}

export function cleanupProjectData(projectId: string) {
  const db = getTestDb();
  try {
    db.prepare('DELETE FROM audit_logs WHERE project_id = ?').run(projectId);
    db.prepare(
      `DELETE FROM tasks WHERE plan_id IN (SELECT p.id FROM plans p JOIN specs s ON p.spec_id = s.id WHERE s.project_id = ?)`,
    ).run(projectId);
    db.prepare(
      `DELETE FROM plans WHERE spec_id IN (SELECT id FROM specs WHERE project_id = ?)`,
    ).run(projectId);
    db.prepare('DELETE FROM specs WHERE project_id = ?').run(projectId);
    db.prepare('DELETE FROM security_policies WHERE project_id = ?').run(projectId);
    db.prepare('DELETE FROM projects WHERE id = ?').run(projectId);
  } finally {
    db.close();
  }
}
