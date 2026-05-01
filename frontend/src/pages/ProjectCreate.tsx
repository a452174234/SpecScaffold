import { useState } from 'react';
import { Button, Form, Input, message, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { apiPost } from '../services/api';

const { Title } = Typography;

interface FormValues {
  name: string;
  path: string;
}

export function ProjectCreate() {
  const navigate = useNavigate();
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(false);

  async function handleCreate(values: FormValues) {
    setLoading(true);
    try {
      const res = await apiPost<{ success: boolean; data: { id: string }; error?: { message: string } }>(
        '/projects',
        { ...values, type: 'created' },
      );
      if (res.success) {
        message.success('项目创建成功');
        navigate(`/projects/${res.data.id}`);
      } else {
        message.error(res.error?.message || '创建失败');
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

      <Title level={3}>新建项目</Title>

      <Form form={form} layout="vertical" onFinish={handleCreate}>
        <Form.Item
          name="name"
          label="项目名称"
          rules={[{ required: true, message: '请输入项目名称' }]}
        >
          <Input placeholder="例如：my-awesome-project" />
        </Form.Item>

        <Form.Item
          name="path"
          label="项目路径"
          rules={[{ required: true, message: '请输入项目路径' }]}
          extra="项目文件将创建在此目录下"
        >
          <Input placeholder="例如：D:\projects\my-awesome-project" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            创建项目
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
