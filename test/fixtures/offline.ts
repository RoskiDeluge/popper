import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { type AssistantMessage, createAssistantMessageEventStream } from "@mariozechner/pi-ai";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";

/** Offline provider: exercises Pi's real loop, tools, events, and persistence. */
export default function (pi: ExtensionAPI) {
	pi.registerTool({
		name: "rig_probe",
		label: "Rig probe",
		description: "Write an observable artifact in the session working directory.",
		parameters: Type.Object({ value: Type.String() }),
		async execute(_id, { value }, _signal, _update, ctx) {
			await writeFile(join(ctx.cwd, "probe.txt"), value);
			return { content: [{ type: "text", text: value }], details: { value } };
		},
	});
	pi.on("session_start", async (_event, ctx) => {
		await writeFile(join(ctx.cwd, "started.txt"), "started");
	});
	pi.on("session_shutdown", async (_event, ctx) => {
		await writeFile(join(ctx.cwd, "stopped.txt"), "stopped");
	});
	pi.registerProvider("rig-offline", {
		api: "openai-completions",
		apiKey: "offline-test-key",
		baseUrl: "http://localhost:1/never-called",
		models: [
			{
				id: "probe",
				name: "Offline probe",
				reasoning: false,
				input: ["text"],
				cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
				contextWindow: 32000,
				maxTokens: 1024,
			},
		],
		streamSimple(model, context, options) {
			const stream = createAssistantMessageEventStream();
			queueMicrotask(() => {
				const last = context.messages.at(-1);
				const done = last?.role === "toolResult";
				const text = done ? "probe completed" : "";
				const message: AssistantMessage = {
					role: "assistant",
					api: model.api,
					provider: model.provider,
					model: model.id,
					timestamp: Date.now(),
					stopReason: options?.signal?.aborted ? "aborted" : done ? "stop" : "toolUse",
					content: done
						? [{ type: "text", text }]
						: [{ type: "toolCall", id: "probe-call", name: "rig_probe", arguments: { value: "rig works" } }],
					usage: {
						input: 0,
						output: 0,
						cacheRead: 0,
						cacheWrite: 0,
						totalTokens: 0,
						cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
					},
				};
				stream.push({ type: "start", partial: message });
				if (done) stream.push({ type: "text_delta", contentIndex: 0, delta: text, partial: message });
				if (message.stopReason === "aborted") stream.push({ type: "error", reason: "aborted", error: message });
				else stream.push({ type: "done", reason: done ? "stop" : "toolUse", message });
				stream.end();
			});
			return stream;
		},
	});
}
