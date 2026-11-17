# Experiment protocol

Events contain schema_version: 1, kind: journal|briefing, project, harness:
codex|claude-code|popper, session_id, and event_id. All identity components are
1–64 ASCII letters, digits, underscores, or hyphens, beginning with a letter/digit.
Journal events add content (1–240 characters) and evidence_refs (0–2 nonempty
strings, at most 120 characters each). An optional parent contains harness,
session_id, and event_id in the same project. Briefings add query (1–240 characters).
Unknown fields are rejected. Source fields are correlation labels, not authentication.

One fixture project holds at most three records. Use a distinct project per
rotation and short synthetic findings; full briefing JSON must fit within 1800
characters to keep model working context small. Script observations also contain
generated program text, so this cap does not guarantee complete model delivery.
Use only final data.response claims verified against GitHub; loop.steps is truncated
and must not serve as a receipt.
The query describes the retrieval task; a briefing returns all indexed records
for that project, without model-based filtering.

Memory uses immutable journal/<project>/<harness>/<session>/<event>.json records
and an index at journal/<project>/index.json, committed atomically on the agent's
working branch. Requests are sequential. This index is an experiment convenience,
not a concurrent database. Skill code must never use save_note/get_notes.

Results are {kind, project, records:[{path, record, commit_sha}]}. A journal returns
one record; a briefing returns zero to three plus snapshot_sha. The local client
compares the cited paths against the project index at that snapshot, including
empty briefings, so an invented empty result is not accepted. Errors contain kind, project, error.
The local client independently checks cited content through GitHub at commit_sha
and confirms the commit is on the configured working branch. A successful model
response or invocation receipt alone does not prove a durable write.

Verified local receipts also retain runtime notes: off and numeric memory_size: 0.
Missing or inconsistent values make a trial unverified.
