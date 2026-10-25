// Leaves one app and the contracts in the workspace, so an image installs
// only their dependencies, and drops the root's scripts (the contracts'
// build needs their sources, the Git hook the repository):
// node pruneWorkspace.js backend
const fs = require("node:fs");

const app = process.argv[2];
const manifest = JSON.parse(fs.readFileSync("package.json", "utf8"));
manifest.workspaces = [app, "packages/contracts"];
delete manifest.scripts;
fs.writeFileSync("package.json", JSON.stringify(manifest, null, 2));
