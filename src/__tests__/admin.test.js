import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const bodyHtml = readFileSync(resolve(process.cwd(), "admin.html"), "utf8").match(/<body[^>]*>([\s\S]*)<\/body>/)[1];

if (typeof HTMLDialogElement !== "undefined" && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
}

const loadAdmin = () => import("../admin.js");

const submitLogin = (user, pass) => {
  document.getElementById("login-user").value = user;
  document.getElementById("login-pass").value = pass;
  document
    .getElementById("login-form")
    .dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
};

describe("admin page login flow", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    document.body.innerHTML = bodyHtml;
    vi.resetModules();
  });

  it("shows the login card when not authenticated", async () => {
    await loadAdmin();
    expect(document.getElementById("admin-login").hidden).toBe(false);
    expect(document.getElementById("admin-app").hidden).toBe(true);
  });

  it("reveals the admin app on successful login", async () => {
    await loadAdmin();
    submitLogin("admin", "markaskebaikan123");
    expect(document.getElementById("admin-login").hidden).toBe(true);
    expect(document.getElementById("admin-app").hidden).toBe(false);
    expect(document.getElementById("campaigns-body").children.length).toBeGreaterThan(0);
  });

  it("shows an error on wrong credentials", async () => {
    await loadAdmin();
    submitLogin("admin", "salah");
    expect(document.getElementById("admin-login").hidden).toBe(false);
    expect(document.getElementById("login-error").hidden).toBe(false);
  });

  it("logs out back to the login card", async () => {
    await loadAdmin();
    submitLogin("admin", "markaskebaikan123");
    document.getElementById("logout-btn").click();
    expect(document.getElementById("admin-app").hidden).toBe(true);
    expect(document.getElementById("admin-login").hidden).toBe(false);
  });
});

describe("settings: payment methods", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    document.body.innerHTML = bodyHtml;
    vi.resetModules();
  });

  it("renders the payment methods table after login", async () => {
    await loadAdmin();
    submitLogin("admin", "markaskebaikan123");
    const store = await import("../store.js");
    expect(document.getElementById("payments-body").children.length).toBe(store.getPaymentMethods().length);
  });

  it("adds a payment method through the modal form", async () => {
    await loadAdmin();
    submitLogin("admin", "markaskebaikan123");
    document.getElementById("add-payment-btn").click();
    expect(document.getElementById("payment-modal").open).toBe(true);
    document.getElementById("pm-label").value = "BRI VA";
    document.getElementById("pm-kind").value = "va";
    document.getElementById("pm-vaname").value = "Yayasan Markas Kebaikan";
    document.getElementById("pm-vanumber").value = "8800 0001";
    document.getElementById("pm-enabled").checked = true;
    document
      .getElementById("payment-form")
      .dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    const store = await import("../store.js");
    expect(store.getPaymentMethods().some((m) => m.label === "BRI VA")).toBe(true);
    expect(document.getElementById("payment-modal").open).toBe(false);
  });

  it("toggles a method off via the row action", async () => {
    const store = await import("../store.js");
    const added = store.addPaymentMethod({ label: "DANA", kind: "qris" });
    await loadAdmin();
    submitLogin("admin", "markaskebaikan123");
    const toggle = document.querySelector(`[data-toggle-payment="${added.id}"]`);
    expect(toggle).not.toBeNull();
    toggle.click();
    expect(store.getPaymentMethods().find((m) => m.id === added.id).enabled).toBe(false);
    expect(store.getActivePaymentMethods().some((m) => m.id === added.id)).toBe(false);
  });
});

describe("campaign image picker", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    document.body.innerHTML = bodyHtml;
    vi.resetModules();
  });

  it("hides preview on open and shows it when a data URL is set via the URL input", async () => {
    await loadAdmin();
    submitLogin("admin", "markaskebaikan123");
    document.getElementById("add-campaign-btn").click();
    const box = document.getElementById("f-image-preview-box");
    expect(box.hidden).toBe(true);

    const input = document.getElementById("f-image");
    input.value = "data:image/jpeg;base64,/9j/4AAQSkZJRg==";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(box.hidden).toBe(false);
    expect(document.getElementById("f-image-preview").getAttribute("src")).toBe(input.value);
  });

  it("clears the image when the remove button is clicked", async () => {
    await loadAdmin();
    submitLogin("admin", "markaskebaikan123");
    document.getElementById("add-campaign-btn").click();
    document.getElementById("f-image").value = "data:image/jpeg;base64,/9j/4AAQSkZJRg==";
    document.getElementById("f-image").dispatchEvent(new Event("input", { bubbles: true }));
    document.getElementById("f-image-remove").click();
    expect(document.getElementById("f-image-preview-box").hidden).toBe(true);
    expect(document.getElementById("f-image").value).toBe("");
  });

  it("offers an upload and a camera capture input", async () => {
    await loadAdmin();
    submitLogin("admin", "markaskebaikan123");
    document.getElementById("add-campaign-btn").click();
    expect(document.getElementById("f-image-upload").getAttribute("accept")).toBe("image/*");
    expect(document.getElementById("f-image-capture").getAttribute("accept")).toBe("image/*");
    expect(document.getElementById("f-image-capture").getAttribute("capture")).toBe("environment");
  });
});

