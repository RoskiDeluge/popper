import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { isDeepStrictEqual, parseArgs } from "node:util";

export type Event = {
	schema_version: 1;
	kind: "journal" | "briefing";
	project: string;
	harness: "codex" | "claude-code" | "popper";
	session_id: string;
	event_id: string;
	content?: string;
	evidence_refs?: string[];
	parent?: { harness: Event["harness"]; session_id: string; event_id: string };
	query?: string;
};
export type Command = { executable: string; args: string[] };
export type Result = { code: number | null; stdout: string; stderr: string };
export type Runner = (command: Command, args: string[], input?: string) => Promise<Result>;
export type Options = { agent: string; repo: string; branch: string; attempt: number };
export type Receipt = {
	version: 1;
	agent: string;
	repo: string;
	branch: string;
	event_digest: string;
	request_id: string;
	attempt: number;
	outcome: "unknown" | "failed" | "verified";
	reason: string;
	duration_ms: number;
	runtime?: { notes: "off"; memory_size: 0 };
	evidence?: unknown;
};

function object(value: unknown): Record<string, unknown> {
	if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Expected an object");
	return value as Record<string, unknown>;
}
function component(value: unknown): asserts value is string {
	if (typeof value !== "string" || !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(value)) {
		throw new Error("Unsafe or missing identity component");
	}
}
function text(value: unknown, limit: number): asserts value is string {
	if (typeof value !== "string" || !value.trim() || value.length > limit) throw new Error("Invalid text length");
}
export function validateEvent(value: unknown): Event {
	const event = object(value);
	const common = ["schema_version", "kind", "project", "harness", "session_id", "event_id"];
	const fields = event.kind === "journal" ? ["content", "evidence_refs", "parent"] : ["query"];
	if (Object.keys(event).some((key) => ![...common, ...fields].includes(key))) throw new Error("Unknown event field");
	if (event.schema_version !== 1 || !["journal", "briefing"].includes(event.kind as string)) {
		throw new Error("Invalid event version or kind");
	}
	for (const key of ["project", "session_id", "event_id"]) component(event[key]);
	if (!["codex", "claude-code", "popper"].includes(event.harness as string)) throw new Error("Invalid harness");
	if (event.kind === "journal") {
		text(event.content, 240);
		if (!Array.isArray(event.evidence_refs) || event.evidence_refs.length > 2)
			throw new Error("Invalid evidence_refs");
		for (const ref of event.evidence_refs) text(ref, 120);
		if (event.parent !== undefined) {
			const parent = object(event.parent);
			if (Object.keys(parent).sort().join() !== "event_id,harness,session_id") throw new Error("Invalid parent");
			if (!["codex", "claude-code", "popper"].includes(parent.harness as string))
				throw new Error("Invalid parent harness");
			component(parent.session_id);
			component(parent.event_id);
		}
	} else text(event.query, 240);
	return event as Event;
}
export function recordPath(event: Event): string {
	return `journal/${event.project}/${event.harness}/${event.session_id}/${event.event_id}.json`;
}
function digest(event: Event): string {
	const stable = (value: unknown): unknown => {
		if (Array.isArray(value)) return value.map(stable);
		if (value && typeof value === "object") {
			return Object.fromEntries(
				Object.entries(value)
					.sort(([a], [b]) => a.localeCompare(b))
					.map(([k, v]) => [k, stable(v)]),
			);
		}
		return value;
	};
	return createHash("sha256")
		.update(JSON.stringify(stable(event)))
		.digest("hex");
}
export function newReceipt(event: Event, options: Options): Receipt {
	if (!/^[\w-]+\/[\w-]+$/.test(options.agent) || !/^[\w.-]+\/[\w.-]+$/.test(options.repo)) {
		throw new Error("Expected workspace/agent and owner/repo");
	}
	text(options.branch, 200);
	if (!Number.isSafeInteger(options.attempt) || options.attempt < 1) throw new Error("Invalid attempt");
	return {
		version: 1,
		...options,
		event_digest: digest(event),
		request_id: `${event.project}:${event.harness}:${event.session_id}:${event.event_id}:attempt-${options.attempt}`,
		outcome: "unknown",
		reason: "Not yet reconciled",
		duration_ms: 0,
	};
}

