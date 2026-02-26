import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Box, Text, useApp } from "ink";
import type { FlatRow, ProcessedFile, ViewMode } from "./types.js";
import { execDiff, type ExecDiffOpts } from "./git.js";
import { parsePatch } from "./parse.js";
import { flatten } from "./flatten.js";
import { Viewport } from "./components/viewport.js";
import { HelpOverlay } from "./components/help-overlay.js";
import { useNavigation } from "./hooks/use-navigation.js";
import { useTerminalSize } from "./hooks/use-terminal-size.js";

function currentFileName(rows: FlatRow[], scrollOffset: number): string | null {
  for (let i = Math.min(scrollOffset, rows.length - 1); i >= 0; i--) {
    const row = rows[i];
    if (row?.kind === "file-box-top") {
      const f = row.file;
      return f.from === "/dev/null"
        ? f.to
        : f.from === f.to
          ? f.to
          : `${f.from} \u2192 ${f.to}`;
    }
  }
  // If no file found above, look forward (e.g. scrolled to the summary row)
  for (let i = scrollOffset + 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.kind === "file-box-top") {
      const f = row.file;
      return f.from === "/dev/null"
        ? f.to
        : f.from === f.to
          ? f.to
          : `${f.from} \u2192 ${f.to}`;
    }
  }
  return null;
}

interface AppProps {
  files: ProcessedFile[];
  range?: string;
  diffOpts?: ExecDiffOpts;
}

export function App({ files: initialFiles, range, diffOpts }: AppProps) {
  const { exit } = useApp();
  const [termWidth, termHeight] = useTerminalSize();

  const width = termWidth;
  const height = termHeight - 1; // reserve 1 row for status

  const [files, setFiles] = useState(initialFiles);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [collapsedFiles, setCollapsedFiles] = useState<Set<number>>(new Set());
  const [closedFiles, setClosedFiles] = useState<Set<number>>(new Set());
  const [showHelp, setShowHelp] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("both");

  const reload = useCallback(() => {
    try {
      const raw = execDiff(range, diffOpts);
      if (!raw.trim()) return;
      const newFiles = parsePatch(raw);
      if (newFiles.length > 0) {
        setFiles(newFiles);
        setClosedFiles(new Set());
      }
    } catch {
      // If reload fails, keep current state
    }
  }, [range, diffOpts]);

  const rows = useMemo(
    () => flatten(files, collapsedFiles, closedFiles),
    [files, collapsedFiles, closedFiles],
  );

  const handleCloseFile = useCallback((fileIndex: number) => {
    setClosedFiles((prev) => {
      const next = new Set(prev);
      next.add(fileIndex);
      return next;
    });
  }, []);

  useEffect(() => {
    const maxOffset = Math.max(0, rows.length - height);
    setScrollOffset((prev) => Math.min(prev, maxOffset));
  }, [rows.length, height]);

  useNavigation({
    rows,
    scrollOffset,
    setScrollOffset,
    collapsedFiles,
    setCollapsedFiles,
    height,
    showHelp,
    setShowHelp,
    onQuit: exit,
    onReload: reload,
    onCloseFile: handleCloseFile,
    viewMode,
    setViewMode,
  });

  const fileName = currentFileName(rows, scrollOffset);

  return (
    <Box flexDirection="column">
      {showHelp ? (
        <HelpOverlay width={width} height={height} />
      ) : (
        <Viewport
          rows={rows}
          scrollOffset={scrollOffset}
          height={height}
          width={width}
          collapsedFiles={collapsedFiles}
          viewMode={viewMode}
        />
      )}
      {fileName && (
        <Box>
          <Text dimColor>{fileName}</Text>
        </Box>
      )}
    </Box>
  );
}
