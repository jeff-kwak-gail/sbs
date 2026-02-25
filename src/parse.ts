import parseDiff from "parse-diff";
import type { ProcessedFile } from "./types.js";

/**
 * Build a set of file paths that appear in "Binary files ... differ" lines.
 * parse-diff does not set a `binary` flag, so we detect it ourselves.
 */
function detectBinaryPaths(raw: string): Set<string> {
  const paths = new Set<string>();
  const re = /^Binary files .+ and (?:[ab]\/)?(.*?) differ$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    paths.add(m[1]);
  }
  return paths;
}

/** Parse a raw unified diff string into ProcessedFile[] */
export function parsePatch(raw: string): ProcessedFile[] {
  const files = parseDiff(raw);
  const binaryPaths = detectBinaryPaths(raw);
  return files.map((file) => {
    const to = file.to ?? "/dev/null";
    const from = file.from ?? "/dev/null";
    const isBinary = binaryPaths.has(to) || binaryPaths.has(from);
    return {
      from,
      to,
      additions: file.additions,
      deletions: file.deletions,
      binary: isBinary,
      chunks: file.chunks.map((chunk) => ({
        content: chunk.content,
        oldStart: chunk.oldStart,
        oldLines: chunk.oldLines,
        newStart: chunk.newStart,
        newLines: chunk.newLines,
        changes: chunk.changes.map((change) => ({
          type: change.type as "normal" | "add" | "del",
          content: change.content,
          ...(change.type === "normal" ? { ln1: change.ln1, ln2: change.ln2 } : { ln: change.ln }),
        })),
      })),
    };
  });
}
