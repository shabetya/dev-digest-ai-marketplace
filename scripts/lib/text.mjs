// Cuts at a word boundary rather than mid-word; not sentence-aware on purpose —
// these descriptions are written for an LLM and use "e.g."/"i.e." constantly,
// which breaks naive ". "-based sentence splitting.
export function truncate(text, maxLen = 200) {
  const clean = String(text ?? "").trim().replace(/\s+/g, " ");
  if (clean.length <= maxLen) return clean;
  const cut = clean.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd() + "…";
}

export function slugFromFilename(filename) {
  return filename.replace(/\.md$/, "");
}
