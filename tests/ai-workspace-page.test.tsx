import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ProjectAiWorkspacePage from "@/app/projects/[id]/ai/page";

const {
  listConversations,
  createConversation,
  getConversation,
  addConversationMessage,
  streamProjectAnswer,
  updateConversation,
  deleteConversation,
} = vi.hoisted(() => ({
  listConversations: vi.fn(),
  createConversation: vi.fn(),
  getConversation: vi.fn(),
  addConversationMessage: vi.fn(),
  streamProjectAnswer: vi.fn(),
  updateConversation: vi.fn(),
  deleteConversation: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ id: "project-1" }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock("@/components/dashboard-shell", () => ({
  DashboardShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/lib/ai-workspace", () => ({
  listConversations: (...args: unknown[]) => listConversations(...args),
  createConversation: (...args: unknown[]) => createConversation(...args),
  getConversation: (...args: unknown[]) => getConversation(...args),
  addConversationMessage: (...args: unknown[]) => addConversationMessage(...args),
  streamProjectAnswer: (...args: unknown[]) => streamProjectAnswer(...args),
  updateConversation: (...args: unknown[]) => updateConversation(...args),
  deleteConversation: (...args: unknown[]) => deleteConversation(...args),
}));

const conversationItem = {
  id: "conversation-1",
  project_id: "project-1",
  title: "Existing conversation",
  is_favorite: false,
  created_at: "2026-07-30T12:00:00Z",
  updated_at: "2026-07-30T12:00:00Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: vi.fn(),
  });
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
  });

  listConversations.mockResolvedValue({ total: 0, items: [] });
  createConversation.mockResolvedValue({ id: "conversation-new" });
  getConversation.mockResolvedValue({ ...conversationItem, messages: [] });
  addConversationMessage.mockResolvedValue({ id: "conversation-new" });
  updateConversation.mockResolvedValue(conversationItem);
  deleteConversation.mockResolvedValue(undefined);
});

describe("AI Workspace page", () => {
  it("loads and opens the most recent persisted conversation", async () => {
    listConversations.mockResolvedValue({ total: 1, items: [conversationItem] });
    getConversation.mockResolvedValue({
      ...conversationItem,
      messages: [
        {
          id: "message-1",
          conversation_id: "conversation-1",
          role: "assistant",
          content: "Persisted answer",
          model: "model-test",
          created_at: "2026-07-30T12:00:00Z",
        },
      ],
    });

    render(<ProjectAiWorkspacePage />);

    expect(await screen.findByRole("heading", { name: "Existing conversation" })).toBeInTheDocument();
    expect(await screen.findByText("Persisted answer")).toBeInTheDocument();
    expect(listConversations).toHaveBeenCalledWith("project-1");
    expect(getConversation).toHaveBeenCalledWith("conversation-1");
  });

  it("creates a conversation, streams the answer, renders sources and persists both messages", async () => {
    streamProjectAnswer.mockImplementation(
      async (_projectId: string, _question: string, _conversationId: string, onEvent: (event: unknown) => void) => {
        onEvent({
          type: "metadata",
          project_id: "project-1",
          question: "What is RAG?",
          chat_provider: "test",
          chat_model: "model-test",
          embedding_provider: "test",
          embedding_model: "embed-test",
          sources: [
            {
              chunk_id: "chunk-1",
              document_id: "doc-1",
              document_name: "Architecture.pdf",
              chunk_index: 2,
              score: 0.912,
              snippet: "RAG retrieves context before generation.",
            },
          ],
        });
        onEvent({ type: "token", content: "Retrieval " });
        onEvent({ type: "token", content: "augmented generation" });
        onEvent({
          type: "done",
          answer: "Retrieval augmented generation",
          metrics: {
            confidence: 0.92,
            retrieved_chunks: 1,
            context_size: 100,
            search_time_ms: 10,
            generation_time_ms: 20,
            total_time_ms: 30,
          },
        });
      },
    );

    render(<ProjectAiWorkspacePage />);

    await screen.findByText("Nenhuma conversa salva.");
    fireEvent.change(screen.getByPlaceholderText("Digite uma pergunta sobre os documentos do projeto..."), {
      target: { value: "What is RAG?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));

    expect(await screen.findByText("Retrieval augmented generation")).toBeInTheDocument();
    expect(await screen.findByText("Architecture.pdf")).toBeInTheDocument();
    expect(screen.getByText("RAG retrieves context before generation.")).toBeInTheDocument();
    expect(screen.getByText("0.912")).toBeInTheDocument();

    expect(createConversation).toHaveBeenCalledWith("project-1", "What is RAG?");
    expect(streamProjectAnswer).toHaveBeenCalledWith(
      "project-1",
      "What is RAG?",
      "conversation-new",
      expect.any(Function),
    );
    expect(addConversationMessage).toHaveBeenNthCalledWith(1, "conversation-new", {
      role: "user",
      content: "What is RAG?",
    });
    expect(addConversationMessage).toHaveBeenNthCalledWith(2, "conversation-new", {
      role: "assistant",
      content: "Retrieval augmented generation",
      model: "model-test",
    });
  });

  it("shows streaming errors and stops the loading state", async () => {
    streamProjectAnswer.mockImplementation(
      async (_projectId: string, _question: string, _conversationId: string, onEvent: (event: unknown) => void) => {
        onEvent({ type: "error", detail: "Streaming failed" });
      },
    );

    render(<ProjectAiWorkspacePage />);
    await screen.findByText("Nenhuma conversa salva.");

    const textarea = screen.getByPlaceholderText("Digite uma pergunta sobre os documentos do projeto...");
    fireEvent.change(textarea, { target: { value: "Fail now" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));

    expect(await screen.findByText("Streaming failed")).toBeInTheDocument();
    await waitFor(() => expect(textarea).toBeEnabled());
    expect(screen.getByRole("button", { name: "Enviar" })).toBeDisabled();
  });

  it("copies a completed assistant response", async () => {
    listConversations.mockResolvedValue({ total: 1, items: [conversationItem] });
    getConversation.mockResolvedValue({
      ...conversationItem,
      messages: [
        {
          id: "message-1",
          conversation_id: "conversation-1",
          role: "assistant",
          content: "Copy this answer",
          model: "model-test",
          created_at: "2026-07-30T12:00:00Z",
        },
      ],
    });

    render(<ProjectAiWorkspacePage />);

    await screen.findByText("Copy this answer");
    fireEvent.click(screen.getByRole("button", { name: "Copiar resposta" }));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("Copy this answer");
  });
});