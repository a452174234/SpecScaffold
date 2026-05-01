import { Typography, Card } from 'antd';

const { Paragraph } = Typography;

interface SpecEditorProps {
  specFilePath: string;
}

export function SpecEditor({ specFilePath }: SpecEditorProps) {
  return (
    <Card title="功能规格" size="small">
      <Paragraph type="secondary">{specFilePath || '尚未生成规格文件'}</Paragraph>
    </Card>
  );
}
