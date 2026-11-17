import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
	type Event,
	memoryClient,
	newReceipt,
	type Runner,
	recordPath,
	runner,
	validateEvent,
} from "../examples/cross-harness-memory/client.js";

const event: Event = {
	schema_version: 1,
	kind: "journal",
	project: "fixture-a",
	harness: "codex",
	session_id: "s1",
	event_id: "e1",
	content: "marker-unique",
	evidence_refs: ["fixture:a"],
};
const options = { agent: "lab/harness-memory", repo: "test/memory", branch: "agents/memory", attempt: 1 };
const receipt = newReceipt(event, options);
const sha = "a".repeat(40);
const reference = { path: recordPath(event), record: event, commit_sha: sha };
const answer = { kind: "journal", project: event.project, records: [reference] };
function envelope(response: unknown = answer, input: Event = event) {
	return {
		ok: true,
		trace_id: receipt.request_id,
		data: {
			action: "run",
			payload: { input: JSON.stringify(input) },
			loop: { notes: "off", memory_size: 0 },
			response: JSON.stringify(response),
		},
	};
}
function fake(
	config: {
		pipe?: unknown;
		pipeCode?: number | null;
		status?: string;
		log?: unknown;
		blob?: unknown;
		comparison?: string;
		unavailable?: boolean;
	} = {},
) {
	const calls: { executable: string; args: string[]; input?: string }[] = [];
	const run: Runner = async (command, args, input) => {
		calls.push({ executable: command.executable, args, input });
		const ok = (value: unknown, code = 0) => ({ code, stdout: JSON.stringify(value), stderr: "" });
		if (args[0] === "pipe")
			return {
				code: config.pipeCode === undefined ? 0 : config.pipeCode,
				stdout: JSON.stringify(config.pipe ?? envelope()),
				stderr: "409 invocation_exists",
			};
		if (args[0] === "agent")
			return config.unavailable
				? { code: 1, stdout: "", stderr: "unavailable" }
				: ok(
						config.log ?? {
							invocation: {
								trace_id: receipt.request_id,
								action: "run",
								status: config.status ?? "succeeded",
								result: config.pipe ?? envelope(),
							},
						},
					);
		const endpoint = args[1];
		if (endpoint.includes("/compare/")) return ok({ status: config.comparison ?? "identical" });
		if (endpoint.includes("/commits/")) return ok({ sha });
		if (config.status === "failed" && config.blob === undefined) return ok({ status: "404" }, 1);
		return ok({ encoding: "base64", content: Buffer.from(JSON.stringify(config.blob ?? event)).toString("base64") });
	};
	return { client: memoryClient(run, { executable: "paseo", args: [] }), calls };
}

