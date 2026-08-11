import { describe, it, expect } from "vitest";
import { slugify, shareFileName } from "../share-card.js";

describe("slugify", () => {
  it("lowercases and replaces non-alphanumerics", () => {
    expect(slugify("program:pendidikan")).toBe("program-pendidikan");
    expect(slugify("Sumur Bor #1")).toBe("sumur-bor-1");
    expect(slugify("1")).toBe("1");
  });

  it("falls back when nothing alphanumeric remains", () => {
    expect(slugify("---")).toBe("kampanye");
  });
});

describe("shareFileName", () => {
  it("builds a png filename from key", () => {
    expect(shareFileName("2")).toBe("markas-kebaikan-2.png");
    expect(shareFileName("program:sedekah")).toBe("markas-kebaikan-program-sedekah.png");
  });
});
