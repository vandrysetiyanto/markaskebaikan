import { campaign } from "./campaign.js";
import * as store from "./store.js";
import * as sync from "./sync.js";
import { PAY_BRANDS, ID_SLUGS, payIcon, logoSvg } from "./paylogos.js";
import { icons as lc } from "./icons.js";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const fmtRp = (n) => `Rp ${new Intl.NumberFormat("id-ID").format(n)}`;
const fmtDate = (iso) =>
  new Date(iso).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));

const ICONS = {
  edit: lc.pencil({ size: 14 }),
  trash: lc.trash({ size: 14 }),
  check: lc.check({ size: 14, "stroke-width": 2.4 }),
  undo: lc.undo({ size: 14 }),
  image: lc.image({ size: 14 }),
  eye: lc.eye({ size: 14 }),
  eyeOff: lc.eyeOff({ size: 14 }),
  pause: lc.pause({ size: 14 }),
  play: lc.play({ size: 14 }),
};

function proofCell(d) {
  if (!d.proof) return '<span class="text-muted">—</span>';
  return `<button class="icon-btn" type="button" data-proof="${d.id}" aria-label="Lihat bukti">${ICONS.image}</button>`;
}

function approvalButtons(d, kind) {
  const undo = d.status === "confirmed"
    ? `<button class="icon-btn" type="button" data-reopen-${kind}="${d.id}" aria-label="Tunda ke pending" title="Tunda ke pending">${ICONS.undo}</button>`
    : `<button class="icon-btn" type="button" data-approve-${kind}="${d.id}" aria-label="Setujui" title="Setujui">${ICONS.check}</button>`;
  return `${undo}<button class="icon-btn danger" type="button" data-delete-${kind}="${d.id}" aria-label="Hapus" title="Hapus">${ICONS.trash}</button>`;
}

const statusBadge = (s) => {
  const map = {
    confirmed: ["Terkonfirmasi", "ok"],
    pending: ["Menunggu", "warn"],
    failed: ["Gagal", "err"],
  };
  const [label, cls] = map[s] ?? [s, ""];
  return `<span class="status-pill ${cls}">${label}</span>`;
};

export function filterDonations(list, { q = "", status = "" } = {}, labeler) {
  const needle = q.trim().toLowerCase();
  return list.filter((d) => {
    if (status && d.status !== status) return false;
    if (!needle) return true;
    const base = [d.name, d.contact, d.ref, d.note, String(d.amount)];
    if (labeler) base.push(labeler(d));
    return base.some((x) => String(x ?? "").toLowerCase().includes(needle));
  });
}

function filterDistributions(list, { q = "", programId = "" } = {}) {
  const needle = q.trim().toLowerCase();
  return list.filter((d) => {
    if (programId && String(d.programId) !== String(programId)) return false;
    if (!needle) return true;
    const p = campaign.programs.find((x) => x.id === d.programId);
    const programName = p ? p.title : d.programId;
    const base = [programName, d.recipient, d.note, String(d.amount), fmtDate(new Date(d.createdAt))];
    return base.some((x) => String(x ?? "").toLowerCase().includes(needle));
  });
}

const filter = {
  donors: { q: "", status: "" },
  programs: { q: "", status: "" },
  dist: { q: "", programId: "" },
};

const selected = {
  donors: new Set(),
  programs: new Set(),
};

const donorsLabeler = (d) => {
  const c = store.getCampaignsRaw().find((x) => String(x.id) === String(d.campaignId));
  return c ? c.title : "Donasi umum";
};

const programsLabeler = (d) => {
  const p = campaign.programs.find((x) => x.id === d.programId);
  return p ? p.title : d.programId;
};

function selectCell(kind, id) {
  return `<td><input class="row-check" type="checkbox" data-select-row="${id}" data-select-kind="${kind}" ${selected[kind].has(String(id)) ? "checked" : ""} aria-label="Pilih baris" /></td>`;
}

function updateBulk(kind) {
  const btn = $(`#bulk-${kind}-btn`);
  if (!btn) return;
  const count = $(`#bulk-${kind}-count`);
  const n = selected[kind].size;
  count.textContent = n.toLocaleString("id-ID");
  btn.hidden = n === 0;
  const selectAll = $(`[data-select-all="${kind}"]`);
  if (!selectAll) return;
  const list =
    kind === "donors"
      ? filterDonations(store.getDonors(), filter.donors, donorsLabeler)
      : filterDonations(store.getProgramDonations(), filter.programs, programsLabeler);
  selectAll.checked = n > 0 && n === list.length;
  selectAll.indeterminate = n > 0 && n < list.length;
}

const isDone = (c) => Number(c.daysLeft) <= 0 || Number(c.collected) >= Number(c.target);

/* ---------- Login ---------- */
function initLogin() {
  const form = $("#login-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const ok = store.loginAdmin($("#login-user").value.trim(), $("#login-pass").value);
    if (!ok) {
      $("#login-error").hidden = false;
      return;
    }
    showApp();
  });
}

function showApp() {
  $("#admin-login").hidden = true;
  $("#admin-app").hidden = false;
  renderAll();
}

function initLogout() {
  $("#logout-btn").addEventListener("click", () => {
    store.logoutAdmin();
    $("#admin-app").hidden = true;
    $("#login-form").reset();
    $("#login-error").hidden = true;
    $("#admin-login").hidden = false;
  });
}

/* ---------- Tabs ---------- */
function initTabs() {
  $("#admin-tabs").addEventListener("click", (e) => {
    const tab = e.target.closest(".admin-tab");
    if (!tab) return;
    $$(".admin-tab").forEach((t) => t.classList.toggle("active", t === tab));
    $$(".admin-pane").forEach((p) => p.classList.toggle("active", p.id === `pane-${tab.dataset.tab}`));
  });
}

