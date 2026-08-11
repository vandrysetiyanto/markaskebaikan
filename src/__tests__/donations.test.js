import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as donations from "../donations.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function makeRecord(id = "don-1") {
  return {
    id,
    name: "Budi",
    amount: 50000,
    campaignId: "c1",
    ref: "MK-ABC",
    status: "pending",
    createdAt: "2026-08-11T00:00:00.000Z",
  };
}

describe("donation queue (public inbox)", () => {
  let fetchMock;

  function installFetch(fn) {
    fetchMock = vi.fn(fn);
    globalThis.fetch = fetchMock;
  }

  beforeEach(() => {
    localStorage.clear();
    installFetch(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("stores the record and flushes it to /api/donation", async () => {
    donations.queueDonation(makeRecord());
    await sleep(10);
    const calls = fetchMock.mock.calls.filter((c) => c[0] === "/api/donation");
    expect(calls.length).toBe(1);
    expect(JSON.parse(calls[0][1].body).id).toBe("don-1");
    expect(donations.getQueuedDonations()).toEqual([]);
  });

  it("keeps the record queued when the server fails", async () => {
    installFetch(async () => {
      throw new Error("network down");
    });
    donations.queueDonation(makeRecord());
    await sleep(10);
    expect(donations.getQueuedDonations()).toHaveLength(1);
  });

  it("does not enqueue the same id twice", async () => {
    installFetch(async () => {
      throw new Error("network down");
    });
    donations.queueDonation(makeRecord());
    donations.queueDonation(makeRecord());
    donations.queueDonation(makeRecord());
    await sleep(10);
    expect(donations.getQueuedDonations()).toHaveLength(1);
  });

  it("flushQueue clears the queue on success", async () => {
    donations.queueDonation(makeRecord());
    await sleep(10);
    const ok = await donations.flushQueue();
    expect(ok).toBe(true);
    expect(donations.getQueuedDonations()).toEqual([]);
  });

  it("consumeInbox returns the records from the endpoint", async () => {
    const records = [makeRecord("in-1"), { ...makeRecord("in-2"), programId: "sedekah" }];
    installFetch(async () =>
      new Response(JSON.stringify({ ok: true, records }), { status: 200 })
    );
    const got = await donations.consumeInbox();
    expect(got).toEqual(records);
    expect(fetchMock).toHaveBeenCalledWith("/api/inbox/consume", expect.anything());
  });

  it("consumeInbox returns empty array on failure", async () => {
    installFetch(async () => {
      throw new Error("down");
    });
    expect(await donations.consumeInbox()).toEqual([]);
  });
});
