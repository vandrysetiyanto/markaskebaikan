import { OllamaClient, ChatSession, suggest } from "./ai.js";
import { campaign } from "./campaign.js";
import { icons as lc } from "./icons.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function campaignModels() {
  return [...new Set([campaign.ai.defaultModel, ...campaign.ai.models])];
}

export class Chatbot {
  constructor({ client } = {}) {
    this.client = client ?? new OllamaClient();
    this.session = new ChatSession();
    this.opened = false;
    this.busy = false;
    this.abort = null;
    this.buildDom();
    this.attachEvents();
    this.checkStatus();
  }

  buildDom() {
    this.fab = document.createElement("button");
    this.fab.className = "chat-fab";
    this.fab.type = "button";
    this.fab.setAttribute("aria-label", "Buka asisten AI");
    this.fab.innerHTML = this.fabIcon();

    this.panel = document.createElement("div");
    this.panel.className = "chat-panel";
    this.panel.setAttribute("role", "dialog");
    this.panel.setAttribute("aria-label", "Campaign AI assistant");
    this.panel.innerHTML = this.panelTemplate();

    document.body.appendChild(this.fab);
    document.body.appendChild(this.panel);

    this.els = {
      panel: this.panel,
      body: this.panel.querySelector(".chat-body"),
      log: this.panel.querySelector(".chat-log"),
      form: this.panel.querySelector(".chat-form"),
      input: this.panel.querySelector(".chat-input"),
      send: this.panel.querySelector(".chat-send"),
      close: this.panel.querySelector(".chat-close"),
      model: this.panel.querySelector(".chat-model"),
      status: this.panel.querySelector(".chat-status"),
      chips: this.panel.querySelector(".chat-chips"),
    };
  }

  attachEvents() {
    this.fab.addEventListener("click", () => this.toggle());
    this.els.close.addEventListener("click", () => this.toggle(false));
    this.els.model.addEventListener("change", () => {
      this.client.model = this.els.model.value;
      this.els.status.textContent = `model: ${this.els.model.value}`;
    });
    this.els.form.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = this.els.input.value.trim();
      if (!text || this.busy) return;
      this.ask(text);
    });
    this.els.chips.addEventListener("click", (e) => {
      const chip = e.target.closest(".chat-chip");
      if (!chip) return;
      this.ask(chip.dataset.q);
    });
    this.els.input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.els.input.blur();
    });
  }

  toggle(force) {
    const next = force ?? !this.opened;
    this.opened = next;
    this.panel.classList.toggle("open", next);
    this.fab.classList.toggle("hidden", next);
    if (next) {
      this.els.input.focus();
      if (!this.els.log.children.length) this.greet();
    }
  }

  async checkStatus() {
    const setState = (label, state) => {
      this.els.status.textContent = label;
      this.els.status.dataset.state = state;
    };
    setState("memeriksa Ollama…", "busy");
    const models = await this.client.listModels();
    if (!models) {
      setState("Ollama tidak terhubung", "offline");
      return;
    }
    const has = await this.client.isModelAvailable();
    setState(
      has ? `terhubung · ${this.client.model}` : `terhubung · model "${this.client.model}" belum di-pull`,
      has ? "online" : "warn"
    );
  }

  greet() {
    this.addMessage(
      "assistant",
      "Assalamu'alaikum! Aku asisten Markas Kebaikan, berjalan di AI lokalmu. Tanya apa saja tentang kampanye, program, atau cara sedekah.",
      { isGreeting: true }
    );
  }

  ask(text) {
    this.els.chips.classList.remove("show");
    this.addMessage("user", text);
    this.session.push("user", text);
    const { bubble } = this.addMessage("assistant", "", { typing: true });
    this.busy = true;
    this.els.send.disabled = true;
    this.els.input.disabled = true;

    this.abort = new AbortController();
    this.client
      .send(this.session, {
        onChunk: async (piece) => {
          bubble.textContent += piece;
          bubble.scrollIntoView({ block: "nearest" });
          await sleep(0);
        },
        signal: this.abort.signal,
      })
      .then(({ ok, error }) => {
        if (!ok && error === "cancelled") return;
        if (!ok) {
          bubble.textContent = "";
          this.addSystem(
            error?.includes("not reachable") || error?.includes("Failed to fetch")
              ? "Tidak bisa menjangkau Ollama. Pastikan sudah berjalan — coba `ollama serve` lalu `ollama pull llama3.2`."
              : `Kesalahan AI: ${error}.`
          );
          bubble.remove();
        }
        this.els.status.textContent = `terhubung · ${this.client.model}`;
        this.els.status.dataset.state = "online";
      })
      .finally(() => {
        this.busy = false;
        this.els.send.disabled = false;
        this.els.input.disabled = false;
        this.els.input.focus();
        this.els.chips.classList.remove("show");
      });
  }

  addMessage(role, text, { typing = false, isGreeting = false } = {}) {
    const row = document.createElement("div");
    row.className = `chat-msg ${role}`;
    const bubble = document.createElement("div");
    bubble.className = "chat-bubble";
    if (text) bubble.textContent = text;
    if (typing) bubble.classList.add("typing");
    row.appendChild(bubble);
    this.els.log.appendChild(row);
    this.els.log.scrollTop = this.els.log.scrollHeight;
    if (isGreeting) {
      this.els.chips.classList.add("show");
      this.els.chips.innerHTML = suggest
        .map((q) => `<button type="button" class="chat-chip" data-q="${q.replace(/"/g, "&quot;")}">${q}</button>`)
        .join("");
    }
    return { row, bubble };
  }

  addSystem(text) {
    const row = document.createElement("div");
    row.className = "chat-msg system";
    row.textContent = text;
    this.els.log.appendChild(row);
    this.els.log.scrollTop = this.els.log.scrollHeight;
  }

  fabIcon() {
    return lc.messageCircle({ size: 26 });
  }

  panelTemplate() {
    const modelOptions = campaignModels()
      .map((m) => `<option value="${m}" ${m === this.client.model ? "selected" : ""}>${m}</option>`)
      .join("");
    return `
      <div class="chat-header">
        <div>
          <strong>Asisten Markas Kebaikan</strong>
          <span class="chat-status" data-state="busy">memeriksa…</span>
        </div>
        <div class="chat-tools">
          <select class="chat-model" aria-label="Model">${modelOptions}</select>
          <button type="button" class="chat-close" aria-label="Tutup">
            ${lc.x({ size: 15, "stroke-width": 2.2, "aria-hidden": "true" })}
          </button>
        </div>
      </div>
      <div class="chat-body">
        <div class="chat-log"></div>
        <div class="chat-chips" aria-label="Pertanyaan yang disarankan"></div>
      </div>
      <form class="chat-form">
        <input class="chat-input" type="text" name="message" aria-label="Pesan" placeholder="Tanya tentang kampanye…" autocomplete="off" />
        <button type="submit" class="chat-send" aria-label="Kirim">
          ${lc.send({ size: 18 })}
        </button>
      </form>`;
  }
}
