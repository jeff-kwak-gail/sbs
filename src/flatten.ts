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
 * @param closedFiles - Set of file indices that are fully hidden
 */
export function flatten(
  files: ProcessedFile[],
  collapsedFiles: Set<number> = new Set(),
  closedFiles: Set<number> = new Set(),
): FlatRow[] {
  const rows: FlatRow[] = [];

  let totalAdditions = 0;
  let totalDeletions = 0;
  let visibleFileCount = 0;
  for (let i = 0; i < files.length; i++) {
    if (closedFiles.has(i)) continue;
    totalAdditions += files[i].additions;
    totalDeletions += files[i].deletions;
    visibleFileCount++;
  }

  rows.push({
    kind: "summary",
    totalFiles: visibleFileCount,
    additions: totalAdditions,
    deletions: totalDeletions,
  });

  for (let i = 0; i < files.length; i++) {
    if (closedFiles.has(i)) continue;
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
