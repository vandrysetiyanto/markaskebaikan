import { describe, it, expect, beforeEach, vi } from "vitest";
import worker from "../../worker.js";

const TOKEN = "a".repeat(64);
const OTHER = "b".repeat(64);

function makeEnv() {
  const kv = new Map();
  return {
    DATA: {
      async get(key, _type) {
        const raw = kv.get(key);
        return raw ? JSON.parse(raw) : null;
      },
      async put(key, value, _opts) {
        kv.set(key, value);
      },
      async delete(key) {
        kv.delete(key);
      },
      async list(opts = {}) {
        const prefix = opts.prefix || "";
        const limit = opts.limit || Infinity;
        const names = [...kv.keys()].filter((k) => k.startsWith(prefix)).slice(0, limit);
        return {
          keys: names.map((n) => ({ name: n })),
          list_complete: names.length < limit,
        };
      },
    },
    ASSETS: {
      fetch: vi.fn(async () => new Response("static asset")),
    },
  };
}

function req(url, opts = {}) {
  return new Request(`http://localhost${url}`, opts);
}

function authHeaders(token = TOKEN) {
  return { Authorization: `Bearer ${token}` };
}

function putBody(updatedAt, data) {
  return {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ updatedAt, data }),
  };
}

describe("worker /api/data", () => {
  let env;
  beforeEach(() => {
    env = makeEnv();
  });

  it("rejects requests without a valid bearer token", async () => {
    const r = await worker.fetch(req("/api/data"), env);
    expect(r.status).toBe(401);
  });

  it("returns empty dataset for unknown token", async () => {
    const r = await worker.fetch(req("/api/data", { headers: authHeaders() }), env);
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ updatedAt: 0, data: null });
  });

  it("stores data via PUT and returns it via GET", async () => {
    const data = { mk_campaigns: [{ id: "c1" }], mk_donors: [] };
    const put = await worker.fetch(req("/api/data", putBody(100, data)), env);
    expect(put.status).toBe(200);
    expect((await put.json()).ok).toBe(true);

    const get = await worker.fetch(req("/api/data", { headers: authHeaders() }), env);
    expect(get.status).toBe(200);
    expect(await get.json()).toEqual({ updatedAt: 100, data });
  });

  it("keeps workspaces isolated by token", async () => {
    await worker.fetch(req("/api/data", putBody(100, { mk_campaigns: [{ id: "c1" }] })), env);
    const other = await worker.fetch(req("/api/data", { headers: authHeaders(OTHER) }), env);
    expect(await other.json()).toEqual({ updatedAt: 0, data: null });
  });

  it("rejects a stale PUT with 409 and server timestamp", async () => {
    await worker.fetch(req("/api/data", putBody(200, { mk_donors: [{ id: "new" }] })), env);
    const stale = await worker.fetch(req("/api/data", putBody(100, { mk_donors: [] })), env);
    expect(stale.status).toBe(409);
    expect(await stale.json()).toEqual({ error: "conflict", serverUpdatedAt: 200 });
  });

  it("allows a PUT with equal or newer timestamp", async () => {
    await worker.fetch(req("/api/data", putBody(200, { mk_donors: [] })), env);
    const equal = await worker.fetch(req("/api/data", putBody(200, { mk_donors: [{ id: "x" }] })), env);
    expect(equal.status).toBe(200);
  });

  it("answers OPTIONS preflight with CORS headers", async () => {
    const r = await worker.fetch(req("/api/data", { method: "OPTIONS" }), env);
    expect(r.status).toBe(204);
    expect(r.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });

  it("falls through to assets for non-API paths", async () => {
    const r = await worker.fetch(req("/index.html"), env);
    expect(r.status).toBe(200);
    expect(await r.text()).toBe("static asset");
    expect(env.ASSETS.fetch).toHaveBeenCalled();
  });
});

