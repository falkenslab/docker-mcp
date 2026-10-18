import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseStats, parseTop } from "../src/usage.js";

describe("resource usage", () => {
  it("splits docker stats' pairs into fields", () => {
    const [stats] = parseStats('{"BlockIO":"1.24MB / 0B","CPUPerc":"2.50%","Container":"web","ID":"09dc5dbb1856","MemPerc":"0.40%","MemUsage":"38MiB / 7.68GiB","Name":"web","NetIO":"1.17kB / 126B","PIDs":"3"}\n');
    assert.deepEqual(stats, {
      id: "09dc5dbb1856",
      name: "web",
      cpu: "2.50%",
      memoryUsage: "38MiB",
      memoryLimit: "7.68GiB",
      memoryPercent: "0.40%",
      networkReceived: "1.17kB",
      networkSent: "126B",
      blockRead: "1.24MB",
      blockWritten: "0B",
      processes: 3,
    });
  });

  it("reads docker top's table, keeping the spaces in each command", () => {
    const top = parseTop(
      "UID                 PID                 PPID                C                   STIME               TTY                 TIME                CMD\n" +
        "root                72988               72958               0                   14:42               ?                   00:00:00            nginx: master process nginx -g daemon off;\n" +
        "101                 73010               72988               0                   14:42               ?                   00:00:00            nginx: worker process\n",
    );
    assert.deepEqual(top.columns, ["UID", "PID", "PPID", "C", "STIME", "TTY", "TIME", "CMD"]);
    assert.equal(top.processes.length, 2);
    assert.equal(top.processes[0]?.CMD, "nginx: master process nginx -g daemon off;");
    assert.equal(top.processes[1]?.PID, "73010");
  });
});