/* ---------- Dashboard ---------- */
function renderDashboard() {
  const donors = store.getDonors();
  const prog = store.getProgramDonations();
  const all = [...donors, ...prog];
  const confirmed = all.filter((d) => d.status === "confirmed");
  const pending = all.filter((d) => d.status === "pending");
  const total = confirmed.reduce((a, d) => a + (Number(d.amount) || 0), 0);
  const campaigns = store.getCampaigns();

  $("#dash-stats").innerHTML = `
    <div class="dash-stat"><span class="dash-label">Dana Terkonfirmasi</span><span class="dash-value">${fmtRp(total)}</span></div>
    <div class="dash-stat"><span class="dash-label">Transaksi Terkonfirmasi</span><span class="dash-value">${confirmed.length.toLocaleString("id-ID")}</span></div>
    <div class="dash-stat"><span class="dash-label">Menunggu Konfirmasi</span><span class="dash-value">${pending.length.toLocaleString("id-ID")}</span></div>
    <div class="dash-stat"><span class="dash-label">Kampanye Aktif</span><span class="dash-value">${campaigns.filter((c) => !isDone(c) && store.isCampaignActive(c)).length}</span></div>`;

  $("#dash-campaigns").innerHTML =
    campaigns
      .map((c) => `
        <div class="dash-row">
          <div>
            <span class="dash-row-title">${store.sanitizeHTML(c.title)}</span>
            <span class="dash-row-sub">${esc(c.category)} · sisa ${c.daysLeft} hari</span>
          </div>
          <span class="dash-row-num">${fmtRp(c.collected + (c.pendingCollected || 0))}</span>
        </div>`)
      .join("") || '<p class="empty">Belum ada kampanye.</p>';

  const labelOf = (d) => {
    if (d.campaignId) {
      const c = store.getCampaignsRaw().find((x) => String(x.id) === String(d.campaignId));
      return c ? c.title : "Donasi umum";
    }
    const p = campaign.programs.find((x) => x.id === d.programId);
    return p ? p.title : "Program";
  };

  $("#dash-recent").innerHTML =
    [...all]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6)
      .map((d) => `
        <div class="dash-row">
          <div>
            <span class="dash-row-title">${esc(d.name)} ${statusBadge(d.status)}</span>
            <span class="dash-row-sub">${esc(labelOf(d))} · ${fmtDate(d.createdAt)}</span>
          </div>
          <span class="dash-row-num">${fmtRp(d.amount)}</span>
        </div>`)
      .join("") || '<p class="empty">Belum ada donasi.</p>';
}

/* ---------- Campaigns ---------- */
function renderCampaigns() {
  const list = store.getCampaigns();
  $("#campaigns-body").innerHTML =
    list
      .map((c) => {
        const image = store.sanitizeURL(c.image);
        const thumb = image
          ? `<img class="cell-thumb" src="${image}" alt="" loading="lazy" />`
          : `<div class="cell-thumb cell-thumb-fallback">${esc((c.title || "?").slice(0, 1).toUpperCase())}</div>`;
        const status = c.status === "nonaktif"
          ? '<span class="status-pill err">Nonaktif</span>'
          : isDone(c)
            ? '<span class="status-pill ok">Selesai</span>'
            : '<span class="status-pill live">Aktif</span>';
        const toggleBtn = c.status === "nonaktif"
          ? `<button class="icon-btn" type="button" data-toggle-active="${c.id}" aria-label="Aktifkan" title="Aktifkan">${ICONS.play}</button>`
          : `<button class="icon-btn" type="button" data-toggle-active="${c.id}" aria-label="Nonaktifkan" title="Nonaktifkan">${ICONS.pause}</button>`;
        return `
        <tr>
          <td>
            <div class="cell-title">
              ${thumb}
              <span>${store.sanitizeHTML(c.title)}</span>
            </div>
          </td>
          <td>${esc(c.category)}</td>
          <td class="num">${fmtRp(c.target)}</td>
          <td class="num strong">${fmtRp(c.collected + (c.pendingCollected || 0))}</td>
          <td class="num">${c.daysLeft}</td>
          <td>${status}</td>
          <td>
            <div class="row-actions">
              ${toggleBtn}
              <button class="icon-btn" type="button" data-edit-campaign="${c.id}" aria-label="Edit">${ICONS.edit}</button>
              <button class="icon-btn danger" type="button" data-delete-campaign="${c.id}" aria-label="Hapus">${ICONS.trash}</button>
            </div>
          </td>
        </tr>`;
      })
      .join("") || '<tr><td colspan="7"><p class="empty">Belum ada kampanye.</p></td></tr>';
}

let editingId = null;

function fillCategoryOptions(selected) {
  $("#f-category").innerHTML = campaign.categoryOptions
    .map((o) => `<option value="${esc(o)}" ${o === selected ? "selected" : ""}>${esc(o)}</option>`)
    .join("");
}

function openCampaignForm(c) {
  editingId = c ? c.id : null;
  $("#campaign-form").reset();
  $("#campaign-error").hidden = true;
  $("#campaign-modal-title").textContent = c ? "Edit Kampanye" : "Tambah Kampanye";
  fillCategoryOptions(c ? c.category : campaign.categoryOptions[0]);
  if (c) {
    $("#f-title").value = c.title;
    $("#f-image").value = c.image || "";
    $("#f-target").value = c.target;
    $("#f-collected").value = c.collected || 0;
    $("#f-days").value = c.daysLeft;
  }
  setImagePreview(c ? c.image || "" : "");
  $("#campaign-modal").showModal();
  $("#f-title").focus();
}

