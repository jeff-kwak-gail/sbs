import { execSync } from "node:child_process";

/** Get the default branch name (main or master) */
export function getDefaultBranch(): string {
  // Try to detect main/master by checking git remote refs,
  // fallback to checking local branches
  try {
    const result = execSync("git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null", {
      encoding: "utf-8",
    }).trim();
    return result.replace("refs/remotes/origin/", "");
  } catch {
    // Fallback: check if 'main' exists, else 'master'
    try {
      execSync("git rev-parse --verify main 2>/dev/null", { encoding: "utf-8" });
      return "main";
    } catch {
      return "master";
    }
  }
}

/** Build the git diff command arguments */
export function buildDiffArgs(range?: string): string[] {
  if (range) {
    return ["git", "diff", range];
  }
  const defaultBranch = getDefaultBranch();
  return ["git", "diff", defaultBranch];
}

/** Get list of untracked files (respects .gitignore) */
export function getUntrackedFiles(): string[] {
  try {
    const output = execSync("git ls-files --others --exclude-standard", {
      encoding: "utf-8",
    }).trim();
    if (!output) return [];
    return output.split("\n");
  } catch {
    return [];
  }
}

/** Generate synthetic unified diffs for untracked files */
export function diffUntrackedFiles(files: string[]): string {
  const diffs: string[] = [];
  for (const file of files) {
    try {
      execSync(`git diff --no-index -- /dev/null ${file}`, {
        encoding: "utf-8",
        maxBuffer: 50 * 1024 * 1024,
      });
    } catch (err: any) {
      // git diff --no-index exits with code 1 when files differ, which is expected
      if (err.stdout) diffs.push(err.stdout);
    }
  }
  return diffs.join("");
}

export interface ExecDiffOpts {
  noUntracked?: boolean;
}

/** Execute git diff and return the raw unified diff string */
export function execDiff(range?: string, opts?: ExecDiffOpts): string {
  const args = buildDiffArgs(range);
  let diff: string;
  try {
    diff = execSync(args.join(" "), { encoding: "utf-8", maxBuffer: 50 * 1024 * 1024 });
  } catch (err: any) {
    if (err.stdout) diff = err.stdout;
    else throw err;
  }

  if (!opts?.noUntracked) {
    const untracked = getUntrackedFiles();
    if (untracked.length > 0) {
      diff += diffUntrackedFiles(untracked);
    }
  }

  return diff;
}