// No shell, bounded output, and a hard kill deadline even if the executable hangs.
export function runner(timeoutMs: number): Runner {
	return (command, args, input) =>
		new Promise((done) => {
			const child = spawn(command.executable, [...command.args, ...args], { stdio: ["pipe", "pipe", "pipe"] });
			let stdout = "";
			let stderr = "";
			let stopped = false;
			const finish = (code: number | null) => {
				if (stopped) return;
				stopped = true;
				clearTimeout(timer);
				done({ code, stdout, stderr });
			};
			const timer = setTimeout(() => {
				child.kill("SIGKILL");
				finish(null);
			}, timeoutMs);
			const collect = (chunk: Buffer, target: "stdout" | "stderr") => {
				if (target === "stdout") stdout += chunk.toString();
				else stderr += chunk.toString();
				if (stdout.length + stderr.length > 1_000_000) {
					child.kill("SIGKILL");
					finish(null);
				}
			};
			child.stdout.on("data", (chunk: Buffer) => collect(chunk, "stdout"));
			child.stderr.on("data", (chunk: Buffer) => collect(chunk, "stderr"));
			child.on("error", () => finish(null));
			child.on("close", finish);
			child.stdin.on("error", () => {});
			child.stdin.end(input ?? "");
		});
}

export function memoryClient(run: Runner, paseo: Command, github: Command = { executable: "gh", args: [] }) {
	async function json(command: Command, args: string[]): Promise<unknown> {
		const result = await run(command, args);
		if (result.code !== 0) throw new Error("Evidence lookup unavailable");
		return JSON.parse(result.stdout);
	}
	async function failed(event: Event, receipt: Receipt, reason: string): Promise<Receipt> {
		if (event.kind === "briefing") return { ...receipt, outcome: "failed", reason };
		const api = `repos/${receipt.repo}`;
		const head = object(await json(github, ["api", `${api}/commits/${encodeURIComponent(receipt.branch)}`]));
		if (typeof head.sha !== "string" || !/^[a-f0-9]{40}$/.test(head.sha)) throw new Error("Invalid branch head");
		const path = recordPath(event);
		const result = await run(github, ["api", `${api}/contents/${path}?ref=${head.sha}`]);
		const blob = object(JSON.parse(result.stdout));
		if (result.code !== 0) {
			if (String(blob.status) !== "404") throw new Error("Cannot reconcile repository after failure");
			return { ...receipt, outcome: "failed", reason: `${reason}; record absent at ${head.sha}` };
		}
		const evidence = { path, record: event, commit_sha: head.sha };
		await verifyRecord(evidence, event, receipt);
		return { ...receipt, outcome: "failed", reason: `${reason}; matching record exists`, evidence };
	}
	async function verifyRecord(ref: Record<string, unknown>, event: Event, receipt: Receipt): Promise<void> {
		if (Object.keys(ref).sort().join() !== "commit_sha,path,record") throw new Error("Unknown citation fields");
		if (typeof ref.commit_sha !== "string" || !/^[a-f0-9]{40}$/.test(ref.commit_sha))
			throw new Error("Invalid commit");
		const record = validateEvent(ref.record);
		if (record.kind !== "journal" || record.project !== event.project || ref.path !== recordPath(record)) {
			throw new Error("Record scope or path mismatch");
		}
		if (event.kind === "journal" && !isDeepStrictEqual(record, event)) throw new Error("Journal content mismatch");
		const api = `repos/${receipt.repo}`;
		const comparison = object(
			await json(github, ["api", `${api}/compare/${ref.commit_sha}...${encodeURIComponent(receipt.branch)}`]),
		);
		if (!["ahead", "identical"].includes(String(comparison.status)))
			throw new Error("Commit is outside working branch");
		const path = String(ref.path).split("/").map(encodeURIComponent).join("/");
		const blob = object(await json(github, ["api", `${api}/contents/${path}?ref=${ref.commit_sha}`]));
		if (blob.encoding !== "base64" || typeof blob.content !== "string") throw new Error("Missing repository blob");
		if (!isDeepStrictEqual(JSON.parse(Buffer.from(blob.content, "base64").toString("utf8")), record)) {
			throw new Error("Repository content mismatch");
		}
	}
	async function assess(envelope: unknown, event: Event, receipt: Receipt): Promise<Receipt> {
		const result = object(envelope);
		if (result.trace_id !== receipt.request_id) throw new Error("Trace mismatch");
		if (result.ok === false) return failed(event, receipt, "Original invocation failed");
		if (result.ok !== true) throw new Error("Missing invocation outcome");
		const data = object(result.data);
		if (data.action !== "run" || !isDeepStrictEqual(JSON.parse(String(object(data.payload).input)), event)) {
			throw new Error("Original invocation input mismatch");
		}
		const loop = object(data.loop);
		if (loop.notes !== "off" || loop.memory_size !== 0)
			throw new Error("Runtime did not confirm notes off with memory_size 0; trial isolation is unverified");
		if (typeof data.response !== "string") throw new Error("Missing skill response");
		const answer = object(JSON.parse(data.response));
		if (answer.kind !== event.kind || answer.project !== event.project) throw new Error("Response scope mismatch");
		if (answer.error) return failed(event, receipt, "Skill reported failure");
		const fields = ["kind", "project", "records", ...(event.kind === "briefing" ? ["snapshot_sha"] : [])];
		if (Object.keys(answer).some((key) => !fields.includes(key))) throw new Error("Unknown response fields");
		if (!Array.isArray(answer.records) || answer.records.length > 3) throw new Error("Invalid record list");
		if (event.kind === "journal" && answer.records.length !== 1) throw new Error("Missing journal record");
		if (event.kind === "briefing") {
			if (typeof answer.snapshot_sha !== "string" || !/^[a-f0-9]{40}$/.test(answer.snapshot_sha)) {
				throw new Error("Missing briefing snapshot");
			}
			const api = `repos/${receipt.repo}`;
			const comparison = object(
				await json(github, [
					"api",
					`${api}/compare/${answer.snapshot_sha}...${encodeURIComponent(receipt.branch)}`,
				]),
			);
			if (!["ahead", "identical"].includes(String(comparison.status)))
				throw new Error("Snapshot outside working branch");
			const lookup = await run(github, [
				"api",
				`${api}/contents/journal/${event.project}/index.json?ref=${answer.snapshot_sha}`,
			]);
			const blob = object(JSON.parse(lookup.stdout));
			let indexed: unknown = [];
			if (lookup.code === 0 && blob.encoding === "base64" && typeof blob.content === "string") {
				indexed = JSON.parse(Buffer.from(blob.content, "base64").toString("utf8"));
			} else if (lookup.code === 0 || String(blob.status) !== "404") throw new Error("Cannot verify project index");
			const cited = answer.records.map((item: unknown) => object(item).path);
			if (!Array.isArray(indexed) || !isDeepStrictEqual([...indexed].sort(), [...cited].sort())) {
				throw new Error("Briefing omits or invents indexed records");
			}
			if (answer.records.some((item: unknown) => object(item).commit_sha !== answer.snapshot_sha)) {
				throw new Error("Briefing records use inconsistent snapshots");
			}
		}
		const paths = new Set();
		for (const item of answer.records) {
			const ref = object(item);
			if (paths.has(ref.path)) throw new Error("Duplicate record citation");
			paths.add(ref.path);
			await verifyRecord(ref, event, receipt);
		}
		return {
			...receipt,
			outcome: "verified",
			reason: "Invocation and cited repository records verified",
			evidence: answer,
			runtime: { notes: "off", memory_size: 0 },
		};
	}
	async function reconcile(event: Event, receipt: Receipt): Promise<Receipt> {
		try {
			const log = object(
				await json(paseo, ["agent", "logs", receipt.agent, "--trace-id", receipt.request_id, "--json"]),
			);
			const invocation = object(log.invocation);
			if (invocation.trace_id !== receipt.request_id || invocation.action !== "run")
				throw new Error("Log identity mismatch");
			if (invocation.status === "failed") return await failed(event, receipt, "Original invocation failed");
			if (invocation.status !== "succeeded") throw new Error("Invocation is still running or unknown");
			return await assess(invocation.result, event, receipt);
		} catch (error) {
			return {
				...receipt,
				outcome: "unknown",
				reason: error instanceof Error ? error.message : "Unverifiable invocation",
			};
		}
	}
	async function invoke(event: Event, receipt: Receipt): Promise<Receipt> {
		const start = Date.now();
		let assessed: Receipt;
		try {
			const result = await run(
				paseo,
				["pipe", receipt.agent, "--raw", "--request-id", receipt.request_id],
				JSON.stringify(event),
			);
			// All nonzero/ambiguous responses are looked up; stderr is never assumed to prove delivery.
			assessed =
				result.code === 0
					? await assess(JSON.parse(result.stdout), event, receipt)
					: await reconcile(event, receipt);
		} catch {
			assessed = await reconcile(event, receipt);
		}
		return { ...assessed, duration_ms: Date.now() - start };
	}
	return { invoke, reconcile };
}

