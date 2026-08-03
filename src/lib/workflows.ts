import { api } from "@/lib/api";
import type { AgentOrchestrationResponse, AgentOrchestrationStep } from "@/lib/agents";

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

export type WorkflowRunPayload = {
  instruction?: string;
  project_id?: string | null;
  session_key?: string | null;
  use_memory?: boolean;
};

export type WorkflowRunResponse = AgentOrchestrationResponse & {
  execution_id: string;
  workflow_id: string;
  workflow_name: string;
  project_id?: string | null;
  session_key?: string | null;
  use_memory?: boolean;
};

export type WorkflowExecutionStatus =
  | "pending"
  | "running"
  | "cancelling"
  | "cancelled"
  | "completed"
  | "failed";

export type WorkflowExecutionStepDetail = {
  position: number;
  agent_execution_id: string | null;
  agent_id: string;
  agent_name: string;
  task_type: string;
  provider: string;
  model: string;
  model_selection_source: string;
  routing_reason: string;
  duration_ms: number;
  memory_items_used: number;
  content: string;
};

export type WorkflowExecution = {
  id: string;
  workflow_id: string;
  project_id: string | null;
  workflow_name: string;
  status: WorkflowExecutionStatus | string;
  instruction: string;
  session_key: string | null;
  use_memory: boolean;
  steps_total: number;
  steps_completed: number;
  total_duration_ms: number;
  final_content: string | null;
  error_message: string | null;
  step_details: WorkflowExecutionStepDetail[];
  created_at: string;
  updated_at: string;
};

export function isWorkflowExecutionActive(status: string): boolean {
  return status === "pending" || status === "running" || status === "cancelling";
}

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

export async function runPersistedWorkflow(id: string, payload: WorkflowRunPayload): Promise<WorkflowRunResponse> {
  const { data } = await api.post<WorkflowRunResponse>(`/api/v1/workflows/${id}/run`, payload, {
    timeout: 600_000,
  });
  return data;
}

export async function runPersistedWorkflowAsync(
  id: string,
  payload: WorkflowRunPayload,
): Promise<WorkflowExecution> {
  const { data } = await api.post<WorkflowExecution>(`/api/v1/workflows/${id}/run/async`, payload);
  return data;
}

export async function listWorkflowExecutions(workflowId?: string, limit = 50): Promise<WorkflowExecution[]> {
  const { data } = await api.get<WorkflowExecution[]>("/api/v1/workflows/executions", {
    params: { workflow_id: workflowId || undefined, limit },
  });
  return data;
}

export async function getWorkflowExecution(id: string): Promise<WorkflowExecution> {
  const { data } = await api.get<WorkflowExecution>(`/api/v1/workflows/executions/${id}`);
  return data;
}

export async function cancelWorkflowExecution(id: string): Promise<WorkflowExecution> {
  const { data } = await api.post<WorkflowExecution>(`/api/v1/workflows/executions/${id}/cancel`);
  return data;
}

export async function waitForWorkflowExecution(
  id: string,
  options: { intervalMs?: number; timeoutMs?: number } = {},
): Promise<WorkflowExecution> {
  const intervalMs = options.intervalMs ?? 2_000;
  const timeoutMs = options.timeoutMs ?? 15 * 60_000;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const execution = await getWorkflowExecution(id);
    if (!isWorkflowExecutionActive(execution.status)) return execution;
    await new Promise((resolve) => window.setTimeout(resolve, intervalMs));
  }

  throw new Error("A execução continua em andamento após o tempo máximo de acompanhamento.");
}

export async function retryWorkflowExecution(
  id: string,
  payload: WorkflowRunPayload = {},
): Promise<WorkflowRunResponse> {
  const { data } = await api.post<WorkflowRunResponse>(
    `/api/v1/workflows/executions/${id}/retry`,
    payload,
    { timeout: 600_000 },
  );
  return data;
}
