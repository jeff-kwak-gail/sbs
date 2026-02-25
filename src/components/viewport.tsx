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
  // -3: left │ (1) + right │ (1) + 1 to match file-box-top (icon ▶/▼ is double-width)
  const interiorWidth = width - 3;
  const interiorHalfWidth = Math.floor((interiorWidth - 1) / 2); // -1 for center separator

  return (
    <Box flexDirection="column" height={height}>
      {visible.map((row, i) => {
        const key = scrollOffset + i;
        switch (row.kind) {
          case "summary":
            return (
              <Summary
                key={key}
                totalFiles={row.totalFiles}
                additions={row.additions}
                deletions={row.deletions}
              />
            );
          case "file-box-top":
            return (
              <FileBoxTop
                key={key}
                file={row.file}
                collapsed={collapsedFiles.has(row.fileIndex)}
                width={width}
              />
            );
          case "file-box-bottom":
            return <FileBoxBottom key={key} width={width} />;
          case "hunk-header":
            return (
              <InteriorRow key={key} innerWidth={interiorWidth}>
                <HunkHeader content={row.content} width={interiorWidth} />
              </InteriorRow>
            );
          case "line-pair":
            return (
              <InteriorRow key={key} innerWidth={interiorWidth}>
                <LinePair row={row.row} halfWidth={interiorHalfWidth} />
              </InteriorRow>
            );
        }
      })}
    </Box>
  );
}