describe("donation filtering", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    document.body.innerHTML = bodyHtml;
    vi.resetModules();
  });

  it("filters by search text (name, ref, contact, amount) and status", async () => {
    const admin = await loadAdmin();
    const list = [
      { id: "1", name: "Budi", contact: "0811", ref: "MK-100", amount: 50000, status: "pending" },
      { id: "2", name: "Ani", contact: "0812", ref: "MK-200", amount: 100000, status: "confirmed" },
      { id: "3", name: "Citra", contact: "0855", ref: "MK-300", amount: 250000, status: "pending" },
    ];
    expect(admin.filterDonations(list, { q: "budi" })).toHaveLength(1);
    expect(admin.filterDonations(list, { q: "MK-200" })).toHaveLength(1);
    expect(admin.filterDonations(list, { q: "250000" })).toHaveLength(1);
    expect(admin.filterDonations(list, { status: "pending" })).toHaveLength(2);
    expect(admin.filterDonations(list, { q: "ani", status: "confirmed" })).toHaveLength(1);
    expect(admin.filterDonations(list, { q: "ani", status: "pending" })).toHaveLength(0);
    expect(admin.filterDonations(list, {})).toHaveLength(3);
  });

  it("includes labeler text (campaign/program title) in the search", async () => {
    const admin = await loadAdmin();
    const list = [{ id: "1", name: "Budi", amount: 50000, status: "pending", campaignId: "1" }];
    const labeler = () => "Pendidikan Gratis";
    expect(admin.filterDonations(list, { q: "pendidikan" }, labeler)).toHaveLength(1);
  });

  it("shows count and pending badge after login with mixed donations", async () => {
    await loadAdmin();
    const store = await import("../store.js");
    for (let i = 0; i < 3; i++) {
      store.saveDonor({ id: `d${i}`, campaignId: "1", name: `Donor ${i}`, amount: 100000, status: "pending", createdAt: new Date().toISOString() });
    }
    store.saveDonor({ id: "dx", campaignId: "1", name: "Done", amount: 50000, status: "confirmed", createdAt: new Date().toISOString() });
    submitLogin("admin", "markaskebaikan123");
    expect(document.getElementById("donors-count").textContent).toBe("Menampilkan 4 dari 4 donasi");
    expect(document.getElementById("badge-donors").textContent).toBe("3");
    expect(document.getElementById("badge-donors").classList.contains("has")).toBe(true);
  });

  it("narrows rows and updates count via search and status filter", async () => {
    await loadAdmin();
    const store = await import("../store.js");
    for (let i = 0; i < 5; i++) {
      store.saveDonor({
        id: `d${i}`,
        campaignId: "1",
        name: i % 2 ? "Ali" : "Budi",
        contact: `08${i}`,
        ref: `R-${i}`,
        amount: 100000 * (i + 1),
        status: i % 2 ? "pending" : "confirmed",
        createdAt: new Date().toISOString(),
      });
    }
    submitLogin("admin", "markaskebaikan123");
    const search = document.getElementById("donors-search");
    const statusSel = document.getElementById("donors-status");
    expect(document.getElementById("donors-body").children.length).toBe(5);

    search.value = "budi";
    search.dispatchEvent(new Event("input", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 300));
    expect(document.getElementById("donors-body").children.length).toBe(3);
    expect(document.getElementById("donors-count").textContent).toBe("Menampilkan 3 dari 5 donasi");

    statusSel.value = "pending";
    statusSel.dispatchEvent(new Event("change", { bubbles: true }));
    expect(document.getElementById("donors-body").textContent).toContain("Belum ada donasi");

    search.value = "";
    search.dispatchEvent(new Event("input", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 300));
    expect(document.getElementById("donors-body").children.length).toBe(2);
  });
});

describe("campaign active toggle", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    document.body.innerHTML = bodyHtml;
    vi.resetModules();
  });

  it("deactivates and reactivates a campaign via the row toggle", async () => {
    const store = await import("../store.js");
    await loadAdmin();
    submitLogin("admin", "markaskebaikan123");
    const id = store.getCampaignsRaw()[0].id;
    const toggle = document.querySelector(`[data-toggle-active="${id}"]`);
    expect(toggle).not.toBeNull();
    expect(toggle.getAttribute("aria-label")).toBe("Nonaktifkan");
    toggle.click();
    expect(store.getCampaignsRaw().find((c) => String(c.id) === String(id)).status).toBe("nonaktif");
    expect(document.querySelector(`[data-toggle-active="${id}"]`).getAttribute("aria-label")).toBe("Aktifkan");
    document.querySelector(`[data-toggle-active="${id}"]`).click();
    expect(store.getCampaignsRaw().find((c) => String(c.id) === String(id)).status).toBe("aktif");
  });
});

