import { campaign } from "./campaign.js";
import * as store from "./store.js";
import * as share from "./share.js";
import { Chatbot } from "./chatbot.js";
import { initHeroMotion } from "./hero-motion.js";
import { payIcon } from "./paylogos.js";
import { icons as lc } from "./icons.js";

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const fmtRp = (n) => `Rp ${new Intl.NumberFormat("id-ID").format(n)}`;
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
const pctOf = (c) => Math.round((c.collected / c.target) * 100);
const daysLeft = (c) => {
  const d = Number(c.daysLeft);
  return !Number.isNaN(d) && d > 0 ? `Sisa ${d} hari` : "Selesai";
};

/* ---------- Header / Footer ---------- */
function renderBrand() {
  $("#brand-name").textContent = campaign.name;
  $("#footer-brand").textContent = campaign.name;
  $("#nav-fund").textContent = "45.000+ dermawan";
}

/* ---------- Hero ---------- */
function renderHero() {
  $("#hero-title").textContent = campaign.tagline;
  $("#hero-sub").textContent = campaign.taglineFull;

  $("#hero-trust").innerHTML = campaign.heroTrust
    .map(
      (t, i) => `
      <li class="trust-item">
        ${trustIcon(i)}
        ${t.text}
      </li>`
    )
    .join("");

  $("#hero-art").innerHTML = `
    <div class="ripple-scene">
      <div class="ripple ripple-1"></div>
      <div class="ripple ripple-2"></div>
      <div class="ripple ripple-3"></div>
      <div class="art-ring">
        <svg viewBox="0 0 200 200">
          <circle class="art-ring-track" cx="100" cy="100" r="84" fill="none" stroke="currentColor" stroke-width="3" />
          <circle class="art-ring-progress" cx="100" cy="100" r="84" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-dasharray="527.8" stroke-dashoffset="137.2" />
        </svg>
      </div>
      <div class="art-coin c1">
        <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
          <circle cx="12" cy="12" r="10" fill="#F59E0B" />
          <circle cx="12" cy="12" r="7.4" fill="none" stroke="#FEF3C7" stroke-width="1.6" />
          <path d="M10.6 15.6v-7.2h1.9c1.7 0 2.8.9 2.8 2.4 0 1.1-.5 1.9-1.5 2.2l1.7 2.6h-1.5l-1.6-2.5h-.9v2.5h-.9zm.9-3.3h1c.9 0 1.4-.4 1.4-1.2s-.5-1.2-1.4-1.2h-1v2.4z" fill="#fff" />
        </svg>
      </div>
      <div class="art-box">
        <svg viewBox="0 0 40 44" width="42" height="46" aria-hidden="true">
          <path d="M20 5c-2.6-2.8-7.4-1.6-7.4 2.2 0 2.9 2.7 4.7 7.4 7.8 4.7-3.1 7.4-4.9 7.4-7.8 0-3.8-4.8-5-7.4-2.2z" fill="#F59E0B" />
          <rect x="4" y="17" width="32" height="23" rx="5" fill="#0D9488" />
          <rect x="4" y="17" width="32" height="23" rx="5" fill="none" stroke="#0F766E" stroke-width="1.4" />
          <rect x="13" y="13" width="14" height="7" rx="3.5" fill="#0F766E" />
          <path d="M20 26c-2-2.2-5.7-1.2-5.7 2 0 2.6 2.4 4.2 5.7 7 3.3-2.8 5.7-4.4 5.7-7 0-3.2-3.7-4.2-5.7-2z" fill="#CCFBF1" />
        </svg>
      </div>
      <div class="ripple-float f1"></div>
      <div class="ripple-float f2"></div>
      <div class="ripple-float f3"></div>
      <div class="ripple-heart">
        <svg class="art-hands" viewBox="0 0 64 64" width="48" height="48" fill="none" aria-hidden="true">
          <path d="M15 38c2.4 3.2 5.6 5 9.5 5s7.1-1.8 9.5-5" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity="0.55" />
          <path d="M30 42c2.4 3.2 5.6 5 9.5 5s7.1-1.8 9.5-5" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity="0.55" />
          <path d="M23 34.5c2 2.7 4.7 4.2 9 4.2s7-1.5 9-4.2" stroke="#FFFFFF" stroke-width="3.2" stroke-linecap="round" opacity="0.75" />
          <path d="M28 30.5c1.4 1.9 3.3 3 6 3s4.6-1.1 6-3" stroke="#FFFFFF" stroke-width="3.4" stroke-linecap="round" />
          <path d="M32 18c-3.6-3.9-10.2-2.3-10.2 3.1 0 4 3.7 6.5 10.2 10.9 6.5-4.4 10.2-6.9 10.2-10.9 0-5.4-6.6-7-10.2-3.1z" fill="#FFFFFF" />
          <path d="M27.4 19.6a4.4 4.4 0 0 1 4.6-1.2" stroke="#CCFBF1" stroke-width="1.8" stroke-linecap="round" />
        </svg>
      </div>
    </div>`;
}

