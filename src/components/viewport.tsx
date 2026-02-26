import React from "react";
import { Box, Text } from "ink";
import type { FlatRow } from "../types.js";
import { Summary } from "./summary.js";
import { FileBoxTop } from "./file-box-top.js";
import { FileBoxBottom } from "./file-box-bottom.js";
import { HunkHeader } from "./hunk-header.js";
import { LinePair } from "./line-pair.js";

interface ViewportProps {
  rows: FlatRow[];
  scrollOffset: number;
  height: number;
  width: number;
  collapsedFiles: Set<number>;
}

function InteriorRow({ children, innerWidth }: { children: React.ReactNode; innerWidth: number }) {
  return (
    <Box>
      <Text color="blue">{"\u2502"}</Text>
      <Box width={innerWidth}>{children}</Box>
      <Text color="blue">{"\u2502"}</Text>
    </Box>
  );
}

export function Viewport({ rows, scrollOffset, height, width, collapsedFiles }: ViewportProps) {
  const visible = rows.slice(scrollOffset, scrollOffset + height);
  const totalRows = rows.length;
  const needsScrollbar = totalRows > height;

  const contentWidth = needsScrollbar ? width - 1 : width;
  // -3: left │ (1) + right │ (1) + 1 to match file-box-top (icon ▶/▼ is double-width)
  const interiorWidth = contentWidth - 3;
  const interiorHalfWidth = Math.floor((interiorWidth - 1) / 2); // -1 for center separator

  const thumbSize = Math.max(1, Math.round(height * height / totalRows));
  const thumbStart = totalRows - height > 0
    ? Math.round(scrollOffset / (totalRows - height) * (height - thumbSize))
    : 0;

  function scrollbarChar(i: number): React.ReactNode {
    const isThumb = i >= thumbStart && i < thumbStart + thumbSize;
    return <Text dimColor={!isThumb}>{isThumb ? "█" : "│"}</Text>;
  }

  return (
    <Box flexDirection="column" height={height}>
      {visible.map((row, i) => {
        const key = scrollOffset + i;
        let content: React.ReactNode;
        switch (row.kind) {
          case "summary":
            content = (
              <Summary
                key={key}
                totalFiles={row.totalFiles}
                additions={row.additions}
                deletions={row.deletions}
              />
            );
            break;
          case "file-box-top":
            content = (
              <FileBoxTop
                key={key}
                file={row.file}
                collapsed={collapsedFiles.has(row.fileIndex)}
                width={contentWidth}
              />
            );
            break;
          case "file-box-bottom":
            content = <FileBoxBottom key={key} width={contentWidth} />;
            break;
          case "hunk-header":
            content = (
              <InteriorRow key={key} innerWidth={interiorWidth}>
                <HunkHeader content={row.content} width={interiorWidth} />
              </InteriorRow>
            );
            break;
          case "line-pair":
            content = (
              <InteriorRow key={key} innerWidth={interiorWidth}>
                <LinePair row={row.row} halfWidth={interiorHalfWidth} />
              </InteriorRow>
            );
            break;
        }

        if (!needsScrollbar) {
          return content;
        }

        return (
          <Box key={key}>
            <Box width={contentWidth}>{content}</Box>
            {scrollbarChar(i)}
          </Box>
        );
      })}
    </Box>
  );
}