describe("bulk delete donations", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    document.body.innerHTML = bodyHtml;
    vi.resetModules();
  });

  it("selects rows individually and deletes them in bulk", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const store = await import("../store.js");
    for (let i = 0; i < 3; i++) {
      store.saveDonor({ id: `d${i}`, campaignId: "1", name: `Donor ${i}`, amount: 100000, status: "pending", createdAt: new Date().toISOString() });
    }
    await loadAdmin();
    submitLogin("admin", "markaskebaikan123");
    const boxes = document.querySelectorAll("#donors-body input[data-select-row]");
    expect(boxes.length).toBe(3);
    boxes[0].click();
    boxes[0].dispatchEvent(new Event("change", { bubbles: true }));
    boxes[1].click();
    boxes[1].dispatchEvent(new Event("change", { bubbles: true }));
    const btn = document.getElementById("bulk-donors-btn");
    expect(btn.hidden).toBe(false);
    expect(document.getElementById("bulk-donors-count").textContent).toBe("2");
    btn.click();
    expect(store.getDonors()).toHaveLength(1);
    expect(document.getElementById("bulk-donors-btn").hidden).toBe(true);
  });

  it("selects all filtered rows via the header checkbox", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const store = await import("../store.js");
    for (let i = 0; i < 3; i++) {
      store.saveDonor({ id: `d${i}`, campaignId: "1", name: `Donor ${i}`, amount: 100000, status: "pending", createdAt: new Date().toISOString() });
    }
    await loadAdmin();
    submitLogin("admin", "markaskebaikan123");
    const all = document.querySelector('[data-select-all="donors"]');
    all.click();
    all.dispatchEvent(new Event("change", { bubbles: true }));
    expect(document.getElementById("bulk-donors-count").textContent).toBe("3");
    document.getElementById("bulk-donors-btn").click();
    expect(store.getDonors()).toHaveLength(0);
  });
});

describe("reset all data (zona bahaya)", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    document.body.innerHTML = bodyHtml;
    vi.resetModules();
  });

  it("resets only after correct password and the HAPUS keyword", async () => {
    const store = await import("../store.js");
    store.saveDonor({ id: "d1", campaignId: "1", name: "X", amount: 50000, status: "confirmed", createdAt: new Date().toISOString() });
    await loadAdmin();
    submitLogin("admin", "markaskebaikan123");
    document.getElementById("reset-data-btn").click();
    expect(document.getElementById("reset-modal").open).toBe(true);
    const err = document.getElementById("reset-error");

    document.getElementById("reset-pass").value = "salah";
    document.getElementById("reset-confirm").value = "HAPUS";
    document.getElementById("reset-form").dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    expect(err.hidden).toBe(false);
    expect(store.getDonors()).toHaveLength(1);

    document.getElementById("reset-pass").value = "markaskebaikan123";
    document.getElementById("reset-confirm").value = "hapus";
    document.getElementById("reset-form").dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    expect(err.hidden).toBe(false);
    expect(store.getDonors()).toHaveLength(1);

    document.getElementById("reset-confirm").value = "HAPUS";
    document.getElementById("reset-form").dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    expect(store.getDonors()).toHaveLength(0);
    expect(document.getElementById("reset-modal").open).toBe(false);
  });
});

describe("distributions (penyaluran)", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    document.body.innerHTML = bodyHtml;
    vi.resetModules();
  });

  it("records a distribution and reflects it in the log and rekap", async () => {
    const store = await import("../store.js");
    store.saveProgramDonation({ id: "a", programId: "pendidikan", name: "X", amount: 1000000, status: "confirmed", createdAt: new Date().toISOString() });
    await loadAdmin();
    submitLogin("admin", "markaskebaikan123");
    document.getElementById("dist-program").value = "pendidikan";
    document.getElementById("dist-amount").value = "400000";
    document.getElementById("dist-date").value = "2026-08-10";
    document.getElementById("dist-recipient").value = "Beasiswa 4 anak";
    document.getElementById("dist-form").dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    const list = store.getDistributions();
    expect(list).toHaveLength(1);
    expect(list[0].programId).toBe("pendidikan");
    expect(list[0].amount).toBe(400000);
    expect(document.getElementById("dist-body").textContent).toContain("Beasiswa 4 anak");
    expect(document.getElementById("rekap-body").textContent).toContain("Orang Tua Asuh");
    expect(document.getElementById("rekap-body").textContent).toContain("40,0%");
  });

  it("shows a validation error for an invalid distribution", async () => {
    await loadAdmin();
    submitLogin("admin", "markaskebaikan123");
    document.getElementById("dist-program").value = "pendidikan";
    document.getElementById("dist-amount").value = "0";
    document.getElementById("dist-date").value = "";
    document.getElementById("dist-recipient").value = "";
    document.getElementById("dist-form").dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
    const err = document.getElementById("dist-error");
    expect(err.hidden).toBe(false);
    expect(err.textContent).toContain("Nominal");
  });
});
