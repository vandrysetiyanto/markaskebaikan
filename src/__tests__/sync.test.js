import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as sync from "../sync.js";
import { campaign } from "../campaign.js";

const PASS = "rahasia-bersama-123";

let serverStore = null;
let fetchMock = null;

function installFetchMock() {
  fetchMock = vi.fn(async (_url, init) => {
    if (init && init.method === "PUT") {
      const body = JSON.parse(init.body);
      if (serverStore && body.updatedAt < serverStore.updatedAt) {
        return new Response(
          JSON.stringify({ error: "conflict", serverUpdatedAt: serverStore.updatedAt }),
          { status: 409, headers: { "Content-Type": "application/json" } }
        );
      }
      serverStore = { updatedAt: body.updatedAt, data: body.data };
      return new Response(
        JSON.stringify({ ok: true, updatedAt: body.updatedAt }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
    return new Response(
      JSON.stringify({ updatedAt: serverStore ? serverStore.updatedAt : 0, data: serverStore ? serverStore.data : null }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  });
  globalThis.fetch = fetchMock;
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  serverStore = null;
  sync.disableSync();
  installFetchMock();
});

afterEach(() => {
  sync.disableSync();
  vi.useRealTimers();
});

describe("sha256Hex", () => {
  it("produces stable SHA-256 hex digest", async () => {
    expect(await sync.sha256Hex("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    );
    expect(await sync.sha256Hex(PASS)).toBe(await sync.sha256Hex(PASS));
  });
});

describe("pickWinner", () => {
  it("server wins when newer", () => {
    expect(sync.pickWinner(0, 10)).toBe("server");
  });
  it("local wins when newer or equal", () => {
    expect(sync.pickWinner(10, 0)).toBe("local");
    expect(sync.pickWinner(5, 5)).toBe("local");
  });
});

describe("buildBlob / applyBlob", () => {
  it("buildBlob falls back to defaults for unset keys", () => {
    const blob = sync.buildBlob();
    expect(blob.mk_campaigns).toEqual(campaign.activeCampaigns);
    expect(blob.mk_payment_methods).toEqual(campaign.paymentMethods);
    expect(blob.mk_donors).toEqual([]);
    expect(blob.mk_program_donations).toEqual([]);
    expect(blob.mk_distributions).toEqual([]);
  });

  it("buildBlob reflects stored values", () => {
    localStorage.setItem("mk_donors", JSON.stringify([{ id: 1 }]));
    localStorage.setItem("mk_campaigns", JSON.stringify([{ id: "x" }]));
    const blob = sync.buildBlob();
    expect(blob.mk_donors).toEqual([{ id: 1 }]);
    expect(blob.mk_campaigns).toEqual([{ id: "x" }]);
  });

  it("applyBlob writes present keys and ignores absent ones", () => {
    const before = localStorage.getItem("mk_payment_methods");
    expect(before).toBeNull();
    sync.applyBlob({ mk_donors: [{ id: 9 }] });
    expect(JSON.parse(localStorage.getItem("mk_donors"))).toEqual([{ id: 9 }]);
    expect(localStorage.getItem("mk_campaigns")).toBeNull();
  });
});

describe("enableSync (first device, empty server)", () => {
  it("pulls nothing and pushes the local seed blob", async () => {
    const r = await sync.enableSync(PASS);
    expect(r.ok).toBe(true);
    expect(serverStore).not.toBeNull();
    expect(serverStore.data.mk_campaigns).toEqual(campaign.activeCampaigns);
    const status = sync.getSyncStatus();
    expect(status.enabled).toBe(true);
    expect(status.passphraseSet).toBe(true);
  });
});

describe("pullNow adopts server data when server is newer", () => {
  it("overwrites local data and marks adopted", async () => {
    const serverCamp = [{ id: "s1", title: "Dari Server" }];
    serverStore = { updatedAt: 100, data: { mk_campaigns: serverCamp, mk_donors: [] } };
    localStorage.setItem("mk_campaigns", JSON.stringify([{ id: "l1", title: "Dari Lokal" }]));

    const r = await sync.enableSync(PASS);
    expect(r.ok).toBe(true);
    expect(JSON.parse(localStorage.getItem("mk_campaigns"))).toEqual(serverCamp);
    expect(serverStore.data.mk_campaigns).toEqual(serverCamp);
  });
});

describe("pushNow", () => {
  it("uploads the current local blob and clears dirty", async () => {
    await sync.enableSync(PASS);
    localStorage.setItem("mk_donors", JSON.stringify([{ id: "d1", name: "Ali" }]));
    const r = await sync.pushNow();
    expect(r.ok).toBe(true);
    expect(serverStore.data.mk_donors).toEqual([{ id: "d1", name: "Ali" }]);
    expect(sync.getSyncStatus().dirty).toBe(false);
  });

  it("conflicts (409) and then adopts the newer server data", async () => {
    await sync.enableSync(PASS);
    serverStore = {
      updatedAt: Date.now() + 100000,
      data: { mk_campaigns: [{ id: "winner" }], mk_donors: [] },
    };
    const r = await sync.pushNow();
    expect(r.conflict).toBe(true);
    expect(JSON.parse(localStorage.getItem("mk_campaigns"))).toEqual([{ id: "winner" }]);
  });
});

describe("markDirty debounces a push", () => {
  it("schedules push after the debounce window", async () => {
    await sync.enableSync(PASS);
    vi.useFakeTimers();
    const putsBefore = fetchMock.mock.calls.filter((c) => c[1] && c[1].method === "PUT").length;
    sync.markDirty();
    expect(fetchMock.mock.calls.filter((c) => c[1] && c[1].method === "PUT").length).toBe(putsBefore);
    await vi.advanceTimersByTimeAsync(900);
    expect(fetchMock.mock.calls.filter((c) => c[1] && c[1].method === "PUT").length).toBe(putsBefore + 1);
  });
});

describe("disableSync", () => {
  it("turns sync off and removes passphrase + meta", async () => {
    await sync.enableSync(PASS);
    expect(sync.getSyncStatus().enabled).toBe(true);
    sync.disableSync();
    expect(sync.getSyncStatus().enabled).toBe(false);
    expect(localStorage.getItem("mk_sync_pass")).toBeNull();
    expect(localStorage.getItem("mk_sync_meta")).toBeNull();
  });
});

describe("pullNow consumes public inbox", () => {
  it("merges inbox records into mk_donors and marks dirty", async () => {
    await sync.enableSync(PASS);
    globalThis.fetch = vi.fn(async (url, init) => {
      const u = String(url);
      if (init && init.method === "POST" && u.endsWith("/api/inbox/consume")) {
        return new Response(
          JSON.stringify({
            ok: true,
            records: [
              {
                id: "in-1",
                name: "Ali",
                amount: 25000,
                campaignId: "c1",
                ref: "MK-1",
                status: "pending",
                createdAt: "2026-08-11T00:00:00.000Z",
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      if (init && init.method === "PUT") {
        const body = JSON.parse(init.body);
        serverStore = { updatedAt: body.updatedAt, data: body.data };
        return new Response(
          JSON.stringify({ ok: true, updatedAt: body.updatedAt }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({
          updatedAt: serverStore ? serverStore.updatedAt : 0,
          data: serverStore ? serverStore.data : null,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    });

    const r = await sync.pullNow();
    expect(r.inboxAdded).toBe(1);
    const consumeCall = globalThis.fetch.mock.calls.find(
      (c) => c[1] && c[1].method === "POST" && String(c[0]).endsWith("/api/inbox/consume")
    );
    const authHeader = consumeCall[1].headers.Authorization || consumeCall[1].headers.authorization;
    expect(authHeader).toBe(`Bearer ${await sync.sha256Hex(PASS)}`);
    const donors = JSON.parse(localStorage.getItem("mk_donors"));
    expect(donors.some((d) => d.id === "in-1")).toBe(true);
    expect(sync.getSyncStatus().dirty).toBe(true);
  });

  it("skips duplicate inbox ids already present", async () => {
    await sync.enableSync(PASS);
    localStorage.setItem("mk_donors", JSON.stringify([{ id: "in-1", name: "Ada" }]));
    globalThis.fetch = vi.fn(async (url, init) => {
      if (init && init.method === "POST" && String(url).endsWith("/api/inbox/consume")) {
        return new Response(
          JSON.stringify({
            ok: true,
            records: [{ id: "in-1", name: "Duplikat", amount: 1, campaignId: "c1" }],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      if (init && init.method === "PUT") {
        const body = JSON.parse(init.body);
        serverStore = { updatedAt: body.updatedAt, data: body.data };
        return new Response(
          JSON.stringify({ ok: true, updatedAt: body.updatedAt }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({
          updatedAt: serverStore ? serverStore.updatedAt : 0,
          data: serverStore ? serverStore.data : null,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    });

    const r = await sync.pullNow();
    expect(r.inboxAdded).toBe(0);
    expect(JSON.parse(localStorage.getItem("mk_donors"))).toHaveLength(1);
  });
});
