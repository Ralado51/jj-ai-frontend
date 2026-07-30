import { beforeEach, describe, expect, it, vi } from "vitest";

import { AUTH_EXPIRED_EVENT, TOKEN_KEY } from "@/lib/api";
import {
  addConversationMessage,
  createConversation,
  deleteConversation,
  getConversation,
  listConversations,
  streamProjectAnswer,
  updateConversation,
} from "@/lib/ai-workspace";

const { apiGet, apiPost, apiPatch, apiDelete } = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn(),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    api: {
      get: apiGet,
      post: apiPost,
      patch: apiPatch,
      delete: apiDelete,
    },
  };
});

function streamResponse(lines: string[]) {
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream({
      start(controller) {
        for (const line of lines) controller.enqueue(encoder.encode(line));
        controller.close();
      },
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/x-ndjson" },
    },
  );
}

describe("AI Workspace client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it("lists, creates, loads, updates and deletes conversations", async () => {
    const listPayload = { total: 1, items: [{ id: "c1" }] };
    const conversation = { id: "c1", title: "Conversation" };

    apiGet
      .mockResolvedValueOnce({ data: listPayload })
      .mockResolvedValueOnce({ data: conversation });
    apiPost.mockResolvedValueOnce({ data: conversation });
    apiPatch.mockResolvedValueOnce({ data: { ...conversation, is_favorite: true } });
    apiDelete.mockResolvedValueOnce({ data: undefined });

    await expect(listConversations("p1")).resolves.toEqual(listPayload);
    await expect(createConversation("p1", "Conversation")).resolves.toEqual(conversation);
    await expect(getConversation("c1")).resolves.toEqual(conversation);
    await expect(updateConversation("c1", { is_favorite: true })).resolves.toEqual({
      ...conversation,
      is_favorite: true,
    });
    await expect(deleteConversation("c1")).resolves.toBeUndefined();

    expect(apiGet).toHaveBeenNthCalledWith(1, "/api/v1/projects/p1/conversations");
    expect(apiPost).toHaveBeenCalledWith("/api/v1/projects/p1/conversations", {
      title: "Conversation",
    });
    expect(apiGet).toHaveBeenNthCalledWith(2, "/api/v1/conversations/c1");
    expect(apiPatch).toHaveBeenCalledWith("/api/v1/conversations/c1", {
      is_favorite: true,
    });
    expect(apiDelete).toHaveBeenCalledWith("/api/v1/conversations/c1");
  });

  it("persists conversation messages", async () => {
    apiPost.mockResolvedValueOnce({ data: { id: "c1" } });

    await addConversationMessage("c1", {
      role: "assistant",
      content: "Final answer",
      model: "gpt-test",
    });

    expect(apiPost).toHaveBeenCalledWith("/api/v1/conversations/c1/messages", {
      role: "assistant",
      content: "Final answer",
      model: "gpt-test",
    });
  });

  it("parses metadata, token and done events from a fragmented NDJSON stream", async () => {
    window.localStorage.setItem(TOKEN_KEY, "jwt-token");

    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      streamResponse([
        '{"type":"metadata","project_id":"p1","question":"Q","chat_provider":"test","chat_model":"model","embedding_provider":"test","embedding_model":"embed","sources":[]}\n',
        '{"type":"token","content":"Hello "}\n{"type":"token","content":"world"}\n',
        '{"type":"done","answer":"Hello world","metrics":{"confidence":0.9,"retrieved_chunks":1,"context_size":10,"search_time_ms":1,"generation_time_ms":2,"total_time_ms":3}}',
      ]),
    );

    const events: Array<{ type: string }> = [];
    await streamProjectAnswer("p1", "Q", "c1", (event) => events.push(event));

    expect(events.map((event) => event.type)).toEqual(["metadata", "token", "token", "done"]);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.jjnetwork.com.br/api/v1/projects/p1/ask/stream",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer jwt-token",
          Accept: "application/x-ndjson",
        }),
        body: JSON.stringify({
          question: "Q",
          conversation_id: "c1",
          top_k: 5,
          min_score: 0.2,
        }),
      }),
    );
  });

  it("surfaces API errors from the stream endpoint", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: "Model unavailable" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(streamProjectAnswer("p1", "Q", undefined, vi.fn())).rejects.toThrow(
      "Model unavailable",
    );
  });

  it("clears the token and emits the expiration event on 401", async () => {
    window.localStorage.setItem(TOKEN_KEY, "expired-token");
    const listener = vi.fn();
    window.addEventListener(AUTH_EXPIRED_EVENT, listener);

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(null, { status: 401 }),
    );

    await expect(streamProjectAnswer("p1", "Q", "c1", vi.fn())).rejects.toThrow(
      "Sua sessão expirou",
    );

    expect(window.localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(listener).toHaveBeenCalledOnce();
    window.removeEventListener(AUTH_EXPIRED_EVENT, listener);
  });

  it("rejects successful responses without a readable body", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      body: null,
    } as Response);

    await expect(streamProjectAnswer("p1", "Q", undefined, vi.fn())).rejects.toThrow(
      "A API não retornou um fluxo de resposta",
    );
  });
});