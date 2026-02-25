import React from "react";
import { Box, Text } from "ink";
import type { AlignedRow } from "../types.js";

interface LinePairProps {
  row: AlignedRow;
  halfWidth: number;
}

/** Pad or truncate a string to exactly `width` characters */
function fitTo(str: string, width: number): string {
  if (str.length >= width) return str.slice(0, width);
  return str + " ".repeat(width - str.length);
}

/** Strip the leading +/- / space from diff content */
function stripPrefix(content: string): string {
  return content.slice(1);
}

export function LinePair({ row, halfWidth }: LinePairProps) {
  const gutterWidth = 6; // line number (5) + sign (1)
  const contentWidth = Math.max(halfWidth - gutterWidth - 1, 10); // -1 for separator

  const renderSide = (
    side: { lineNum: number; content: string } | null,
    type: "left" | "right",
  ) => {
    if (!side) {
      // Empty filler side
      return (
        <Box width={halfWidth}>
          <Text dimColor>{fitTo("", halfWidth)}</Text>
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
        <Box width={halfWidth}>
          <Text color="red">
            {lineNum} {sign} {fitted}
          </Text>
        </Box>
      );
    }
    if (isAdd) {
      return (
        <Box width={halfWidth}>
          <Text color="green">
            {lineNum} {sign} {fitted}
          </Text>
        </Box>
      );
    }
    // Context
    return (
      <Box width={halfWidth}>
        <Text>
          {lineNum} {sign} {fitted}
        </Text>
      </Box>
    );
  };

  return (
    <Box>
      {renderSide(row.left, "left")}
      <Text dimColor>{"│"}</Text>
      {renderSide(row.right, "right")}
    </Box>
  );
}
