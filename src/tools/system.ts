import { z } from "zod";
import { docker, forModel, jsonLines } from "../docker.js";
import { reply } from "./reply.js";
import { withDocker } from "./shared.js";
import { ALL_MODES, FULL, type ToolEntry } from "./types.js";

export const SYSTEM_TOOLS: ToolEntry[] = [
  {
    area: "system",
    modes: ALL_MODES,
    register: (server) =>
      server.registerTool(
        "docker_info",
        {
          title: "Docker's information",
          description: "Docker's version, the engine's operating system and architecture, its CPUs and memory, and how many containers (running, stopped) and images there are. A first call to check Docker is up.",
          inputSchema: {},
          outputSchema: {
            clientVersion: z.string(),
            serverVersion: z.string(),
            os: z.string(),
            architecture: z.string(),
            cpus: z.number(),
            memory: z.number().describe("Bytes"),
            containers: z.object({ running: z.number(), paused: z.number(), stopped: z.number() }),
            images: z.number(),
          },
          annotations: { readOnlyHint: true, openWorldHint: false },
        },
        async () =>
          withDocker(async () => {
            const info = JSON.parse(await docker(["info", "--format", "{{json .}}"])) as DockerInfo;
            const version = JSON.parse(await docker(["version", "--format", "{{json .}}"])) as { Client?: { Version?: string }; Server?: { Version?: string } };
            return reply({
              clientVersion: version.Client?.Version ?? "",
              serverVersion: version.Server?.Version ?? info.ServerVersion ?? "",
              os: info.OperatingSystem ?? "",
              architecture: info.Architecture ?? "",
              cpus: info.NCPU ?? 0,
              memory: info.MemTotal ?? 0,
              containers: { running: info.ContainersRunning ?? 0, paused: info.ContainersPaused ?? 0, stopped: info.ContainersStopped ?? 0 },
              images: info.Images ?? 0,
            });
          }),
      ),
  },
  {
    area: "system",
    modes: ALL_MODES,
    register: (server) =>
      server.registerTool(
        "disk_usage",
        {
          title: "Docker's disk usage",
          description: "How much disk Docker uses for images, containers, volumes and the build cache, and how much of it could be reclaimed by prune.",
          inputSchema: {},
          outputSchema: { usage: z.array(z.object({ type: z.string(), total: z.string(), active: z.string(), size: z.string(), reclaimable: z.string() })) },
          annotations: { readOnlyHint: true, openWorldHint: false },
        },
        async () =>
          withDocker(async () => {
            const rows = jsonLines<Record<string, string>>(await docker(["system", "df", "--format", "{{json .}}"]));
            return reply({ usage: rows.map((r) => ({ type: r.Type ?? "", total: String(r.TotalCount ?? ""), active: String(r.Active ?? ""), size: r.Size ?? "", reclaimable: r.Reclaimable ?? "" })) });
          }),
      ),
  },
  {
    area: "system",
    modes: FULL,
    register: (server) =>
      server.registerTool(
        "prune",
        {
          title: "Clean up Docker",
          description:
            "Remove what isn't in use: stopped containers, dangling images (all unused ones with allImages), unused networks, unused volumes (only when volumes is true: their data is gone) and the build cache. Says how much space it freed. Can't be undone: confirm with the person first, naming what goes.",
          inputSchema: {
            what: z.enum(["containers", "images", "networks", "volumes", "build-cache", "everything"]).describe("everything: containers, networks, dangling images and build cache (volumes only with volumes: true)"),
            allImages: z.boolean().default(false).describe("Images: every unused one, not only the dangling ones"),
            volumes: z.boolean().default(false).describe("everything: also unused volumes and their data"),
          },
          outputSchema: { output: z.string(), truncated: z.boolean() },
          annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
        },
        async ({ what, allImages, volumes }) =>
          withDocker(async () => {
            const args =
              what === "everything"
                ? ["system", "prune", "-f", ...(allImages ? ["-a"] : []), ...(volumes ? ["--volumes"] : [])]
                : what === "build-cache"
                  ? ["builder", "prune", "-f"]
                  : [what.replace(/s$/, ""), "prune", "-f", ...(what === "images" && allImages ? ["-a"] : []), ...(what === "volumes" ? ["-a"] : [])];
            return reply(forModel(await docker(args, { timeoutMs: 600_000 })));
          }),
      ),
  },
];

interface DockerInfo {
  ServerVersion?: string;
  OperatingSystem?: string;
  Architecture?: string;
  NCPU?: number;
  MemTotal?: number;
  ContainersRunning?: number;
  ContainersPaused?: number;
  ContainersStopped?: number;
  Images?: number;
}
