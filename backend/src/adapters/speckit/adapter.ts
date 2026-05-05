import type {
  ISpeckitAdapter,
  SpecifyResult,
  ClarifyResult,
  PlanResult,
  TasksResult,
  ImplementResult,
} from './types';
import type { IClaudeCodeAdapter, StreamMessage } from '../claude-code/types';
import fs from 'fs';
import path from 'path';

export class SpeckitAdapter implements ISpeckitAdapter {
  constructor(private claude: IClaudeCodeAdapter) {}

  async specify(projectPath: string, description: string): Promise<SpecifyResult> {
    const result = await this.claude.execute(
      `/speckit-specify ${description}`,
      { cwd: projectPath, maxTurns: 30 },
    );
    return this.buildSpecifyResult(projectPath, result.sessionId, result.tokenUsage, result.exitReason);
  }

  async clarify(projectPath: string, clarification: string): Promise<ClarifyResult> {
    const prompt = clarification ? `/speckit-clarify ${clarification}` : '/speckit-clarify';
    const result = await this.claude.execute(prompt, { cwd: projectPath, maxTurns: 20 });

    const featureDir = this.findFeatureDirectory(projectPath);
    const specFilePath = featureDir ? path.join(featureDir, 'spec.md') : '';
    const content = specFilePath && fs.existsSync(specFilePath) ? fs.readFileSync(specFilePath, 'utf-8') : '';

    return { specFilePath, questionsAnswered: 0, content, sessionId: result.sessionId, tokenUsage: result.tokenUsage };
  }

  async plan(projectPath: string, guidance?: string): Promise<PlanResult> {
    const prompt = guidance ? `/speckit-plan ${guidance}` : '/speckit-plan';
    const result = await this.claude.execute(prompt, { cwd: projectPath, maxTurns: 50 });

    return this.buildPlanResult(projectPath, result.sessionId, result.tokenUsage);
  }

  async tasks(projectPath: string, constraints?: string): Promise<TasksResult> {
    const prompt = constraints ? `/speckit-tasks ${constraints}` : '/speckit-tasks';
    const result = await this.claude.execute(prompt, { cwd: projectPath, maxTurns: 30 });

    return this.buildTasksResult(projectPath, result.sessionId, result.tokenUsage);
  }

  async implement(projectPath: string, guidance?: string): Promise<ImplementResult> {
    const prompt = guidance ? `/speckit-implement ${guidance}` : '/speckit-implement';
    const result = await this.claude.execute(prompt, { cwd: projectPath, maxTurns: 100 });

    return { completedTasks: 0, failedTasks: 0, changedFiles: [], sessionId: result.sessionId, tokenUsage: result.tokenUsage };
  }

  // Stream variants

  async specifyStream(projectPath: string, description: string, onMessage: (msg: StreamMessage) => void): Promise<SpecifyResult> {
    const result = await this.claude.executeStream(
      `/speckit-specify ${description}`,
      { cwd: projectPath, maxTurns: 30 }, onMessage,
    );
    return this.buildSpecifyResult(projectPath, result.sessionId, result.tokenUsage, result.exitReason);
  }

  async clarifyStream(projectPath: string, clarification: string, onMessage: (msg: StreamMessage) => void): Promise<ClarifyResult> {
    const prompt = clarification ? `/speckit-clarify ${clarification}` : '/speckit-clarify';
    const result = await this.claude.executeStream(prompt, { cwd: projectPath, maxTurns: 20 }, onMessage);

    const featureDir = this.findFeatureDirectory(projectPath);
    const specFilePath = featureDir ? path.join(featureDir, 'spec.md') : '';
    const content = specFilePath && fs.existsSync(specFilePath) ? fs.readFileSync(specFilePath, 'utf-8') : '';

    return { specFilePath, questionsAnswered: 0, content, sessionId: result.sessionId, tokenUsage: result.tokenUsage };
  }

