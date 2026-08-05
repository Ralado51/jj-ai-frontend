import { api } from "@/lib/api";

export type BudgetScope = "global" | "project" | "workflow";
export type BudgetStatus = "healthy" | "warning" | "critical";

export type AICostBudget = {
  id: string;
  scope_type: BudgetScope;
  scope_id: string | null;
  name: string;
  monthly_limit: number | string;
  warning_threshold_percent: number;
  critical_threshold_percent: number;
  is_active: boolean;
  current_spend: number | string;
  usage_percent: number;
  remaining: number | string;
  status: BudgetStatus;
};

export type AICostBudgetPayload = {
  scope_type: BudgetScope;
  scope_id?: string | null;
  name: string;
  monthly_limit: number;
  warning_threshold_percent: number;
  critical_threshold_percent: number;
  is_active: boolean;
};

export async function listAICostBudgets(): Promise<AICostBudget[]> {
  const { data } = await api.get<AICostBudget[]>("/api/v1/analytics/budgets");
  return data;
}

export async function createAICostBudget(payload: AICostBudgetPayload): Promise<AICostBudget> {
  const { data } = await api.post<AICostBudget>("/api/v1/analytics/budgets", payload);
  return data;
}

export async function updateAICostBudget(id: string, payload: Partial<Omit<AICostBudgetPayload, "scope_type" | "scope_id">>): Promise<AICostBudget> {
  const { data } = await api.patch<AICostBudget>(`/api/v1/analytics/budgets/${id}`, payload);
  return data;
}

export async function deleteAICostBudget(id: string): Promise<void> {
  await api.delete(`/api/v1/analytics/budgets/${id}`);
}
