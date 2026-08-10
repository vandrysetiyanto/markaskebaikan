import { describe, it, expect } from "vitest";
import { OllamaClient, ChatSession, suggest } from "../ai.js";
import { campaign } from "../campaign.js";

const mockFetchOk = (streamLines = []) => {
  const chunks = streamLines.map((l) => new TextEncoder().encode(JSON.stringify(l) + "\n"));
  const body = { getReader: () => newMockReader(chunks) };
  return async () => ({ ok: true, status: 200, body });
};

const newMockReader = (chunks) => {
  let i = 0;
  return {
    read: async () => (i < chunks.length ? { done: false, value: chunks[i++] } : { done: true }),
  };
};

describe("OllamaClient", () => {
  it("normalizes trailing slashes on the endpoint", () => {
    const client = new OllamaClient({ endpoint: "http://localhost:11434/", fetchFn: fetch });
    expect(client.tagsUrl).toBe("http://localhost:11434/api/tags");
    expect(client.chatUrl).toBe("http://localhost:11434/api/chat");
  });

  it("listModels returns model names or null when offline", async () => {
    const online = new OllamaClient({
      fetchFn: async () => ({ ok: true, json: async () => ({ models: [{ name: "llama3.2:latest" }] }) }),
    });
    expect(await online.listModels()).toEqual(["llama3.2:latest"]);

    const offline = new OllamaClient({ fetchFn: async () => { throw new Error("offline"); } });
    expect(await offline.listModels()).toBeNull();
  });

  it("isModelAvailable detects the configured model", async () => {
    const client = new OllamaClient({
      model: "llama3.2",
      fetchFn: async () => ({ ok: true, json: async () => ({ models: [{ name: "llama3.2:latest" }] }) }),
    });
    expect(await client.isModelAvailable()).toBe(true);
  });

  it("streams a chat reply and reports chunks", async () => {
    const lines = [
      { message: { content: "Hello" }, done: false },
      { message: { content: " there" }, done: false },
      { message: { content: "!" }, done: true },
    ];
    const client = new OllamaClient({ fetchFn: mockFetchOk(lines) });
    const chunks = [];
    const full = await client.chat([{ role: "user", content: "hi" }], { onChunk: (c) => chunks.push(c) });
    expect(full).toBe("Hello there!");
    expect(chunks.join("")).toBe("Hello there!");
  });

  it("includes the campaign context as a system message", async () => {
    let sentBody = null;
    const fetchFn = async (_url, opts) => {
      sentBody = JSON.parse(opts.body);
      return { ok: true, body: { getReader: () => newMockReader([]) } };
    };
    const client = new OllamaClient({ fetchFn });
    await client.chat([{ role: "user", content: "hi" }]);
    expect(sentBody.stream).toBe(true);
    expect(sentBody.model).toBe(campaign.ai.defaultModel);
    expect(sentBody.messages[0].role).toBe("system");
    expect(sentBody.messages[0].content).toContain(campaign.name);
    expect(sentBody.messages[1]).toEqual({ role: "user", content: "hi" });
  });

  it("send() pushes assistant turns into the session", async () => {
    const client = new OllamaClient({
      fetchFn: mockFetchOk([{ message: { content: "Sure!" }, done: false }]),
    });
    const session = new ChatSession();
    session.push("user", "hello");
    const result = await client.send(session);
    expect(result.ok).toBe(true);
    expect(session.history.at(-1)).toEqual({ role: "assistant", content: "Sure!" });
  });

  it("send() reports errors without throwing", async () => {
    const client = new OllamaClient({
      fetchFn: async () => ({ ok: false, status: 404, text: async () => "model not found" }),
    });
    const session = new ChatSession();
    session.push("user", "hello");
    const result = await client.send(session);
    expect(result.ok).toBe(false);
    expect(result.error).toContain("Ollama error 404");
  });

  it("send() distinguishes aborts", async () => {
    const client = new OllamaClient({
      fetchFn: async () => { const e = new Error("Aborted"); e.name = "AbortError"; throw e; },
    });
    const session = new ChatSession();
    session.push("user", "hello");
    const result = await client.send(session);
    expect(result.error).toBe("cancelled");
  });
});

describe("ChatSession", () => {
  it("caps history length", () => {
    const session = new ChatSession();
    for (let i = 0; i < 30; i++) session.push("user", `m${i}`);
    expect(session.history.length).toBeLessThanOrEqual(24);
  });
});

describe("suggest", () => {
  it("provides starter questions", () => {
    expect(suggest.length).toBeGreaterThanOrEqual(3);
    expect(suggest.every((s) => typeof s === "string")).toBe(true);
  });
});
