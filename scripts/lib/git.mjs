import { execFileSync } from "node:child_process";

function git(args, options = {}) {
  return execFileSync("git", args, { encoding: "utf8", ...options }).trim();
}

export function getHeadSha() {
  return git(["rev-parse", "HEAD"]);
}

export function getRepoInfo(fallbackName) {
  try {
    const url = git(["config", "--get", "remote.origin.url"]);
    // Matches both "git@github.com:owner/repo.git" and "https://github.com/owner/repo.git"
    const m = /github\.com[:/]([^/]+)\/(.+?)(?:\.git)?$/.exec(url);
    if (m) return { owner: m[1], repo: m[2] };
  } catch {
    // No remote configured (fresh local repo) — fall through to the placeholder.
  }
  return { owner: "[OWNER]", repo: fallbackName };
}

// Chronological list of commits that touched `path`, oldest first:
// [{ sha, date (ISO) }]. Empty if the path has no history yet (uncommitted).
export function logForPath(repoPath) {
  let raw;
  try {
    raw = git(["log", "--follow", "--format=%H %cI", "--", repoPath]);
  } catch {
    return [];
  }
  if (!raw) return [];
  return raw
    .split("\n")
    .map((line) => {
      const [sha, date] = line.split(" ");
      return { sha, date };
    })
    .reverse(); // oldest first
}

export function showAtCommit(sha, repoPath) {
  try {
    return git(["show", `${sha}:${repoPath}`]);
  } catch {
    return null;
  }
}

// All plugin.json paths ever added under plugins/, deduplicated — used to
// detect plugins that existed at some point in history but are gone now.
export function everyPluginManifestPathEverAdded() {
  let raw;
  try {
    raw = git([
      "log",
      "--diff-filter=A",
      "--name-only",
      "--format=",
      "--",
      "plugins/*/.claude-plugin/plugin.json",
    ]);
  } catch {
    return [];
  }
  return [...new Set(raw.split("\n").filter(Boolean))];
}

// Date of the commit that deleted `repoPath`, or null if it was never deleted.
export function deletionDate(repoPath) {
  let raw;
  try {
    raw = git(["log", "--diff-filter=D", "-1", "--format=%cI", "--", repoPath]);
  } catch {
    return null;
  }
  return raw || null;
}
