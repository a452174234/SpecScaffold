import { Typography } from 'antd';

const { Text } = Typography;

interface CodeOutputProps {
  lines: string[];
}

export function CodeOutput({ lines }: CodeOutputProps) {
  return (
    <div style={{ background: '#1e1e1e', color: '#d4d4d4', padding: 8, borderRadius: 4, fontFamily: 'monospace', fontSize: 12 }}>
      {lines.length === 0 ? (
        <Text style={{ color: '#666' }}>暂无输出</Text>
      ) : (
        lines.map((line, i) => <div key={i}>{line}</div>)
      )}
    </div>
  );
}