function saveCampaignForm() {
  const data = {
    title: $("#f-title").value.trim(),
    category: $("#f-category").value,
    image: $("#f-image").value.trim(),
    target: Number($("#f-target").value),
    collected: Number($("#f-collected").value) || 0,
    daysLeft: Number($("#f-days").value),
  };
  const errors = store.validateCampaign(data);
  if (errors.length) {
    $("#campaign-error").textContent = errors.join(" ");
    $("#campaign-error").hidden = false;
    return;
  }
  if (editingId) {
    store.updateCampaign(editingId, data);
    toast("Kampanye diperbarui");
  } else {
    store.addCampaign(data);
    toast("Kampanye ditambahkan");
  }
  $("#campaign-modal").close();
  renderAll();
}

function initCampaignForm() {
  fillCategoryOptions(campaign.categoryOptions[0]);
  $("#add-campaign-btn").addEventListener("click", () => openCampaignForm(null));
  $("#campaign-form").addEventListener("submit", (e) => {
    e.preventDefault();
    saveCampaignForm();
  });
  $("#campaign-cancel").addEventListener("click", () => $("#campaign-modal").close());
  $("#campaign-cancel-2").addEventListener("click", () => $("#campaign-modal").close());
  $("#campaign-modal").addEventListener("click", (e) => {
    if (e.target === $("#campaign-modal")) $("#campaign-modal").close();
  });
}

/* ---------- Image picker (upload / camera) ---------- */
function setImagePreview(src) {
  const box = $("#f-image-preview-box");
  const img = $("#f-image-preview");
  if (!src) {
    box.hidden = true;
    img.removeAttribute("src");
    return;
  }
  img.src = src;
  box.hidden = false;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error("Gagal membaca gambar"));
    r.readAsDataURL(file);
  });
}

