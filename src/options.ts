import { parseArgs } from "node:util";
import type { ThinkingLevel } from "@mariozechner/pi-agent-core";

export const TOOL_NAMES = ["read", "bash", "edit", "write"] as const;
const THINKING_LEVELS = ["off", "minimal", "low", "medium", "high", "xhigh"] as const;

export function parseOptions(args: string[]) {
	const { values, positionals } = parseArgs({
		args,
		allowPositionals: true,
		options: {
			help: { type: "boolean", short: "h" },
			cwd: { type: "string" },
			model: { type: "string" },
			thinking: { type: "string" },
			extension: { type: "string", short: "e", multiple: true },
			skill: { type: "string", multiple: true },
			tools: { type: "string" },
			"no-tools": { type: "boolean" },
			"agent-dir": { type: "string" },
			session: { type: "string" },
			continue: { type: "boolean", short: "c" },
			"no-session": { type: "boolean" },
			print: { type: "boolean", short: "p" },
			json: { type: "boolean" },
		},
	});
	if ([values.session !== undefined, values.continue, values["no-session"]].filter(Boolean).length > 1) {
		throw new Error("Choose only one of --session, --continue, or --no-session");
	}
	if (values.tools !== undefined && values["no-tools"]) {
		throw new Error("Choose either --tools or --no-tools");
	}
	const tools = values["no-tools"] ? [] : (values.tools?.split(",").map((name) => name.trim()) ?? [...TOOL_NAMES]);
	for (const name of tools) {
		if (!TOOL_NAMES.some((tool) => tool === name)) {
			throw new Error(`Unknown tool '${name}'. Available tools: ${TOOL_NAMES.join(", ")}`);
		}
	}
	if (values.thinking !== undefined && !THINKING_LEVELS.some((level) => level === values.thinking)) {
		throw new Error(`Unknown thinking level '${values.thinking}'. Use: ${THINKING_LEVELS.join(", ")}`);
	}
	return {
		help: values.help ?? false,
		cwd: values.cwd,
		model: values.model ?? process.env.PPPR_MODEL,
		thinking: values.thinking as ThinkingLevel | undefined,
		extensions: values.extension ?? [],
		skills: values.skill ?? [],
		tools,
		agentDir: values["agent-dir"] ?? process.env.PPPR_AGENT_DIR,
		session: values.session,
		continue: values.continue ?? false,
		noSession: values["no-session"] ?? false,
		print: values.print ?? false,
		json: values.json ?? false,
		prompt: positionals.join("\n"),
	};
}

export type RigOptions = ReturnType<typeof parseOptions>;

export const HELP = `pppr — a terminal testing rig powered by Pi

Usage: pppr [options] [prompt]

  --cwd <directory>       Working directory for tools and project instructions
  --model <provider/id>   Pi model ID (or PPPR_MODEL; otherwise Pi's default)
  --thinking <level>      off, minimal, low, medium, high, xhigh
  -e, --extension <path>  Load a Pi extension (repeatable)
  --skill <path>          Load a Pi skill (repeatable)
  --tools <names>         Built-in tools (default: read,bash,edit,write)
  --no-tools              Disable built-in tools; extension tools still load
  --agent-dir <directory> Config/auth/session directory (default: ~/.pppr/agent)
  --session <file>        Open a Pi session file
  -c, --continue          Continue the latest session for this working directory
  --no-session           Keep the session in memory
  -p, --print             Process input and exit
  --json                 Process input and emit Pi events as JSONL
  -h, --help             Show help

No prompt in a terminal starts a plain interactive shell.
Piped stdin and command-line prompts are combined into one request.
Interactive commands: /new, /exit. Ctrl-C cancels work; Ctrl-D exits.
Credentials use Pi's provider environment variables or agent-dir/auth.json.
Automatic extensions and skills are disabled; pass each test resource explicitly.
`;
