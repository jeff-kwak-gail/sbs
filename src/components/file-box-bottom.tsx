import React from "react";
import { Box, Text } from "ink";

interface FileBoxBottomProps {
  width: number;
}

export function FileBoxBottom({ width }: FileBoxBottomProps) {
  // -3: ╰ (1) + ╯ (1) + 1 to match file-box-top (icon ▶/▼ is double-width)
  const inner = "\u2500".repeat(Math.max(0, width - 3));
  return (
    <Box>
      <Text color="blue">{`\u2570${inner}\u256f`}</Text>
    </Box>
  );
}