function trustIcon(i) {
  const icons = [
    lc.eye({ size: 17, "aria-hidden": "true" }),
    lc.user({ size: 17, "aria-hidden": "true" }),
    lc.clock({ size: 17, "aria-hidden": "true" }),
  ];
  return icons[i] ?? icons[0];
}

/* ---------- Impact counter ---------- */
function renderStats() {
  $("#stats-row").innerHTML = campaign.stats
    .map(
      (s, i) => `
      <div class="stat">
        <div class="stat-value ${s.accent ? "stat-accent" : ""}" data-target="${s.numeric}" data-prefix="${s.prefix ?? ""}" data-suffix="${s.suffix ?? ""}">0</div>
        <div class="stat-label">${s.label}</div>
      </div>`
    )
    .join("");
  animateStats($$(".stat-value"));
}

function animateStats(els) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target;
        const target = Number(el.dataset.target);
        const prefix = el.dataset.prefix;
        const suffix = el.dataset.suffix;
        const dur = 1200;
        const t0 = performance.now();
        const tick = (t) => {
          const p = Math.min((t - t0) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          const val = Math.round(target * eased);
          el.textContent = `${prefix}${new Intl.NumberFormat("id-ID").format(val)}${suffix}`;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        io.unobserve(el);
      }
    },
    { threshold: 0.4 }
  );
  els.forEach((el) => io.observe(el));
}

/* ---------- Active campaigns ---------- */
function renderCampaigns() {
  $("#campaign-grid").innerHTML = store.getCampaigns().map(campaignCard).join("");
}

function campaignCard(c) {
  const pct = Math.min(pctOf(c), 100);
  const hot = c.category === "sedekah_subuh";
  const theme = c.theme || "book";
  const title = store.sanitizeHTML(c.title);
  const titleAttr = esc(c.title);
  const image = store.sanitizeURL(c.image);
  const badge = `<span class="badge ${hot ? "badge-hot" : ""}">${esc(campaign.categories[c.category] ?? c.category)}</span>`;
  const cover = image
    ? `<div class="cover cover-photo"><img src="${image}" alt="${titleAttr}" loading="lazy" />${badge}</div>`
    : `<div class="cover cover-${theme}">${badge}<div class="cover-glyph">${coverGlyph(theme)}</div></div>`;
  return `
  <article class="reward-card" data-campaign-key="${c.id}">
    ${cover}
    <div class="card-body">
      <h3 class="card-title">${title}</h3>
      <div class="card-progress-track" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Progres dana ${titleAttr}">
        <div class="card-progress-fill" style="width:${pct}%"></div>
      </div>
      <div class="card-figures">
        <span class="card-raised">${fmtRp(c.collected)}</span>
        <span class="card-target">dari ${fmtRp(c.target)}</span>
      </div>
      <div class="card-meta">
        <span>${(c.donors ?? 0).toLocaleString("id-ID")} donatur</span>
        <span class="days-left">${daysLeft(c)}</span>
      </div>
      <div class="card-actions">
        <button class="btn btn-primary" type="button" data-donate-campaign="${c.id}">Donasi Sekarang</button>
        <button class="card-share" type="button" data-share="${c.id}" aria-label="Bagikan ${titleAttr}">
          ${lc.share2({ size: 16, "aria-hidden": "true" })}
          <span>Bagikan</span>
        </button>
      </div>
    </div>
  </article>`;
}

function coverGlyph(theme) {
  const glyphs = {
    book: lc.bookOpen({ size: 56, "stroke-width": 2.4, "aria-hidden": "true" }),
    mosque: '<svg viewBox="0 0 48 48" width="56" height="56" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M24 6v6M18 12h12M24 30a10 10 0 0 0 10-10H14a10 10 0 0 0 10 10z"/><path d="M10 20h28M10 30h28M12 30v12M36 30v12M20 42v-6h8v6"/></svg>',
    dawn: lc.sunrise({ size: 56, "stroke-width": 2.4, "aria-hidden": "true" }),
    umbrella: lc.umbrella({ size: 56, "stroke-width": 2.4, "aria-hidden": "true" }),
  };
  return glyphs[theme] ?? glyphs.book;
}

