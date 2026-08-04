import { api } from "@/lib/api";

export type AIUsageSummary = {
  total_requests: number;
  total_tokens: number;
  estimated_cost: number | string;
  ollama_savings: number | string;
  cache_hits: number;
  average_latency_ms: number;
};

export type AIUsageFilters = {
  projectId?: string;
  agentId?: string;
  provider?: string;
  model?: string;
  dateFrom?: string;
  dateTo?: string;
};

export async function getAIUsageSummary(filters: AIUsageFilters = {}): Promise<AIUsageSummary> {
  const { data } = await api.get<AIUsageSummary>("/api/v1/analytics/usage", {
    params: {
      ...(filters.projectId ? { project_id: filters.projectId } : {}),
      ...(filters.agentId ? { agent_id: filters.agentId } : {}),
      ...(filters.provider ? { provider: filters.provider } : {}),
      ...(filters.model ? { model: filters.model } : {}),
      ...(filters.dateFrom ? { date_from: new Date(`${filters.dateFrom}T00:00:00`).toISOString() } : {}),
      ...(filters.dateTo ? { date_to: new Date(`${filters.dateTo}T23:59:59`).toISOString() } : {}),
    },
  });
  return data;
}
