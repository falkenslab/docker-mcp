// Bundles src/server.ts and every dependency into one file, dist/server.mjs (ADR-001): agent-kit runs
// it with `npx -y <package>@<version>` and never `npm install`. `--watch` rebuilds on change.
import * as esbuild from "esbuild";

const watch = process.argv.includes("--watch");

/** @type {import("esbuild").BuildOptions} */
const options = {
  entryPoints: ["src/server.ts"],
  outfile: "dist/server.mjs",
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  sourcemap: "linked",
  // CommonJS dependencies bundled into ESM call `require` for Node built-ins.
  banner: {
    js: ["#!/usr/bin/env node", 'import { createRequire as __createRequire } from "node:module";', "const require = __createRequire(import.meta.url);"].join("\n"),
  },
  logLevel: "info",
};

if (watch) await (await esbuild.context(options)).watch();
else await esbuild.build(options);
