import { describe, it, expect } from "vitest";
import { matchSlide, normalizeText, similarity } from "../fuzzy";

describe("fuzzy", () => {
  describe("normalizeText", () => {
    it("removes accents/diacritics", () => {
      expect(normalizeText("Coração")).toBe("coracao");
      expect(normalizeText("São João é ótimo")).toBe("sao joao e otimo");
    });

    it("lowercases", () => {
      expect(normalizeText("HELLO World")).toBe("hello world");
    });

    it("removes punctuation", () => {
      expect(normalizeText("Olá, mundo!!! (teste)")).toBe("ola mundo teste");
    });

    it("collapses and trims whitespace", () => {
      expect(normalizeText("  a   b\tc  ")).toBe("a b c");
    });

    it("returns an empty string for empty input", () => {
      expect(normalizeText("")).toBe("");
    });
  });

  describe("similarity", () => {
    it("returns 1 for identical strings", () => {
      expect(similarity("hello world", "hello world")).toBe(1);
    });

    it("returns 1 ignoring case, accents and punctuation", () => {
      expect(similarity("Coração!", "coracao")).toBe(1);
    });

    it("returns 0 for strings with nothing in common", () => {
      expect(similarity("abcdef", "wxyz")).toBe(0);
    });

    it("returns 0 when either string is empty", () => {
      expect(similarity("", "hello")).toBe(0);
      expect(similarity("hello", "")).toBe(0);
    });

    it("returns a partial score strictly between 0 and 1", () => {
      const score = similarity("hello world", "hello there");
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(1);
    });
  });

  describe("matchSlide", () => {
    const slides: string[][] = [
      ["Amazing grace how sweet the sound", "That saved a wretch like me"],
      ["I once was lost", "But now am found"],
      ["Was blind but now I see", "Twas grace that taught my heart to fear"],
    ];

    it("finds the slide and line that best match the transcript", () => {
      const result = matchSlide("but now am found", slides);
      expect(result.slideIndex).toBe(1);
      expect(result.lineIndex).toBe(1);
      expect(result.score).toBeGreaterThan(0.6);
    });

    it("matches the correct slide even with recognition noise", () => {
      const result = matchSlide("amazing grace how sweet sound", slides);
      expect(result.slideIndex).toBe(0);
      expect(result.lineIndex).toBe(0);
    });

    it("returns slideIndex -1 when there are no slides", () => {
      const result = matchSlide("anything", []);
      expect(result.slideIndex).toBe(-1);
      expect(result.score).toBe(0);
    });
  });
});
