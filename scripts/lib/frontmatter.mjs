// Deliberately not a general YAML parser. Frontmatter here only ever needs
// `name`, `description`, and an optional `metadata: \n  tags: a, b, c` block —
// other keys (tools, model, argument-hint with embedded escaped quotes, ...)
// are present in real files but irrelevant to the catalog, so a full parser
// would add risk (escaping bugs) for no benefit. Reading an unrecognized line
// is a no-op, never an error.
export function parseFrontmatter(raw) {
  const text = String(raw ?? "");
  if (!text.startsWith("---")) return { name: null, description: null, tags: [] };

  const end = text.indexOf("\n---", 3);
  if (end === -1) return { name: null, description: null, tags: [] };

  const block = text.slice(3, end);
  const lines = block.split("\n");

  let name = null;
  let description = null;
  const tags = [];
  let inMetadata = false;

  for (const line of lines) {
    if (/^\S/.test(line)) inMetadata = /^metadata:\s*$/.test(line.trim());

    const nameMatch = /^name:\s*(.*)$/.exec(line);
    if (nameMatch) {
      name = unquote(nameMatch[1]);
      continue;
    }

    const descMatch = /^description:\s*(.*)$/.exec(line);
    if (descMatch) {
      description = unquote(descMatch[1]);
      continue;
    }

    const tagsMatch = /^\s*tags:\s*(.*)$/.exec(line);
    if (tagsMatch && (inMetadata || /^tags:/.test(line.trim()))) {
      for (const t of tagsMatch[1].split(",")) {
        const v = t.trim().toLowerCase();
        if (v) tags.push(v);
      }
    }
  }

  return { name, description, tags };
}

function unquote(value) {
  const v = value.trim();
  if (v.length >= 2 && v.startsWith('"') && v.endsWith('"')) {
    return v.slice(1, -1).replace(/\\"/g, '"');
  }
  return v;
}
