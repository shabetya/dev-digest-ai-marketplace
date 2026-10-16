# Marketplace research notes (temporary)

> Scratch notes from researching the Claude Code plugin-marketplace format
> before this repo's structure was set up. Kept here for reference while
> building the first plugin. **Delete this file once the first real plugin
> is merged** — by then `PLUGIN-GUIDELINES.md`, `SECURITY.md`, and
> `RELEASES.md` should cover everything in it.

Sources: code.claude.com/docs/en/plugins/{create-marketplace,
marketplace-reference, host-marketplace, security, manifest-reference,
cli-reference}, fetched 2026-10-16.

## Required file

`.claude-plugin/marketplace.json` at the repo root. The directory containing
`.claude-plugin/` is the "marketplace root" — all relative plugin `source`
paths resolve from there, not from inside `.claude-plugin/`.

## marketplace.json top-level fields

Required: `name`, `owner` (`{name, email?, url?}`), `plugins` (array).
Optional: `description`, `version` / `metadata.{description,version}`,
`metadata.pluginRoot`, `forceRemoveDeletedPlugins`,
`allowCrossMarketplaceDependenciesOn`, `renames`. Unknown keys are ignored
silently at load time (warned by `claude plugin validate`).

## Plugin entry fields

Required: `name`, `source`. Optional: `description`, `version`, `category`,
`tags`, `strict` (default `true`), `displayName`, `defaultEnabled`,
`dependencies`, `relevance`, `metadata`, `headers`/`headersHelper` (archive
sources only). Entry `name` must equal the plugin's own `plugin.json`
`name`, or installs by manifest name fail.

## Plugin source types

`"./relative/path"` (must start with `./`, no `..`), `github` (`repo`,
`ref`, `sha`), `url` (`url`, `ref`, `sha`), `git-subdir` (`url`, `path`,
`ref`, `sha`), `npm` (`package`, `version`, `registry`), `archive` (`url`,
`sha256`), `command` (`command`, `timeout`, `mode`).

A URL-hosted marketplace (bare `marketplace.json` link, no git) can only
fetch the catalog file itself, so relative-path plugin sources don't resolve
there — every entry needs a self-contained source (`github`, `archive`,
etc.) in that hosting mode.

## Adding/installing

```
/plugin marketplace add owner/repo[#ref]
claude plugin install <name>@<marketplace>
claude plugin marketplace add . --scope project   # commit .claude/settings.json
```

## Validation

`claude plugin validate <path>` checks JSON syntax, required fields, naming
rules, `..` in sources, and (for relative-path plugins) their `plugin.json`.
It does **not** verify remote `repo`/`path` values or that a relative
source's target directory exists — those only surface at `install` time.
`--strict` turns warnings into failures (good for CI). `--json` for
machine-readable output.

## Naming rules / reserved names

kebab-case; letters/digits/`.`/`_`/`-`, must start alphanumeric, no `..`.
Reserved: official Anthropic names (`claude-plugins-official`,
`claude-code-plugins`, `anthropic-*`, `agent-skills`, ...), community names
(`claude-community`, `claude-plugins-community`, `healthcare`), `npm`,
`pip`, `uv`, `cargo`, `github`, `gh` (any casing), anything starting with
`claudeai-`, and names that impersonate an official one. `dev-digest-ai-marketplace`
is not reserved.

## Versioning / renames

See `../RELEASES.md` — this was the source material it was written from.

## Security

See `../SECURITY.md` — this was the source material it was written from.
Plugins run hooks/MCP servers/`bin/` with full user privileges, outside
Claude Code's sandbox and permission prompts. Claude.ai Organization sync
rejects a plugin with a top-level `bin/` directory.

## CLI reference (subset relevant here)

```
claude plugin validate <path> [--strict] [--json]
claude plugin marketplace add|list|update|remove <source|name>
claude plugin install <plugin>@<marketplace> [--scope user|project|local]
claude plugin details <plugin>
claude plugin list
claude plugin eval <plugin-path>       # behavioral testing, not structural
```

`claude plugin marketplace remove <name>` uninstalls every plugin a user
installed from it and deletes their saved plugin data/options — warn before
telling anyone to run it.
