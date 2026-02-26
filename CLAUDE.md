# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is this?

SBS is a terminal-based side-by-side git diff viewer built with TypeScript, React, and Ink (React renderer for CLIs).

## Commands

- `npm run build` — Build with tsup (output: `dist/cli.js`)
- `npm run dev` — Run directly via tsx without building
- `npm test` — Run all tests with vitest
- `npx vitest run tests/parse.test.ts` — Run a single test file

## Architecture

The data pipeline flows: **git diff → parse → align → flatten → React render**

1. **git.ts** — Executes `git diff` and returns the unified diff string
2. **parse.ts** — Parses unified diff into `ProcessedFile[]` using `parse-diff`
3. **align.ts** — Converts unified diff chunks into side-by-side `AlignedRow[]` (pairs deletions with additions)
4. **flatten.ts** — Flattens `ProcessedFile[]` into a `FlatRow[]` list for the viewport (handles collapsing, binary files, summary stats)
5. **components/** — React/Ink components render the flat rows in the terminal

Key types in `types.ts`: `ProcessedFile`, `AlignedRow`, `FlatRow` (discriminated union: summary | file-header | hunk-header | line-pair).

Navigation and input handling lives in `hooks/use-navigation.ts`. The main app component is `app.tsx`, which wires state (scroll offset, collapsed files) to the Viewport.

## Tech Stack

- TypeScript (ES2022, strict, ESM)
- React 18 + Ink 5 for terminal UI
- tsup for bundling (targets Node 20, adds shebang)
- vitest for testing
- meow for CLI argument parsing

## Testing

Write tests for bug fixes and new features. Tests live in `tests/` and use vitest. Extract testable logic into pure exported functions rather than testing through React hooks or components. Run `npm test` to verify all tests pass before finishing.

## Versioning

When bumping the version, update all three locations:
- `package.json` — `"version"` field
- `README.md` — `**vX.Y.Z**` badge near the top
- `src/components/summary.tsx` — `VERSION` constant

## Git Policy

Never run `git add`, `git commit`, `git merge`, or `git push` without explicit user permission.
