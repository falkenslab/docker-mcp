// Turns the template into a new server, once, right after "Use this template": its name everywhere
// (package, command, repository, site) and its one-line description.
//   npm run init -- <name> "<description>"      e.g. npm run init -- docker-lab-mcp "Hands-on practices in Docker, safe by default."
import { execFileSync } from "node:child_process";
import { appendFileSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const [name, description] = process.argv.slice(2);
if (!name || !/^[a-z][a-z0-9-]*$/.test(name) || !description) {
  console.error('Usage: npm run init -- <name> "<description>"   (name in kebab-case, e.g. docker-lab-mcp)');
  process.exit(2);
}
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OLD = "mcp-server-template";
const OLD_DESCRIPTION = "A Falken's Lab MCP server.";
const skip = new Set(["node_modules", ".git", "dist", "build", ".docusaurus"]);
const TEMPLATE = ["falkenslab", "mcp-server-template"].join("/"); // joined, so the renaming below leaves it alone

// The template's commit this server comes from, so its later fixes can be found (git log <commit>..main there).
// "Use this template" makes one commit with the template's tree and none of its history: the template's
// commit with the same tree is the one, else its latest is the best guess; without git or the network, none.
async function templateCommit() {
  try {
    const first = execFileSync("git", ["rev-list", "--max-parents=0", "HEAD"], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim().split("\n").pop();
    const tree = execFileSync("git", ["rev-parse", `${first}^{tree}`], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    const response = await fetch(`https://api.github.com/repos/${TEMPLATE}/commits?per_page=100`, { headers: { accept: "application/vnd.github+json" } });
    if (!response.ok) return undefined;
    const commits = await response.json();
    const same = commits.find((c) => c.commit.tree.sha === tree);
    return same ? { sha: same.sha, exact: true } : commits[0] && { sha: commits[0].sha, exact: false };
  } catch {
    return undefined;
  }
}
const from = await templateCommit();

let changed = 0;
const walk = (dir) => {
  for (const entry of readdirSync(dir)) {
    if (skip.has(entry)) continue;
    const file = path.join(dir, entry);
    if (statSync(file).isDirectory()) walk(file);
    else if (/\.(json|md|mdx|ts|tsx|mjs|js|yml|yaml|css|svg)$/.test(entry)) {
      const text = readFileSync(file, "utf8");
      const next = text.split(OLD_DESCRIPTION).join(description).split(OLD).join(name);
      if (next !== text) {
        writeFileSync(file, next);
        changed++;
      }
    }
  }
};
walk(root);
// The template is private so it can't be published by mistake; the new server is meant to be published.
const manifest = path.join(root, "package.json");
writeFileSync(manifest, readFileSync(manifest, "utf8").replace(/\n {2}"private": true,/, ""));
if (from) {
  const short = from.sha.slice(0, 7);
  appendFileSync(path.join(root, ".minispec/core/stack.md"), `- **Template**: made from [${TEMPLATE}](https://github.com/${TEMPLATE}) at [\`${short}\`](https://github.com/${TEMPLATE}/commit/${from.sha})${from.exact ? "" : " (its latest commit then; the exact one wasn't found)"}; \`git log ${short}..main\` there lists what came after.\n`);
  console.log(`From the template at ${short}${from.exact ? "" : " (approximately)"}: written in .minispec/core/stack.md.`);
} else console.log("The template's commit couldn't be found (no git or no network): add it to .minispec/core/stack.md by hand.");
console.log(`${changed} files now say ${name}. Next: npm install, then read CLAUDE.md, and remove scripts/init.mjs and the "init" script.`);
