// Copies every photo listed in src/data/images.ts from the current
// realtzdiscovery.co.tz site into public/images/, so the new site no longer
// depends on the old one. Run once with: npm run fetch-images
import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = await readFile(join(root, "src/data/images.ts"), "utf8");
const bases = [source.match(/REMOTE_BASE = "([^"]+)"/)[1], "https://realtzdiscovery.lovable.app/assets/"];
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
  let saved = false;
  let lastError = "";
  for (const base of bases) {
    try {
      const res = await fetch(base + remote);
      const type = res.headers.get("content-type") ?? "";
      if (!res.ok || !type.startsWith("image/")) throw new Error(`HTTP ${res.status} ${type}`);
      await writeFile(target, Buffer.from(await res.arrayBuffer()));
      console.log(`saved ${file}`);
      saved = true;
      break;
    } catch (err) {
      lastError = err.message;
    }
  }
  if (saved) ok++;
  else {
    console.error(`FAIL  ${file}: ${lastError}`);
    failed++;
  }
}
console.log(`\n${ok} photos ready, ${failed} failed.`);
if (failed) process.exitCode = 1;
