#!/usr/bin/env -S npx tsx -r dotenv/config

import Watcher from "watcher";
import ignore from "ignore";
import { relative } from "node:path";
import { spawn, type ChildProcess } from "node:child_process";
import { pino } from "pino";

const logger = pino({
  transport: { target: "pino-pretty" },
});

let nodemonProcess: ChildProcess | null = null;

function startNodemon() {
  logger.info("Starting gateway with nodemon");
  nodemonProcess = spawn("npm", ["run", "dev"], {
    cwd: process.cwd(),
    env: process.env,
    stdio: ["inherit", "inherit", "inherit"],
  });

  nodemonProcess.on("exit", (code) => {
    logger.info("Nodemon exited with code %d", code ?? -1);
  });

  nodemonProcess.on("error", (error) => {
    logger.error({ err: error }, "Error running nodemon");
  });
}

const filter = ignore().add(["node_modules", "build", "dist", "coverage", ".git", "*.log", "*.md"]);

const watchers: Watcher[] = [];

logger.info("Watching src directory for changes");
const watcher = new Watcher("src", {
  renameDetection: false,
  ignore: (path: string) => {
    if (!path || !path.trim()) return true;
    const rel = relative(process.cwd(), path);
    return rel && filter.ignores(rel);
  },
  ignoreInitial: true,
  recursive: true,
});

watcher.on("all", (event, targetPath) => {
  logger.info({ event, path: targetPath }, "File change detected");
});

watchers.push(watcher);

startNodemon();

process.on("SIGINT", () => {
  logger.info("Shutting down watchers");
  for (const w of watchers) {
    w.close();
  }

  if (nodemonProcess) {
    nodemonProcess.kill("SIGTERM");
  }

  logger.info("Exiting");
  process.exit(0);
});

process.on("SIGTERM", () => {
  logger.info("Shutting down watchers");
  for (const w of watchers) {
    w.close();
  }

  if (nodemonProcess) {
    nodemonProcess.kill("SIGTERM");
  }

  logger.info("Exiting");
  process.exit(0);
});
