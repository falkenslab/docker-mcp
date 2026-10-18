// What containers consume and run, from `docker stats --no-stream` and `docker top`: Docker's text turned into
// fields a model can compare.
import { jsonLines } from "./docker.js";

export interface ContainerStats {
  id: string;
  name: string;
  cpu: string;
  memoryUsage: string;
  memoryLimit: string;
  memoryPercent: string;
  networkReceived: string;
  networkSent: string;
  blockRead: string;
  blockWritten: string;
  processes: number;
}

/** "388KiB / 7.68GiB" → ["388KiB", "7.68GiB"]. */
const pair = (value: string | undefined): [string, string] => {
  const [first = "", second = ""] = (value ?? "").split("/").map((part) => part.trim());
  return [first, second];
};

/** `docker stats --no-stream --format '{{json .}}'`: one snapshot per container. */
export function parseStats(output: string): ContainerStats[] {
  return jsonLines<Record<string, string>>(output).map((row) => {
    const [memoryUsage, memoryLimit] = pair(row.MemUsage);
    const [networkReceived, networkSent] = pair(row.NetIO);
    const [blockRead, blockWritten] = pair(row.BlockIO);
    return {
      id: row.ID ?? "",
      name: row.Name ?? row.Container ?? "",
      cpu: row.CPUPerc ?? "",
      memoryUsage,
      memoryLimit,
      memoryPercent: row.MemPerc ?? "",
      networkReceived,
      networkSent,
      blockRead,
      blockWritten,
      processes: Number.parseInt(row.PIDs ?? "0", 10) || 0,
    };
  });
}

/** `docker top`: a table whose columns are split by spaces, the last one (the command) keeping its own. */
export function parseTop(output: string): { columns: string[]; processes: Record<string, string>[] } {
  const [header = "", ...lines] = output.split(/\r?\n/).filter((line) => line.trim());
  const columns = header.trim().split(/\s+/);
  const processes = lines.map((line) => {
    const parts = line.trim().split(/\s+/);
    const values = [...parts.slice(0, columns.length - 1), parts.slice(columns.length - 1).join(" ")];
    return Object.fromEntries(columns.map((column, i) => [column, values[i] ?? ""]));
  });
  return { columns, processes };
}
