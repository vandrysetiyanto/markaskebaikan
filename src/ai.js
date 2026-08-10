import { campaign, aiContext } from "./campaign.js";

const DEFAULTS = {
  endpoint: campaign.ai.endpoint,
  model: campaign.ai.defaultModel,
};

export class OllamaClient {
  constructor({ endpoint = DEFAULTS.endpoint, model = DEFAULTS.model, fetchFn = fetch } = {}) {
    this.endpoint = endpoint.replace(/\/+$/, "");
    this.model = model;
    this.fetchFn = fetchFn.bind(globalThis);
    this.systemPrompt = aiContext;
  }

  get tagsUrl() {
    return `${this.endpoint}/api/tags`;
  }

  get chatUrl() {
    return `${this.endpoint}/api/chat`;
  }

  /** Returns the list of installed models, or null if unreachable. */
  async listModels() {
    try {
      const res = await this.fetchFn(this.tagsUrl);
      if (!res.ok) return null;
      const data = await res.json();
      return (data.models || []).map((m) => m.name);
    } catch {
      return null;
    }
  }

  /** True if a running model accepts this model id (or it's a known default). */
  async isModelAvailable() {
    const models = await this.listModels();
    if (!models) return false;
    return models.some((m) => m === this.model || m.startsWith(`${this.model}:`));
  }

  /**
   * Streams a chat completion from Ollama.
   * @param {Array<{role: string, content: string}>} history
   * @param {Object} opts - { onChunk, signal }
   * @returns {Promise<string>} the full assistant reply
   */
  async chat(history, { onChunk = () => {}, signal } = {}) {
    const messages = [{ role: "system", content: this.systemPrompt }, ...history];

    const res = await this.fetchFn(this.chatUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: this.model, messages, stream: true }),
      signal,
    });

    if (!res.ok) {
      throw new Error(`Ollama error ${res.status}: ${(await res.text()).slice(0, 200)}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let full = "";

    const processLines = (text) => {
      buffer += text;
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.trim()) continue;
        const parsed = JSON.parse(line);
        const piece = parsed.message?.content ?? "";
        if (piece) {
          full += piece;
          onChunk(piece, parsed);
        }
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      processLines(decoder.decode(value, { stream: true }));
    }
    processLines(decoder.decode());

    return full;
  }

  async send(session, { onChunk, signal } = {}) {
    try {
      const text = await this.chat(session.history, { onChunk, signal });
      session.push("assistant", text);
      return { ok: true, text };
    } catch (err) {
      const cancelled = err.name === "AbortError";
      return { ok: false, error: cancelled ? "cancelled" : err.message };
    }
  }
}

export class ChatSession {
  constructor() {
    this.history = [];
  }

  push(role, content) {
    this.history.push({ role, content });
    if (this.history.length > 24) this.history.splice(0, 2);
  }
}

export const suggest = [
  "Apa itu Markas Kebaikan?",
  "Kampanye apa yang sedang berjalan?",
  "Bagaimana cara donasi?",
  "Apakah donasi saya transparan?",
];
