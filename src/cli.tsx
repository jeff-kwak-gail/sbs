import React from "react";
import { render } from "ink";
import meow from "meow";
import { execDiff } from "./git.js";
import { parsePatch } from "./parse.js";
import { App } from "./app.js";

const cli = meow(
  `
  Usage
    $ sbs [range]

  Arguments
    range    Git range expression (default: <default-branch>...HEAD)

  Options
    --no-untracked    Exclude untracked files from the diff

  Examples
    $ sbs
    $ sbs HEAD~2..HEAD~1
    $ sbs main..feature
    $ sbs --no-untracked
`,
  {
    importMeta: import.meta,
    flags: {
      noUntracked: {
        type: "boolean",
        default: false,
      },
    },
  },
);

// Enter alternate screen and ensure cursor is at home position
process.stdout.write("\x1b[?1049h\x1b[H");

// Ink's clearTerminal uses \x1b[3J (clear scrollback buffer) which can cause
// viewport shifts on some terminal emulators (e.g. Windows Terminal via WSL2/tmux).
// On the alternate screen there is no scrollback buffer, so strip it out.
const origWrite = process.stdout.write.bind(process.stdout);
process.stdout.write = ((data: unknown, ...args: unknown[]) => {
  if (typeof data === "string") {
    data = data.replace(/\x1b\[3J/g, "");
  }
  return (origWrite as Function)(data, ...args);
}) as typeof process.stdout.write;

// Restore on exit
function cleanup() {
  process.stdout.write("\x1b[?1049l");
}
process.on("exit", cleanup);
process.on("SIGINT", () => {
  cleanup();
  process.exit(0);
});

const range = cli.input[0];

let raw: string;
try {
  raw = execDiff(range, { noUntracked: cli.flags.noUntracked });
} catch (err: any) {
  cleanup();
  console.error("Error running git diff:", err.message);
  process.exit(1);
}

if (!raw.trim()) {
  cleanup();
  console.log("No changes to display.");
  process.exit(0);
}

const files = parsePatch(raw);

if (files.length === 0) {
  cleanup();
  console.log("No changes to display.");
  process.exit(0);
}

const diffOpts = { noUntracked: cli.flags.noUntracked };
const { waitUntilExit } = render(<App files={files} range={range} diffOpts={diffOpts} />, {
  exitOnCtrlC: true,
});

waitUntilExit().then(cleanup);
