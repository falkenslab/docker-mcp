// Inlined by esbuild into the bundle; read from the source tree under tsx.
import pkg from "../package.json" with { type: "json" };

export const PACKAGE_NAME: string = pkg.name;
export const PACKAGE_VERSION: string = pkg.version;
/** The command's name, as `bin` declares it: the data folder and the messages use it. */
export const COMMAND: string = Object.keys(pkg.bin)[0] ?? "mcp-server";
