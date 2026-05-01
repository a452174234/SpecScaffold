import { useEffect, useState } from 'react';
import { Button, Empty, Typography, Card, List, Tag } from 'antd';
import { PlusOutlined, ImportOutlined, FolderOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../services/api';

const { Title, Text } = Typography;

interface Project {
  id: string;
  name: string;
  path: string;
  type: 'created' | 'imported';
  language: string | null;
  framework: string | null;
  status: 'active' | 'archived';
  createdAt: string;
}

export function Home() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      const res = await apiGet<{ success: boolean; data: Project[] }>('/projects');
      if (res.success) setProjects(res.data);
    } catch {
      // 后端未启动时静默处理
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>项目列表</Title>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/projects/new')}>
            新建项目
          </Button>
          <Button icon={<ImportOutlined />} onClick={() => navigate('/projects/import')}>
            导入项目
          </Button>
        </div>
      </div>

      {projects.length === 0 ? (
        <Empty description="暂无项目，请新建或导入项目" />
      ) : (
        <List
          loading={loading}
          grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3 }}
          dataSource={projects}
          renderItem={(project) => (
            <List.Item>
              <Card
                hoverable
                onClick={() => navigate(`/projects/${project.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <Card.Meta
                  avatar={<FolderOutlined style={{ fontSize: 24, color: '#1677ff' }} />}
                  title={project.name}
                  description={
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>{project.path}</Text>
                      <br />
                      <Tag color={project.type === 'created' ? 'blue' : 'green'}>
                        {project.type === 'created' ? '新建' : '导入'}
                      </Tag>
                      {project.language && <Tag>{project.language}</Tag>}
                      {project.framework && <Tag>{project.framework}</Tag>}
                    </div>
                  }
                />
              </Card>
            </List.Item>
          )}
        />
      )}
    </div>
  );
}
