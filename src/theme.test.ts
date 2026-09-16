import { describe, expect, it } from "vitest";
import themeSource from "./ThemeToggle.tsx?raw";

describe("theme persistence contract", () => {
  it("uses a stable storage key and supports both appearance modes", () => {
    expect(themeSource).toContain('const STORAGE_KEY = "council-theme"');
    expect(themeSource).toContain('type Theme = "light" | "dark"');
    expect(themeSource).toContain('prefers-color-scheme: light');
  });
});
