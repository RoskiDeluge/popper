import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";

assert.equal(process.cwd(), "/trial");
assert.equal(homedir(), "/home/node");
assert.deepEqual(readdirSync("/trial"), []);
assert.deepEqual(readdirSync("/home/node"), []);
for (const path of ["/Users", "/var/run/docker.sock", "/opt/popper/.env", "/opt/popper/.reffy", "/opt/popper/test"]) {
	assert.equal(existsSync(path), false, `Unexpected host/context path: ${path}`);
}
writeFileSync("/trial/write-probe", "isolated");
const run = (command, args) => execFileSync(command, args, { encoding: "utf8" }).trim();
const loader = "/opt/popper/node_modules/tsx/dist/loader.mjs";
const versions = {
	node: process.version,
	codex: run("codex", ["--version"]),
	claude: run("claude", ["--version"]),
	gh: run("gh", ["--version"]).split("\n")[0],
};
assert.match(run("node", ["/opt/popper/paseo.mjs", "--help"]), /paseo/);
assert.match(run("node", ["--import", loader, "/opt/popper/src/cli.ts", "--help"]), /pppr/);
console.log(JSON.stringify({ isolation: "passed", versions, model_calls: 0 }, null, 2));
