import { useState } from 'react';
import { Button, Form, Input, message, Typography, Descriptions, Tag, Card } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { apiPost } from '../services/api';

const { Title } = Typography;

interface ScanResult {
  language: string | null;
  framework: string | null;
}

interface ProjectResult {
  id: string;
  name: string;
  path: string;
  type: string;
  language: string | null;
  framework: string | null;
}

export function ProjectImport() {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState<ProjectResult | null>(null);

  async function handleImport(values: { name: string; path: string }) {
    setLoading(true);
    try {
      const res = await apiPost<{ success: boolean; data: ProjectResult; error?: { message: string } }>(
        '/projects/import',
        values,
      );
      if (res.success) {
        setScanResult(res.data);
        message.success('项目导入成功');
      } else {
        message.error(res.error?.message || '导入失败');
      }
    } catch {
      message.error('网络错误，请检查后端服务是否启动');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/')}
        style={{ marginBottom: 16 }}
      >
        返回项目列表
      </Button>

      <Title level={3}>导入现有项目</Title>

      <Form form={form} layout="vertical" onFinish={handleImport}>
        <Form.Item
          name="name"
          label="项目名称"
          rules={[{ required: true, message: '请输入项目名称' }]}
        >
          <Input placeholder="例如：my-existing-project" />
        </Form.Item>

        <Form.Item
          name="path"
          label="项目路径"
          rules={[{ required: true, message: '请输入项目路径' }]}
          extra="输入本地已有项目的绝对路径"
        >
          <Input placeholder="例如：D:\projects\my-existing-project" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            导入项目
          </Button>
        </Form.Item>
      </Form>

      {scanResult && (
        <Card title="识别结果" style={{ marginTop: 16 }}>
          <Descriptions column={1} size="small">
            <Descriptions.Item label="项目名称">{scanResult.name}</Descriptions.Item>
            <Descriptions.Item label="路径">{scanResult.path}</Descriptions.Item>
            <Descriptions.Item label="语言">
              {scanResult.language ? <Tag color="blue">{scanResult.language}</Tag> : '未识别'}
            </Descriptions.Item>
            <Descriptions.Item label="框架">
              {scanResult.framework ? <Tag color="green">{scanResult.framework}</Tag> : '未识别'}
            </Descriptions.Item>
          </Descriptions>
          <Button
            type="link"
            onClick={() => navigate(`/projects/${scanResult.id}`)}
            style={{ marginTop: 8 }}
          >
            进入项目
          </Button>
        </Card>
      )}
    </div>
  );
}
