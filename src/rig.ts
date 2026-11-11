import { access, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import type { Api, Model } from "@mariozechner/pi-ai";
import {
	AuthStorage,
	createAgentSession,
	createCodingTools,
	DefaultResourceLoader,
	ModelRegistry,
	SessionManager,
	SettingsManager,
} from "@mariozechner/pi-coding-agent";
import type { RigOptions } from "./options.js";

/** Pi owns all agent behavior; this function only selects the test inputs. */
export async function createRig(options: RigOptions) {
	const cwd = resolve(options.cwd ?? process.cwd());
	if (!(await stat(cwd)).isDirectory()) throw new Error(`Not a directory: ${cwd}`);
	await Promise.all([...options.extensions, ...options.skills].map((path) => access(resolve(path))));
	const agentDir = resolve(options.agentDir ?? join(homedir(), ".pppr", "agent"));
	const settingsManager = SettingsManager.create(cwd, agentDir);
	const authStorage = AuthStorage.create(join(agentDir, "auth.json"));
	const modelRegistry = new ModelRegistry(authStorage, join(agentDir, "models.json"));
	const resourceLoader = new DefaultResourceLoader({
		cwd,
		agentDir,
		settingsManager,
		noExtensions: true,
		noSkills: true,
		noPromptTemplates: true,
		noThemes: true,
		additionalExtensionPaths: options.extensions.map((path) => resolve(path)),
		additionalSkillPaths: options.skills.map((path) => resolve(path)),
	});
	await resourceLoader.reload();
	const { errors, runtime } = resourceLoader.getExtensions();
	if (errors.length) {
		throw new Error(errors.map(({ path, error }) => `${path}: ${error}`).join("\n"));
	}
	const skillDiagnostics = resourceLoader.getSkills().diagnostics;
	if (skillDiagnostics.length) {
		throw new Error(skillDiagnostics.map(({ path, message }) => `${path ?? "skill"}: ${message}`).join("\n"));
	}
	// Pi's CLI applies these before resolving an extension-provided model, too.
	for (const { name, config } of runtime.pendingProviderRegistrations) modelRegistry.registerProvider(name, config);
	runtime.pendingProviderRegistrations = [];

	let model: Model<Api> | undefined;
	if (options.model) {
		const separator = options.model.indexOf("/");
		if (separator < 1) throw new Error("--model must be a full Pi provider/model-id");
		model = modelRegistry.find(options.model.slice(0, separator), options.model.slice(separator + 1));
		if (!model) throw new Error(`Unknown Pi model: ${options.model}`);
	}
	const sessionDir = join(agentDir, "sessions");
	const sessionManager = options.noSession
		? SessionManager.inMemory(cwd)
		: options.session
			? SessionManager.open(resolve(options.session), sessionDir)
			: options.continue
				? SessionManager.continueRecent(cwd, sessionDir)
				: SessionManager.create(cwd, sessionDir);
	const result = await createAgentSession({
		cwd,
		agentDir,
		settingsManager,
		authStorage,
		modelRegistry,
		resourceLoader,
		sessionManager,
		model,
		thinkingLevel: options.thinking,
		tools: createCodingTools(cwd).filter((tool) => options.tools.includes(tool.name)),
	});
	return result;
}