/* ---------- Program unggulan ---------- */
function renderPrograms() {
  $("#program-grid").innerHTML = campaign.programs
    .map((p) => `
    <article class="program-card" data-campaign-key="program:${p.id}">
      <div class="program-icon">${coverGlyph(p.theme)}</div>
      <h3>${p.title}</h3>
      <p>${p.description}</p>
      <ul class="program-points">
        ${p.points.map((pt) => `
          <li>
            ${lc.check({ size: 15, "stroke-width": 2.2, "aria-hidden": "true" })}
            ${pt}
          </li>`).join("")}
      </ul>
      <div class="program-actions">
        <button class="btn btn-primary" type="button" data-donate-campaign="program:${p.id}">${p.cta}</button>
        <button class="card-share" type="button" data-share="program:${p.id}" aria-label="Bagikan program ${p.title}">
          ${lc.share2({ size: 16, "aria-hidden": "true" })}
          <span>Bagikan</span>
        </button>
      </div>
    </article>`)
    .join("");
}

/* ---------- Completed campaigns ---------- */
function renderCompleted() {
  $("#completed-grid").innerHTML = campaign.completedCampaigns
    .map(
      (c) => `
    <article class="completed-card">
      <div class="cover cover-${c.theme}">
        <span class="completed-done">100% Selesai & Tersalurkan</span>
        <div class="cover-glyph">${coverGlyph(c.theme)}</div>
      </div>
      <div class="completed-body">
        <h3>${c.title}</h3>
        <div class="completed-meta">${c.donors.toLocaleString("id-ID")} donatur · ${campaign.categories[c.category]}</div>
        <button class="report-link" type="button" data-report="${c.id}">
          ${lc.eye({ size: 15, "stroke-width": 2.2, "aria-hidden": "true" })}
          Lihat Laporan Penggunaan Dana
        </button>
      </div>
    </article>`
    )
    .join("");
}

/* ---------- Report modal ---------- */
const reportDialog = $("#report-modal");

const statusLabels = { pending: "Menunggu Konfirmasi", confirmed: "Terkonfirmasi", failed: "Gagal" };

function statusPill(status) {
  const cls = { confirmed: "ok", pending: "warn", failed: "err" }[status] ?? "";
  return `<span class="status-pill ${cls}">${statusLabels[status] ?? status}</span>`;
}

function donationTargetLabel(d) {
  if (d.kind === "program") {
    return campaign.programs.find((x) => x.id === d.programId)?.title || d.programId;
  }
  if (d.campaignId) {
    return store.getCampaignsRaw().find((x) => String(x.id) === String(d.campaignId))?.title || "Donasi umum";
  }
  return "Donasi umum";
}