  async planStream(projectPath: string, guidance: string | undefined, onMessage: (msg: StreamMessage) => void): Promise<PlanResult> {
    const prompt = guidance ? `/speckit-plan ${guidance}` : '/speckit-plan';
    const result = await this.claude.executeStream(prompt, { cwd: projectPath, maxTurns: 50 }, onMessage);
    return this.buildPlanResult(projectPath, result.sessionId, result.tokenUsage);
  }

  async tasksStream(projectPath: string, constraints: string | undefined, onMessage: (msg: StreamMessage) => void): Promise<TasksResult> {
    const prompt = constraints ? `/speckit-tasks ${constraints}` : '/speckit-tasks';
    const result = await this.claude.executeStream(prompt, { cwd: projectPath, maxTurns: 30 }, onMessage);
    return this.buildTasksResult(projectPath, result.sessionId, result.tokenUsage);
  }

  async implementStream(projectPath: string, onMessage: (msg: StreamMessage) => void): Promise<ImplementResult> {
    const result = await this.claude.executeStream('/speckit-implement', { cwd: projectPath, maxTurns: 100 }, onMessage);
    return { completedTasks: 0, failedTasks: 0, changedFiles: [], sessionId: result.sessionId, tokenUsage: result.tokenUsage };
  }

  // Helpers

  private buildSpecifyResult(projectPath: string, sessionId: string, tokenUsage: { input: number; output: number }, exitReason?: string) {
    const featureDir = this.findFeatureDirectory(projectPath);
    const specFilePath = featureDir ? path.join(featureDir, 'spec.md') : '';
    const content = specFilePath && fs.existsSync(specFilePath) ? fs.readFileSync(specFilePath, 'utf-8') : '';

    return {
      specFilePath,
      featureDirectory: featureDir || '',
      checklistPath: featureDir ? path.join(featureDir, 'checklists') : '',
      content,
      sessionId,
      tokenUsage,
      exitReason: exitReason || 'completed',
    };
  }

  private buildPlanResult(projectPath: string, sessionId: string, tokenUsage: { input: number; output: number }) {
    const featureDir = this.findFeatureDirectory(projectPath) || path.join(projectPath, 'specs');
    const planPath = path.join(featureDir, 'plan.md');
    const content = fs.existsSync(planPath) ? fs.readFileSync(planPath, 'utf-8') : '';

    return {
      planFilePath: planPath,
      researchFilePath: path.join(featureDir, 'research.md'),
      dataModelFilePath: path.join(featureDir, 'data-model.md'),
      contractsDirectory: path.join(featureDir, 'contracts'),
      quickstartFilePath: path.join(featureDir, 'quickstart.md'),
      content,
      sessionId,
      tokenUsage,
    };
  }

  private buildTasksResult(projectPath: string, sessionId: string, tokenUsage: { input: number; output: number }) {
    const featureDir = this.findFeatureDirectory(projectPath);
    const tasksFilePath = featureDir ? path.join(featureDir, 'tasks.md') : '';
    let taskCount = 0;
    let content = '';

    if (tasksFilePath && fs.existsSync(tasksFilePath)) {
      content = fs.readFileSync(tasksFilePath, 'utf-8');
      const matches = content.match(/^- \[[ x]\]/gm);
      taskCount = matches ? matches.length : 0;
    }

    return { tasksFilePath, taskCount, content, sessionId, tokenUsage };
  }

  private findFeatureDirectory(projectPath: string): string | null {
    const specsDir = path.join(projectPath, 'specs');
    if (!fs.existsSync(specsDir)) return null;

    const entries = fs.readdirSync(specsDir, { withFileTypes: true });
    const featureDir = entries.find(
      (e) => e.isDirectory() && fs.existsSync(path.join(specsDir, e.name, 'spec.md')),
    );

    return featureDir ? path.join(specsDir, featureDir.name) : null;
  }
}
