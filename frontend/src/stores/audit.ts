import { create } from 'zustand';

interface AuditEntry {
  id: string;
  tool_name: string;
  operation: string;
  target: string;
  risk_level: string;
  audit_result: string;
  operation_description: string;
  timestamp: string;
}

interface AuditStore {
  logs: AuditEntry[];
  pendingRequests: AuditEntry[];
  setLogs: (logs: AuditEntry[]) => void;
  addPendingRequest: (request: AuditEntry) => void;
  removePendingRequest: (id: string) => void;
}

export const useAuditStore = create<AuditStore>((set) => ({
  logs: [],
  pendingRequests: [],
  setLogs: (logs) => set({ logs }),
  addPendingRequest: (request) =>
    set((state) => ({ pendingRequests: [...state.pendingRequests, request] })),
  removePendingRequest: (id) =>
    set((state) => ({ pendingRequests: state.pendingRequests.filter((r) => r.id !== id) })),
}));
