import { copyFile, cp, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Build from a small explicit context: no host credentials, .env, ideation,
// transcripts, event files, or previous receipts enter the image.
const root = fileURLToPath(new URL("../../", import.meta.url));
const directory = fileURLToPath(new URL("./", import.meta.url));
const paseo = process.argv[2];
if (!paseo) throw new Error("Usage: node prepare-container.mjs /absolute/path/to/paseo.mjs");
const context = await mkdtemp(`${tmpdir()}/popper-memory-image-`);
for (const name of ["package.json", "package-lock.json"]) {
	await copyFile(resolve(root, name), resolve(context, name));
}
for (const name of ["Dockerfile", "client.ts"]) {
	await copyFile(resolve(directory, name), resolve(context, name));
}
await cp(resolve(root, "src"), resolve(context, "src"), { recursive: true });
await copyFile(resolve(paseo), resolve(context, "paseo.mjs"));
console.log(context);
