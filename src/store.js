import { campaign } from "./campaign.js";
import { markDirty } from "./sync.js";

const KEY_CAMPAIGNS = "mk_campaigns";
const KEY_DONORS = "mk_donors";
const KEY_PROGRAM_DONATIONS = "mk_program_donations";
const KEY_PAYMENT_METHODS = "mk_payment_methods";
const KEY_DISTRIBUTIONS = "mk_distributions";
const KEY_ADMIN = "mk_admin_logged_in";

export const ADMIN_USER = "admin";
export const ADMIN_PASS = "markaskebaikan123";

export const uid = (prefix = "") =>
  `${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

export function sanitizeHTML(str) {
  const div = document.createElement("div");
  div.textContent = String(str ?? "");
  return div.innerHTML;
}

export function sanitizeURL(url) {
  const s = String(url ?? "").trim();
  if (!s) return "";
  if (s.startsWith("data:image/")) return s;
  try {
    const u = new URL(s, window.location.href);
    return /^https?:$/.test(u.protocol) ? u.href : "";
  } catch {
    return "";
  }
}

export function formatRupiah(n) {
  return `Rp ${new Intl.NumberFormat("id-ID").format(Number(n) || 0)}`;
}

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    markDirty();
    return true;
  } catch {
    return false;
  }
}

const clone = (v) => JSON.parse(JSON.stringify(v));

/* ---------- Campaigns (mk_campaigns) ---------- */

function defaultCampaigns() {
  return clone(campaign.activeCampaigns);
}

function loadCampaignsRaw() {
  const stored = read(KEY_CAMPAIGNS, null);
  return Array.isArray(stored) ? stored : defaultCampaigns();
}

export function getCampaignsRaw() {
  return loadCampaignsRaw();
}

export function getCampaigns() {
  return recalcPendingFromDonors(loadCampaignsRaw(), getDonors());
}

export function isCampaignActive(c) {
  return c.status !== "nonaktif";
}

export function getActiveCampaigns() {
  return getCampaigns().filter(isCampaignActive);
}

export function setCampaignActive(id, active) {
  return updateCampaign(id, { status: active ? "aktif" : "nonaktif" });
}

export function saveCampaigns(list) {
  return write(KEY_CAMPAIGNS, list);
}

export function addCampaign(data) {
  const list = loadCampaignsRaw();
  const c = { id: uid(""), ...data };
  list.push(c);
  saveCampaigns(list);
  return c;
}

export function updateCampaign(id, patch) {
  const list = loadCampaignsRaw();
  const i = list.findIndex((c) => String(c.id) === String(id));
  if (i === -1) return null;
  list[i] = { ...list[i], ...patch, id: list[i].id };
  saveCampaigns(list);
  return list[i];
}

export function deleteCampaign(id) {
  saveCampaigns(loadCampaignsRaw().filter((c) => String(c.id) !== String(id)));
}

export function resetCampaigns() {
  localStorage.removeItem(KEY_CAMPAIGNS);
  markDirty();
}

/* ---------- Donors (mk_donors) ---------- */

export function getDonors() {
  return read(KEY_DONORS, []);
}

function saveDonors(list) {
  return write(KEY_DONORS, list);
}

export function saveDonor(donor) {
  const list = getDonors();
  list.unshift(donor);
  saveDonors(list);
}

function adjustCampaignCollected(campaignId, delta) {
  const list = loadCampaignsRaw();
  const c = list.find((x) => String(x.id) === String(campaignId));
  if (!c) return;
  c.collected = Math.max(0, (Number(c.collected) || 0) + delta);
  saveCampaigns(list);
}

export function updateDonorStatus(id, status) {
  saveDonors(
    getDonors().map((d) => (String(d.id) === String(id) ? { ...d, status } : d))
  );
}

export function approveDonor(id) {
  const donors = getDonors();
  const d = donors.find((x) => String(x.id) === String(id));
  if (!d) return null;
  if (d.status !== "confirmed") {
    d.status = "confirmed";
    saveDonors(donors);
    if (d.campaignId) adjustCampaignCollected(d.campaignId, Number(d.amount) || 0);
  }
  return d;
}

export function reopenDonor(id) {
  const donors = getDonors();
  const d = donors.find((x) => String(x.id) === String(id));
  if (!d) return null;
  if (d.status === "confirmed") {
    d.status = "pending";
    saveDonors(donors);
    if (d.campaignId) adjustCampaignCollected(d.campaignId, -(Number(d.amount) || 0));
  }
  return d;
}

export function deleteDonor(id) {
  const donors = getDonors();
  const d = donors.find((x) => String(x.id) === String(id));
  if (d && d.status === "confirmed" && d.campaignId) {
    adjustCampaignCollected(d.campaignId, -(Number(d.amount) || 0));
  }
  saveDonors(donors.filter((x) => String(x.id) !== String(id)));
}

export function deleteDonors(ids) {
  ids.forEach((id) => deleteDonor(id));
}

export function clearDonors() {
  localStorage.removeItem(KEY_DONORS);
  markDirty();
}

export function donorStats() {
  const donors = getDonors();
  return {
    total: donors.length,
    confirmed: donors.filter((d) => d.status === "confirmed").length,
    pending: donors.filter((d) => d.status === "pending").length,
  };
}

/* ---------- Program donations (mk_program_donations) ---------- */

export function getProgramDonations() {
  return read(KEY_PROGRAM_DONATIONS, []);
}

function saveProgramDonations(list) {
  return write(KEY_PROGRAM_DONATIONS, list);
}

export function saveProgramDonation(donation) {
  const list = getProgramDonations();
  list.unshift(donation);
  saveProgramDonations(list);
}

export function updateProgramDonationStatus(id, status) {
  saveProgramDonations(
    getProgramDonations().map((d) =>
      String(d.id) === String(id) ? { ...d, status } : d
    )
  );
}

export function approveProgramDonation(id) {
  const list = getProgramDonations();
  const d = list.find((x) => String(x.id) === String(id));
  if (!d) return null;
  if (d.status !== "confirmed") {
    d.status = "confirmed";
    saveProgramDonations(list);
  }
  return d;
}

export function reopenProgramDonation(id) {
  const list = getProgramDonations();
  const d = list.find((x) => String(x.id) === String(id));
  if (!d) return null;
  if (d.status === "confirmed") {
    d.status = "pending";
    saveProgramDonations(list);
  }
  return d;
}

export function deleteProgramDonation(id) {
  saveProgramDonations(
    getProgramDonations().filter((d) => String(d.id) !== String(id))
  );
}

export function deleteProgramDonations(ids) {
  saveProgramDonations(
    getProgramDonations().filter(
      (d) => !ids.some((id) => String(id) === String(d.id))
    )
  );
}

/* ---------- Payment methods (mk_payment_methods) ---------- */

function defaultPaymentMethods() {
  return clone(campaign.paymentMethods);
}

function loadPaymentMethodsRaw() {
  const stored = read(KEY_PAYMENT_METHODS, null);
  return Array.isArray(stored) ? stored : defaultPaymentMethods();
}

export function getPaymentMethods() {
  return loadPaymentMethodsRaw();
}

export function getActivePaymentMethods() {
  return loadPaymentMethodsRaw().filter((m) => m.enabled !== false);
}

export function savePaymentMethods(list) {
  return write(KEY_PAYMENT_METHODS, list);
}

export function addPaymentMethod(data) {
  const list = loadPaymentMethodsRaw();
  const m = { id: uid("pm-"), enabled: true, ...data };
  list.push(m);
  savePaymentMethods(list);
  return m;
}

export function updatePaymentMethod(id, patch) {
  const list = loadPaymentMethodsRaw();
  const i = list.findIndex((m) => String(m.id) === String(id));
  if (i === -1) return null;
  list[i] = { ...list[i], ...patch, id: list[i].id };
  savePaymentMethods(list);
  return list[i];
}

export function togglePaymentMethod(id, enabled) {
  return updatePaymentMethod(id, { enabled: Boolean(enabled) });
}

export function deletePaymentMethod(id) {
  savePaymentMethods(
    loadPaymentMethodsRaw().filter((m) => String(m.id) !== String(id))
  );
}

export function resetPaymentMethods() {
  localStorage.removeItem(KEY_PAYMENT_METHODS);
  markDirty();
}

/* ---------- Reset all data ---------- */

export function resetAllData() {
  localStorage.removeItem(KEY_CAMPAIGNS);
  localStorage.removeItem(KEY_DONORS);
  localStorage.removeItem(KEY_PROGRAM_DONATIONS);
  localStorage.removeItem(KEY_DISTRIBUTIONS);
  markDirty();
}

export function validatePaymentMethod(m) {
  const errors = [];
  if (!String(m.label || "").trim()) errors.push("Nama metode wajib diisi.");
  if (!["qris", "va"].includes(m.kind)) errors.push("Jenis metode tidak valid.");
  if (m.kind === "va") {
    if (!String(m.vaName || "").trim()) errors.push("Nama rekening (VA) wajib diisi.");
    if (!String(m.vaNumber || "").trim()) errors.push("Nomor VA wajib diisi.");
  }
  return errors;
}

/* ---------- Derived values ---------- */

export function recalcPendingFromDonors(campaigns, donors) {
  const map = {};
  for (const d of donors) {
    if (d.status !== "pending" || !d.campaignId) continue;
    map[d.campaignId] = (map[d.campaignId] || 0) + (Number(d.amount) || 0);
  }
  return campaigns.map((c) => ({
    ...c,
    pendingCollected: map[String(c.id)] || 0,
  }));
}

export function programTotals() {
  const confirmed = getProgramDonations().filter((d) => d.status === "confirmed");
  const totals = {};
  for (const d of confirmed) {
    totals[d.programId] = (totals[d.programId] || 0) + (Number(d.amount) || 0);
  }
  return totals;
}

/* ---------- Distributions (mk_distributions) ---------- */

export function getDistributions() {
  return read(KEY_DISTRIBUTIONS, []);
}

export function saveDistribution(data) {
  const list = getDistributions();
  const d = { id: uid(""), createdAt: new Date().toISOString(), ...data };
  list.unshift(d);
  write(KEY_DISTRIBUTIONS, list);
  return d;
}

export function deleteDistribution(id) {
  write(
    KEY_DISTRIBUTIONS,
    getDistributions().filter((d) => String(d.id) !== String(id))
  );
}

export function clearDistributions() {
  localStorage.removeItem(KEY_DISTRIBUTIONS);
  markDirty();
}

export function distributionTotals() {
  const totals = {};
  for (const d of getDistributions()) {
    totals[d.programId] = (totals[d.programId] || 0) + (Number(d.amount) || 0);
  }
  return totals;
}

export function programBalance() {
  const received = programTotals();
  const distributed = distributionTotals();
  const ids = new Set([...Object.keys(received), ...Object.keys(distributed)]);
  const out = {};
  for (const id of ids) {
    const masuk = received[id] || 0;
    const keluar = distributed[id] || 0;
    out[id] = {
      programId: id,
      received: masuk,
      distributed: keluar,
      remaining: masuk - keluar,
      pct: masuk > 0 ? Math.min(999, (keluar / masuk) * 100) : 0,
    };
  }
  return out;
}

export function validateDistribution(d) {
  const errors = [];
  if (!d.programId) errors.push("Pilih program tujuan.");
  if (!String(d.date || "").trim()) errors.push("Tanggal penyaluran wajib diisi.");
  if (!String(d.recipient || "").trim()) errors.push("Penerima / kegiatan wajib diisi.");
  const amount = Number(d.amount);
  if (!amount || amount <= 0) errors.push("Nominal penyaluran harus lebih dari 0.");
  return errors;
}

export function findDonationByRef(ref) {
  const needle = String(ref || "").trim().toUpperCase();
  if (!needle) return null;
  const inDonors = getDonors().find((d) => String(d.ref || "").toUpperCase() === needle);
  if (inDonors) return { ...inDonors, kind: "campaign" };
  const inPrograms = getProgramDonations().find((d) => String(d.ref || "").toUpperCase() === needle);
  if (inPrograms) return { ...inPrograms, kind: "program" };
  return null;
}

/* ---------- Validation ---------- */

export function validateCampaign(c) {
  const errors = [];
  if (!String(c.title || "").trim()) errors.push("Judul wajib diisi.");
  if (!campaign.categoryOptions.includes(c.category)) errors.push("Kategori wajib dipilih.");
  const target = Number(c.target);
  if (!target || target <= 0) errors.push("Target dana harus lebih dari 0.");
  const collected = Number(c.collected) || 0;
  if (collected < 0) errors.push("Dana terkumpul tidak boleh negatif.");
  if (collected > target) errors.push("Dana terkumpul tidak boleh melebihi target.");
  const days = Number(c.daysLeft);
  if (Number.isNaN(days) || days < 0) errors.push("Sisa hari tidak boleh negatif.");
  if (c.image && !sanitizeURL(c.image)) errors.push("URL gambar tidak valid (gunakan https atau data:image).");
  return errors;
}

export function validatePhone(phone) {
  return /^\d{6,20}$/.test(String(phone || "").replace(/\D/g, ""));
}

/* ---------- WhatsApp deep-link helpers ---------- */

export function isPhoneLike(contact) {
  return /^\d{8,15}$/.test(String(contact || "").replace(/\D/g, ""));
}

export function normalizeWaNumber(contact) {
  const digits = String(contact || "").replace(/\D/g, "");
  if (!/^\d{8,15}$/.test(digits)) return null;
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("8")) return `62${digits}`;
  return digits;
}

export function waStatusUrl(orgNumber, text) {
  const num = normalizeWaNumber(orgNumber) || String(orgNumber || "").replace(/\D/g, "");
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
}

/* ---------- Export helpers ---------- */

export function csvExport(headers, rows) {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const all = [headers, ...rows].map((r) => r.map(esc).join(","));
  return "\uFEFF" + all.join("\r\n");
}

export function xlsExport(headers, rows) {
  const esc = (v) =>
    String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  const trs = [headers, ...rows].map(
    (r) => `<tr>${r.map((v) => `<td>${esc(v)}</td>`).join("")}</tr>`
  );
  return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"></head><body><table>${trs}</table></body></html>`;
}

/* ---------- Admin auth (mk_admin_logged_in, sessionStorage) ---------- */

const memSession = new Map();

function sessionGet(key) {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return memSession.get(key) ?? null;
  }
}

function sessionSet(key, value) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    memSession.set(key, value);
  }
}

function sessionRemove(key) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    memSession.delete(key);
  }
}

export function isAdminLoggedIn() {
  return sessionGet(KEY_ADMIN) === "true";
}

export function loginAdmin(username, password) {
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    sessionSet(KEY_ADMIN, "true");
    return true;
  }
  return false;
}

export function logoutAdmin() {
  sessionRemove(KEY_ADMIN);
}
