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

  Examples
    $ sbs
    $ sbs HEAD~2..HEAD~1
    $ sbs main..feature
`,
  {
    importMeta: import.meta,
  },
);

// Enter alternate screen
process.stdout.write("\x1b[?1049h");

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
  raw = execDiff(range);
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

const { waitUntilExit } = render(<App files={files} />, {
  exitOnCtrlC: true,
});

waitUntilExit().then(cleanup);
