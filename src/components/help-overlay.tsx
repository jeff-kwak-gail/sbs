import React from "react";
import { Box, Text } from "ink";

interface HelpOverlayProps {
  width: number;
  height: number;
}

const HELP_ENTRIES: [string, string][] = [
  ["j / \u2193", "Scroll down"],
  ["k / \u2191", "Scroll up"],
  ["d / PgDn", "Half-page down"],
  ["u / PgUp", "Half-page up"],
  ["g", "Jump to top"],
  ["G", "Jump to bottom"],
  ["n", "Next file"],
  ["p", "Previous file"],
  ["Enter / o", "Toggle collapse"],
  ["c", "Close file"],
  ["r", "Reload diff"],
  ["h", "Show help"],
  ["q", "Quit"],
];

export function HelpOverlay({ width, height }: HelpOverlayProps) {
  return (
    <Box
      width={width}
      height={height}
      alignItems="center"
      justifyContent="center"
    >
      <Box
        flexDirection="column"
        borderStyle="round"
        borderColor="blue"
        paddingX={2}
        paddingY={1}
      >
        <Box justifyContent="center" marginBottom={1}>
          <Text bold>Keyboard Shortcuts</Text>
        </Box>
        {HELP_ENTRIES.map(([key, desc]) => (
          <Box key={key}>
            <Box width={14}>
              <Text bold color="yellow">
                {key}
              </Text>
            </Box>
            <Text>{desc}</Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
