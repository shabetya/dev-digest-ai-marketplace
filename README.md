# dev-digest-ai-marketplace

A Claude Code plugin marketplace.

## Structure

```
.claude-plugin/marketplace.json   ← catalog (required, must stay at this path)
plugins/<name>/                   ← one directory per plugin hosted in this repo
docs/PLUGIN-GUIDELINES.md         ← plugin layout, manifest, dependencies
docs/SECURITY.md                  ← permissions, secrets policy, review checklist
docs/RELEASES.md                  ← SemVer, tags, update, rename/remove, rollback
scripts/validate-marketplace.mjs  ← structural lint, zero dependencies
scripts/release-plugin.mjs        ← bump version, validate, commit, tag
scripts/rollback-plugin.mjs       ← restore a prior release as a new version
.github/workflows/validate.yml    ← CI on every pull request
.github/pull_request_template.md  ← contributor checklist
CODEOWNERS · CONTRIBUTING.md
```

## Add a plugin

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the full walkthrough. Short
version:

1. Read [`docs/PLUGIN-GUIDELINES.md`](docs/PLUGIN-GUIDELINES.md) and
   [`docs/SECURITY.md`](docs/SECURITY.md).
2. Create `plugins/<name>/`, register it in
   `.claude-plugin/marketplace.json`.
3. Validate and smoke-test locally:

   ```bash
   node scripts/validate-marketplace.mjs
   claude plugin validate .
   claude plugin marketplace add .
   claude plugin install <name>@dev-digest-ai-marketplace
   ```

4. Open a PR — CI runs the same checks.

## Install this marketplace (once published to GitHub)

```bash
/plugin marketplace add shabetya/dev-digest-ai-marketplace
/plugin install <name>@dev-digest-ai-marketplace
```

## Releases

```bash
node scripts/release-plugin.mjs <name> patch   # or minor / major / X.Y.Z
node scripts/rollback-plugin.mjs <name> <X.Y.Z>
```

See [`docs/RELEASES.md`](docs/RELEASES.md) for versioning, updates,
renaming/removing a plugin, and rollback in detail.

---

Reference: [Claude Code plugin marketplace docs](https://code.claude.com/docs/en/plugins/create-marketplace).
`docs/temp/MARKETPLACE-RESEARCH.md` has deeper research notes — delete it
once the first plugin lands and the `docs/` pages above cover everything.
