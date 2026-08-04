import { api } from "@/lib/api";

export type AIUsageSummary = {
  total_requests: number;
  total_tokens: number;
  estimated_cost: number | string;
  ollama_savings: number | string;
  cache_hits: number;
  cache_hit_rate?: number;
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

export type AICostTimelineItem = {
  date: string;
  requests: number;
  tokens: number;
  cost: number | string;
};

export type AICostRankingItem = {
  key: string;
  requests: number;
  tokens: number;
  cost: number | string;
  average_latency_ms: number;
};

export type AICostDashboard = {
  summary: AIUsageSummary;
  timeline: AICostTimelineItem[];
  providers: AICostRankingItem[];
  models: AICostRankingItem[];
  agents: AICostRankingItem[];
  projects: AICostRankingItem[];
  workflows: AICostRankingItem[];
  trends: {
    weekly_cost_growth: number;
    weekly_token_growth: number;
    weekly_request_growth: number;
  };
};

function params(filters: AIUsageFilters) {
  return {
    ...(filters.projectId ? { project_id: filters.projectId } : {}),
    ...(filters.agentId ? { agent_id: filters.agentId } : {}),
    ...(filters.provider ? { provider: filters.provider } : {}),
    ...(filters.model ? { model: filters.model } : {}),
    ...(filters.dateFrom ? { date_from: new Date(`${filters.dateFrom}T00:00:00`).toISOString() } : {}),
    ...(filters.dateTo ? { date_to: new Date(`${filters.dateTo}T23:59:59`).toISOString() } : {}),
  };
}

export async function getAIUsageSummary(filters: AIUsageFilters = {}): Promise<AIUsageSummary> {
  const { data } = await api.get<AIUsageSummary>("/api/v1/analytics/usage", { params: params(filters) });
  return data;
}

export async function getAICostDashboard(filters: AIUsageFilters = {}): Promise<AICostDashboard> {
  const { data } = await api.get<AICostDashboard>("/api/v1/analytics/usage/dashboard", { params: params(filters) });
  return data;
}
