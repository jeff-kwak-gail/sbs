import { describe, it, expect } from "vitest";
import { alignChunk } from "../src/align.js";
import type { Chunk, Change } from "../src/types.js";

/** Helper: build a minimal Chunk with the given changes. */
function mkChunk(changes: Change[]): Chunk {
  return {
    content: "@@ -1,1 +1,1 @@",
    oldStart: 1,
    oldLines: 1,
    newStart: 1,
    newLines: 1,
    changes,
  };
}

describe("alignChunk", () => {
  // ── 1. Context-only chunk ────────────────────────────────────────────
  it("emits context rows for all-normal lines", () => {
    const chunk = mkChunk([
      { type: "normal", content: " alpha", ln1: 1, ln2: 1 },
      { type: "normal", content: " beta", ln1: 2, ln2: 2 },
      { type: "normal", content: " gamma", ln1: 3, ln2: 3 },
    ]);

    const rows = alignChunk(chunk);

    expect(rows).toHaveLength(3);
    for (const row of rows) {
      expect(row.type).toBe("context");
      expect(row.left).not.toBeNull();
      expect(row.right).not.toBeNull();
    }

    expect(rows[0].left).toEqual({ lineNum: 1, content: " alpha" });
    expect(rows[0].right).toEqual({ lineNum: 1, content: " alpha" });
    expect(rows[1].left).toEqual({ lineNum: 2, content: " beta" });
    expect(rows[1].right).toEqual({ lineNum: 2, content: " beta" });
    expect(rows[2].left).toEqual({ lineNum: 3, content: " gamma" });
    expect(rows[2].right).toEqual({ lineNum: 3, content: " gamma" });
  });

  // ── 2. Pure deletions ───────────────────────────────────────────────
  it("emits change rows with right=null for pure deletions", () => {
    const chunk = mkChunk([
      { type: "del", content: "-one", ln: 10 },
      { type: "del", content: "-two", ln: 11 },
    ]);

    const rows = alignChunk(chunk);

    expect(rows).toHaveLength(2);

    expect(rows[0].type).toBe("change");
    expect(rows[0].left).toEqual({ lineNum: 10, content: "-one" });
    expect(rows[0].right).toBeNull();

    expect(rows[1].type).toBe("change");
    expect(rows[1].left).toEqual({ lineNum: 11, content: "-two" });
    expect(rows[1].right).toBeNull();
  });

  // ── 3. Pure additions ───────────────────────────────────────────────
  it("emits change rows with left=null for pure additions", () => {
    const chunk = mkChunk([
      { type: "add", content: "+aaa", ln: 5 },
      { type: "add", content: "+bbb", ln: 6 },
      { type: "add", content: "+ccc", ln: 7 },
    ]);

    const rows = alignChunk(chunk);

    expect(rows).toHaveLength(3);

    for (const row of rows) {
      expect(row.type).toBe("change");
      expect(row.left).toBeNull();
    }

    expect(rows[0].right).toEqual({ lineNum: 5, content: "+aaa" });
    expect(rows[1].right).toEqual({ lineNum: 6, content: "+bbb" });
    expect(rows[2].right).toEqual({ lineNum: 7, content: "+ccc" });
  });

  // ── 4. Equal del/add count ──────────────────────────────────────────
  it("pairs dels and adds 1:1 when counts are equal", () => {
    const chunk = mkChunk([
      { type: "del", content: "-old1", ln: 1 },
      { type: "del", content: "-old2", ln: 2 },
      { type: "add", content: "+new1", ln: 1 },
      { type: "add", content: "+new2", ln: 2 },
    ]);

    const rows = alignChunk(chunk);

    expect(rows).toHaveLength(2);

    expect(rows[0]).toEqual({
      type: "change",
      left: { lineNum: 1, content: "-old1" },
      right: { lineNum: 1, content: "+new1" },
    });
    expect(rows[1]).toEqual({
      type: "change",
      left: { lineNum: 2, content: "-old2" },
      right: { lineNum: 2, content: "+new2" },
    });
  });

  // ── 5. More dels than adds ──────────────────────────────────────────
  it("fills right with null when there are more dels than adds", () => {
    const chunk = mkChunk([
      { type: "del", content: "-d1", ln: 4 },
      { type: "del", content: "-d2", ln: 5 },
      { type: "del", content: "-d3", ln: 6 },
      { type: "add", content: "+a1", ln: 4 },
      { type: "add", content: "+a2", ln: 5 },
    ]);

    const rows = alignChunk(chunk);

    expect(rows).toHaveLength(3);

    expect(rows[0]).toEqual({
      type: "change",
      left: { lineNum: 4, content: "-d1" },
      right: { lineNum: 4, content: "+a1" },
    });
    expect(rows[1]).toEqual({
      type: "change",
      left: { lineNum: 5, content: "-d2" },
      right: { lineNum: 5, content: "+a2" },
    });
    expect(rows[2]).toEqual({
      type: "change",
      left: { lineNum: 6, content: "-d3" },
      right: null,
    });
  });

  // ── 6. More adds than dels ──────────────────────────────────────────
  it("fills left with null when there are more adds than dels", () => {
    const chunk = mkChunk([
      { type: "del", content: "-x", ln: 20 },
      { type: "add", content: "+y1", ln: 20 },
      { type: "add", content: "+y2", ln: 21 },
      { type: "add", content: "+y3", ln: 22 },
    ]);

    const rows = alignChunk(chunk);

    expect(rows).toHaveLength(3);

    expect(rows[0]).toEqual({
      type: "change",
      left: { lineNum: 20, content: "-x" },
      right: { lineNum: 20, content: "+y1" },
    });
    expect(rows[1]).toEqual({
      type: "change",
      left: null,
      right: { lineNum: 21, content: "+y2" },
    });
    expect(rows[2]).toEqual({
      type: "change",
      left: null,
      right: { lineNum: 22, content: "+y3" },
    });
  });

  // ── 7. Complex: context → changes → context → changes ──────────────
  it("handles interleaved context and change blocks", () => {
    const chunk = mkChunk([
      // First context line
      { type: "normal", content: " ctx1", ln1: 1, ln2: 1 },
      // First change block: 2 dels, 1 add
      { type: "del", content: "-old1", ln: 2 },
      { type: "del", content: "-old2", ln: 3 },
      { type: "add", content: "+new1", ln: 2 },
      // Second context line
      { type: "normal", content: " ctx2", ln1: 4, ln2: 3 },
      // Second change block: 1 del, 2 adds
      { type: "del", content: "-removed", ln: 5 },
      { type: "add", content: "+added1", ln: 4 },
      { type: "add", content: "+added2", ln: 5 },
    ]);

    const rows = alignChunk(chunk);

    expect(rows).toHaveLength(6);

    // ctx1
    expect(rows[0]).toEqual({
      type: "context",
      left: { lineNum: 1, content: " ctx1" },
      right: { lineNum: 1, content: " ctx1" },
    });

    // First change block row 1: del paired with add
    expect(rows[1]).toEqual({
      type: "change",
      left: { lineNum: 2, content: "-old1" },
      right: { lineNum: 2, content: "+new1" },
    });
    // First change block row 2: del with no matching add
    expect(rows[2]).toEqual({
      type: "change",
      left: { lineNum: 3, content: "-old2" },
      right: null,
    });

    // ctx2
    expect(rows[3]).toEqual({
      type: "context",
      left: { lineNum: 4, content: " ctx2" },
      right: { lineNum: 3, content: " ctx2" },
    });

    // Second change block row 1: del paired with first add
    expect(rows[4]).toEqual({
      type: "change",
      left: { lineNum: 5, content: "-removed" },
      right: { lineNum: 4, content: "+added1" },
    });
    // Second change block row 2: no del, second add
    expect(rows[5]).toEqual({
      type: "change",
      left: null,
      right: { lineNum: 5, content: "+added2" },
    });
  });

  // ── Edge: empty chunk ───────────────────────────────────────────────
  it("returns an empty array for a chunk with no changes", () => {
    const chunk = mkChunk([]);
    expect(alignChunk(chunk)).toEqual([]);
  });

  // ── Edge: single del ────────────────────────────────────────────────
  it("handles a single deletion", () => {
    const chunk = mkChunk([{ type: "del", content: "-only", ln: 42 }]);
    const rows = alignChunk(chunk);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({
      type: "change",
      left: { lineNum: 42, content: "-only" },
      right: null,
    });
  });

  // ── Edge: single add ────────────────────────────────────────────────
  it("handles a single addition", () => {
    const chunk = mkChunk([{ type: "add", content: "+only", ln: 99 }]);
    const rows = alignChunk(chunk);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({
      type: "change",
      left: null,
      right: { lineNum: 99, content: "+only" },
    });
  });
});