function compressImage(dataUrl, maxDim = 1280, quality = 0.8) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.max(1, Math.round(img.naturalWidth * scale));
      const h = Math.max(1, Math.round(img.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

async function handleImageFile(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  try {
    const raw = await fileToDataUrl(file);
    const jpeg = await compressImage(raw);
    $("#f-image").value = jpeg;
    setImagePreview(jpeg);
    toast("Gambar siap — simpan kampanye");
  } catch {
    toast("Gagal memuat gambar");
  } finally {
    input.value = "";
  }
}

function initImagePicker() {
  $("#f-image-upload").addEventListener("change", (e) => handleImageFile(e.target));
  $("#f-image-capture").addEventListener("change", (e) => handleImageFile(e.target));
  $("#f-image-remove").addEventListener("click", () => {
    $("#f-image").value = "";
    setImagePreview("");
  });
  $("#f-image").addEventListener("input", (e) => setImagePreview(e.target.value.trim() || ""));
}

/* ---------- Donations ---------- */
function renderDonors() {
  const all = store.getDonors();
  const list = filterDonations(all, filter.donors, donorsLabeler);
  $("#donors-count").textContent = `Menampilkan ${list.length.toLocaleString("id-ID")} dari ${all.length.toLocaleString("id-ID")} donasi`;
  $("#donors-body").innerHTML =
    list
      .map((d) => {
        const c = store.getCampaignsRaw().find((x) => String(x.id) === String(d.campaignId));
        const name = `${esc(d.name)}${d.anonymous ? ' <span class="text-muted">(anonim)</span>' : ""}`;
        return `
        <tr>
          ${selectCell("donors", d.id)}
          <td class="num">${fmtDate(d.createdAt)}</td>
          <td>${name}</td>
          <td>${esc(d.contact)}</td>
          <td class="num strong">${fmtRp(d.amount)}</td>
          <td>${c ? store.sanitizeHTML(c.title) : "Donasi umum"}</td>
          <td>${esc(d.method || "-")}</td>
          <td>${esc(d.ref || "-")}</td>
          <td>${proofCell(d)}</td>
          <td>${statusBadge(d.status)}</td>
          <td>
            <div class="row-actions">${approvalButtons(d, "donor")}</div>
          </td>
        </tr>`;
      })
      .join("") || '<tr><td colspan="11"><p class="empty">Belum ada donasi.</p></td></tr>';
  updateBulk("donors");
}

function renderProgramDonations() {
  const all = store.getProgramDonations();
  const list = filterDonations(all, filter.programs, programsLabeler);
  $("#programs-count").textContent = `Menampilkan ${list.length.toLocaleString("id-ID")} dari ${all.length.toLocaleString("id-ID")} donasi program`;
  $("#programs-body").innerHTML =
    list
      .map((d) => {
        const p = campaign.programs.find((x) => x.id === d.programId);
        return `
        <tr>
          ${selectCell("programs", d.id)}
          <td class="num">${fmtDate(d.createdAt)}</td>
          <td>${esc(d.name)}</td>
          <td>${p ? esc(p.title) : esc(d.programId)}</td>
          <td class="num strong">${fmtRp(d.amount)}</td>
          <td>${esc(d.method || "-")}</td>
          <td>${esc(d.ref || "-")}</td>
          <td>${proofCell(d)}</td>
          <td>${statusBadge(d.status)}</td>
          <td>
            <div class="row-actions">${approvalButtons(d, "program")}</div>
          </td>
        </tr>`;
      })
      .join("") || '<tr><td colspan="10"><p class="empty">Belum ada donasi program.</p></td></tr>';
  updateBulk("programs");
}

function renderBadges() {
  const setBadge = (sel, n) => {
    const el = $(sel);
    el.textContent = n.toLocaleString("id-ID");
    el.classList.toggle("has", n > 0);
  };
  setBadge("#badge-donors", store.getDonors().filter((d) => d.status === "pending").length);
  setBadge("#badge-programs", store.getProgramDonations().filter((d) => d.status === "pending").length);
}

/* ---------- Settings: Payment methods ---------- */
function renderPaymentMethods() {
  const list = store.getPaymentMethods();
  $("#payments-body").innerHTML =
    list
      .map((m) => {
        const detail =
          m.kind === "va"
            ? `${esc(m.vaName || "-")}<br><span class="va-number">${esc(m.vaNumber || "-")}</span>`
            : '<span class="text-muted">-</span>';
        const status =
          m.enabled === false
            ? '<span class="status-pill err">Nonaktif</span>'
            : '<span class="status-pill ok">Aktif</span>';
        const toggleIcon = m.enabled === false ? ICONS.eye : ICONS.eyeOff;
        const toggleLabel = m.enabled === false ? "Aktifkan" : "Nonaktifkan";
        return `
        <tr>
          <td data-primary>${logoSvg(m) ? `<span class="cell-thumb">${payIcon(m)}</span>` : `<span class="cell-thumb cell-thumb-fallback">${esc((m.label || "?").slice(0, 1).toUpperCase())}</span>`} <span class="strong">${esc(m.label)}</span></td>
          <td data-label="Jenis">${esc(m.kind === "va" ? "Virtual Account" : "QRIS / E-Wallet")}</td>
          <td data-label="Catatan">${esc(m.note || "-")}</td>
          <td data-label="Detail VA">${detail}</td>
          <td data-label="Status">${status}</td>
          <td data-label="Aksi">
            <div class="row-actions">
              <button class="icon-btn" type="button" data-toggle-payment="${m.id}" aria-label="${toggleLabel}" title="${toggleLabel}">${toggleIcon}</button>
              <button class="icon-btn" type="button" data-edit-payment="${m.id}" aria-label="Edit" title="Edit">${ICONS.edit}</button>
              <button class="icon-btn danger" type="button" data-delete-payment="${m.id}" aria-label="Hapus" title="Hapus">${ICONS.trash}</button>
            </div>
          </td>
        </tr>`;
      })
      .join("") ||
      `<tr><td colspan="6"><div class="empty-state"><div class="empty-state-icon">${lc.bookOpen({ size: 18 })}</div><p>Belum ada metode pembayaran</p><span>Tambahkan metode agar donatur bisa memilih cara berdonasi.</span></div></td></tr>`;
}

let editingPaymentId = null;

function toggleVaFields() {
  const isVa = $("#pm-kind").value === "va";
  $("#pm-va-fields").hidden = !isVa;
  $("#pm-vaname").required = isVa;
  $("#pm-vanumber").required = isVa;
}

function openPaymentForm(m) {
  editingPaymentId = m ? m.id : null;
  $("#payment-form").reset();
  $("#payment-error").hidden = true;
  $("#payment-modal-title").textContent = m ? "Edit Metode Pembayaran" : "Tambah Metode Pembayaran";
  $("#pm-kind").value = m ? m.kind || "qris" : "qris";
  $("#pm-enabled").checked = m ? m.enabled !== false : true;
  if (m) {
    $("#pm-label").value = m.label;
    $("#pm-note").value = m.note || "";
    $("#pm-vaname").value = m.vaName || "";
    $("#pm-vanumber").value = m.vaNumber || "";
  }
  const brand = m ? m.brand || ID_SLUGS[m.id] || "" : "";
  $("#pm-brand").value = brand;
  updateBrandPreview(brand);
  toggleVaFields();
  $("#payment-modal").showModal();
  $("#pm-label").focus();
}

function updateBrandPreview(slug) {
  const box = $("#pm-brand-preview");
  if (!box) return;
  const entry = PAY_BRANDS.find((b) => b.slug === slug);
  if (!entry) {
    box.innerHTML = '<span class="brand-preview-empty">Huruf awal</span>';
    return;
  }
  box.innerHTML = `<span class="cell-thumb">${payIcon({ id: slug, brand: slug, label: entry.label })}</span>`;
}

function savePaymentForm() {
  const data = {
    label: $("#pm-label").value.trim(),
    kind: $("#pm-kind").value,
    brand: $("#pm-brand").value || "",
    note: $("#pm-note").value.trim(),
    vaName: $("#pm-vaname").value.trim(),
    vaNumber: $("#pm-vanumber").value.trim(),
    enabled: $("#pm-enabled").checked,
  };
  const errors = store.validatePaymentMethod(data);
  if (errors.length) {
    $("#payment-error").textContent = errors.join(" ");
    $("#payment-error").hidden = false;
    return;
  }
  if (editingPaymentId) {
    store.updatePaymentMethod(editingPaymentId, data);
    toast("Metode pembayaran diperbarui");
  } else {
    store.addPaymentMethod(data);
    toast("Metode pembayaran ditambahkan");
  }
  $("#payment-modal").close();
  renderAll();
}

function initPaymentForm() {
  const brandSelect = $("#pm-brand");
  if (brandSelect) {
    brandSelect.innerHTML =
      '<option value="">Otomatis / tanpa logo</option>' +
      PAY_BRANDS.map(
        (b) => `<option value="${b.slug}">${esc(b.group)} — ${esc(b.label)}</option>`
      ).join("");
    brandSelect.addEventListener("change", () => updateBrandPreview(brandSelect.value));
  }
  $("#add-payment-btn").addEventListener("click", () => openPaymentForm(null));
  $("#pm-kind").addEventListener("change", toggleVaFields);
  $("#payment-form").addEventListener("submit", (e) => {
    e.preventDefault();
    savePaymentForm();
  });
  $("#payment-cancel").addEventListener("click", () => $("#payment-modal").close());
  $("#payment-cancel-2").addEventListener("click", () => $("#payment-modal").close());
  $("#payment-modal").addEventListener("click", (e) => {
    if (e.target === $("#payment-modal")) $("#payment-modal").close();
  });
}

/* ---------- Exports ---------- */
function downloadExport(kind, name, headers, rows) {
  const content = kind === "csv" ? store.csvExport(headers, rows) : store.xlsExport(headers, rows);
  const mime = kind === "csv" ? "text/csv;charset=utf-8" : "application/vnd.ms-excel";
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${name}.${kind === "csv" ? "csv" : "xls"}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function exportDonors(kind) {
  const rows = store.getDonors().map((d) => {
    const c = store.getCampaignsRaw().find((x) => String(x.id) === String(d.campaignId));
    return [
      fmtDate(d.createdAt),
      d.name,
      d.contact,
      d.amount,
      c ? c.title : "Donasi umum",
      d.method || "",
      d.ref || "",
      d.status,
    ];
  });
  downloadExport(kind, `donasi-${new Date().toISOString().slice(0, 10)}`, [
    "Waktu",
    "Donatur",
    "Kontak",
    "Jumlah",
    "Kampanye",
    "Metode",
    "Ref",
    "Status",
  ], rows);
}

function exportProgramDonations(kind) {
  const rows = store.getProgramDonations().map((d) => {
    const p = campaign.programs.find((x) => x.id === d.programId);
    return [fmtDate(d.createdAt), d.name, p ? p.title : d.programId, d.amount, d.method || "", d.ref || "", d.status];
  });
  downloadExport(kind, `donasi-program-${new Date().toISOString().slice(0, 10)}`, [
    "Waktu",
    "Donatur",
    "Program",
    "Jumlah",
    "Metode",
    "Ref",
    "Status",
  ], rows);
}

function initExports() {
  $("#export-donors-csv").addEventListener("click", () => exportDonors("csv"));
  $("#export-donors-xls").addEventListener("click", () => exportDonors("xls"));
  $("#export-programs-csv").addEventListener("click", () => exportProgramDonations("csv"));
  $("#export-programs-xls").addEventListener("click", () => exportProgramDonations("xls"));
}

/* ---------- Distributions (penyaluran) ---------- */
const pctFill = (pct) => {
  const over = pct > 100;
  return `<span class="pct-wrap"><span class="pct-bar"><span class="pct-fill ${over ? "over" : ""}" style="width:${Math.min(100, pct)}%"></span></span><span class="pct-text ${over ? "text-danger" : ""}">${pct.toFixed(1).replace(".", ",")}%</span></span>`;
};

function renderDistSummary() {
  const el = $("#dist-summary");
  if (!el) return;
  const received = Object.values(store.programTotals()).reduce((a, b) => a + (Number(b) || 0), 0);
  const distributed = Object.values(store.distributionTotals()).reduce((a, b) => a + (Number(b) || 0), 0);
  const remaining = received - distributed;
  el.innerHTML = `
    <div class="dist-sum-stat"><span class="dash-label">Dana Masuk</span><span class="dash-value">${fmtRp(received)}</span></div>
    <div class="dist-sum-stat"><span class="dash-label">Dana Tersalur</span><span class="dash-value">${fmtRp(distributed)}</span></div>
    <div class="dist-sum-stat"><span class="dash-label">Sisa Dana</span><span class="dash-value ${remaining < 0 ? "text-danger" : ""}">${fmtRp(remaining)}</span></div>`;
}

function updateDistBalanceHint() {
  const hint = $("#dist-balance-hint");
  if (!hint) return;
  const programId = $("#dist-program").value;
  const amount = Number($("#dist-amount").value) || 0;
  const p = programId && campaign.programs.find((x) => String(x.id) === String(programId));
  const balance = store.programBalance();
  const b = balance[programId] || { remaining: 0 };
  const remaining = b.remaining || 0;
  const over = amount > 0 && amount > remaining;
  if (!p) {
    hint.hidden = true;
    hint.className = "field-hint";
    return;
  }
  hint.innerHTML = `Sisa dana program ini: <strong>${fmtRp(remaining)}</strong>${over ? ' <span class="text-danger">- melebihi sisa, periksa kembali.</span>' : ""}`;
  hint.classList.toggle("warn", over);
  hint.hidden = false;
}

function renderRekap() {
  const balance = store.programBalance();
  const rows = [];
  for (const p of campaign.programs) {
    const b = balance[p.id] || { received: 0, distributed: 0, remaining: 0, pct: 0 };
    rows.push(`<tr>
      <td data-primary>${esc(p.title)}</td>
      <td data-label="Donasi Masuk" class="num">${fmtRp(b.received)}</td>
      <td data-label="Tersalur" class="num">${fmtRp(b.distributed)}</td>
      <td data-label="Sisa Dana" class="num ${b.remaining < 0 ? "text-danger" : ""}">${fmtRp(b.remaining)}</td>
      <td data-label="Realisasi" class="num">${pctFill(b.pct)}</td>
    </tr>`);
  }
  for (const c of campaign.completedCampaigns) {
    const sisa = c.targetAmount - c.currentAmount;
    const pct = c.targetAmount > 0 ? (c.currentAmount / c.targetAmount) * 100 : 0;
    rows.push(`<tr>
      <td data-primary>${esc(c.title)} <span class="status-pill ok">Selesai</span></td>
      <td data-label="Donasi Masuk" class="num">${fmtRp(c.targetAmount)}</td>
      <td data-label="Tersalur" class="num">${fmtRp(c.currentAmount)}</td>
      <td data-label="Sisa Dana" class="num">${fmtRp(sisa)}</td>
      <td data-label="Realisasi" class="num">${pctFill(pct)}</td>
    </tr>`);
  }
  $("#rekap-body").innerHTML =
    rows.join("") ||
    `<tr><td colspan="5"><div class="empty-state"><div class="empty-state-icon">${lc.umbrella({ size: 18 })}</div><p>Belum ada data penyaluran</p><span>Donasi program yang sudah terkonfirmasi akan direkap di sini.</span></div></td></tr>`;
}

function renderDistLog() {
  const all = store.getDistributions();
  const list = filterDistributions(all, filter.dist);
  const countEl = $("#dist-count");
  if (countEl) countEl.textContent = `${list.length} dari ${all.length} catatan`;
  $("#dist-body").innerHTML =
    list
      .map((d) => {
        const p = campaign.programs.find((x) => x.id === d.programId);
        return `
        <tr>
          <td data-label="Tanggal" class="num">${fmtDate(d.date ? new Date(`${d.date}T00:00:00`) : new Date(d.createdAt))}</td>
          <td data-label="Program">${p ? esc(p.title) : esc(d.programId)}</td>
          <td data-primary>${esc(d.recipient)}</td>
          <td data-label="Jumlah" class="num strong">${fmtRp(d.amount)}</td>
          <td data-label="Catatan">${esc(d.note || "-")}</td>
          <td data-label="Aksi">
            <div class="row-actions">
              <button class="icon-btn danger" type="button" data-delete-dist="${d.id}" aria-label="Hapus" title="Hapus">${ICONS.trash}</button>
            </div>
          </td>
        </tr>`;
      })
      .join("") ||
      `<tr><td colspan="6"><div class="empty-state"><div class="empty-state-icon">${lc.clock({ size: 18 })}</div><p>Belum ada penyaluran</p><span>Catat penyaluran pertama lewat form di atas.</span></div></td></tr>`;
}

function saveDistForm() {
  const data = {
    programId: $("#dist-program").value,
    amount: Number($("#dist-amount").value),
    date: $("#dist-date").value,
    recipient: $("#dist-recipient").value.trim(),
    note: $("#dist-note").value.trim(),
  };
  const errors = store.validateDistribution(data);
  if (errors.length) {
    $("#dist-error").textContent = errors.join(" ");
    $("#dist-error").hidden = false;
    return;
  }
  store.saveDistribution(data);
  $("#dist-form").reset();
  $("#dist-date").value = new Date().toISOString().slice(0, 10);
  $("#dist-error").hidden = true;
  toast("Penyaluran dicatat");
  renderAll();
  updateDistBalanceHint();
}

function exportRekap(kind) {
  const balance = store.programBalance();
  const rows = [];
  for (const p of campaign.programs) {
    const b = balance[p.id] || { received: 0, distributed: 0, remaining: 0, pct: 0 };
    rows.push([p.title, b.received, b.distributed, b.remaining, `${b.pct.toFixed(1)}%`]);
  }
  for (const c of campaign.completedCampaigns) {
    rows.push([c.title, c.targetAmount, c.currentAmount, c.targetAmount - c.currentAmount, "100%"]);
  }
  downloadExport(kind, `rekap-penyaluran-${new Date().toISOString().slice(0, 10)}`, [
    "Program / Kampanye",
    "Donasi Masuk",
    "Tersalur",
    "Sisa Dana",
    "Realisasi",
  ], rows);
}

function initDistributions() {
  const programOpts = campaign.programs
    .map((p) => `<option value="${esc(p.id)}">${esc(p.title)}</option>`)
    .join("");
  $("#dist-program").innerHTML = programOpts;
  const filterEl = $("#dist-program-filter");
  if (filterEl) filterEl.innerHTML = `<option value="">Semua program</option>` + programOpts;
  $("#dist-date").value = new Date().toISOString().slice(0, 10);
  $("#dist-form").addEventListener("submit", (e) => {
    e.preventDefault();
    saveDistForm();
  });
  $("#dist-program").addEventListener("change", updateDistBalanceHint);
  $("#dist-amount").addEventListener("input", updateDistBalanceHint);
  $("#export-rekap-csv").addEventListener("click", () => exportRekap("csv"));
  $("#export-rekap-xls").addEventListener("click", () => exportRekap("xls"));
  const distSearch = $("#dist-search");
  const distFilter = $("#dist-program-filter");
  if (distSearch) {
    let distTimer;
    distSearch.addEventListener("input", (e) => {
      clearTimeout(distTimer);
      distTimer = setTimeout(() => {
        filter.dist.q = e.target.value;
        renderDistLog();
      }, 250);
    });
  }
  if (distFilter) {
    distFilter.addEventListener("change", (e) => {
      filter.dist.programId = e.target.value;
      renderDistLog();
    });
  }
}

/* ---------- Table tools (search & filter) ---------- */
function initTableTools() {
  let donorsTimer;
  let programsTimer;
  $("#donors-search").addEventListener("input", (e) => {
    clearTimeout(donorsTimer);
    donorsTimer = setTimeout(() => {
      filter.donors.q = e.target.value;
      renderDonors();
    }, 250);
  });
  $("#donors-status").addEventListener("change", (e) => {
    filter.donors.status = e.target.value;
    renderDonors();
  });
  $("#programs-search").addEventListener("input", (e) => {
    clearTimeout(programsTimer);
    programsTimer = setTimeout(() => {
      filter.programs.q = e.target.value;
      renderProgramDonations();
    }, 250);
  });
  $("#programs-status").addEventListener("change", (e) => {
    filter.programs.status = e.target.value;
    renderProgramDonations();
  });
}

/* ---------- Bulk select & delete ---------- */
function initBulkSelect() {
  document.addEventListener("change", (e) => {
    const all = e.target.closest("[data-select-all]");
    if (all) {
      const kind = all.dataset.selectAll;
      const list =
        kind === "donors"
          ? filterDonations(store.getDonors(), filter.donors, donorsLabeler)
          : filterDonations(store.getProgramDonations(), filter.programs, programsLabeler);
      if (all.checked) list.forEach((d) => selected[kind].add(String(d.id)));
      else selected[kind].clear();
      renderAll();
      return;
    }
    const row = e.target.closest("[data-select-row]");
    if (row) {
      const kind = row.dataset.selectKind;
      const id = row.dataset.selectRow;
      if (row.checked) selected[kind].add(String(id));
      else selected[kind].delete(String(id));
      updateBulk(kind);
    }
  });

  $("#bulk-donors-btn").addEventListener("click", () => bulkDelete("donors"));
  $("#bulk-programs-btn").addEventListener("click", () => bulkDelete("programs"));
}

function bulkDelete(kind) {
  const n = selected[kind].size;
  if (!n) return;
  const label = kind === "donors" ? "donasi" : "donasi program";
  if (!confirm(`Hapus ${n.toLocaleString("id-ID")} ${label} terpilih?`)) return;
  if (kind === "donors") store.deleteDonors([...selected.donors]);
  else store.deleteProgramDonations([...selected.programs]);
  selected[kind].clear();
  toast(`${n.toLocaleString("id-ID")} ${label} dihapus`);
  renderAll();
}

/* ---------- Row actions ---------- */
function initRowActions() {
  document.addEventListener("click", (e) => {
    const toggleActive = e.target.closest("[data-toggle-active]");
    if (toggleActive) {
      const c = store.getCampaignsRaw().find((x) => String(x.id) === String(toggleActive.dataset.toggleActive));
      if (c) {
        const next = !store.isCampaignActive(c);
        store.setCampaignActive(c.id, next);
        toast(next ? "Kampanye diaktifkan" : "Kampanye dinonaktifkan (musiman)");
        renderAll();
      }
      return;
    }

    const editBtn = e.target.closest("[data-edit-campaign]");
    if (editBtn) {
      const c = store.getCampaignsRaw().find((x) => String(x.id) === String(editBtn.dataset.editCampaign));
      if (c) openCampaignForm(c);
      return;
    }

    const delBtn = e.target.closest("[data-delete-campaign]");
    if (delBtn) {
      const c = store.getCampaignsRaw().find((x) => String(x.id) === String(delBtn.dataset.deleteCampaign));
      if (c && confirm(`Hapus kampanye "${c.title}"?`)) {
        store.deleteCampaign(c.id);
        toast("Kampanye dihapus");
        renderAll();
      }
      return;
    }

    const togglePay = e.target.closest("[data-toggle-payment]");
    if (togglePay) {
      const m = store.getPaymentMethods().find((x) => String(x.id) === String(togglePay.dataset.togglePayment));
      if (m) {
        const next = m.enabled === false;
        store.updatePaymentMethod(m.id, { enabled: next });
        toast(next ? "Metode pembayaran diaktifkan" : "Metode pembayaran dinonaktifkan");
        renderAll();
      }
      return;
    }

    const editPay = e.target.closest("[data-edit-payment]");
    if (editPay) {
      const m = store.getPaymentMethods().find((x) => String(x.id) === String(editPay.dataset.editPayment));
      if (m) openPaymentForm(m);
      return;
    }

    const delPay = e.target.closest("[data-delete-payment]");
    if (delPay) {
      const m = store.getPaymentMethods().find((x) => String(x.id) === String(delPay.dataset.deletePayment));
      if (m && confirm(`Hapus metode "${m.label}"?`)) {
        store.deletePaymentMethod(m.id);
        toast("Metode pembayaran dihapus");
        renderAll();
      }
      return;
    }

    const proofBtn = e.target.closest("[data-proof]");
    if (proofBtn) {
      const id = proofBtn.dataset.proof;
      const d =
        store.getDonors().find((x) => String(x.id) === String(id)) ||
        store.getProgramDonations().find((x) => String(x.id) === String(id));
      if (d && d.proof) openProof(d);
      return;
    }

    const aDonor = e.target.closest("[data-approve-donor]");
    if (aDonor) {
      const d = store.approveDonor(aDonor.dataset.approveDonor);
      toast(d ? "Donasi disetujui & masuk total terkumpul" : "Donasi tidak ditemukan");
      renderAll();
      return;
    }

    const rDonor = e.target.closest("[data-reopen-donor]");
    if (rDonor) {
      store.reopenDonor(rDonor.dataset.reopenDonor);
      toast("Donasi ditunda ke pending");
      renderAll();
      return;
    }

    const dDonor = e.target.closest("[data-delete-donor]");
    if (dDonor) {
      if (confirm("Hapus donasi ini?")) {
        store.deleteDonor(dDonor.dataset.deleteDonor);
        toast("Donasi dihapus");
        renderAll();
      }
      return;
    }

    const aProg = e.target.closest("[data-approve-program]");
    if (aProg) {
      const d = store.approveProgramDonation(aProg.dataset.approveProgram);
      toast(d ? "Donasi disetujui & masuk total program" : "Donasi tidak ditemukan");
      renderAll();
      return;
    }

    const rProg = e.target.closest("[data-reopen-program]");
    if (rProg) {
      store.reopenProgramDonation(rProg.dataset.reopenProgram);
      toast("Donasi ditunda ke pending");
      renderAll();
      return;
    }

    const dProg = e.target.closest("[data-delete-program]");
    if (dProg) {
      if (confirm("Hapus donasi program ini?")) {
        store.deleteProgramDonation(dProg.dataset.deleteProgram);
        toast("Donasi dihapus");
        renderAll();
      }
      return;
    }

    const delDist = e.target.closest("[data-delete-dist]");
    if (delDist) {
      if (confirm("Hapus catatan penyaluran ini?")) {
        store.deleteDistribution(delDist.dataset.deleteDist);
        toast("Penyaluran dihapus");
        renderAll();
      }
    }
  });
}

/* ---------- Proof lightbox ---------- */
function openProof(d) {
  const p = campaign.programs.find((x) => x.id === d.programId);
  const captionParts = [
    `${d.name} · ${fmtRp(d.amount)}`,
    p ? p.title : store.getCampaignsRaw().find((x) => String(x.id) === String(d.campaignId))?.title || "Donasi umum",
    d.note ? `Catatan: ${d.note}` : "",
  ].filter(Boolean);
  $("#proof-img").src = d.proof;
  $("#proof-img").alt = `Bukti transfer ${d.name}`;
  $("#proof-caption").textContent = captionParts.join(" · ");
  $("#proof-modal").showModal();
}

function initProof() {
  $("#proof-close").addEventListener("click", () => $("#proof-modal").close());
  $("#proof-modal").addEventListener("click", (e) => {
    if (e.target === $("#proof-modal")) $("#proof-modal").close();
  });
}

/* ---------- Sync data (cross-device) ---------- */
function renderSyncStatus() {
  const s = sync.getSyncStatus();
  const statusEl = $("#sync-status");
  const offBtn = $("#sync-off-btn");
  if (!s.enabled) {
    statusEl.innerHTML = '<span class="dot"></span> Belum diaktifkan. Data hanya tersimpan di perangkat ini.';
    offBtn.hidden = true;
    return;
  }
  const time = s.lastSync
    ? new Date(s.lastSync).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })
    : "—";
  const dirty = s.dirty ? " · <strong>Menunggu pengiriman…</strong>" : "";
  const err = s.lastError
    ? ` · <span class="err">Gagal sinkron: ${esc(s.lastError)}</span>`
    : "";
  const cls = s.lastError ? "err" : "ok";
  statusEl.innerHTML = `<span class="dot ${cls}"></span> Sinkron aktif · Terakhir: ${time}${dirty}${err}`;
  offBtn.hidden = false;
}

function initSyncPanel() {
  renderSyncStatus();
  $("#sync-save-btn").addEventListener("click", async () => {
    const pass = $("#sync-pass").value;
    if (!pass.trim()) {
      toast("Masukkan passphrase terlebih dahulu.");
      return;
    }
    $("#sync-save-btn").disabled = true;
    const r = await sync.enableSync(pass);
    $("#sync-save-btn").disabled = false;
    $("#sync-pass").value = "";
    toast(r.ok ? "Sinkronisasi diaktifkan." : `Gagal: ${r.error}`);
    renderSyncStatus();
  });
  $("#sync-now-btn").addEventListener("click", async () => {
    const r = await sync.syncNow();
    toast(r.push.ok ? "Sinkronisasi selesai." : `Gagal: ${r.push.error || "belum aktif"}`);
    renderSyncStatus();
  });
  $("#sync-off-btn").addEventListener("click", () => {
    sync.disableSync();
    toast("Sinkronisasi dilepas dari perangkat ini.");
    renderSyncStatus();
  });
  window.addEventListener("mk:syncchange", renderSyncStatus);
  window.addEventListener("mk:synced", renderAll);
  setInterval(() => {
    if (sync.getSyncStatus().enabled) sync.syncPoll();
  }, 30000);
}

/* ---------- Reset all data ---------- */
function initResetData() {
  const modal = $("#reset-modal");
  $("#reset-data-btn").addEventListener("click", () => {
    $("#reset-form").reset();
    $("#reset-error").hidden = true;
    modal.showModal();
  });
  $("#reset-cancel").addEventListener("click", () => modal.close());
  $("#reset-cancel-2").addEventListener("click", () => modal.close());
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.close();
  });
  $("#reset-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const pass = $("#reset-pass").value;
    const confirmVal = $("#reset-confirm").value;
    const err = $("#reset-error");
    if (pass !== store.ADMIN_PASS) {
      err.textContent = "Password admin salah.";
      err.hidden = false;
      return;
    }
    if (confirmVal !== "HAPUS") {
      err.textContent = "Ketik HAPUS untuk konfirmasi.";
      err.hidden = false;
      return;
    }
    store.resetAllData();
    modal.close();
    toast("Semua data direset ke awal");
    renderAll();
  });
}

