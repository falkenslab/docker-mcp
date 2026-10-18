# Architecture

```
src/
├── server.ts          entry point: arguments, stdio transport, shutdown
├── createServer.ts    the McpServer with its instructions and tools (tests connect to it in memory)
├── instructions.ts    the rules every client reads
├── version.ts         name, version and command, from package.json
├── settings.ts        setting(): environment variables, unexpanded placeholders as not set
├── dataDir.ts         where state and caches live
├── requirements.ts    programs the person installs apart: checked, explained, never installed
└── tools/
    ├── index.ts       every tool, in order
    ├── types.ts       RegisterTool
    ├── reply.ts       structured result + JSON text
    └── <tool>.ts      one tool per file
```

- **Flow**: the client starts `dist/server.mjs`; `createServer()` registers every tool from `TOOLS`; each call validates its input with zod, does its work and returns `reply(...)`.
- **The domain's logic** grows in its own modules under `src/` (a client for an API, a parser), never inside a tool file: a tool is a schema, a description, annotations and a call.
- **Requirements**: with an empty `REQUIREMENTS` there's no `check_requirements` tool; with any, it's registered and `server_info` reports them.
- **The bundle**: esbuild writes everything into `dist/server.mjs` (ADR-001); `docs/scripts/tools-reference.mjs` lists its tools for the site.
