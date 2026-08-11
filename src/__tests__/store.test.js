import { describe, it, expect, beforeEach } from "vitest";
import * as store from "../store.js";
import { campaign } from "../campaign.js";

describe("admin auth", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it("rejects wrong credentials", () => {
    expect(store.loginAdmin("admin", "salah")).toBe(false);
    expect(store.isAdminLoggedIn()).toBe(false);
  });

  it("logs in with correct credentials and persists in session", () => {
    expect(store.loginAdmin("admin", "markaskebaikan123")).toBe(true);
    expect(store.isAdminLoggedIn()).toBe(true);
  });

  it("logout clears the session", () => {
    store.loginAdmin("admin", "markaskebaikan123");
    store.logoutAdmin();
    expect(store.isAdminLoggedIn()).toBe(false);
  });
});

describe("donation approval flow", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it("pending donation does not add to campaign collected until approved", () => {
    const before = store.getCampaignsRaw()[0];
    const id = store.uid("d");
    store.saveDonor({
      id,
      campaignId: before.id,
      name: "Test",
      amount: 500000,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
    const afterPending = store.getCampaigns()[0];
    expect(afterPending.collected).toBe(before.collected);
    expect(afterPending.pendingCollected).toBe(500000);
  });

  it("approving a pending donation moves amount into collected", () => {
    const before = store.getCampaignsRaw()[0];
    const id = store.uid("d");
    store.saveDonor({
      id,
      campaignId: before.id,
      name: "Test",
      amount: 500000,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
    store.approveDonor(id);
    const c = store.getCampaignsRaw().find((x) => String(x.id) === String(before.id));
    expect(c.collected).toBe(before.collected + 500000);
    expect(store.getDonors()[0].status).toBe("confirmed");
  });

  it("reopening a confirmed donation removes it from collected", () => {
    const before = store.getCampaignsRaw()[0];
    const id = store.uid("d");
    store.saveDonor({
      id,
      campaignId: before.id,
      name: "Test",
      amount: 300000,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
    store.approveDonor(id);
    store.reopenDonor(id);
    const c = store.getCampaignsRaw().find((x) => String(x.id) === String(before.id));
    expect(c.collected).toBe(before.collected);
    expect(store.getDonors()[0].status).toBe("pending");
  });

  it("deleting a confirmed donation subtracts from collected", () => {
    const before = store.getCampaignsRaw()[0];
    const id = store.uid("d");
    store.saveDonor({
      id,
      campaignId: before.id,
      name: "Test",
      amount: 200000,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
    store.approveDonor(id);
    store.deleteDonor(id);
    const c = store.getCampaignsRaw().find((x) => String(x.id) === String(before.id));
    expect(c.collected).toBe(before.collected);
  });

  it("approved program donation is counted in program totals", () => {
    const id = store.uid("d");
    store.saveProgramDonation({
      id,
      programId: "pendidikan",
      name: "Test",
      amount: 250000,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
    expect(store.programTotals().pendidikan ?? 0).toBe(0);
    store.approveProgramDonation(id);
    expect(store.programTotals().pendidikan).toBe(250000);
  });
});

describe("whatsapp helpers", () => {
  it("detects phone-like contacts", () => {
    expect(store.isPhoneLike("081234567890")).toBe(true);
    expect(store.isPhoneLike("+62 812-3456-7890")).toBe(true);
    expect(store.isPhoneLike("budi@gmail.com")).toBe(false);
    expect(store.isPhoneLike("budi")).toBe(false);
    expect(store.isPhoneLike("1234")).toBe(false);
  });

  it("normalizes numbers to +62 format", () => {
    expect(store.normalizeWaNumber("081234567890")).toBe("6281234567890");
    expect(store.normalizeWaNumber("+6281234567890")).toBe("6281234567890");
    expect(store.normalizeWaNumber("6281234567890")).toBe("6281234567890");
    expect(store.normalizeWaNumber("81234567890")).toBe("6281234567890");
    expect(store.normalizeWaNumber("budi@gmail.com")).toBeNull();
    expect(store.normalizeWaNumber("12")).toBeNull();
  });

  it("builds an encoded wa.me URL", () => {
    const url = store.waStatusUrl("081234567890", "Cek status MK-ABC");
    expect(url).toBe("https://wa.me/6281234567890?text=Cek%20status%20MK-ABC");
  });
});

describe("payment methods", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it("falls back to campaign defaults when nothing is stored", () => {
    expect(store.getPaymentMethods().length).toBeGreaterThan(0);
    expect(store.getPaymentMethods()[0]).toHaveProperty("label");
    expect(store.getActivePaymentMethods().length).toBe(store.getPaymentMethods().length);
  });

  it("adds a new method that is active by default", () => {
    const added = store.addPaymentMethod({ label: "BRI VA", kind: "va", vaName: "Yayasan X", vaNumber: "8800 0001" });
    const list = store.getPaymentMethods();
    expect(list.some((m) => m.id === added.id)).toBe(true);
    expect(added.enabled).toBe(true);
    expect(store.getActivePaymentMethods().some((m) => m.id === added.id)).toBe(true);
  });

  it("updates and toggles a method", () => {
    const added = store.addPaymentMethod({ label: "GoPay", kind: "qris" });
    store.updatePaymentMethod(added.id, { label: "GoPay Plus" });
    expect(store.getPaymentMethods().find((m) => m.id === added.id).label).toBe("GoPay Plus");

    store.togglePaymentMethod(added.id, false);
    expect(store.getPaymentMethods().find((m) => m.id === added.id).enabled).toBe(false);
    expect(store.getActivePaymentMethods().some((m) => m.id === added.id)).toBe(false);
  });

  it("deletes a method and persists the empty list", () => {
    const added = store.addPaymentMethod({ label: "OVO", kind: "qris" });
    store.deletePaymentMethod(added.id);
    expect(store.getPaymentMethods().some((m) => m.id === added.id)).toBe(false);
  });

  it("validates required fields", () => {
    expect(store.validatePaymentMethod({ kind: "qris" })).not.toHaveLength(0);
    expect(store.validatePaymentMethod({ label: "BCA VA", kind: "va" })).not.toHaveLength(0);
    expect(
      store.validatePaymentMethod({ label: "BCA VA", kind: "va", vaName: "Yayasan", vaNumber: "123" })
    ).toHaveLength(0);
    expect(store.validatePaymentMethod({ label: "GoPay", kind: "qris" })).toHaveLength(0);
  });
});

describe("findDonationByRef", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it("finds a campaign donation by ref (case-insensitive)", () => {
    store.saveDonor({
      id: "d1",
      campaignId: "1",
      name: "Budi",
      amount: 50000,
      ref: "MK-ABCD",
      status: "pending",
      createdAt: new Date().toISOString(),
    });
    const d = store.findDonationByRef("mk-abcd");
    expect(d).not.toBeNull();
    expect(d.ref).toBe("MK-ABCD");
    expect(d.kind).toBe("campaign");
  });

  it("finds a program donation by ref", () => {
    store.saveProgramDonation({
      id: "p1",
      programId: "sedekah",
      name: "Ani",
      amount: 100000,
      ref: "MK-ZZZZ",
      status: "confirmed",
      createdAt: new Date().toISOString(),
    });
    const d = store.findDonationByRef("MK-ZZZZ");
    expect(d).not.toBeNull();
    expect(d.kind).toBe("program");
    expect(d.programId).toBe("sedekah");
  });

  it("returns null for unknown or empty ref", () => {
    store.saveDonor({ id: "d1", campaignId: "1", name: "Budi", amount: 1, ref: "MK-ABCD", status: "pending", createdAt: new Date().toISOString() });
    expect(store.findDonationByRef("MK-NOPE")).toBeNull();
    expect(store.findDonationByRef("")).toBeNull();
    expect(store.findDonationByRef("  ")).toBeNull();
  });
});

describe("campaign image validation", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it("sanitizeURL accepts https and data:image URLs", () => {
    expect(store.sanitizeURL("https://example.com/a.jpg")).toBe("https://example.com/a.jpg");
    expect(store.sanitizeURL("data:image/jpeg;base64,AAAA").startsWith("data:image/jpeg")).toBe(true);
  });

  it("sanitizeURL rejects javascript: and empty values", () => {
    expect(store.sanitizeURL("javascript:alert(1)")).toBe("");
    expect(store.sanitizeURL("")).toBe("");
    expect(store.sanitizeURL("  ")).toBe("");
  });

  it("validateCampaign accepts a data:image cover (upload/camera result)", () => {
    const data = {
      title: "Kampanye A",
      category: "Pendidikan",
      image: "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
      target: 1000000,
      collected: 0,
      daysLeft: 10,
    };
    expect(store.validateCampaign(data)).toEqual([]);
  });

  it("validateCampaign flags an invalid cover URL", () => {
    const data = {
      title: "Kampanye B",
      category: "Pendidikan",
      image: "javascript:alert(1)",
      target: 1000000,
      collected: 0,
      daysLeft: 10,
    };
    expect(store.validateCampaign(data).join(" ")).toContain("URL gambar");
  });
});

describe("campaign active status", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it("treats seeded campaigns as active and hides nonaktif ones", () => {
    expect(store.getActiveCampaigns().length).toBe(store.getCampaigns().length);
    const id = store.getCampaignsRaw()[0].id;
    store.setCampaignActive(id, false);
    expect(store.getActiveCampaigns().some((c) => String(c.id) === String(id))).toBe(false);
    expect(store.getCampaigns().some((c) => String(c.id) === String(id))).toBe(true);
  });

  it("reactivates a deactivated campaign", () => {
    const id = store.getCampaignsRaw()[0].id;
    store.setCampaignActive(id, false);
    store.setCampaignActive(id, true);
    expect(store.getActiveCampaigns().some((c) => String(c.id) === String(id))).toBe(true);
  });

  it("isCampaignActive is false only for nonaktif status", () => {
    expect(store.isCampaignActive({ status: "nonaktif" })).toBe(false);
    expect(store.isCampaignActive({})).toBe(true);
    expect(store.isCampaignActive({ status: "aktif" })).toBe(true);
  });
});

describe("bulk donation delete", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it("deleteDonors removes multiple donors and subtracts confirmed amounts from collected", () => {
    const before = store.getCampaignsRaw()[0];
    const ids = [store.uid("d"), store.uid("d")];
    for (const id of ids) {
      store.saveDonor({
        id,
        campaignId: before.id,
        name: "Test",
        amount: 100000,
        status: "pending",
        createdAt: new Date().toISOString(),
      });
      store.approveDonor(id);
    }
    expect(store.getCampaignsRaw()[0].collected).toBe(before.collected + 200000);
    store.deleteDonors(ids);
    expect(store.getDonors()).toHaveLength(0);
    expect(store.getCampaignsRaw()[0].collected).toBe(before.collected);
  });

  it("deleteProgramDonations removes multiple program donations", () => {
    const ids = [store.uid("p"), store.uid("p")];
    for (const id of ids) {
      store.saveProgramDonation({
        id,
        programId: "sedekah",
        name: "Test",
        amount: 50000,
        status: "confirmed",
        createdAt: new Date().toISOString(),
      });
    }
    expect(store.getProgramDonations()).toHaveLength(2);
    store.deleteProgramDonations(ids);
    expect(store.getProgramDonations()).toHaveLength(0);
  });
});

describe("distributions (penyaluran)", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it("saves, lists, deletes, and clears distribution records", () => {
    const d = store.saveDistribution({
      programId: "pendidikan",
      amount: 2000000,
      date: "2026-08-10",
      recipient: "Beasiswa 5 anak",
    });
    expect(store.getDistributions()).toHaveLength(1);
    expect(store.getDistributions()[0].id).toBe(d.id);
    store.deleteDistribution(d.id);
    expect(store.getDistributions()).toHaveLength(0);
    store.saveDistribution({
      programId: "sedekah",
      amount: 100000,
      date: "2026-08-11",
      recipient: "Pangan lansia",
    });
    store.clearDistributions();
    expect(store.getDistributions()).toHaveLength(0);
  });

  it("programBalance computes masuk, tersalur, sisa, and persen realisasi", () => {
    store.saveProgramDonation({ id: "a", programId: "pendidikan", name: "X", amount: 1000000, status: "confirmed", createdAt: new Date().toISOString() });
    store.saveProgramDonation({ id: "b", programId: "pendidikan", name: "Y", amount: 500000, status: "confirmed", createdAt: new Date().toISOString() });
    store.saveDistribution({ programId: "pendidikan", amount: 1200000, date: "2026-08-10", recipient: "Beasiswa" });
    const b = store.programBalance().pendidikan;
    expect(b.received).toBe(1500000);
    expect(b.distributed).toBe(1200000);
    expect(b.remaining).toBe(300000);
    expect(b.pct).toBeCloseTo(80, 1);
  });

  it("does not count pending program donations in received", () => {
    store.saveProgramDonation({ id: "a", programId: "infrastruktur", name: "X", amount: 900000, status: "pending", createdAt: new Date().toISOString() });
    expect(store.programBalance().infrastruktur ?? null).toBeNull();
  });

  it("validateDistribution rejects missing or invalid fields", () => {
    expect(store.validateDistribution({}).length).toBeGreaterThan(0);
    expect(store.validateDistribution({ programId: "pendidikan", date: "2026-08-10", recipient: "Beasiswa", amount: 0 })).not.toHaveLength(0);
    expect(store.validateDistribution({ programId: "pendidikan", date: "2026-08-10", recipient: "Beasiswa", amount: 50000 })).toEqual([]);
  });
});

describe("reset all data", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it("restores default campaigns and clears donations, program donations, and distributions", () => {
    store.saveDonor({ id: "d1", campaignId: "1", name: "X", amount: 100000, status: "confirmed", createdAt: new Date().toISOString() });
    store.saveProgramDonation({ id: "p1", programId: "sedekah", name: "Y", amount: 50000, status: "confirmed", createdAt: new Date().toISOString() });
    store.saveDistribution({ programId: "sedekah", amount: 30000, date: "2026-08-10", recipient: "Pangan" });
    store.addCampaign({ title: "Kampanye Baru", category: "Pendidikan", target: 1000000, collected: 0, daysLeft: 30 });
    store.resetAllData();
    expect(store.getDonors()).toHaveLength(0);
    expect(store.getProgramDonations()).toHaveLength(0);
    expect(store.getDistributions()).toHaveLength(0);
    const list = store.getCampaignsRaw();
    expect(list.some((c) => c.title === "Kampanye Baru")).toBe(false);
    expect(list).toHaveLength(campaign.activeCampaigns.length);
    expect(store.getActiveCampaigns()).toHaveLength(campaign.activeCampaigns.length);
  });
});
