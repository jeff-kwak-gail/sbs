import { describe, it, expect } from "vitest";
import { flatten } from "../src/flatten.js";
import type { ProcessedFile } from "../src/types.js";

function makeFile(overrides: Partial<ProcessedFile> = {}): ProcessedFile {
  return {
    from: "a.txt",
    to: "a.txt",
    additions: 1,
    deletions: 1,
    binary: false,
    chunks: [
      {
        content: "@@ -1,3 +1,3 @@",
        oldStart: 1,
        oldLines: 3,
        newStart: 1,
        newLines: 3,
        changes: [
          { type: "normal", content: " ctx", ln1: 1, ln2: 1 },
          { type: "del", content: "-old", ln: 2 },
          { type: "add", content: "+new", ln: 2 },
          { type: "normal", content: " ctx", ln1: 3, ln2: 3 },
        ],
      },
    ],
    ...overrides,
  };
}

describe("flatten", () => {
  it("produces summary as first row", () => {
    const rows = flatten([makeFile()]);
    expect(rows[0]).toEqual({
      kind: "summary",
      totalFiles: 1,
      additions: 1,
      deletions: 1,
    });
  });

  it("produces file-box-top after summary", () => {
    const file = makeFile();
    const rows = flatten([file]);
    expect(rows[1]).toEqual({
      kind: "file-box-top",
      fileIndex: 0,
      file,
    });
  });

  it("produces hunk-header and line-pairs with file-box-bottom", () => {
    const rows = flatten([makeFile()]);
    // summary, file-box-top, hunk-header, 3 line-pairs, file-box-bottom
    expect(rows[2]).toEqual({ kind: "hunk-header", fileIndex: 0, content: "@@ -1,3 +1,3 @@" });
    expect(rows[3].kind).toBe("line-pair");
    expect(rows[4].kind).toBe("line-pair");
    expect(rows[5].kind).toBe("line-pair");
    expect(rows[6]).toEqual({ kind: "file-box-bottom", fileIndex: 0 });
    expect(rows).toHaveLength(7);
  });

  it("includes fileIndex on interior rows", () => {
    const rows = flatten([makeFile()]);
    const interiorRows = rows.filter(r => r.kind === "hunk-header" || r.kind === "line-pair");
    for (const row of interiorRows) {
      expect((row as { fileIndex: number }).fileIndex).toBe(0);
    }
  });

  it("aggregates totals across multiple files", () => {
    const f1 = makeFile({ from: "a.txt", to: "a.txt", additions: 3, deletions: 1 });
    const f2 = makeFile({ from: "b.txt", to: "b.txt", additions: 2, deletions: 5 });
    const rows = flatten([f1, f2]);
    expect(rows[0]).toEqual({
      kind: "summary",
      totalFiles: 2,
      additions: 5,
      deletions: 6,
    });
  });

  it("collapses files when in collapsedFiles set", () => {
    const rows = flatten([makeFile()], new Set([0]));
    // summary + file-box-top + file-box-bottom only
    expect(rows).toHaveLength(3);
    expect(rows[0].kind).toBe("summary");
    expect(rows[1].kind).toBe("file-box-top");
    expect(rows[2].kind).toBe("file-box-bottom");
  });

  it("skips hunk content for binary files", () => {
    const file = makeFile({ binary: true });
    const rows = flatten([file]);
    // summary + file-box-top + file-box-bottom
    expect(rows).toHaveLength(3);
  });

  it("handles empty file list", () => {
    const rows = flatten([]);
    expect(rows).toEqual([
      { kind: "summary", totalFiles: 0, additions: 0, deletions: 0 },
    ]);
  });

  it("handles multiple files with second collapsed", () => {
    const f1 = makeFile({ from: "a.txt", to: "a.txt" });
    const f2 = makeFile({ from: "b.txt", to: "b.txt" });
    const rows = flatten([f1, f2], new Set([1]));

    // f1: summary(1) + file-box-top(1) + hunk-header(1) + 3 line-pairs + file-box-bottom(1) = 7
    // f2: file-box-top(1) + file-box-bottom(1) = 2
    expect(rows).toHaveLength(9);
    expect(rows[7]).toEqual({ kind: "file-box-top", fileIndex: 1, file: f2 });
    expect(rows[8]).toEqual({ kind: "file-box-bottom", fileIndex: 1 });
  });
});