async function main() {
	const { values } = parseArgs({
		options: {
			event: { type: "string" },
			agent: { type: "string" },
			repo: { type: "string" },
			branch: { type: "string" },
			receipt: { type: "string" },
			previous: { type: "string" },
			reconcile: { type: "boolean" },
			attempt: { type: "string", default: "1" },
			"timeout-ms": { type: "string", default: "75000" },
			"redact-file": { type: "string" },
		},
	});
	if (!values.event || !values.agent || !values.repo || !values.branch || !values.receipt) {
		throw new Error("Required: --event FILE --agent WS/AGENT --repo OWNER/REPO --branch BRANCH --receipt FILE");
	}
	let input = await readFile(values.event, "utf8");
	if (values["redact-file"]) {
		const secrets: unknown = JSON.parse(await readFile(values["redact-file"], "utf8"));
		if (!Array.isArray(secrets) || secrets.some((s) => typeof s !== "string" || !s))
			throw new Error("Expected nonempty redaction strings");
		const event = validateEvent(JSON.parse(input));
		const redact = (value: string) =>
			secrets.reduce<string>((value, secret) => value.split(String(secret)).join("[REDACTED]"), value);
		if (event.content) event.content = redact(event.content);
		if (event.query) event.query = redact(event.query);
		if (event.evidence_refs) event.evidence_refs = event.evidence_refs.map(redact);
		input = JSON.stringify(event);
	}
	const event = validateEvent(JSON.parse(input));
	let receipt = newReceipt(event, {
		agent: values.agent,
		repo: values.repo,
		branch: values.branch,
		attempt: Number(values.attempt),
	});
	const timeout = Number(values["timeout-ms"]);
	if (!Number.isInteger(timeout) || timeout < 1 || timeout > 120000) throw new Error("timeout-ms must be 1..120000");
	const paseo = process.env.PASEO_CLI_JS
		? { executable: process.execPath, args: [resolve(process.env.PASEO_CLI_JS)] }
		: { executable: "paseo", args: [] };
	const client = memoryClient(runner(timeout), paseo);
	if (values.reconcile) {
		const stored = object(JSON.parse(await readFile(values.receipt, "utf8")));
		if (
			["agent", "repo", "branch", "event_digest", "request_id"].some((key) => stored[key] !== object(receipt)[key])
		) {
			throw new Error("Receipt does not match this event/configuration");
		}
		receipt = await client.reconcile(event, receipt);
	} else {
		if (receipt.attempt > 1) {
			if (!values.previous) throw new Error("New attempt requires --previous RECEIPT and reconciliation");
			const previous = object(JSON.parse(await readFile(values.previous, "utf8")));
			const expected = newReceipt(event, { ...receipt, attempt: receipt.attempt - 1 });
			if (
				["agent", "repo", "branch", "event_digest", "request_id"].some(
					(key) => previous[key] !== object(expected)[key],
				)
			) {
				throw new Error("Previous receipt does not match the preceding attempt");
			}
			const checked = await client.reconcile(event, expected);
			await writeFile(values.previous, `${JSON.stringify(checked, null, 2)}\n`, { mode: 0o600 });
			if (checked.outcome !== "failed") throw new Error(`Prior attempt is ${checked.outcome}; do not retry`);
		}
		// Reserve the receipt before any side effect. Reusing it requires --reconcile.
		await writeFile(values.receipt, `${JSON.stringify(receipt, null, 2)}\n`, { flag: "wx", mode: 0o600 });
		receipt = await client.invoke(event, receipt);
	}
	await writeFile(values.receipt, `${JSON.stringify(receipt, null, 2)}\n`, { mode: 0o600 });
	console.log(JSON.stringify(receipt, null, 2));
	process.exitCode = receipt.outcome === "verified" ? 0 : 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
	main().catch((error: unknown) => {
		console.error(error instanceof Error ? error.message : "Client failed");
		process.exitCode = 1;
	});
}
