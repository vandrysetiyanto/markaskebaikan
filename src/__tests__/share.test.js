import { describe, it, expect } from "vitest";
import { shareUrl, shareText, waShareLink } from "../share.js";

const base = `${window.location.origin}${window.location.pathname}`;

describe("shareUrl", () => {
  it("builds hash-based campaign url", () => {
    expect(shareUrl("1")).toBe(`${base}#kampanye=1`);
  });

  it("encodes program keys with colon", () => {
    expect(shareUrl("program:pendidikan")).toBe(`${base}#kampanye=program%3Apendidikan`);
  });
});

describe("shareText", () => {
  it("includes title, amounts, remaining days and hashtags", () => {
    const text = shareText({ key: "2", title: "Sumur Bor", collected: 52000000, target: 80000000, daysLeft: 24 });
    expect(text).toContain('Ajak kebaikanmu untuk "Sumur Bor"');
    expect(text).toContain("Terkumpul Rp 52.000.000 dari Rp 80.000.000");
    expect(text).toContain("sisa 24 hari");
    expect(text).toContain(shareUrl("2"));
    expect(text).toContain("#MarkasKebaikan #Sedekah");
  });

  it("omits progress line when amounts are missing (program)", () => {
    const text = shareText({ key: "program:sedekah", title: "Sedekah Rutin" });
    expect(text).not.toContain("Terkumpul");
    expect(text).toContain(shareUrl("program:sedekah"));
  });

  it("omits remaining days when campaign is over", () => {
    const text = shareText({ key: "1", title: "A", collected: 10000, target: 50000, daysLeft: 0 });
    expect(text).not.toContain("sisa");
  });
});

describe("waShareLink", () => {
  it("builds wa.me link with encoded text", () => {
    expect(waShareLink("Halo dunia #Sedekah")).toBe("https://wa.me/?text=Halo%20dunia%20%23Sedekah");
  });
});
