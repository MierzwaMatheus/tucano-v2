import { describe, it, expect } from "vitest";
import {
  calculateCursorPosition,
  countDigits,
  calculateCharsFromEnd,
  formatMonetaryValue,
} from "../../src/hooks/useMonetaryInput";

describe("useMonetaryInput - cursor position calculation", () => {
  describe("countDigits", () => {
    it("should count digits in a simple number", () => {
      expect(countDigits("123")).toBe(3);
    });

    it("should count digits with formatted string", () => {
      expect(countDigits("1.234,56")).toBe(6);
    });

    it("should return 0 for empty string", () => {
      expect(countDigits("")).toBe(0);
    });

    it("should return 0 for string with no digits", () => {
      expect(countDigits(".,")).toBe(0);
    });
  });

  describe("calculateCharsFromEnd", () => {
    it("should return 2 chars for 2 digits from end", () => {
      expect(calculateCharsFromEnd("123,45", 2)).toBe(3);
    });

    it("should return 3 chars for 3 digits from end", () => {
      expect(calculateCharsFromEnd("1.234,56", 3)).toBe(4);
    });

    it("should include separator in count", () => {
      expect(calculateCharsFromEnd("100,00", 2)).toBe(3);
    });

    it("should handle thousands separator", () => {
      expect(calculateCharsFromEnd("1.234,56", 2)).toBe(3);
    });
  });

  describe("calculateCursorPosition", () => {
    it("should place cursor at end when cursor was at end", () => {
      const result = calculateCursorPosition("30050", 5, "300,50");
      expect(result).toBe(6);
    });

    it("should place cursor at position 2 for input 30|050", () => {
      const result = calculateCursorPosition("30050", 2, "300,50");
      expect(result).toBe(2);
    });

    it("should place cursor at position 3 for input 31|050", () => {
      const result = calculateCursorPosition("31050", 3, "310,50");
      expect(result).toBe(3);
    });

    it("should handle cursor after all digits", () => {
      const result = calculateCursorPosition("31050", 6, "310,50");
      expect(result).toBe(6);
    });

    it("should handle empty input", () => {
      const result = calculateCursorPosition("", 0, "");
      expect(result).toBe(0);
    });

    it("should handle single digit input", () => {
      const result = calculateCursorPosition("5", 1, "0,05");
      expect(result).toBe(4);
    });

    it("should handle two digits (cents only)", () => {
      const result = calculateCursorPosition("50", 2, "0,50");
      expect(result).toBe(4);
    });

    it("should handle cursor in middle of formatted output - scenario 30|050", () => {
      const result = calculateCursorPosition("30050", 2, "300,50");
      expect(result).toBe(2);
    });

    it("should handle cursor in middle - scenario 31|050", () => {
      const result = calculateCursorPosition("31050", 3, "310,50");
      expect(result).toBe(3);
    });

    it("should handle cursor after inserting digit - scenario 3105|0", () => {
      const result = calculateCursorPosition("31050", 4, "310,50");
      expect(result).toBe(5);
    });

    it("should handle large number with thousands separator", () => {
      const result = calculateCursorPosition("1234567", 4, "12.345,67");
      expect(result).toBe(5);
    });
  });

  describe("formatMonetaryValue", () => {
    it("should format numeric value to BRL", () => {
      expect(formatMonetaryValue("155.32")).toBe("155,32");
    });

    it("should format with thousands separator", () => {
      expect(formatMonetaryValue("1234.56")).toBe("1.234,56");
    });

    it("should return empty string for empty input", () => {
      expect(formatMonetaryValue("")).toBe("");
    });

    it("should return empty string for invalid input", () => {
      expect(formatMonetaryValue("abc")).toBe("");
    });

    it("should handle zero value", () => {
      expect(formatMonetaryValue("0")).toBe("0,00");
    });

    it("should handle small value", () => {
      expect(formatMonetaryValue("0.05")).toBe("0,05");
    });
  });
});
