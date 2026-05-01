import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Col, Row, Typography, Tag, Spin, Button } from 'antd';
import {
  ExperimentOutlined,
  RobotOutlined,
  UnorderedListOutlined,
  AuditOutlined,
  ArrowLeftOutlined,
  FolderOutlined,
  ImportOutlined,
} from '@ant-design/icons';
import { apiGet } from '../services/api';

const { Title, Text, Paragraph } = Typography;

interface Project {
  id: string;
  name: string;
  path: string;
  type: 'created' | 'imported';
  language: string | null;
  framework: string | null;
  status: string;
}

const navCards = [
  {
    title: 'SDD 规格驱动开发',
    desc: '输入功能描述，生成 Spec → Plan → Tasks 全链路',
    icon: <ExperimentOutlined style={{ fontSize: 32, color: '#1677ff' }} />,
    path: '/sdd',
    color: '#e6f4ff',
  },
  {
    title: 'AI 工作区',
    desc: '选择任务，AI 生成测试用例和业务代码',
    icon: <RobotOutlined style={{ fontSize: 32, color: '#52c41a' }} />,
    path: '/ai',
    color: '#f6ffed',
  },
  {
    title: '任务面板',
    desc: '查看任务列表，管理 TDD 状态流转',
    icon: <UnorderedListOutlined style={{ fontSize: 32, color: '#fa8c16' }} />,
    path: '/tasks',
    color: '#fff7e6',
  },
  {
    title: '审计日志',
    desc: '查看 AI 操作历史和安全围栏审批记录',
    icon: <AuditOutlined style={{ fontSize: 32, color: '#eb2f96' }} />,
    path: '/audit',
    color: '#fff0f6',
  },
];

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProject();
  }, [id]);

  async function loadProject() {
    try {
      const res = await apiGet<{ success: boolean; data: Project }>(`/projects/${id}`);
      if (res.success) setProject(res.data);
    } catch {
      // 静默
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />;
  if (!project) return <Paragraph>项目不存在</Paragraph>;

  return (
    <div>
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/')}
        style={{ marginBottom: 16 }}
      >
        返回项目列表
      </Button>

      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col>
            <FolderOutlined style={{ fontSize: 40, color: '#1677ff' }} />
          </Col>
          <Col flex={1}>
            <Title level={3} style={{ margin: 0 }}>{project.name}</Title>
            <Text type="secondary">{project.path}</Text>
          </Col>
          <Col>
            <Tag color={project.type === 'created' ? 'blue' : 'green'}>
              {project.type === 'created' ? '新建项目' : '导入项目'}
            </Tag>
            {project.language && <Tag>{project.language}</Tag>}
            {project.framework && <Tag>{project.framework}</Tag>}
          </Col>
        </Row>
      </Card>

      <Title level={4}>功能入口</Title>
      <Row gutter={[16, 16]}>
        {navCards.map((card) => (
          <Col xs={24} sm={12} md={12} lg={6} key={card.path}>
            <Card
              hoverable
              onClick={() => navigate(`/projects/${id}${card.path}`)}
              style={{ background: card.color, cursor: 'pointer', height: '100%' }}
            >
              <div style={{ textAlign: 'center', marginBottom: 12 }}>{card.icon}</div>
              <Title level={5} style={{ textAlign: 'center' }}>{card.title}</Title>
              <Paragraph type="secondary" style={{ textAlign: 'center', fontSize: 13 }}>
                {card.desc}
              </Paragraph>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