function runStatusCheck(ref) {
  const needle = String(ref || "").trim();
  const result = $("#status-result");
  const input = $("#status-ref-input");
  if (!needle) {
    result.innerHTML = `<p style="margin:0">Masukkan ref donasi di atas untuk mengecek status.</p>`;
    input.focus();
    return;
  }
  const d = store.findDonationByRef(needle);
  if (!d) {
    result.innerHTML = `
      <p style="margin:0 0 14px">Ref <strong>${esc(needle)}</strong> tidak ditemukan.</p>
      <p>Kemungkinan donasi dibuat dari perangkat lain atau data perangkat ini telah dibersihkan. Hubungi kami via WhatsApp untuk dibantu.</p>
      <div class="donate-actions" style="margin-top:14px">
        <a class="btn btn-primary" href="${store.waStatusUrl(campaign.contactWhatsApp, `Assalamu'alaikum, saya ingin mengecek status donasi dengan ref ${needle} di ${campaign.name}.`)}" target="_blank" rel="noopener">Hubungi via WhatsApp</a>
      </div>`;
    return;
  }
  result.innerHTML = `
    <p style="margin:0 0 14px">Ref <strong>${esc(d.ref)}</strong></p>
    <div class="status-detail">
      <div class="status-row"><span>Status</span><strong>${statusPill(d.status)}</strong></div>
      <div class="status-row"><span>Tujuan</span><strong>${esc(donationTargetLabel(d))}</strong></div>
      <div class="status-row"><span>Nominal</span><strong>${fmtRp(d.amount)}</strong></div>
      <div class="status-row"><span>Metode</span><strong>${esc(d.method || "-")}</strong></div>
      <div class="status-row"><span>Waktu</span><strong>${new Date(d.createdAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</strong></div>
    </div>`;
}

function openStatusCheck(prefill) {
  const input = $("#status-ref-input");
  input.value = prefill || "";
  runStatusCheck(prefill || "");
  const dialog = $("#status-modal");
  if (!dialog.open) dialog.showModal();
}

function openReport(id) {
  const c = campaign.completedCampaigns.find((x) => x.id === Number(id));
  if (!c) return;
  $("#report-title").textContent = c.report.title;
  $("#report-body").innerHTML = `
    <div class="report-proof">
      ${lc.image({ size: 36, "stroke-width": 1.8, "aria-hidden": "true" })}
    </div>
    <div class="report-items">
      ${c.report.items.map((it) => `<div class="report-item"><span>${it.label}</span><span class="amount">${fmtRp(it.amount)}</span></div>`).join("")}
    </div>
    <div class="report-total"><span>Total Tersalurkan</span><span>${fmtRp(c.report.total)}</span></div>
    <p class="report-note">${c.report.note}</p>`;
  if (!reportDialog.open) reportDialog.showModal();
}

function closeReport() {
  if (reportDialog.open) reportDialog.close();
}

/* ---------- Share modal ---------- */
const shareDialog = $("#share-modal");
let shareCurrent = null;

function shareTarget(key) {
  if (String(key).startsWith("program:")) {
    const id = String(key).split(":")[1];
    return campaign.programs.find((p) => p.id === id) || null;
  }
  return store.getCampaigns().find((c) => String(c.id) === String(key)) || null;
}

function openShare(key) {
  const item = shareTarget(key);
  if (!item) return;
  const isProgram = String(key).startsWith("program:");
  const text = share.shareText({
    key,
    title: item.title,
    collected: isProgram ? undefined : item.collected,
    target: isProgram ? undefined : item.target,
    daysLeft: isProgram ? undefined : item.daysLeft,
  });
  shareCurrent = { key, text, url: share.shareUrl(key), title: item.title };
  $("#share-campaign-title").textContent = item.title;
  $("#share-caption-preview").textContent = text;
  $("#share-wa").href = share.waShareLink(text);
  $("#share-url").value = shareCurrent.url;
  if (!shareDialog.open) shareDialog.showModal();
}

function closeShare() {
  if (shareDialog.open) shareDialog.close();
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
}

async function shareViaInstagram(text, url) {
  if (navigator.share) {
    try {
      await navigator.share({ title: shareCurrent?.title || "Markas Kebaikan", text, url });
      return;
    } catch (err) {
      if (err && err.name === "AbortError") return;
    }
  }
  await copyToClipboard(url);
  toast("Link disalin — buka Instagram, pilih Story, lalu tempel");
}

function handleShareHash() {
  const m = window.location.hash.match(/^#kampanye=(.+)$/);
  if (!m) return;
  let key = m[1];
  try {
    key = decodeURIComponent(key);
  } catch {
    return;
  }
  const card = document.querySelector(`[data-campaign-key="${CSS.escape(key)}"]`);
  if (!card) return;
  card.scrollIntoView({ behavior: "smooth", block: "center" });
  card.classList.add("share-highlight");
  setTimeout(() => card.classList.remove("share-highlight"), 2600);
}

/* ---------- Donation modal (3-step flow) ---------- */
const donateDialog = $("#donate-modal");
const donateState = {
  campaignId: null,
  programId: null,
  ref: null,
  amount: null,
  step: 1,
  preset: null,
  name: "",
  anonymous: false,
  contact: "",
  message: "",
  method: null,
  proof: null,
  proofNote: "",
  processing: false,
};

function openDonate(campaignId) {
  const isProgram = campaignId && String(campaignId).startsWith("program:");
  const programId = isProgram ? String(campaignId).split(":")[1] : null;
  resetDonateState();
  donateState.campaignId = isProgram ? null : campaignId;
  donateState.programId = programId;
  if (programId) {
    const p = campaign.programs.find((x) => x.id === programId);
    if (p) {
      $("#donate-campaign-label").textContent = `${p.title} · Program`;
    }
  } else if (donateState.campaignId) {
    const c = store.getCampaignsRaw().find((x) => String(x.id) === String(donateState.campaignId));
    $("#donate-campaign-label").textContent = c ? `${c.title} · ${campaign.categories[c.category] ?? c.category}` : "";
  } else {
    $("#donate-campaign-label").textContent = "Donasi umum — salurkan ke program yang paling membutuhkan";
  }
  renderStep();
  if (!donateDialog.open) donateDialog.showModal();
}

function closeDonate() {
  if (donateState.processing) return;
  if (donateDialog.open) donateDialog.close();
  resetDonateState();
}

function resetDonateState() {
  donateState.amount = null;
  donateState.step = 1;
  donateState.preset = null;
  donateState.name = "";
  donateState.anonymous = false;
  donateState.contact = "";
  donateState.message = "";
  donateState.method = null;
  donateState.proof = null;
  donateState.proofNote = "";
  donateState.processing = false;
}
function setStep(n) {
  donateState.step = n;
  renderStep();
}

function renderStep() {
  const title = $("#donate-title");
  const label = $("#donate-campaign-label");
  if (donateState.step === 4) {
    title.textContent = "Donasi Berhasil";
    if (label) label.style.display = "none";
  } else {
    title.textContent = "Donasi Sekarang";
    if (label) label.style.display = "";
  }
  renderStepsIndicator();
  const body = $("#donate-body");
  if (donateState.step === 1) body.innerHTML = stepNominal();
  else if (donateState.step === 2) body.innerHTML = stepIdentitas();
  else if (donateState.step === 3) body.innerHTML = stepPembayaran();
  else body.innerHTML = stepSuccess();
  bindStepEvents();
}

function renderStepsIndicator() {
  const steps = $("#donate-steps");
  if (steps) steps.classList.toggle("hidden", donateState.step === 4);
  const lis = $$("#donate-steps li");
  lis.forEach((li) => {
    const n = Number(li.dataset.step);
    li.classList.toggle("active", n === donateState.step);
    li.classList.toggle("done", n < donateState.step);
  });
}

function stepNominal() {
  const presets = campaign.nominalPresets
    .map((p) => `<button type="button" class="preset ${donateState.preset === p ? "selected" : ""}" data-preset="${p}">${fmtRp(p)}</button>`)
    .join("");
  return `
    <h4>Pilih Nominal</h4>
    <div class="presets">${presets}</div>
    <div class="donate-field">
      <label for="donate-custom">Nominal Kustom</label>
      <input id="donate-custom" type="number" min="1000" step="1000" placeholder="Minimal Rp 1.000" value="${donateState.amount && !donateState.preset ? donateState.amount : ""}" />
      <p class="field-note">Donasi minimum Rp 1.000</p>
    </div>
    <div class="donate-actions">
      <button class="btn btn-primary" type="button" data-next-step="2" ${donateState.amount ? "" : "disabled"}>Lanjut</button>
    </div>`;
}

function stepIdentitas() {
  const nameVal = donateState.anonymous ? "" : donateState.name;
  return `
    <h4>Identitas &amp; Doa</h4>
    <div class="donate-field">
      <label for="donate-name">Nama <span style="color:var(--muted);font-weight:400">(opsional)</span></label>
      <input id="donate-name" type="text" placeholder="Hamba Allah" value="${nameVal}" ${donateState.anonymous ? "disabled" : ""} />
    </div>
    <label class="donate-anon">
      <input type="checkbox" id="donate-anon" ${donateState.anonymous ? "checked" : ""} />
      <span>Sembunyikan nama saya dari publik (Hamba Allah)</span>
    </label>
    <div class="donate-field">
      <label for="donate-contact">WhatsApp / Email</label>
      <input id="donate-contact" type="text" required placeholder="nomor WhatsApp atau email" value="${donateState.contact}" />
      <p class="field-note">Untuk mengirim bukti penerimaan sedekah &amp; link laporan.</p>
    </div>
    <div class="donate-field">
      <label for="donate-message">Doa / Pesan Kebaikan <span style="color:var(--muted);font-weight:400">(opsional)</span></label>
      <textarea id="donate-message" placeholder="Tuliskan doa atau pesanmu…">${donateState.message}</textarea>
    </div>
    <div class="donate-actions">
      <button class="btn btn-back-step" type="button" data-back-step="1">Kembali</button>
      <button class="btn btn-primary" type="button" data-next-step="3">Lanjut</button>
    </div>`;
}

function stepPembayaran() {
  const methods = store.getActivePaymentMethods()
    .map((m) => {
      const vaDetail =
        m.kind === "va"
          ? `<span class="pay-va"><span class="pay-va-name">${esc(m.vaName || "")}</span><span class="pay-va-num">${esc(m.vaNumber || "")}</span></span>`
          : "";
      return `
      <button type="button" class="pay-method ${donateState.method === m.id ? "selected" : ""}" data-method="${m.id}">
        <span class="pay-icon">${payIcon(m)}</span>
        <span><span class="pay-label">${esc(m.label)}</span><span class="pay-note">${esc(m.note || "")}</span>${vaDetail}</span>
      </button>`;
    })
    .join("");
  return `
    <h4>Metode Pembayaran &amp; Bukti Transfer</h4>
    <p class="donate-total">${fmtRp(donateState.amount)}</p>
    <div class="pay-wrap" data-field="method">
      <div class="pay-methods">${methods}</div>
    </div>
    <div class="donate-field" data-field="proof">
      <label for="donate-proof">Upload Bukti Transfer</label>
      <input id="donate-proof" type="file" accept="image/*" />
      <p class="field-note">Foto atau tangkapan layar bukti pembayaran (maks 2 MB).</p>
      ${donateState.proof ? `<img class="proof-preview" id="proof-preview" src="${donateState.proof}" alt="Pratinjau bukti transfer" />` : ""}
    </div>
    <div class="donate-field">
      <label for="donate-proof-note">Catatan <span style="color:var(--muted);font-weight:400">(opsional)</span></label>
      <input id="donate-proof-note" type="text" placeholder="Nama pengirim / no. referensi" value="${donateState.proofNote}" />
    </div>
    <div class="donate-actions">
      <button class="btn btn-back-step" type="button" data-back-step="2">Kembali</button>
      <button class="btn btn-primary" type="button" data-pay>Kirim &amp; Tunggu Konfirmasi</button>
    </div>`;
}

function donateTargetLabel() {
  if (donateState.programId) {
    return campaign.programs.find((x) => x.id === donateState.programId)?.title || "Program";
  }
  if (donateState.campaignId) {
    return store.getCampaignsRaw().find((x) => String(x.id) === String(donateState.campaignId))?.title || "Donasi umum";
  }
  return "Donasi umum";
}

function statusMessageText() {
  const label = donateTargetLabel();
  const name = donateState.anonymous ? "Hamba Allah" : donateState.name.trim() || "Hamba Allah";
  return [
    `Assalamu'alaikum, saya ${name}, ingin mengecek status donasi saya di ${campaign.name}.`,
    `Ref: ${donateState.ref ?? ""}`,
    `Tujuan: ${label}`,
    `Nominal: ${fmtRp(donateState.amount)}`,
  ].join("\n");
}

function stepSuccess() {
  const name = donateState.anonymous ? "Hamba Allah" : donateState.name.trim() || "Hamba Allah";
  const ref = donateState.ref ?? "";
  const methodLabel = store.getActivePaymentMethods().find((m) => m.id === donateState.method)?.label || donateState.method || "-";
  const waHref = store.waStatusUrl(campaign.contactWhatsApp, statusMessageText());
  const waAction = store.isPhoneLike(donateState.contact)
    ? `<a class="btn btn-ghost donate-wa" href="${waHref}" target="_blank" rel="noopener">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
        Cek Status via WhatsApp
      </a>`
    : "";
  return `
    <div class="donate-success">
      <div class="donate-success-icon">
        ${lc.check({ size: 30, "stroke-width": 2.4, "aria-hidden": "true" })}
      </div>
      <h4>Terima kasih, ${esc(name)}!</h4>
      <p class="donate-success-sub">Donasi kamu telah kami terima dan sedang menunggu konfirmasi admin.</p>
      <div class="donate-success-amount">${fmtRp(donateState.amount)}</div>
      <div class="donate-success-status">${statusPill("pending")}</div>
      <div class="donate-summary">
        <div class="donate-summary-row">
          <span>Ref donasi</span>
          <button type="button" class="donate-copy" data-copy-ref aria-label="Salin ref ${ref}" title="Klik untuk menyalin">
            <span class="donate-ref-value">${ref}</span>
            ${lc.copy({ size: 14, "aria-hidden": "true" })}
          </button>
        </div>
        <div class="donate-summary-row"><span>Metode</span><strong>${esc(methodLabel)}</strong></div>
        <div class="donate-summary-row"><span>Tujuan</span><strong>${esc(donateTargetLabel())}</strong></div>
      </div>
      <p class="donate-ref-hint">Simpan Ref di atas untuk mengecek status donasi sewaktu-waktu.</p>
      ${waAction}
      <div class="donate-actions donate-success-actions">
        <button class="btn btn-ghost" type="button" data-check-status>
          ${lc.search({ size: 15, "aria-hidden": "true" })}
          Cek Status Donasi
        </button>
        <button class="btn btn-primary" type="button" data-close-donate>Selesai</button>
      </div>
      <button class="btn-link donate-another" type="button" data-reset>Donasi Lainnya</button>
    </div>`;
}

function bindStepEvents() {
  $$("#donate-body [data-preset]").forEach((b) =>
    b.addEventListener("click", () => {
      donateState.preset = Number(b.dataset.preset);
      donateState.amount = Number(b.dataset.preset);
      const custom = $("#donate-custom");
      if (custom) custom.value = "";
      $$(".preset").forEach((el) => el.classList.toggle("selected", el === b));
      $$("#donate-body [data-next-step]").forEach((el) => (el.disabled = false));
    })
  );

  const custom = $("#donate-custom");
  if (custom) {
    custom.addEventListener("input", () => {
      const v = Number(custom.value);
      donateState.preset = null;
      donateState.amount = v >= 1000 ? v : null;
      $$(".preset").forEach((el) => el.classList.remove("selected"));
      $$("#donate-body [data-next-step]").forEach((el) => (el.disabled = !donateState.amount));
    });
  }

  const name = $("#donate-name");
  const anon = $("#donate-anon");
  const contact = $("#donate-contact");
  const message = $("#donate-message");
  if (name) name.addEventListener("input", () => (donateState.name = name.value));
  if (anon) anon.addEventListener("change", () => {
    donateState.anonymous = anon.checked;
    name.disabled = anon.checked;
    name.value = "";
    if (anon.checked) donateState.name = "";
  });
  if (contact) contact.addEventListener("input", () => (donateState.contact = contact.value.trim()));
  if (message) message.addEventListener("input", () => (donateState.message = message.value));

  $$("#donate-body [data-next-step]").forEach((b) =>
    b.addEventListener("click", () => {
      if (donateState.step === 2 && !donateState.contact) {
        toast("Isi WhatsApp / Email untuk menerima bukti donasi");
        const c = $("#donate-contact");
        if (c) c.focus();
        return;
      }
      setStep(Number(b.dataset.nextStep));
    })
  );

  $$("#donate-body [data-back-step]").forEach((b) =>
    b.addEventListener("click", () => setStep(Number(b.dataset.backStep)))
  );

  const markError = (name, msg) => {
    const el = $(`#donate-body [data-field="${name}"]`);
    if (!el) return;
    el.classList.add("error");
    let note = el.querySelector(".field-error");
    if (!note) {
      note = document.createElement("p");
      note.className = "field-error";
      el.appendChild(note);
    }
    note.textContent = msg;
  };
  const clearError = (name) => {
    const el = $(`#donate-body [data-field="${name}"]`);
    if (!el) return;
    el.classList.remove("error");
    const note = el.querySelector(".field-error");
    if (note) note.remove();
  };

  $$("#donate-body [data-method]").forEach((b) =>
    b.addEventListener("click", () => {
      donateState.method = b.dataset.method;
      $$(".pay-method").forEach((el) => el.classList.toggle("selected", el === b));
      clearError("method");
    })
  );

  const proofInput = $("#donate-proof");
  if (proofInput) {
    proofInput.addEventListener("change", () => {
      const file = proofInput.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        toast("File harus berupa gambar");
        proofInput.value = "";
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast("Ukuran gambar maksimal 2 MB");
        proofInput.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        donateState.proof = String(reader.result);
        const preview = $("#proof-preview");
        if (preview) preview.src = donateState.proof;
        clearError("proof");
      };
      reader.readAsDataURL(file);
    });
  }

  const proofNote = $("#donate-proof-note");
  if (proofNote) {
    proofNote.addEventListener("input", () => (donateState.proofNote = proofNote.value));
  }

  const pay = $("#donate-body [data-pay]");
  if (pay) {
    pay.addEventListener("click", () => {
      let firstError = null;
      if (!donateState.method) {
        markError("method", "Pilih metode pembayaran dulu ya.");
        firstError = firstError || "method";
      }
      if (!donateState.proof) {
        markError("proof", "Upload bukti transfer dulu sebelum kirim.");
        firstError = firstError || "proof";
      }
      if (firstError) {
        toast("Lengkapi data yang ditandai merah dulu");
        const el = $(`#donate-body [data-field="${firstError}"]`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      executePayment();
    });
  }

  async function copyDonateRef() {
    await copyToClipboard(donateState.ref ?? "");
    toast("Ref donasi disalin");
  }

  $$("#donate-body [data-copy-ref]").forEach((copyRef) => {
    copyRef.addEventListener("click", copyDonateRef);
    if (copyRef.tagName !== "BUTTON") {
      copyRef.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          copyDonateRef();
        }
      });
    }
  });

  const checkStatus = $("#donate-body [data-check-status]");
  if (checkStatus) {
    checkStatus.addEventListener("click", () => openStatusCheck(donateState.ref));
  }

  $$("#donate-body [data-reset]").forEach((b) => b.addEventListener("click", () => { resetDonateState(); renderStep(); }));
  $$("#donate-body [data-close-donate]").forEach((b) => b.addEventListener("click", closeDonate));
}

