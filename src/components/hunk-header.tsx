import React from "react";
import { Box, Text } from "ink";

interface HunkHeaderProps {
  content: string;
  width: number;
}

export function HunkHeader({ content, width }: HunkHeaderProps) {
  const text = content.length >= width ? content.slice(0, width) : content + " ".repeat(width - content.length);
  return (
    <Box>
      <Text color="cyan" dimColor>{text}</Text>
    </Box>
  );
}
