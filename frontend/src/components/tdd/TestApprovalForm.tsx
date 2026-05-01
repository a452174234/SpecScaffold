import { Button, Card, Typography } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

export function TestApprovalForm({ onApprove }: { onApprove: () => void }) {
  return (
    <Card size="small" style={{ marginBottom: 8 }}>
      <Text>测试用例已生成，请审批：</Text>
      <Button
        type="primary"
        icon={<CheckCircleOutlined />}
        onClick={onApprove}
        style={{ marginLeft: 8 }}
        size="small"
      >
        审批通过
      </Button>
    </Card>
  );
}
