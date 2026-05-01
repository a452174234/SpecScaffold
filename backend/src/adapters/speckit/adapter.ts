import type {
  ISpeckitAdapter,
  SpecifyResult,
  ClarifyResult,
  PlanResult,
  TasksResult,
  ImplementResult,
} from './types';
import fs from 'fs';
import path from 'path';

export class SpeckitAdapter implements ISpeckitAdapter {
  async specify(projectPath: string, description: string): Promise<SpecifyResult> {
    const featureDir = this.findFeatureDirectory(projectPath);
    const specFilePath = featureDir ? path.join(featureDir, 'spec.md') : '';
    const checklistPath = featureDir ? path.join(featureDir, 'checklists') : '';

    return {
      specFilePath,
      featureDirectory: featureDir || '',
      checklistPath,
    };
  }

  async clarify(projectPath: string, clarification: string): Promise<ClarifyResult> {
    const featureDir = this.findFeatureDirectory(projectPath);
    return {
      specFilePath: featureDir ? path.join(featureDir, 'spec.md') : '',
      questionsAnswered: 0,
    };
  }

  async plan(projectPath: string, guidance?: string): Promise<PlanResult> {
    const featureDir = this.findFeatureDirectory(projectPath) || path.join(projectPath, 'specs');
    return {
      planFilePath: path.join(featureDir, 'plan.md'),
      researchFilePath: path.join(featureDir, 'research.md'),
      dataModelFilePath: path.join(featureDir, 'data-model.md'),
      contractsDirectory: path.join(featureDir, 'contracts'),
      quickstartFilePath: path.join(featureDir, 'quickstart.md'),
    };
  }

  async tasks(projectPath: string, constraints?: string): Promise<TasksResult> {
    const featureDir = this.findFeatureDirectory(projectPath);
    const tasksFilePath = featureDir ? path.join(featureDir, 'tasks.md') : '';
    let taskCount = 0;

    if (tasksFilePath && fs.existsSync(tasksFilePath)) {
      const content = fs.readFileSync(tasksFilePath, 'utf-8');
      const matches = content.match(/^- \[[ x]\]/gm);
      taskCount = matches ? matches.length : 0;
    }

    return { tasksFilePath, taskCount };
  }

  async implement(projectPath: string, guidance?: string): Promise<ImplementResult> {
    return {
      completedTasks: 0,
      failedTasks: 0,
      changedFiles: [],
    };
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
