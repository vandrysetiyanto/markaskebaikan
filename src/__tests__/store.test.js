import { describe, it, expect, beforeEach } from "vitest";
import * as store from "../store.js";

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
