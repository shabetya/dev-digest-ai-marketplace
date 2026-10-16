import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, extname } from "node:path";
import { parseFrontmatter } from "./frontmatter.mjs";
import { slugFromFilename } from "./text.mjs";

const COMPONENT_KINDS = [
  { dir: "skills", type: "skill", manifestFile: "SKILL.md" },
  { dir: "commands", type: "command", manifestFile: null },
  { dir: "agents", type: "agent", manifestFile: null },
];

// Walks `<pluginDir>/skills/*/SKILL.md`, `<pluginDir>/commands/**/*.md` and
// `<pluginDir>/agents/**/*.md`. Returns one record per component, each with
// its own id/path relative to the repo root (`repoRoot`).
export function discoverPluginComponents(repoRoot, pluginDir, pluginName) {
  const components = [];

  for (const kind of COMPONENT_KINDS) {
    const kindDir = join(pluginDir, kind.dir);
    if (!existsSync(kindDir) || !statSync(kindDir).isDirectory()) continue;

    if (kind.manifestFile) {
      // skills/: one component per subdirectory that contains SKILL.md
      for (const entry of readdirSync(kindDir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const manifestPath = join(kindDir, entry.name, kind.manifestFile);
        if (!existsSync(manifestPath)) continue;
        components.push(
          buildComponent({ repoRoot, pluginName, type: kind.type, slug: entry.name, manifestPath }),
        );
      }
    } else {
      // commands/, agents/: every *.md file, any depth, named after its path
      for (const { path: mdPath, slug } of walkMarkdown(kindDir)) {
        components.push(
          buildComponent({ repoRoot, pluginName, type: kind.type, slug, manifestPath: mdPath }),
        );
      }
    }
  }

  return components;
}

function* walkMarkdown(dir, prefix = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkMarkdown(full, [...prefix, entry.name]);
    } else if (entry.isFile() && extname(entry.name) === ".md") {
      yield { path: full, slug: [...prefix, slugFromFilename(entry.name)].join("/") };
    }
  }
}

function buildComponent({ repoRoot, pluginName, type, slug, manifestPath }) {
  const frontmatter = parseFrontmatter(readFileSync(manifestPath, "utf8"));
  return {
    type,
    pluginName,
    slug,
    name: frontmatter.name || slug,
    description: frontmatter.description || "",
    extraTags: frontmatter.tags,
    path: toRepoPath(repoRoot, manifestPath),
  };
}

export function toRepoPath(repoRoot, absPath) {
  return relative(repoRoot, absPath).split("\\").join("/");
}
