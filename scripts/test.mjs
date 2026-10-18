// Runs every test/**/*.test.ts with tsx and node:test, one file at a time. The files are listed here
// because Node 20's test runner doesn't expand glob patterns (Node 21 does).
//   node scripts/test.mjs [file…]      all the tests, or only the files given
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const find = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? find(path.join(dir, e.name)) : e.name.endsWith(".test.ts") ? [path.join(dir, e.name)] : []));
const files = process.argv.length > 2 ? process.argv.slice(2) : find("test").sort();
const tsx = createRequire(import.meta.url).resolve("tsx/cli");
const result = spawnSync(process.execPath, [tsx, "--test", "--test-concurrency=1", ...files], { stdio: "inherit" });
process.exit(result.status ?? 1);
