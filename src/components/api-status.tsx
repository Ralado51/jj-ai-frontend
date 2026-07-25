"use client";

import { Activity, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Status = "loading" | "online" | "offline";

export function ApiStatus() {
  const [status, setStatus] = useState<Status>("loading");
  const [checkedAt, setCheckedAt] = useState<string>("");

  async function checkHealth() {
    setStatus("loading");

    try {
      await api.get("/health");
      setStatus("online");
    } catch {
      setStatus("offline");
    } finally {
      setCheckedAt(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
    }
  }

  useEffect(() => {
    void checkHealth();
  }, []);

  const label = status === "online" ? "API online" : status === "offline" ? "API indisponível" : "Verificando API";

  return (
    <div className="rounded-xl border bg-surface p-5 shadow-glow">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted">
            <Activity size={17} />
            Status da plataforma
          </div>
          <div className="mt-4 flex items-center gap-3">
            <span
              className={`h-3 w-3 rounded-full ${
                status === "online"
                  ? "bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.8)]"
                  : status === "offline"
                    ? "bg-red-400"
                    : "animate-pulse bg-amber-400"
              }`}
            />
            <p className="text-lg font-semibold">{label}</p>
          </div>
          <p className="mt-2 text-xs text-muted">
            {checkedAt ? `Última verificação às ${checkedAt}` : "Conectando em https://api.jjnetwork.com.br"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void checkHealth()}
          disabled={status === "loading"}
          className="grid h-10 w-10 place-items-center rounded-xl border bg-elevated transition hover:border-primary/60 disabled:cursor-wait"
          aria-label="Verificar API novamente"
        >
          <RefreshCw size={17} className={status === "loading" ? "animate-spin" : ""} />
        </button>
      </div>
    </div>
  );
}
