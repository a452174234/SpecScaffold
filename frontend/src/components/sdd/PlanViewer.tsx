import { Typography, Card } from 'antd';

const { Paragraph } = Typography;

interface PlanViewerProps {
  planFilePath: string;
}

export function PlanViewer({ planFilePath }: PlanViewerProps) {
  return (
    <Card title="实施计划" size="small">
      <Paragraph type="secondary">{planFilePath || '尚未生成计划文件'}</Paragraph>
    </Card>
  );
}
