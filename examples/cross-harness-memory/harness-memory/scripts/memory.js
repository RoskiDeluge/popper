/* Executed by Paseo inside its capability isolate; gh is the granted provider. */
export default async function memory(input) {
	const component = (v) => typeof v === "string" && /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(v);
	const text = (v, n) => typeof v === "string" && v.trim() && v.length <= n;
	const harness = (v) => ["codex", "claude-code", "popper"].includes(v);
	const pathOf = (e) => `journal/${e.project}/${e.harness}/${e.session_id}/${e.event_id}.json`;
	const stable = (v) => Array.isArray(v) ? v.map(stable) : v && typeof v === "object"
		? Object.fromEntries(Object.keys(v).sort().map((k) => [k, stable(v[k])])) : v;
	const equal = (a, b) => JSON.stringify(stable(a)) === JSON.stringify(stable(b));
	const validate = (e) => {
		if (!e || e.schema_version !== 1 || !["journal", "briefing"].includes(e.kind) ||
			!component(e.project) || !harness(e.harness) || !component(e.session_id) || !component(e.event_id)) {
			throw new Error("Invalid identity/version/kind");
		}
		const keys = ["schema_version", "kind", "project", "harness", "session_id", "event_id",
			...(e.kind === "journal" ? ["content", "evidence_refs", "parent"] : ["query"])];
		if (Object.keys(e).some((k) => !keys.includes(k))) throw new Error("Unknown event field");
		if (e.kind === "journal") {
			if (!text(e.content, 240) || !Array.isArray(e.evidence_refs) || e.evidence_refs.length > 2 ||
				e.evidence_refs.some((v) => !text(v, 120))) throw new Error("Invalid journal");
			if (e.parent !== undefined && (!e.parent || !harness(e.parent.harness) || !component(e.parent.session_id) || !component(e.parent.event_id) ||
				Object.keys(e.parent).sort().join() !== "event_id,harness,session_id")) throw new Error("Invalid parent");
		} else if (!text(e.query, 240)) throw new Error("Invalid query");
	};
	validate(input);
	const root = `journal/${input.project}`;
	const indexPath = `${root}/index.json`;
	const head = await gh.log({ limit: 1 });
	const sha = head.commits?.[0]?.sha;
	if (!head.ok || !/^[a-f0-9]{40}$/.test(sha)) throw new Error("Missing working-branch snapshot");
	const tree = await gh.tree({ path: root, ref: sha });
	if (!tree.ok || !Array.isArray(tree.entries)) throw new Error("Cannot list project");
	let paths = [];
	if (tree.entries.some((entry) => entry.path === indexPath && entry.type === "blob")) {
		const blob = await gh.read({ path: indexPath, ref: sha });
		if (!blob.ok) throw new Error("Cannot read project index");
		paths = JSON.parse(blob.content);
	}
	const safePath = (path) => typeof path === "string" && path.startsWith(`${root}/`) &&
		new RegExp(`^journal/${input.project}/(codex|claude-code|popper)/[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}/[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}\\.json$`).test(path);
	if (!Array.isArray(paths) || paths.length > 3 || paths.some((p) => !safePath(p)) || new Set(paths).size !== paths.length) {
		throw new Error("Invalid project index");
	}
	const read = async (path) => {
		const blob = await gh.read({ path, ref: sha });
		if (!blob.ok) throw new Error("Indexed record unavailable");
		const record = JSON.parse(blob.content);
		validate(record);
		if (record.kind !== "journal" || record.project !== input.project || pathOf(record) !== path) throw new Error("Record scope mismatch");
		return { path, record, commit_sha: sha };
	};
	const result = (records) => {
		const answer = { kind: input.kind, project: input.project, records, ...(input.kind === "briefing" ? { snapshot_sha: sha } : {}) };
		// Keep the result small; generated program text also occupies observation space.
		if (JSON.stringify(answer).length > 1800) throw new Error("Result exceeds experiment observation budget; use shorter findings");
		return answer;
	};
	if (input.kind === "briefing") {
		const records = [];
		for (const path of paths) records.push(await read(path));
		return result(records);
	}
	const path = pathOf(input);
	// Check even an unindexed record so retries never overwrite a prior event.
	const existing = await gh.read({ path, ref: sha });
	if (existing.ok) {
		const record = JSON.parse(existing.content);
		if (!equal(record, input)) throw new Error("Conflicting logical event");
		if (!paths.includes(path)) throw new Error("Existing record missing from index; operator reconciliation required");
		return result([{ path, record, commit_sha: sha }]);
	}
	if (paths.includes(path)) throw new Error("Indexed record missing");
	if (paths.length >= 3) throw new Error("Fixture project supports at most three records; use a new project per rotation");
	if (input.parent) {
		const parent = pathOf({ ...input.parent, project: input.project });
		if (!paths.includes(parent)) throw new Error("Parent must exist in this project");
		await read(parent);
	}
	result([{ path, record: input, commit_sha: sha }]);
	const commit = await gh.commit({ message: `Journal ${input.project}/${input.event_id}`, files: [
		{ path, content: `${JSON.stringify(input)}\n` },
		{ path: indexPath, content: `${JSON.stringify([...paths, path].sort())}\n` },
	] });
	if (!commit.ok || !/^[a-f0-9]{40}$/.test(commit.commit_oid)) throw new Error("Commit not confirmed");
	return result([{ path, record: input, commit_sha: commit.commit_oid }]);
}
