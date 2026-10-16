# Contributing

## Adding a plugin

1. Read [`docs/PLUGIN-GUIDELINES.md`](docs/PLUGIN-GUIDELINES.md) for the
   directory layout and manifest fields.
2. Read [`docs/SECURITY.md`](docs/SECURITY.md) before adding hooks, an MCP
   server, or a `bin/` executable — those run with the installing user's
   full privileges.
3. Read [`docs/RELEASES.md`](docs/RELEASES.md) for versioning conventions
   before setting (or omitting) `version`.
4. Create `plugins/<name>/`, register it in
   `.claude-plugin/marketplace.json`, and validate locally:

   ```bash
   node scripts/validate-marketplace.mjs --strict   # --strict catches warnings too
   claude plugin validate .
   claude plugin validate ./plugins/<name>
   ```

5. Smoke-test the install:

   ```bash
   claude plugin marketplace add .
   claude plugin install <name>@dev-digest-ai-marketplace
   ```

6. Open a PR. CI (`.github/workflows/validate.yml`) runs the same checks and
   the PR template has the full checklist.

## Releasing an update

```bash
node scripts/release-plugin.mjs <name> patch   # or: minor / major / X.Y.Z
git push origin HEAD --follow-tags
```

This bumps `version` in `plugin.json`, validates, commits, and tags
`<name>--v<version>`. See [`docs/RELEASES.md`](docs/RELEASES.md) for the
full convention, including the rolling (no-`version`) alternative.

Renaming the plugin's `name`? Add an entry to the top-level `renames` map in
`marketplace.json` first; see
[`docs/RELEASES.md`](docs/RELEASES.md#renaming-or-removing-a-plugin).

## Rolling back a bad release

```bash
node scripts/rollback-plugin.mjs <name> <known-good-X.Y.Z>
git push origin HEAD --follow-tags
```

This republishes that version's files under a new, higher version so normal
update flows pick it up. See
[`docs/RELEASES.md`](docs/RELEASES.md#rollback).

## Removing a plugin

Remove its entry from `plugins`, add it to `renames` mapped to `null`, and
decide whether to set `forceRemoveDeletedPlugins: true` — see
[`docs/RELEASES.md`](docs/RELEASES.md#renaming-or-removing-a-plugin).