function executePayment() {
  if (donateState.processing) return;
  donateState.processing = true;
  const pay = $("#donate-body [data-pay]");
  pay.disabled = true;
  pay.textContent = "Memproses pembayaran…";
  donateState.ref = `MK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  setTimeout(() => {
    donateState.processing = false;
    recordDonation();
    setStep(4);
    toast("Donasi terkirim — menunggu konfirmasi admin");
  }, 1400);
}

function recordDonation() {
  const displayName = donateState.anonymous ? "Hamba Allah" : donateState.name.trim() || "Hamba Allah";
  const common = {
    id: store.uid(""),
    name: displayName,
    amount: donateState.amount,
    contact: donateState.contact,
    message: donateState.message,
    method: donateState.method,
    ref: donateState.ref,
    proof: donateState.proof || null,
    note: donateState.proofNote.trim() || "",
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  if (donateState.programId) {
    store.saveProgramDonation({ ...common, programId: donateState.programId });
  } else {
    store.saveDonor({
      ...common,
      campaignId: donateState.campaignId,
      anonymous: donateState.anonymous,
    });
  }
}

/* ---------- Toast ---------- */
function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove("show"), 3200);
}

/* ---------- Events ---------- */
function initEvents() {
  document.querySelectorAll("[data-donate]").forEach((btn) =>
    btn.addEventListener("click", () => openDonate(null))
  );
  document.querySelectorAll("[data-donate-campaign]").forEach((btn) =>
    btn.addEventListener("click", (e) => openDonate(e.target.closest("[data-donate-campaign]").dataset.donateCampaign))
  );
  $("#nav-back-btn").addEventListener("click", () => openDonate(null));
  $("#donate-close").addEventListener("click", closeDonate);
  donateDialog.addEventListener("cancel", (e) => {
    if (donateState.processing) e.preventDefault();
  });
  donateDialog.addEventListener("click", (e) => {
    if (e.target === donateDialog) closeDonate();
  });
  $("#report-close").addEventListener("click", closeReport);
  reportDialog.addEventListener("click", (e) => {
    if (e.target === reportDialog) closeReport();
  });
  document.addEventListener("click", (e) => {
    const shareBtn = e.target.closest("[data-share]");
    if (shareBtn) openShare(shareBtn.dataset.share);
  });
  window.addEventListener("hashchange", handleShareHash);
  $("#share-close").addEventListener("click", closeShare);
  shareDialog.addEventListener("click", (e) => {
    if (e.target === shareDialog) closeShare();
  });
  $("#share-ig").addEventListener("click", async () => {
    if (!shareCurrent) return;
    await shareViaInstagram(shareCurrent.text, shareCurrent.url);
  });
  $("#share-copy").addEventListener("click", async () => {
    if (!shareCurrent) return;
    await copyToClipboard(shareCurrent.url);
    toast("Link kampanye disalin");
  });
  const statusDialog = $("#status-modal");
  $("#status-close").addEventListener("click", () => statusDialog.close());
  statusDialog.addEventListener("click", (e) => {
    if (e.target === statusDialog) statusDialog.close();
  });
  $("#status-form").addEventListener("submit", (e) => {
    e.preventDefault();
    runStatusCheck($("#status-ref-input").value);
  });
  document.addEventListener("click", (e) => {
    const open = e.target.closest("[data-open-status]");
    if (open) {
      e.preventDefault();
      openStatusCheck();
    }
  });
  $("#completed-grid").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-report]");
    if (btn) openReport(btn.dataset.report);
  });
}

function initNav() {
  const nav = document.querySelector(".nav");
  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

/* ---------- Scroll reveal ---------- */
function initScrollReveal() {
  // Reduced-motion: CSS handles revealing instantly, skip JS entirely
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // Section heads fade-up on entry
  $$("#kampanye .section-head, #program .section-head, #transparansi .section-head").forEach((el) =>
    el.classList.add("reveal")
  );

  // Stats row children stagger in
  const statsRow = $("#stats-row");
  if (statsRow) statsRow.classList.add("reveal-stagger");

  // Campaign, program, completed grids — children stagger in
  $$("#campaign-grid, #program-grid, #completed-grid").forEach((grid) => {
    grid.classList.add("reveal-stagger");
  });

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("visible");
        io.unobserve(entry.target);
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  $$(".reveal, .reveal-stagger").forEach((el) => io.observe(el));
}

function boot() {
  renderBrand();
  renderHero();
  renderStats();
  renderCampaigns();
  renderPrograms();
  renderCompleted();
  handleShareHash();
  initEvents();
  initNav();
  initScrollReveal();
  initHeroMotion();
  new Chatbot();
}

boot();
