# Stack

- **Runtime**: Node.js 20 or later, ESM.
- **Language**: TypeScript (strict, `noUncheckedIndexedAccess`), typechecked with `tsc --noEmit`; esbuild compiles and bundles (`scripts/build.mjs`).
- **MCP**: `@modelcontextprotocol/sdk` (`McpServer`, stdio transport), with zod schemas.
- **Tests**: `node:test` run by tsx; the SDK's in-memory transport for the server.
- **Lint**: ESLint with typescript-eslint.
- **Docs**: Docusaurus 3, English and Spanish, published to GitHub Pages by `.github/workflows/docs.yml`.
- **Distribution**: npm (`@falkenslab/...`), run with `npx -y <package>@<exact version>`; dependencies are `devDependencies`, since they're inside the bundle.
- **Template**: made from [falkenslab/mcp-server-template](https://github.com/falkenslab/mcp-server-template) at [`2c3a4de`](https://github.com/falkenslab/mcp-server-template/commit/2c3a4de535644a031d193adf8ab4e00a025a756d); `git log 2c3a4de..main` there lists what came after.
