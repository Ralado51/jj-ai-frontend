import { api } from "@/lib/api";

export type AICostOptimizerFilters = {
  projectId?: string;
  agentId?: string;
  provider?: string;
  model?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type AICostRecommendation = {
  id: string;
  priority: "high" | "medium" | "low";
  category: string;
  title: string;
  description: string;
  action: string;
  estimated_monthly_savings: number | string;
  confidence: number;
  evidence: Record<string, unknown>;
};

export type AICostOptimizerResponse = {
  potential_monthly_savings: number | string;
  recommendations: AICostRecommendation[];
};

export async function getAICostRecommendations(filters: AICostOptimizerFilters = {}): Promise<AICostOptimizerResponse> {
  const { data } = await api.get<AICostOptimizerResponse>("/api/v1/analytics/optimizer/recommendations", {
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
