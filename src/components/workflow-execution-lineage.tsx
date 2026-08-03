"use client";

import { GitBranch, RotateCcw } from "lucide-react";
import type { WorkflowExecution } from "@/lib/workflows";

type Props = {
  selected: WorkflowExecution;
  executions: WorkflowExecution[];
  onSelect: (id: string) => void;
};

export function WorkflowExecutionLineage({ selected, executions, onSelect }: Props) {
  const parent = selected.parent_execution_id
    ? executions.find((item) => item.id === selected.parent_execution_id) ?? null
    : null;
  const children = executions
    .filter((item) => item.parent_execution_id === selected.id)
    .sort((left, right) => left.created_at.localeCompare(right.created_at));

  if (!parent && children.length === 0 && selected.retry_from_step === null) return null;

  return (
    <section className="rounded-xl border border-primary/30 bg-primary/5 p-4">
      <div className="flex items-center gap-2">
        <GitBranch size={16} className="text-secondary" />
        <p className="text-xs font-semibold uppercase tracking-wide text-secondary">Linhagem da execução</p>
      </div>

      {selected.retry_from_step ? (
        <p className="mt-3 text-sm">
          Esta execução foi reiniciada a partir da <strong>etapa {selected.retry_from_step}</strong>.
        </p>
      ) : null}

      {parent ? (
        <button
          type="button"
          onClick={() => onSelect(parent.id)}
          className="mt-3 flex w-full items-center justify-between rounded-lg border bg-background p-3 text-left text-sm hover:bg-elevated"
        >
          <span>
            <span className="block text-xs text-muted">Execução de origem</span>
            <span className="mt-1 block font-medium">{parent.workflow_name}</span>
          </span>
          <span className="font-mono text-xs text-muted">{parent.id.slice(0, 8)}</span>
        </button>
      ) : null}

      {children.length ? (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-semibold text-muted">Reexecuções geradas desta execução</p>
          {children.map((child) => (
            <button
              key={child.id}
              type="button"
              onClick={() => onSelect(child.id)}
              className="flex w-full items-center justify-between rounded-lg border bg-background p-3 text-left text-sm hover:bg-elevated"
            >
              <span className="inline-flex items-center gap-2">
                <RotateCcw size={14} />
                Etapa {child.retry_from_step ?? 1} · {child.status}
              </span>
              <span className="font-mono text-xs text-muted">{child.id.slice(0, 8)}</span>
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
