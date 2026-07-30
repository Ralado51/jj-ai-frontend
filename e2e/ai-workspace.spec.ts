import { expect, test } from "@playwright/test";

const project = {
  id: "project-1",
  name: "JJ AI Platform",
  slug: "jj-ai-platform",
  description: "Projeto principal da plataforma",
  is_active: true,
  created_at: "2026-07-30T12:00:00Z",
  updated_at: "2026-07-30T12:00:00Z",
};

const user = {
  id: "user-1",
  email: "admin@jjnetwork.com.br",
  full_name: "Airton Justino",
  role: "admin",
};

test("login, project navigation, AI streaming, history and logout", async ({ page }) => {
  let conversations: Array<Record<string, unknown>> = [];
  let messages: Array<Record<string, unknown>> = [];

  await page.route("**/api/v1/auth/login", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ access_token: "e2e-token", token_type: "bearer", user }),
    });
  });

  await page.route("**/api/v1/auth/me", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(user) });
  });

  await page.route("**/api/v1/projects?**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([project]) });
  });

  await page.route("**/api/v1/projects/project-1/conversations", async (route) => {
    const request = route.request();
    if (request.method() === "POST") {
      const payload = request.postDataJSON() as { title?: string };
      const created = {
        id: "conversation-1",
        project_id: "project-1",
        user_id: "user-1",
        title: payload.title ?? "Nova conversa",
        is_favorite: false,
        created_at: "2026-07-30T12:00:00Z",
        updated_at: "2026-07-30T12:00:00Z",
        messages: [],
      };
      conversations = [created];
      await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify(created) });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ total: conversations.length, items: conversations }),
    });
  });

  await page.route("**/api/v1/conversations/conversation-1", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ...conversations[0], messages }),
    });
  });

  await page.route("**/api/v1/conversations/conversation-1/messages", async (route) => {
    const payload = route.request().postDataJSON() as Record<string, unknown>;
    messages = [
      ...messages,
      {
        id: `message-${messages.length + 1}`,
        conversation_id: "conversation-1",
        created_at: "2026-07-30T12:00:00Z",
        model: null,
        ...payload,
      },
    ];
    await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ ...conversations[0], messages }) });
  });

  await page.route("**/api/v1/projects/project-1/ask/stream", async (route) => {
    const ndjson = [
      JSON.stringify({
        type: "metadata",
        project_id: "project-1",
        question: "Como funciona o RAG?",
        chat_provider: "test",
        chat_model: "model-test",
        embedding_provider: "test",
        embedding_model: "embed-test",
        sources: [
          {
            chunk_id: "chunk-1",
            document_id: "doc-1",
            document_name: "Architecture.pdf",
            chunk_index: 1,
            score: 0.93,
            snippet: "RAG recupera contexto relevante antes de gerar a resposta.",
          },
        ],
      }),
      JSON.stringify({ type: "token", content: "RAG recupera " }),
      JSON.stringify({ type: "token", content: "contexto relevante." }),
      JSON.stringify({
        type: "done",
        answer: "RAG recupera contexto relevante.",
        metrics: {
          confidence: 0.93,
          retrieved_chunks: 1,
          context_size: 120,
          search_time_ms: 12,
          generation_time_ms: 20,
          total_time_ms: 32,
        },
      }),
    ].join("\n");

    await route.fulfill({ status: 200, contentType: "application/x-ndjson", body: ndjson });
  });

  await page.goto("/login");
  await page.getByLabel("E-mail").fill("admin@jjnetwork.com.br");
  await page.getByLabel("Senha").fill("password123");
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await page.getByRole("link", { name: "Projetos" }).click();
  await expect(page.getByRole("heading", { name: "Projetos" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "JJ AI Platform" })).toBeVisible();

  await page.getByRole("link", { name: "AI Workspace" }).click();
  await expect(page.getByRole("heading", { name: "AI Workspace" })).toBeVisible();

  await page.getByPlaceholder("Digite uma pergunta sobre os documentos do projeto...").fill("Como funciona o RAG?");
  await page.getByRole("button", { name: "Enviar" }).click();

  await expect(page.getByText("RAG recupera contexto relevante.")).toBeVisible();
  await expect(page.getByText("Architecture.pdf")).toBeVisible();
  await expect(page.getByText("0.930")).toBeVisible();
  await expect(page.getByText("Como funciona o RAG?", { exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { name: "Como funciona o RAG?" })).toBeVisible();
  await expect(page.getByText("RAG recupera contexto relevante.")).toBeVisible();

  await page.evaluate(() => window.localStorage.removeItem("jj_ai_access_token"));
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Entrar na plataforma" })).toBeVisible();
});
