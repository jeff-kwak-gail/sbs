import React from "react";
import { Box, Text } from "ink";

export const VERSION = "0.6.0";

interface SummaryProps {
  totalFiles: number;
  additions: number;
  deletions: number;
}

export function Summary({ totalFiles, additions, deletions }: SummaryProps) {
  return (
    <Box>
      <Text bold>Side-by-Side (sbs v{VERSION}) </Text>
      <Text dimColor>q - quit, h - help  </Text>
      <Text bold>
        {totalFiles} file{totalFiles !== 1 ? "s" : ""} with{" "}
      </Text>
      <Text bold color="green">
        {additions} addition{additions !== 1 ? "s" : ""}
      </Text>
      <Text bold> and </Text>
      <Text bold color="red">
        {deletions} deletion{deletions !== 1 ? "s" : ""}
      </Text>
    </Box>
  );
}
