# Security

A plugin installed from this marketplace can run code with the installing
user's privileges — the same trust level as the user running Claude Code.
Review every plugin before it's merged, not just before someone installs it.

## What a plugin can do

| Component | Runs as | Notes |
| --- | --- | --- |
| `hooks/hooks.json` | shell commands, outside the sandbox | review every command string |
| `.mcp.json` (MCP servers) | a process started on the user's machine | review the command/URL and what tools it exposes |
| `bin/` | added to the Bash tool's `PATH` | review every file in the directory |
| `skills/`, `commands/`, `agents/` | text that enters Claude's context | lower risk, but can still instruct Claude to do things |

Claude Code shows users a generic trust warning before install
("Anthropic does not control what MCP servers, files, or other software are
included in plugins..."). That warning is not a substitute for review here.

## Review checklist for a new or updated plugin

- [ ] Read every command in `hooks/hooks.json` — no network calls to
      unexpected hosts, no `curl | sh`, no silent file writes outside the
      project.
- [ ] Read `.mcp.json` — know what each declared MCP server's command/URL is
      and what tools it grants.
- [ ] Read everything in `bin/` — these become runnable from any Bash command
      in a session where the plugin is enabled.
- [ ] No plugin ships a top-level `bin/` if this marketplace may ever be
      synced through claude.ai Organization settings — that sync rejects it
      outright. Put executables in `scripts/` and reference them as
      `${CLAUDE_PLUGIN_ROOT}/scripts/<name>`.
- [ ] No secrets (API keys, tokens, credentials) committed anywhere in the
      plugin directory. Use environment variables or a `headersHelper`
      command for anything short-lived.
- [ ] An `archive` plugin source pins `sha256`. A `github`/`url`/`git-subdir`
      source pins `ref` and ideally `sha` for anything security-sensitive.
- [ ] `npm` sources: confirm the package name/registry is the one you
      intend — Claude Code never runs the package's install scripts, but it
      does install declared Node.js dependencies from a lockfile.

## Secrets policy

- Never commit `.env` files, API keys, tokens, or credentials to this repo.
- A plugin that needs a user-supplied secret should read it from an
  environment variable at runtime, not store a default/example value that
  looks real.
- If CI ever needs a credential (e.g. to publish or scan), store it as a
  GitHub Actions secret, never in a tracked file.

## Scanning

`.github/workflows/validate.yml` runs `scripts/validate-marketplace.mjs` and
`claude plugin validate` (where available) on every pull request. Add a
secret-scanning step there before merging any plugin that touches
credentials, network calls, or `bin/`.

## If a plugin turns out to be untrustworthy

Remove its entry from `.claude-plugin/marketplace.json` and set
`forceRemoveDeletedPlugins: true` at the top level so Claude Code uninstalls
it from everyone who already has it, rather than leaving a stale copy
installed. See [RELEASES.md](./RELEASES.md).
