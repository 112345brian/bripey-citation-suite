import { readFileSync, writeFileSync } from "fs";

// npm sets npm_package_version when run via `npm run bump`; allow an explicit
// argv override (`node version-bump.mjs 2.6.0`) for direct invocation.
const targetVersion = process.argv[2] || process.env.npm_package_version;

if (!targetVersion || !/^\d+\.\d+\.\d+$/.test(targetVersion)) {
  console.error(
    `version-bump: no valid target version (got ${JSON.stringify(targetVersion)}).\n` +
      "Run via `npm run bump` or pass a version: node version-bump.mjs 1.2.3"
  );
  process.exit(1);
}

// read minAppVersion from manifest.json and bump version to target version
let manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
const { minAppVersion } = manifest;
manifest.version = targetVersion;
writeFileSync("manifest.json", JSON.stringify(manifest, null, "\t") + '\n');

// update versions.json with target version and minAppVersion from manifest.json
let versions = JSON.parse(readFileSync("versions.json", "utf8"));
versions[targetVersion] = minAppVersion;
writeFileSync("versions.json", JSON.stringify(versions, null, "\t") + '\n');
