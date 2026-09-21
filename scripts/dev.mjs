#!/usr/bin/env node
/**
 * Dev launcher.
 *
 * 1. Kills any stale dev server this project left behind (same cwd only).
 * 2. Picks the first free port at or above BASE_PORT.
 * 3. Starts `next dev` on it.
 *
 * Why: a `next dev` that was backgrounded or suspended keeps holding port 3000
 * with the environment it booted with, so edits to .env silently do nothing and
 * the new server quietly lands on 3001. This makes the port deterministic.
 */
import { spawn, spawnSync } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE_PORT = Number(process.env.PORT ?? 3000);
const MAX_PORT = BASE_PORT + 20;

/** PIDs listening on a TCP port. */
function listenersOn(port) {
  const out = spawnSync("lsof", ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN", "-t"], {
    encoding: "utf8",
  });
  if (out.status !== 0 || !out.stdout.trim()) return [];
  return [...new Set(out.stdout.trim().split("\n").map(Number).filter(Boolean))];
}

/** Working directory of a PID, via lsof's cwd entry. */
function cwdOf(pid) {
  const out = spawnSync("lsof", ["-a", "-p", String(pid), "-d", "cwd", "-Fn"], {
    encoding: "utf8",
  });
  const line = out.stdout?.split("\n").find((l) => l.startsWith("n"));
  return line ? line.slice(1) : null;
}

function commandOf(pid) {
  const out = spawnSync("ps", ["-p", String(pid), "-o", "command="], { encoding: "utf8" });
  return out.stdout?.trim() ?? "";
}

function waitForExit(pid, deadlineMs) {
  const until = Date.now() + deadlineMs;
  while (Date.now() < until) {
    if (spawnSync("kill", ["-0", String(pid)]).status !== 0) return true;
    spawnSync("sleep", ["0.1"]);
  }
  return false;
}

/**
 * Kill stale dev servers belonging to THIS project.
 * Anything rooted in another directory is left alone and reported.
 */
function reclaimPorts() {
  const foreign = [];
  for (let port = BASE_PORT; port <= MAX_PORT; port += 1) {
    for (const pid of listenersOn(port)) {
      if (pid === process.pid) continue;
      const cwd = cwdOf(pid);
      const cmd = commandOf(pid);
      const ours = cwd === projectDir && /next|node/i.test(cmd);
      if (!ours) {
        foreign.push({ port, pid, cmd: cmd.slice(0, 60) });
        continue;
      }
      process.stdout.write(`↻ killing stale dev server on :${port} (pid ${pid})\n`);
      spawnSync("kill", ["-TERM", String(pid)]);
      if (!waitForExit(pid, 3000)) {
        process.stdout.write(`  pid ${pid} ignored SIGTERM, sending SIGKILL\n`);
        spawnSync("kill", ["-KILL", String(pid)]);
        waitForExit(pid, 2000);
      }
    }
  }
  for (const { port, pid, cmd } of foreign) {
    process.stdout.write(`· :${port} held by an unrelated process (pid ${pid}: ${cmd}) — left running\n`);
  }
}

function isFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => server.close(() => resolve(true)));
    server.listen(port, "0.0.0.0");
  });
}

async function firstFreePort() {
  for (let port = BASE_PORT; port <= MAX_PORT; port += 1) {
    if (await isFree(port)) return port;
  }
  throw new Error(`No free port between ${BASE_PORT} and ${MAX_PORT}`);
}

reclaimPorts();
const port = await firstFreePort();
if (port !== BASE_PORT) {
  process.stdout.write(`· :${BASE_PORT} unavailable, using :${port}\n`);
}

const child = spawn("next", ["dev", "--port", String(port)], {
  cwd: projectDir,
  stdio: "inherit",
  env: { ...process.env, PORT: String(port) },
  shell: false,
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}
child.on("exit", (code, signal) => {
  process.exit(signal ? 1 : (code ?? 0));
});
