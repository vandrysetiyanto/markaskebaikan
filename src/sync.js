import { campaign } from "./campaign.js";
import * as donations from "./donations.js";

export const SYNC_KEYS = [
  "mk_campaigns",
  "mk_donors",
  "mk_program_donations",
  "mk_payment_methods",
  "mk_distributions",
];

const KEY_PASS = "mk_sync_pass";
const KEY_META = "mk_sync_meta";
const ENDPOINT = "/api/data";
const PUSH_DEBOUNCE_MS = 800;

const clone = (v) => JSON.parse(JSON.stringify(v));

function lsGet(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function lsSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function lsRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* noop */
  }
}

function loadRaw(key, defaults) {
  const stored = lsGet(key, null);
  return Array.isArray(stored) ? stored : clone(defaults);
}

/* ---------- Pure helpers (unit-tested) ---------- */

export function sha256Hex(input) {
  const data = new TextEncoder().encode(String(input));
  return globalThis.crypto.subtle
    .digest("SHA-256", data)
    .then((buf) =>
      [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("")
    );
}

export function pickWinner(localUpdatedAt, serverUpdatedAt) {
  return serverUpdatedAt > localUpdatedAt ? "server" : "local";
}

export function buildBlob() {
  return {
    mk_campaigns: loadRaw("mk_campaigns", campaign.activeCampaigns),
    mk_donors: loadRaw("mk_donors", []),
    mk_program_donations: loadRaw("mk_program_donations", []),
    mk_payment_methods: loadRaw("mk_payment_methods", campaign.paymentMethods),
    mk_distributions: loadRaw("mk_distributions", []),
  };
}

export function applyBlob(blob) {
  if (!blob || typeof blob !== "object") return false;
  let applied = false;
  for (const key of SYNC_KEYS) {
    if (key in blob) {
      lsSet(key, blob[key]);
      applied = true;
    }
  }
  return applied;
}

/* ---------- Sync state ---------- */

const defaultMeta = () => ({ localUpdatedAt: 0, serverUpdatedAt: 0, lastSync: null, lastError: null, dirty: false });

let token = null;
let meta = defaultMeta();

function saveMeta() {
  lsSet(KEY_META, meta);
}

function notify(eventName, detail) {
  window.dispatchEvent(new CustomEvent(eventName, { detail }));
}

/* ---------- Network ---------- */

function mergeInbox(records) {
  let added = 0;
  for (const rec of records) {
    if (!rec || !rec.id) continue;
    const key = rec.programId ? "mk_program_donations" : "mk_donors";
    const list = lsGet(key, []);
    if (!Array.isArray(list) || list.some((d) => String(d.id) === String(rec.id))) continue;
    list.unshift(rec);
    lsSet(key, list);
    added++;
  }
  return added;
}

export async function pullNow() {
  if (!token) return { ok: false, error: "not_enabled" };
  try {
    const res = await fetch(ENDPOINT, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const payload = await res.json();
    const serverUpdatedAt = Number(payload.updatedAt) || 0;
    let adopted = false;
    if (pickWinner(meta.localUpdatedAt, serverUpdatedAt) === "server" && payload.data) {
      adopted = applyBlob(payload.data);
      meta.localUpdatedAt = serverUpdatedAt;
      meta.dirty = false;
    }
    meta.serverUpdatedAt = serverUpdatedAt;
    meta.lastSync = Date.now();
    meta.lastError = null;
    saveMeta();
    const inbox = await donations.consumeInbox(token);
    const inboxAdded = mergeInbox(inbox);
    if (inboxAdded > 0) {
      meta.dirty = true;
      saveMeta();
    }
    const changed = adopted || inboxAdded > 0;
    if (changed) notify("mk:synced", { source: inboxAdded > 0 ? "inbox" : "pull" });
    return { ok: true, adopted, changed, inboxAdded };
  } catch (err) {
    meta.lastError = String(err && err.message ? err.message : err);
    saveMeta();
    return { ok: false, error: meta.lastError };
  }
}

export async function pushNow() {
  if (!token) return { ok: false, error: "not_enabled" };
  meta.localUpdatedAt = Date.now();
  meta.dirty = true;
  saveMeta();
  try {
    const res = await fetch(ENDPOINT, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ updatedAt: meta.localUpdatedAt, data: buildBlob() }),
    });
    if (res.status === 409) {
      const payload = await res.json().catch(() => ({}));
      meta.serverUpdatedAt = Number(payload.serverUpdatedAt) || meta.serverUpdatedAt;
      saveMeta();
      await pullNow();
      return { ok: true, conflict: true };
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const payload = await res.json();
    meta.serverUpdatedAt = Number(payload.updatedAt) || meta.localUpdatedAt;
    meta.lastSync = Date.now();
    meta.lastError = null;
    meta.dirty = false;
    saveMeta();
    return { ok: true };
  } catch (err) {
    meta.lastError = String(err && err.message ? err.message : err);
    saveMeta();
    return { ok: false, error: meta.lastError };
  }
}

async function pushIfDirty() {
  if (meta.dirty) return pushNow();
  return { ok: true, skipped: true };
}

export async function syncNow() {
  const pull = await pullNow();
  const push = await pushIfDirty();
  return { pull, push, enabled: !!token };
}

export async function syncPoll() {
  return syncNow();
}

/* ---------- Lifecycle ---------- */

export function markDirty() {
  if (!token) return;
  meta.dirty = true;
  saveMeta();
  clearTimeout(markDirty._timer);
  markDirty._timer = setTimeout(() => {
    pushNow();
  }, PUSH_DEBOUNCE_MS);
}

export async function enableSync(passphrase) {
  const pass = String(passphrase || "").trim();
  if (!pass) return { ok: false, error: "passphrase_empty" };
  token = await sha256Hex(pass);
  lsSet(KEY_PASS, pass);
  meta = { ...defaultMeta(), ...lsGet(KEY_META, {}) };
  const pull = await pullNow();
  if (!pull.adopted) await pushNow();
  notify("mk:syncchange", getSyncStatus());
  return pull.ok ? { ok: true } : { ok: false, error: pull.error };
}

export function disableSync() {
  clearTimeout(markDirty._timer);
  token = null;
  lsRemove(KEY_PASS);
  lsRemove(KEY_META);
  meta = defaultMeta();
  notify("mk:syncchange", getSyncStatus());
}

export async function initSync() {
  const pass = lsGet(KEY_PASS, null);
  if (!pass) return null;
  const t = await sha256Hex(pass);
  token = t;
  meta = { ...defaultMeta(), ...lsGet(KEY_META, {}) };
  const pull = await pullNow();
  if (pull.ok) await pushIfDirty();
  notify("mk:syncchange", getSyncStatus());
  return meta;
}

export function getSyncStatus() {
  return { enabled: !!token, passphraseSet: !!lsGet(KEY_PASS, null), ...meta };
}
