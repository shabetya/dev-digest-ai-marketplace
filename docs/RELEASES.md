# Releases

How versioning, updates, and rollback work for plugins in this marketplace.

## Versioning

Use [SemVer](https://semver.org) (`MAJOR.MINOR.PATCH`) for every plugin's
`version` in `plugin.json`.

Two supported modes — pick one per plugin and stay consistent:

- **Versioned** (recommended): set `version` in `plugin.json` and bump it on
  every release. Users keep their cached copy until the string changes.
- **Rolling**: omit `version` everywhere (both `plugin.json` and the
  marketplace entry). Users track commits on the plugin's default branch
  instead of discrete releases.

Never set `version` in both `plugin.json` and the marketplace entry —
`plugin.json` silently wins and `claude plugin validate` will flag the
mismatch as a warning.

## Tags

Tag every plugin release in this repo as `<plugin-name>--v<version>`, e.g.
`dev-digest--v1.2.0`. This is also the convention Claude Code's dependency
resolver looks for when another plugin depends on a version range of this
one.

## Releasing with the script

`scripts/release-plugin.mjs` bumps a plugin's `version`, validates the
marketplace, and creates the commit and tag described above:

```bash
node scripts/release-plugin.mjs <plugin-name> patch   # 1.0.0 → 1.0.1
node scripts/release-plugin.mjs <plugin-name> minor   # 1.0.0 → 1.1.0
node scripts/release-plugin.mjs <plugin-name> major   # 1.0.0 → 2.0.0
node scripts/release-plugin.mjs <plugin-name> 1.4.2   # explicit version
```

It does not push. Review the commit and tag it printed, then:

```bash
git push origin HEAD --follow-tags
```

Pass `--no-commit` and/or `--no-tag` to only edit `plugin.json` and stop
there.

## Update

- **Auto-update** is off by default for this (third-party) marketplace.
  Users turn it on per marketplace in `/plugin` → Marketplaces, or an org
  admin sets `autoUpdate: true` on this marketplace in managed settings.
- Without auto-update, users run `/plugin marketplace update
  dev-digest-ai-marketplace` then `claude plugin update <name>@dev-digest-ai-marketplace`.
- To hold a group of users on one version, point their marketplace add
  command at a pinned ref/tag (`your-org/dev-digest-ai-marketplace#v1.0.0`),
  or pin `ref`/`sha` on the individual plugin's source object.

## Renaming or removing a plugin

A plugin's `name` is its install id (`<name>@dev-digest-ai-marketplace`).
Changing it breaks every existing install unless you record the change.

- **Rename**: add an entry to the top-level `renames` map in
  `marketplace.json`, mapping the old name to the new one. Keep the mapping
  forever (append-only) — do not delete old entries once people have
  migrated. To change only the display label, set `displayName` in
  `plugin.json` instead and leave `name` untouched.
- **Remove**: add an entry to `renames` mapping the old name to `null`, and
  remove it from `plugins`. Set `forceRemoveDeletedPlugins: true` at the top
  level if the plugin should be actively uninstalled from users' machines
  rather than just stop being offered.

## Rollback

Claude Code has no built-in "rollback" concept — one marketplace entry
always points at one version. A rollback here means: republish an older
version's files under a *new, higher* version number ("fix forward"), so
normal update flows pick it up. Never force-push over or delete a published
tag that users may have pinned to.

`scripts/rollback-plugin.mjs` does this:

```bash
node scripts/rollback-plugin.mjs <plugin-name> 1.0.1
```

This restores `plugins/<plugin-name>/` from the `<plugin-name>--v1.0.1` tag,
sets `version` to a patch bump of whatever is *currently* released (e.g.
`1.3.0` → `1.3.1`), validates, commits, and tags the result. Override the new
version explicitly if a patch bump isn't right (e.g. the rollback should
also be a major version):

```bash
node scripts/rollback-plugin.mjs <plugin-name> 1.0.1 --release-as 2.0.0
```

It refuses to run if the target tag doesn't exist (and lists what does
exist for that plugin), and it warns — but still proceeds — if the target
isn't actually older than the current release. It does not push; review and
run `git push origin HEAD --follow-tags` yourself.

For emergencies where you can't wait for a release at all, you can instead
point a specific user's or group's marketplace source at a pinned ref
(`your-org/dev-digest-ai-marketplace#<tag>`) without touching `main`.
