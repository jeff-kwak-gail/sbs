import React from "react";
import { Box, Text } from "ink";
import type { ProcessedFile } from "../types.js";

interface FileBoxTopProps {
  file: ProcessedFile;
  collapsed: boolean;
  width: number;
}

export function FileBoxTop({ file, collapsed, width }: FileBoxTopProps) {
  const icon = collapsed ? "\u25b6" : "\u25bc"; // ▶ or ▼
  const name =
    file.from === "/dev/null"
      ? file.to
      : file.from === file.to
        ? file.to
        : `${file.from} \u2192 ${file.to}`;

  const stats = `+${file.additions} -${file.deletions}`;

  // ╭─ ▼ filename ─────── +N -M ─╮
  const prefix = `\u256d\u2500 ${icon} `;
  const suffix = ` ${stats} \u2500\u256e`;
  const availableForName = width - prefix.length - suffix.length - 2; // -2 for ─ padding around name

  const displayName =
    name.length > availableForName && availableForName > 3
      ? name.slice(0, availableForName - 1) + "\u2026"
      : name;

  const afterName = ` ${displayName} `;
  // icon (▶/▼) renders as 2 cells in the terminal but .length counts it as 1
  const iconExtraWidth = 1;
  const fillLen = Math.max(0, width - prefix.length - afterName.length - suffix.length - iconExtraWidth);
  const fill = "\u2500".repeat(fillLen);

  const line = `${prefix}${afterName}${fill}${suffix}`;

  return (
    <Box>
      <Text bold color="blue">
        {line}
      </Text>
    </Box>
  );
}
