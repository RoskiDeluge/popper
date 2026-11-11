#!/usr/bin/env node
import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline";
import type { AgentSession, AgentSessionEvent } from "@mariozechner/pi-coding-agent";
import { HELP, parseOptions } from "./options.js";
import { createRig } from "./rig.js";

function renderEvent(event: AgentSessionEvent, json: boolean): void {
	if (json) {
		stdout.write(`${JSON.stringify(event)}\n`);
	} else if (event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
		stdout.write(event.assistantMessageEvent.delta);
	} else if (event.type === "message_end" && event.message.role === "assistant") {
		stdout.write("\n");
	} else if (event.type === "tool_execution_start") {
		process.stderr.write(`[${event.toolName}] ${JSON.stringify(event.args)}\n`);
	} else if (event.type === "tool_execution_end") {
		process.stderr.write(`[${event.toolName}] ${event.isError ? "error" : "done"}\n`);
	}
}

async function prompt(session: AgentSession, text: string): Promise<void> {
	await session.prompt(text);
	const last = session.state.messages.at(-1);
	if (last?.role === "assistant" && (last.stopReason === "error" || last.stopReason === "aborted")) {
		throw new Error(last.errorMessage || `Request ${last.stopReason}`);
	}
}

async function interactive(session: AgentSession): Promise<void> {
	const lines = createInterface({ input: stdin, output: stdout, terminal: true });
	const iterator = lines[Symbol.asyncIterator]();
	let busy = false;
	lines.on("SIGINT", () => {
		if (busy) void session.abort();
		else lines.close();
	});
	lines.on("close", () => {
		if (busy) void session.abort();
	});
	const close = () => lines.close();
	process.on("SIGINT", close);
	process.on("SIGTERM", close);
	try {
		for (;;) {
			lines.setPrompt("pppr> ");
			lines.prompt();
			const next = await iterator.next();
			if (next.done) break;
			const text = next.value.trim();
			if (!text) continue;
			if (text === "/exit" || text === "/quit") break;
			busy = true;
			try {
				if (text === "/new") await session.newSession();
				else await prompt(session, text);
			} catch (error) {
				process.stderr.write(`${error instanceof Error ? error.message : error}\n`);
			} finally {
				busy = false;
			}
		}
	} finally {
		process.off("SIGINT", close);
		process.off("SIGTERM", close);
		lines.close();
	}
}

async function main(): Promise<void> {
	const options = parseOptions(process.argv.slice(2));
	if (options.help) {
		stdout.write(HELP);
		return;
	}
	let piped = "";
	if (!stdin.isTTY) {
		stdin.setEncoding("utf8");
		for await (const chunk of stdin) piped += chunk;
	}
	const text = [options.prompt, piped.trim()].filter(Boolean).join("\n\n");
	const isInteractive = Boolean(stdin.isTTY) && !options.print && !options.json && !text;
	if (!isInteractive && !text) throw new Error("Provide a prompt or pipe input. Use --help for usage.");
	const { session, modelFallbackMessage } = await createRig(options);
	const unsubscribe = session.subscribe((event) => renderEvent(event, options.json));
	const cancel = () => {
		process.exitCode = 130;
		void session.abort();
	};
	process.on("SIGINT", cancel);
	process.on("SIGTERM", cancel);
	try {
		if (modelFallbackMessage) process.stderr.write(`${modelFallbackMessage}\n`);
		await session.bindExtensions({
			onError: ({ extensionPath, error }) => {
				process.stderr.write(`Extension error (${extensionPath}): ${error}\n`);
				process.exitCode = 1;
			},
		});
		if (isInteractive) {
			process.stderr.write(`Model: ${session.model ? `${session.model.provider}/${session.model.id}` : "none"}\n`);
			process.stderr.write(`Tools: ${session.getActiveToolNames().join(", ")}\n`);
			await interactive(session);
		} else {
			await prompt(session, text);
		}
	} finally {
		process.off("SIGINT", cancel);
		process.off("SIGTERM", cancel);
		try {
			await session.extensionRunner?.emit({ type: "session_shutdown" });
		} finally {
			unsubscribe();
			session.dispose();
		}
	}
}

main().catch((error: unknown) => {
	process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
	process.exitCode = process.exitCode || 1;
});
