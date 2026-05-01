import fs from 'fs';
import path from 'path';

interface ScanResult {
  language: string | null;
  framework: string | null;
}

export class ProjectScanner {
  scan(dir: string): ScanResult {
    const files = fs.readdirSync(dir);
    const language = this.detectLanguage(dir, files);
    const framework = this.detectFramework(dir, files);
    return { language, framework };
  }

  private detectLanguage(dir: string, files: string[]): string | null {
    if (files.includes('tsconfig.json') || files.includes('tsconfig.node.json')) {
      return 'TypeScript';
    }
    if (files.includes('package.json')) {
      return 'JavaScript';
    }
    if (files.includes('requirements.txt') || files.includes('setup.py') || files.includes('pyproject.toml')) {
      return 'Python';
    }
    if (files.includes('pom.xml') || files.includes('build.gradle') || files.includes('build.gradle.kts')) {
      return 'Java';
    }
    if (files.includes('Cargo.toml')) {
      return 'Rust';
    }
    if (files.includes('go.mod')) {
      return 'Go';
    }
    if (files.some((f) => f.endsWith('.csproj') || f.endsWith('.sln'))) {
      return 'C#';
    }
    return null;
  }

  private detectFramework(dir: string, files: string[]): string | null {
    if (!files.includes('package.json')) return null;

    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf-8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      if (deps['next']) return 'Next.js';
      if (deps['react']) return 'React';
      if (deps['vue']) return 'Vue';
      if (deps['@angular/core']) return 'Angular';
      if (deps['svelte']) return 'Svelte';
      if (deps['express']) return 'Express';
      if (deps['hono']) return 'Hono';
      if (deps['nest']) return 'NestJS';
    } catch {
      // package.json 解析失败，忽略
    }

    return null;
  }
}