describe("cross-harness explicit client", () => {
	it.each([
		{ ...event, harness: ["codex"] },
		{ ...event, kind: ["journal"] },
		{ ...event, project: "../other" },
		{ ...event, content: "" },
		{ ...event, content: "x".repeat(241) },
		{ ...event, evidence_refs: "wrong" },
		{ ...event, action: "pre_tool_use" },
		{ ...event, parent: null },
		{ ...event, parent: { harness: "popper", session_id: "x", event_id: "../bad" } },
	])("rejects invalid events before invocation: %j", (input) => expect(() => validateEvent(input)).toThrow());

	it("sends plain text stdin with raw receipts and verifies the actual branch and GitHub blob", async () => {
		const { client, calls } = fake();
		expect((await client.invoke(event, receipt)).outcome).toBe("verified");
		expect(calls[0]).toEqual({
			executable: "paseo",
			args: ["pipe", options.agent, "--raw", "--request-id", receipt.request_id],
			input: JSON.stringify(event),
		});
		expect(calls.some((c) => c.args[1].includes(`/compare/${sha}...agents%2Fmemory`))).toBe(true);
		expect(calls.some((c) => c.args[1].includes(`/contents/${recordPath(event)}?ref=${sha}`))).toBe(true);
	});

	it.each([
		{ blob: { ...event, content: "fabricated" } },
		{ comparison: "behind" },
		{ pipe: { ...envelope(), trace_id: "wrong" } },
		{ pipe: envelope(answer, { ...event, content: "different-input" }) },
		{ pipe: envelope({ ...answer, project: "other" }) },
		{ pipe: envelope({ ...answer, summary: "Unverified project data" }) },
		{ pipe: envelope({ ...answer, records: [{ ...reference, extra: "Unverified data" }] }) },
		{ pipe: envelope({ ...answer, records: [{ ...reference, record: { ...event, project: "other" } }] }) },
		{ pipe: { ...envelope(), data: { ...envelope().data, loop: {} } } },
		{ pipe: { ...envelope(), data: { ...envelope().data, loop: { notes: "off" } } } },
		{ pipe: { ...envelope(), data: { ...envelope().data, loop: { notes: "off", memory_size: 1 } } } },
		{ pipe: { ...envelope(), data: { ...envelope().data, loop: { notes: "off", memory_size: "0" } } } },
		{ pipe: { ...envelope(), data: { ...envelope().data, loop: { notes: "on", memory_size: 0 } } } },
		{ pipe: envelope({ ...answer, records: [reference, reference] }) },
	])("does not accept fabricated or unscoped success: %j", async (config) => {
		const { client } = fake(config);
		expect((await client.invoke(event, receipt)).outcome).toBe("unknown");
	});

	it("reconciles a 409 against original success without another invocation", async () => {
		const { client, calls } = fake({ pipeCode: 1 });
		expect((await client.invoke(event, receipt)).outcome).toBe("verified");
		expect(calls.filter((c) => c.args[0] === "pipe")).toHaveLength(1);
		expect(calls[1].args).toEqual(["agent", "logs", options.agent, "--trace-id", receipt.request_id, "--json"]);
	});

	it("keeps a consumed failed ID failed and checks the repository before permitting retry", async () => {
		const { client, calls } = fake({ pipeCode: 1, status: "failed" });
		const result = await client.invoke(event, receipt);
		expect(result.outcome).toBe("failed");
		expect(result.reason).toContain("record absent");
		expect(calls.filter((c) => c.args[0] === "pipe")).toHaveLength(1);
		expect(calls.some((c) => c.args[1].includes("/contents/"))).toBe(true);
	});

	it("retains evidence of a write that preceded invocation failure", async () => {
		const { client } = fake({ status: "failed", pipeCode: 1, blob: event });
		const result = await client.invoke(event, receipt);
		expect(result.outcome).toBe("failed");
		expect(result.evidence).toEqual(reference);
	});

	it.each([
		{ pipeCode: null, unavailable: true },
		{ pipeCode: null, status: "running" },
	])("leaves transport ambiguity unknown without retry: %j", async (config) => {
		const { client, calls } = fake(config);
		expect((await client.invoke(event, receipt)).outcome).toBe("unknown");
		expect(calls.filter((c) => c.args[0] === "pipe")).toHaveLength(1);
	});

	it("keeps event digest stable across key ordering and changes request ID per attempt", () => {
		const reordered = Object.fromEntries(Object.entries(event).reverse()) as Event;
		expect(newReceipt(reordered, options).event_digest).toBe(receipt.event_digest);
		expect(newReceipt(event, { ...options, attempt: 2 }).request_id).not.toBe(receipt.request_id);
	});

	it("bounds a hanging executable and preserves literal stdin without a shell", async () => {
		const result = await runner(1000)(
			{ executable: process.execPath, args: ["-e", "process.stdin.pipe(process.stdout)"] },
			[],
			"$(echo secret); `echo danger`",
		);
		expect(result.stdout).toBe("$(echo secret); `echo danger`");
		expect(result.code).toBe(0);
		expect(
			(await runner(50)({ executable: process.execPath, args: ["-e", "setInterval(() => {}, 1000)"] }, [])).code,
		).toBeNull();
	});
});

type Gh = {
	log: () => Promise<unknown>;
	tree: (args: { path: string; ref: string }) => Promise<unknown>;
	read: (args: { path: string; ref: string }) => Promise<unknown>;
	commit: (args: { files: { path: string; content: string }[] }) => Promise<unknown>;
};
async function skill() {
	const source = await readFile("examples/cross-harness-memory/harness-memory/scripts/memory.js", "utf8");
	// The production script executes with a capability-bound gh global, not Node imports.
	const create = new Function("gh", source.replace("export default", "return")) as (
		gh: Gh,
	) => (event: unknown) => Promise<{ records: { record: Event; path: string }[] }>;
	const files = new Map<string, string>();
	let commits = 0;
	const execute = create({
		log: async () => ({ ok: true, commits: [{ sha }] }),
		tree: async ({ path }) => ({
			ok: true,
			entries: [...files.keys()].filter((p) => p.startsWith(`${path}/`)).map((path) => ({ path, type: "blob" })),
		}),
		read: async ({ path }) => ({ ok: files.has(path), content: files.get(path) ?? null }),
		commit: async ({ files: changes }) => {
			commits++;
			for (const file of changes) files.set(file.path, file.content);
			return { ok: true, commit_oid: sha };
		},
	});
	return { execute, files, commits: () => commits };
}

