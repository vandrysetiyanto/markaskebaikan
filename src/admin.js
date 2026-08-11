import { campaign } from "./campaign.js";
import * as store from "./store.js";
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
};

function proofCell(d) {
  if (!d.proof) return '<span style="color:var(--muted)">—</span>';
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

const filter = {
  donors: { q: "", status: "" },
  programs: { q: "", status: "" },
};

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
    <div class="dash-stat"><span class="dash-label">Kampanye Aktif</span><span class="dash-value">${campaigns.filter((c) => !isDone(c)).length}</span></div>`;

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
          <td>${isDone(c) ? '<span class="status-pill ok">Selesai</span>' : '<span class="status-pill live">Aktif</span>'}</td>
          <td>
            <div class="row-actions">
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
  const labeler = (d) => {
    const c = store.getCampaignsRaw().find((x) => String(x.id) === String(d.campaignId));
    return c ? c.title : "Donasi umum";
  };
  const list = filterDonations(all, filter.donors, labeler);
  $("#donors-count").textContent = `Menampilkan ${list.length.toLocaleString("id-ID")} dari ${all.length.toLocaleString("id-ID")} donasi`;
  $("#donors-body").innerHTML =
    list
      .map((d) => {
        const c = store.getCampaignsRaw().find((x) => String(x.id) === String(d.campaignId));
        const name = `${esc(d.name)}${d.anonymous ? ' <span style="color:var(--muted);font-weight:400">(anonim)</span>' : ""}`;
        return `
        <tr>
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
      .join("") || '<tr><td colspan="10"><p class="empty">Belum ada donasi.</p></td></tr>';
}

function renderProgramDonations() {
  const all = store.getProgramDonations();
  const labeler = (d) => {
    const p = campaign.programs.find((x) => x.id === d.programId);
    return p ? p.title : d.programId;
  };
  const list = filterDonations(all, filter.programs, labeler);
  $("#programs-count").textContent = `Menampilkan ${list.length.toLocaleString("id-ID")} dari ${all.length.toLocaleString("id-ID")} donasi program`;
  $("#programs-body").innerHTML =
    list
      .map((d) => {
        const p = campaign.programs.find((x) => x.id === d.programId);
        return `
        <tr>
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
      .join("") || '<tr><td colspan="9"><p class="empty">Belum ada donasi program.</p></td></tr>';
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
            ? `${esc(m.vaName || "-")}<br><span style="font-variant-numeric:tabular-nums">${esc(m.vaNumber || "-")}</span>`
            : '<span style="color:var(--muted)">—</span>';
        const status =
          m.enabled === false
            ? '<span class="status-pill err">Nonaktif</span>'
            : '<span class="status-pill ok">Aktif</span>';
        const toggleIcon = m.enabled === false ? ICONS.eye : ICONS.eyeOff;
        const toggleLabel = m.enabled === false ? "Aktifkan" : "Nonaktifkan";
        return `
        <tr>
          <td>${logoSvg(m) ? `<span class="cell-thumb">${payIcon(m)}</span>` : `<span class="cell-thumb cell-thumb-fallback">${esc((m.label || "?").slice(0, 1).toUpperCase())}</span>`} <span style="font-weight:600">${esc(m.label)}</span></td>
          <td>${esc(m.kind === "va" ? "Virtual Account" : "QRIS / E-Wallet")}</td>
          <td>${esc(m.note || "—")}</td>
          <td>${detail}</td>
          <td>${status}</td>
          <td>
            <div class="row-actions">
              <button class="icon-btn" type="button" data-toggle-payment="${m.id}" aria-label="${toggleLabel}" title="${toggleLabel}">${toggleIcon}</button>
              <button class="icon-btn" type="button" data-edit-payment="${m.id}" aria-label="Edit" title="Edit">${ICONS.edit}</button>
              <button class="icon-btn danger" type="button" data-delete-payment="${m.id}" aria-label="Hapus" title="Hapus">${ICONS.trash}</button>
            </div>
          </td>
        </tr>`;
      })
      .join("") || '<tr><td colspan="6"><p class="empty">Belum ada metode pembayaran.</p></td></tr>';
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

/* ---------- Row actions ---------- */
function initRowActions() {
  document.addEventListener("click", (e) => {
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
  renderBadges();
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
