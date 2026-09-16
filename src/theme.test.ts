import { describe, expect, it } from "vitest";

// The UI component itself is browser-rendered; these assertions protect the
// public persistence contract used by both pre-hydration HTML and React.
describe("theme persistence contract", () => {
  it("uses the stable Council theme storage key", async () => {
    const source = await import("./ThemeToggle?raw");
    expect(source.default).toContain('const STORAGE_KEY = "council-theme"');
  });

  it("supports both light and dark appearance modes", async () => {
    const source = await import("./ThemeToggle?raw");
    expect(source.default).toContain('type Theme = "light" | "dark"');
  });
});
