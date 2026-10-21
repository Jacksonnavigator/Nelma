// Copies every photo listed in src/data/images.ts from the current
// realtzdiscovery.co.tz site into public/images/, so the new site no longer
// depends on the old one. Run once with: npm run fetch-images
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = await readFile(join(root, "src/data/images.ts"), "utf8");
const base = source.match(/REMOTE_BASE = "([^"]+)"/)[1];
const entries = [...source.matchAll(/file: "([^"]+)", remote: "([^"]+)"/g)];
const outDir = join(root, "public/images");
await mkdir(outDir, { recursive: true });

let ok = 0;
let failed = 0;
for (const [, file, remote] of entries) {
  const target = join(outDir, file);
  try {
    await access(target);
    console.log(`skip  ${file} (already there)`);
    ok++;
    continue;
  } catch {}
  try {
    const res = await fetch(base + remote);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await writeFile(target, Buffer.from(await res.arrayBuffer()));
    console.log(`saved ${file}`);
    ok++;
  } catch (err) {
    console.error(`FAIL  ${file}: ${err.message}`);
    failed++;
  }
}
console.log(`\n${ok} photos ready, ${failed} failed.`);
if (failed) process.exitCode = 1;
