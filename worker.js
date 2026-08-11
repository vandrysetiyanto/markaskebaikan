const API_DATA = "/api/data";
const API_DONATION = "/api/donation";
const API_INBOX = "/api/inbox/consume";

const MAX_BODY_BYTES = 16 * 1024 * 1024;
const MAX_DONATION_BYTES = 8 * 1024 * 1024;
const MAX_PROOF_LENGTH = 6 * 1024 * 1024;
const RATE_COOLDOWN_S = 60;
const INBOX_TTL_S = 7 * 24 * 3600;
const INBOX_CONSUME_LIMIT = 100;

const KV_PREFIX = "data:";
const INBOX_PREFIX = "donation:";
const RATE_PREFIX = "rate:";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...CORS_HEADERS, ...extra },
  });
}

function authToken(request) {
  const header = request.headers.get("Authorization") || "";
  const token = header.replace(/^Bearer\s+/i, "").trim();
  return /^[0-9a-f]{64}$/.test(token) ? token : null;
}

async function readJsonBody(request, maxBytes) {
  const length = Number(request.headers.get("Content-Length") || 0);
  if (length > maxBytes) return { error: "payload_too_large" };
  const raw = await request.text();
  if (raw.length > maxBytes) return { error: "payload_too_large" };
  try {
    return { body: JSON.parse(raw) };
  } catch {
    return { error: "invalid_json" };
  }
}

/* ---------- Donation inbox ---------- */

function normalizeDonation(raw) {
  if (!raw || typeof raw !== "object") return null;
  const id = typeof raw.id === "string" ? raw.id.trim() : "";
  if (!id || id.length > 64) return null;

  const amount = Number(raw.amount);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const hasCampaign = typeof raw.campaignId === "string" && raw.campaignId.trim();
  const hasProgram = typeof raw.programId === "string" && raw.programId.trim();

  let proof;
  if (raw.proof != null) {
    if (
      typeof raw.proof !== "string" ||
      raw.proof.length > MAX_PROOF_LENGTH ||
      !/^data:image\//.test(raw.proof)
    ) {
      return null;
    }
    proof = raw.proof;
  }

  return {
    id,
    name: typeof raw.name === "string" && raw.name.trim() ? raw.name.trim().slice(0, 120) : "Hamba Allah",
    amount,
    contact: typeof raw.contact === "string" ? raw.contact.slice(0, 120) : "",
    message: typeof raw.message === "string" ? raw.message.slice(0, 1000) : "",
    method: typeof raw.method === "string" ? raw.method.slice(0, 64) : "",
    ref: typeof raw.ref === "string" ? raw.ref.slice(0, 20) : "",
    note: typeof raw.note === "string" ? raw.note.slice(0, 200) : "",
    status: "pending",
    createdAt:
      typeof raw.createdAt === "string" && raw.createdAt
        ? raw.createdAt.slice(0, 40)
        : new Date().toISOString(),
    ...(hasCampaign ? { campaignId: raw.campaignId.trim().slice(0, 64) } : {}),
    ...(hasProgram ? { programId: raw.programId.trim().slice(0, 64) } : {}),
    ...(raw.anonymous === true ? { anonymous: true } : {}),
    ...(proof ? { proof } : {}),
  };
}

async function rateLimited(env, ip) {
  if (!ip) return false;
  const key = RATE_PREFIX + ip;
  const hit = await env.DATA.get(key);
  if (hit) return true;
  await env.DATA.put(key, "1", { expirationTtl: RATE_COOLDOWN_S });
  return false;
}

async function handleDonation(request, env) {
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const { body, error } = await readJsonBody(request, MAX_DONATION_BYTES);
  if (error) return json({ error }, error === "payload_too_large" ? 413 : 400);

  const ip =
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For") ||
    "";
  if (await rateLimited(env, ip)) {
    return json({ error: "too_frequent", retryAfter: RATE_COOLDOWN_S }, 429);
  }

  const d = normalizeDonation(body);
  if (!d) return json({ error: "invalid_donation" }, 400);

  const key = INBOX_PREFIX + d.id;
  const existing = await env.DATA.get(key);
  if (existing) return json({ ok: true, id: d.id, duplicate: true });

  await env.DATA.put(key, JSON.stringify(d), { expirationTtl: INBOX_TTL_S });
  return json({ ok: true, id: d.id });
}

async function handleInboxConsume(request, env) {
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const token = authToken(request);
  if (!token) return json({ error: "unauthorized" }, 401);

  let limit = INBOX_CONSUME_LIMIT;
  const raw = await request.text().catch(() => "");
  if (raw) {
    try {
      const b = JSON.parse(raw);
      if (Number.isFinite(Number(b.limit))) {
        limit = Math.max(1, Math.min(INBOX_CONSUME_LIMIT, Number(b.limit)));
      }
    } catch {
      /* ignore */
    }
  }

  const listed = await env.DATA.list({ prefix: INBOX_PREFIX, limit });
  const records = [];
  for (const k of listed.keys) {
    const v = await env.DATA.get(k.name, "json");
    if (v) records.push(v);
    await env.DATA.delete(k.name);
  }
  return json({ ok: true, records, hasMore: !listed.list_complete });
}

/* ---------- Data blob ---------- */

async function handleData(request, env) {
  const token = authToken(request);
  if (!token) return json({ error: "unauthorized" }, 401);

  const key = KV_PREFIX + token;

  if (request.method === "GET") {
    const stored = await env.DATA.get(key, "json");
    if (!stored) return json({ updatedAt: 0, data: null });
    return json({ updatedAt: Number(stored.updatedAt) || 0, data: stored.data });
  }

  if (request.method === "PUT") {
    const { body, error } = await readJsonBody(request, MAX_BODY_BYTES);
    if (error) return json({ error }, error === "payload_too_large" ? 413 : 400);
    const updatedAt = Number(body.updatedAt) || 0;
    if (!body.data || typeof body.data !== "object") {
      return json({ error: "invalid_data" }, 400);
    }
    const stored = await env.DATA.get(key, "json");
    const serverUpdatedAt = stored ? Number(stored.updatedAt) || 0 : 0;
    if (updatedAt < serverUpdatedAt) {
      return json({ error: "conflict", serverUpdatedAt }, 409);
    }
    await env.DATA.put(key, JSON.stringify({ updatedAt, data: body.data }));
    return json({ ok: true, updatedAt });
  }

  return json({ error: "method_not_allowed" }, 405);
}

async function handleApi(request, env) {
  const url = new URL(request.url);
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (url.pathname === API_DATA) return handleData(request, env);
  if (url.pathname === API_DONATION) return handleDonation(request, env);
  if (url.pathname === API_INBOX) return handleInboxConsume(request, env);
  return json({ error: "not_found" }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      return handleApi(request, env);
    }
    return env.ASSETS.fetch(request);
  },
};
