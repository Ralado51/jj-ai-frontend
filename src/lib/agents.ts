import { api } from "@/lib/api";
import type { AITaskType } from "@/lib/benchmark";

export type AgentDescriptor = {
  id: string;
  name: string;
  description: string;
  task: AITaskType;
};

export type AgentRunPayload = {
  instruction: string;
  agent_id?: string;
  project_id?: string;
  session_key?: string;
  use_memory?: boolean;
};

export type AgentRunResponse = {
  execution_id: string | null;
  agent: AgentDescriptor;
  routing_reason: string;
  content: string;
  provider: string;
  model: string;
  duration_ms: number;
  memory_items_used: number;
  session_key: string | null;
  model_selection_source?: string | null;
  project_id?: string | null;
};

export type AgentExecution = {
  id: string;
  agent_id: string;
  task_type: string;
  session_key: string | null;
  instruction: string;
  response: string;
  routing_reason: string;
  provider: string;
  model: string;
  duration_ms: number;
  created_at: string;
};

export type AgentOrchestrationStep = {
  agent_id: string;
  instruction?: string;
};

export type AgentOrchestrationPayload = {
  instruction: string;
  steps: AgentOrchestrationStep[];
  project_id?: string;
  session_key?: string;
  use_memory?: boolean;
};

export type AgentOrchestrationResponse = {
  steps: AgentRunResponse[];
  final_content: string;
  total_duration_ms: number;
};

export async function listAgents(): Promise<AgentDescriptor[]> {
  const { data } = await api.get<AgentDescriptor[]>("/api/v1/agents");
  return data;
}

export async function runAgent(payload: AgentRunPayload): Promise<AgentRunResponse> {
  const { data } = await api.post<AgentRunResponse>("/api/v1/agents/run", payload, {
    timeout: 600_000,
  });
  return data;
}

export async function orchestrateAgents(
  payload: AgentOrchestrationPayload,
): Promise<AgentOrchestrationResponse> {
  const { data } = await api.post<AgentOrchestrationResponse>(
    "/api/v1/agents/orchestrate",
    payload,
    { timeout: 900_000 },
  );
  return data;
}

export async function listAgentExecutions(agentId?: string): Promise<AgentExecution[]> {
  const { data } = await api.get<AgentExecution[]>("/api/v1/agents/executions", {
    params: agentId ? { agent_id: agentId, limit: 50 } : { limit: 50 },
  });
  return data;
}

export async function clearAgentMemory(agentId: string, sessionKey: string): Promise<void> {
  await api.delete(`/api/v1/agents/${encodeURIComponent(agentId)}/memory/${encodeURIComponent(sessionKey)}`);
}
