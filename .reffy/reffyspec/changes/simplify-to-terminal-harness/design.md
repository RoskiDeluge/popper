# Design

Use `createAgentSession`, `DefaultResourceLoader`, `AuthStorage`, `ModelRegistry`,
`SettingsManager`, and `SessionManager` from Pi. Do not create an alternative agent
loop, tool protocol, persistence format, or effect broker.

The only application-specific work is argument parsing, selecting explicit test
resources, and translating stdin/stdout into Pi prompts/events. Pi builds the
system prompt and loads project instructions. Automatic extensions and skills are
disabled so a run exercises only resources selected on its command line.

Root `src/` is the executable application. Published Pi dependencies replace the
local monorepo workspace links. Historical `packages/` source was initially kept
outside the rig's checks and installation, then deleted at the user's request.
Git history preserves that source; the application has no local Pi fork.

Plain text streams assistant output to stdout and tool activity to stderr. JSON
mode writes unmodified Pi events as JSONL. Interactive mode supports cancellation,
EOF, new sessions, and exit without a custom full-screen UI.
