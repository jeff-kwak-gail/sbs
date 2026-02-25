import { useInput } from "ink";
import { useRef, useEffect } from "react";
import type { FlatRow } from "../types.js";

interface UseNavigationOptions {
  rows: FlatRow[];
  scrollOffset: number;
  setScrollOffset: (offset: number | ((prev: number) => number)) => void;
  collapsedFiles: Set<number>;
  setCollapsedFiles: (files: Set<number> | ((prev: Set<number>) => Set<number>)) => void;
  height: number;
  showHelp: boolean;
  setShowHelp: (show: boolean) => void;
  onQuit: () => void;
  onReload: () => void;
}

export function useNavigation({
  rows,
  scrollOffset,
  setScrollOffset,
  collapsedFiles,
  setCollapsedFiles,
  height,
  showHelp,
  setShowHelp,
  onQuit,
  onReload,
}: UseNavigationOptions) {
  const maxOffset = Math.max(0, rows.length - height);

  const clamp = (n: number) => Math.max(0, Math.min(n, maxOffset));

  const helpTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedScrollRef = useRef<Map<number, number>>(new Map());

  useEffect(() => {
    return () => {
      if (helpTimerRef.current) clearTimeout(helpTimerRef.current);
    };
  }, []);

  /** Find the file index of the row at the current scroll offset */
  function currentFileIndex(): number {
    for (let i = scrollOffset; i >= 0; i--) {
      const row = rows[i];
      if (row && row.kind === "file-box-top") return row.fileIndex;
    }
    return 0;
  }

  /** Find the row index of a given file-box-top by fileIndex */
  function findFileRow(fileIndex: number): number {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.kind === "file-box-top" && row.fileIndex === fileIndex) return i;
    }
    return 0;
  }

  /** Count total files in the row list */
  function totalFiles(): number {
    let count = 0;
    for (const row of rows) {
      if (row.kind === "file-box-top") count++;
    }
    return count;
  }

  useInput((input, key) => {
    // Help overlay (hold h)
    // Use a longer timeout on first press to survive the initial key-repeat
    // delay (400-600ms depending on OS), then a shorter one once repeats are flowing.
    if (input.toLowerCase() === "h") {
      const delay = showHelp ? 200 : 600;
      setShowHelp(true);
      if (helpTimerRef.current) clearTimeout(helpTimerRef.current);
      helpTimerRef.current = setTimeout(() => {
        setShowHelp(false);
        helpTimerRef.current = null;
      }, delay);
      return;
    }

    // Block all other input while help is visible
    if (showHelp) return;

    // Quit
    if (input === "q") {
      onQuit();
      return;
    }

    // Reload diff
    if (input === "r") {
      onReload();
      return;
    }

    // Scroll down
    if (input === "j" || key.downArrow) {
      setScrollOffset((prev) => clamp(prev + 1));
      return;
    }

    // Scroll up
    if (input === "k" || key.upArrow) {
      setScrollOffset((prev) => clamp(prev - 1));
      return;
    }

    // Half-page down
    if (input === "d" || key.pageDown) {
      setScrollOffset((prev) => clamp(prev + Math.floor(height / 2)));
      return;
    }

    // Half-page up
    if (input === "u" || key.pageUp) {
      setScrollOffset((prev) => clamp(prev - Math.floor(height / 2)));
      return;
    }

    // Jump to top
    if (input === "g" && !key.shift) {
      setScrollOffset(0);
      return;
    }

    // Jump to bottom
    if (input === "G") {
      setScrollOffset(maxOffset);
      return;
    }

    // Next file
    if (input === "n") {
      const cur = currentFileIndex();
      const total = totalFiles();
      if (cur < total - 1) {
        setScrollOffset(clamp(findFileRow(cur + 1)));
      }
      return;
    }

    // Previous file
    if (input === "p") {
      const cur = currentFileIndex();
      if (cur > 0) {
        setScrollOffset(clamp(findFileRow(cur - 1)));
      }
      return;
    }

    // Toggle collapse — works from any row by resolving the current file
    if (key.return || input === "o") {
      const idx = currentFileIndex();
      const isCollapsing = !collapsedFiles.has(idx);
      setCollapsedFiles((prev) => {
        const next = new Set(prev);
        if (next.has(idx)) {
          next.delete(idx);
        } else {
          next.add(idx);
        }
        return next;
      });
      if (isCollapsing) {
        // Save scroll position and jump to the file-box-top
        savedScrollRef.current.set(idx, scrollOffset);
        setScrollOffset(clamp(findFileRow(idx)));
      } else {
        // Restore saved scroll position
        const saved = savedScrollRef.current.get(idx);
        if (saved !== undefined) {
          setScrollOffset(clamp(saved));
          savedScrollRef.current.delete(idx);
        }
      }
      return;
    }
  });
}
