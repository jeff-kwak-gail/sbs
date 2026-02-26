import { describe, it, expect } from "vitest";
import { cycleViewModeRight, cycleViewModeLeft, computeMaxOffset } from "../src/hooks/use-navigation.js";
import type { ViewMode, FlatRow } from "../src/types.js";

describe("cycleViewModeRight ([ key)", () => {
  it("cycles left → both", () => {
    expect(cycleViewModeRight("left")).toBe("both");
  });

  it("cycles both → right", () => {
    expect(cycleViewModeRight("both")).toBe("right");
  });

  it("no-ops at right", () => {
    expect(cycleViewModeRight("right")).toBe("right");
  });

  it("full cycle from left reaches right in two steps", () => {
    let mode: ViewMode = "left";
    mode = cycleViewModeRight(mode);
    mode = cycleViewModeRight(mode);
    expect(mode).toBe("right");
  });
});

describe("cycleViewModeLeft (] key)", () => {
  it("cycles right → both", () => {
    expect(cycleViewModeLeft("right")).toBe("both");
  });

  it("cycles both → left", () => {
    expect(cycleViewModeLeft("both")).toBe("left");
  });

  it("no-ops at left", () => {
    expect(cycleViewModeLeft("left")).toBe("left");
  });

  it("full cycle from right reaches left in two steps", () => {
    let mode: ViewMode = "right";
    mode = cycleViewModeLeft(mode);
    mode = cycleViewModeLeft(mode);
    expect(mode).toBe("left");
  });
});

describe("round-trip cycling", () => {
  it("[ then ] returns to original state", () => {
    let mode: ViewMode = "both";
    mode = cycleViewModeRight(mode); // both → right
    mode = cycleViewModeLeft(mode);  // right → both
    expect(mode).toBe("both");
  });

  it("] then [ returns to original state", () => {
    let mode: ViewMode = "both";
    mode = cycleViewModeLeft(mode);  // both → left
    mode = cycleViewModeRight(mode); // left → both
    expect(mode).toBe("both");
  });
});

describe("computeMaxOffset", () => {
  // Helper to build a minimal row list
  function mkRows(...kinds: FlatRow["kind"][]): Pick<FlatRow, "kind">[] {
    return kinds.map((kind) => ({ kind }));
  }

  it("returns rows.length - height when content is longer than viewport", () => {
    // 10 rows, viewport height 4, no file-box-top after index 2
    const rows = mkRows(
      "summary", "file-box-top", "hunk-header",
      "line-pair", "line-pair", "line-pair",
      "line-pair", "line-pair", "line-pair", "file-box-bottom",
    );
    // rows.length - height = 10 - 4 = 6, lastFileRow = 1 → max(0, 6, 1) = 6
    expect(computeMaxOffset(rows, 4)).toBe(6);
  });

  it("extends past rows.length - height to reach the last file header", () => {
    // Last file header is near the end — must be reachable
    const rows = mkRows(
      "summary",
      "file-box-top", "hunk-header", "line-pair", "file-box-bottom",
      "file-box-top", "hunk-header", "line-pair", "file-box-bottom",
    );
    // 9 rows, height 10 → rows.length - height = -1 → 0
    // lastFileRow = 5 → max(0, 0, 5) = 5
    expect(computeMaxOffset(rows, 10)).toBe(5);
  });

  it("does not allow scrolling past the last file header", () => {
    // With a large viewport, offset should be the last file-box-top index, not rows.length - 1
    const rows = mkRows(
      "summary",
      "file-box-top", "hunk-header", "line-pair", "file-box-bottom",
    );
    // 5 rows, height 20 → rows.length - height = -15 → 0
    // lastFileRow = 1 → max(0, 0, 1) = 1
    expect(computeMaxOffset(rows, 20)).toBe(1);
  });

  it("returns 0 for empty rows", () => {
    expect(computeMaxOffset([], 10)).toBe(0);
  });

  it("returns 0 when rows fit within viewport and no file headers", () => {
    const rows = mkRows("summary");
    expect(computeMaxOffset(rows, 10)).toBe(0);
  });
});
