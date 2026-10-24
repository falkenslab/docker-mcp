// What the Docker tools share: Docker checked before each call, ids validated, and lab mode's rule that
// only what docker-mcp created is touched.
import { z } from "zod";
import type { Config } from "../config.js";
import { docker, usingRealDocker } from "../docker.js";
import { needs } from "../requirements.js";

export const LABEL = "falkenslab.docker-mcp";

/** What a tool that asks the person (ADR-007) says in its description. */
export const ASKS = "The server asks the person to confirm it, naming what goes; if they say no, nothing is done.";

/** A container, image, volume or network as Docker names it: an id or a name, never an option. */
export const ref = (what: string) =>
  z
    .string()
    .min(1)
    .regex(/^[A-Za-z0-9][A-Za-z0-9_.:/@-]*$/, `a ${what}'s name or id, not an option`)
    .describe(`The ${what}'s name or id, as its list gives it`);

/** Docker is there and its version is enough; then the call. */
export async function withDocker<T>(work: () => Promise<T>): Promise<T> {
  if (usingRealDocker()) await needs("docker");
  return work();
}

/** In lab mode, refuses a container docker-mcp didn't create (it carries LABEL). */
export async function ownedInLab(config: Config, container: string): Promise<void> {
  if (config.mode !== "lab") return;
  const label = (await docker(["inspect", "--format", `{{ index .Config.Labels "${LABEL}" }}`, container])).trim();
  if (!label || label === "<no value>") throw new Error(`In lab mode only the labs' containers can be used, and ${container} isn't one of them. list_containers gives them.`);
}
