import {
  capitalizeWords,
  toTitleCase,
  trimWhitespace,
  reverseString,
  isPalindrome,
  truncateString,
  countWords,
  joinWithGrammar,
} from "@/utils/stringHelpers";

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

  describe("toTitleCase", () => {
    it("should convert to title case", () => {
      expect(toTitleCase("hello world")).toBe("Hello World");
    });

    it("should handle multiple spaces", () => {
      expect(toTitleCase("hello    world")).toBe("Hello World");
    });

    it("should handle tabs and newlines", () => {
      expect(toTitleCase("hello\tworld")).toBe("Hello World");
    });

    it("should handle empty string", () => {
      expect(toTitleCase("")).toBe("");
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

  describe("reverseString", () => {
    it("should reverse a string", () => {
      expect(reverseString("hello")).toBe("olleh");
    });

    it("should reverse a phrase with spaces", () => {
      expect(reverseString("hello world")).toBe("dlrow olleh");
    });

    it("should handle single character", () => {
      expect(reverseString("a")).toBe("a");
    });

    it("should handle empty string", () => {
      expect(reverseString("")).toBe("");
    });

    it("should reverse special characters", () => {
      expect(reverseString("hello!")).toBe("!olleh");
    });
  });

  describe("isPalindrome", () => {
    it("should identify simple palindromes", () => {
      expect(isPalindrome("racecar")).toBe(true);
    });

    it("should identify palindromes with spaces", () => {
      expect(isPalindrome("A man a plan a canal Panama")).toBe(true);
    });

    it("should identify palindromes case-insensitively", () => {
      expect(isPalindrome("Madam")).toBe(true);
    });

    it("should return false for non-palindromes", () => {
      expect(isPalindrome("hello")).toBe(false);
    });

    it("should return false for empty string", () => {
      expect(isPalindrome("")).toBe(false);
    });

    it("should handle single character", () => {
      expect(isPalindrome("a")).toBe(true);
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

  describe("countWords", () => {
    it("should count words in a string", () => {
      expect(countWords("hello world")).toBe(2);
    });

    it("should handle multiple spaces", () => {
      expect(countWords("hello    world")).toBe(2);
    });

    it("should handle leading and trailing spaces", () => {
      expect(countWords("  hello world  ")).toBe(2);
    });

    it("should handle empty string", () => {
      expect(countWords("")).toBe(0);
    });

    it("should count single word", () => {
      expect(countWords("hello")).toBe(1);
    });

    it("should handle tabs and newlines", () => {
      expect(countWords("hello\nworld\tthere")).toBe(3);
    });
  });

  describe("joinWithGrammar", () => {
    it("should join single item", () => {
      expect(joinWithGrammar(["apple"])).toBe("apple");
    });

    it("should join two items with 'and'", () => {
      expect(joinWithGrammar(["apple", "banana"])).toBe("apple and banana");
    });

    it("should join three items with serial comma", () => {
      expect(joinWithGrammar(["apple", "banana", "orange"])).toBe(
        "apple, banana, and orange"
      );
    });

    it("should join multiple items with serial comma", () => {
      expect(
        joinWithGrammar(["apple", "banana", "orange", "grape"])
      ).toBe("apple, banana, orange, and grape");
    });

    it("should use custom separator", () => {
      expect(joinWithGrammar(["apple", "banana"], "or")).toBe(
        "apple or banana"
      );
    });

    it("should use custom separator with multiple items", () => {
      expect(joinWithGrammar(["apple", "banana", "orange"], "or")).toBe(
        "apple, banana, or orange"
      );
    });

    it("should handle empty array", () => {
      expect(joinWithGrammar([])).toBe("");
    });

    it("should handle null or undefined", () => {
      expect(joinWithGrammar(null as any)).toBe("");
      expect(joinWithGrammar(undefined as any)).toBe("");
    });
  });
});
