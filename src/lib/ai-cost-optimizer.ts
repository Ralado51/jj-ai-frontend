import { api } from "@/lib/api";

export type AICostOptimizerFilters = {
  projectId?: string;
  agentId?: string;
  provider?: string;
  model?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type RecommendationStatus = "open" | "in_review" | "applied" | "ignored";

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

export type AICostRecommendationHistory = {
  id: string;
  recommendation_key: string;
  priority: string;
  category: string;
  title: string;
  description: string;
  action: string;
  estimated_monthly_savings: number | string;
  confidence: number;
  evidence: Record<string, unknown>;
  status: RecommendationStatus;
  notes: string | null;
  first_seen_at: string;
  last_seen_at: string;
  resolved_at: string | null;
};

export type AICostOptimizerResponse = {
  potential_monthly_savings: number | string;
  recommendations: AICostRecommendation[];
};

function filterParams(filters: AICostOptimizerFilters) {
  return {
    ...(filters.projectId ? { project_id: filters.projectId } : {}),
    ...(filters.agentId ? { agent_id: filters.agentId } : {}),
    ...(filters.provider ? { provider: filters.provider } : {}),
    ...(filters.model ? { model: filters.model } : {}),
    ...(filters.dateFrom ? { date_from: new Date(`${filters.dateFrom}T00:00:00`).toISOString() } : {}),
    ...(filters.dateTo ? { date_to: new Date(`${filters.dateTo}T23:59:59`).toISOString() } : {}),
  };
}

export async function getAICostRecommendations(filters: AICostOptimizerFilters = {}): Promise<AICostOptimizerResponse> {
  const { data } = await api.get<AICostOptimizerResponse>("/api/v1/analytics/optimizer/recommendations", { params: filterParams(filters) });
  return data;
}

export async function getAICostRecommendationHistory(status?: RecommendationStatus): Promise<AICostRecommendationHistory[]> {
  const { data } = await api.get<AICostRecommendationHistory[]>("/api/v1/analytics/optimizer/recommendations/history", {
    params: status ? { status } : undefined,
  });
  return data;
}

export async function updateAICostRecommendation(
  recommendationId: string,
  payload: { status: RecommendationStatus; notes?: string | null },
): Promise<AICostRecommendationHistory> {
  const { data } = await api.patch<AICostRecommendationHistory>(
    `/api/v1/analytics/optimizer/recommendations/${recommendationId}`,
    payload,
  );
  return data;
}
