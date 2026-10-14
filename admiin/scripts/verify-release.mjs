import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
const root = ".output/public";
const failures = [];
async function scan(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      await scan(path);
      continue;
    }
    if (entry.name.endsWith(".map")) failures.push("Public source map: " + path);
    if (/\.env(?:\.|$)|^\.dev\.vars$/.test(entry.name))
      failures.push("Environment file in public output: " + path);
    if (entry.name.endsWith(".js")) {
      const source = await readFile(path, "utf8");
      if (
        source.includes("nelma1234") ||
        source.includes("DEMO_IDENTITIES") ||
        source.includes("NELMA-DEMO")
      )
        failures.push("Demo data/identities in API release: " + path);
    }
  }
}
await scan(root);
if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(
  "API release assets checked: no known demo signatures, public source maps, or environment files.",
);
