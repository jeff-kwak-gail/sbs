import { describe, it, expect, vi } from "vitest";
import { buildDiffArgs } from "../src/git.js";

vi.mock("node:child_process", () => ({
  execSync: vi.fn((cmd: string) => {
    if (cmd === "git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null") {
      return "refs/remotes/origin/main\n";
    }
    return "";
  }),
}));

describe("buildDiffArgs", () => {
  it("should diff working directory against default branch when no range given", () => {
    const args = buildDiffArgs();
    expect(args).toEqual(["git", "diff", "main"]);
  });

  it("should pass through a range directly", () => {
    const args = buildDiffArgs("HEAD~2..HEAD~1");
    expect(args).toEqual(["git", "diff", "HEAD~2..HEAD~1"]);
  });

  it("should pass through a simple ref", () => {
    const args = buildDiffArgs("main");
    expect(args).toEqual(["git", "diff", "main"]);
  });
});
