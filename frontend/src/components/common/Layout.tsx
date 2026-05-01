import { Layout as AntLayout, Menu } from 'antd';
import { Outlet } from 'react-router-dom';

const { Header, Content } = AntLayout;

export function Layout({ children }: { children?: React.ReactNode }) {
  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginRight: 40 }}>
          SpecScaffold
        </div>
        <Menu
          theme="dark"
          mode="horizontal"
          items={[
            { key: 'home', label: '项目列表' },
          ]}
          style={{ flex: 1 }}
        />
      </Header>
      <Content style={{ padding: 24 }}>
        {children ?? <Outlet />}
      </Content>
    </AntLayout>
  );
}
