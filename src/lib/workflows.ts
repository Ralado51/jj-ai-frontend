import { api } from "@/lib/api";
import type { AgentOrchestrationStep } from "@/lib/agents";

export type PersistedWorkflow = {
  id: string;
  user_id: string;
  project_id: string | null;
  name: string;
  description: string | null;
  steps: AgentOrchestrationStep[];
  default_instruction: string | null;
  session_key: string | null;
  use_memory: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type WorkflowPayload = {
  name: string;
  description?: string | null;
  project_id?: string | null;
  steps: AgentOrchestrationStep[];
  default_instruction?: string | null;
  session_key?: string | null;
  use_memory?: boolean;
};

export async function listWorkflows(projectId?: string): Promise<PersistedWorkflow[]> {
  const { data } = await api.get<PersistedWorkflow[]>("/api/v1/workflows", {
    params: projectId ? { project_id: projectId } : undefined,
  });
  return data;
}

export async function createWorkflow(payload: WorkflowPayload): Promise<PersistedWorkflow> {
  const { data } = await api.post<PersistedWorkflow>("/api/v1/workflows", payload);
  return data;
}

export async function updateWorkflow(id: string, payload: Partial<WorkflowPayload>): Promise<PersistedWorkflow> {
  const { data } = await api.patch<PersistedWorkflow>(`/api/v1/workflows/${id}`, payload);
  return data;
}

export async function archiveWorkflow(id: string): Promise<PersistedWorkflow> {
  const { data } = await api.delete<PersistedWorkflow>(`/api/v1/workflows/${id}`);
  return data;
}
