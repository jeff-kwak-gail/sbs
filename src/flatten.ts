import type { AlignedRow, FlatRow, ProcessedFile } from "./types.js";
import { alignChunk } from "./align.js";

/**
 * Convert ProcessedFile[] into a single flat list of FlatRow items
 * ready for viewport rendering.
 *
 * Order: summary → (file-header → hunk-header → line-pairs)* per file
 *
 * @param files - Parsed diff files
 * @param collapsedFiles - Set of file indices that are collapsed
 */
export function flatten(
  files: ProcessedFile[],
  collapsedFiles: Set<number> = new Set(),
): FlatRow[] {
  const rows: FlatRow[] = [];

  const totalAdditions = files.reduce((sum, f) => sum + f.additions, 0);
  const totalDeletions = files.reduce((sum, f) => sum + f.deletions, 0);

  rows.push({
    kind: "summary",
    totalFiles: files.length,
    additions: totalAdditions,
    deletions: totalDeletions,
  });

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    rows.push({ kind: "file-box-top", fileIndex: i, file });

    if (!collapsedFiles.has(i) && !file.binary) {
      for (const chunk of file.chunks) {
        rows.push({ kind: "hunk-header", fileIndex: i, content: chunk.content });

        const aligned: AlignedRow[] = alignChunk(chunk);
        for (const row of aligned) {
          rows.push({ kind: "line-pair", fileIndex: i, row });
        }
      }
    }

    rows.push({ kind: "file-box-bottom", fileIndex: i });
  }

  return rows;
}
