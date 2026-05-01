import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { ProjectScanner } from '../../../src/services/project-scanner';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('ProjectScanner', () => {
  const scanner = new ProjectScanner();
  let testDir: string;

  beforeEach(() => {
    testDir = path.join(os.tmpdir(), `scanner-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterAll(() => {
    // final cleanup handled by OS
  });

  it('应识别 TypeScript 项目', () => {
    fs.writeFileSync(path.join(testDir, 'package.json'), '{"name":"test"}');
    fs.writeFileSync(path.join(testDir, 'tsconfig.json'), '{}');

    const result = scanner.scan(testDir);
    expect(result.language).toBe('TypeScript');
  });

  it('应识别 React 框架', () => {
    fs.writeFileSync(
      path.join(testDir, 'package.json'),
      '{"name":"test","dependencies":{"react":"^18.0.0"}}',
    );

    const result = scanner.scan(testDir);
    expect(result.framework).toBe('React');
  });

  it('应识别 Python 项目', () => {
    fs.writeFileSync(path.join(testDir, 'requirements.txt'), 'flask==2.0');

    const result = scanner.scan(testDir);
    expect(result.language).toBe('Python');
  });

  it('应识别 Java 项目', () => {
    fs.writeFileSync(path.join(testDir, 'pom.xml'), '<project></project>');

    const result = scanner.scan(testDir);
    expect(result.language).toBe('Java');
  });

  it('应返回 null 语言当无法识别时', () => {
    fs.writeFileSync(path.join(testDir, 'readme.txt'), 'hello');

    const result = scanner.scan(testDir);
    expect(result.language).toBeNull();
  });
});
