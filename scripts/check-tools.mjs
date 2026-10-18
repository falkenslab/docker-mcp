// Starts the built server (dist/server.mjs) as a client would and checks its tools/list strictly: every
// tool has a title, a description, an input and an output schema, and says whether it only reads.
// A tool missing any of them is how a client ends up guessing. Run after `npm run build`.
//   node scripts/check-tools.mjs
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const server = fileURLToPath(new URL("../dist/server.mjs", import.meta.url));
const client = new Client({ name: "check-tools", version: "0.0.0" });
await client.connect(new StdioClientTransport({ command: process.execPath, args: [server], stderr: "ignore" }));
const { tools } = await client.listTools();
await client.close();

const problems = [];
for (const tool of tools) {
  const say = (problem) => problems.push(`${tool.name}: ${problem}`);
  if (!/^[a-z][a-z0-9_]*$/.test(tool.name)) say("its name isn't snake_case");
  if (!tool.title) say("no title");
  if (!tool.description || tool.description.length < 40) say("no description, or too short for a model to choose it");
  if (!tool.inputSchema) say("no input schema");
  if (!tool.outputSchema) say("no output schema");
  if (typeof tool.annotations?.readOnlyHint !== "boolean") say("doesn't say whether it only reads (annotations.readOnlyHint)");
}
if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(`${tools.length} tools, all complete: ${tools.map((t) => t.name).join(", ")}`);
