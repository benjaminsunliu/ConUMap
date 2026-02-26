import { capitalizeWords, trimWhitespace, truncateString } from "@/utils/stringHelpers";

describe("stringHelpers", () => {
  describe("capitalizeWords", () => {
    it("should capitalize the first letter of each word", () => {
      expect(capitalizeWords("hello world")).toBe("Hello World");
    });

    it("should handle single word", () => {
      expect(capitalizeWords("hello")).toBe("Hello");
    });

    it("should handle already capitalized words", () => {
      expect(capitalizeWords("HELLO WORLD")).toBe("Hello World");
    });

    it("should handle empty string", () => {
      expect(capitalizeWords("")).toBe("");
    });

    it("should handle mixed case", () => {
      expect(capitalizeWords("heLLo WoRLd")).toBe("Hello World");
    });
  });

  describe("trimWhitespace", () => {
    it("should remove leading and trailing whitespace", () => {
      expect(trimWhitespace("  hello world  ")).toBe("hello world");
    });

    it("should remove extra whitespace between words", () => {
      expect(trimWhitespace("hello    world")).toBe("hello world");
    });

    it("should handle string with no extra whitespace", () => {
      expect(trimWhitespace("hello world")).toBe("hello world");
    });

    it("should handle empty string", () => {
      expect(trimWhitespace("")).toBe("");
    });

    it("should handle tabs and newlines", () => {
      expect(trimWhitespace("  hello\t\tworld\n  ")).toBe("hello world");
    });
  });

  describe("truncateString", () => {
    it("should not truncate string shorter than maxLength", () => {
      expect(truncateString("hello", 10)).toBe("hello");
    });

    it("should truncate string longer than maxLength", () => {
      expect(truncateString("hello world", 8)).toBe("hello...");
    });

    it("should use default maxLength of 50", () => {
      const longString = "a".repeat(60);
      const result = truncateString(longString);
      expect(result).toBe("a".repeat(47) + "...");
      expect(result.length).toBe(50);
    });

    it("should handle empty string", () => {
      expect(truncateString("")).toBe("");
    });

    it("should truncate exactly at maxLength", () => {
      expect(truncateString("hello world", 11)).toBe("hello world");
      expect(truncateString("hello world!", 11)).toBe("hello wo...");
    });
  });
});
