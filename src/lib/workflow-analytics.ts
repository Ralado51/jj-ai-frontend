import { api } from "@/lib/api";

export type WorkflowPerformance = {
  workflow_id: string;
  workflow_name: string;
  executions: number;
  success_rate: number;
  average_duration_ms: number;
};

export type WorkflowStepPerformance = {
  agent_id: string;
  agent_name: string;
  position: number;
  executions: number;
  average_duration_ms: number;
};

export type WorkflowFailurePoint = {
  workflow_name: string;
  step: number;
  occurrences: number;
  error_message: string;
};

export type WorkflowAnalytics = {
  total_executions: number;
  terminal_executions: number;
  completed_executions: number;
  failed_executions: number;
  cancelled_executions: number;
  retry_executions: number;
  success_rate: number;
  average_duration_ms: number;
  workflows: WorkflowPerformance[];
  slowest_steps: WorkflowStepPerformance[];
  failure_points: WorkflowFailurePoint[];
};

export type WorkflowRecommendation = {
  code: string;
  severity: "success" | "info" | "warning" | "critical";
  title: string;
  description: string;
  action: string;
  step?: number | null;
  agent_id?: string | null;
  model?: string | null;
};

export type WorkflowInsight = {
  workflow_id: string;
  workflow_name: string;
  health_score: number;
  health_label: "Excelente" | "Bom" | "Atenção" | "Crítico";
  executions: number;
  success_rate: number;
  retry_rate: number;
  average_duration_ms: number;
  bottleneck_step?: number | null;
  bottleneck_share?: number | null;
  recommendations: WorkflowRecommendation[];
};

export type WorkflowInsights = {
  workflows: WorkflowInsight[];
};

export type WorkflowHealthHistoryItem = {
  id: string;
  workflow_id: string;
  workflow_name: string;
  snapshot_date: string;
  health_score: number;
  health_label: string;
  executions: number;
  success_rate: number;
  retry_rate: number;
  average_duration_ms: number;
  bottleneck_step?: number | null;
  bottleneck_share?: number | null;
};

export type WorkflowHealthHistory = {
  items: WorkflowHealthHistoryItem[];
};

export async function getWorkflowAnalytics(workflowId?: string): Promise<WorkflowAnalytics> {
  const { data } = await api.get<WorkflowAnalytics>("/api/v1/analytics/workflows", {
    params: workflowId ? { workflow_id: workflowId } : undefined,
  });
  return data;
}

export async function getWorkflowInsights(workflowId?: string): Promise<WorkflowInsights> {
  const { data } = await api.get<WorkflowInsights>("/api/v1/analytics/workflows/insights", {
    params: workflowId ? { workflow_id: workflowId } : undefined,
  });
  return data;
}

export async function getWorkflowHealthHistory(workflowId?: string, limit = 90): Promise<WorkflowHealthHistory> {
  const { data } = await api.get<WorkflowHealthHistory>("/api/v1/analytics/workflows/health/history", {
    params: {
      ...(workflowId ? { workflow_id: workflowId } : {}),
      limit,
    },
  });
  return data;
}

export async function createWorkflowHealthSnapshot(workflowId?: string): Promise<WorkflowHealthHistory> {
  const { data } = await api.post<WorkflowHealthHistory>("/api/v1/analytics/workflows/health/snapshot", undefined, {
    params: workflowId ? { workflow_id: workflowId } : undefined,
  });
  return data;
}
