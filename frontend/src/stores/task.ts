import { create } from 'zustand';

interface TaskItem {
  id: string;
  task_id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
}

interface TaskStore {
  tasks: TaskItem[];
  currentTask: TaskItem | null;
  setTasks: (tasks: TaskItem[]) => void;
  setCurrentTask: (task: TaskItem | null) => void;
  updateTaskStatus: (taskId: string, status: string) => void;
}

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: [],
  currentTask: null,
  setTasks: (tasks) => set({ tasks }),
  setCurrentTask: (task) => set({ currentTask: task }),
  updateTaskStatus: (taskId, status) =>
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)),
    })),
}));
