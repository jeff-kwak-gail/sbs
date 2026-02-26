import React from "react";
import { Box, Text } from "ink";

interface HunkHeaderProps {
  content: string;
  width: number;
}

export function HunkHeader({ content, width }: HunkHeaderProps) {
  const expanded = content.replace(/\t/g, "    ");
  const text = expanded.length >= width ? expanded.slice(0, width) : expanded + " ".repeat(width - expanded.length);
  return (
    <Box>
      <Text color="cyan" dimColor>{text}</Text>
    </Box>
  );
}
