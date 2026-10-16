## What this PR does

<!-- New plugin? Update to an existing one? Marketplace infra change? -->

## Checklist

- [ ] `node scripts/validate-marketplace.mjs` passes locally (`--strict` recommended)
- [ ] `claude plugin validate .` and `claude plugin validate ./plugins/<name>` pass locally
- [ ] Entry `name` in `marketplace.json` matches `name` in the plugin's own `plugin.json`
- [ ] Installed and smoke-tested locally: `claude plugin marketplace add .` → `claude plugin install <name>@dev-digest-ai-marketplace`
- [ ] Reviewed against [`docs/SECURITY.md`](../docs/SECURITY.md) — hooks, MCP servers, and `bin/` read line by line
- [ ] No secrets, tokens, or credentials committed
- [ ] `version` bumped (or intentionally omitted) per [`docs/RELEASES.md`](../docs/RELEASES.md)
- [ ] If renaming/removing a plugin: `renames` map updated in `marketplace.json`
