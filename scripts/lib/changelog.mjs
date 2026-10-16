// `git` is an injected object with the same shape as scripts/lib/git.mjs
// (logForPath, showAtCommit, everyPluginManifestPathEverAdded, deletionDate)
// so tests can pass a fake in-memory implementation instead of shelling out.
export function buildChangelog({ items, git }) {
  const entries = [
    ...addedEntries(items, git),
    ...updatedEntries(items, git),
    ...removedEntries(items, git),
  ];

  // Newest first; stable among same-day entries so build order (plugin, then
  // its own components) stays predictable instead of depending on sort impl.
  entries.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  return { entries };
}

function addedEntries(items, git) {
  const entries = [];
  for (const item of items) {
    const history = git.logForPath(item.path);
    if (history.length === 0) continue; // not committed yet
    entries.push({
      date: history[0].date.slice(0, 10),
      kind: "added",
      type: item.type,
      name: item.name,
      id: item.id,
      ...(item.type === "plugin" ? {} : { note: `in ${item.pluginName} ${item.version}` }),
    });
  }
  return entries;
}

function updatedEntries(items, git) {
  const entries = [];
  for (const plugin of items.filter((i) => i.type === "plugin")) {
    let prevVersion = null;
    for (const { sha, date } of git.logForPath(plugin.path)) {
      const raw = git.showAtCommit(sha, plugin.path);
      if (!raw) continue;
      let version;
      try {
        version = JSON.parse(raw).version;
      } catch {
        continue;
      }
      if (version && prevVersion && version !== prevVersion) {
        entries.push({
          date: date.slice(0, 10),
          kind: "updated",
          type: "plugin",
          name: plugin.name,
          id: plugin.id,
          note: `${prevVersion} to ${version}`,
        });
      }
      if (version) prevVersion = version;
    }
  }
  return entries;
}

function removedEntries(items, git) {
  const entries = [];
  const currentPaths = new Set(items.filter((i) => i.type === "plugin").map((i) => i.path));
  for (const path of git.everyPluginManifestPathEverAdded()) {
    if (currentPaths.has(path)) continue;
    const date = git.deletionDate(path);
    if (!date) continue;
    const name = path.split("/")[1]; // plugins/<name>/.claude-plugin/plugin.json
    entries.push({
      date: date.slice(0, 10),
      kind: "removed",
      type: "plugin",
      name,
      id: name,
      note: "no longer in the catalog",
    });
  }
  return entries;
}
