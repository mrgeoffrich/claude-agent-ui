#!/usr/bin/env node
/**
 * Bumps the version field in every packages/*\/package.json in lockstep.
 *
 *   node scripts/bump-version.mjs 0.1.1
 *   node scripts/bump-version.mjs patch   # 0.1.0 -> 0.1.1
 *   node scripts/bump-version.mjs minor   # 0.1.0 -> 0.2.0
 *   node scripts/bump-version.mjs major   # 0.1.0 -> 1.0.0
 *
 * Does not commit, tag, or push — caller decides (and sees the diff first).
 */

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PACKAGES_DIR = join(ROOT, "packages");

const arg = process.argv[2];
if (!arg) {
  console.error("Usage: bump-version.mjs <version|major|minor|patch>");
  process.exit(1);
}

const pkgDirs = readdirSync(PACKAGES_DIR).filter((d) => {
  try {
    readFileSync(join(PACKAGES_DIR, d, "package.json"));
    return true;
  } catch {
    return false;
  }
});

if (pkgDirs.length === 0) {
  console.error("No packages found under packages/*");
  process.exit(1);
}

function bump(current, kind) {
  const [maj, min, pat] = current.split(".").map((n) => parseInt(n, 10));
  if (kind === "major") return `${maj + 1}.0.0`;
  if (kind === "minor") return `${maj}.${min + 1}.0`;
  if (kind === "patch") return `${maj}.${min}.${pat + 1}`;
  return null;
}

// Read current version from first package (they should all match).
const firstPkgPath = join(PACKAGES_DIR, pkgDirs[0], "package.json");
const firstPkg = JSON.parse(readFileSync(firstPkgPath, "utf8"));
const currentVersion = firstPkg.version;

let nextVersion;
if (arg === "major" || arg === "minor" || arg === "patch") {
  nextVersion = bump(currentVersion, arg);
} else if (/^\d+\.\d+\.\d+(-.+)?$/.test(arg)) {
  nextVersion = arg;
} else {
  console.error(`Invalid version: "${arg}"`);
  process.exit(1);
}

console.log(`Bumping ${currentVersion} -> ${nextVersion}`);

for (const dir of pkgDirs) {
  const path = join(PACKAGES_DIR, dir, "package.json");
  const pkg = JSON.parse(readFileSync(path, "utf8"));
  pkg.version = nextVersion;
  writeFileSync(path, JSON.stringify(pkg, null, 2) + "\n");
  console.log(`  ${pkg.name} -> ${nextVersion}`);
}

console.log(`\nNext steps:`);
console.log(`  git commit -am "chore: release v${nextVersion}"`);
console.log(`  git tag v${nextVersion}`);
console.log(`  git push && git push --tags`);