describe("remote memory skill with offline GitHub capabilities", () => {
	it("atomically indexes records, preserves idempotency, and refuses conflicting content", async () => {
		const s = await skill();
		await s.execute(event);
		expect(s.files.size).toBe(2);
		await s.execute(Object.fromEntries(Object.entries(event).reverse()));
		expect(s.commits()).toBe(1);
		await expect(s.execute({ ...event, content: "conflict" })).rejects.toThrow("Conflicting");
		expect(s.commits()).toBe(1);
	});

	it("recalls linked findings in the same project and excludes other projects", async () => {
		const s = await skill();
		await s.execute(event);
		const followup = {
			...event,
			harness: "claude-code",
			event_id: "e2",
			content: "follow-up",
			parent: { harness: event.harness, session_id: event.session_id, event_id: event.event_id },
		};
		await s.execute(followup);
		const briefing = {
			schema_version: 1,
			kind: "briefing",
			project: event.project,
			harness: "popper",
			session_id: "s2",
			event_id: "b1",
			query: "Recall findings",
		};
		expect((await s.execute(briefing)).records.map((r) => r.record.content).sort()).toEqual([
			"follow-up",
			"marker-unique",
		]);
		expect((await s.execute({ ...briefing, project: "other" })).records).toEqual([]);
	});

	it("rejects cross-project index poisoning and absent parents before writing", async () => {
		const s = await skill();
		await expect(
			s.execute({ ...event, parent: { harness: "popper", session_id: "s", event_id: "missing" } }),
		).rejects.toThrow("Parent");
		expect(s.commits()).toBe(0);
		s.files.set(`journal/${event.project}/index.json`, JSON.stringify(["journal/other/codex/s/e.json"]));
		await expect(s.execute(event)).rejects.toThrow("Invalid project index");
	});
});

describe("client command-line retry and redaction", () => {
	it("redacts before transmission and blocks an unknown preceding attempt without invoking", async () => {
		const dir = await mkdtemp(join(tmpdir(), "memory-client-"));
		try {
			const fakeCli = join(dir, "paseo.mjs");
			const trace = join(dir, "calls.jsonl");
			await writeFile(
				fakeCli,
				String.raw`import { appendFileSync } from 'node:fs';
const args = process.argv.slice(2);
let input = ''; for await (const chunk of process.stdin) input += chunk;
appendFileSync(process.env.TRACE, JSON.stringify({args,input}) + '\n');
if (args[0] === 'agent') console.log(JSON.stringify({invocation:{action:'run',trace_id:args[4],status:'running'}}));
else { console.error('unreachable'); process.exitCode=1; }
`,
			);
			const eventFile = join(dir, "event.json");
			await writeFile(eventFile, JSON.stringify({ ...event, content: "private-marker" }));
			const redactions = join(dir, "redactions.json");
			await writeFile(redactions, JSON.stringify(["private"]));
			const first = join(dir, "first.json");
			const cli = resolve("examples/cross-harness-memory/client.ts");
			const args = [
				"--import",
				"tsx",
				cli,
				"--event",
				eventFile,
				"--agent",
				options.agent,
				"--repo",
				options.repo,
				"--branch",
				options.branch,
				"--redact-file",
				redactions,
			];
			const env = { ...process.env, PASEO_CLI_JS: fakeCli, TRACE: trace };
			const initial = spawnSync(process.execPath, [...args, "--receipt", first], { encoding: "utf8", env });
			expect(initial.status).toBe(1);
			const stored = JSON.parse(await readFile(first, "utf8"));
			expect(stored.outcome).toBe("unknown");
			const callLines = (await readFile(trace, "utf8"))
				.trim()
				.split("\n")
				.map((line) => JSON.parse(line));
			expect(JSON.parse(callLines[0].input).content).toBe("[REDACTED]-marker");
			expect(JSON.stringify(callLines)).not.toContain("private-marker");
			const next = spawnSync(
				process.execPath,
				[...args, "--receipt", join(dir, "second.json"), "--attempt", "2", "--previous", first],
				{ encoding: "utf8", env },
			);
			expect(next.status).toBe(1);
			expect(next.stderr).toContain("do not retry");
			const calls = (await readFile(trace, "utf8"))
				.trim()
				.split("\n")
				.map((line) => JSON.parse(line));
			expect(calls.filter((c) => c.args[0] === "pipe")).toHaveLength(1);
			const reused = spawnSync(process.execPath, [...args, "--receipt", first], { encoding: "utf8", env });
			expect(reused.status).toBe(1);
			expect(reused.stderr).toContain("EEXIST");
		} finally {
			await rm(dir, { recursive: true, force: true });
		}
	});
});

