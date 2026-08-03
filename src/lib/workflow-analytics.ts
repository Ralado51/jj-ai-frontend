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
