import { describe, it, expect } from "vitest";
import { parsePatch } from "../src/parse.js";

const simpleDiff = `diff --git a/foo.txt b/foo.txt
index abc1234..def5678 100644
--- a/foo.txt
+++ b/foo.txt
@@ -1,3 +1,4 @@
 line1
-old line
+new line
+added line
 line3
`;

const multiFileDiff = `diff --git a/file1.ts b/file1.ts
index 1111111..2222222 100644
--- a/file1.ts
+++ b/file1.ts
@@ -1,2 +1,3 @@
 existing
+added in file1
 end
diff --git a/file2.ts b/file2.ts
index 3333333..4444444 100644
--- a/file2.ts
+++ b/file2.ts
@@ -1,3 +1,2 @@
 first
-removed in file2
 last
`;

const binaryDiff = `diff --git a/image.png b/image.png
index 0000000..1111111 100644
Binary files a/image.png and b/image.png differ
`;

describe("parsePatch", () => {
  describe("simple diff with one file and one hunk", () => {
    it("returns one file with correct metadata", () => {
      const result = parsePatch(simpleDiff);
      expect(result).toHaveLength(1);
      expect(result[0].from).toBe("foo.txt");
      expect(result[0].to).toBe("foo.txt");
      expect(result[0].additions).toBe(2);
      expect(result[0].deletions).toBe(1);
      expect(result[0].binary).toBe(false);
    });

    it("parses one chunk with correct header info", () => {
      const result = parsePatch(simpleDiff);
      const chunks = result[0].chunks;
      expect(chunks).toHaveLength(1);
      expect(chunks[0].content).toBe("@@ -1,3 +1,4 @@");
      expect(chunks[0].oldStart).toBe(1);
      expect(chunks[0].oldLines).toBe(3);
      expect(chunks[0].newStart).toBe(1);
      expect(chunks[0].newLines).toBe(4);
    });

    it("maps context lines with ln1 and ln2", () => {
      const result = parsePatch(simpleDiff);
      const changes = result[0].chunks[0].changes;

      // First line: context "line1"
      const contextLine = changes[0];
      expect(contextLine.type).toBe("normal");
      expect(contextLine.content).toBe(" line1");
      expect(contextLine.ln1).toBe(1);
      expect(contextLine.ln2).toBe(1);
    });

    it("maps del lines with ln", () => {
      const result = parsePatch(simpleDiff);
      const changes = result[0].chunks[0].changes;

      // Second line: del "old line"
      const delLine = changes[1];
      expect(delLine.type).toBe("del");
      expect(delLine.content).toBe("-old line");
      expect(delLine.ln).toBe(2);
      expect(delLine).not.toHaveProperty("ln1");
      expect(delLine).not.toHaveProperty("ln2");
    });

    it("maps add lines with ln", () => {
      const result = parsePatch(simpleDiff);
      const changes = result[0].chunks[0].changes;

      // Third line: add "new line"
      const addLine = changes[2];
      expect(addLine.type).toBe("add");
      expect(addLine.content).toBe("+new line");
      expect(addLine.ln).toBe(2);
      expect(addLine).not.toHaveProperty("ln1");
      expect(addLine).not.toHaveProperty("ln2");

      // Fourth line: add "added line"
      const addLine2 = changes[3];
      expect(addLine2.type).toBe("add");
      expect(addLine2.content).toBe("+added line");
      expect(addLine2.ln).toBe(3);
    });

    it("has the trailing context line correct", () => {
      const result = parsePatch(simpleDiff);
      const changes = result[0].chunks[0].changes;

      const lastLine = changes[4];
      expect(lastLine.type).toBe("normal");
      expect(lastLine.content).toBe(" line3");
      expect(lastLine.ln1).toBe(3);
      expect(lastLine.ln2).toBe(4);
    });

    it("has correct total number of changes", () => {
      const result = parsePatch(simpleDiff);
      const changes = result[0].chunks[0].changes;
      expect(changes).toHaveLength(5);
    });
  });

  describe("multi-file diff", () => {
    it("returns two files", () => {
      const result = parsePatch(multiFileDiff);
      expect(result).toHaveLength(2);
    });

    it("parses first file correctly", () => {
      const result = parsePatch(multiFileDiff);
      const file1 = result[0];
      expect(file1.from).toBe("file1.ts");
      expect(file1.to).toBe("file1.ts");
      expect(file1.additions).toBe(1);
      expect(file1.deletions).toBe(0);
      expect(file1.chunks).toHaveLength(1);
      expect(file1.chunks[0].changes).toHaveLength(3);
    });

    it("parses second file correctly", () => {
      const result = parsePatch(multiFileDiff);
      const file2 = result[1];
      expect(file2.from).toBe("file2.ts");
      expect(file2.to).toBe("file2.ts");
      expect(file2.additions).toBe(0);
      expect(file2.deletions).toBe(1);
      expect(file2.chunks).toHaveLength(1);
      expect(file2.chunks[0].changes).toHaveLength(3);
    });
  });

  describe("empty diff", () => {
    it("returns empty array for empty string", () => {
      const result = parsePatch("");
      expect(result).toEqual([]);
    });
  });

  describe("binary file detection", () => {
    it("detects binary files", () => {
      const result = parsePatch(binaryDiff);
      expect(result).toHaveLength(1);
      expect(result[0].binary).toBe(true);
    });

    it("has no chunks for binary files", () => {
      const result = parsePatch(binaryDiff);
      expect(result[0].chunks).toHaveLength(0);
    });

    it("has zero additions and deletions for binary files", () => {
      const result = parsePatch(binaryDiff);
      expect(result[0].additions).toBe(0);
      expect(result[0].deletions).toBe(0);
    });
  });
});