describe("briefing snapshot verification", () => {
	const briefing: Event = {
		schema_version: 1,
		kind: "briefing",
		project: event.project,
		harness: "popper",
		session_id: "fresh",
		event_id: "b1",
		query: "Recall findings",
	};
	it.each([false, true])(
		"checks indexed records even when the model reports an empty result (omit=%s)",
		async (omit) => {
			const r = newReceipt(briefing, options);
			const run: Runner = async (_command, args) => {
				let output: unknown;
				if (args[0] === "pipe")
					output = {
						...envelope(
							{ kind: "briefing", project: event.project, snapshot_sha: sha, records: omit ? [] : [reference] },
							briefing,
						),
						trace_id: r.request_id,
					};
				else if (args[0] === "agent") return { code: 1, stdout: "", stderr: "unavailable" };
				else if (args[1].includes("/compare/")) output = { status: "identical" };
				else
					output = {
						encoding: "base64",
						content: Buffer.from(
							JSON.stringify(args[1].includes("index.json") ? [reference.path] : event),
						).toString("base64"),
					};
				return { code: 0, stdout: JSON.stringify(output), stderr: "" };
			};
			const result = await memoryClient(run, { executable: "paseo", args: [] }).invoke(briefing, r);
			expect(result.outcome).toBe(omit ? "unknown" : "verified");
		},
	);
});

describe("client confirmed-failure retry", () => {
	it("reconciles the prior failure before sending a new request ID for the same logical event", async () => {
		const dir = await mkdtemp(join(tmpdir(), "memory-retry-"));
		try {
			const trace = join(dir, "trace.jsonl");
			const fakeCli = join(dir, "paseo.mjs");
			await writeFile(
				fakeCli,
				String.raw`import {appendFileSync} from 'node:fs';
const args=process.argv.slice(2);
let input='';for await(const chunk of process.stdin)input+=chunk;
appendFileSync(process.env.TRACE,JSON.stringify({args,input})+'\n');
if(args[0]==='agent') console.log(JSON.stringify({invocation:{action:'run',trace_id:args[4],status:'failed'}}));
else { console.error('transport failure');process.exitCode=1; }
`,
			);
			// gh is a separate executable; no network is used in this test.
			await writeFile(
				join(dir, "gh"),
				`#!${process.execPath}\nconst path=process.argv[3];
if(path.includes('/commits/'))console.log(JSON.stringify({sha:'a'.repeat(40)}));
else { console.log(JSON.stringify({status:'404'}));process.exitCode=1; }
`,
				{ mode: 0o755 },
			);
			const eventFile = join(dir, "event.json");
			const previous = join(dir, "previous.json");
			const next = join(dir, "next.json");
			await writeFile(eventFile, JSON.stringify(event));
			await writeFile(previous, JSON.stringify({ ...receipt, outcome: "unknown" }));
			const result = spawnSync(
				process.execPath,
				[
					"--import",
					"tsx",
					resolve("examples/cross-harness-memory/client.ts"),
					"--event",
					eventFile,
					"--agent",
					options.agent,
					"--repo",
					options.repo,
					"--branch",
					options.branch,
					"--attempt",
					"2",
					"--previous",
					previous,
					"--receipt",
					next,
				],
				{
					encoding: "utf8",
					env: { ...process.env, PASEO_CLI_JS: fakeCli, TRACE: trace, PATH: `${dir}:${process.env.PATH}` },
				},
			);
			expect(result.stderr).toBe("");
			expect(result.status).toBe(1); // The newly issued test invocation deliberately fails, too.
			const calls = (await readFile(trace, "utf8"))
				.trim()
				.split("\n")
				.map((line) => JSON.parse(line));
			expect(calls[0].args[0]).toBe("agent");
			const pipes = calls.filter((c) => c.args[0] === "pipe");
			expect(pipes).toHaveLength(1);
			expect(pipes[0].args[4]).toBe(newReceipt(event, { ...options, attempt: 2 }).request_id);
			expect(JSON.parse(pipes[0].input)).toEqual(event);
			expect(JSON.parse(await readFile(previous, "utf8")).outcome).toBe("failed");
			expect(JSON.parse(await readFile(next, "utf8")).outcome).toBe("failed");
		} finally {
			await rm(dir, { recursive: true, force: true });
		}
	});
});
