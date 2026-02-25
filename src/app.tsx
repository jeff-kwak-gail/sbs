import React, { useState, useMemo, useEffect } from "react";
import { Box, useApp } from "ink";
import type { ProcessedFile } from "./types.js";
import { flatten } from "./flatten.js";
import { Viewport } from "./components/viewport.js";
import { HelpOverlay } from "./components/help-overlay.js";
import { useNavigation } from "./hooks/use-navigation.js";
import { useTerminalSize } from "./hooks/use-terminal-size.js";

interface AppProps {
  files: ProcessedFile[];
}

export function App({ files }: AppProps) {
  const { exit } = useApp();
  const [termWidth, termHeight] = useTerminalSize();

  const width = termWidth;
  const height = termHeight - 1; // reserve 1 row for status

  const [scrollOffset, setScrollOffset] = useState(0);
  const [collapsedFiles, setCollapsedFiles] = useState<Set<number>>(new Set());
  const [showHelp, setShowHelp] = useState(false);

  const rows = useMemo(
    () => flatten(files, collapsedFiles),
    [files, collapsedFiles],
  );

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
  });

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
        />
      )}
    </Box>
  );
}
