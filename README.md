# sbs

**v0.6.1**

A terminal-based side-by-side git diff viewer. Renders diffs in a full-screen TUI with vim-style navigation, collapsible file sections, and color-coded additions/deletions.

## Installation

```bash
git clone <repo-url> && cd sbs
npm install && npm run build
npm link
```

After linking, `sbs` is available as a global command. To uninstall: `npm unlink -g @kwak/sbs`

## Usage

Run `sbs` inside any git repository:

```bash
# Diff current branch against the default branch (main or master)
sbs

# Diff a specific range
sbs HEAD~3..HEAD

# Compare two branches
sbs main..feature

# Compare two specific commits
sbs abc1234..def5678
```

When called with no arguments, `sbs` diffs against your repository's default branch (auto-detected from `origin/HEAD`, falling back to `main` then `master`).

Untracked files are included by default (shown as entirely new files). Use `--no-untracked` to exclude them:

```bash
sbs --no-untracked
```

## Interface

The TUI opens in a full-screen alternate buffer — your scrollback history is preserved when you quit.

**Summary bar** at the top shows the total file count and overall additions/deletions.

**File boxes** contain:
- Filename in the header (displays `old → new` for renames)
- Per-file `+N -M` stats
- Hunk headers with `@@` context
- Side-by-side line pairs: old content on the left, new content on the right
- Deletions in red, additions in green

Files can be collapsed to hide their diff content, making it easy to skim large changesets and focus on specific files.

## Keyboard Shortcuts

| Key               | Action               |
|-------------------|----------------------|
| `j` / `↓`        | Scroll down          |
| `k` / `↑`        | Scroll up            |
| `d` / `Page Down` | Half-page down      |
| `u` / `Page Up`  | Half-page up         |
| `g`               | Jump to top          |
| `G`               | Jump to bottom       |
| `n`               | Next file            |
| `p`               | Previous file        |
| `Enter` / `o`    | Toggle file collapse |
| `c`               | Close file           |
| `r`               | Reload diff          |
| `h` (hold)        | Show help overlay    |
| `q`               | Quit                 |

## Requirements

- Node.js >= 20
- Git
- A terminal with alternate screen buffer and ANSI color support

## Development

```bash
npm run dev          # Run directly via tsx (no build step)
npm run build        # Build with tsup → dist/cli.js
npm test             # Run tests with vitest
```

## License

MIT
