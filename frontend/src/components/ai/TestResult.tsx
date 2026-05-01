import { Tag } from 'antd';

interface TestResultProps {
  passed: boolean;
  output?: string;
}

export function TestResult({ passed, output }: TestResultProps) {
  return (
    <div>
      <Tag color={passed ? 'green' : 'red'}>{passed ? '测试通过' : '测试失败'}</Tag>
      {output && <pre style={{ fontSize: 11, marginTop: 4 }}>{output}</pre>}
    </div>
  );
}
