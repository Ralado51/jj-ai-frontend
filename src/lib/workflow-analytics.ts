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

export async function getWorkflowAnalytics(workflowId?: string): Promise<WorkflowAnalytics> {
  const { data } = await api.get<WorkflowAnalytics>("/api/v1/analytics/workflows", {
    params: workflowId ? { workflow_id: workflowId } : undefined,
  });
  return data;
}