function donationBody(overrides = {}) {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: "don-123",
      name: "Budi",
      amount: 50000,
      contact: "0812xxxx",
      message: "Semoga berkah",
      method: "pm-1",
      ref: "MK-ABC123",
      note: "transfer",
      campaignId: "c1",
      anonymous: false,
      createdAt: "2026-08-11T00:00:00.000Z",
      ...overrides,
    }),
  };
}

describe("worker /api/donation (public inbox)", () => {
  let env;
  beforeEach(() => {
    env = makeEnv();
  });

  it("accepts a valid anonymous donation without auth", async () => {
    const r = await worker.fetch(req("/api/donation", donationBody()), env);
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ ok: true, id: "don-123" });
  });

  it("rejects invalid payloads with 400", async () => {
    const zero = await worker.fetch(req("/api/donation", donationBody({ amount: 0 })), env);
    expect(zero.status).toBe(400);
    const noId = await worker.fetch(req("/api/donation", donationBody({ id: "" })), env);
    expect(noId.status).toBe(400);
    const badProof = await worker.fetch(req("/api/donation", donationBody({ proof: "javascript:alert(1)" })), env);
    expect(badProof.status).toBe(400);
  });

  it("accepts a general donation without a target (donasi umum)", async () => {
    const r = await worker.fetch(req("/api/donation", donationBody({ campaignId: "", programId: "" })), env);
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ ok: true, id: "don-123" });
    const stored = await env.DATA.get("donation:don-123", "json");
    expect(stored.campaignId).toBeUndefined();
    expect(stored.programId).toBeUndefined();
  });

  it("accepts program donations", async () => {
    const r = await worker.fetch(
      req("/api/donation", donationBody({ campaignId: "", programId: "sedekah" })),
      env
    );
    expect(r.status).toBe(200);
  });

  it("is idempotent for duplicate ids", async () => {
    await worker.fetch(req("/api/donation", donationBody()), env);
    const dup = await worker.fetch(req("/api/donation", donationBody()), env);
    expect(dup.status).toBe(200);
    expect((await dup.json()).duplicate).toBe(true);
  });

  it("rate-limits by client IP", async () => {
    const headers = { "Content-Type": "application/json", "CF-Connecting-IP": "1.2.3.4" };
    const first = await worker.fetch(req("/api/donation", { method: "POST", headers, body: donationBody().body }), env);
    expect(first.status).toBe(200);
    const second = await worker.fetch(req("/api/donation", { method: "POST", headers, body: donationBody({ id: "don-456" }).body }), env);
    expect(second.status).toBe(429);
  });
});

describe("worker /api/inbox/consume", () => {
  let env;
  beforeEach(() => {
    env = makeEnv();
  });

  it("requires an admin token", async () => {
    const r = await worker.fetch(req("/api/inbox/consume", { method: "POST" }), env);
    expect(r.status).toBe(401);
  });

  it("returns and deletes stored donations", async () => {
    await worker.fetch(req("/api/donation", donationBody()), env);
    await worker.fetch(req("/api/donation", donationBody({ id: "don-789", amount: 25000 })), env);

    const consume = await worker.fetch(
      req("/api/inbox/consume", { method: "POST", headers: authHeaders() }),
      env
    );
    expect(consume.status).toBe(200);
    const payload = await consume.json();
    expect(payload.records).toHaveLength(2);
    expect(payload.records.map((r) => r.id).sort()).toEqual(["don-123", "don-789"]);

    const again = await worker.fetch(
      req("/api/inbox/consume", { method: "POST", headers: authHeaders() }),
      env
    );
    expect((await again.json()).records).toEqual([]);
  });

  it("honours the limit parameter", async () => {
    for (const id of ["a", "b", "c"]) {
      await worker.fetch(req("/api/donation", donationBody({ id })), env);
    }
    const consume = await worker.fetch(
      req("/api/inbox/consume", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ limit: 2 }),
      }),
      env
    );
    const payload = await consume.json();
    expect(payload.records).toHaveLength(2);
    expect(payload.hasMore).toBe(true);
  });
});