/* ---------- Toast ---------- */
function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove("show"), 3000);
}

function renderAll() {
  renderDashboard();
  renderCampaigns();
  renderDonors();
  renderProgramDonations();
  renderPaymentMethods();
  renderDistSummary();
  renderRekap();
  renderDistLog();
  renderBadges();
  updateDistBalanceHint();
}

function init() {
  try {
    if (store.isAdminLoggedIn()) {
      showApp();
    } else {
      $("#admin-login").hidden = false;
    }
    initLogin();
    initLogout();
    initTabs();
    initCampaignForm();
    initImagePicker();
    initPaymentForm();
    initExports();
    initTableTools();
    initBulkSelect();
    initResetData();
    initSyncPanel();
    initDistributions();
    initProof();
    initRowActions();
  } catch (err) {
    $("#admin-login").hidden = false;
    const msg = document.getElementById("login-error");
    msg.textContent = `Terjadi kesalahan: ${err.message || err}`;
    msg.hidden = false;
  }
}

window.addEventListener("error", (e) => {
  const msg = document.getElementById("login-error");
  if (!msg) return;
  if (msg.hidden) {
    msg.textContent = `Terjadi kesalahan: ${e.message || "tidak diketahui"}`;
    msg.hidden = false;
  }
  console.error(e.error || e.message);
});

init();
