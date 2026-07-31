import {
  BarChart3,
  BriefcaseBusiness,
  Code2,
  FileText,
  Megaphone,
  PlayCircle,
  Plus,
  Workflow,
  type LucideIcon,
} from "lucide-react";

export type AiAppStatus = "available" | "coming-soon" | "planned";

export type AiAppDefinition = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  status: AiAppStatus;
  featured?: boolean;
  route?: (projectId: string) => string;
};

export const aiApps: AiAppDefinition[] = [
  {
    id: "content-creator",
    title: "Criador de Conteúdo",
    description: "Transforme um briefing em roteiro, títulos, legenda, hashtags e prompts de produção.",
    icon: PlayCircle,
    status: "available",
    featured: true,
    route: (projectId) => `/projects/${projectId}/apps/content-creator`,
  },
  {
    id: "documentation",
    title: "Gerador de Documentação",
    description: "Crie documentação funcional, técnica, atas, planos e entregáveis com contexto do projeto.",
    icon: FileText,
    status: "coming-soon",
  },
  {
    id: "business-analyst",
    title: "Business Analyst",
    description: "Converta necessidades de negócio em processos, requisitos, histórias e critérios de aceite.",
    icon: BriefcaseBusiness,
    status: "coming-soon",
  },
  {
    id: "salesforce-builder",
    title: "Salesforce Builder",
    description: "Estruture soluções Salesforce, automações, objetos, integrações e planos de implementação.",
    icon: Workflow,
    status: "coming-soon",
  },
  {
    id: "code-assistant",
    title: "Code Assistant",
    description: "Planeje, gere e revise código com contexto técnico e padrões do projeto.",
    icon: Code2,
    status: "coming-soon",
  },
  {
    id: "marketing",
    title: "Marketing",
    description: "Crie campanhas, mensagens, calendários e análises para diferentes canais.",
    icon: Megaphone,
    status: "coming-soon",
  },
  {
    id: "analytics",
    title: "Analytics",
    description: "Transforme dados e indicadores em diagnósticos, hipóteses e próximos passos.",
    icon: BarChart3,
    status: "coming-soon",
  },
  {
    id: "marketplace",
    title: "Marketplace",
    description: "Catálogo futuro de AI Apps prontos e extensões especializadas.",
    icon: Plus,
    status: "planned",
  },
];

export function getAiApp(appId: string) {
  return aiApps.find((app) => app.id === appId);
}

export function getAiAppStatusLabel(status: AiAppStatus) {
  if (status === "available") return "Disponível";
  if (status === "planned") return "Planejado";
  return "Em breve";
}
