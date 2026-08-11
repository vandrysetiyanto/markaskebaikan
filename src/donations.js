export const QUEUE_KEY = "mk_donations_queue";
const DONATION_ENDPOINT = "/api/donation";
const INBOX_ENDPOINT = "/api/inbox/consume";
const QUEUE_CAP = 100;

function lsGet(key, fallback) {
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

let flushing = false;

export function getQueuedDonations() {
  const q = lsGet(QUEUE_KEY, null);
  return Array.isArray(q) ? q : [];
}

export function queueDonation(record) {
  if (!record || !record.id) return false;
  const q = getQueuedDonations();
  if (q.some((r) => r.id === record.id)) return true;
  q.push(record);
  if (q.length > QUEUE_CAP) q.splice(0, q.length - QUEUE_CAP);
  lsSet(QUEUE_KEY, q);
  flushQueue();
  return true;
}

export async function flushQueue() {
  if (flushing) return false;
  flushing = true;
  try {
    const q = getQueuedDonations();
    const remaining = [];
    for (const rec of q) {
      let ok = false;
      try {
        const res = await fetch(DONATION_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rec),
        });
        ok = res.status === 200 || res.status === 201;
      } catch {
        ok = false;
      }
      if (!ok) remaining.push(rec);
    }
    lsSet(QUEUE_KEY, remaining);
    return remaining.length === 0;
  } finally {
    flushing = false;
  }
}

export async function consumeInbox(token = "") {
  try {
    const res = await fetch(INBOX_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({}),
    });
    if (!res.ok) return [];
    const payload = await res.json();
    return Array.isArray(payload.records) ? payload.records : [];
  } catch {
    return [];
  }
}
