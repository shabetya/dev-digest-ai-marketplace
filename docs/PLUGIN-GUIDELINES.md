# Plugin guidelines

How to build a plugin for this marketplace and get it listed in
`.claude-plugin/marketplace.json`.

## Directory layout

```
plugins/<plugin-name>/
├── .claude-plugin/
│   └── plugin.json       # manifest — required
├── skills/                # SKILL.md instructions, optional
│   └── <skill>/SKILL.md
├── commands/               # optional
├── agents/                  # subagent definitions, optional
├── hooks/
│   └── hooks.json           # optional
├── .mcp.json                 # MCP server config, optional
└── bin/                       # executables added to PATH, optional
```

Component folders (`skills/`, `commands/`, `agents/`, `hooks/`) live at the
**plugin root**, not inside `.claude-plugin/`. Nesting them inside
`.claude-plugin/` is the most common mistake — Claude Code will not pick them
up.

## plugin.json (manifest)

Minimum:

```json
{
  "name": "my-plugin",
  "description": "What it does",
  "version": "0.1.0"
}
```

`name` must be kebab-case (letters, digits, `.`, `_`, `-`, starting with a
letter or digit). It becomes the prefix for every skill/command the plugin
exposes, e.g. `/my-plugin:hello`.

## Register the plugin in the marketplace

Add one object to the top-level `plugins` array in
`.claude-plugin/marketplace.json`:

```json
{
  "name": "my-plugin",
  "source": "./plugins/my-plugin",
  "description": "What it does",
  "category": "...",
  "tags": ["..."]
}
```

**The entry's `name` must exactly match the `name` in the plugin's own
`plugin.json`.** If they differ, installing by the manifest name fails with
`Plugin "<name>" not found in marketplace`.

### Plugins hosted outside this repo

Use an object `source` instead of a relative path:

```json
{ "source": "github", "repo": "owner/repo", "ref": "v1.0.0" }
{ "source": "git-subdir", "url": "owner/monorepo", "path": "tools/my-plugin" }
{ "source": "npm", "package": "@scope/pkg", "version": "^1.0.0" }
{ "source": "archive", "url": "https://.../pkg.zip", "sha256": "<64-hex>" }
```

Pin `ref`/`sha` (git sources) or `sha256` (archive sources) for reproducible
installs.

## Dependencies

If a plugin needs another plugin from this same marketplace or another one,
declare it in the entry's `dependencies` array rather than assuming install
order. Cross-marketplace dependencies additionally require the target
marketplace to be listed in this marketplace's top-level
`allowCrossMarketplaceDependenciesOn`.

## Before opening a PR

```bash
claude plugin validate ./plugins/<name>
claude plugin validate .
node scripts/validate-marketplace.mjs
```

Then test the install locally:

```bash
claude plugin marketplace add .
claude plugin install <name>@dev-digest-ai-marketplace
```

See [SECURITY.md](./SECURITY.md) before adding hooks, an MCP server, or a
`bin/` executable, and [RELEASES.md](./RELEASES.md) before bumping or
omitting `version`.
