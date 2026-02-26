import React from "react";
import { Box, Text } from "ink";
import type { AlignedRow, ViewMode } from "../types.js";

interface LinePairProps {
  row: AlignedRow;
  halfWidth: number;
  viewMode: ViewMode;
  fullWidth: number;
}

/** Expand tab characters to spaces so display width matches string length */
function expandTabs(str: string, tabWidth = 4): string {
  return str.replace(/\t/g, " ".repeat(tabWidth));
}

/** Pad or truncate a string to exactly `width` visible columns */
function fitTo(str: string, width: number): string {
  const expanded = expandTabs(str);
  if (expanded.length >= width) return expanded.slice(0, width);
  return expanded + " ".repeat(width - expanded.length);
}

/** Strip the leading +/- / space from diff content */
function stripPrefix(content: string): string {
  return content.slice(1);
}

export function LinePair({ row, halfWidth, viewMode, fullWidth }: LinePairProps) {
  const sideWidth = viewMode === "both" ? halfWidth : fullWidth - 1; // -1 for bar/separator
  const gutterWidth = 6; // line number (5) + sign (1)
  const contentWidth = Math.max(sideWidth - gutterWidth - 1, 10); // -1 for separator

  const renderSide = (
    side: { lineNum: number; content: string } | null,
    type: "left" | "right",
  ) => {
    if (!side) {
      // Empty filler side
      return (
        <Box width={sideWidth}>
          <Text dimColor>{fitTo("", sideWidth)}</Text>
        </Box>
      );
    }

    const lineNum = String(side.lineNum).padStart(4, " ");
    const text = stripPrefix(side.content);
    const fitted = fitTo(text, contentWidth);

    const isDel = row.type === "change" && type === "left";
    const isAdd = row.type === "change" && type === "right";
    const sign = isDel ? "-" : isAdd ? "+" : " ";

    if (isDel) {
      return (
        <Box width={sideWidth}>
          <Text color="red">
            {lineNum} {sign} {fitted}
          </Text>
        </Box>
      );
    }
    if (isAdd) {
      return (
        <Box width={sideWidth}>
          <Text color="green">
            {lineNum} {sign} {fitted}
          </Text>
        </Box>
      );
    }
    // Context
    return (
      <Box width={sideWidth}>
        <Text>
          {lineNum} {sign} {fitted}
        </Text>
      </Box>
    );
  };

  if (viewMode === "left") {
    return (
      <Box>
        {renderSide(row.left, "left")}
        <Text color="blue">{"\u2590"}</Text>
      </Box>
    );
  }

  if (viewMode === "right") {
    return (
      <Box>
        <Text color="blue">{"\u258C"}</Text>
        {renderSide(row.right, "right")}
      </Box>
    );
  }

  return (
    <Box>
      {renderSide(row.left, "left")}
      <Text dimColor>{"\u2502"}</Text>
      {renderSide(row.right, "right")}
    </Box>
  );
}
