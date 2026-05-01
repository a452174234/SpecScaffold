import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { Layout } from './components/common/Layout';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Home } from './pages/Home';
import { ProjectCreate } from './pages/ProjectCreate';
import { ProjectImport } from './pages/ProjectImport';
import { SddFlow } from './pages/SddFlow';
import { AiWorkspace } from './pages/AiWorkspace';
import { TaskBoard } from './pages/TaskBoard';
import { AuditLog } from './pages/AuditLog';
import { ProjectDetail } from './pages/ProjectDetail';

const App = () => (
  <ConfigProvider locale={zhCN}>
    <ErrorBoundary>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/projects/new" element={<ProjectCreate />} />
            <Route path="/projects/import" element={<ProjectImport />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/projects/:id/sdd" element={<SddFlow />} />
            <Route path="/projects/:id/ai" element={<AiWorkspace />} />
            <Route path="/projects/:id/tasks" element={<TaskBoard />} />
            <Route path="/projects/:id/audit" element={<AuditLog />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ErrorBoundary>
  </ConfigProvider>
);

export default App;
