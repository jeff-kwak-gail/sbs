/** A single change line from parse-diff */
export interface Change {
  type: "normal" | "add" | "del";
  content: string;
  /** Line number on the old (left) side. Present for 'normal' and 'del'. */
  ln1?: number;
  /** Line number on the new (right) side. Present for 'normal' and 'add'. */
  ln2?: number;
  /** For 'normal' lines, old line number */
  ln?: number;
}

/** A hunk from parse-diff */
export interface Chunk {
  content: string; // @@ header
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  changes: Change[];
}

/** A processed file from parse-diff */
export interface ProcessedFile {
  from: string;
  to: string;
  additions: number;
  deletions: number;
  binary: boolean;
  chunks: Chunk[];
}

/** One side of an aligned row */
export interface AlignedSide {
  lineNum: number;
  content: string;
}

/** A single aligned row: left and right may be null for pure add/del */
export interface AlignedRow {
  type: "context" | "change";
  left: AlignedSide | null;
  right: AlignedSide | null;
}

/** Discriminated union for flat rows fed to the viewport */
export type FlatRow =
  | { kind: "summary"; totalFiles: number; additions: number; deletions: number }
  | { kind: "file-box-top"; fileIndex: number; file: ProcessedFile }
  | { kind: "file-box-bottom"; fileIndex: number }
  | { kind: "hunk-header"; fileIndex: number; content: string }
  | { kind: "line-pair"; fileIndex: number; row: AlignedRow };
