import { describe, it, expect } from "vitest";
import {
  generateId,
  formatFileSize,
  getFileNameFromPath,
} from "../../src/lib/utils";

describe("generateId", () => {
  it("should generate unique IDs", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });

  it("should generate string IDs", () => {
    const id = generateId();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });
});

describe("formatFileSize", () => {
  it("should format bytes", () => {
    expect(formatFileSize(500)).toBe("500 B");
  });

  it("should format KB", () => {
    expect(formatFileSize(2048)).toBe("2.00 KB");
  });

  it("should format MB", () => {
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5.00 MB");
  });
});

describe("getFileNameFromPath", () => {
  it("should extract filename from Windows path", () => {
    expect(getFileNameFromPath("C:\\Users\\docs\\paper.pdf")).toBe("paper.pdf");
  });

  it("should extract filename from Unix path", () => {
    expect(getFileNameFromPath("/home/user/docs/paper.pdf")).toBe("paper.pdf");
  });

  it("should return input if no path separator", () => {
    expect(getFileNameFromPath("paper.pdf")).toBe("paper.pdf");
  });
});
