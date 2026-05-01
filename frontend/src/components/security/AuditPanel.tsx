import { Card, Button, Typography, Descriptions, Space, Tag } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface AuditRequest {
  auditId: string;
  toolName: string;
  operation: string;
  target: string;
  riskLevel: string;
  operationDescription: string;
}

interface AuditPanelProps {
  request: AuditRequest;
  onApprove: (auditId: string, feedback?: string) => void;
  onReject: (auditId: string, feedback?: string) => void;
}

const riskColorMap: Record<string, string> = {
  high: 'red',
  low: 'orange',
  read_only: 'green',
  blocked: 'default',
};

export function AuditPanel({ request, onApprove, onReject }: AuditPanelProps) {
  return (
    <Card
      title="操作审计请求"
      size="small"
      style={{ marginBottom: 12, borderColor: '#faad14' }}
    >
      <Descriptions column={1} size="small">
        <Descriptions.Item label="工具">
          <Tag>{request.toolName}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="风险级别">
          <Tag color={riskColorMap[request.riskLevel] || 'default'}>
            {request.riskLevel}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="操作说明">
          <Text>{request.operationDescription}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="操作目标">
          <Text code>{request.target}</Text>
        </Descriptions.Item>
      </Descriptions>
      <Space style={{ marginTop: 8 }}>
        <Button
          type="primary"
          icon={<CheckCircleOutlined />}
          onClick={() => onApprove(request.auditId)}
        >
          批准
        </Button>
        <Button
          danger
          icon={<CloseCircleOutlined />}
          onClick={() => onReject(request.auditId)}
        >
          拒绝
        </Button>
      </Space>
    </Card>
  );
}
