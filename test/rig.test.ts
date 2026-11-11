import { spawnSync } from "node:child_process";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { parseOptions } from "../src/options.js";
import { createRig } from "../src/rig.js";

const directories: string[] = [];
const extension = resolve("test/fixtures/offline.ts");

async function setup() {
	const cwd = await mkdtemp(join(tmpdir(), "pppr-rig-"));
	directories.push(cwd);
	const agentDir = join(cwd, "config");
	const args = ["--cwd", cwd, "--agent-dir", agentDir, "--model", "rig-offline/probe", "-e", extension];
	return { cwd, agentDir, args };
}

afterEach(async () => {
	await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("terminal rig", () => {
	it("runs an extension through Pi and restores Pi's persisted tool results", async () => {
		const { cwd, args } = await setup();
		await writeFile(join(cwd, "AGENTS.md"), "Project instruction: use the probe tool.");
		const { session } = await createRig(parseOptions(args));
		const unsubscribe = session.subscribe(() => {});
		try {
			await session.bindExtensions({});
			expect(session.getActiveToolNames()).toEqual(
				expect.arrayContaining(["read", "bash", "edit", "write", "rig_probe"]),
			);
			expect(session.systemPrompt).toContain("Project instruction: use the probe tool.");
			await session.prompt("Exercise the probe tool");
			expect(await readFile(join(cwd, "probe.txt"), "utf8")).toBe("rig works");
			const transcript = session.sessionManager.getSessionFile();
			expect(transcript).toBeTruthy();
			const reopened = await createRig(parseOptions([...args, "--session", transcript!]));
			try {
				expect(reopened.session.state.messages.some((message) => message.role === "toolResult")).toBe(true);
			} finally {
				reopened.session.dispose();
			}
		} finally {
			unsubscribe();
			session.dispose();
		}
	});

	it("emits parseable Pi JSONL from the CLI, combines piped input, and shuts extensions down", async () => {
		const { cwd, args } = await setup();
		const result = spawnSync(
			process.execPath,
			["--import", "tsx", "src/cli.ts", ...args, "--json", "--no-session", "--no-tools", "task"],
			{
				input: "piped context",
				encoding: "utf8",
				timeout: 20000,
			},
		);
		expect(result.stderr).toBe("");
		expect(result.status).toBe(0);
		const events = result.stdout
			.trim()
			.split("\n")
			.map((line) => JSON.parse(line));
		expect(events.some((event) => event.type === "tool_execution_end" && event.toolName === "rig_probe")).toBe(true);
		expect(
			events.find((event) => event.type === "message_end" && event.message.role === "user").message.content,
		).toEqual([{ type: "text", text: "task\n\npiped context" }]);
		expect(await readFile(join(cwd, "started.txt"), "utf8")).toBe("started");
		expect(await readFile(join(cwd, "stopped.txt"), "utf8")).toBe("stopped");
		expect(await readdir(join(cwd, "config"))).not.toContain("sessions");
	});

	it("fails when an explicitly selected extension cannot load", async () => {
		const { cwd, args } = await setup();
		const broken = join(cwd, "broken.ts");
		await writeFile(broken, 'export default function () { throw new Error("broken extension"); }');
		await expect(createRig(parseOptions([...args, "-e", broken]))).rejects.toThrow("broken extension");
		await expect(createRig(parseOptions([...args, "-e", join(cwd, "missing.ts")]))).rejects.toThrow("ENOENT");
	});

	it("rejects ambiguous session options and unknown tools", () => {
		expect(() => parseOptions(["--continue", "--no-session"])).toThrow("Choose only one");
		expect(() => parseOptions(["--tools", "missing"])).toThrow("Unknown tool");
	});
});
