const INDEX_CONTRACT_VERSION = 1;

export function buildLlmsTxt({ marketplace, items, commit, generatedAt, repoSlug }) {
  const lines = [
    `# ${marketplace.name}`,
    "",
    `> ${marketplace.description}`,
    "",
    `Install: /plugin marketplace add ${repoSlug}`,
    `Generated: ${generatedAt} at commit ${commit.slice(0, 7)}`,
    "",
  ];

  const plugins = items.filter((i) => i.type === "plugin");
  for (const plugin of plugins) {
    lines.push(`## ${plugin.name} (v${plugin.version})`, "", plugin.description, "");
    const children = items.filter((i) => i.type !== "plugin" && i.pluginName === plugin.name);
    for (const child of children) {
      lines.push(`- ${child.type}: ${child.name} — ${child.description}`);
    }
    lines.push(`- install: ${plugin.installCommand}`, "");
  }

  return lines.join("\n");
}

export function buildPublicIndex({ marketplace, items, commit, generatedAt }) {
  return {
    version: INDEX_CONTRACT_VERSION,
    marketplace: marketplace.name,
    generatedAt,
    commit,
    items,
  };
}

export function buildFeedXml({ marketplace, changelog, repoUrl, generatedAt }) {
  const items = changelog.entries
    .map((e) => {
      const title = e.type === "plugin" ? e.name : `${e.id.split("/")[0]} / ${e.name}`;
      return [
        "    <item>",
        `      <title>${xmlEscape(`${capitalize(e.kind)}: ${title}`)}</title>`,
        `      <link>${xmlEscape(repoUrl)}</link>`,
        `      <guid isPermaLink="false">${xmlEscape(e.id + e.date)}</guid>`,
        `      <pubDate>${new Date(e.date).toUTCString()}</pubDate>`,
        e.note ? `      <description>${xmlEscape(e.note)}</description>` : null,
        "    </item>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    "  <channel>",
    `    <title>${xmlEscape(marketplace.name)} — what's new</title>`,
    `    <link>${xmlEscape(repoUrl)}</link>`,
    `    <description>${xmlEscape(marketplace.description)}</description>`,
    `    <lastBuildDate>${new Date(generatedAt).toUTCString()}</lastBuildDate>`,
    items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
