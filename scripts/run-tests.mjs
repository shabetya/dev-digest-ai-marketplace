#!/usr/bin/env node
// `node --test <dir>` doesn't recurse into a bare directory argument on this
// Node version (it tries to `require()` the path and fails) and relying on
// shell globstar (`test/**/*.test.mjs`) isn't portable across sh/bash/zsh/CI.
// So: find the files ourselves and hand them to node:test's run() API.

import { run } from "node:test";
import { spec } from "node:test/reporters";
import { finished } from "node:stream/promises";
import { readdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function findTestFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...findTestFiles(full));
    else if (entry.isFile() && entry.name.endsWith(".test.mjs")) files.push(full);
  }
  return files;
}

const files = findTestFiles(join(root, "test"));
let failed = false;

const stream = run({ files });
stream.on("test:fail", () => {
  failed = true;
});
stream.compose(spec).pipe(process.stdout);

await finished(stream);
process.exitCode = failed ? 1 : 0;
