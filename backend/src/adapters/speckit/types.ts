export interface SpecifyResult {
  specFilePath: string;
  featureDirectory: string;
  checklistPath: string;
  content: string;
  sessionId: string;
  tokenUsage: { input: number; output: number };
  exitReason: string;
}

export interface ClarifyResult {
  specFilePath: string;
  questionsAnswered: number;
  content: string;
  sessionId: string;
  tokenUsage: { input: number; output: number };
}

export interface PlanResult {
  planFilePath: string;
  researchFilePath: string;
  dataModelFilePath: string;
  contractsDirectory: string;
  quickstartFilePath: string;
  content: string;
  sessionId: string;
  tokenUsage: { input: number; output: number };
}

export interface TasksResult {
  tasksFilePath: string;
  taskCount: number;
  content: string;
  sessionId: string;
  tokenUsage: { input: number; output: number };
}

export interface ImplementResult {
  completedTasks: number;
  failedTasks: number;
  changedFiles: string[];
  sessionId: string;
  tokenUsage: { input: number; output: number };
}

export interface ISpeckitAdapter {
  specify(projectPath: string, description: string): Promise<SpecifyResult>;
  clarify(projectPath: string, clarification: string): Promise<ClarifyResult>;
  plan(projectPath: string, guidance?: string): Promise<PlanResult>;
  tasks(projectPath: string, constraints?: string): Promise<TasksResult>;
  implement(projectPath: string, guidance?: string): Promise<ImplementResult>;
}
