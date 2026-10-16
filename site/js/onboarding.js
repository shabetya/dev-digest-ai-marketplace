const MARKETPLACE = 'dev-digest-ai-marketplace';

export function repoFromItems(items) {
  const m = items.map((i) => /github\.com\/([^/]+\/[^/]+)\//.exec(i.githubUrl)).find(Boolean);
  return m ? m[1] : `[OWNER]/${MARKETPLACE}`;
}

export function onboardingCommands(items) {
  const repo = repoFromItems(items);
  const firstPlugin = items.find((i) => i.type === 'plugin');
  return {
    repo,
    add: `/plugin marketplace add ${repo}`,
    install: firstPlugin ? firstPlugin.installCommand : `/plugin install [plugin-name]@${MARKETPLACE}`,
  };
}
