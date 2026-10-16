import { spawnSync } from "node:child_process";

// Returns true only if the `claude` CLI is on PATH *and* `claude plugin
// validate <dir>` exits 0. Any other outcome (CLI missing, validation
// failure) is false — the UI then shows a "Schema-only" badge instead of
// failing the whole build, since CI runners may not have the CLI installed.
export function validatePlugin(pluginDir) {
  const result = spawnSync("claude", ["plugin", "validate", pluginDir], {
    encoding: "utf8",
  });
  if (result.error || result.status !== 0) return false;
  return true;
}
