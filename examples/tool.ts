import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";

/** Replace this body with a call to the agentic tool you want to exercise. */
export default function (pi: ExtensionAPI) {
	pi.registerTool({
		name: "probe",
		label: "Probe",
		description: "Echo a value through the tool under test.",
		parameters: Type.Object({ value: Type.String() }),
		async execute(_id, { value }) {
			return { content: [{ type: "text", text: value }], details: { value } };
		},
	});
}
