import { create } from 'zustand';

interface Project {
  id: string;
  name: string;
  path: string;
  type: 'created' | 'imported';
  language: string | null;
  framework: string | null;
  status: 'active' | 'archived';
}

interface ProjectStore {
  projects: Project[];
  currentProject: Project | null;
  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project | null) => void;
}

export const useProjectStore = create<ProjectStore>((set) => ({
  projects: [],
  currentProject: null,
  setProjects: (projects) => set({ projects }),
  setCurrentProject: (project) => set({ currentProject: project }),
}));
