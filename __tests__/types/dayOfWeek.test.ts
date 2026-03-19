import { DayOfWeek } from "@/types/dayOfWeek";

describe("DayOfWeek Enum", () => {
  it("should convert enum values to lowercase strings", () => {
    expect(DayOfWeek.toString(DayOfWeek.Sunday)).toBe("sunday");
    expect(DayOfWeek.toString(DayOfWeek.Monday)).toBe("monday");
    expect(DayOfWeek.toString(DayOfWeek.Tuesday)).toBe("tuesday");
    expect(DayOfWeek.toString(DayOfWeek.Wednesday)).toBe("wednesday");
    expect(DayOfWeek.toString(DayOfWeek.Thursday)).toBe("thursday");
    expect(DayOfWeek.toString(DayOfWeek.Friday)).toBe("friday");
    expect(DayOfWeek.toString(DayOfWeek.Saturday)).toBe("saturday");
  });

  it("should convert lowercase strings to enum values", () => {
    expect(DayOfWeek.fromString("sunday")).toBe(DayOfWeek.Sunday);
    expect(DayOfWeek.fromString("monday")).toBe(DayOfWeek.Monday);
    expect(DayOfWeek.fromString("tuesday")).toBe(DayOfWeek.Tuesday);
    expect(DayOfWeek.fromString("wednesday")).toBe(DayOfWeek.Wednesday);
    expect(DayOfWeek.fromString("thursday")).toBe(DayOfWeek.Thursday);
    expect(DayOfWeek.fromString("friday")).toBe(DayOfWeek.Friday);
    expect(DayOfWeek.fromString("saturday")).toBe(DayOfWeek.Saturday);
  });

  it("should return null for invalid strings", () => {
    expect(DayOfWeek.fromString("notaday")).toBeNull();
    expect(DayOfWeek.fromString("")).toBeNull();
    expect(DayOfWeek.fromString("123")).toBeNull();
  });

  it("should convert integers to enum values", () => {
    expect(DayOfWeek.fromInteger(0)).toBe(DayOfWeek.Sunday);
    expect(DayOfWeek.fromInteger(1)).toBe(DayOfWeek.Monday);
    expect(DayOfWeek.fromInteger(2)).toBe(DayOfWeek.Tuesday);
    expect(DayOfWeek.fromInteger(3)).toBe(DayOfWeek.Wednesday);
    expect(DayOfWeek.fromInteger(4)).toBe(DayOfWeek.Thursday);
    expect(DayOfWeek.fromInteger(5)).toBe(DayOfWeek.Friday);
    expect(DayOfWeek.fromInteger(6)).toBe(DayOfWeek.Saturday);
  });

  it("should return null for invalid integers", () => {
    expect(DayOfWeek.fromInteger(-1)).toBeNull();
    expect(DayOfWeek.fromInteger(7)).toBeNull();
    expect(DayOfWeek.fromInteger(100)).toBeNull();
  });
});