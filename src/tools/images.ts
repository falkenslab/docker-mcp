import { z } from "zod";
import { docker, dockerOutput, forModel, jsonLines } from "../docker.js";
import { reply } from "./reply.js";
import { ref, withDocker } from "./shared.js";
import { ALL_MODES, FULL, type ToolEntry } from "./types.js";

const image = ref("image");

export const IMAGE_TOOLS: ToolEntry[] = [
  {
    area: "images",
    modes: ALL_MODES,
    register: (server) =>
      server.registerTool(
        "list_images",
        {
          title: "List images",
          description: "List the local Docker images: id, repository, tag, size and when each was created.",
          inputSchema: { dangling: z.boolean().optional().describe("Only untagged images left by builds") },
          outputSchema: { images: z.array(z.object({ id: z.string(), repository: z.string(), tag: z.string(), size: z.string(), created: z.string() })) },
          annotations: { readOnlyHint: true, openWorldHint: false },
        },
        async ({ dangling }) =>
          withDocker(async () => {
            const rows = jsonLines<Record<string, string>>(await docker(["images", ...(dangling ? ["--filter", "dangling=true"] : []), "--format", "{{json .}}"]));
            return reply({ images: rows.map((r) => ({ id: r.ID ?? "", repository: r.Repository ?? "", tag: r.Tag ?? "", size: r.Size ?? "", created: r.CreatedSince ?? r.CreatedAt ?? "" })) });
          }),
      ),
  },
  {
    area: "images",
    modes: ALL_MODES,
    register: (server) =>
      server.registerTool(
        "inspect_image",
        {
          title: "Inspect an image",
          description: "An image's details: tags, size, architecture, the command and entry point it runs, its exposed ports, working directory, volumes and labels.",
          inputSchema: { image },
          outputSchema: {
            tags: z.array(z.string()),
            size: z.number(),
            architecture: z.string(),
            os: z.string(),
            command: z.array(z.string()),
            entrypoint: z.array(z.string()),
            exposedPorts: z.array(z.string()),
            workdir: z.string(),
            volumes: z.array(z.string()),
            labels: z.record(z.string(), z.string()),
          },
          annotations: { readOnlyHint: true, openWorldHint: false },
        },
        async ({ image: id }) =>
          withDocker(async () => {
            const [info] = JSON.parse(await docker(["image", "inspect", id])) as ImageInfo[];
            if (!info) throw new Error(`No image ${id}.`);
            const config = info.Config ?? {};
            return reply({
              tags: info.RepoTags ?? [],
              size: info.Size ?? 0,
              architecture: info.Architecture ?? "",
              os: info.Os ?? "",
              command: config.Cmd ?? [],
              entrypoint: config.Entrypoint ?? [],
              exposedPorts: Object.keys(config.ExposedPorts ?? {}),
              workdir: config.WorkingDir ?? "",
              volumes: Object.keys(config.Volumes ?? {}),
              labels: config.Labels ?? {},
            });
          }),
      ),
  },
  {
    area: "images",
    modes: FULL,
    register: (server) =>
      server.registerTool(
        "pull_image",
        {
          title: "Pull an image",
          description: "Download an image from its registry (Docker Hub unless it names another), e.g. postgres:17. Uses the network and disk: confirm with the person first.",
          inputSchema: { image: z.string().min(1).describe("The image, with its tag: nginx:1.27, ghcr.io/owner/name:tag") },
          outputSchema: { image: z.string(), output: z.string(), truncated: z.boolean() },
          annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
        },
        async ({ image: name }) =>
          withDocker(async () => {
            const out = await docker(["pull", "--quiet", name], { timeoutMs: 900_000 });
            return reply({ image: name, ...forModel(out) });
          }),
      ),
  },
  {
    area: "images",
    modes: FULL,
    register: (server) =>
      server.registerTool(
        "build_image",
        {
          title: "Build an image",
          description: "Build an image from a local folder with a Dockerfile, and tag it. Returns the build's output (its end when long). Uses the network and disk: confirm with the person first.",
          inputSchema: {
            context: z.string().min(1).describe("The build's folder (absolute path)"),
            tag: z.string().min(1).describe("The tag to give it, e.g. my-app:1.0"),
            dockerfile: z.string().optional().describe("The Dockerfile, when it isn't the context's Dockerfile"),
            buildArgs: z.record(z.string(), z.string()).optional(),
            noCache: z.boolean().default(false),
          },
          outputSchema: { tag: z.string(), exitCode: z.number().int(), output: z.string(), truncated: z.boolean() },
          annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
        },
        async ({ context, tag, dockerfile, buildArgs, noCache }) =>
          withDocker(async () => {
            const args = ["build", "-t", tag, "--progress", "plain", ...(dockerfile ? ["-f", dockerfile] : []), ...(noCache ? ["--no-cache"] : [])];
            for (const [key, value] of Object.entries(buildArgs ?? {})) args.push("--build-arg", `${key}=${value}`);
            const result = await dockerOutput([...args, context], { timeoutMs: 1_800_000 });
            return reply({ tag, exitCode: result.code, ...forModel(`${result.stdout}${result.stderr}`) });
          }),
      ),
  },
  {
    area: "images",
    modes: FULL,
    register: (server) =>
      server.registerTool(
        "tag_image",
        {
          title: "Tag an image",
          description: "Give an image another name and tag (the image itself isn't copied). Confirm with the person first.",
          inputSchema: { image, tag: z.string().min(1).describe("The new name:tag") },
          outputSchema: { image: z.string(), tag: z.string() },
          annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
        },
        async ({ image: id, tag }) =>
          withDocker(async () => {
            await docker(["tag", id, tag]);
            return reply({ image: id, tag });
          }),
      ),
  },
  {
    area: "images",
    modes: FULL,
    register: (server) =>
      server.registerTool(
        "remove_image",
        {
          title: "Remove an image",
          description: "Remove a local image (with force, even if a stopped container uses it). It has to be pulled or built again to be used: confirm with the person first, naming it.",
          inputSchema: { image, force: z.boolean().default(false) },
          outputSchema: { removed: z.string() },
          annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
        },
        async ({ image: id, force }) =>
          withDocker(async () => {
            await docker(["rmi", ...(force ? ["-f"] : []), id]);
            return reply({ removed: id });
          }),
      ),
  },
];

interface ImageInfo {
  RepoTags?: string[];
  Size?: number;
  Architecture?: string;
  Os?: string;
  Config?: { Cmd?: string[]; Entrypoint?: string[]; ExposedPorts?: Record<string, unknown>; WorkingDir?: string; Volumes?: Record<string, unknown>; Labels?: Record<string, string> };
}
