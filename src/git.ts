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

/** Execute git diff and return the raw unified diff string */
export function execDiff(range?: string): string {
  const args = buildDiffArgs(range);
  try {
    return execSync(args.join(" "), { encoding: "utf-8", maxBuffer: 50 * 1024 * 1024 });
  } catch (err: any) {
    if (err.stdout) return err.stdout;
    throw err;
  }
}
