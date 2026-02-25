import type { AlignedRow, Change, Chunk } from "./types.js";

/**
 * Convert a unified diff chunk into side-by-side aligned rows.
 *
 * Context lines map 1:1 to both sides. Consecutive del/add lines are
 * collected into change blocks and paired off; whichever side is shorter
 * gets null fillers.
 */
export function alignChunk(chunk: Chunk): AlignedRow[] {
  const rows: AlignedRow[] = [];

  let dels: Change[] = [];
  let adds: Change[] = [];

  function flushBlock(): void {
    const len = Math.max(dels.length, adds.length);
    for (let i = 0; i < len; i++) {
      const del = dels[i] ?? null;
      const add = adds[i] ?? null;
      rows.push({
        type: "change",
        left: del ? { lineNum: del.ln!, content: del.content } : null,
        right: add ? { lineNum: add.ln!, content: add.content } : null,
      });
    }
    dels = [];
    adds = [];
  }

  for (const change of chunk.changes) {
    if (change.type === "normal") {
      // Flush any pending change block before emitting context
      flushBlock();
      rows.push({
        type: "context",
        left: { lineNum: change.ln1!, content: change.content },
        right: { lineNum: change.ln2!, content: change.content },
      });
    } else if (change.type === "del") {
      adds.length === 0 ? dels.push(change) : (flushBlock(), dels.push(change));
    } else {
      // "add"
      adds.push(change);
    }
  }

  // Flush any trailing change block
  flushBlock();

  return rows;
}
